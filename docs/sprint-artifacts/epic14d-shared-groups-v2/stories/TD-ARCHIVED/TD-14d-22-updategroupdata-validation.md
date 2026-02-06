# Tech Debt Story TD-14d-22: updateGroupData Validation & Documentation

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-10a
> **Priority:** LOW (Defensive improvement, not blocking)
> **Estimated Effort:** 1-2 hrs
> **Risk:** LOW (updateGroupData typically receives fresh Firestore data)

## Story

As a **developer**,
I want **updateGroupData to validate input consistently with setGroupMode**,
So that **invalid state is prevented and behavior is well-documented**.

## Problem Statement

The `setGroupMode` action includes robust input validation (empty string, whitespace, type check, group.id mismatch), but `updateGroupData` accepts any SharedGroup without validation. This inconsistency could theoretically allow invalid state, though in practice the function is typically called with fresh data from Firestore queries.

Additionally, the current JSDoc for `updateGroupData` does not document that it allows setting a group with `id` different from the current `groupId` - this may be intentional behavior (caching outdated group data) but should be documented.

## Acceptance Criteria

1. **Given** updateGroupData is called with null or undefined group
   **When** the action executes
   **Then** the state is not updated
   **And** a DEV-only warning is logged

2. **Given** updateGroupData is called with a group missing `id` property
   **When** the action executes
   **Then** the state is not updated
   **And** a DEV-only warning is logged

3. **Given** the updateGroupData JSDoc
   **When** a developer reads it
   **Then** it clearly documents that group.id is not validated against current groupId
   **And** explains when to use updateGroupData vs setGroupMode

4. **Given** the store tests
   **When** validation edge cases are tested
   **Then** tests cover: null group, missing group.id, empty string id

## Tasks / Subtasks

- [ ] Task 1: Add input validation to updateGroupData (AC: #1, #2)
  - [ ] Add null/undefined check
  - [ ] Add group.id existence and type check
  - [ ] Add DEV-only console.warn for invalid input
  - [ ] Ensure action returns early without state change for invalid input

- [ ] Task 2: Update JSDoc documentation (AC: #3)
  - [ ] Document that group.id is not validated against groupId
  - [ ] Explain use case: updating cached group data from subscription
  - [ ] Add @example showing proper usage

- [ ] Task 3: Add validation tests (AC: #4)
  - [ ] Test: rejects null group
  - [ ] Test: rejects undefined group
  - [ ] Test: rejects group without id property
  - [ ] Test: rejects group with empty string id

## Dev Notes

### Current Implementation

```typescript
// src/shared/stores/useViewModeStore.ts:136-137
updateGroupData: (group) =>
  set({ group }, false, 'viewMode/updateGroupData'),
```

### Recommended Implementation

```typescript
updateGroupData: (group) => {
  // Validate group has required id property
  if (!group || !group.id || typeof group.id !== 'string' || group.id.trim() === '') {
    if (import.meta.env.DEV) {
      console.warn('[ViewModeStore] updateGroupData called with invalid group');
    }
    return;
  }
  set({ group }, false, 'viewMode/updateGroupData');
},
```

### Design Decision

The validation intentionally does NOT check if `group.id` matches current `groupId`. This allows caching group data from subscriptions even when the user might be switching between groups. If strict matching is needed, use `setGroupMode(groupId, group)` instead.

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Sprint capacity | 1-2 hrs | Scheduled later |
| Accumulation risk | Low | Low |
| Dependency risk | None | None |

**Recommendation:** Defer - Safe to implement whenever capacity allows

### References

- [14d-v2-1-10a Story](./14d-v2-1-10a-viewmode-store-integration.md) - Source of this tech debt item
- [useViewModeStore.ts](../../../src/shared/stores/useViewModeStore.ts) - File to modify
