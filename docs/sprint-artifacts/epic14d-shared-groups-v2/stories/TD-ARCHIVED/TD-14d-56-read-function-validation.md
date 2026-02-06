# Tech Debt Story TD-14d-56: Read Function Input Validation

Status: ready-for-dev

> **Source:** ECC Code Review #5 (2026-02-05) on story 14d-v2-1-12b
> **Priority:** Low (defense-in-depth, Firestore rules already protect)
> **Estimated Effort:** 15 minutes
> **Risk:** Low (security rules provide primary protection)

## Story

As a **developer**,
I want **input validation on read functions matching write functions**,
So that **the service layer has consistent validation and defense-in-depth**.

## Problem Statement

The `getUserSharedGroupsPreferences()` and `getGroupPreference()` functions lack input validation for `userId`, `appId`, and `groupId` parameters, while the write functions (`setGroupPreference`, `removeGroupPreference`, `updateShareMyTransactions`) validate all inputs.

This inconsistency:
1. Could allow malformed inputs to reach Firestore (though security rules protect against unauthorized access)
2. Creates cognitive overhead when maintaining the service
3. Violates the defense-in-depth pattern documented in Atlas Knowledge

**Current state:**
- Write functions: Full validation (userId, appId, groupId, boolean params)
- Read functions: No validation

## Acceptance Criteria

**AC1:** Given I call `getUserSharedGroupsPreferences(db, '', appId)` with empty userId, Then an error is thrown with message "Invalid userId: must be a non-empty string"

**AC2:** Given I call `getUserSharedGroupsPreferences(db, userId, '')` with empty appId, Then an error is thrown with message "Invalid appId: must be a non-empty string"

**AC3:** Given I call `getGroupPreference(db, userId, appId, '')` with empty groupId, Then an error is thrown with message "Invalid groupId: must be a non-empty string without dots"

**AC4:** Given I call `getGroupPreference(db, userId, appId, 'test.malicious')` with dots in groupId, Then an error is thrown with message "Invalid groupId: must be a non-empty string without dots"

**AC5:** All validation patterns match existing write function validation exactly

## Tasks / Subtasks

### Task 1: Add Validation to getUserSharedGroupsPreferences

- [ ] 1.1 Add userId validation at start of function (lines ~209)
- [ ] 1.2 Add appId validation at start of function
- [ ] 1.3 Write 4 unit tests for validation (empty userId, empty appId, non-string types)

### Task 2: Add Validation to getGroupPreference

- [ ] 2.1 Add userId validation at start of function (lines ~302)
- [ ] 2.2 Add appId validation at start of function
- [ ] 2.3 Add groupId validation (including dot check)
- [ ] 2.4 Write 6 unit tests for validation (empty values, dots in groupId, non-string types)

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Context window fit | Fits easily | Clean separation |
| Sprint capacity | 15 min effort | Scheduled later |
| Accumulation risk | Resolved | Low - rules protect |
| Dependency risk | None | None |

**Recommendation:** Can be done opportunistically when touching this file for other work.

### Implementation Pattern

Use the same validation pattern as write functions:

```typescript
// At start of getUserSharedGroupsPreferences:
if (!userId || typeof userId !== 'string') {
  throw new Error('Invalid userId: must be a non-empty string');
}
if (!appId || typeof appId !== 'string') {
  throw new Error('Invalid appId: must be a non-empty string');
}

// At start of getGroupPreference (add groupId validation too):
if (!groupId || typeof groupId !== 'string' || groupId.includes('.')) {
  throw new Error('Invalid groupId: must be a non-empty string without dots');
}
```

### Dependencies

- None

### References

- [14d-v2-1-12b-service-layer-security.md](./14d-v2-1-12b-service-layer-security.md) - Source of this tech debt item
- [userPreferencesService.ts:204-226](../../src/services/userPreferencesService.ts#L204-L226) - getUserSharedGroupsPreferences
- [userPreferencesService.ts:296-309](../../src/services/userPreferencesService.ts#L296-L309) - getGroupPreference

---

## File List

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `src/services/userPreferencesService.ts` | Modified | +12 (validation) |
| `tests/unit/services/userPreferencesService.test.ts` | Modified | +40 (10 tests) |
