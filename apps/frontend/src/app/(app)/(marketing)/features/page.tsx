import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { FEATURE_OVERVIEW_CARDS } from '@gitroom/frontend/components/marketing/feature-pages';
import {
  CtaBand,
  PageHero,
  Sticker,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Features',
  description:
    'Explore Zyntra features: calendar, publishing, AI, analytics, media, teams, MCP, autopost, and API.',
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
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="lime">Product map</Sticker>
            <h2 className="mkt-h2">Explore every capability</h2>
            <p className="mkt-sub">
              Open any page below for a short walkthrough of what that part of
              Zyntra actually does.
            </p>
          </div>
          {featureCards([...FEATURE_OVERVIEW_CARDS])}
        </div>
      </section>

      <section className="mkt-strip">
        <div className="mkt-wrap">
          <div className="mkt-split">
            <div>
              <h2 className="mkt-h2" style={{ textAlign: 'left' }}>
                Built to stay in one workspace.
              </h2>
              <p className="mkt-sub" style={{ maxWidth: 520, margin: '12px 0 0' }}>
                Calendar, publishing, AI, analytics, media, teams, and MCP share
                the same account — so planning and shipping stay connected.
              </p>
            </div>
            <ul className="mkt-checklist">
              <li>Schedule across connected social channels</li>
              <li>Draft with AI, then approve before publish</li>
              <li>Reuse media from one library</li>
              <li>Spend coins only when you create or schedule</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-wrap">
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="peach">Usage</Sticker>
            <h2 className="mkt-h2">Features unlock. Coins meter the work.</h2>
          </div>
          <div className="mkt-steps" style={{ textAlign: 'left' }}>
            <div className="mkt-step">
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Start free</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 14, margin: 0 }}>
                Get 100 Zyntra Coins every month. Unused coins carry over.
              </p>
            </div>
            <div className="mkt-step">
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Spend as you create</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 14, margin: 0 }}>
                1 coin per agent message, 5 per AI image, 2 per channel when you
                schedule.
              </p>
            </div>
            <div className="mkt-step">
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Drafts stay free</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 14, margin: 0 }}>
                Write and edit without spending. Coins apply when you generate
                or schedule.
              </p>
            </div>
            <div className="mkt-step">
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Top up when needed</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 14, margin: 0 }}>
                Request more coins from the Coins page in the dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Put these features to work" />
    </>
  );
}
