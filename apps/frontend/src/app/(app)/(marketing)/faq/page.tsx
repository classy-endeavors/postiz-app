import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  FaqList,
  PageHero,
  Sticker,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'FAQ',
  description:
    'Answers about Zyntra platforms, scheduling, AI, teams, coins, MCP, and account access.',
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
    a: 'Use Get Started for signup (/auth) or Login for signin (/auth/login). Email/password and available social logins are supported.',
  },
  {
    q: 'Can I schedule posts in advance?',
    a: 'Yes. Add posts to the calendar and Zyntra publishes them through background jobs at the scheduled time.',
  },
  {
    q: 'How do Zyntra Coins work?',
    a: 'Coins are a pay-as-you-go wallet. You get 100 free every month, unused coins carry over, and you spend them on agent messages (1), AI images (5), and scheduled posts (2 per channel).',
  },
  {
    q: 'Does AI publish without my approval?',
    a: 'No. AI helps draft content and media. You review, edit, and schedule before anything goes live.',
  },
  {
    q: 'What is MCP?',
    a: 'Model Context Protocol lets clients like Cursor, Claude, and ChatGPT connect to Zyntra so assistants can help schedule and manage posts.',
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
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="peach">Common questions</Sticker>
            <h2 className="mkt-h2">Asked a lot. Answered straight.</h2>
          </div>
          <FaqList items={FAQ_ITEMS} />
        </div>
      </section>

      <section className="mkt-strip">
        <div className="mkt-wrap">
          <div className="mkt-split">
            <div>
              <h2 className="mkt-h2" style={{ textAlign: 'left' }}>
                Still digging deeper?
              </h2>
              <p className="mkt-sub" style={{ maxWidth: 520, margin: '12px 0 0' }}>
                Feature pages cover calendar, publishing, AI, analytics, MCP, and
                platforms in more detail. Pricing explains coins.
              </p>
            </div>
            <ul className="mkt-checklist">
              <li>Browse /features for product walkthroughs</li>
              <li>Open /pricing for coin costs</li>
              <li>Check /features/platforms for channel list</li>
              <li>Create an account when you are ready to try</li>
            </ul>
          </div>
        </div>
      </section>

      <CtaBand title="Still curious? Try the product" />
    </>
  );
}
