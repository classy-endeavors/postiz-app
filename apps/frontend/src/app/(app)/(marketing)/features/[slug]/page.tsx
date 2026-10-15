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
  Sticker,
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
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="lime">What it does</Sticker>
            <h2 className="mkt-h2">Capabilities on this page</h2>
          </div>
          {featureCards(
            feature.sections.map((s) => ({
              title: s.title,
              body: s.body,
              icon: s.icon,
            }))
          )}
        </div>
      </section>

      <section className="mkt-strip">
        <div className="mkt-wrap">
          <div className="mkt-split">
            <div>
              <h2 className="mkt-h2" style={{ textAlign: 'left' }}>
                {feature.storyTitle}
              </h2>
              <p className="mkt-sub" style={{ maxWidth: 520, margin: '12px 0 0' }}>
                {feature.storyBody}
              </p>
            </div>
            <ul className="mkt-checklist">
              {feature.storyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-wrap">
          <div className="mkt-center" style={{ marginBottom: 28 }}>
            <Sticker variant="peach">Getting started</Sticker>
            <h2 className="mkt-h2">Working in a few steps</h2>
          </div>
          <div className="mkt-steps" style={{ textAlign: 'left' }}>
            {feature.howItWorks.map((step) => (
              <div key={step.title} className="mkt-step">
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'var(--mkt-soft)', fontSize: 14, margin: 0 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {feature.bandTitle ? (
        <section className="mkt-section" style={{ paddingTop: 0, paddingBottom: 40 }}>
          <div className="mkt-wrap">
            <div className="mkt-ink-band">
              <div>
                <h2>{feature.bandTitle}</h2>
                {feature.bandBody ? <p>{feature.bandBody}</p> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showCalendarMock ? (
        <div className="mkt-wrap" style={{ marginBottom: 40 }}>
          <HeroCalendarMock />
        </div>
      ) : null}

      {showPlatforms ? (
        <section className="mkt-section" style={{ paddingTop: 0 }}>
          <div className="mkt-wrap mkt-center">
            <Sticker>All channels</Sticker>
            <h2 className="mkt-h2" style={{ marginBottom: 24 }}>
              Ready to connect
            </h2>
            <PlatformRow />
          </div>
        </section>
      ) : null}

      <CtaBand title={feature.ctaTitle || `Try ${feature.title}`} />
    </>
  );
}
