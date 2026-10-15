/**
 * Lightweight allowlist checks for proxy marketing paths.
 * Run: pnpm exec tsx apps/frontend/src/components/marketing/marketing-paths.spec.ts
 * (from repo root) or via node after transpile.
 */
import { isMarketingPath, MARKETING_PATHS } from './marketing-paths';

type Case = {
  pathname: string;
  hasAuth: boolean;
  expectPublic: boolean;
  note: string;
};

/**
 * Mirrors proxy decision for "can unauthenticated user reach this path
 * without being redirected to /auth?"
 * Authenticated `/` still redirects to app home in proxy (separate branch).
 */
function wouldRedirectLoggedOutToAuth(pathname: string): boolean {
  if (pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/uploads/')) return false;
  if (pathname.startsWith('/p/')) return false;
  if (pathname.startsWith('/provider/')) return false;
  if (pathname.startsWith('/icons/')) return false;
  if (isMarketingPath(pathname)) return false;
  return true;
}

function wouldRedirectLoggedInRootToApp(pathname: string): boolean {
  return pathname === '/';
}

const cases: Case[] = [
  { pathname: '/', hasAuth: false, expectPublic: true, note: 'guest home = marketing' },
  { pathname: '/features', hasAuth: false, expectPublic: true, note: 'guest marketing' },
  { pathname: '/pricing', hasAuth: false, expectPublic: true, note: 'guest pricing' },
  { pathname: '/insights', hasAuth: false, expectPublic: true, note: 'guest insights' },
  { pathname: '/launches', hasAuth: false, expectPublic: false, note: 'protected calendar' },
  { pathname: '/analytics', hasAuth: false, expectPublic: false, note: 'protected analytics' },
  { pathname: '/agents', hasAuth: false, expectPublic: false, note: 'protected agents' },
  { pathname: '/media', hasAuth: false, expectPublic: false, note: 'protected media' },
  { pathname: '/settings', hasAuth: false, expectPublic: false, note: 'protected settings' },
  { pathname: '/coins', hasAuth: false, expectPublic: false, note: 'protected coins' },
  { pathname: '/admin/stats', hasAuth: false, expectPublic: false, note: 'protected admin' },
  // Prefix attack vectors — must NOT be treated as marketing
  { pathname: '/analytics/extra', hasAuth: false, expectPublic: false, note: 'no prefix leak' },
  { pathname: '/feature', hasAuth: false, expectPublic: false, note: 'no partial match' },
  { pathname: '/features/extra', hasAuth: false, expectPublic: false, note: 'exact paths only' },
];

let failed = 0;

for (const c of cases) {
  const redirects = wouldRedirectLoggedOutToAuth(c.pathname);
  const isPublic = !redirects;
  const ok = isPublic === c.expectPublic;
  if (!ok) {
    failed += 1;
    console.error(`FAIL ${c.pathname}: expected public=${c.expectPublic}, got ${isPublic} (${c.note})`);
  } else {
    console.log(`OK   ${c.pathname} public=${isPublic} (${c.note})`);
  }
}

// Authenticated root must still go to app home
if (!wouldRedirectLoggedInRootToApp('/')) {
  failed += 1;
  console.error('FAIL authenticated / should redirect to app home');
} else {
  console.log('OK   authenticated / redirects to app home');
}

for (const p of ['/features', '/pricing', '/faq']) {
  if (wouldRedirectLoggedInRootToApp(p)) {
    failed += 1;
    console.error(`FAIL authenticated ${p} should NOT force app-home redirect`);
  } else {
    console.log(`OK   authenticated ${p} stays on marketing`);
  }
}

console.log(`\nMarketing paths (${MARKETING_PATHS.length}): ${MARKETING_PATHS.join(', ')}`);
if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll proxy allowlist assertions passed');
