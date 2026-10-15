export type FeaturePage = {
  slug: string;
  title: string;
  sticker: string;
  stickerVariant?: 'butter' | 'lime' | 'peach';
  headline: string;
  subtitle: string;
  description: string;
  sections: { title: string; body: string }[];
  ctaTitle?: string;
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: 'calendar',
    title: 'Content Calendar',
    sticker: 'Calendar',
    stickerVariant: 'lime',
    headline: 'See your whole content week at a glance.',
    subtitle:
      'Day, week, month, and list views for drafts, scheduled posts, and published history.',
    description:
      'Plan drafts and scheduled posts with Zyntra day, week, month, and list calendar views.',
    sections: [
      {
        title: 'Multiple views',
        body: 'Switch between day, week, month, and list layouts for the same queue.',
      },
      {
        title: 'Status filters',
        body: 'Focus on drafts, scheduled items, or published posts when you need clarity.',
      },
      {
        title: 'Launch from the grid',
        body: 'Open the composer directly from the calendar to create or edit posts.',
      },
      {
        title: 'On-time publishing',
        body: 'Scheduled posts run through background workflows at the set time.',
      },
    ],
    ctaTitle: 'Build your calendar in minutes',
  },
  {
    slug: 'publishing',
    title: 'Social Publishing',
    sticker: 'Publishing',
    stickerVariant: 'peach',
    headline: 'Publish to every connected channel from one composer.',
    subtitle:
      'Write the post, attach media, tune platform settings, then schedule or send now.',
    description:
      'Compose once and publish to YouTube, TikTok, Instagram, LinkedIn, and Facebook Pages.',
    sections: [
      {
        title: 'One launch flow',
        body: 'Create a post once and choose which connected channels should receive it.',
      },
      {
        title: 'Platform settings',
        body: 'Use provider options like YouTube tags, TikTok privacy, and page targets.',
      },
      {
        title: 'Schedule or post now',
        body: 'Send immediately or queue for the calendar — publishing runs in the background.',
      },
      {
        title: 'Drafts and previews',
        body: 'Save work in progress and preview how posts will look before they go live.',
      },
    ],
    ctaTitle: 'Publish your next post with Zyntra',
  },
  {
    slug: 'ai',
    title: 'AI Content',
    sticker: 'AI tools',
    headline: 'AI that drafts. You decide what ships.',
    subtitle:
      'Generate captions, media, and clips inside Zyntra — then edit and approve before publishing.',
    description:
      'Use Zyntra AI to draft posts, generate images and video, and clip long-form content.',
    sections: [
      {
        title: 'AI agent chat',
        body: 'Ask the agent to help schedule posts, prepare media, and move work forward.',
      },
      {
        title: 'Post generator',
        body: 'Create short or long drafts, threads, and hooks with selectable tones.',
      },
      {
        title: 'Images, video, clips',
        body: 'Spend coins and plan credits for images; video and clipping use plan quotas.',
      },
      {
        title: 'Human in the loop',
        body: 'Nothing publishes until you review and schedule it from the calendar.',
      },
    ],
    ctaTitle: 'Try AI drafts on your next post',
  },
  {
    slug: 'analytics',
    title: 'Analytics',
    sticker: 'Analytics',
    stickerVariant: 'peach',
    headline: 'Know what is working across your channels.',
    subtitle:
      'Review followers, views, engagement, and post-level metrics from connected platforms.',
    description:
      'Track channel performance in Zyntra for YouTube, TikTok, Instagram, and LinkedIn Pages.',
    sections: [
      {
        title: 'YouTube metrics',
        body: 'Subscribers, views, engagement rate, and per-video performance.',
      },
      {
        title: 'TikTok metrics',
        body: 'Followers, likes, views, comments, shares, and recent video stats.',
      },
      {
        title: 'Instagram metrics',
        body: 'Follower count, reach, and post engagement for connected accounts.',
      },
      {
        title: 'LinkedIn Page metrics',
        body: 'Page views, followers, clicks, shares, and post impressions.',
      },
    ],
    ctaTitle: 'Measure what you publish',
  },
  {
    slug: 'media',
    title: 'Media Library',
    sticker: 'Media',
    stickerVariant: 'lime',
    headline: 'Keep every asset ready for the next post.',
    subtitle:
      'Upload, organize, and reuse images and video across campaigns and channels.',
    description:
      'Zyntra media library for uploading, organizing, and reusing creative assets.',
    sections: [
      {
        title: 'Upload and browse',
        body: 'Drag, drop, paste, and paginate through your creative library.',
      },
      {
        title: 'Reuse everywhere',
        body: 'Attach library media from the composer and calendar workflows.',
      },
      {
        title: 'Design tools',
        body: 'Open the built-in editor when you need quick creative changes.',
      },
      {
        title: 'AI media entry points',
        body: 'Generate images or video when your plan and coins allow it.',
      },
    ],
    ctaTitle: 'Stock your media library',
  },
  {
    slug: 'teams',
    title: 'Team Collaboration',
    sticker: 'Teams',
    stickerVariant: 'lime',
    headline: 'Collaborate without losing the calendar.',
    subtitle:
      'Share a workspace, invite members, and keep publishing decisions in one place.',
    description:
      'Invite teammates, assign ADMIN or USER roles, and manage organizations in Zyntra.',
    sections: [
      {
        title: 'Team invites',
        body: 'Add teammates from Settings when your plan includes team members.',
      },
      {
        title: 'Roles that matter',
        body: 'Assign ADMIN or USER roles so access matches how your group works.',
      },
      {
        title: 'Organizations',
        body: 'Switch between organizations when you manage more than one workspace.',
      },
      {
        title: 'Shared calendar',
        body: 'Plan and review posts together instead of scattering files and chats.',
      },
    ],
    ctaTitle: 'Bring your team onto one calendar',
  },
  {
    slug: 'autopost',
    title: 'RSS Autopost',
    sticker: 'Automation',
    headline: 'Turn new RSS items into social posts.',
    subtitle:
      'Watch a feed and queue fresh items for publishing on supported plans.',
    description:
      'Zyntra RSS autopost converts new feed items into social posts on TEAM+ plans.',
    sections: [
      {
        title: 'Connect a feed',
        body: 'Point Zyntra at an RSS source you already publish from.',
      },
      {
        title: 'Auto-create posts',
        body: 'New items become social posts you can review or schedule.',
      },
      {
        title: 'Stay consistent',
        body: 'Keep channels active without manually copying every article.',
      },
      {
        title: 'Plan availability',
        body: 'RSS autopost unlocks on TEAM, PRO, and ULTIMATE tiers.',
      },
    ],
    ctaTitle: 'Automate your next feed',
  },
  {
    slug: 'api',
    title: 'Webhooks & API',
    sticker: 'Developers',
    stickerVariant: 'peach',
    headline: 'Connect Zyntra to the rest of your stack.',
    subtitle:
      'Use the public API and webhooks to automate publishing and react to events.',
    description:
      'Zyntra public API and webhooks for connecting external tools on paid plans.',
    sections: [
      {
        title: 'Public API',
        body: 'Integrate scheduling and channel workflows into your own tools.',
      },
      {
        title: 'Webhooks',
        body: 'Receive events when posts and workflows need follow-up actions.',
      },
      {
        title: 'Paid plan access',
        body: 'API and webhook limits scale with STANDARD and higher tiers.',
      },
      {
        title: 'Built for operators',
        body: 'Pair with MCP and agent tools when you want chat-driven automation.',
      },
    ],
    ctaTitle: 'Connect your tooling',
  },
  {
    slug: 'platforms',
    title: 'Supported Platforms',
    sticker: 'Integrations',
    headline: 'Six platforms. One publishing workflow.',
    subtitle:
      'Connect YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page.',
    description:
      'Zyntra supports YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page.',
    sections: [
      {
        title: 'YouTube',
        body: 'Upload videos and Shorts with titles, tags, and notify options.',
      },
      {
        title: 'TikTok',
        body: 'Publish TikToks with privacy and platform-specific settings.',
      },
      {
        title: 'Instagram',
        body: 'Post to Instagram with standalone account connection.',
      },
      {
        title: 'LinkedIn & Facebook',
        body: 'Share to personal LinkedIn, LinkedIn Pages, and Facebook Pages.',
      },
    ],
    ctaTitle: 'Connect your first channel',
  },
  {
    slug: 'mcp',
    title: 'MCP Integration',
    sticker: 'MCP',
    stickerVariant: 'lime',
    headline: 'Run Zyntra from the AI tools you already use.',
    subtitle:
      'Connect Model Context Protocol clients so assistants can help schedule and manage posts.',
    description:
      'Zyntra MCP connects Cursor, Claude, ChatGPT, and other clients to schedule and manage social posts.',
    sections: [
      {
        title: 'Chat-driven publishing',
        body: 'Ask your AI client to draft, schedule, or check posts through Zyntra MCP.',
      },
      {
        title: 'Works with popular clients',
        body: 'Connect Cursor, Claude, ChatGPT, VS Code, Windsurf, and other MCP-ready tools.',
      },
      {
        title: 'OAuth or API key',
        body: 'Authorize with OAuth where supported, or use your organization API key.',
      },
      {
        title: 'Settings → MCP',
        body: 'Generate connectors and copy config from the MCP tab inside the dashboard.',
      },
    ],
    ctaTitle: 'Connect your AI client',
  },
];

