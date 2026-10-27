import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClippingRepository {
  constructor(
    private _clipping: PrismaRepository<'clipping'>,
    private _clippingClip: PrismaRepository<'clippingClip'>,
    private _transaction: PrismaTransaction
  ) {}

  createClipping(
    org: string,
    url: string,
    maxClips: number,
    fit: 'crop' | 'blur',
    integrations: string[],
    options?: {
      mediaId?: string;
      billingMode?: 'analyse' | 'confirm';
    }
  ) {
    return this._clipping.model.clipping.create({
      data: {
        organizationId: org,
        url,
        maxClips,
        fit,
        integrations: JSON.stringify(integrations),
        ...(options?.mediaId ? { mediaId: options.mediaId } : {}),
        ...(options?.billingMode ? { billingMode: options.billingMode } : {}),
      },
      select: {
        id: true,
        status: true,
        billingMode: true,
        mediaId: true,
      },
    });
  }

  getRunningClippings(org: string) {
    return this._clipping.model.clipping.findMany({
      where: {
        organizationId: org,
        deletedAt: null,
        status: {
          notIn: ['completed', 'failed', 'cancelled'],
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  }

  countClippingsSince(org: string, since: Date) {
    return this._clipping.model.clipping.count({
      where: {
        organizationId: org,
        createdAt: {
          gte: since,
        },
      },
    });
  }

  getClippingById(id: string) {
    return this._clipping.model.clipping.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        clips: {
          orderBy: {
            start: 'asc',
          },
        },
      },
    });
  }

  getClipping(org: string, id: string) {
    return this._clipping.model.clipping.findFirst({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
      },
      select: {
        id: true,
        url: true,
        mediaId: true,
        billingMode: true,
        status: true,
        error: true,
        title: true,
        thumbnail: true,
        duration: true,
        createdAt: true,
        clips: {
          orderBy: {
            start: 'asc',
          },
          select: {
            id: true,
            title: true,
            content: true,
            channelContents: true,
            start: true,
            end: true,
            status: true,
            error: true,
            mediaId: true,
            path: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  // Only what the widget shows and reports: the ticket travels in a query
  // string, so the route gives away as little as it can
  getClippingProgress(org: string, id: string) {
    return this._clipping.model.clipping.findFirst({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        error: true,
        title: true,
        clips: {
          orderBy: {
            start: 'asc',
          },
          select: {
            id: true,
            title: true,
            status: true,
            error: true,
            mediaId: true,
            path: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  async getClippings(org: string, page: number) {
    const pageNum = Math.max(+page || 1, 1) - 1;
    const where = {
      organizationId: org,
      deletedAt: null as null,
    };

    const pages = Math.ceil(
      (await this._clipping.model.clipping.count({ where })) / 20
    );

    const results = await this._clipping.model.clipping.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        url: true,
        status: true,
        error: true,
        title: true,
        thumbnail: true,
        duration: true,
        createdAt: true,
      },
      skip: pageNum * 20,
      take: 20,
    });

    return {
      pages,
      results,
    };
  }

  updateClipping(
    org: string,
    id: string,
    data: {
      status?: string;
      error?: string | null;
      title?: string;
      thumbnail?: string;
      duration?: number;
      creditsId?: string | null;
    }
  ) {
    return this._clipping.model.clipping.update({
      where: {
        id,
        organizationId: org,
      },
      data,
      select: {
        id: true,
        status: true,
      },
    });
  }

  // Idempotent confirm: only one caller moves suggestions_ready → rendering
  async claimConfirm(org: string, id: string) {
    const { count } = await this._clipping.model.clipping.updateMany({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
        status: 'suggestions_ready',
      },
      data: {
        status: 'rendering',
        error: null,
      },
    });

    return count === 1;
  }

  async claimCancel(org: string, id: string) {
    const { count } = await this._clipping.model.clipping.updateMany({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
        status: 'suggestions_ready',
      },
      data: {
        status: 'cancelled',
        error: null,
      },
    });

    return count === 1;
  }

  // An attempt that timed out can still be running when its retry gets here, and
  // only one may store clips. The look at what is there is not enough on its own
  // (both can see nothing), so the update takes the row of the clipping first:
  // the second attempt waits on it until the first commits and then finds its clips
  createClips(
    clippingId: string,
    clips: { title: string; content: string; start: number; end: number }[],
    status: 'pending' | 'suggested' = 'pending'
  ) {
    return this._transaction.model.$transaction(async (tx) => {
      await tx.clipping.update({
        where: { id: clippingId },
        data: { updatedAt: new Date() },
        select: { id: true },
      });

      const select = { where: { clippingId }, select: { id: true } };
      const existing = await tx.clippingClip.findMany(select);
      if (existing.length) {
        return existing;
      }

      await tx.clippingClip.createMany({
        data: clips.map((clip) => ({
          clippingId,
          status,
          ...clip,
        })),
      });

      return tx.clippingClip.findMany(select);
    });
  }

  listClipIdsByStatus(clippingId: string, status: string) {
    return this._clippingClip.model.clippingClip.findMany({
      where: { clippingId, status },
      select: { id: true },
      orderBy: { start: 'asc' },
    });
  }

  async prepareConfirmClips(
    clippingId: string,
    selectedIds: string[],
    channelContentsByClip: Record<string, Record<string, string>>
  ) {
    const selected = new Set(selectedIds);
    const clips = await this._clippingClip.model.clippingClip.findMany({
      where: { clippingId },
      select: { id: true, status: true },
    });

    for (const clip of clips) {
      if (selected.has(clip.id)) {
        await this._clippingClip.model.clippingClip.update({
          where: { id: clip.id },
          data: {
            status: 'pending',
            error: null,
            ...(channelContentsByClip[clip.id]
              ? {
                  channelContents: channelContentsByClip[
                    clip.id
                  ] as Prisma.InputJsonValue,
                }
              : {}),
          },
        });
      } else if (clip.status === 'suggested' || clip.status === 'pending') {
        await this._clippingClip.model.clippingClip.update({
          where: { id: clip.id },
          data: {
            status: 'skipped',
            error: null,
          },
        });
      }
    }
  }

  failUnfinishedClips(clippingId: string, error: string) {
    return this._clippingClip.model.clippingClip.updateMany({
      where: {
        clippingId,
        status: { in: ['pending', 'suggested'] },
      },
      data: {
        status: 'failed',
        error,
      },
    });
  }

  // Only the attempt that moves draftedAt off null may create the draft
  async claimClipDraft(id: string) {
    const { count } = await this._clippingClip.model.clippingClip.updateMany({
      where: {
        id,
        draftedAt: null,
      },
      data: {
        draftedAt: new Date(),
      },
    });

    return count === 1;
  }

  getClipById(id: string) {
    return this._clippingClip.model.clippingClip.findUnique({
      where: {
        id,
      },
      include: {
        clipping: true,
      },
    });
  }

  updateClip(
    id: string,
    data: {
      status?: string;
      error?: string | null;
      trimStart?: number;
      mediaId?: string;
      path?: string;
      thumbnail?: string;
      draftedAt?: Date;
      channelContents?: Prisma.InputJsonValue;
    }
  ) {
    return this._clippingClip.model.clippingClip.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        status: true,
      },
    });
  }
}
