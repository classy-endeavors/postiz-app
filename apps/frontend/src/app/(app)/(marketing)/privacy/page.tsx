import { marketingMetadata } from '@gitroom/frontend/components/marketing/seo';
import { LegalPageHero } from '@gitroom/frontend/components/marketing/sections';

export const metadata = marketingMetadata({
  title: 'Privacy Policy',
  description:
    'How Zyntra collects, uses, retains, and protects your data—including connected social accounts. Operated by Classy Endeavors.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <LegalPageHero
        sticker="Privacy"
        title={
          <>
            Your data stays yours.
            <br />
            <span className="mkt-u">We never sell it.</span>
          </>
        }
        subtitle="How Zyntra collects, uses, and protects your information."
      />

      <div className="mkt-doc-wrap">
        <article className="mkt-doc">
          <p className="mkt-doc-meta">Last updated: June 2026 · Classy Endeavors</p>
          <p>
            At Zyntra, we respect your privacy and are committed to protecting
            your personal data. This Privacy Policy explains how we collect, use,
            and safeguard your information when you use our service.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul>
            <li>Account Information: Name, email address, and login credentials.</li>
            <li>
              Content &amp; Style Data: Posts, captions, videos, audience
              insights, and other content you upload or connect to Zyntra.
            </li>
            <li>
              Usage &amp; Performance Data: Metrics from connected platforms
              (TikTok, Instagram, YouTube, LinkedIn, X), engagement data,
              analytics, and interaction history.
            </li>
            <li>
              Payment Information: Processed securely by Stripe (we do not store
              full payment details).
            </li>
            <li>
              Technical Data: IP address, browser type, device information, and
              usage logs.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, personalize, and improve Zyntra&apos;s 9 agentic AI agents.</li>
            <li>
              Generate content, replies, and recommendations in your unique
              style.
            </li>
            <li>
              Analyze performance and continuously improve the service through
              RAG and feedback loops.
            </li>
            <li>
              Communicate with you about your account, updates, and Beta
              opportunities.
            </li>
            <li>
              Comply with legal obligations and enforce our Terms of Service.
            </li>
          </ul>

          <h2>3. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share data only with
            trusted service providers under strict confidentiality agreements,
            and anonymized aggregated data for improving our AI models. See our
            Third-Party Software page for subprocessors.
          </p>

          <h2>4. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as
            needed to provide the service. You may request deletion of your
            account and data at any time.
          </p>

          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access, correct, or delete your personal data.</li>
            <li>Opt out of marketing communications.</li>
            <li>Request a copy of your data.</li>
            <li>Withdraw consent where applicable.</li>
          </ul>

          <h2>6. Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical
            security measures to protect your information. However, no system is
            completely secure, and we cannot guarantee absolute security.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Zyntra is not intended for users under the age of 18. We do not
            knowingly collect data from children.
          </p>

          <h2>8. Platform Access &amp; Consent</h2>
          <p>
            When you connect a social platform, you explicitly consent to Zyntra
            accessing your account to read content, analyze your audience, post
            on your behalf (only with your approval), and reply to comments in
            your voice. You can revoke platform access anytime in Settings.
          </p>

          <h2>9. LinkedIn Integration</h2>
          <p>
            When you connect your LinkedIn personal profile or Company Page to
            Zyntra, we may access authorized account information, posts, media,
            comments, and engagement analytics to provide publishing,
            scheduling, reposting, comment management, and performance analytics
            features.
          </p>
          <p>
            We use this information only to provide and improve the LinkedIn
            features you authorize, in accordance with applicable LinkedIn API
            terms and permissions. You can disconnect LinkedIn or revoke access
            at any time. You may also request deletion of your associated data
            by contacting{' '}
            <a href="mailto:admin@aizyntra.com">admin@aizyntra.com</a>.
          </p>

          <h2>10. X (Twitter) Integration</h2>
          <p>
            When you connect your X account to Zyntra, we may access authorized
            account information (such as profile name, username, and profile
            image), posts, media, and public engagement metrics to provide
            publishing, scheduling, threading, and performance analytics
            features.
          </p>
          <p>
            We use this information only to provide and improve the X features
            you authorize, in accordance with applicable X API terms and
            permissions. We post or take actions on your behalf only after you
            schedule or approve content in Zyntra. You can disconnect X or
            revoke access at any time. You may also request deletion of your
            associated data by contacting{' '}
            <a href="mailto:admin@aizyntra.com">admin@aizyntra.com</a>.
          </p>

          <h2>11. TikTok Integration</h2>
          <p>
            When you connect your TikTok account to Zyntra, we may access
            authorized account information (such as open ID, avatar, display
            name, profile links, bio, verification status, and public stats like
            likes, followers, following, and video count), plus video list and
            publishing capabilities, to provide account connection, content
            analysis, and publishing features.
          </p>
          <p>
            We use this information only to provide and improve the TikTok
            features you authorize, in accordance with applicable TikTok API
            terms and permissions (including Login Kit and Content Posting API).
            We publish or upload content to TikTok only after you explicitly
            approve it in Zyntra (Direct Post or Send to TikTok / draft). You
            can disconnect TikTok or revoke access at any time. You may also
            request deletion of your associated data by contacting{' '}
            <a href="mailto:admin@aizyntra.com">admin@aizyntra.com</a>.
          </p>

          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by posting the new policy on this page.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            For any privacy questions or requests, please contact us at{' '}
            <a href="mailto:admin@aizyntra.com">admin@aizyntra.com</a>.
          </p>
        </article>
      </div>
    </>
  );
}
