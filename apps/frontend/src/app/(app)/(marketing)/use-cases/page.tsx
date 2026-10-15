import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  Sticker,
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
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="lime">Who it fits</Sticker>
            <h2 className="mkt-h2">Pick the workflow that matches you</h2>
            <p className="mkt-sub">
              Same calendar, composer, coins, and AI tools — different rhythms
              depending on how you create.
            </p>
          </div>
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

      <section className="mkt-strip">
        <div className="mkt-wrap">
          <div className="mkt-split">
            <div>
              <h2 className="mkt-h2" style={{ textAlign: 'left' }}>
                A simple weekly loop.
              </h2>
              <p className="mkt-sub" style={{ maxWidth: 520, margin: '12px 0 0' }}>
                Draft with AI or by hand, attach media, schedule on the calendar,
                then check analytics — spending coins only when you message,
                generate images, or schedule posts.
              </p>
            </div>
            <ul className="mkt-checklist">
              <li>Draft → attach media → schedule</li>
              <li>Publish on time with background jobs</li>
              <li>Review channel analytics</li>
              <li>Spend coins only on metered actions</li>
            </ul>
          </div>
        </div>
      </section>

      <CtaBand title="Find your workflow in Zyntra" />
    </>
  );
}
