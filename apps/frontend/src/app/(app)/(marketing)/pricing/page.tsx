import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { CoinsExplainer } from '@gitroom/frontend/components/marketing/pricing-cards';
import {
  CtaBand,
  FaqList,
  PageHero,
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

      <section className="mkt-section" style={{ paddingTop: 8 }}>
        <div className="mkt-wrap">
          <CoinsExplainer />
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap" style={{ maxWidth: 760 }}>
          <h2 className="mkt-h2 mkt-center" style={{ marginBottom: 24 }}>
            Pricing questions
          </h2>
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
