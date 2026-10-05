import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CoinsHistoryFilter } from '@gitroom/nestjs-libraries/dtos/coins/coins.dto';

@Injectable()
export class CoinsRepository {
  constructor(private _coins: PrismaRepository<'coinTransaction'>) {}

  async getBalance(organizationId: string) {
    const load = await this._coins.model.coinTransaction.aggregate({
      where: {
        organizationId,
      },
      _sum: {
        amount: true,
      },
    });

    return load._sum.amount || 0;
  }

  getLastTransaction(organizationId: string, type: string) {
    return this._coins.model.coinTransaction.findFirst({
      where: {
        organizationId,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });
  }

  private get historyOrder() {
    return [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
  }

  async getTransactions(
    organizationId: string,
    page: number,
    limit: number,
    filter: CoinsHistoryFilter
  ) {
    const where = {
      organizationId,
      ...(filter === 'spent'
        ? { amount: { lt: 0 } }
        : filter === 'added'
        ? { amount: { gt: 0 } }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      this._coins.model.coinTransaction.findMany({
        where,
        orderBy: this.historyOrder,
        skip: page * limit,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      }),
      this._coins.model.coinTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  // Sum of the newest `take` transactions, what changed after a history page
  async getNewestTotal(organizationId: string, take: number) {
    if (!take) {
      return 0;
    }

    const load = await this._coins.model.coinTransaction.aggregate({
      where: {
        organizationId,
      },
      orderBy: this.historyOrder,
      take,
      _sum: {
        amount: true,
      },
    });

    return load._sum.amount || 0;
  }

  async getTotalsSince(organizationId: string, since: Date) {
    const [spent, added] = await Promise.all([
      this._coins.model.coinTransaction.aggregate({
        where: { organizationId, createdAt: { gte: since }, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      this._coins.model.coinTransaction.aggregate({
        where: { organizationId, createdAt: { gte: since }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);

    return {
      spent: -(spent._sum.amount || 0),
      added: added._sum.amount || 0,
    };
  }

  addTransaction(
    organizationId: string,
    amount: number,
    type: string,
    description?: string
  ) {
    return this._coins.model.coinTransaction.create({
      data: {
        organizationId,
        amount,
        type,
        description,
      },
      select: {
        id: true,
      },
    });
  }

  // The caller picks the id, so recording the same thing twice is one row
  addTransactionOnce(
    id: string,
    organizationId: string,
    amount: number,
    type: string,
    description?: string,
    createdAt?: Date
  ) {
    return this._coins.model.coinTransaction.upsert({
      where: {
        id,
      },
      create: {
        id,
        organizationId,
        amount,
        type,
        description,
        ...(createdAt ? { createdAt } : {}),
      },
      update: {},
      select: {
        id: true,
      },
    });
  }

  removeTransaction(organizationId: string, id: string) {
    return this._coins.model.coinTransaction.deleteMany({
      where: {
        id,
        organizationId,
      },
    });
  }
}
