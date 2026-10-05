import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Organization, User } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { CoinsRepository } from '@gitroom/nestjs-libraries/database/prisma/coins/coins.repository';
import {
  CoinsHistoryDto,
  RequestCoinsDto,
} from '@gitroom/nestjs-libraries/dtos/coins/coins.dto';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';

dayjs.extend(utc);

export const MONTHLY_COINS = 100;
export const COIN_COSTS = {
  message: 1,
  image: 5,
  post: 2,
};
export type CoinAction = keyof typeof COIN_COSTS;

const DESCRIPTIONS: Record<CoinAction, string> = {
  message: 'AI agent message',
  image: 'AI image generation',
  post: 'Post scheduled',
};

@Injectable()
export class CoinsService {
  constructor(private _coinsRepository: CoinsRepository) {}

  // Every month that started since the last grant gets its own row, keyed by
  // the month, so unused coins carry forward and a grant is never doubled
  private async grantMonthlyCoins(organizationId: string) {
    const last = await this._coinsRepository.getLastTransaction(
      organizationId,
      'monthly_grant'
    );
    const currentMonth = dayjs.utc().startOf('month');
    let month = last
      ? dayjs.utc(last.createdAt).startOf('month').add(1, 'month')
      : currentMonth;

    while (!month.isAfter(currentMonth)) {
      await this._coinsRepository.addTransactionOnce(
        `grant-${organizationId}-${month.format('YYYY-MM')}`,
        organizationId,
        MONTHLY_COINS,
        'monthly_grant',
        `Monthly coins for ${month.format('MMMM YYYY')}`,
        month.toDate()
      );
      month = month.add(1, 'month');
    }
  }

  async getBalance(organizationId: string) {
    await this.grantMonthlyCoins(organizationId);
    return this._coinsRepository.getBalance(organizationId);
  }

  async getCoins(organizationId: string) {
    return {
      balance: await this.getBalance(organizationId),
      monthly: MONTHLY_COINS,
      costs: COIN_COSTS,
      thisMonth: await this._coinsRepository.getTotalsSince(
        organizationId,
        dayjs.utc().startOf('month').toDate()
      ),
    };
  }

  async getHistory(organizationId: string, query: CoinsHistoryDto) {
    const page = query.page || 0;
    const filter = query.filter || 'all';
    const limit = 20;

    const balance = await this.getBalance(organizationId);
    const { transactions, total } =
      await this._coinsRepository.getTransactions(
        organizationId,
        page,
        limit,
        filter
      );

    // The balance after each row only adds up when every row is listed
    let balanceAfter =
      filter === 'all'
        ? balance -
          (await this._coinsRepository.getNewestTotal(
            organizationId,
            page * limit
          ))
        : null;

    return {
      transactions: transactions.map((transaction) => {
        const row = { ...transaction, balanceAfter };
        if (balanceAfter !== null) {
          balanceAfter -= transaction.amount;
        }
        return row;
      }),
      total,
      page,
      limit,
      hasMore: (page + 1) * limit < total,
    };
  }

  checkCoins(organizationId: string, action: CoinAction, times = 1) {
    return this.checkBalance(organizationId, COIN_COSTS[action] * times);
  }

  private async checkBalance(organizationId: string, needed: number) {
    const balance = await this.getBalance(organizationId);
    if (balance < needed) {
      throw new HttpException(
        {
          coins: true,
          message: `You need ${needed} Zyntra Coins for this but have ${balance}. Request more coins from the Coins page.`,
        },
        402
      );
    }
  }

  // Charges before the work runs and refunds when it throws, like useCredit.
  // The detail (the prompt) is what the history shows instead of the generic label
  async spend<T>(
    organizationId: string,
    action: CoinAction,
    func: () => Promise<T>,
    detail?: string
  ): Promise<T> {
    await this.checkBalance(organizationId, COIN_COSTS[action]);
    const text = (detail || '').replace(/\s+/g, ' ').trim();
    const { id } = await this._coinsRepository.addTransaction(
      organizationId,
      -COIN_COSTS[action],
      action,
      !text
        ? DESCRIPTIONS[action]
        : text.length > 300
        ? `${text.slice(0, 300)}…`
        : text
    );

    try {
      return await func();
    } catch (err) {
      await this._coinsRepository.removeTransaction(organizationId, id);
      throw err;
    }
  }

  // Keyed by the post, so a retried save never charges the same post twice
  chargePost(organizationId: string, postId: string, channel?: string) {
    return this._coinsRepository.addTransactionOnce(
      `post-${postId}`,
      organizationId,
      -COIN_COSTS.post,
      'post',
      channel ? `${DESCRIPTIONS.post} on ${channel}` : DESCRIPTIONS.post
    );
  }

  grantCoins(organizationId: string, amount: number, description?: string) {
    return this._coinsRepository.addTransaction(
      organizationId,
      amount,
      'admin_grant',
      description || 'Coins added by the AI Zyntra team'
    );
  }

  async requestCoins(org: Organization, user: User, body: RequestCoinsDto) {
    if (!process.env.ZYNTRA_COINS_DISCORD_WEBHOOK) {
      Logger.warn('ZYNTRA_COINS_DISCORD_WEBHOOK is not set, coin requests are not delivered');
      throw new HttpException('Coin requests are not available right now', 503);
    }

    if (!(await ioRedis.set(`coinsRequest:${org.id}`, '1', 'EX', 600, 'NX'))) {
      throw new HttpException(
        'You already sent a request in the last 10 minutes, we will get back to you soon',
        429
      );
    }

    const balance = await this.getBalance(org.id);
    const response = await fetch(process.env.ZYNTRA_COINS_DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Zyntra Coins',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: `${body.amount} Zyntra Coins requested`,
            color: 0xff5a2c,
            fields: [
              { name: 'User', value: user.email || '-', inline: true },
              { name: 'Organization', value: org.name || '-', inline: true },
              { name: 'Current balance', value: String(balance), inline: true },
              { name: 'Organization ID', value: org.id },
              ...(body.message
                ? [{ name: 'Message', value: body.message }]
                : []),
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      await ioRedis.del(`coinsRequest:${org.id}`);
      Logger.error(
        `Coin request webhook failed with ${response.status}: ${await response.text()}`
      );
      throw new HttpException('Could not send the request, please try again', 502);
    }

    return { sent: true };
  }
}
