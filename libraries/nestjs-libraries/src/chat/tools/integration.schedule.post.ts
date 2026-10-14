import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { AllProvidersSettings } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/all.providers.settings';
import { Integration } from '@prisma/client';
import { checkAuth } from '@gitroom/nestjs-libraries/chat/auth.context';
import {
  ValidUrlExtension,
  ValidUrlPath,
} from '@gitroom/helpers/utils/valid.url.path';
import { stripPresignedQuery } from '@gitroom/nestjs-libraries/upload/s3.client.config';

const validUrlExtension = new ValidUrlExtension();
const validUrlPath = new ValidUrlPath();

@Injectable()
export class IntegrationSchedulePostTool implements AgentToolInterface {
  constructor(
    private _postsService: PostsService,
    private _integrationService: IntegrationService,
    private _mediaService: MediaService
  ) {}
  name = 'integrationSchedulePostTool';

  /**
   * Resolve a media id or URL into a persisted attachment.
   * Do not put .refine() on the tool inputSchema — Mastra can crash when
   * rebuilding refined Zod schemas for tool execution.
   */
  private async resolveAttachment(
    organizationId: string,
    ref: string
  ): Promise<{ id: string; path: string } | { error: string }> {
    const raw = (ref || '').trim();
    if (!raw) {
      return { error: 'Attachment is empty' };
    }

    // Media id from generateImageTool / upload tools (not a URL)
    if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/')) {
      const media = await this._mediaService.getMediaById(raw);
      if (!media || media.organizationId !== organizationId || media.deletedAt) {
        return {
          error: `Media id "${raw}" was not found in this organization. Use the id or path returned by generateImageTool / upload tools.`,
        };
      }
      return {
        id: media.id,
        path: stripPresignedQuery(media.path),
      };
    }

    const path = stripPresignedQuery(raw);
    if (!validUrlExtension.validate(path, {} as any)) {
      return {
        error: validUrlExtension.defaultMessage({} as any),
      };
    }
    if (!validUrlPath.validate(path, {} as any)) {
      return {
        error: validUrlPath.defaultMessage({} as any),
      };
    }

