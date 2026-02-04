# Tech Debt Story TD-14d-11: Atomic Membership Validation with Firestore Transactions

Status: ready-for-dev

> **Source:** ECC Security Review (2026-02-03) on story 14d-v2-1-8a
> **Priority:** LOW (narrow race window, defense-in-depth exists)
> **Estimated Effort:** Medium (Firestore transaction refactor)
> **Risk:** LOW (security rules provide backup protection)

## Story

As a **security engineer**,
I want **atomic membership validation when writing changelog entries**,
So that **removed members cannot inject final changelog entries during the race window**.

## Problem Statement

The changelog writer has a Time-of-Check to Time-of-Use (TOCTOU) race condition:

```typescript
// Step 1: Check membership (time T1)
const isMember = await isUserGroupMember(actorId, groupId);
if (!isMember) return;

// Step 2: Write changelog (time T2)
await changelogRef.set(entry);
```

Between T1 and T2, a user could be removed from the group, but their changelog write would still succeed.

### Attack Scenario

1. User A is member of Group X
2. Owner removes User A from Group X
3. User A quickly updates a transaction with `sharedGroupId = X`
4. Cloud Function triggers:
   - T1: Membership check passes (stale read)
   - T2: Changelog entry written
5. User A has injected a final entry after removal

### Mitigations Already in Place

1. **Firestore Security Rules** (firestore.rules:119-147): Changelog writes require group membership
2. **Narrow Window**: Race condition requires precise timing
3. **Limited Impact**: Only one entry can be injected, content is user's own transaction

## Acceptance Criteria

1. **Given** a user is removed from a group
   **When** their transaction update triggers the Cloud Function
   **And** the membership check and write are atomic
   **Then** the changelog write fails if membership changed

2. **Given** a user is still a member
   **When** their transaction update triggers the Cloud Function
   **Then** the changelog entry is written successfully (no regression)

## Tasks / Subtasks

- [ ] **Task 1: Refactor to Firestore Transaction**
  - [ ] 1.1: Wrap membership check + changelog write in `db.runTransaction()`
  - [ ] 1.2: Use `t.get()` for membership read (ensures consistency)
  - [ ] 1.3: Use `t.set()` for changelog write
  - [ ] 1.4: Handle transaction retry logic

- [ ] **Task 2: Update Tests**
  - [ ] 2.1: Add test for concurrent membership removal
  - [ ] 2.2: Verify transaction rollback on membership check failure

- [ ] **Task 3: Performance Validation**
  - [ ] 3.1: Benchmark transaction overhead vs current pattern
  - [ ] 3.2: Document any latency impact

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Security improvement | Marginal (rules already protect) | Same |
| Performance | Slight overhead from transactions | No change |
| Complexity | Higher (transaction error handling) | Simple |
| Accumulation risk | None | None |
| Dependency risk | None | None |

**Recommendation:** Defer - Security rules provide adequate protection, and the race window is extremely narrow.

### Implementation Approach

```typescript
async function createChangelogEntryAtomic(
  groupId: string,
  eventId: string,
  entryType: ChangelogEntryType,
  transactionId: string,
  actorId: string,
  transactionData: TransactionData | null
): Promise<void> {
  await db.runTransaction(async (t) => {
    // Atomic read
    const groupDoc = await t.get(db.collection('sharedGroups').doc(groupId));

    if (!groupDoc.exists) {
      throw new Error('Group does not exist');
    }

    const members = groupDoc.data()?.members || [];
    if (!members.includes(actorId)) {
      throw new Error('Actor is not a group member');
    }

    // Atomic write
    const changelogRef = db
      .collection('sharedGroups')
      .doc(groupId)
      .collection('changelog')
      .doc(`${eventId}-${entryType}`);

    t.set(changelogRef, entry);
  });
}
```

### Performance Considerations

- Firestore transactions add ~50-100ms latency
- Group change scenario (REMOVED + ADDED) would need two transactions
- Consider batching both writes in single transaction for group moves

### Files Affected

| File | Action |
|------|--------|
| `functions/src/changelogWriter.ts` | MODIFY (refactor to transactions) |
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFY (add transaction tests) |

### References

- [14d-v2-1-8a](./14d-v2-1-8a-changelog-writer-foundation.md) - Source of this tech debt item
- [CWE-367](https://cwe.mitre.org/data/definitions/367.html) - TOCTOU Race Condition
- [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
