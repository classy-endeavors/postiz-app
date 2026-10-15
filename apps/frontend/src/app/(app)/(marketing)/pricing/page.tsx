import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { PricingCards } from '@gitroom/frontend/components/marketing/pricing-cards';
import {
  CtaBand,
  FaqList,
  PageHero,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Pricing',
  description:
    'Zyntra plans from Free to Ultimate — compare channels, AI, team seats, webhooks, and media limits.',
  path: '/pricing',
});

const PRICING_FAQ = [
  {
    q: 'Can I start for free?',
    a: 'Yes. The FREE plan lets you explore the dashboard. Connected channels and AI unlock on paid tiers.',
  },
  {
    q: 'What changes between STANDARD and TEAM?',
    a: 'TEAM adds team members, image generator tools, more channels, higher media limits, webhooks, and RSS autopost.',
  },
  {
    q: 'Are yearly prices available?',
    a: 'Yes. Each paid plan lists a yearly price alongside the monthly rate.',
  },
  {
    q: 'Where do I upgrade?',
    a: 'After you sign in, billing is available in the product when Stripe billing is enabled for your environment.',
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        sticker="Pricing"
        stickerVariant="peach"
        title="Simple plans. Clear limits."
        subtitle="Pricing matches the live Zyntra dashboard tiers — channels, AI, teams, and automation included where listed."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
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

      <CtaBand title="Pick a plan and get started" />
    </>
  );
}
