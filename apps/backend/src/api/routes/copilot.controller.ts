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

export type ChannelsContext = {
  integrations: string;
  organization: string;
  ui: string;
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

// CopilotKit pipes the agent stream and resolves before the run finishes.
// Coin refundIf must wait until the response closes or silence is mis-read.
const awaitAgentHttpResponse = async (
  handler: (req: Request, res: Response) => unknown,
  req: Request,
  res: Response
) => {
  const finished = new Promise<void>((resolve, reject) => {
    const done = () => resolve();
    res.once('finish', done);
    res.once('close', done);
    res.once('error', reject);
  });
  await Promise.resolve(handler(req, res));
  if (!res.writableEnded) {
    await finished;
  }
};

@Controller('/copilot')
export class CopilotController {
  constructor(
    private _subscriptionService: SubscriptionService,
    private _mastraService: MastraService,
    private _coinsService: CoinsService
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

    return this._coinsService.spend(
      organization.id,
      'message',
      async () =>
        awaitAgentHttpResponse(copilotRuntimeHandler, req, res),
      userMessageText(req),
      async () => {
        const threadId = threadIdFromRequest(req);
        if (!threadId || threadId === 'new') {
          return false;
        }
        try {
          const memory = await mastra.getAgent('postiz').getMemory();
          // Wait until the HTTP stream finished (above), then retry recall —
          // Mastra can still lag briefly after RUN_FINISHED.
          // Only refund when we have seen the user turn and the assistant text
          // after it is empty or a text-capability refusal. Empty recall / missing
          // thread must not refund — that incorrectly zeroed successful captions.
          let replyAfterUser = '';
          let sawUserTurn = false;
          for (let attempt = 0; attempt < 12; attempt++) {
            if (attempt > 0) {
              await new Promise((resolve) => setTimeout(resolve, 400));
            }
            try {
              const recalled = await memory.recall({
                resourceId: organization.id,
                threadId,
              });
              const messages = recalled?.messages || [];
              let lastUserIndex = -1;
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i]?.role === 'user') {
                  lastUserIndex = i;
                  break;
                }
              }
              if (lastUserIndex < 0) {
                continue;
              }
              sawUserTurn = true;
              replyAfterUser = messages
                .slice(lastUserIndex + 1)
                .filter((message: any) => message?.role === 'assistant')
                .map((message: any) => assistantTextFromMessage(message))
                .join(' ')
                .trim();
              if (replyAfterUser) {
                break;
              }
            } catch (err) {
              if (/no thread found/i.test(String(err))) {
                continue;
              }
              throw err;
            }
          }
          if (!sawUserTurn) {
            return false;
          }
          return shouldRefundAgentMessage(replyAfterUser);
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
    const mastra = await this._mastraService.mastra();
    const memory = await mastra.getAgent('postiz').getMemory();
    try {
      const list = await memory.listThreads({
        filter: { resourceId: organization.id },
        perPage: false,
        page: 0,
        orderBy: { field: 'updatedAt', direction: 'DESC' },
      });

      const threads = (list.threads || []).map((p) => ({
        id: p.id,
        title: p.title || 'Chat',
      }));

      // Silent / failed agent runs can persist messages without a thread row
      // (title generation never runs). Merge any missing ids from messages.
      const known = new Set(threads.map((t) => t.id));
      const fromMessages = await this.threadsFromMessages(
        memory,
        organization.id,
        known
      );
      for (const extra of fromMessages) {
        if (!known.has(extra.id)) {
          threads.unshift(extra);
          known.add(extra.id);
        }
      }

      return { threads };
    } catch (err) {
      Logger.warn(`Could not list agent threads: ${err}`);
      try {
        const fromMessages = await this.threadsFromMessages(
          await mastra.getAgent('postiz').getMemory(),
          organization.id,
          new Set()
        );
        return { threads: fromMessages };
      } catch (fallbackErr) {
        Logger.warn(`Could not rebuild agent threads from messages: ${fallbackErr}`);
        return { threads: [] };
      }
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
    try {
      return await memory.recall({
        resourceId: organization.id,
        threadId,
      });
    } catch (err) {
      Logger.warn(`Could not recall messages for thread ${threadId}: ${err}`);
      return { messages: [] };
    }
  }

  // Mastra's getMemory() typing omits listMessagesByResourceId / createThread
  // that exist on the runtime Memory instance — keep this helper untyped.
  private async threadsFromMessages(
    memory: any,
    resourceId: string,
    alreadyListed: Set<string>
  ): Promise<{ id: string; title: string }[]> {
    const listed = await memory.listMessagesByResourceId({
      resourceId,
      perPage: false,
    });
    const byThread = new Map<
      string,
      { id: string; title: string; updatedAt: number }
    >();

    for (const message of listed.messages || []) {
      const threadId = message?.threadId || message?.thread_id;
      if (!threadId || typeof threadId !== 'string') {
        continue;
      }
      if (alreadyListed.has(threadId)) {
        continue;
      }
      const raw = assistantTextFromMessage(message) || '';
      const text = raw
        .replace(/\[--integrations--\][\s\S]*?(?:\[--integrations--\]|$)/g, '')
        .replace(/\[--Media--\][\s\S]*?(?:\[--Media--\]|$)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const created = new Date(
        message?.createdAt || message?.createdAtZ || 0
      ).getTime();
      const existing = byThread.get(threadId);
      if (!existing) {
        const title =
          message?.role === 'user' && text ? text.slice(0, 60) || 'Chat' : 'Chat';
        byThread.set(threadId, { id: threadId, title, updatedAt: created });
      } else if (message?.role === 'user' && text && existing.title === 'Chat') {
        existing.title = text.slice(0, 60) || 'Chat';
      }
      if (created > (byThread.get(threadId)?.updatedAt || 0)) {
        byThread.get(threadId)!.updatedAt = created;
      }
    }

    const threads = [...byThread.values()].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    // Persist missing thread rows so the next listThreads call succeeds.
    for (const thread of threads) {
      try {
        await memory.createThread({
          threadId: thread.id,
          resourceId,
          title: thread.title,
        });
      } catch {
        // Already exists or storage rejected — still return it for the sidebar.
      }
    }

    return threads.map((p) => ({ id: p.id, title: p.title }));
  }
}
