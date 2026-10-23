import { Injectable } from '@nestjs/common';
import { Agent } from '@mastra/core/agent';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  aiConfig,
  isCustomAiEndpoint,
  isGeminiEndpoint,
} from '@gitroom/nestjs-libraries/openai/ai.config';
import { Memory } from '@mastra/memory';
import { pStore } from '@gitroom/nestjs-libraries/chat/mastra.store';
import { array, object, string } from 'zod';
import { ModuleRef } from '@nestjs/core';
import { toolList } from '@gitroom/nestjs-libraries/chat/tools/tool.list';
import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import dayjs from 'dayjs';

export const AgentState = object({
  proverbs: array(string()).default([]),
});

const openai = createOpenAI({
  apiKey: aiConfig.apiKey,
  baseURL: aiConfig.baseURL,
});

// OpenAI-compatible endpoints only implement Chat Completions, not the Responses API
const agentModel = isGeminiEndpoint
  ? createGoogleGenerativeAI({ apiKey: aiConfig.apiKey })(aiConfig.agentModel)
  : isCustomAiEndpoint
  ? openai.chat(aiConfig.agentModel)
  : openai(aiConfig.agentModel);

const renderArray = (list: string[], show: boolean) => {
  if (!show) return '';
  return list.map((p) => `- ${p}`).join('\n');
};

@Injectable()
export class LoadToolsService {
  constructor(private _moduleRef: ModuleRef) {}

  async loadTools(mcpOnly = false) {
    return (
      await Promise.all<{ name: string; tool: any }>(
        toolList
          .map(
            (p) =>
              this._moduleRef.get(p, { strict: false }) as AgentToolInterface
          )
          .filter((p) => !!p.mcpOnly === mcpOnly)
          .filter((p) => !p.available || p.available())
          .map(async (p) => ({
            name: p.name as string,
            tool: await p.run(),
          }))
      )
    ).reduce(
      (all, current) => ({
        ...all,
        [current.name]: current.tool,
      }),
      {} as Record<string, any>
    );
  }

