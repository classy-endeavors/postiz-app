import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentRepliesRepository {
  constructor(
    private _setting: PrismaRepository<'postReplySetting'>,
    private _link: PrismaRepository<'contentLink'>,
    private _reply: PrismaRepository<'commentReply'>,
    private _integration: PrismaRepository<'integration'>,
    private _post: PrismaRepository<'post'>
  ) {}

  listPublished(organizationId: string) {
    return this._post.model.post.findMany({
      where: {
        organizationId,
        deletedAt: null,
        parentPostId: null,
        state: 'PUBLISHED',
        releaseId: {
          not: null,
        },
      },
      orderBy: {
        publishDate: 'desc',
      },
      take: 300,
      select: {
        id: true,
        title: true,
        content: true,
        releaseURL: true,
        publishDate: true,
        integration: {
          select: {
            id: true,
            name: true,
            providerIdentifier: true,
          },
        },
        replySetting: {
          select: {
            enabled: true,
          },
        },
      },
    });
  }

  listLinks(organizationId: string) {
    return this._link.model.contentLink.findMany({
      where: {
        organizationId,
      },
      select: {
        postId: true,
        relatedPostId: true,
      },
    });
  }

  async setEnabled(organizationId: string, ids: string[], enabled: boolean) {
    const posts = await this._post.model.post.findMany({
      where: {
        organizationId,
        id: {
          in: ids,
        },
        deletedAt: null,
        state: 'PUBLISHED',
      },
      select: {
        id: true,
      },
    });
    for (const post of posts) {
      await this._setting.model.postReplySetting.upsert({
        where: {
          postId: post.id,
        },
        create: {
          postId: post.id,
          organizationId,
          enabled,
        },
        update: {
          enabled,
        },
        select: {
          postId: true,
        },
      });
    }
    return posts.length;
  }

  async replaceLinks(
    organizationId: string,
    postIds: string[],
    relatedIds: string[]
  ) {
    const owned = await this._post.model.post.findMany({
      where: {
        organizationId,
        id: {
          in: [...postIds, ...relatedIds],
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    const allowed = new Set(owned.map((post) => post.id));
    const sources = postIds.filter((id) => allowed.has(id));
    const targets = [...new Set(relatedIds.filter((id) => allowed.has(id)))];
    if (!sources.length) {
      return;
    }
    await this._link.model.contentLink.deleteMany({
      where: {
        organizationId,
        OR: [
          {
            postId: {
              in: sources,
            },
          },
          {
            relatedPostId: {
              in: sources,
            },
          },
        ],
      },
    });
    const data = sources.flatMap((source) =>
      targets
        .filter((target) => target !== source && !sources.includes(target))
        .map((target) => ({
          organizationId,
          postId: source,
          relatedPostId: target,
        }))
    );
    if (data.length) {
      await this._link.model.contentLink.createMany({
        data,
      });
    }
  }

  findIntegration(internalId: string, providers: string[]) {
    return this._integration.model.integration.findFirst({
      where: {
        internalId,
        providerIdentifier: {
          in: providers,
        },
        deletedAt: null,
        disabled: false,
        refreshNeeded: false,
        inBetweenSteps: false,
      },
    });
  }

  enabledYoutubePosts() {
    return this._post.model.post.findMany({
      where: {
        deletedAt: null,
        parentPostId: null,
        state: 'PUBLISHED',
        releaseId: {
          not: null,
        },
        replySetting: {
          enabled: true,
        },
        integration: {
          providerIdentifier: 'youtube',
          deletedAt: null,
          disabled: false,
          refreshNeeded: false,
          inBetweenSteps: false,
        },
      },
      orderBy: {
        publishDate: 'desc',
      },
      take: 50,
      include: {
        integration: true,
      },
    });
  }

  findPost(organizationId: string, integrationId: string, releaseId: string) {
    return this._post.model.post.findFirst({
      where: {
        organizationId,
        integrationId,
        releaseId,
        deletedAt: null,
        parentPostId: null,
      },
      select: {
        id: true,
        title: true,
        content: true,
        releaseURL: true,
        replySetting: {
          select: {
            enabled: true,
          },
        },
      },
    });
  }

  // Facebook feed webhooks send `{pageId}_{storyPostId}` for reel comments.
  // Video publish may store the bare video id (or `{pageId}_{storyPostId}` on
  // newer publishes). Match exact id or either side's trailing id so
  // auto-replies still find the published post. Callers may also resolve
  // video↔story via Graph before calling this.
  async findFacebookPost(
    organizationId: string,
    integrationId: string,
    postId: string
  ) {
    const exact = await this.findPost(organizationId, integrationId, postId);
    if (exact) {
      return exact;
    }
    const storyId = postId.includes('_') ? postId.split('_').pop()! : postId;
    if (!storyId || storyId === postId) {
      return null;
    }
    return this._post.model.post.findFirst({
      where: {
        organizationId,
        integrationId,
        deletedAt: null,
        parentPostId: null,
        OR: [
          { releaseId: storyId },
          { releaseId: { endsWith: `_${storyId}` } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        releaseURL: true,
        replySetting: {
          select: {
            enabled: true,
          },
        },
      },
    });
  }

  linksFor(organizationId: string, postId: string) {
    return this._link.model.contentLink.findMany({
      where: {
        organizationId,
        OR: [
          {
            postId,
          },
          {
            relatedPostId: postId,
          },
        ],
      },
      select: {
        postId: true,
        relatedPostId: true,
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            releaseURL: true,
            integration: {
              select: {
                name: true,
              },
            },
          },
        },
        relatedPost: {
          select: {
            id: true,
            title: true,
            content: true,
            releaseURL: true,
            integration: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  recentReplies(organizationId: string) {
    return this._reply.model.commentReply.findMany({
      where: {
        organizationId,
        status: 'replied',
        reply: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        text: true,
        reply: true,
      },
    });
  }

  // False when this comment was already seen
  async claim(organizationId: string, integrationId: string, commentId: string, text: string) {
    try {
      await this._reply.model.commentReply.create({
        data: {
          organizationId,
          integrationId,
          platformCommentId: commentId,
          text: text.slice(0, 2000),
          status: 'pending',
        },
        select: {
          id: true,
        },
      });
      return true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return false;
      }
      throw err;
    }
  }

  release(integrationId: string, commentId: string) {
    return this._reply.model.commentReply.deleteMany({
      where: {
        integrationId,
        platformCommentId: commentId,
        status: 'pending',
      },
    });
  }

  finish(
    integrationId: string,
    commentId: string,
    status: 'replied' | 'skipped' | 'failed',
    reply?: string,
    error?: string
  ) {
    return this._reply.model.commentReply.update({
      where: {
        integrationId_platformCommentId: {
          integrationId,
          platformCommentId: commentId,
        },
      },
      data: {
        status,
        ...(reply ? { reply: reply.slice(0, 500) } : {}),
        ...(error ? { error: error.slice(0, 500) } : {}),
      },
      select: {
        id: true,
      },
    });
  }
}
