import { MetadataRoute } from 'next';
import { MARKETING_PATHS } from '@gitroom/frontend/components/marketing/marketing-paths';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.FRONTEND_URL || 'https://dashboard.aizyntra.com'
  ).replace(/\/$/, '');

  return MARKETING_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
