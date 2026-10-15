import { MetadataRoute } from 'next';
import { MARKETING_PATHS } from '@gitroom/frontend/components/marketing/marketing-paths';
import { FEATURE_SLUGS } from '@gitroom/frontend/components/marketing/feature-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.FRONTEND_URL || 'https://dashboard.aizyntra.com'
  ).replace(/\/$/, '');

  const topLevel = MARKETING_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === '/' ? 'weekly' : 'monthly') as
      | 'weekly'
      | 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));

  const featurePages = FEATURE_SLUGS.map((slug) => ({
    url: `${base}/features/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  return [...topLevel, ...featurePages];
}
