import {
  Logger,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  Param,
} from '@nestjs/common';
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from '@copilotkit/runtime';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { CoinsService } from '@gitroom/nestjs-libraries/database/prisma/coins/coins.service';
import { MastraAgent } from '@ag-ui/mastra';
import { MastraService } from '@gitroom/nestjs-libraries/chat/mastra.service';
import { Request, Response } from 'express';
import { RequestContext } from '@mastra/core/di';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import { AuthorizationActions, Sections } from '@gitroom/backend/services/auth/permissions/permission.exception.class';
import {
  aiConfig,
  createOpenAIClient,
} from '@gitroom/nestjs-libraries/openai/ai.config';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { AllProvidersSettings } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/all.providers.settings';

export type ChannelsContext = {
  integrations: string;
  organization: string;
  ui: string;
};

const titleFromUserText = (detail: string) => {
  const text = (detail || '')
    .replace(/\[--integrations--\][\s\S]*?(?:\[--integrations--\]|$)/g, '')
    .replace(/\[--Media--\][\s\S]*?(?:\[--Media--\]|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 60) || 'Chat';
};

// the copilot runtime writes its own CORS headers on the response, keep them aligned with main.ts
const copilotCors = () => ({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:6274',
    ...(process.env.MAIN_URL ? [process.env.MAIN_URL] : []),
  ],
  credentials: !process.env.NOT_SECURED,
});

// Runs triggered by tool results or reconnects are free, only a message the
// user typed costs coins
const isUserMessage = (req: Request) =>
  req?.body?.method === 'agent/run' &&
  req?.body?.body?.messages?.at?.(-1)?.role === 'user';

const userMessageText = (req: Request): string => {
  const content = req?.body?.body?.messages?.at?.(-1)?.content;
  if (typeof content === 'string') {
    return content;
  }
  return Array.isArray(content)
    ? content
        .filter((part: any) => part?.type === 'text')
        .map((part: any) => part.text)
        .join(' ')
    : '';
};

const assistantTextFromMessage = (message: any): string => {
  const content = message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (content?.content && typeof content.content === 'string') {
    return content.content;
  }
  const parts = content?.parts || content;
  if (Array.isArray(parts)) {
    return parts
      .filter((part: any) => part?.type === 'text' || typeof part?.text === 'string')
      .map((part: any) => part.text || '')
      .join(' ');
  }
  return '';
};

// Refund when the model falsely claims it cannot write text at all, or when
// the turn produced no assistant text (silent failure / tool-only dead end).
// Real limits (edit/merge media, missing channel for schedule) stay charged.
const isTextCapabilityRefusal = (text: string) => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length > 600) {
    return false;
  }
  return /(?:cannot|can't|unable to|do not have|don't have).{0,40}(?:generate text|generate or modify text|functionality to do that|write (?:text|a caption|the caption)|modify text)/i.test(
    normalized
  );
};

const shouldRefundAgentMessage = (text: string) => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return true;
  }
  return isTextCapabilityRefusal(normalized);
};

