import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Use Cases',
  description:
    'See how creators, entrepreneurs, and small teams use Zyntra to schedule, publish, and measure social content.',
  path: '/use-cases',
});

export default function UseCasesPage() {
  return (
    <>
      <PageHero
        sticker="Use cases"
        title="Built for people who ship content every week."
        subtitle="Whether you create solo or with a small team, Zyntra keeps planning and publishing together."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([
            {
              title: 'Solo creators',
              body: 'Batch a week of posts, schedule across channels, and free time for filming.',
            },
            {
              title: 'Video-first publishers',
              body: 'Use YouTube and TikTok publishing with clipping and media tools when enabled.',
            },
            {
              title: 'Entrepreneurs',
              body: 'Keep a consistent social presence without juggling five separate apps.',
            },
            {
              title: 'Small brand teams',
              body: 'Share a calendar, media library, and roles so launches stay coordinated.',
            },
            {
              title: 'Cross-platform campaigns',
              body: 'Adapt one idea for Instagram, LinkedIn, Facebook Pages, and more.',
            },
            {
              title: 'Operators using AI',
              body: 'Draft faster with the agent and generators, then approve before publish.',
            },
          ])}
        </div>
      </section>

      <div className="mkt-wrap" style={{ marginBottom: 40 }}>
        <div className="mkt-preview">
          <img
            src="/marketing/images/calendar.png"
            alt="Content calendar for creators and teams"
            width={980}
            height={560}
          />
        </div>
      </div>

      <CtaBand title="Find your workflow in Zyntra" />
    </>
  );
}
