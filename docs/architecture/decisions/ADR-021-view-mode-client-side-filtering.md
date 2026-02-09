# ADR-021: View Mode Client-Side Filtering

## Status

Accepted (2026-02-04)

## Context

Story 14d-v2-1-10d implements view mode filtering to show Personal vs Group transactions. The filtering determines which transactions to display based on the `sharedGroupId` field. The ECC Security Review flagged that `filterTransactionsByViewMode()` performs filtering purely on the client side.

**Options considered:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Firestore `where` clause** | Filter at query time using `where('sharedGroupId', '==', groupId)` | Server-side enforcement, smaller payloads | Compound index required; fails for legacy documents missing `sharedGroupId`; separate subscriptions per view |
| **Client-side filtering** | Filter after data retrieval in `filterTransactionsByViewMode()` | Single subscription; handles legacy data; no compound index; consistent with soft-delete pattern | All transactions loaded into memory; filtering is not a security boundary |

## Decision

Use **client-side filtering** for view mode transaction filtering.

### Rationale

1. **Consistency with soft-delete pattern** — The codebase already uses client-side filtering for soft-deleted transactions (filtering after normalization in `firestore.ts`). Adding another client-side filter follows the same pattern.

2. **Legacy transaction support** — Older transactions lack the `sharedGroupId` field. Firestore `where('sharedGroupId', '==', null)` does not match documents where the field is absent entirely. Client-side filtering with `!sharedGroupId` handles all falsy cases correctly.

3. **No compound index required** — Avoids adding another Firestore composite index, keeping the index budget smaller.

4. **Single subscription** — One `onSnapshot` listener handles all view modes, reducing Firestore read costs and connection overhead. Switching between Personal and Group views is instant (no new query).

### Security Model

- **Client-side filtering is NOT a security boundary.** It is a UI convenience only.
- **Firestore security rules enforce data isolation:** Users can only read their own transactions via the rule `request.auth.uid == userId` on the `/artifacts/{appId}/users/{userId}/{document=**}` path.
- `sharedGroupId` is a **UI organization annotation**, not an access control field. A user's own transaction tagged with a group ID is still only accessible by that user.
- Even if client-side filtering is bypassed (e.g., DevTools), users can only see their own data. There is no cross-user data exposure.

### Implementation

The filtering is implemented in `src/utils/viewModeFilterUtils.ts`:

```typescript
// Simplified for clarity — actual implementation uses isPersonalTransaction() helper
export function filterTransactionsByViewMode(
    transactions: Transaction[],
    mode: ViewMode,       // 'personal' | 'group'
    groupId: string | null
): Transaction[] {
    if (mode === 'personal') {
        return transactions.filter(tx => !tx.sharedGroupId);
    }
    if (!groupId) return [];
    return transactions.filter(tx => tx.sharedGroupId === groupId);
}
```

Consumed by `useDashboardViewData`, `useHistoryViewData`, and `useTrendsViewData`.

## Consequences

### Positive

- Consistent with existing codebase patterns (soft-delete filtering)
- No migration required for legacy data without `sharedGroupId`
- Lower Firestore costs (single subscription per data type)
- Instant view switching (no network round-trip)

### Negative

- Slightly higher client memory usage (all transactions loaded regardless of view)
- If shared groups evolve to true cross-user data (Sub-Epic 2+), architecture must change

### Future Considerations

If implementing true cross-user shared transactions (Sub-Epic 2: Changelog-Driven Sync):
- Server-side filtering via Cloud Functions MUST be added
- Firestore rules must validate group membership for cross-user reads
- The `filterTransactionsByViewMode` function should be replaced or augmented with server-filtered data

## References

- [Story 14d-v2-1-10d](../../sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-10d-data-filtering-integration.md) — Source implementation
- [viewModeFilterUtils.ts](../../../src/utils/viewModeFilterUtils.ts) — Implementation
- ECC Parallel Code Review 2026-02-04 — Security Reviewer finding (MEDIUM)
- [firestore.rules](../../../firestore.rules) — Security rules enforcing user isolation
