import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PLATFORMS,
  PageHero,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Supported Platforms',
  description:
    'Connect YouTube, TikTok, Instagram, LinkedIn, LinkedIn Page, and Facebook Page in Zyntra.',
  path: '/platforms',
});

export default function PlatformsPage() {
  return (
    <>
      <PageHero
        sticker="Integrations"
        title="Six platforms. One publishing workflow."
        subtitle="Zyntra connects the channels registered in the product today — no inflated channel counts."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          <div className="mkt-grid-2">
            {PLATFORMS.map((platform) => (
              <div key={platform.name} className="mkt-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <img
                    src={platform.icon}
                    alt=""
                    width={36}
                    height={36}
                    style={{ objectFit: 'contain' }}
                  />
                  <h3 style={{ fontSize: 24 }}>{platform.name}</h3>
                </div>
                <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                  {platform.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Connect your first channel" />
    </>
  );
}