export const FEATURE_SLUGS = FEATURE_PAGES.map((f) => f.slug);

export function getFeaturePage(slug: string): FeaturePage | undefined {
  return FEATURE_PAGES.find((f) => f.slug === slug);
}

/** Cards shown on /features overview */
export const FEATURE_OVERVIEW_CARDS = [
  {
    title: 'Content calendar',
    body: 'Plan drafts and scheduled posts in day, week, month, or list views.',
    href: '/features/calendar',
  },
  {
    title: 'Social publishing',
    body: 'Compose posts with platform-specific settings and publish on time.',
    href: '/features/publishing',
  },
  {
    title: 'AI content tools',
    body: 'Use the agent and generators for captions, images, video, and clips.',
    href: '/features/ai',
  },
  {
    title: 'Analytics',
    body: 'Review channel performance for YouTube, TikTok, Instagram, and LinkedIn Pages.',
    href: '/features/analytics',
  },
  {
    title: 'Media library',
    body: 'Upload, organize, and reuse creative assets across campaigns.',
    href: '/features/media',
  },
  {
    title: 'Team collaboration',
    body: 'Invite teammates with roles on plans that include team members.',
    href: '/features/teams',
  },
  {
    title: 'RSS autopost',
    body: 'Turn new RSS items into social posts on supported TEAM+ plans.',
    href: '/features/autopost',
  },
  {
    title: 'Webhooks & API',
    body: 'Connect external tools with webhooks and public API access on paid plans.',
    href: '/features/api',
  },
  {
    title: 'MCP integration',
    body: 'Let Cursor, Claude, ChatGPT, and other MCP clients schedule through Zyntra.',
    href: '/features/mcp',
  },
  {
    title: 'Supported platforms',
    body: 'YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page.',
    href: '/features/platforms',
  },
] as const;
