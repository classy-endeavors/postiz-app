import Link from 'next/link';
import { ReactNode } from 'react';

export function Sticker({
  children,
  variant = 'butter',
}: {
  children: ReactNode;
  variant?: 'butter' | 'lime' | 'peach';
}) {
  const cls =
    variant === 'lime' ? ' lime' : variant === 'peach' ? ' peach' : '';
  return <div className={`mkt-stick${cls}`}>{children}</div>;
}

export function CtaBand({
  title = 'Ready to plan your next post?',
  subtitle = 'Connect your channels and start scheduling in minutes.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="mkt-section">
      <div className="mkt-wrap">
        <div className="mkt-cta-band">
          <h2 className="mkt-h2">{title}</h2>
          <p>{subtitle}</p>
          <div className="mkt-hero-actions">
            <Link href="/auth" className="mkt-btn mkt-btn-ink">
              Get Started
            </Link>
            <Link href="/auth/login" className="mkt-btn mkt-btn-ghost">
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({
  sticker,
  title,
  subtitle,
  stickerVariant = 'butter',
}: {
  sticker: string;
  title: string;
  subtitle: string;
  stickerVariant?: 'butter' | 'lime' | 'peach';
}) {
  return (
    <div className="mkt-page-hero mkt-center">
      <div className="mkt-wrap mkt-center">
        <Sticker variant={stickerVariant}>{sticker}</Sticker>
        <h1>{title}</h1>
        <p className="mkt-sub">{subtitle}</p>
        <div className="mkt-hero-actions">
          <Link href="/auth" className="mkt-btn mkt-btn-org">
            Get Started
          </Link>
          <Link href="/auth/login" className="mkt-btn mkt-btn-ghost">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export const PLATFORMS = [
  {
    name: 'YouTube',
    icon: '/icons/platforms/youtube.svg',
    blurb: 'Upload videos and Shorts with titles, tags, and notify options.',
  },
  {
    name: 'TikTok',
    icon: '/icons/platforms/tiktok.png',
    blurb: 'Publish TikToks with privacy and platform-specific settings.',
  },
  {
    name: 'Instagram',
    icon: '/icons/platforms/instagram.png',
    blurb: 'Post to Instagram with standalone account connection.',
  },
  {
    name: 'LinkedIn',
    icon: '/icons/platforms/linkedin.png',
    blurb: 'Share updates from your personal LinkedIn profile.',
  },
  {
    name: 'LinkedIn Page',
    icon: '/icons/platforms/linkedin-page.png',
    blurb: 'Publish to company pages and track page engagement.',
  },
  {
    name: 'Facebook Page',
    icon: '/icons/platforms/facebook.png',
    blurb: 'Post to Facebook Pages from the same calendar.',
  },
] as const;

export function PlatformRow() {
  return (
    <div className="mkt-platforms">
      {PLATFORMS.map((p) => (
        <div key={p.name} className="mkt-platform">
          <img src={p.icon} alt="" width={22} height={22} />
          {p.name}
        </div>
      ))}
    </div>
  );
}

export { FaqList } from './faq-accordion';

export const HOME_FAQ = [
  {
    q: 'Which platforms can I connect?',
    a: 'YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page.',
  },
  {
    q: 'How do Zyntra Coins work?',
    a: 'You get 100 free coins every month. Spend them on agent messages, AI images, and scheduled posts — unused coins carry over.',
  },
  {
    q: 'Does Zyntra include AI writing?',
    a: 'Yes. Paid plans unlock the AI agent and post generator. Usage still spends coins where listed on Pricing.',
  },
  {
    q: 'Can my team collaborate?',
    a: 'Team members and roles are available on TEAM, PRO, and ULTIMATE plans.',
  },
];

export function FeatureCards({
  items,
}: {
  items: { title: string; body: string; href?: string }[];
}) {
  return (
    <div className="mkt-grid-3">
      {items.map((item) => (
        <div key={item.title} className="mkt-card-soft">
          <h3 style={{ fontSize: 22, marginBottom: 10 }}>{item.title}</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>{item.body}</p>
          {item.href ? (
            <Link
              href={item.href}
              style={{
                display: 'inline-block',
                marginTop: 16,
                fontWeight: 700,
                color: 'var(--mkt-org)',
              }}
            >
              Learn more →
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use FeatureCards component instead */
export function featureCards(
  items: { title: string; body: string; href?: string }[]
) {
  return <FeatureCards items={items} />;
}
