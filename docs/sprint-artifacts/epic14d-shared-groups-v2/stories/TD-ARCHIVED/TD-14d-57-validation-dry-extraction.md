# Tech Debt Story TD-14d-57: Validation Logic DRY Extraction

Status: ready-for-dev

> **Source:** ECC Code Review #5 (2026-02-05) on story 14d-v2-1-12b
> **Priority:** Low (maintainability improvement)
> **Estimated Effort:** 20 minutes
> **Risk:** Low (refactoring, no behavior change)

## Story

As a **developer**,
I want **centralized input validation for shared group preference functions**,
So that **validation logic is DRY and maintainable**.

## Problem Statement

Input validation for `userId`, `appId`, and `groupId` is duplicated across three functions in `userPreferencesService.ts`:
- `setGroupPreference()` (lines 249-264)
- `removeGroupPreference()` (lines 327-338)
- `updateShareMyTransactions()` (lines 396-410)

This duplication:
1. Increases maintenance burden (changes must be made in 3 places)
2. Risks inconsistency if one location is updated but others are not
3. Violates DRY principle

**Current state:** 3 copies of nearly identical validation code (~15 lines each = 45 lines total)
**Target state:** 1 helper function (~15 lines) + 3 calls (~3 lines each = 24 lines total)

## Acceptance Criteria

**AC1:** A new helper function `validateGroupPreferenceInputs(userId, appId, groupId)` is created in the service file

**AC2:** The helper throws the same error messages as the current inline validation:
- "Invalid userId: must be a non-empty string"
- "Invalid appId: must be a non-empty string"
- "Invalid groupId: must be a non-empty string without dots"

**AC3:** All three functions (`setGroupPreference`, `removeGroupPreference`, `updateShareMyTransactions`) use the helper

**AC4:** All existing tests continue to pass without modification

**AC5:** Boolean validation for `shareMyTransactions` and `enabled` parameters remains inline (function-specific)

## Tasks / Subtasks

### Task 1: Create Validation Helper

- [ ] 1.1 Create `validateGroupPreferenceInputs(userId, appId, groupId)` helper function
- [ ] 1.2 Add JSDoc documentation with @throws annotation
- [ ] 1.3 Place helper near other private helpers (around line 190)

### Task 2: Refactor Existing Functions

- [ ] 2.1 Replace inline validation in `setGroupPreference()` with helper call
- [ ] 2.2 Replace inline validation in `removeGroupPreference()` with helper call
- [ ] 2.3 Replace inline validation in `updateShareMyTransactions()` with helper call
- [ ] 2.4 Keep boolean validation inline (function-specific)

### Task 3: Verify Tests Pass

- [ ] 3.1 Run all userPreferencesService tests (70 tests)
- [ ] 3.2 Verify no test modifications needed (behavior unchanged)

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Medium if other stories touch validation | Low |
| Context window fit | Fits easily | Clean separation |
| Sprint capacity | 20 min effort | Scheduled later |
| Accumulation risk | 3 copies currently | Could grow with new functions |
| Dependency risk | None | None |

**Recommendation:** Do when adding new functions to this service, or opportunistically.

### Implementation

```typescript
/**
 * Validate common input parameters for shared group preference functions.
 *
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param groupId - The group ID to validate
 * @throws Error if any parameter is invalid
 */
function validateGroupPreferenceInputs(
  userId: string,
  appId: string,
  groupId: string
): void {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!appId || typeof appId !== 'string') {
    throw new Error('Invalid appId: must be a non-empty string');
  }
  if (!groupId || typeof groupId !== 'string' || groupId.includes('.')) {
    throw new Error('Invalid groupId: must be a non-empty string without dots');
  }
}

// Usage in functions:
export async function setGroupPreference(...) {
  validateGroupPreferenceInputs(userId, appId, groupId);
  // Boolean validation stays inline
  if (typeof shareMyTransactions !== 'boolean') {
    throw new Error('shareMyTransactions must be a boolean');
  }
  // ... rest of function
}
```

### Dependencies

- TD-14d-56 should be completed first (adds validation to read functions), then this refactor can include those too

### References

- [14d-v2-1-12b-service-layer-security.md](./14d-v2-1-12b-service-layer-security.md) - Source of this tech debt item
- [userPreferencesService.ts:249-264](../../src/services/userPreferencesService.ts#L249-L264) - setGroupPreference validation
- [userPreferencesService.ts:327-338](../../src/services/userPreferencesService.ts#L327-L338) - removeGroupPreference validation
- [userPreferencesService.ts:396-410](../../src/services/userPreferencesService.ts#L396-L410) - updateShareMyTransactions validation

---

## File List

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `src/services/userPreferencesService.ts` | Modified | +18 (helper), -45 (inline) = -27 net |
