import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CoinsExplainer,
  PricingCards,
} from '@gitroom/frontend/components/marketing/pricing-cards';
import {
  CtaBand,
  FaqList,
  PageHero,
  Sticker,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Pricing',
  description:
    'Zyntra pricing: 100 free Coins every month for pay-as-you-go usage, plus plans that unlock channels, AI, teams, and media credits.',
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
    a: 'Yes for day-to-day usage. Coins meter what you spend. Plans unlock channels, AI access, team seats, and monthly image, video, and clipping credits.',
  },
  {
    q: 'Can I buy more coins?',
    a: 'Request a top-up from the Coins page in the dashboard. The Zyntra team adds coins to your account — there is no fixed public coin pack price in the product today.',
  },
  {
    q: 'Do paid plans include more coins?',
    a: 'Every plan receives the same 100 monthly coins. Paid tiers add channels, AI unlock, team features, and higher media quotas that work alongside your coin balance.',
  },
  {
    q: 'What about AI video and clipping?',
    a: 'Those use plan credits and clipping minutes, not coins. Higher plans include larger monthly allowances.',
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        sticker="Pricing"
        stickerVariant="peach"
        title="Plans for access. Coins for usage."
        subtitle="Start free with 100 Zyntra Coins every month. Upgrade when you need more channels, team seats, and media credits."
      />

      <section className="mkt-section" style={{ paddingTop: 8 }}>
        <div className="mkt-wrap">
          <CoinsExplainer />
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap">
          <div className="mkt-center" style={{ marginBottom: 36 }}>
            <Sticker>Subscription plans</Sticker>
            <h2 className="mkt-h2">Unlock channels and higher media limits</h2>
            <p className="mkt-sub">
              Plans gate what you can connect and create. Coins still meter
              messages, images, and scheduled posts on every tier.
            </p>
          </div>
          <PricingCards featured="TEAM" />
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
        subtitle="Create an account, spend coins as you go, and upgrade when you need more channels."
      />
    </>
  );
}
