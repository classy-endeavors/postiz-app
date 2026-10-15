import Link from 'next/link';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';

const PLAN_ORDER = ['FREE', 'STANDARD', 'TEAM', 'PRO', 'ULTIMATE'] as const;

const PLAN_BLURBS: Record<(typeof PLAN_ORDER)[number], string> = {
  FREE: 'Explore the dashboard before connecting channels.',
  STANDARD: 'Solo creators who need AI and a few channels.',
  TEAM: 'Small teams that need invites and autopost.',
  PRO: 'Growing brands with more channels and media.',
  ULTIMATE: 'High-volume publishing and automation.',
};

function planFeatures(key: (typeof PLAN_ORDER)[number]) {
  const plan = pricing[key];
  const lines: string[] = [];

  if ((plan.channel ?? 0) > 0) {
    lines.push(`${plan.channel} connected channels`);
  } else {
    lines.push('No connected channels');
  }

  if (plan.posts_per_month >= 1000000) {
    lines.push('High monthly post allowance');
  } else {
    lines.push(`${plan.posts_per_month} posts per month`);
  }

  lines.push(plan.ai ? 'AI drafting and agent tools' : 'No AI features');
  lines.push(
    plan.team_members ? 'Team members and roles' : 'Single-user workspace'
  );
  lines.push(
    plan.public_api ? 'Public API access' : 'No public API access'
  );
  lines.push(
    plan.webhooks > 0 ? `${plan.webhooks} webhooks` : 'No webhooks'
  );

  if (plan.autoPost) {
    lines.push('RSS autopost');
  }

  if (plan.image_generation_count > 0) {
    lines.push(`${plan.image_generation_count} AI images`);
  }

  if (plan.generate_videos > 0) {
    lines.push(`${plan.generate_videos} AI videos`);
  }

  if (plan.clipping_minutes > 0) {
    lines.push(`${plan.clipping_minutes} clipping minutes`);
  }

  if (plan.image_generator) {
    lines.push('Image generator tools');
  }

  return lines;
}

export function PricingCards({ featured = 'TEAM' }: { featured?: string }) {
  return (
    <div className="mkt-price-grid">
      {PLAN_ORDER.map((key) => {
        const plan = pricing[key];
        const isFeatured = key === featured;
        return (
          <div
            key={key}
            className={`mkt-price-card${isFeatured ? ' featured' : ''}`}
          >
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.4 }}>
              {key}
            </div>
            <p style={{ color: 'var(--mkt-soft)', fontSize: 14, marginTop: 6 }}>
              {PLAN_BLURBS[key]}
            </p>
            <div className="price">
              ${plan.month_price}
              <span>/mo</span>
            </div>
            {plan.year_price > 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mkt-soft)' }}>
                or ${plan.year_price}/year
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--mkt-soft)' }}>
                No charge
              </div>
            )}
            <ul>
              {planFeatures(key).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link
              href="/auth"
              className={`mkt-btn mkt-btn-sm ${
                isFeatured ? 'mkt-btn-org' : 'mkt-btn-ghost'
              }`}
              style={{ width: '100%' }}
            >
              Get Started
            </Link>
          </div>
        );
      })}
    </div>
  );
}
