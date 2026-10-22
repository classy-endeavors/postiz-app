/**
 * Exact public marketing paths, plus nested /features/* pages.
 * Nested allowlist is limited to /features/ so dashboard routes
 * like /analytics and /launches stay protected.
 */
export const MARKETING_PATHS = [
  '/',
  '/features',
  '/publishing',
  '/calendar',
  '/ai',
  '/insights',
  '/platforms',
  '/teams',
  '/use-cases',
  '/pricing',
  '/faq',
  '/about',
  '/privacy',
  '/terms',
] as const;

export type MarketingPath = (typeof MARKETING_PATHS)[number];

const MARKETING_PATH_SET = new Set<string>(MARKETING_PATHS);

export function isMarketingPath(pathname: string): boolean {
  if (MARKETING_PATH_SET.has(pathname)) {
    return true;
  }
  // Nested feature detail pages only — never a broad prefix on other roots
  if (pathname.startsWith('/features/') && pathname !== '/features/') {
    const rest = pathname.slice('/features/'.length);
    // single segment only: /features/analytics — not /features/../launches
    return !!rest && !rest.includes('/') && !rest.includes('..');
  }
  return false;
}
