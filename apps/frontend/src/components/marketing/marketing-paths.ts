/**
 * Exact public marketing paths only.
 * Must never use prefix matching — that could expose protected
 * dashboard routes such as /analytics, /launches, /agents, etc.
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
] as const;

export type MarketingPath = (typeof MARKETING_PATHS)[number];

const MARKETING_PATH_SET = new Set<string>(MARKETING_PATHS);

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATH_SET.has(pathname);
}
