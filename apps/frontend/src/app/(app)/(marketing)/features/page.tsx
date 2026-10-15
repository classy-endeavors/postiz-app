import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { FEATURE_OVERVIEW_CARDS } from '@gitroom/frontend/components/marketing/feature-pages';
import {
  CtaBand,
  PageHero,
  featureCards,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Features',
  description:
    'Explore Zyntra features: calendar, publishing, AI, analytics, media, teams, MCP, autopost, and API.',
  path: '/features',
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        sticker="Product features"
        title="One dashboard for planning, publishing, and growth."
        subtitle="Every major capability in Zyntra is built into the same workspace — no tool-hopping required."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          {featureCards([...FEATURE_OVERVIEW_CARDS])}
        </div>
      </section>

      <CtaBand title="Put these features to work" />
    </>
  );
}