const threadIdFromRequest = (req: Request): string | undefined => {
  const body = req?.body;
  const nested = body?.body;
  const candidates = [
    nested?.threadId,
    nested?.thread_id,
    body?.threadId,
    body?.thread_id,
    nested?.agent?.threadId,
    body?.params?.threadId,
    req?.headers?.['x-thread-id'],
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const isCaptionOnlyRequest = (detail: string) => {
  const text = (detail || '').toLowerCase();
  if (!/(caption|rewrite|shorten|rephrase|tagline)/.test(text)) {
    return false;
  }
  return !/(draft|schedule|publish|post now|create (a |an )?(post|draft))/.test(
    text
  );
};

const isDraftRequest = (detail: string) => {
  const text = (detail || '').toLowerCase();
  return (
    /\bdraft\b/.test(text) ||
    /do not (publish|schedule)/.test(text) ||
    /don't (publish|schedule)/.test(text)
  );
};

const stripAgentMetaBlocks = (detail: string) =>
  (detail || '')
    .replace(/\[--integrations--\][\s\S]*?(?:\[--integrations--\]|$)/g, '')
    .replace(/\[--Media--\][\s\S]*?(?:\[--Media--\]|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const extractDraftCaption = (detail: string) => {
  const cleaned = stripAgentMetaBlocks(detail);
  const patterns = [
    /caption[:\s]+["“']?(.+?)["”']?(?=\.\s*Do not|\.\s*Please|$)/i,
    /(?:with the text|text)[:\s]+["“']?(.+?)["”']?(?=\.\s*Do not|\.\s*Please|$)/i,
  ];
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  const stripped = cleaned
    .replace(/^.*?create a draft[^.]*?(?:caption|text)[:\s]*/i, '')
    .replace(/\.\s*Do not (publish|schedule).*$/i, '')
    .replace(/\.\s*Please ignore\.?$/i, '')
    .trim();
  return stripped || cleaned || 'Draft';
};

const escapeHtmlText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const selectedIntegrationIdFromRequest = (
  req: Request,
  detail: string
): string | undefined => {
  const fromProps = req?.body?.body?.forwardedProps?.integrations;
  if (Array.isArray(fromProps) && fromProps.length) {
    const first = fromProps[0];
    if (typeof first === 'string' && first.trim()) {
      return first.trim();
    }
    if (first && typeof first === 'object' && typeof first.id === 'string') {
      return first.id;
    }
  }

  const block = detail.match(
    /\[--integrations--\]([\s\S]*?)\[--integrations--\]/
  )?.[1];
  if (!block) {
    return undefined;
  }
  try {
    const jsonMatch = block.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return undefined;
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed) && parsed[0]?.id) {
      return String(parsed[0].id);
    }
  } catch {
    // ignore malformed channel block
  }
  return undefined;
};

const silenceFallbackText = (detail: string) => {
  if (isCaptionOnlyRequest(detail)) {
    return (
      'I hit a temporary error before I could send that caption. ' +
      'Writing or rewriting captions works for any platform style even when that ' +
      'channel is not selected or connected — please send your caption request again.'
    );
  }
  if (isDraftRequest(detail)) {
    return (
      'I hit a temporary error before I could save that draft. ' +
      'Please select a connected channel on the left and ask me again to create the draft ' +
      '(type draft — it will not publish). Your coin for this failed turn was refunded.'
    );
  }
  return (
    'I hit a temporary error and could not finish that reply. ' +
    'Please try again. For drafts, select a connected channel on the left first; ' +
    'for captions only, no channel selection is required.'
  );
};

// Pull assistant-visible text out of AG-UI SSE (`data: {...}\n\n`) chunks.
const extractAssistantTextFromSseChunk = (chunk: string): string => {
  let out = '';
  for (const line of chunk.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) {
      continue;
    }
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') {
      continue;
    }
    try {
      const event = JSON.parse(payload);
      const type = event?.type;
      if (
        type === 'TEXT_MESSAGE_CONTENT' ||
        type === 'TEXT_MESSAGE_CHUNK' ||
        type === 'TEXT_MESSAGE'
      ) {
        const delta =
          (typeof event?.delta === 'string' && event.delta) ||
          (typeof event?.content === 'string' && event.content) ||
          '';
        out += delta;
      }
    } catch {
      // ignore non-JSON SSE comments / partial frames
    }
  }
  return out;
};

const encodeAgUiTextMessageSse = (messageId: string, text: string) => {
  const frames = [
    {
      type: 'TEXT_MESSAGE_START',
      messageId,
      role: 'assistant',
    },
    {
      type: 'TEXT_MESSAGE_CONTENT',
      messageId,
      delta: text,
    },
    {
      type: 'TEXT_MESSAGE_END',
      messageId,
    },
  ];
  return frames.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('');
};

type AgentStreamResult = {
  assistantText: string;
  injectedFallback: boolean;
};

// CopilotKit pipes the agent stream and resolves before the run finishes.
// Tee the SSE body so coin refundIf (and a silence fallback) see real tokens,
// not a lagging Mastra memory write that often never lands on silent turns.
const awaitAgentHttpResponse = async (
  handler: (req: Request, res: Response) => unknown,
  req: Request,
  res: Response,
  fallbackText: string,
  options?: { injectOnSilence?: boolean }
): Promise<AgentStreamResult> => {
  const injectOnSilence = options?.injectOnSilence !== false;
  let assistantText = '';
  let injectedFallback = false;
  let ended = false;

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  const noteChunk = (chunk: unknown) => {
    if (chunk == null || chunk === '') {
      return;
    }
    const asString =
      typeof chunk === 'string'
        ? chunk
        : Buffer.isBuffer(chunk)
        ? chunk.toString('utf8')
        : '';
    if (asString) {
      assistantText += extractAssistantTextFromSseChunk(asString);
    }
  };

  const injectFallbackIfSilent = () => {
    if (injectedFallback || assistantText.trim()) {
      return;
    }
    // Mark silence even when we skip SSE inject (draft recovery writes later).
    injectedFallback = true;
    if (!injectOnSilence) {
      return;
    }
    const messageId = `fallback-${Date.now().toString(36)}`;
    const payload = encodeAgUiTextMessageSse(messageId, fallbackText);
    assistantText = fallbackText;
    try {
      originalWrite(payload);
    } catch (err) {
      Logger.warn(`Could not inject silent-agent fallback SSE: ${err}`);
    }
  };

  (res as any).write = (
    chunk: any,
    encoding?: any,
    cb?: any
  ): boolean => {
    if (typeof chunk !== 'function') {
      noteChunk(chunk);
    }
    return originalWrite(chunk, encoding, cb);
  };

  (res as any).end = (chunk?: any, encoding?: any, cb?: any) => {
    if (ended) {
      return originalEnd(chunk, encoding, cb);
    }
    ended = true;
    if (chunk != null && typeof chunk !== 'function') {
      noteChunk(chunk);
    }
    injectFallbackIfSilent();
    return originalEnd(chunk, encoding, cb);
  };

  const finished = new Promise<void>((resolve, reject) => {
    const done = () => resolve();
    res.once('finish', done);
    res.once('close', done);
    res.once('error', reject);
  });

  try {
    await Promise.resolve(handler(req, res));
    if (!res.writableEnded) {
      await finished;
    }
  } finally {
    // Client abort can skip res.end(); still treat zero streamed text as silence.
    if (!assistantText.trim() && !injectedFallback) {
      injectFallbackIfSilent();
    }
    (res as any).write = originalWrite;
    (res as any).end = originalEnd;
  }

  return {
    assistantText: assistantText.trim(),
    injectedFallback,
  };
};

@Controller('/copilot')
export class CopilotController {
  constructor(
    private _subscriptionService: SubscriptionService,
    private _mastraService: MastraService,
    private _coinsService: CoinsService,
    private _prisma: PrismaService,
    private _postsService: PostsService,
    private _integrationService: IntegrationService
  ) {}
  @Post('/chat')
  chatAgent(
    @Req() req: Request,
    @Res() res: Response,
    @GetOrgFromRequest() organization: Organization
  ) {
    if (
      process.env.OPENAI_API_KEY === undefined ||
      process.env.OPENAI_API_KEY === ''
    ) {
      Logger.warn('OpenAI API key not set, chat functionality will not work');
      return;
    }

    const copilotRuntimeHandler = copilotRuntimeNodeHttpEndpoint({
      endpoint: '/copilot/chat',
      cors: copilotCors(),
      runtime: new CopilotRuntime(),
      serviceAdapter: new OpenAIAdapter({
        openai: createOpenAIClient(),
        model: aiConfig.textModel,
      }),
    });

    if (!isUserMessage(req)) {
      return copilotRuntimeHandler(req, res);
    }

    return this._coinsService.spend(
      organization.id,
      'message',
      async () => copilotRuntimeHandler(req, res),
      userMessageText(req)
    );
  }

  @Post('/agent')
  @CheckPolicies([AuthorizationActions.Create, Sections.AI])
  async agent(
    @Req() req: Request,
    @Res() res: Response,
    @GetOrgFromRequest() organization: Organization
  ) {
    if (
      process.env.OPENAI_API_KEY === undefined ||
      process.env.OPENAI_API_KEY === ''
    ) {
      Logger.warn('OpenAI API key not set, chat functionality will not work');
      return;
    }
    const mastra = await this._mastraService.mastra();
    const requestContext = new RequestContext<ChannelsContext>();
    requestContext.set(
      'integrations',
      req?.body?.body?.forwardedProps?.integrations || []
    );

    requestContext.set('organization', JSON.stringify(organization));
    requestContext.set('ui', 'true');

    const agents = MastraAgent.getLocalAgents({
      resourceId: organization.id,
      mastra,
      requestContext: requestContext as any,
    });

    const runtime = new CopilotRuntime({
      agents,
    });

    const copilotRuntimeHandler = copilotRuntimeNodeHttpEndpoint({
      endpoint: '/copilot/agent',
      cors: copilotCors(),
      runtime,
      serviceAdapter: new OpenAIAdapter({
        openai: createOpenAIClient(),
        model: aiConfig.textModel,
      }),
    });

    if (!isUserMessage(req)) {
      return copilotRuntimeHandler(req, res);
    }

    const detail = userMessageText(req);
    const threadId = threadIdFromRequest(req);
    const fallbackText = silenceFallbackText(detail);
    // Silent / failed runs often never create a mastra_threads row (title gen
    // never runs), so the history sidebar stays empty even though recall works.
    // Ensure the thread exists up front for this org.
    if (threadId && threadId !== 'new') {
      await this.ensureAgentThread(
        threadId,
        organization.id,
        titleFromUserText(detail)
      );
    }

    // Stream tee is authoritative for silence — Mastra memory often lags or
    // never writes on failed turns, which previously skipped refunds.
    let streamResult: AgentStreamResult = {
      assistantText: '',
      injectedFallback: false,
    };
    let recoveredUsefulReply = false;

    return this._coinsService.spend(
      organization.id,
      'message',
      async () => {
        streamResult = await awaitAgentHttpResponse(
          copilotRuntimeHandler,
          req,
          res,
          fallbackText,
          // Draft asks: detect silence first, then recover the draft and
          // persist the real success/error text (generic SSE would be wrong).
          { injectOnSilence: !isDraftRequest(detail) }
        );

        let replyText = streamResult.assistantText || fallbackText;

        // Agent tool loops still go silent on draft asks. If we detected
        // silence and the user clearly asked for a draft with a selected
        // channel, create the draft here so Calendar + chat both succeed.
        if (streamResult.injectedFallback && isDraftRequest(detail)) {
          const recovery = await this.tryCreateSilentDraft(
            organization.id,
            detail,
            req
          );
          if (recovery.ok) {
            recoveredUsefulReply = true;
            replyText = recovery.message;
            streamResult.assistantText = recovery.message;
          } else if (recovery.message) {
            replyText = recovery.message;
            streamResult.assistantText = recovery.message;
          }
        }

        if (
          (streamResult.injectedFallback || recoveredUsefulReply) &&
          threadId &&
          threadId !== 'new'
        ) {
          await this.persistFallbackAssistantMessage(
            threadId,
            organization.id,
            replyText
          );
        }
        return streamResult;
      },
      detail,
      async () => {
        // A recovered draft + visible reply is a successful turn — keep the coin.
        if (recoveredUsefulReply) {
          return false;
        }
        // Prefer what was actually streamed to the client.
        if (streamResult.injectedFallback) {
          return true;
        }
        if (shouldRefundAgentMessage(streamResult.assistantText)) {
          return true;
        }
        // Fallback: Prisma/Mastra recall when the stream tee missed frames
        // (e.g. protobuf accept) but the turn still left no usable reply.
        if (!threadId || threadId === 'new') {
          return false;
        }
        try {
          return await this.shouldRefundAfterAgentRun(
            mastra,
            organization.id,
            threadId
          );
        } catch (err) {
          Logger.warn(`Could not check agent reply for coin refund: ${err}`);
          return false;
        }
      }
    );
  }

  @Get('/credits')
  calculateCredits(
    @GetOrgFromRequest() organization: Organization,
    @Query('type') type: 'ai_images' | 'ai_videos'
  ) {
    return this._subscriptionService.checkCredits(
      organization,
      type || 'ai_images'
    );
  }

  // Register /list before /:thread/list so "list" is never treated as a thread id.
  @Get('/list')
  @CheckPolicies([AuthorizationActions.Create, Sections.AI])
  async getList(@GetOrgFromRequest() organization: Organization) {
    try {
      const threads = await this._prisma.mastra_threads.findMany({
        where: { resourceId: organization.id },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 200,
        select: { id: true, title: true },
      });

      // Also surface threads that have messages for this org but no thread row
      // (or resourceId was never written on the thread).
      const messageThreadIds = await this._prisma.mastra_messages.findMany({
        where: { resourceId: organization.id },
        distinct: ['thread_id'],
        select: { thread_id: true },
        take: 200,
      });
      const known = new Set(threads.map((t) => t.id));
      for (const row of messageThreadIds) {
        if (known.has(row.thread_id)) {
          continue;
        }
        const firstUser = await this._prisma.mastra_messages.findFirst({
          where: { thread_id: row.thread_id, role: 'user' },
          orderBy: { createdAt: 'asc' },
          select: { content: true },
        });
        const title = titleFromUserText(
          this.plainTextFromStoredContent(firstUser?.content)
        );
        await this.ensureAgentThread(row.thread_id, organization.id, title);
        threads.unshift({ id: row.thread_id, title });
        known.add(row.thread_id);
      }

      return {
        threads: threads.map((p) => ({
          id: p.id,
          title: p.title || 'Chat',
        })),
      };
    } catch (err) {
      Logger.warn(`Could not list agent threads: ${err}`);
      return { threads: [] };
    }
  }

  @Get('/:thread/list')
  @CheckPolicies([AuthorizationActions.Create, Sections.AI])
  async getMessagesList(
    @GetOrgFromRequest() organization: Organization,
    @Param('thread') threadId: string
  ): Promise<any> {
    const mastra = await this._mastraService.mastra();
    const memory = await mastra.getAgent('postiz').getMemory();
    const prismaMessages = await this.loadPrismaThreadMessages(
      threadId,
      organization.id
    );
    try {
      const recalled = await memory.recall({
        resourceId: organization.id,
        threadId,
      });
      const merged = this.mergeRecallWithPrismaMessages(
        recalled?.messages || [],
        prismaMessages
      );
      if (merged.length > 0) {
        const firstUser = merged.find((m: any) => m?.role === 'user');
        await this.ensureAgentThread(
          threadId,
          organization.id,
          titleFromUserText(assistantTextFromMessage(firstUser) || '')
        );
      }
      return { ...(recalled || {}), messages: merged };
    } catch (err) {
      Logger.warn(`Could not recall messages for thread ${threadId}: ${err}`);
      // Silent-agent fallbacks are written to Prisma only — still return them.
      return { messages: prismaMessages };
    }
  }

  private async ensureAgentThread(
    threadId: string,
    resourceId: string,
    title: string
  ) {
    const now = new Date();
    try {
      await this._prisma.mastra_threads.upsert({
        where: { id: threadId },
        create: {
          id: threadId,
          resourceId,
          title: title || 'Chat',
          createdAt: now,
          updatedAt: now,
        },
        update: {
          resourceId,
          updatedAt: now,
          ...(title && title !== 'Chat' ? { title } : {}),
        },
      });
    } catch (err) {
      Logger.warn(`Could not upsert agent thread ${threadId}: ${err}`);
    }
  }

  private plainTextFromStoredContent(content?: string | null) {
    if (!content) {
      return '';
    }
    try {
      const parsed = JSON.parse(content);
      return assistantTextFromMessage({ content: parsed, role: 'user' });
    } catch {
      return content;
    }
  }

  private async loadPrismaThreadMessages(
    threadId: string,
    organizationId: string
  ) {
    try {
      const rows = await this._prisma.mastra_messages.findMany({
        where: {
          thread_id: threadId,
          OR: [{ resourceId: organizationId }, { resourceId: null }],
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });
      return rows.map((row) => {
        let content: any = row.content;
        try {
          content = JSON.parse(row.content);
        } catch {
          content = { format: 2, parts: [{ type: 'text', text: row.content }] };
        }
        return {
          id: row.id,
          role: row.role,
          content,
          createdAt: row.createdAt,
        };
      });
    } catch (err) {
      Logger.warn(
        `Could not load prisma messages for thread ${threadId}: ${err}`
      );
      return [] as any[];
    }
  }

  private mergeRecallWithPrismaMessages(
    recalled: any[],
    prismaMessages: any[]
  ) {
    const byId = new Map<string, any>();
    for (const message of recalled || []) {
      if (message?.id) {
        byId.set(String(message.id), message);
      }
    }
    for (const message of prismaMessages || []) {
      if (!message?.id) {
        continue;
      }
      if (!byId.has(String(message.id))) {
        byId.set(String(message.id), message);
      }
    }
    const merged = Array.from(byId.values());
    merged.sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
    return merged;
  }

  // When the model burns tool steps and goes silent on a draft request,
  // create the draft from the selected channel + caption in the prompt.
  private async tryCreateSilentDraft(
    organizationId: string,
    detail: string,
    req: Request
  ): Promise<{ ok: boolean; message: string }> {
    const integrationId = selectedIntegrationIdFromRequest(req, detail);
    if (!integrationId) {
      return {
        ok: false,
        message:
          'I could not save a draft because no channel is selected. ' +
          'Select a connected channel on the left, then ask me again to create the draft.',
      };
    }

    try {
      const integration = await this._integrationService.getIntegrationById(
        organizationId,
        integrationId
      );
      if (!integration) {
        return {
          ok: false,
          message: `I could not find the selected channel (${integrationId}). Reconnect it under Add Channel, then try again.`,
        };
      }

      const caption = extractDraftCaption(detail);
      const html = `<p>${escapeHtmlText(caption)}</p>`;
      const output = await this._postsService.createPost(
        organizationId,
        {
          date: new Date().toISOString(),
          type: 'draft',
          shortLink: false,
          tags: [],
          posts: [
            {
              integration,
              group: makeId(10),
              settings: {
                __type: integration.providerIdentifier,
              } as AllProvidersSettings,
              value: [
                {
                  content: html,
                  id: makeId(10),
                  delay: 0,
                  image: [],
                },
              ],
            },
          ],
        },
        'MCP'
      );

      const postId = output?.[0]?.postId;
      const previewUrl = postId
        ? `${process.env.FRONTEND_URL}/p/${postId}?share=true`
        : '';
      const channelLabel =
        integration.name || integration.providerIdentifier || 'channel';
      return {
        ok: true,
        message:
          `Saved your ${channelLabel} draft to Calendar → Draft` +
          (previewUrl ? `.\n\nPreview: ${previewUrl}` : '.') +
          `\n\nCaption: "${caption}"`,
      };
    } catch (err) {
      const message =
        (err as any)?.response?.message ||
        (err instanceof Error ? err.message : String(err));
      Logger.warn(`Silent draft recovery failed: ${message}`);
      return {
        ok: false,
        message:
          typeof message === 'string' && message.trim()
            ? `I could not save that draft: ${message}`
            : 'I could not save that draft. Please try again with a connected channel selected.',
      };
    }
  }

  // Silent runs often never persist an assistant row; write one so reload
  // shows the same fallback the SSE client received (when the socket was open).
  private async persistFallbackAssistantMessage(
    threadId: string,
    resourceId: string,
    text: string
  ) {
    const now = new Date();
    const id = `fallback-${threadId.slice(0, 8)}-${now.getTime().toString(36)}`;
    try {
      await this._prisma.mastra_messages.create({
        data: {
          id,
          thread_id: threadId,
          resourceId,
          role: 'assistant',
          type: 'text',
          content: JSON.stringify({
            format: 2,
            parts: [{ type: 'text', text }],
            content: text,
          }),
          createdAt: now,
        },
      });
      await this.ensureAgentThread(threadId, resourceId, 'Chat');
    } catch (err) {
      Logger.warn(
        `Could not persist silent-agent fallback message for ${threadId}: ${err}`
      );
    }
  }

  private async shouldRefundAfterAgentRun(
    mastra: Awaited<ReturnType<MastraService['mastra']>>,
    organizationId: string,
    threadId: string
  ) {
    // Prefer Prisma — Mastra recall can lag or miss when resourceId on the
    // message row was null, which is exactly when silent turns happen.
    let replyAfterUser = '';
    let sawUserTurn = false;

    for (let attempt = 0; attempt < 12; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      const rows = await this._prisma.mastra_messages.findMany({
        where: { thread_id: threadId },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      });

      let lastUserIndex = -1;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i]?.role === 'user') {
          lastUserIndex = i;
          break;
        }
      }
      if (lastUserIndex < 0) {
        // Fall back to Mastra recall once in case Prisma write is still pending.
        try {
          const memory = await mastra.getAgent('postiz').getMemory();
          const recalled = await memory.recall({
            resourceId: organizationId,
            threadId,
          });
          const messages = recalled?.messages || [];
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i]?.role === 'user') {
              lastUserIndex = i;
              sawUserTurn = true;
              replyAfterUser = messages
                .slice(i + 1)
                .filter((message: any) => message?.role === 'assistant')
                .map((message: any) => assistantTextFromMessage(message))
                .join(' ')
                .trim();
              break;
            }
          }
        } catch (err) {
          if (!/no thread found/i.test(String(err))) {
            throw err;
          }
        }
        if (sawUserTurn && replyAfterUser) {
          break;
        }
        continue;
      }

      sawUserTurn = true;
      replyAfterUser = rows
        .slice(lastUserIndex + 1)
        .filter((message) => message?.role === 'assistant')
        .map((message) =>
          this.plainTextFromStoredContent(message.content)
        )
        .join(' ')
        .trim();
      if (replyAfterUser) {
        break;
      }
    }

    if (!sawUserTurn) {
      return false;
    }
    return shouldRefundAgentMessage(replyAfterUser);
  }
}
