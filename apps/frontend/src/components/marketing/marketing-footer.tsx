import Link from 'next/link';
import { BrandMark } from '@gitroom/frontend/components/new-layout/logo';

const PRODUCT_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/publishing', label: 'Publishing' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/ai', label: 'AI Content' },
  { href: '/insights', label: 'Analytics' },
];

const MORE_LINKS = [
  { href: '/platforms', label: 'Platforms' },
  { href: '/teams', label: 'Teams' },
  { href: '/use-cases', label: 'Use Cases' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/auth', label: 'Login' },
  { href: 'https://aizyntra.com/privacy', label: 'Privacy Policy', external: true },
  { href: 'https://aizyntra.com/terms', label: 'Terms of Service', external: true },
];

export function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-wrap">
        <div className="mkt-footer-grid">
          <div>
            <Link href="/" className="mkt-brand" style={{ color: '#fff' }}>
              <BrandMark size={38} />
              Zyntra
            </Link>
            <p className="mkt-footer-muted">
              Plan, schedule, and publish social content from one dashboard —
              with AI that drafts in your voice.
            </p>
          </div>

          <div className="mkt-footer-col">
            <h4>Product</h4>
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mkt-footer-col">
            <h4>Explore</h4>
            {MORE_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mkt-footer-col">
            <h4>Company</h4>
            {COMPANY_LINKS.map((link) =>
              'external' in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <span>© {new Date().getFullYear()} Zyntra. All rights reserved.</span>
          <span>
            Scheduling dashboard for{' '}
            <a
              href="https://www.aizyntra.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              aizyntra.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