    return { id: makeId(10), path };
  }

  run() {
    return createTool({
      id: 'schedulePostTool',
      mcp: {
        annotations: {
          title: 'Schedule Social Media Post',
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      description: `
Use this when the user wants to create a draft, scheduled, or immediate social media post on their connected channels, based on the integrationSchema tool.

For DRAFTS (user says draft / do not publish / do not schedule): set type to "draft". Drafts are free and appear under Draft in the calendar. Prefer the media "id" from generateImageTool (or its path) in attachments.

Examples of the input shape:

A single LinkedIn post with one comment
- socialPost array length will be one
- postsAndComments array length will be two (one for the post, one for the comment)

20 Facebook posts each on individual days without comments
- socialPost array length will be 20
- postsAndComments array length will be one

Do not use this to update or delete existing posts.
On success, each item in output contains a previewUrl the user can open to see the post.
If validation fails, the result contains output.errors describing what to fix; the call can be retried with corrected parameters.
`,
      inputSchema: z.object({
        socialPost: z
          .array(
            z.object({
              integrationId: z
                .string()
                .describe('The id of the integration (not internal id)'),
              isPremium: z
                .boolean()
                .describe(
                  "If the integration is X, return if it's premium or not"
                ),
              date: z.string().describe('The date of the post in UTC time'),
              shortLink: z
                .boolean()
                .describe(
                  'If the post has a link inside, we can ask the user if they want to add a short link'
                ),
              type: z
                .enum(['draft', 'schedule', 'now'])
                .describe(
                  'draft = save without publishing (free); schedule = queue for date; now = publish immediately. Prefer draft when the user asks not to publish or schedule.'
                ),
              postsAndComments: z
                .array(
                  z.object({
                    content: z
                      .string()
                      .describe(
                        "The content of the post, HTML, Each line must be wrapped in <p> here is the possible tags: h1, h2, h3, u, strong, li, ul, p (you can't have u and strong together)"
                      ),
                    attachments: z
                      .array(z.string())
                      .describe(
                        'Media ids or image/video URLs from generateImageTool / upload tools (prefer media id)'
                      ),
                  })
                )
                .describe(
                  'first item is the post, every other item is the comments'
                ),
              settings: z
                .array(
                  z.object({
                    key: z
                      .string()
                      .describe('Name of the settings key to pass'),
                    value: z
                      .any()
                      .describe(
                        'Value of the key, always prefer the id then label if possible. When the settings schema says a field is an id, pass the id returned by the channel tools, never the display label'
                      ),
                  })
                )
                .describe(
                  'This relies on the integrationSchema tool to get the settings [input:settings]'
                ),
            })
          )
          .describe('Individual post'),
      }),
      outputSchema: z.object({
        output: z
          .array(
            z.object({
              postId: z.string(),
              integration: z.string(),
              previewUrl: z
                .string()
                .describe(
                  'Public preview page of the created post, share it with the user'
                ),
            })
          )
          .or(z.object({ errors: z.string() })),
      }),
      execute: async (inputData, context) => {
        checkAuth(inputData, context);
        const organizationId = JSON.parse(
          (context?.requestContext as any)?.get('organization') as string
        ).id;
        const finalOutput = [];

        try {
          const integrations = {} as Record<string, Integration>;
          for (const platform of inputData.socialPost) {
            integrations[platform.integrationId] =
              await this._integrationService.getIntegrationById(
                organizationId,
                platform.integrationId
              );

            // Same server-side validation as the dashboard / public API
            // (settings DTO + media checkValidity + empty / too-long content).
            const settings = platform.settings.reduce(
              (acc: AllProvidersSettings, s: { key: string; value: any }) => ({
                ...acc,
                [s.key]: s.value,
              }),
              {} as AllProvidersSettings
            );

            const resolvedPosts = [];
            for (const p of platform.postsAndComments) {
              const images = [];
              for (const ref of p.attachments || []) {
                const resolved = await this.resolveAttachment(
                  organizationId,
                  ref
                );
                if ('error' in resolved) {
                  return { output: { errors: resolved.error } };
                }
                images.push(resolved);
              }
              resolvedPosts.push({ content: p.content, images });
            }

            // Stash resolved media for the create loop below
            (platform as any).__resolvedPosts = resolvedPosts;

            const [validation] = await this._postsService.validatePosts(
              organizationId,
              [
                {
                  integration: { id: platform.integrationId },
                  settings,
                  value: resolvedPosts.map((p) => ({
                    content: p.content,
                    image: p.images.map((img) => ({ path: img.path })),
                  })),
                },
              ]
            );

            if (validation.emptyContent) {
              return {
                output: {
                  errors: `${validation.name}: Your post should have at least one character or one image.`,
                },
              };
            }

            if (platform.type !== 'draft') {
              if (!validation.valid) {
                return {
                  output: {
                    errors: `${validation.name}: ${
                      validation.settingsError || 'Please fix your settings'
                    }, please fix it, and try integrationSchedulePostTool again.`,
                  },
                };
              }

              if (validation.errors !== true) {
                return {
                  output: {
                    errors: `${validation.name}: ${validation.errors}, please fix it, and try integrationSchedulePostTool again.`,
                  },
                };
              }

              if (validation.tooLong) {
                return {
                  output: {
                    errors: `${validation.name}: The maximum characters is ${validation.maximumCharacters}, please fix it, and try integrationSchedulePostTool again.`,
                  },
                };
              }
            }
          }

          for (const post of inputData.socialPost) {
            const integration = integrations[post.integrationId];

            if (!integration) {
              return {
                output: {
                  errors: `Channel (integration) ${post.integrationId} was not found.`,
                },
              };
            }

            const resolvedPosts =
              (post as any).__resolvedPosts ||
              post.postsAndComments.map((p: any) => ({
                content: p.content,
                images: (p.attachments || []).map((path: string) => ({
                  id: makeId(10),
                  path: stripPresignedQuery(path),
                })),
              }));

            const output = await this._postsService.createPost(
              organizationId,
              {
                date: post.date,
                type: post.type as 'draft' | 'schedule' | 'now',
                shortLink: post.shortLink,
                tags: [],
                posts: [
                  {
                    integration,
                    group: makeId(10),
                    settings: post.settings.reduce(
                      (
                        acc: AllProvidersSettings,
                        s: { key: string; value: any }
                      ) => ({
                        ...acc,
                        [s.key]: s.value,
                      }),
                      {
                        __type: integration.providerIdentifier,
                      } as AllProvidersSettings
                    ),
                    value: resolvedPosts.map((p: any) => ({
                      content: p.content,
                      id: makeId(10),
                      delay: 0,
                      image: p.images.map((img: any) => ({
                        id: img.id || makeId(10),
                        path: img.path,
                      })),
                    })),
                  },
                ],
              },
              'MCP'
            );
            // Same public preview page the calendar "Preview Post" button opens.
            finalOutput.push(
              ...output.map((p) => ({
                ...p,
                previewUrl: `${process.env.FRONTEND_URL}/p/${p.postId}?share=true`,
              }))
            );
          }

          return {
            output: finalOutput,
          };
        } catch (err) {
          const message =
            (err as any)?.response?.message ||
            (err instanceof Error ? err.message : String(err));
          return {
            output: {
              errors:
                typeof message === 'string'
                  ? message
                  : 'Could not save the post. Please try again.',
            },
          };
        }
      },
    });
  }
}
