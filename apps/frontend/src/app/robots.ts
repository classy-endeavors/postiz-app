import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.FRONTEND_URL || 'https://dashboard.aizyntra.com'
  ).replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: [
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
      ],
      disallow: [
        '/launches',
        '/analytics',
        '/agents',
        '/media',
        '/coins',
        '/settings',
        '/admin',
        '/auth/activate',
        '/auth/forgot',
        '/modal',
        '/api',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
