import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { checkAuth } from '@gitroom/nestjs-libraries/chat/auth.context';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { RefreshIntegrationService } from '@gitroom/nestjs-libraries/integrations/refresh.integration.service';
import {
  BadBody,
  RefreshToken,
} from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { YoutubeProvider } from '@gitroom/nestjs-libraries/integrations/social/youtube.provider';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';

const output = z.object({
  videoId: z.string().optional(),
  url: z.string().optional(),
  postId: z.string().optional(),
  publishAt: z.string().optional(),
  status: z.enum(['scheduled', 'unchanged']).optional(),
  error: z.string().optional(),
  warning: z.string().optional(),
});

@Injectable()
export class YoutubeDirectRescheduleTool implements AgentToolInterface {
  constructor(
    private _integrationService: IntegrationService,
    private _integrationManager: IntegrationManager,
    private _refreshIntegrationService: RefreshIntegrationService,
    private _postsService: PostsService
  ) {}
  name = 'youtubeDirectRescheduleTool';
  mcpOnly = true;

  run() {
    return createTool({
      id: 'youtubeDirectRescheduleTool',
      description: `Move a YouTube video that was scheduled with youtubeDirectPublishTool (publishAt) to a new time.
YouTube keeps the video private and publishes it at the new time, and the AI Zyntra calendar entry moves to that time with a reschedule note.
It only works while YouTube has not published the video yet. Use the videoId returned by youtubeDirectPublishTool.`,
      mcp: {
        annotations: {
          title: 'YouTube Direct Reschedule',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe('The id of the YouTube channel, from integrationList'),
        videoId: z
          .string()
          .describe(
            'The YouTube videoId returned by youtubeDirectPublishTool'
          ),
        publishAt: z
          .string()
          .describe(
            'New ISO 8601 date and time, at least 5 minutes in the future, e.g. 2026-10-20T15:30:00Z'
          ),
      }),
      outputSchema: output,
      execute: async (inputData, context) => {
        checkAuth(inputData, context);
        const org = JSON.parse(
          (context?.requestContext as any)?.get('organization') as string
        );

        const date = dayjs(inputData.publishAt);
        if (!date.isValid()) {
          return {
            error:
              'publishAt is not a valid date, use ISO 8601 like 2026-10-20T15:30:00Z',
          };
        }
        if (date.isBefore(dayjs().add(5, 'minute'))) {
          return {
            error: 'publishAt must be at least 5 minutes in the future',
          };
        }
        const publishAt = date.toISOString();

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

        const record = await this._postsService.findDirectPublishRecord(
          org.id,
          integration.id,
          inputData.videoId
        );
        let settings: { directPublish?: boolean; publishAt?: string } = {};
        try {
          settings = JSON.parse(record?.settings || '{}');
        } catch (err) {}
        if (!record || !settings.directPublish) {
          return {
            error:
              'No calendar entry for this video. Only videos scheduled with youtubeDirectPublishTool can be rescheduled here.',
          };
        }

        const from = settings.publishAt || record.publishDate.toISOString();
        if (from === publishAt) {
          return {
            status: 'unchanged' as const,
            videoId: inputData.videoId,
            url: record.releaseURL || undefined,
            postId: record.id,
            publishAt,
          };
        }

        const provider = this._integrationManager.getSocialIntegration(
          'youtube'
        ) as YoutubeProvider;

        let refreshed = false;
        while (true) {
          try {
            await provider.rescheduleDirectPublish(
              integration.token,
              inputData.videoId,
              publishAt
            );
            break;
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
              await this._integrationService.disconnectChannel(org.id, integration);
              return {
                error: 'The YouTube channel needs to be reconnected in AI Zyntra',
              };
            }
            return {
              error:
                err instanceof BadBody && err.message
                  ? err.message
                  : 'YouTube did not accept the new time, please try again',
            };
          }
        }

        const saved = await this._postsService.rescheduleDirectPublishRecord(
          org.id,
          record.id,
          new Date(publishAt),
          {
            action: 'rescheduled',
            at: new Date().toISOString(),
            from,
            to: publishAt,
          }
        );

        return {
          status: 'scheduled' as const,
          videoId: inputData.videoId,
          url: record.releaseURL || undefined,
          postId: record.id,
          publishAt,
          ...(!saved
            ? {
                warning:
                  'YouTube was updated but the calendar entry could not be moved',
              }
            : {}),
        };
      },
    });
  }
}
