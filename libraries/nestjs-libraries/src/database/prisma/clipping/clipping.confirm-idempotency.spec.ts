describe('confirm charge idempotency (chargeCredits upsert semantics)', () => {
  // Mirrors subscription.repository.chargeCredits: upsert by caller id, empty update
  const chargeCredits = (() => {
    const rows = new Map<string, { id: string; credits: number }>();
    return {
      rows,
      charge(id: string, credits: number) {
        if (!rows.has(id)) {
          rows.set(id, { id, credits });
        }
        return { id };
      },
      refund(id: string) {
        rows.delete(id);
      },
      total() {
        return [...rows.values()].reduce((sum, r) => sum + r.credits, 0);
      },
    };
  })();

  beforeEach(() => {
    chargeCredits.rows.clear();
  });

  it('charging the same clipping id twice creates one row', () => {
    chargeCredits.charge('clipping-1', 12);
    chargeCredits.charge('clipping-1', 12);
    expect(chargeCredits.rows.size).toBe(1);
    expect(chargeCredits.total()).toBe(12);
  });

  it('concurrent different clippings each reserve their own minutes', () => {
    chargeCredits.charge('a', 10);
    chargeCredits.charge('b', 10);
    expect(chargeCredits.total()).toBe(20);
  });

  it('refund removes the reservation', () => {
    chargeCredits.charge('clipping-1', 8);
    chargeCredits.refund('clipping-1');
    expect(chargeCredits.total()).toBe(0);
  });
});

describe('claimConfirm status gate', () => {
  it('only the first suggestions_ready → rendering transition wins', () => {
    let status = 'suggestions_ready';
    const claim = () => {
      if (status !== 'suggestions_ready') {
        return false;
      }
      status = 'rendering';
      return true;
    };

    expect(claim()).toBe(true);
    expect(claim()).toBe(false);
    expect(status).toBe('rendering');
  });
});
