# Tech Debt Story TD-14d-42: Add Network Error Handling Test

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (test coverage enhancement)
> **Estimated Effort:** XS (< 1 hour)
> **Risk:** LOW (test only)

## Story

As a **developer**,
I want **a unit test for network/Firestore error handling in updateTransactionSharingEnabled**,
So that **error propagation behavior is documented and regression-tested**.

## Problem Statement

The story AC5 mentioned "Network error handling" as an expected test scenario, but it was not implemented. Current test count (10) exceeds requirement (6+), so this was deferred.

## Acceptance Criteria

- [ ] AC1: Test for Firestore transaction failure (network error)
- [ ] AC2: Test verifies error is propagated correctly
- [ ] AC3: Test uses realistic mock error

## Tasks / Subtasks

- [ ] 1.1 Add test case for `runTransaction` rejection
- [ ] 1.2 Verify error message is propagated

## Dev Notes

### Proposed Test

```typescript
it('propagates Firestore errors on network failure', async () => {
    const networkError = new Error('Network request failed');
    mockRunTransaction.mockRejectedValueOnce(networkError);

    await expect(
        updateTransactionSharingEnabled(mockDb, TEST_GROUP_ID, OWNER_ID, true)
    ).rejects.toThrow('Network request failed');
});
```

### Files Affected

- `tests/unit/features/shared-groups/services/groupService.test.ts` (+10 lines)

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
