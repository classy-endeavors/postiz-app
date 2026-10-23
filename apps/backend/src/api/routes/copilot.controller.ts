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
    private _coinsService: CoinsService,
    private _prisma: PrismaService
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

    return this._coinsService.spend(
      organization.id,
      'message',
      async () =>
        awaitAgentHttpResponse(copilotRuntimeHandler, req, res),
      detail,
      async () => {
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
    try {
      const recalled = await memory.recall({
        resourceId: organization.id,
        threadId,
      });
      if ((recalled?.messages || []).length > 0) {
        const firstUser = (recalled.messages || []).find(
          (m: any) => m?.role === 'user'
        );
        await this.ensureAgentThread(
          threadId,
          organization.id,
          titleFromUserText(assistantTextFromMessage(firstUser) || '')
        );
      }
      return recalled;
    } catch (err) {
      Logger.warn(`Could not recall messages for thread ${threadId}: ${err}`);
      return { messages: [] };
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
