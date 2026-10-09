import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { Integration } from '@prisma/client';
import dayjs from 'dayjs';
import { checkAuth } from '@gitroom/nestjs-libraries/chat/auth.context';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { RefreshIntegrationService } from '@gitroom/nestjs-libraries/integrations/refresh.integration.service';
import { RefreshToken } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { YoutubeProvider } from '@gitroom/nestjs-libraries/integrations/social/youtube.provider';
import { CoinsService } from '@gitroom/nestjs-libraries/database/prisma/coins/coins.service';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { timer } from '@gitroom/helpers/utils/timer';

export const youtubeDirectPublishKey = (jobId: string) =>
  `youtubeDirectPublish:${jobId}`;

export const youtubeDirectPublishOutput = z.object({
  jobId: z.string().optional(),
  status: z
    .enum(['uploading', 'published', 'scheduled', 'failed'])
    .optional(),
  videoId: z.string().optional(),
  url: z.string().optional(),
  publishAt: z.string().optional(),
  error: z.string().optional(),
});

type DirectPublishJob = z.infer<typeof youtubeDirectPublishOutput> & {
  organizationId: string;
};

@Injectable()
export class YoutubeDirectPublishTool implements AgentToolInterface {
  constructor(
    private _integrationService: IntegrationService,
    private _integrationManager: IntegrationManager,
    private _refreshIntegrationService: RefreshIntegrationService,
    private _coinsService: CoinsService
  ) {}
  name = 'youtubeDirectPublishTool';
  mcpOnly = true;

  private async saveJob(jobId: string, job: DirectPublishJob) {
    await ioRedis.set(
      youtubeDirectPublishKey(jobId),
      JSON.stringify(job),
      'EX',
      7 * 24 * 60 * 60
    );
  }

  // Runs outside the tool call, an upload can take longer than the MCP client waits
  private async publish(
    jobId: string,
    integration: Integration,
    video: Parameters<YoutubeProvider['directPublish']>[2]
  ) {
    const provider = this._integrationManager.getSocialIntegration(
      'youtube'
    ) as YoutubeProvider;
    let refreshed = false;

    while (true) {
      let uploaded: { videoId: string; releaseURL: string };
      try {
        uploaded = await provider.directPublish(
          integration.token,
          integration,
          video
        );
      } catch (err) {
        if (err instanceof RefreshToken && !refreshed) {
          refreshed = true;
          const data = await this._refreshIntegrationService.refresh(
            integration
          );

          if (data && data.accessToken) {
            integration.token = data.accessToken;
            continue;
          }

          await this._integrationService.disconnectChannel(
            integration.organizationId,
            integration
          );
        }

        await this.saveJob(jobId, {
          organizationId: integration.organizationId,
          jobId,
          status: 'failed',
          error:
            err instanceof RefreshToken
              ? 'The YouTube channel needs to be reconnected in AI Zyntra'
              : err instanceof Error && err.message
              ? err.message
              : 'Unexpected error while uploading to YouTube',
        });
        return;
      }

      await this._coinsService.chargePost(
        integration.organizationId,
        `youtube-direct-${jobId}`,
        integration.name
      );

      await this.saveJob(jobId, {
        organizationId: integration.organizationId,
        jobId,
        status: video.publishAt ? 'scheduled' : 'published',
        videoId: uploaded.videoId,
        url: uploaded.releaseURL,
        ...(video.publishAt ? { publishAt: video.publishAt } : {}),
      });
      return;
    }
  }

