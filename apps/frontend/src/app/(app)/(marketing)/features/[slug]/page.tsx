import { notFound } from 'next/navigation';
import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  FEATURE_SLUGS,
  getFeaturePage,
} from '@gitroom/frontend/components/marketing/feature-pages';
import {
  CtaBand,
  PageHero,
  PlatformRow,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';
import { HeroCalendarMock } from '@gitroom/frontend/components/marketing/hero-calendar-mock';

export function generateStaticParams() {
  return FEATURE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getFeaturePage(slug);
  if (!feature) {
    return {};
  }
  return marketingMetadata({
    title: feature.title,
    description: feature.description,
    path: `/features/${feature.slug}`,
  });
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getFeaturePage(slug);
  if (!feature) {
    notFound();
  }

  const showCalendarMock =
    feature.slug === 'calendar' || feature.slug === 'publishing';
  const showPlatforms = feature.slug === 'platforms';

  return (
    <>
      <PageHero
        sticker={feature.sticker}
        stickerVariant={feature.stickerVariant}
        title={feature.headline}
        subtitle={feature.subtitle}
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards(
            feature.sections.map((s) => ({
              title: s.title,
              body: s.body,
            }))
          )}
        </div>
      </section>

      {showCalendarMock ? (
        <div className="mkt-wrap" style={{ marginBottom: 40 }}>
          <HeroCalendarMock />
        </div>
      ) : null}

      {showPlatforms ? (
        <section className="mkt-section" style={{ paddingTop: 0 }}>
          <div className="mkt-wrap mkt-center">
            <PlatformRow />
          </div>
        </section>
      ) : null}

      <CtaBand title={feature.ctaTitle || `Try ${feature.title}`} />
    </>
  );
}
