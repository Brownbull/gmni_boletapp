# Tech Debt Story TD-14d-13: N+1 Query Optimization in Group Change Scenario

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-8b
> **Priority:** LOW (acceptable cost, optimization only)
> **Estimated Effort:** Small (1-2 hours)
> **Risk:** LOW (current implementation works correctly)

## Story

As a **developer**,
I want **optimized Firestore reads when validating membership for group changes**,
So that **Cloud Function execution is faster and Firestore read costs are reduced**.

## Problem Statement

When a transaction moves between groups (groupA -> groupB), the changelog writer makes 2 separate Firestore reads to validate membership:

```typescript
// functions/src/changelogWriter.ts:550-555
const [beforeValid, afterValid] = await Promise.all([
  validateChangelogPrerequisites(beforeGroupId, userId, transactionId, 'TRANSACTION_REMOVED'),
  validateChangelogPrerequisites(afterGroupId, userId, transactionId, 'TRANSACTION_ADDED'),
]);
```

Each `validateChangelogPrerequisites` call invokes `isUserGroupMember()` which performs a `db.collection('sharedGroups').doc(groupId).get()`.

**Current cost:** 2 Firestore reads per group change event
**Optimized cost:** 1 Firestore read using `getAll()`

## Acceptance Criteria

1. **Given** a transaction moves from groupA to groupB
   **When** the Cloud Function validates membership
   **Then** only 1 Firestore read operation is performed (using `getAll()`)

2. **Given** the optimized read fails
   **When** the Cloud Function processes the error
   **Then** appropriate error handling occurs (same as current)

3. **Given** the optimization is applied
   **When** compared to current implementation
   **Then** latency is same or better (no regression)

## Tasks / Subtasks

- [ ] **Task 1: Create batch membership validation helper**
  - [ ] 1.1: Create `validateGroupMemberships(userId, groupIds[])` function
  - [ ] 1.2: Use `db.getAll(groupRef1, groupRef2)` for single read
  - [ ] 1.3: Return `Map<groupId, boolean>` for membership status

- [ ] **Task 2: Refactor group change scenario**
  - [ ] 2.1: Update Case 3 (group change) to use batch validation
  - [ ] 2.2: Maintain parallel validation semantics

- [ ] **Task 3: Update tests**
  - [ ] 3.1: Add test for batch membership validation
  - [ ] 3.2: Verify single read in group change scenario

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Context window fit | Fits easily | Clean separation |
| Sprint capacity | Uses ~1-2 hours | Scheduled for later |
| Accumulation risk | None | None |
| Cost savings | ~50% for group changes | None |

**Recommendation:** Defer - Group changes are rare (most operations are single-group), optimization ROI is low.

### Implementation Approach

```typescript
async function validateGroupMemberships(
  userId: string,
  groupIds: string[]
): Promise<Map<string, boolean>> {
  const validGroupIds = groupIds.filter(isValidGroupId);
  if (validGroupIds.length === 0) {
    return new Map(groupIds.map(id => [id, false]));
  }

  const groupRefs = validGroupIds.map(id => db.collection('sharedGroups').doc(id));
  const groupDocs = await db.getAll(...groupRefs);

  const results = new Map<string, boolean>();
  groupDocs.forEach((doc, index) => {
    const groupId = validGroupIds[index];
    if (!doc.exists) {
      results.set(groupId, false);
    } else {
      const members = doc.data()?.members || [];
      results.set(groupId, members.includes(userId));
    }
  });

  // Mark invalid groupIds as false
  groupIds.forEach(id => {
    if (!results.has(id)) {
      results.set(id, false);
    }
  });

  return results;
}
```

### Files Affected

| File | Action |
|------|--------|
| `functions/src/changelogWriter.ts` | MODIFY (add batch validation) |
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFY (add tests) |

### References

- [14d-v2-1-8b](./14d-v2-1-8b-changelog-writer-validation.md) - Source of this tech debt item
- [Firestore getAll()](https://firebase.google.com/docs/firestore/query-data/get-data#get_multiple_documents) - Batch read documentation
