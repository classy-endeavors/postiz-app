import Link from 'next/link';
import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import {
  CtaBand,
  PageHero,
} from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'About',
  description:
    'Zyntra is the social scheduling dashboard behind aizyntra.com — plan, publish, and measure content in one place.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        sticker="About Zyntra"
        stickerVariant="lime"
        title="A dashboard built to keep creators shipping."
        subtitle="Zyntra helps you plan, schedule, publish, and measure social content without juggling disconnected tools."
      />

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <div className="mkt-wrap">
          <div className="mkt-grid-2">
            <div className="mkt-card">
              <h2 style={{ fontSize: 28, marginBottom: 14 }}>Our purpose</h2>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Creators and small teams lose hours hopping between apps to
                draft, schedule, and check performance. Zyntra brings the
                calendar, composer, AI helpers, media library, and analytics
                into one workspace.
              </p>
            </div>
            <div className="mkt-card">
              <h2 style={{ fontSize: 28, marginBottom: 14 }}>Where we fit</h2>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                This app is the live scheduling dashboard for{' '}
                <a
                  href="https://www.aizyntra.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: 'var(--mkt-org)' }}
                >
                  aizyntra.com
                </a>
                . Sign in here to connect channels and publish.
              </p>
            </div>
            <div className="mkt-card">
              <h2 style={{ fontSize: 28, marginBottom: 14 }}>Open source roots</h2>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Zyntra’s dashboard is a modified fork of Postiz by Gitroom
                Limited, licensed under AGPL-3.0. Source remains available and
                linked from the product.
              </p>
            </div>
            <div className="mkt-card">
              <h2 style={{ fontSize: 28, marginBottom: 14 }}>Legal</h2>
              <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
                Review our{' '}
                <a
                  href="https://aizyntra.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: 'var(--mkt-org)' }}
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="https://aizyntra.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: 'var(--mkt-org)' }}
                >
                  Terms of Service
                </a>
                .
              </p>
              <p style={{ marginTop: 16 }}>
                <Link
                  href="/auth"
                  style={{ fontWeight: 700, color: 'var(--mkt-org)' }}
                >
                  Create an account →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Join Zyntra and start publishing" />
    </>
  );
}
