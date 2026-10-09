import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { checkAuth } from '@gitroom/nestjs-libraries/chat/auth.context';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import {
  youtubeDirectPublishKey,
  youtubeDirectPublishOutput,
} from '@gitroom/nestjs-libraries/chat/tools/youtube.direct.publish.tool';

@Injectable()
export class YoutubeDirectPublishStatusTool implements AgentToolInterface {
  name = 'youtubeDirectPublishStatusTool';
  mcpOnly = true;

  run() {
    return createTool({
      id: 'youtubeDirectPublishStatusTool',
      description: `Check a YouTube direct publish started with youtubeDirectPublishTool, using its jobId.
"uploading" means the video is still being sent to YouTube: wait about 30 seconds and call again.
"published" or "scheduled" return the YouTube video url, "failed" returns the error.`,
      mcp: {
        annotations: {
          title: 'YouTube Direct Publish Status',
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      inputSchema: z.object({
        jobId: z
          .string()
          .describe('The jobId returned by youtubeDirectPublishTool'),
      }),
      outputSchema: youtubeDirectPublishOutput,
      execute: async (inputData, context) => {
        checkAuth(inputData, context);
        const org = JSON.parse(
          (context?.requestContext as any)?.get('organization') as string
        );

        const saved = await ioRedis.get(
          youtubeDirectPublishKey(inputData.jobId)
        );
        const job = saved ? JSON.parse(saved) : null;

        if (!job || job.organizationId !== org.id) {
          return { error: 'No YouTube direct publish found for this jobId' };
        }

        const { organizationId, ...result } = job;
        return result;
      },
    });
  }
}
