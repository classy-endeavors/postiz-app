import Link from 'next/link';
import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  FaqList,
  HOME_FAQ,
  PlatformRow,
  Sticker,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Zyntra | Schedule and Publish Social Content',
  description:
    'Plan, schedule, and publish to YouTube, TikTok, Instagram, LinkedIn, and Facebook from one Zyntra dashboard — with AI that drafts in your voice.',
  path: '/',
});

export default function MarketingHomePage() {
  return (
    <>
      <section className="mkt-hero">
        <div className="mkt-wrap">
          <Sticker>Social scheduling, simplified</Sticker>
          <h1>Your content calendar finally lives in one place.</h1>
          <p className="mkt-sub" style={{ margin: '0 auto' }}>
            Plan, schedule, and publish across your channels — with AI drafts,
            media tools, and analytics built in.
          </p>
          <div className="mkt-hero-actions">
            <Link href="/auth" className="mkt-btn mkt-btn-org">
              Get Started
            </Link>
            <Link href="/auth" className="mkt-btn mkt-btn-ghost">
              Login
            </Link>
          </div>
          <div className="mkt-preview">
            <img
              src="/marketing/images/calendar.png"
              alt="Zyntra content calendar in month view"
              width={980}
              height={560}
            />
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-wrap mkt-center">
          <Sticker variant="lime">What you get</Sticker>
          <h2 className="mkt-h2">Everything you need to ship on time</h2>
          <p className="mkt-sub">
            Built for creators and teams who manage multiple social channels.
          </p>
          <div style={{ marginTop: 40 }}>
            {featureCards([
              {
                title: 'Content calendar',
                body: 'Day, week, month, and list views for drafts, scheduled posts, and published work.',
                href: '/calendar',
              },
              {
                title: 'Multi-platform publishing',
                body: 'Compose once and publish to YouTube, TikTok, Instagram, LinkedIn, and Facebook.',
                href: '/publishing',
              },
              {
                title: 'AI that drafts with you',
                body: 'Generate posts, images, and clips — then review before anything goes live.',
                href: '/ai',
              },
              {
                title: 'Channel analytics',
                body: 'Track views, engagement, and growth for your connected platforms.',
                href: '/insights',
              },
              {
                title: 'Media library',
                body: 'Upload, organize, and reuse creative assets across every scheduled post.',
                href: '/features',
              },
              {
                title: 'Team workspaces',
                body: 'Invite teammates with roles when your plan includes collaboration.',
                href: '/teams',
              },
            ])}
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <Sticker variant="peach">Platforms</Sticker>
          <h2 className="mkt-h2">Publish where your audience already is</h2>
          <p className="mkt-sub" style={{ marginBottom: 32 }}>
            Connect the channels Zyntra supports today.
          </p>
          <PlatformRow />
          <div style={{ marginTop: 28 }}>
            <Link
              href="/platforms"
              style={{ fontWeight: 700, color: 'var(--mkt-org)' }}
            >
              See platform details →
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <Sticker>How it works</Sticker>
          <h2 className="mkt-h2">From idea to published post</h2>
          <div className="mkt-steps" style={{ marginTop: 40, textAlign: 'left' }}>
            <div className="mkt-step">
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Connect</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Link YouTube, TikTok, Instagram, LinkedIn, or Facebook Pages.
              </p>
            </div>
            <div className="mkt-step">
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Create</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Draft in the composer or let AI suggest captions and media.
              </p>
            </div>
            <div className="mkt-step">
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Schedule</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Drop posts on the calendar and publish automatically on time.
              </p>
            </div>
            <div className="mkt-step">
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Measure</h3>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Review channel analytics and refine what you post next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <Sticker variant="lime">Built for</Sticker>
          <h2 className="mkt-h2">Creators, brands, and small teams</h2>
          <div style={{ marginTop: 40 }}>
            {featureCards([
              {
                title: 'Solo creators',
                body: 'Batch content once, schedule across channels, and stay consistent.',
                href: '/use-cases',
              },
              {
                title: 'Growing brands',
                body: 'Keep a shared calendar, media library, and publishing workflow.',
                href: '/use-cases',
              },
              {
                title: 'Collaborative teams',
                body: 'Invite members, assign roles, and publish from one workspace.',
                href: '/teams',
              },
            ])}
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap mkt-center">
          <Sticker variant="peach">Pricing</Sticker>
          <h2 className="mkt-h2">Plans that scale with your channels</h2>
          <p className="mkt-sub">
            From free exploration to high-volume publishing — see full limits on
            the pricing page.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href="/pricing" className="mkt-btn mkt-btn-org">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-wrap" style={{ maxWidth: 760 }}>
          <div className="mkt-center" style={{ marginBottom: 32 }}>
            <Sticker>FAQ</Sticker>
            <h2 className="mkt-h2">Quick answers</h2>
          </div>
          <FaqList items={HOME_FAQ} />
          <div className="mkt-center" style={{ marginTop: 24 }}>
            <Link
              href="/faq"
              style={{ fontWeight: 700, color: 'var(--mkt-org)' }}
            >
              Read all FAQs →
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Start scheduling with Zyntra"
        subtitle="Create an account, connect a channel, and put your next post on the calendar."
      />
    </>
  );
}
