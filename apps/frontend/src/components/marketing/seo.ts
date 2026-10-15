import { Metadata } from 'next';

const SITE_NAME = 'Zyntra';
const DEFAULT_OG = '/og/og-default.png';

export function marketingMetadata({
  title,
  description,
  path,
  ogImage = DEFAULT_OG,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const base = (process.env.FRONTEND_URL || 'https://dashboard.aizyntra.com').replace(
    /\/$/,
    ''
  );
  const url = `${base}${path === '/' ? '' : path}`;
  const fullTitle = path === '/' ? title : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
