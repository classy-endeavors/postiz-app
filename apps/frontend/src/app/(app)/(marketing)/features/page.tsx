import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Features',
  description:
    'Explore Zyntra features: content calendar, multi-platform publishing, AI drafts, analytics, media library, teams, and automation.',
  path: '/features',
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        sticker="Product features"
        title="One dashboard for planning, publishing, and growth."
        subtitle="Every major capability in Zyntra is built into the same workspace — no tool-hopping required."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
            {
              title: 'Content calendar',
              body: 'Plan drafts and scheduled posts in day, week, month, or list views.',
              href: '/calendar',
            },
            {
              title: 'Social publishing',
              body: 'Compose posts with platform-specific settings and publish on time.',
              href: '/publishing',
            },
            {
              title: 'AI content tools',
              body: 'Use the agent and generators for captions, images, video, and clips.',
              href: '/ai',
            },
            {
              title: 'Analytics',
              body: 'Review channel performance for YouTube, TikTok, Instagram, and LinkedIn Pages.',
              href: '/insights',
            },
            {
              title: 'Media library',
              body: 'Upload, organize, and reuse creative assets across campaigns.',
            },
            {
              title: 'Team collaboration',
              body: 'Invite teammates with roles on plans that include team members.',
              href: '/teams',
            },
            {
              title: 'RSS autopost',
              body: 'Turn new RSS items into social posts on supported TEAM+ plans.',
            },
            {
              title: 'Webhooks & API',
              body: 'Connect external tools with webhooks and public API access on paid plans.',
            },
            {
              title: 'Supported platforms',
              body: 'YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page.',
              href: '/platforms',
            },
          ])}
        </div>
      </section>

      <CtaBand title="Put these features to work" />
    </>
  );
}
