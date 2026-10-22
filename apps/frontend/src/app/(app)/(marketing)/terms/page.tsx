import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { LegalPageHero } from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Terms of Service',
  description:
    'Terms of Service for Zyntra AI: permitted use, billing, liability limits, and how to contact us about your creator account.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <>
      <LegalPageHero
        sticker="Terms"
        title={
          <>
            Clear rules. Fair use.
            <br />
            <span className="mkt-u">No fine print games.</span>
          </>
        }
        subtitle="Permitted use, billing, liability, and how we work together."
      />

      <div className="mkt-doc-wrap">
        <article className="mkt-doc">
          <p className="mkt-doc-meta">Last updated: June 2026 · Classy Endeavors</p>
          <p>
            By accessing or using Zyntra, you agree to be bound by these Terms of
            Service. If you do not agree, you may not use the service.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Zyntra, you agree to be bound by these Terms of
            Service. If you do not agree, you may not use the service.
          </p>

          <h2>2. The Service</h2>
          <p>
            Zyntra is an autonomous AI platform designed to help digital creators
            manage and scale their businesses using AI agents.
          </p>

          <h2>3. Beta Version</h2>
          <p>
            Zyntra is currently in Beta. The service is provided &quot;as is&quot;
            and &quot;as available.&quot; We make no guarantees regarding uptime,
            accuracy, performance, or results.
          </p>

          <h2>4. User Accounts and Responsibilities</h2>
          <ul>
            <li>You must provide accurate information during signup.</li>
            <li>You are responsible for all activity under your account.</li>
            <li>You retain ownership of your content.</li>
            <li>
              You agree to comply with all third-party platform rules (TikTok,
              Instagram, YouTube, etc.).
            </li>
          </ul>

          <h2>5. Subscriptions and Payments</h2>
          <ul>
            <li>Subscriptions are billed monthly or annually and auto-renew.</li>
            <li>You can cancel anytime via your account settings.</li>
            <li>No refunds for partial billing periods.</li>
            <li>Prices may change with notice.</li>
          </ul>

          <h2>6. Revenue Share</h2>
          <p>
            For deals originated or materially assisted by Zyntra&apos;s Deal
            Scout Agent, we charge a 10% revenue share. You keep 90%. All splits
            are shown transparently in the dashboard.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Zyntra, its founders,
            employees, agents, and affiliates shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages,
            including but not limited to:
          </p>
          <ul>
            <li>Loss of profits, revenue, or business opportunities</li>
            <li>Loss of followers, engagement, or audience</li>
            <li>Damage to your reputation or brand</li>
            <li>
              Account suspensions, bans, or penalties from third-party platforms
            </li>
            <li>
              Any content created, posted, or actions taken by the AI agents
            </li>
            <li>
              Any decisions you make based on Zyntra&apos;s recommendations or
              outputs
            </li>
          </ul>
          <p>
            Zyntra is provided on an &quot;AS IS&quot; and &quot;AS
            AVAILABLE&quot; basis with no warranties. Our total liability shall
            not exceed the greater of (a) the amount you paid in the past 12
            months, or (b) $100.
          </p>

          <h2>8. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Zyntra, its
            founders, officers, employees, agents, and affiliates from any
            claims, liabilities, damages, losses, costs, and expenses (including
            reasonable attorneys&apos; fees) arising from your use of Zyntra,
            your content, your violation of third-party platform terms, or your
            breach of these Terms.
          </p>

          <h2>9. Force Majeure</h2>
          <p>
            Zyntra shall not be liable for any failure or delay in performance
            due to causes beyond our reasonable control, including acts of God,
            natural disasters, pandemics, war, government actions, internet or
            platform outages, or third-party platform policy changes.
          </p>

          <h2>10. Dispute Resolution</h2>
          <p>
            Any dispute arising out of or relating to these Terms or your use of
            Zyntra shall first be attempted to be resolved informally by email.
          </p>
          <p>
            If the dispute is not resolved within 30 days, it shall be resolved
            by binding arbitration administered by the American Arbitration
            Association in Florida. The arbitration shall be conducted by a
            single arbitrator on an individual basis. You waive any right to
            class actions.
          </p>
          <p>These Terms are governed by the laws of the State of Florida.</p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of Zyntra
            after changes constitutes acceptance of the new Terms.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:admin@aizyntra.com">admin@aizyntra.com</a>.
          </p>
        </article>
      </div>
    </>
  );
}
