import { HttpException, Injectable } from '@nestjs/common';
import { Integration } from '@prisma/client';
import { CommentRepliesRepository } from '@gitroom/nestjs-libraries/database/prisma/comment-replies/comment.replies.repository';
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

  async listPosts(organizationId: string) {
    const [posts, links] = await Promise.all([
      this._repository.listPublished(organizationId),
      this._repository.listLinks(organizationId),
    ]);
    const byId = new Map(posts.map((post) => [post.id, post]));
    const related = new Map<string, string[]>();
    for (const link of links) {
      const add = (from: string, to: string) => {
        if (!byId.has(from) || !byId.has(to)) {
          return;
        }
        const list = related.get(from) || [];
        if (!list.includes(to)) {
          list.push(to);
        }
        related.set(from, list);
      };
      add(link.postId, link.relatedPostId);
      add(link.relatedPostId, link.postId);
    }
    return posts.map((post) => ({
      id: post.id,
      title: plain(post.title || post.content).slice(0, 140),
      releaseURL: post.releaseURL || '',
      publishDate: post.publishDate,
      channel: post.integration?.name || '',
      provider: post.integration?.providerIdentifier || '',
      enabled: !!post.replySetting?.enabled,
      links: (related.get(post.id) || []).map((id) => ({
        id,
        title: plain(byId.get(id)?.title || byId.get(id)?.content).slice(0, 140),
        releaseURL: byId.get(id)?.releaseURL || '',
        channel: byId.get(id)?.integration?.name || '',
      })),
    }));
  }

  async setEnabled(organizationId: string, ids: string[], enabled: boolean) {
    const updated = await this._repository.setEnabled(
      organizationId,
      ids.slice(0, 300),
      enabled
    );
    return { updated };
  }

  replaceLinks(organizationId: string, postIds: string[], relatedIds: string[]) {
    return this._repository.replaceLinks(
      organizationId,
      postIds.slice(0, 50),
      relatedIds.slice(0, 50)
    );
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
    const posts = await this._repository.enabledYoutubePosts();
    const channels = new Map<string, { integration: Integration; posts: typeof posts }>();
    for (const post of posts) {
      const current = channels.get(post.integrationId);
      if (current) {
        current.posts.push(post);
      } else {
        channels.set(post.integrationId, {
          integration: post.integration,
          posts: [post],
        });
      }
    }
    for (const channel of channels.values()) {
      try {
        await this.pollChannel(channel.integration, channel.posts);
      } catch (err) {
        console.error('youtube comment poll failed', channel.integration.id, err);
      }
    }
  }

  private async pollChannel(
    integration: Integration,
    posts: { releaseId: string | null }[]
  ) {
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
      const post = await this._repository.findPost(
        integration.organizationId,
        integration.id,
        incoming.releaseId
      );
      if (!post?.replySetting?.enabled) {
        await this._repository.finish(
          integration.id,
          incoming.commentId,
          'skipped'
        );
        return;
      }

      const postText = plain(post.content).slice(0, 1000);
      const linkedRows = await this._repository.linksFor(
        integration.organizationId,
        post.id
      );
      const linked = linkedRows
        .map((row) => (row.postId === post.id ? row.relatedPost : row.post))
        .filter((item) => item.id !== post.id)
        .map((item) => ({
          title: plain(item.title || item.content).slice(0, 160),
          url: item.releaseURL || '',
          channel: item.integration?.name || '',
        }));
      if (!postText && !post.releaseURL && !linked.length) {
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
        postTitle: post.title,
        postText,
        postUrl: post.releaseURL,
        linked,
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
