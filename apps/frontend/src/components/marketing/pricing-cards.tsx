export function CoinsExplainer() {
  return (
    <div className="mkt-coins-block">
      <div className="mkt-grid-3">
        <div className="mkt-card">
          <div className="mkt-coins-cost">1</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>AI agent message</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15, margin: 0 }}>
            Each chat message to the agent costs one coin.
          </p>
        </div>
        <div className="mkt-card">
          <div className="mkt-coins-cost">5</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>AI image</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15, margin: 0 }}>
            Five coins per image, plus a plan image credit when your tier includes
            them.
          </p>
        </div>
        <div className="mkt-card">
          <div className="mkt-coins-cost">2</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Scheduled post</h3>
          <p style={{ color: 'var(--mkt-soft)', fontSize: 15, margin: 0 }}>
            Two coins per channel when a post is scheduled. Drafts and later edits
            are free.
          </p>
        </div>
      </div>
    </div>
  );
}
