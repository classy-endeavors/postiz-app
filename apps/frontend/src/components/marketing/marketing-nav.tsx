'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from '@gitroom/frontend/components/new-layout/logo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/platforms', label: 'Platforms' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
] as const;

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`mkt-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="mkt-nav-in">
        <Link href="/" className="mkt-brand" aria-label="Zyntra home">
          <BrandMark size={38} />
          Zyntra
        </Link>

        <nav className="mkt-nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? 'active' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mkt-nav-right">
          <Link href="/auth" className="mkt-nav-login">
            Login
          </Link>
          <Link href="/auth" className="mkt-btn mkt-btn-org mkt-btn-sm">
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="mkt-nav-toggle"
          aria-expanded={open}
          aria-controls="mkt-mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      <div
        id="mkt-mobile-nav"
        className={`mkt-nav-mobile${open ? ' open' : ''}`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href) ? 'active' : undefined}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/auth">Login</Link>
        <Link href="/auth" className="mkt-btn mkt-btn-org mkt-btn-sm">
          Get Started
        </Link>
      </div>
    </header>
  );
}
