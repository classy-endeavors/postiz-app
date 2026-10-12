import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Organization, User } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { UpgradesRepository } from '@gitroom/nestjs-libraries/database/prisma/upgrades/upgrades.repository';
import { NotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import {
  RequestUpgradeDto,
  ReviewUpgradeDto,
} from '@gitroom/nestjs-libraries/dtos/upgrades/upgrades.dto';

// Requests reuse the coin request Discord webhook and approval secret
@Injectable()
export class UpgradesService {
  constructor(
    private _upgradesRepository: UpgradesRepository,
    private _notificationService: NotificationService,
    private _subscriptionService: SubscriptionService,
    private _postsService: PostsService
  ) {}

  async getUpgrade(organizationId: string) {
    const [requests, subscription] = await Promise.all([
      this._upgradesRepository.getRequests(organizationId),
      this._subscriptionService.getSubscriptionByOrganizationId(organizationId),
    ]);

    return {
      canUpgrade:
        !subscription && !requests.some((r) => r.status === 'approved'),
      requests,
    };
  }

  // Signs the request and the action, so a decline link can't approve
  private reviewCode(requestId: string, organizationId: string, action: string) {
    return createHmac('sha256', process.env.ZYNTRA_COINS_APPROVAL_CODE!)
      .update(`upgrade:${requestId}:${organizationId}:${action}`)
      .digest('hex');
  }

  private reviewUrl(
    requestId: string,
    organizationId: string,
    action: ReviewUpgradeDto['action']
  ) {
    if (!process.env.ZYNTRA_COINS_APPROVAL_CODE) {
      return '';
    }

    const params = new URLSearchParams({
      requestId,
      action,
      code: this.reviewCode(requestId, organizationId, action),
    });

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/public/upgrade/review?${params}`;
  }

  async reviewRequest(query: ReviewUpgradeDto) {
    if (!process.env.ZYNTRA_COINS_APPROVAL_CODE) {
      throw new HttpException('Upgrade reviews are not available', 503);
    }

    const request = await this._upgradesRepository.getRequest(query.requestId);
    if (!request) {
      throw new HttpException('Upgrade request not found', 404);
    }

    const expected = Buffer.from(
      this.reviewCode(request.id, request.organizationId, query.action)
    );
    const received = Buffer.from(query.code);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new HttpException('Invalid review code', 403);
    }

    if (request.status !== 'pending') {
      return `This upgrade request was already ${request.status}.`;
    }

    const approved = query.action === 'approve';
    const { count } = await this._upgradesRepository.reviewRequest(
      request.id,
      approved ? 'approved' : 'declined'
    );
    if (!count) {
      return 'This upgrade request was already reviewed.';
    }

    await this._notificationService.inAppNotification(
      request.organizationId,
      approved ? 'Upgrade request approved' : 'Upgrade request declined',
      approved
        ? 'Your upgrade request was approved, the AI Zyntra team will contact you to finish setting up your plan'
        : 'Your upgrade request was declined, you can send a new request from the Calendar page any time'
    );

    return approved
      ? 'Upgrade request approved, the user was notified.'
      : 'Upgrade request declined, the user was notified.';
  }

  async requestUpgrade(org: Organization, user: User, body: RequestUpgradeDto) {
    if (!process.env.ZYNTRA_COINS_DISCORD_WEBHOOK) {
      Logger.warn(
        'ZYNTRA_COINS_DISCORD_WEBHOOK is not set, upgrade requests are not delivered'
      );
      throw new HttpException('Upgrade requests are not available right now', 503);
    }

    if (!(await ioRedis.set(`upgradeRequest:${org.id}`, '1', 'EX', 60, 'NX'))) {
      throw new HttpException('Your request is already being sent', 429);
    }

    const upgrade = await this.getUpgrade(org.id);
    if (!upgrade.canUpgrade) {
      throw new HttpException('Your account is already upgraded', 400);
    }

    if (upgrade.requests.some((r) => r.status === 'pending')) {
      throw new HttpException(
        'You already have an upgrade request waiting for review, we will get back to you soon',
        429
      );
    }

    const message = (body.message || '').trim();
    const { id } = await this._upgradesRepository.createRequest(
      org.id,
      user.id,
      message || undefined
    );
    const savings = await this._postsService.getSavings(org.id);
    const approveUrl = this.reviewUrl(id, org.id, 'approve');
    const declineUrl = this.reviewUrl(id, org.id, 'decline');

    const response = await fetch(process.env.ZYNTRA_COINS_DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Zyntra Upgrades',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: 'Account upgrade requested',
            color: 0xff5a2c,
            fields: [
              { name: 'User', value: user.email || '-', inline: true },
              { name: 'Organization', value: org.name || '-', inline: true },
              {
                name: 'Saved with AI Zyntra',
                value: `$${savings.dollars.toLocaleString()} (${Math.round(
                  savings.minutes / 60
                )}h, ${savings.posts} posts)`,
                inline: true,
              },
              { name: 'Organization ID', value: org.id },
              ...(message ? [{ name: 'Message', value: message }] : []),
              ...(approveUrl
                ? [
                    { name: 'Approve (open once)', value: approveUrl },
                    { name: 'Decline (open once)', value: declineUrl },
                  ]
                : []),
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }).catch((err) => {
      Logger.error(`Upgrade request webhook failed: ${err}`);
      return undefined;
    });

    if (!response?.ok) {
      await this._upgradesRepository.removeRequest(org.id, id);
      await ioRedis.del(`upgradeRequest:${org.id}`);
      if (response) {
        Logger.error(
          `Upgrade request webhook failed with ${response.status}: ${await response.text()}`
        );
      }
      throw new HttpException('Could not send the request, please try again', 502);
    }

    return { sent: true };
  }
}
