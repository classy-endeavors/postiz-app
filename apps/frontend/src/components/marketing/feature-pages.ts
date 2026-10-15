export type FeatureSection = {
  title: string;
  body: string;
  icon?: string;
};

export type FeatureStep = {
  title: string;
  body: string;
};

export type FeaturePage = {
  slug: string;
  title: string;
  sticker: string;
  stickerVariant?: 'butter' | 'lime' | 'peach';
  headline: string;
  subtitle: string;
  description: string;
  /** Used in the cream split section — never under the hero CTAs */
  storyTitle: string;
  storyBody: string;
  storyPoints: string[];
  howItWorks: FeatureStep[];
  sections: FeatureSection[];
  bandTitle?: string;
  bandBody?: string;
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
    storyTitle: 'One grid instead of five tabs.',
    storyBody:
      'The calendar is your publishing home base. Move posts, filter by status, and open the composer without leaving the grid.',
    storyPoints: [
      'Switch day, week, month, or list without losing filters',
      'Drag posts onto the right slot',
      'Open drafts and edits from any cell',
      'Background jobs publish when the clock hits',
    ],
    howItWorks: [
      {
        title: 'Pick a view',
        body: 'Start in day, week, month, or list — whichever matches how you plan.',
      },
      {
        title: 'Place the post',
        body: 'Add or drag content onto the slot that fits your schedule.',
      },
      {
        title: 'Filter the queue',
        body: 'Focus on drafts, scheduled items, or published history.',
      },
      {
        title: 'Let it ship',
        body: 'Zyntra publishes through background jobs at the scheduled time.',
      },
    ],
    sections: [
      {
        title: 'Multiple views',
        body: 'Switch layouts without losing your queue or filters.',
      },
      {
        title: 'Status filters',
        body: 'Focus on drafts, scheduled posts, or published history.',
      },
      {
        title: 'Launch from the grid',
        body: 'Create and edit posts directly from any calendar cell.',
      },
      {
        title: 'On-time publishing',
        body: 'Background jobs send posts when the clock hits your schedule.',
      },
    ],
    bandTitle: 'Plan once. Publish on time.',
    bandBody: 'Team comments on calendar items help collaborators stay aligned.',
    ctaTitle: 'Build your calendar in minutes',
  },
  {
    slug: 'publishing',
    title: 'Social Publishing',
    sticker: 'Publishing',
    stickerVariant: 'peach',
    headline: 'Publish to every connected channel from one composer.',
    subtitle:
      'Write once, attach media, set platform options, then schedule or send now.',
    description:
      'Compose once and publish to YouTube, TikTok, Instagram, LinkedIn, and Facebook Pages.',
    storyTitle: 'One launch flow. Channel-aware settings.',
    storyBody:
      'Captions, media, and platform options live in a single composer so you are not rebuilding the same post six times.',
    storyPoints: [
      'Select every channel that should receive the post',
      'Tune YouTube tags, TikTok privacy, and page targets',
      'Schedule for later or publish immediately',
      'Save drafts and preview before anything goes live',
    ],
    howItWorks: [
      {
        title: 'Open the composer',
        body: 'Start from the calendar or a blank launch.',
      },
      {
        title: 'Add copy and media',
        body: 'Write captions and pull assets from your library.',
      },
      {
        title: 'Choose destinations',
        body: 'Pick channels and adjust platform-specific settings.',
      },
      {
        title: 'Schedule or send',
        body: 'Queue for later or publish right away through background jobs.',
      },
    ],
    sections: [
      {
        title: 'One launch flow',
        body: 'Select every connected channel that should receive the post.',
      },
      {
        title: 'Platform settings',
        body: 'Use YouTube tags, TikTok privacy, and page targets where needed.',
      },
      {
        title: 'Schedule or now',
        body: 'Queue for the calendar or send right away through background jobs.',
      },
      {
        title: 'Drafts and previews',
        body: 'Save work in progress and preview before anything goes live.',
      },
    ],
    bandTitle: 'Drafts stay free.',
    bandBody: 'Scheduling a post costs 2 Zyntra Coins per channel.',
    ctaTitle: 'Publish your next post with Zyntra',
  },
  {
    slug: 'ai',
    title: 'AI Content',
    sticker: 'AI tools',
    headline: 'AI that drafts. You decide what ships.',
    subtitle:
      'Generate captions, media, and clips — then review before publishing.',
    description:
      'Use Zyntra AI to draft posts, generate images and video, and clip long-form content.',
    storyTitle: 'Faster first drafts. Human final say.',
    storyBody:
      'AI speeds up captions and media prep. You stay in control of every publish.',
    storyPoints: [
      'Agent chat for drafts and scheduling help',
      'Post generator with tones and formats',
      'Images, video, and clipping when your plan allows',
      'Nothing goes live until you approve it',
    ],
    howItWorks: [
      {
        title: 'Open AI tools',
        body: 'Use the agent or post generator from the dashboard.',
      },
      {
        title: 'Describe the goal',
        body: 'Share topic, tone, audience, or format.',
      },
      {
        title: 'Edit the draft',
        body: 'Keep what fits your voice and cut the rest.',
      },
      {
        title: 'Schedule when ready',
        body: 'Move approved content onto the calendar.',
      },
    ],
    sections: [
      {
        title: 'AI agent chat',
        body: 'Ask for scheduling help, drafts, and media prep in one thread.',
      },
      {
        title: 'Post generator',
        body: 'Create short or long drafts, threads, and hooks with selectable tones.',
      },
      {
        title: 'Images and video',
        body: 'Images use coins plus plan credits. Video and clipping use plan quotas.',
      },
      {
        title: 'Human in the loop',
        body: 'Nothing publishes until you approve and schedule it.',
      },
    ],
    bandTitle: 'Coins keep usage clear.',
    bandBody: 'Agent messages cost 1 coin. AI images cost 5 coins each.',
    ctaTitle: 'Try AI drafts on your next post',
  },
  {
    slug: 'analytics',
    title: 'Analytics',
    sticker: 'Analytics',
    stickerVariant: 'peach',
    headline: 'Know what is working across your channels.',
    subtitle:
      'Review followers, views, engagement, and post-level metrics in one place.',
    description:
      'Track channel performance in Zyntra for YouTube, TikTok, Instagram, and LinkedIn Pages.',
    storyTitle: 'Signal without tab-hopping.',
    storyBody:
      'Pick a connected channel and read the metrics that matter for that platform — then plan the next post with clearer signal.',
    storyPoints: [
      'YouTube subscribers, views, and video stats',
      'TikTok followers, likes, views, and shares',
      'Instagram reach and engagement',
      'LinkedIn Page views, clicks, and impressions',
    ],
    howItWorks: [
      {
        title: 'Open Analytics',
        body: 'Jump into analytics from the dashboard.',
      },
      {
        title: 'Select a channel',
        body: 'Choose a connected YouTube, TikTok, Instagram, or LinkedIn Page account.',
      },
      {
        title: 'Read the numbers',
        body: 'Review overview stats and post-level detail.',
      },
      {
        title: 'Plan the next block',
        body: 'Use what worked to shape your next calendar week.',
      },
    ],
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
    bandTitle: 'Measure what you publish.',
    bandBody: 'Facebook Page analytics may expand as the product evolves.',
    ctaTitle: 'Measure what you publish',
  },
  {
    slug: 'media',
    title: 'Media Library',
    sticker: 'Media',
    stickerVariant: 'lime',
    headline: 'Keep every asset ready for the next post.',
    subtitle:
      'Upload, organize, and reuse images and video across campaigns.',
    description:
      'Zyntra media library for uploading, organizing, and reusing creative assets.',
    storyTitle: 'Creative lives next to the calendar.',
    storyBody:
      'Stop digging through folders. Store assets once, then attach them from the composer whenever you schedule.',
    storyPoints: [
      'Upload images and video in one place',
      'Browse and reuse past assets',
      'Attach media while composing',
      'Generate AI media when coins and plan credits allow',
    ],
    howItWorks: [
      {
        title: 'Upload assets',
        body: 'Add images or video to the library.',
      },
      {
        title: 'Browse and reuse',
        body: 'Find past creative without re-uploading.',
      },
      {
        title: 'Attach in the composer',
        body: 'Drop library media into the next scheduled post.',
      },
      {
        title: 'Generate when needed',
        body: 'Use AI media entry points when your plan allows.',
      },
    ],
    sections: [
      {
        title: 'Upload and browse',
        body: 'Drag, drop, paste, and paginate through your creative library.',
      },
      {
        title: 'Reuse everywhere',
        body: 'Pull library media into calendar posts without re-uploading.',
      },
      {
        title: 'Design tools',
        body: 'Open the built-in editor for quick creative changes.',
      },
      {
        title: 'AI media entry points',
        body: 'Generate images or video when coins and plan credits allow.',
      },
    ],
    bandTitle: 'Assets ready when you schedule.',
    bandBody: 'One library feeds every channel you connect.',
    ctaTitle: 'Stock your media library',
  },
  {
    slug: 'teams',
    title: 'Team Collaboration',
    sticker: 'Teams',
    stickerVariant: 'lime',
    headline: 'Collaborate without losing the calendar.',
    subtitle:
      'Invite members, assign roles, and keep publishing in one workspace.',
    description:
      'Invite teammates, assign ADMIN or USER roles, and manage organizations in Zyntra.',
    storyTitle: 'Shared workspace. Clear ownership.',
    storyBody:
      'Share one calendar and media library so launches stay coordinated instead of scattered across chats.',
    storyPoints: [
      'Invite teammates from Settings',
      'Assign ADMIN or USER roles',
      'Switch organizations when you manage more than one brand',
      'Comment on posts without leaving Zyntra',
    ],
    howItWorks: [
      {
        title: 'Unlock team seats',
        body: 'Upgrade to a plan that includes team members.',
      },
      {
        title: 'Invite people',
        body: 'Send invites from Settings.',
      },
      {
        title: 'Assign roles',
        body: 'Keep access clear with ADMIN and USER permissions.',
      },
      {
        title: 'Publish together',
        body: 'Plan, review, and comment on the same calendar.',
      },
    ],
    sections: [
      {
        title: 'Team invites',
        body: 'Add people from Settings when your plan includes seats.',
      },
      {
        title: 'Roles that matter',
        body: 'Keep access clear with ADMIN and USER permissions.',
      },
      {
        title: 'Organizations',
        body: 'Switch workspaces when you manage more than one brand.',
      },
      {
        title: 'Shared calendar',
        body: 'Review and comment on posts without leaving Zyntra.',
      },
    ],
    bandTitle: 'Built for small publishing teams.',
    bandBody: 'Team features unlock on TEAM, PRO, and ULTIMATE tiers.',
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
    storyTitle: 'Keep channels moving from a feed you already run.',
    storyBody:
      'If you publish to RSS, Autopost can turn new items into social posts without copying every update by hand.',
    storyPoints: [
      'Connect an RSS source in Settings',
      'Map new items into a posting flow',
      'Review or schedule generated posts',
      'Available on TEAM, PRO, and ULTIMATE',
    ],
    howItWorks: [
      {
        title: 'Add a feed',
        body: 'Point Zyntra at an RSS source you already publish from.',
      },
      {
        title: 'Map the flow',
        body: 'Decide how new items become social posts.',
      },
      {
        title: 'Review the queue',
        body: 'Check generated posts before they go live.',
      },
      {
        title: 'Stay consistent',
        body: 'Keep channels active as the feed updates.',
      },
    ],
    sections: [
      {
        title: 'Connect a feed',
        body: 'Point Zyntra at an RSS source you already publish from.',
      },
      {
        title: 'Auto-create posts',
        body: 'New items become social posts ready for review.',
      },
      {
        title: 'Stay consistent',
        body: 'Fill the calendar without rebuilding every update manually.',
      },
      {
        title: 'Plan availability',
        body: 'RSS autopost unlocks on TEAM, PRO, and ULTIMATE.',
      },
    ],
    bandTitle: 'Automation with a review step.',
    bandBody: 'Fresh feed items become posts you can still approve.',
    ctaTitle: 'Automate your next feed',
  },
  {
    slug: 'api',
    title: 'Webhooks & API',
    sticker: 'Developers',
    stickerVariant: 'peach',
    headline: 'Connect Zyntra to the rest of your stack.',
    subtitle:
      'Use the public API and webhooks to automate publishing workflows.',
    description:
      'Zyntra public API and webhooks for connecting external tools on paid plans.',
    storyTitle: 'Dashboard when you want it. API when you need it.',
    storyBody:
      'Build custom flows around scheduling and events when the UI alone is not enough.',
    storyPoints: [
      'Public API for scheduling workflows',
      'Webhooks for follow-up actions',
      'Limits that scale with paid tiers',
      'Pairs cleanly with MCP for chat-driven ops',
    ],
    howItWorks: [
      {
        title: 'Open developer settings',
        body: 'Go to Settings → Public API / webhooks.',
      },
      {
        title: 'Create access',
        body: 'Generate keys and endpoint URLs.',
      },
      {
        title: 'Call or listen',
        body: 'Use the API or react to webhook events.',
      },
      {
        title: 'Combine with MCP',
        body: 'Let assistants drive work through the same product.',
      },
    ],
    sections: [
      {
        title: 'Public API',
        body: 'Integrate scheduling and channel workflows into your tools.',
      },
      {
        title: 'Webhooks',
        body: 'React when posts and workflows need follow-up actions.',
      },
      {
        title: 'Paid plan access',
        body: 'API and webhook limits scale with paid tiers.',
      },
      {
        title: 'Built for operators',
        body: 'Pair with MCP when you want assistants driving the work.',
      },
    ],
    bandTitle: 'Extend Zyntra without leaving the product.',
    bandBody: 'API, webhooks, and MCP cover different ways to operate.',
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
    storyTitle: 'Shared calendar. Channel-specific settings.',
    storyBody:
      'Each destination keeps its own options in the composer, while planning stays in one place.',
    storyPoints: [
      'Authorize channels with official OAuth',
      'Compose once and select destinations',
      'Keep platform settings in the same launch flow',
      'Publish or schedule from one calendar',
    ],
    howItWorks: [
      {
        title: 'Add a channel',
        body: 'Open Add Channel in the dashboard.',
      },
      {
        title: 'Authorize',
        body: 'Connect with the platform’s official OAuth flow.',
      },
      {
        title: 'Compose once',
        body: 'Write the post and pick every destination that should receive it.',
      },
      {
        title: 'Schedule together',
        body: 'Publish now or queue from the same calendar.',
      },
    ],
    sections: [
      {
        title: 'YouTube',
        body: 'Upload videos and Shorts with titles, tags, and subscriber notify options.',
        icon: '/icons/platforms/youtube.svg',
      },
      {
        title: 'TikTok',
        body: 'Publish TikToks with privacy levels and platform-specific settings.',
        icon: '/icons/platforms/tiktok.png',
      },
      {
        title: 'Instagram',
        body: 'Post to Instagram with a standalone account connection in Zyntra.',
        icon: '/icons/platforms/instagram.png',
      },
      {
        title: 'LinkedIn',
        body: 'Share updates from your personal LinkedIn profile on a schedule.',
        icon: '/icons/platforms/linkedin.png',
      },
      {
        title: 'LinkedIn Page',
        body: 'Publish to company pages and review LinkedIn Page engagement analytics.',
        icon: '/icons/platforms/linkedin-page.png',
      },
      {
        title: 'Facebook Page',
        body: 'Schedule posts to Facebook Pages from the same calendar and composer.',
        icon: '/icons/platforms/facebook.png',
      },
    ],
    bandTitle: 'Six integrations. No filler claims.',
    bandBody: 'Only these six channels are registered in the product today.',
    ctaTitle: 'Connect your first channel',
  },
  {
    slug: 'mcp',
    title: 'MCP Integration',
    sticker: 'MCP',
    stickerVariant: 'lime',
    headline: 'Run Zyntra from the AI tools you already use.',
    subtitle:
      'Connect MCP clients so assistants can help schedule and manage posts.',
    description:
      'Zyntra MCP connects Cursor, Claude, ChatGPT, and other clients to schedule and manage social posts.',
    storyTitle: 'Assistants that can schedule — not just talk about it.',
    storyBody:
      'Model Context Protocol connects clients like Cursor, Claude, and ChatGPT to Zyntra so drafts and schedules stay in the product.',
    storyPoints: [
      'Chat-driven drafting and scheduling',
      'Works with Cursor, Claude, ChatGPT, and more',
      'OAuth or API key auth styles',
      'Connector setup lives in Settings → MCP',
    ],
    howItWorks: [
      {
        title: 'Open MCP settings',
        body: 'Go to Settings → MCP in the dashboard.',
      },
      {
        title: 'Pick a client',
        body: 'Choose Cursor, Claude, ChatGPT, or another supported client.',
      },
      {
        title: 'Copy the connector',
        body: 'Use OAuth where supported, or your org API key.',
      },
      {
        title: 'Ask and schedule',
        body: 'Let the assistant draft or schedule through Zyntra.',
      },
    ],
    sections: [
      {
        title: 'Chat-driven publishing',
        body: 'Draft, schedule, or check posts from Cursor, Claude, or ChatGPT.',
      },
      {
        title: 'Popular clients',
        body: 'Works with Cursor, Claude, ChatGPT, VS Code, Windsurf, and more.',
      },
      {
        title: 'OAuth or API key',
        body: 'Authorize with OAuth where supported, or use your org API key.',
      },
      {
        title: 'Settings → MCP',
        body: 'Generate connectors and copy config without leaving Zyntra.',
      },
    ],
    bandTitle: 'Stay in your AI client. Ship through Zyntra.',
    bandBody: 'MCP keeps scheduling inside the tools you already open every day.',
    ctaTitle: 'Connect your AI client',
  },
];

export const FEATURE_SLUGS = FEATURE_PAGES.map((f) => f.slug);

export function getFeaturePage(slug: string): FeaturePage | undefined {
  return FEATURE_PAGES.find((f) => f.slug === slug);
}

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
