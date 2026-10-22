'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import { BrandMark } from '@gitroom/frontend/components/new-layout/logo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/features/platforms', label: 'Platforms' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
] as const;

const TOOL_LINKS = [
  { href: 'https://dashboard.aizyntra.com/', label: 'Auto Posting' },
  { href: 'https://dashboard.aizyntra.com/features/mcp', label: 'MCP' },
  { href: 'https://dashboard.aizyntra.com/features/autopost', label: 'RSS' },
  {
    href: 'https://dashboard.aizyntra.com/features/calendar',
    label: 'Calendar',
  },
] as const;

const TOOL_PATHS = ['/features/mcp', '/features/autopost', '/features/calendar'];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const toolsActive = TOOL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <header className={`mkt-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="mkt-nav-in">
        <Link href="/" className="mkt-brand" aria-label="Zyntra home">
          <BrandMark size={38} />
          Zyntra
        </Link>

        <nav className="mkt-nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Fragment key={link.href}>
              <Link
                href={link.href}
                className={isActive(link.href) ? 'active' : undefined}
              >
                {link.label}
              </Link>
              {link.href === '/features' && (
                <ToolsMenu active={toolsActive} pathname={pathname} />
              )}
            </Fragment>
          ))}
        </nav>

        <div className="mkt-nav-right">
          <Link href="/auth/login" className="mkt-nav-login">
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
          <Fragment key={link.href}>
            <Link
              href={link.href}
              className={isActive(link.href) ? 'active' : undefined}
            >
              {link.label}
            </Link>
            {link.href === '/features' && (
              <div className="mkt-nav-mobile-tools">
                <div className="mkt-nav-mobile-label">Tools</div>
                {TOOL_LINKS.map((tool) => (
                  <a key={tool.href} href={tool.href}>
                    {tool.label}
                  </a>
                ))}
              </div>
            )}
          </Fragment>
        ))}
        <Link href="/auth/login">Login</Link>
        <Link href="/auth" className="mkt-btn mkt-btn-org mkt-btn-sm">
          Get Started
        </Link>
      </div>
    </header>
  );
}

function ToolsMenu({
  active,
  pathname,
}: {
  active: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      className={`mkt-nav-tools${open ? ' open' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={active ? 'active' : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        Tools
      </button>
      <div className="mkt-nav-tools-menu">
        {TOOL_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