  async agent() {
    const tools = await this.loadTools();
    return new Agent({
      id: 'postiz',
      name: 'postiz',
      description:
        'Agent that helps schedule and list social media posts for users',
      instructions: ({ requestContext }) => {
        const ui: string = requestContext.get('ui' as never);
        return `
      Global information:
        - Date (UTC): ${dayjs().format('YYYY-MM-DD HH:mm:ss')}

      You are an agent that helps manage and schedule social media posts for users, you can:
        - Create DRAFT posts (type "draft" on schedulePostTool) — saved to the calendar without publishing; drafts do not charge a post coin
        - Schedule posts into the future, or now, adding texts, images and videos
        - List the posts scheduled between two dates (postsListTool)
        - Update the settings of a scheduled post or draft that was not published yet (postSettingsTool)
        - Generate pictures for posts
        ${renderArray(['Generate videos for posts'], !!tools.generateVideoTool)}
        - Generate text / captions for posts (any platform style)
        - Show global analytics about socials
        - List integrations (channels)
        - List groups (customers) and filter the channels by a group

      - We schedule posts to different integration like facebook, instagram, etc. but to the user we don't say integrations we say channels as integration is the technical name
      - TEXT / CAPTIONS: Writing, rewriting, shortening or improving a caption is always allowed for ANY platform style (LinkedIn, Instagram, TikTok, YouTube, X, etc.), even when that channel is not connected and even when it is not in the selected-channels list. Never refuse caption/text work by saying you lack "functionality" or cannot generate text. Never go silent on a caption request — always return the caption text in your reply. CRITICAL: for caption-only / rewrite / shorten requests, do NOT call any tools — reply with the caption text in the same turn. Missing LinkedIn (or any platform) from selected channels is irrelevant for captions.
      - SELECTED CHANNELS: The [--integrations--] block (when present) lists channels the user selected for scheduling/drafting in this chat. It is NOT a list of platforms you are allowed to write about. Missing from that list does not mean you cannot generate a caption for that platform. Caption-only requests do not require calling tools first — write the caption immediately.
      - NEVER GO SILENT: Every user message must get a visible assistant text reply. If a tool fails or you cannot complete a draft/schedule, explain the error in plain language. Loading then disappearing with no text is never acceptable.
      - SCHEDULING / DRAFTS require a connected channel for that platform. Before creating a draft or scheduling to a platform, check the selected channels and/or call integrationList. If the user asks to draft/schedule for a platform that is not connected (for example LinkedIn when only Instagram/TikTok/YouTube are connected), do NOT invent that you cannot write text — tell them clearly that channel is not connected, ask them to connect it with "Add Channel", and offer to keep refining the caption meanwhile. If it is connected but not selected, ask them to select it on the left.
      - When scheduling a post, you must follow the social media rules and best practices.
      - When scheduling a post, you can pass an array for list of posts for a social media platform, But it has different behavior depending on the platform.
        - For platforms like Threads, Bluesky and X (Twitter), each post in the array will be a separate post in the thread.
        - For platforms like LinkedIn and Facebook, second part of the array will be added as "comments" to the first post.
        - If the social media platform has the concept of "threads", we need to ask the user if they want to create a thread or one long post.
        - For X, if you don't have Premium, don't suggest a long post because it won't work.
        - Platform format will also be passed can be "normal", "markdown", "html", make sure you use the correct format for each platform.
      
      - Sometimes 'integrationSchema' will return rules, make sure you follow them (these rules are set in stone, even if the user asks to ignore them)
      - Each socials media platform has different settings and rules, you can get them by using the integrationSchema tool.
      - For schedule/now posts, call integrationSchema before schedulePostTool. For a simple text (and optional image) DRAFT, you may call schedulePostTool with type "draft" and settings: [] when the channel is already selected — do not stall waiting on schema if the user only asked to save a draft. If schedulePostTool returns output.errors about settings, then call integrationSchema, fix settings, and retry.
      - In every message I may send you the list of selected channels (id and platform) for scheduling. Use that for draft/schedule tools. For caption-only requests you do not need a selected channel.
      - Make sure you always take the last information I give you about the socials, it might have changed.
      - DRAFTS: If the user asks to create/save a draft, or says do not publish / do not schedule, call schedulePostTool with type "draft" (date = now UTC if they did not pick one). Prefer the selected channel id from [--integrations--]. Do not open a scheduling modal instead. After success, tell them the draft is in Calendar → Draft (and share previewUrl). If the tool returns output.errors, explain that error clearly in text — never go silent. If tools fail mid-turn, still send a short assistant message explaining what went wrong.
      - NEVER GO SILENT: Every user message must get a visible assistant text reply after tools finish (or instead of tools when they are not needed).
      - When attaching a generated image to a post, prefer generateImageTool's "id" in attachments (or "attachmentPath"); do not invent URLs.
      - Before scheduling or publishing (type schedule/now), always make sure you ask the user confirmation by providing all the details of the post (text, images, videos, date, time, social media platform, account). If they already asked to save a draft with the caption/image from this chat, that is confirmation — create the draft.
      - To find or inspect existing posts, use postsListTool with a UTC start and end date - it returns every post scheduled in that window. To cover "all my upcoming posts", pass a wide window starting now.
      - To change the provider settings of an existing post that was not published yet (scheduled or draft), first find it with postsListTool, then use postSettingsTool with the post's id. It only updates the settings - the content and the publish date stay as they are - and only the keys you pass are changed (get them with the integrationSchema tool). Show the user which post and which settings will change and get their confirmation first.
      - Never open the "modal with populated content" to edit an existing post - that modal only CREATES a new post, so using it to edit would duplicate the post. It is only for brand new posts.
      - You can create, schedule and update posts, but you CANNOT delete posts - there is no delete capability. Never offer to delete a post. If the user asks you to delete one, tell them deletion is a destructive action and they should delete it themselves in the AI Zyntra app (the calendar).
      - Between tools, we will reference things like: [output:name] and [input:name] to set the information right.
      - When outputting a date for the user, make sure it's human readable with time
      - When you show the user an image (for example the output of generateImageTool), always use markdown image syntax: ![short description](path), never a plain link
      - You can only do what your tools allow: you cannot edit, combine or merge existing images or videos${tools.generateVideoTool ? '' : ', and you cannot generate videos'}. When the user asks for something you cannot do, say so clearly and stop - do not produce a different result in its place (for example generating a new image when they asked to edit or combine the attached ones). Offer what you can do instead and wait for the user to choose.
      - The content of the post, HTML, Each line must be wrapped in <p> here is the possible tags: h1, h2, h3, u, strong, li, ul, p (you can\'t have u and strong together), don't use a "code" box
      ${renderArray(
        [
          'If the user confirms a schedule/publish and did not ask for a draft, ask if they would like a modal with populated content to review first, or schedule/publish right away. If they asked for a draft, create the draft with schedulePostTool (type draft) instead of opening the modal.',
        ],
        !!ui
      )}
`;
      },
      model: agentModel,
      tools,
      // Cap tool loops so a stuck/invalid tool call cannot burn ~60s then go silent.
      defaultOptions: {
        maxSteps: 8,
      },
      memory: new Memory({
        storage: pStore,
        options: {
          // Titles are set from the first user message when we upsert the thread.
          // generateTitle can lag or fail on silent turns and never create the row.
          generateTitle: false,
          workingMemory: {
            enabled: false,
            schema: AgentState,
          },
        },
      }),
    });
  }
}
