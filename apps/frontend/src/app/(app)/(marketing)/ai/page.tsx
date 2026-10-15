import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'AI Content Creation',
  description:
    'Use Zyntra AI to draft posts, generate images and video, and clip long-form content — always with your review before publish.',
  path: '/ai',
});

export default function AiPage() {
  return (
    <>
      <PageHero
        sticker="AI tools"
        title="AI that drafts. You decide what ships."
        subtitle="Generate captions, media, and clips inside Zyntra — then edit and approve before publishing."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
            {
              title: 'AI agent chat',
              body: 'Ask the agent to help schedule posts, prepare media, and move work forward.',
            },
            {
              title: 'Post generator',
              body: 'Create short or long drafts, threads, and hooks with selectable tones.',
            },
            {
              title: 'AI images',
              body: 'Generate images for posts when your plan includes image credits.',
            },
            {
              title: 'AI video tools',
              body: 'Create video assets and slides when video generation is enabled on your plan.',
            },
            {
              title: 'Video clipping',
              body: 'Turn longer videos into shorter clips using available clipping minutes.',
            },
            {
              title: 'Human in the loop',
              body: 'Nothing publishes until you review and schedule it from the calendar.',
            },
          ])}
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <div className="mkt-card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, marginBottom: 12 }}>Plan availability</h2>
            <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
              AI features start on STANDARD and above. Image generator, higher
              media limits, and autopost unlock on TEAM, PRO, and ULTIMATE.
              Check pricing for exact quotas.
            </p>
          </div>
        </div>
      </section>

      <CtaBand title="Try AI drafts on your next post" />
    </>
  );
}
