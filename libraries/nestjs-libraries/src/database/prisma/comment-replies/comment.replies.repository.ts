import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentRepliesRepository {
  constructor(
    private _profile: PrismaRepository<'replyProfile'>,
    private _reply: PrismaRepository<'commentReply'>,
    private _integration: PrismaRepository<'integration'>,
    private _post: PrismaRepository<'post'>
  ) {}

  getProfile(organizationId: string) {
    return this._profile.model.replyProfile.findUnique({
      where: {
        organizationId,
      },
      select: {
        enabled: true,
        website: true,
        fullVideoUrl: true,
        notes: true,
      },
    });
  }

  saveProfile(
    organizationId: string,
    data: {
      enabled: boolean;
      website: string;
      fullVideoUrl: string;
      notes: string;
    }
  ) {
    return this._profile.model.replyProfile.upsert({
      where: {
        organizationId,
      },
      create: {
        organizationId,
        ...data,
      },
      update: data,
      select: {
        enabled: true,
        website: true,
        fullVideoUrl: true,
        notes: true,
      },
    });
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

  enabledYoutubeChannels() {
    return this._integration.model.integration.findMany({
      where: {
        providerIdentifier: 'youtube',
        deletedAt: null,
        disabled: false,
        refreshNeeded: false,
        inBetweenSteps: false,
        organization: {
          replyProfile: {
            enabled: true,
          },
        },
      },
    });
  }

  recentPosts(organizationId: string, integrationId: string) {
    return this._post.model.post.findMany({
      where: {
        organizationId,
        integrationId,
        deletedAt: null,
        parentPostId: null,
        state: 'PUBLISHED',
        releaseId: {
          not: null,
        },
        publishDate: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        publishDate: 'desc',
      },
      take: 10,
      select: {
        title: true,
        content: true,
        releaseURL: true,
        releaseId: true,
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
        title: true,
        content: true,
        releaseURL: true,
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
