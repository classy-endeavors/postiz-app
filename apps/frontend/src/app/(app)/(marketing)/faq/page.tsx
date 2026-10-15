import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  FaqList,
  PageHero,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'FAQ',
  description:
    'Answers about Zyntra platforms, scheduling, AI, teams, pricing, and account access.',
  path: '/faq',
});

const FAQ_ITEMS = [
  {
    q: 'What is Zyntra?',
    a: 'Zyntra is the scheduling dashboard for planning, publishing, and measuring social content across connected channels.',
  },
  {
    q: 'How is this related to aizyntra.com?',
    a: 'This dashboard powers social scheduling for the Zyntra product. The main marketing site lives at aizyntra.com.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page.',
  },
  {
    q: 'How do I log in?',
    a: 'Open /auth to create an account or sign in with email and password, plus available social login options.',
  },
  {
    q: 'Can I schedule posts in advance?',
    a: 'Yes. Add posts to the calendar and Zyntra publishes them through background jobs at the scheduled time.',
  },
  {
    q: 'Does AI publish without my approval?',
    a: 'No. AI helps draft content and media. You review, edit, and schedule before anything goes live.',
  },
  {
    q: 'What analytics are available?',
    a: 'Channel analytics cover YouTube, TikTok, Instagram, and LinkedIn Page metrics inside the product.',
  },
  {
    q: 'Can I invite teammates?',
    a: 'Team invites and roles are available on TEAM, PRO, and ULTIMATE plans.',
  },
  {
    q: 'Do you offer an API?',
    a: 'Public API and webhook access are included on paid plans according to each tier’s limits.',
  },
  {
    q: 'Where are Privacy and Terms?',
    a: 'Legal pages are on aizyntra.com/privacy and aizyntra.com/terms.',
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        sticker="FAQ"
        title="Questions, answered plainly."
        subtitle="Straight answers about the product that is actually in this dashboard."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap" style={{ maxWidth: 760 }}>
          <FaqList items={FAQ_ITEMS} />
        </div>
      </section>

      <CtaBand title="Still curious? Try the product" />
    </>
  );
}
