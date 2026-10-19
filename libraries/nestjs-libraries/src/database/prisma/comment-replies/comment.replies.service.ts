import { HttpException, Injectable } from '@nestjs/common';
import { Integration } from '@prisma/client';
import { CommentRepliesRepository } from '@gitroom/nestjs-libraries/database/prisma/comment-replies/comment.replies.repository';
import { ReplyProfileDto } from '@gitroom/nestjs-libraries/dtos/comment-replies/reply.profile.dto';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { CoinsService } from '@gitroom/nestjs-libraries/database/prisma/coins/coins.service';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { RefreshIntegrationService } from '@gitroom/nestjs-libraries/integrations/refresh.integration.service';
import { NotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service';
import {
  BadBody,
  RefreshToken,
} from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { YoutubeProvider } from '@gitroom/nestjs-libraries/integrations/social/youtube.provider';
import { InstagramProvider } from '@gitroom/nestjs-libraries/integrations/social/instagram.provider';
import { InstagramStandaloneProvider } from '@gitroom/nestjs-libraries/integrations/social/instagram.standalone.provider';

const plain = (value?: string | null) =>
  (value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

@Injectable()
export class CommentRepliesService {
  constructor(
    private _repository: CommentRepliesRepository,
    private _openaiService: OpenaiService,
    private _coinsService: CoinsService,
    private _integrationManager: IntegrationManager,
    private _refreshIntegrationService: RefreshIntegrationService,
    private _notificationService: NotificationService
  ) {}

  async getProfile(organizationId: string) {
    const profile = await this._repository.getProfile(organizationId);
    return (
      profile || {
        enabled: false,
        website: '',
        fullVideoUrl: '',
        notes: '',
      }
    );
  }

  saveProfile(organizationId: string, body: ReplyProfileDto) {
    return this._repository.saveProfile(organizationId, {
      enabled: !!body.enabled,
      website: (body.website || '').trim(),
      fullVideoUrl: (body.fullVideoUrl || '').trim(),
      notes: (body.notes || '').trim(),
    });
  }

  // Meta sends this the moment someone comments. Reply to top-level comments
  // on posts this app published, and ignore replies so the account cannot
  // answer itself in a loop.
  async handleInstagramWebhook(payload: any) {
    if (payload?.object !== 'instagram') {
      return;
    }
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'comments') {
          continue;
        }
        const value = change.value || {};
        if (value.parent_id || !value.id || !value.text || !value.media?.id) {
          continue;
        }
        if (value.from?.id && value.from.id === entry.id) {
          continue;
        }
        const integration = await this._repository.findIntegration(entry.id, [
          'instagram',
          'instagram-standalone',
        ]);
        if (!integration) {
          continue;
        }
        await this.answer(integration, {
          commentId: String(value.id),
          text: String(value.text),
          releaseId: String(value.media.id),
        });
      }
    }
  }

  async pollYoutube() {
    const channels = await this._repository.enabledYoutubeChannels();
    for (const integration of channels) {
      try {
        await this.pollChannel(integration);
      } catch (err) {
        console.error('youtube comment poll failed', integration.id, err);
      }
    }
  }

  private async pollChannel(integration: Integration) {
    const posts = await this._repository.recentPosts(
      integration.organizationId,
      integration.id
    );
    const provider = this._integrationManager.getSocialIntegration(
      'youtube'
    ) as YoutubeProvider;

    for (const post of posts) {
      if (!post.releaseId) {
        continue;
      }
      let comments: Awaited<ReturnType<YoutubeProvider['listRecentComments']>>;
      try {
        comments = await this.withRefresh(integration, (token) =>
          provider.listRecentComments(token, post.releaseId!)
        );
      } catch (err) {
        console.error('youtube comments list failed', post.releaseId, err);
        continue;
      }
      for (const comment of comments) {
        if (comment.authorChannelId === integration.internalId) {
          continue;
        }
        await this.answer(integration, {
          commentId: comment.id,
          text: comment.text,
          releaseId: post.releaseId,
        });
      }
    }
  }

  private async answer(
    integration: Integration,
    incoming: { commentId: string; text: string; releaseId: string }
  ) {
    const claimed = await this._repository.claim(
      integration.organizationId,
      integration.id,
      incoming.commentId,
      incoming.text
    );
    if (!claimed) {
      return;
    }

    try {
      const profile = await this._repository.getProfile(integration.organizationId);
      if (!profile?.enabled) {
        await this._repository.finish(
          integration.id,
          incoming.commentId,
          'skipped'
        );
        return;
      }

      const post = await this._repository.findPost(
        integration.organizationId,
        integration.id,
        incoming.releaseId
      );
      const postText = plain(post?.content).slice(0, 1000);
      const hasFacts =
        !!profile.website ||
        !!profile.fullVideoUrl ||
        !!profile.notes ||
        !!post?.releaseURL ||
        !!postText;
      if (!hasFacts) {
        await this._repository.finish(
          integration.id,
          incoming.commentId,
          'skipped'
        );
        return;
      }

      await this._coinsService.checkCoins(integration.organizationId, 'reply');
      const examples = await this._repository.recentReplies(
        integration.organizationId
      );
      const reply = await this._openaiService.commentReply({
        comment: incoming.text.slice(0, 1000),
        website: profile.website,
        fullVideoUrl: profile.fullVideoUrl,
        notes: profile.notes,
        postTitle: post?.title,
        postText,
        postUrl: post?.releaseURL,
        examples: examples
          .filter((item) => item.reply)
          .map((item) => ({ comment: item.text, reply: item.reply! })),
      });
      if (!reply) {
        await this._repository.finish(
          integration.id,
          incoming.commentId,
          'skipped'
        );
        return;
      }

      await this.send(integration, incoming.commentId, reply);
      await this._coinsService
        .chargeReply(
          integration.organizationId,
          incoming.commentId,
          integration.name
        )
        .catch((err) => console.error('comment reply charge failed', err));
      await this._repository.finish(
        integration.id,
        incoming.commentId,
        'replied',
        reply
      );
    } catch (err) {
      const response =
        err instanceof HttpException ? err.getResponse() : undefined;
      if (
        response &&
        typeof response === 'object' &&
        'coins' in response
      ) {
        await this._repository
          .release(integration.id, incoming.commentId)
          .catch(() => undefined);
        return;
      }
      const message =
        err instanceof BadBody && err.message
          ? err.message
          : 'Could not reply to this comment';
      await this._repository
        .finish(integration.id, incoming.commentId, 'failed', undefined, message)
        .catch(() => undefined);
      await this._notificationService
        .inAppNotification(
          integration.organizationId,
          `Could not reply on ${integration.name}`,
          message,
          false,
          false,
          'fail'
        )
        .catch(() => undefined);
    }
  }

  private async send(integration: Integration, commentId: string, reply: string) {
    if (integration.providerIdentifier === 'youtube') {
      const provider = this._integrationManager.getSocialIntegration(
        'youtube'
      ) as YoutubeProvider;
      await this.withRefresh(integration, (token) =>
        provider.replyToComment(token, commentId, reply)
      );
      return;
    }

    const provider = this._integrationManager.getSocialIntegration(
      integration.providerIdentifier
    ) as InstagramProvider | InstagramStandaloneProvider;
    await this.withRefresh(integration, (token) =>
      provider.replyToComment(token, commentId, reply)
    );
  }

  private async withRefresh<T>(
    integration: Integration,
    run: (token: string) => Promise<T>
  ) {
    try {
      return await run(integration.token);
    } catch (err) {
      if (!(err instanceof RefreshToken)) {
        throw err;
      }
      const refreshed = await this._refreshIntegrationService.refresh(integration);
      if (!refreshed || !refreshed.accessToken) {
        throw err;
      }
      integration.token = refreshed.accessToken;
      return run(integration.token);
    }
  }
}
