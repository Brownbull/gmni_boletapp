# Story 14c.19: Bug Fix - View Mode Persistence & Transaction Caching

**Status**: done
**Points**: 3
**Priority**: High
**Dependencies**: 14c.18 (View Mode User Persistence)

---

## Story

As a user with shared groups,
I want my view mode selection to persist between sessions and transactions to load from cache,
So that I don't have to re-select my group every time I open the app and don't wait for unnecessary re-fetches.

---

## Background

Story 14c.18 implemented view mode persistence to Firestore, but two bugs were discovered:

### Bug 1: Group Mode Never Applied from Firestore
**File:** `src/hooks/useViewModePreferencePersistence.ts` lines 82-90

The hook has a **no-op** for group mode - it logs the preference but never calls `setGroupMode()`:
```typescript
if (firestorePreference.mode === 'group' && firestorePreference.groupId) {
  // Comment says: "Don't apply yet - just set groupId, group will be validated later"
  // BUT IT DOES NOTHING! - no setGroupMode() call!
  console.log('Firestore preference: group mode', firestorePreference.groupId);
  // Missing: should set the groupId for validateAndRestoreMode to pick up
}
```

**Result:** Users returning to the app with a saved group preference silently lose it.

### Bug 2: Excessive Transaction Re-fetching
**File:** `src/hooks/useSharedGroupTransactions.ts`

The `refetchOnMount: true` setting forces a fresh Firestore fetch every time the component mounts, ignoring the React Query cache completely.

---

## Acceptance Criteria

### AC1: Group Mode Restored from Firestore
- Given a user previously selected a shared group
- When they close and reopen the app
- Then the app should restore group mode with the correct group

### AC2: Transaction Cache Utilized
- Given transactions were fetched in the last 5 minutes
- When the user returns to group view
- Then cached data should display immediately (no loading spinner)
- And background refresh can update data silently

### AC3: Group Validation Still Works
- Given a user's Firestore preference references a group they left
- When the app loads
- Then it should fall back to personal mode (not crash or show empty)

### AC4: localStorage Fallback Works
- Given Firestore preference is not available
- When the app loads
- Then localStorage preference should be used as fallback

---

## Tasks / Subtasks

### Task 1: Fix Group Mode Application

- [x] 1.1 In `useViewModePreferencePersistence.ts`, call `setGroupMode()` for Firestore group preference
- [x] 1.2 Ensure `validateAndRestoreMode()` validates the pending groupId
- [x] 1.3 Add integration test for Firestore → group mode restoration

### Task 2: Fix Transaction Caching (Deferred to 14c.20)

- [ ] 2.1 In `useSharedGroupTransactions.ts`, remove `refetchOnMount: true`
- [ ] 2.2 Verify `staleTime: 5 minutes` is respected (data shows immediately from cache)

> **Note:** Transaction caching changes deferred to Story 14c.20 for proper cost analysis and caching strategy evaluation.

### Task 3: Update Tests

- [x] 3.1 Add test: "should restore group mode from Firestore preference (14c.19 bug fix)"
- [x] 3.2 Add test: "should fallback to personal when Firestore group is invalid (14c.19)"
- [x] 3.3 Verify all 8 tests pass (6 original + 2 new)

---

## Definition of Done

- [x] Group mode persists and restores correctly between sessions
- [ ] Transactions load from cache when available (deferred to 14c.20)
- [x] All 8 tests pass (6 original + 2 new)
- [x] New tests added for the bug fixes (2 new tests)
- [x] Code review approved
- [ ] Deployed to production

---

## Dev Notes

### 2026-01-19 - Story Created

**Root Cause Analysis:**

1. **Group mode no-op:** In `useViewModePreferencePersistence.ts:82-90`, the code for group mode just logs but doesn't call `setGroupMode()`. The intention was to "wait for groups to load", but the state is never set, so `validateAndRestoreMode()` has nothing to validate.

2. **Cache ignored:** `refetchOnMount: true` in React Query means "always fetch fresh data on mount, regardless of cache". This defeats the purpose of the 5-minute `staleTime`.

### 2026-01-19 - Implementation Started (Never Committed)

**Note:** The original implementation was documented but never actually committed to the repository.

### 2026-01-20 - Re-implementation

**Bug 1 Fix (ACTUALLY IMPLEMENTED NOW):**
- Added `setGroupMode` to destructured functions from `useViewMode()`
- Changed no-op code to call `setGroupMode(firestorePreference.groupId)` when Firestore preference is group mode
- Added `setGroupMode` to useEffect dependency array
- `validateAndRestoreMode()` then validates the group exists and populates group data

**Bug 2 Status:**
- Deferred to Story 14c.20 for proper cost analysis evaluation
- `refetchOnMount: true` remains in place pending decision on caching strategy

**Tests Added:**
1. "should restore group mode from Firestore preference (14c.19 bug fix)"
2. "should fallback to personal when Firestore group is invalid (14c.19)"

All 8 tests pass (6 original + 2 new).

---

## File List

| File | Change |
|------|--------|
| `src/hooks/useViewModePreferencePersistence.ts` | Added setGroupMode call for Firestore preference |
| `tests/unit/hooks/useViewModePreferencePersistence.test.tsx` | Added 2 new tests |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-19 | Story created from bug investigation | Atlas Code Review |
| 2026-01-19 | Implementation documented but not committed | Atlas Code Review |
| 2026-01-20 | Bug 1 fix re-implemented and committed | Atlas Dev Story |
| 2026-01-20 | Code review approved - test count fixed (8 not 10) | Atlas Code Review |
