import Link from 'next/link';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { Sticker } from '@gitroom/frontend/components/marketing/sections';

const PLAN_ORDER = ['FREE', 'STANDARD', 'TEAM', 'PRO', 'ULTIMATE'] as const;

const PLAN_BLURBS: Record<(typeof PLAN_ORDER)[number], string> = {
  FREE: 'Explore the app and spend your monthly coins.',
  STANDARD: 'Unlock AI and connect a few channels.',
  TEAM: 'Invite teammates and raise media limits.',
  PRO: 'More channels, videos, and clipping minutes.',
  ULTIMATE: 'Highest channel and media ceilings.',
};

function planFeatures(key: (typeof PLAN_ORDER)[number]) {
  const plan = pricing[key];
  const lines: string[] = [
    '100 Zyntra Coins every month',
  ];

  if ((plan.channel ?? 0) > 0) {
    lines.push(`${plan.channel} connected channels`);
  } else {
    lines.push('Connect channels on a paid plan');
  }

  lines.push(plan.ai ? 'AI agent and post generator' : 'AI unlocks on paid plans');
  lines.push(
    plan.team_members ? 'Team members and roles' : 'Single-user workspace'
  );

  if (plan.public_api) {
    lines.push('Public API access');
  }

  if (plan.webhooks > 0) {
    lines.push(`${plan.webhooks} webhooks`);
  }

  if (plan.autoPost) {
    lines.push('RSS autopost');
  }

  if (plan.image_generation_count > 0) {
    lines.push(`${plan.image_generation_count} AI image credits / mo`);
  }

  if (plan.generate_videos > 0) {
    lines.push(`${plan.generate_videos} AI video credits / mo`);
  }

  if (plan.clipping_minutes > 0) {
    lines.push(`${plan.clipping_minutes} clipping minutes / mo`);
  }

  if (plan.image_generator) {
    lines.push('Image generator tools');
  }

  return lines;
}

export function CoinsExplainer() {
  return (
    <div className="mkt-coins-block">
      <div className="mkt-center" style={{ marginBottom: 28 }}>
        <Sticker variant="lime">Pay as you go</Sticker>
        <h2 className="mkt-h2">Zyntra Coins power everyday usage</h2>
        <p className="mkt-sub">
          Every account gets 100 free coins each month. Unused coins carry over.
          Spend them as you create — request more anytime from the Coins page.
        </p>
      </div>

      <div className="mkt-grid-3">
        <div className="mkt-card">
          <div className="mkt-coins-cost">1</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>AI agent message</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
            Each chat message to the agent costs one coin.
          </p>
        </div>
        <div className="mkt-card">
          <div className="mkt-coins-cost">5</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>AI image</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
            Five coins per image, plus a plan image credit when your tier includes them.
          </p>
        </div>
        <div className="mkt-card">
          <div className="mkt-coins-cost">2</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Scheduled post</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15 }}>
            Two coins per channel when a post is scheduled. Drafts and later edits are free.
          </p>
        </div>
      </div>

      <div className="mkt-card-soft" style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--mkt-soft)', fontSize: 15, margin: 0 }}>
          Need more than your monthly grant? Request a top-up from Coins inside the
          dashboard — the Zyntra team adds them to your wallet. Videos and clipping
          use plan credits, not coins.
        </p>
      </div>
    </div>
  );
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
                Free to start
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
