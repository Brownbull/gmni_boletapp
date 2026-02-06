# Tech Debt Story TD-14d-44: Add Same-Value Toggle Test

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (edge case coverage)
> **Estimated Effort:** XS (< 1 hour)
> **Risk:** LOW (test only)

## Story

As a **developer**,
I want **a test for toggling to the same value (no-op behavior)**,
So that **the expected behavior when enabled=current is documented**.

## Problem Statement

No test exists for the scenario where `enabled` parameter matches current `transactionSharingEnabled` value. The current implementation will still:
1. Check cooldown (may block)
2. Increment toggle count
3. Update timestamp

This may or may not be desired behavior.

## Acceptance Criteria

- [ ] AC1: Test documents current behavior when toggling to same value
- [ ] AC2: If behavior should change (true no-op), implement early return

## Tasks / Subtasks

- [ ] 1.1 Add test for `enabled === current value` scenario
- [ ] 1.2 Document whether current behavior is intentional
- [ ] 1.3 (Optional) Add early return if no-op is desired

## Dev Notes

### Decision Needed

**Option A:** Current behavior (counts as toggle)
- Pro: Simpler implementation
- Con: Uses daily quota for no-ops

**Option B:** True no-op (early return if same value)
- Pro: Doesn't waste daily quota
- Con: Extra check needed

### Proposed Test

```typescript
it('handles toggling to same value', async () => {
    // Setup: group already has transactionSharingEnabled: true
    mockTransaction.mockResolvedValueOnce({
        ...mockGroup,
        transactionSharingEnabled: true,
    });

    await updateTransactionSharingEnabled(mockDb, TEST_GROUP_ID, OWNER_ID, true);

    // Document expected behavior (currently: still counts as toggle)
    expect(mockTransaction.update).toHaveBeenCalled();
});
```

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
