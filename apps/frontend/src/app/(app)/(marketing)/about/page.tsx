import Link from 'next/link';
import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
  Sticker,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'About',
  description:
    'Zyntra is the social scheduling dashboard behind aizyntra.com — plan, publish, and measure content in one place.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        sticker="About Zyntra"
        stickerVariant="lime"
        title="A dashboard built to keep creators shipping."
        subtitle="Zyntra helps you plan, schedule, publish, and measure social content without juggling disconnected tools."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="peach">What we believe</Sticker>
            <h2 className="mkt-h2">Clear tools. Real capabilities.</h2>
          </div>
          {featureCards([
            {
              title: 'Our purpose',
              body: 'Stop app-hopping. Draft, schedule, and measure social content in one place.',
            },
            {
              title: 'Where we fit',
              body: 'This is the live scheduling dashboard behind aizyntra.com for connected social channels.',
            },
            {
              title: 'Pay as you go',
              body: 'Start with 100 free Zyntra Coins each month. Spend them as you create.',
              href: '/pricing',
            },
            {
              title: 'Open source roots',
              body: 'A modified AGPL-3.0 fork of Postiz. Source stays available from the product.',
            },
          ])}
        </div>
      </section>

      <section className="mkt-strip">
        <div className="mkt-wrap">
          <div className="mkt-split">
            <div>
              <h2 className="mkt-h2" style={{ textAlign: 'left' }}>
                One workspace for the whole publishing loop.
              </h2>
              <p className="mkt-sub" style={{ maxWidth: 520, margin: '12px 0 0' }}>
                Calendar, publishing, AI drafts, media, analytics, teams, and MCP
                share the same account — powered by a pay-as-you-go coin wallet.
              </p>
            </div>
            <ul className="mkt-checklist">
              <li>Plan on a shared calendar</li>
              <li>Publish to six connected platforms</li>
              <li>Draft with AI, approve before send</li>
              <li>Measure channel performance in-product</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 40 }}>
        <div className="mkt-wrap">
          <div className="mkt-ink-band">
            <div>
              <h2>Policies, in plain view</h2>
              <p>
                Review our{' '}
                <Link href="/privacy">Privacy Policy</Link> and{' '}
                <Link href="/terms">Terms of Service</Link>, then{' '}
                <Link href="/auth">create an account</Link> to start publishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Join Zyntra and start publishing" />
    </>
  );
}