  run() {
    return createTool({
      id: 'youtubeDirectPublishTool',
      description: `Publish a video to a YouTube channel directly from a public video URL, without storing the video in AI Zyntra (YouTube only).
Use integrationList to find the YouTube channel id. The video URL must be publicly downloadable over https and support HTTP range requests (S3, R2, GCS, Dropbox direct links and most CDNs do).
Set publishAt to schedule the video on YouTube itself: it is uploaded as private and YouTube publishes it at that time (it shows as scheduled in YouTube Studio).
Small videos usually finish within the call. If the status is "uploading", call youtubeDirectPublishStatusTool with the jobId every 30 seconds until it is "published", "scheduled" or "failed".`,
      mcp: {
        annotations: {
          title: 'YouTube Direct Publish',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe('The id of the YouTube channel, from integrationList'),
        videoUrl: z
          .string()
          .url()
          .describe('Public https URL of the video file (mp4 recommended)'),
        title: z
          .string()
          .min(2)
          .max(100)
          .describe('Video title, 2 to 100 characters'),
        description: z
          .string()
          .max(5000)
          .optional()
          .describe('Video description, up to 5000 characters'),
        tags: z
          .array(z.string())
          .optional()
          .describe('Video tags, up to 500 characters in total'),
        privacy: z
          .enum(['public', 'private', 'unlisted'])
          .default('public')
          .describe(
            'Who can watch the video. Ignored when publishAt is set, scheduled videos are private until they publish'
          ),
        madeForKids: z
          .boolean()
          .default(false)
          .describe('Whether the video is made for kids (COPPA)'),
        publishAt: z
          .string()
          .optional()
          .describe(
            'ISO 8601 date and time in the future (e.g. 2026-10-12T15:30:00Z) to schedule the video on YouTube'
          ),
        thumbnailUrl: z
          .string()
          .url()
          .optional()
          .describe(
            'Public https URL of a custom thumbnail image (jpg or png, the channel must be verified for custom thumbnails)'
          ),
        notifySubscribers: z
          .boolean()
          .default(true)
          .describe('Whether YouTube notifies the channel subscribers'),
      }),
      outputSchema: youtubeDirectPublishOutput,
      execute: async (inputData, context) => {
        checkAuth(inputData, context);
        const org = JSON.parse(
          (context?.requestContext as any)?.get('organization') as string
        );

        if (
          !/^https?:\/\//i.test(inputData.videoUrl) ||
          (inputData.thumbnailUrl &&
            !/^https?:\/\//i.test(inputData.thumbnailUrl))
        ) {
          return { error: 'The video and thumbnail URLs must use http or https' };
        }

        let publishAt: string | undefined;
        if (inputData.publishAt) {
          const date = dayjs(inputData.publishAt);
          if (!date.isValid()) {
            return {
              error:
                'publishAt is not a valid date, use ISO 8601 like 2026-10-12T15:30:00Z',
            };
          }
          if (date.isBefore(dayjs().add(5, 'minute'))) {
            return {
              error:
                'publishAt must be at least 5 minutes in the future, leave it out to publish now',
            };
          }
          publishAt = date.toISOString();
        }

        const integration = await this._integrationService.getIntegrationById(
          org.id,
          inputData.integrationId
        );

        if (
          !integration ||
          integration.deletedAt ||
          integration.providerIdentifier !== 'youtube'
        ) {
          return {
            error:
              'YouTube channel not found, use integrationList to get the id of a connected YouTube channel',
          };
        }

        if (integration.disabled || integration.refreshNeeded) {
          return {
            error:
              'This YouTube channel is disabled or needs to be reconnected in AI Zyntra',
          };
        }

        try {
          await this._coinsService.checkCoins(org.id, 'post');
        } catch (err: any) {
          return {
            error:
              err?.response?.message ||
              'Not enough Zyntra Coins to publish this video',
          };
        }

        const jobId = makeId(16);
        await this.saveJob(jobId, {
          organizationId: org.id,
          jobId,
          status: 'uploading',
        });

        const job = this.publish(jobId, integration, {
          videoUrl: inputData.videoUrl,
          title: inputData.title,
          description: inputData.description,
          tags: inputData.tags,
          privacy: inputData.privacy,
          madeForKids: inputData.madeForKids,
          publishAt,
          thumbnailUrl: inputData.thumbnailUrl,
          notifySubscribers: inputData.notifySubscribers,
        }).catch(() => undefined);

        await Promise.race([job, timer(50000)]);

        const saved = await ioRedis.get(youtubeDirectPublishKey(jobId));
        if (!saved) {
          return { jobId, status: 'uploading' as const };
        }

        const { organizationId, ...result } = JSON.parse(
          saved
        ) as DirectPublishJob;

        return result;
      },
    });
  }
}
