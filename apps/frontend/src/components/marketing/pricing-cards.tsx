import { Sticker } from '@gitroom/frontend/components/marketing/sections';

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
