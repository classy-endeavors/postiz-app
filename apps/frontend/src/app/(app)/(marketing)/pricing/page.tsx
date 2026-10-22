import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { CoinsExplainer } from '@gitroom/frontend/components/marketing/pricing-cards';
import {
  CtaBand,
  FaqList,
  PageHero,
  Sticker,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Pricing',
  description:
    'Zyntra pay-as-you-go pricing with 100 free Coins every month for agent messages, AI images, and scheduled posts.',
  path: '/pricing',
  ogImage: '/og/og-pricing.png',
});

const PRICING_FAQ = [
  {
    q: 'What are Zyntra Coins?',
    a: 'Coins are your usage wallet. You get 100 free every month, unused coins carry over, and you spend them on agent messages, AI images, and scheduled posts.',
  },
  {
    q: 'How much do actions cost?',
    a: '1 coin per AI agent message, 5 coins per AI image, and 2 coins per channel when a post is scheduled. Drafts and later edits are free.',
  },
  {
    q: 'Is this pay as you go?',
    a: 'Yes. Day-to-day usage is metered with coins. Start free, spend as you create, and request more coins from the Coins page when you need them.',
  },
  {
    q: 'Can I buy more coins?',
    a: 'Request a top-up from the Coins page in the dashboard. The Zyntra team adds coins to your account.',
  },
  {
    q: 'What about AI video and clipping?',
    a: 'Videos and clipping use plan media credits and minutes inside the product, not coins.',
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        sticker="Pricing"
        stickerVariant="peach"
        title="Pay as you go with Zyntra Coins."
        subtitle="Start free with 100 coins every month. Spend them on agent messages, AI images, and scheduled posts — unused coins carry over."
      />

      <section className="mkt-section">
        <div className="mkt-wrap">
          <div className="mkt-center" style={{ marginBottom: 40 }}>
            <Sticker variant="lime">Coin costs</Sticker>
            <h2 className="mkt-h2">What each action costs</h2>
            <p className="mkt-sub">
              Clear metering for the three actions that spend coins.
            </p>
          </div>
          <CoinsExplainer />
        </div>
      </section>

      <section className="mkt-strip">
        <div className="mkt-wrap">
          <div className="mkt-split">
            <div>
              <h2 className="mkt-h2" style={{ textAlign: 'left' }}>
                Use monthly coins. Top up when you need more.
              </h2>
              <p className="mkt-sub" style={{ maxWidth: 520, margin: '12px 0 0' }}>
                Request a top-up from the Coins page when your balance runs low —
                the Zyntra team adds coins for you.
              </p>
            </div>
            <ul className="mkt-checklist">
              <li>100 free coins every month</li>
              <li>Unused coins carry over</li>
              <li>Drafts and edits stay free</li>
              <li>Video and clipping use plan credits, not coins</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-wrap" style={{ maxWidth: 760 }}>
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="peach">Fair questions</Sticker>
            <h2 className="mkt-h2">Pricing questions</h2>
          </div>
          <FaqList items={PRICING_FAQ} />
        </div>
      </section>

      <CtaBand
        title="Start free with 100 coins"
        subtitle="Create an account and spend coins as you go."
      />
    </>
  );
}
