import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Social Analytics',
  description:
    'Track channel performance in Zyntra for YouTube, TikTok, Instagram, and LinkedIn Pages.',
  path: '/insights',
});

export default function InsightsPage() {
  return (
    <>
      <PageHero
        sticker="Analytics"
        stickerVariant="peach"
        title="Know what is working across your channels."
        subtitle="Open Insights to review followers, views, engagement, and post-level metrics from connected platforms."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
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
            {
              title: 'Per-post detail',
              body: 'Drill into individual posts to see how each piece performed.',
            },
            {
              title: 'Channel-focused UI',
              body: 'Pick a connected channel and review the metrics that matter for it.',
            },
          ])}
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <div className="mkt-card-soft" style={{ maxWidth: 720, margin: '0 auto' }}>
            <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
              Analytics in the dashboard currently covers YouTube, TikTok,
              Instagram, and LinkedIn Page. Facebook Page analytics may expand
              as the product evolves.
            </p>
          </div>
        </div>
      </section>

      <CtaBand title="Measure what you publish" />
    </>
  );
}
