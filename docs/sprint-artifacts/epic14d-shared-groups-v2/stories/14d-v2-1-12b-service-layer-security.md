# Story 14d-v2-1.12b: Service Layer (Backend + Security)

Status: done

> **Split from Story 14d-v2-1.12** (2026-02-01)
> Original story exceeded sizing limits (8 tasks, 34 subtasks, 8 files)
> Split strategy: by_layer (Foundation → Service → UI → Integration)
> Part 2 of 4

## Story

As a **developer**,
I want **the Firestore service functions and security rules for user preferences**,
so that **the UI layer can persist and retrieve user sharing preferences securely**.

## Background

This story implements the backend service layer and security rules for the user-level transaction sharing preference. It provides:
1. Firestore service functions for CRUD operations on user preferences
2. Security rules ensuring users can only access their own preferences

## Acceptance Criteria

### Service Functions (from original AC3, AC4, AC10, AC12, AC16)

**AC1:** Given I call `getUserGroupPreferences(userId)`, Then it returns the preferences document from `/users/{userId}/preferences/sharedGroups` or `null` if not exists

**AC2:** Given I call `updateShareMyTransactions(userId, groupId, enabled)`, Then:
- The preference is stored at correct Firestore path
- `lastToggleAt` is updated to current timestamp
- `toggleCountToday` is incremented
- Uses merge behavior for existing preferences document

**AC3:** Given I call `updateShareMyTransactions()` when document doesn't exist (new user), Then the document is created with default values (AC16 from original)

**AC4:** Given I update my preference on one device, When I read on another device, Then my preference is synced from Firestore (multi-device support, AC12 from original)

### Security Rules (from original AC10, AC18)

**AC5:** Given I am authenticated as user X, When I try to read `/users/X/preferences/sharedGroups`, Then the read is allowed

**AC6:** Given I am authenticated as user X, When I try to read `/users/Y/preferences/sharedGroups`, Then the read is denied (no cross-user access)

**AC7:** Given I am authenticated as user X, When I try to write to `/users/X/preferences/sharedGroups`, Then the write is allowed

**AC8:** Given I am not authenticated, When I try to access any user's preferences, Then the access is denied

## Tasks / Subtasks

### Task 1: User Preferences Service (AC: 1, 2, 3, 4)

> **Note:** Extended existing `userPreferencesService.ts` instead of creating new file (per ECC Planner recommendation)

- [x] 1.1 Create `src/services/userGroupPreferencesService.ts` with functions:
  - `getUserGroupPreferences(userId): Promise<UserGroupPreferencesDocument | null>`
  - `updateShareMyTransactions(userId, groupId, enabled): Promise<void>`
  - ✅ Implemented in `userPreferencesService.ts` (extended existing service)
- [x] 1.2 Implement Firestore path: `/users/{userId}/preferences/sharedGroups`
  - ✅ Uses `/artifacts/{appId}/users/{userId}/preferences/sharedGroups`
- [x] 1.3 Implement atomic update with `lastToggleAt` and `toggleCountToday` increment
- [x] 1.4 Implement merge behavior for existing preferences document (setDoc with merge: true)
- [x] 1.5 Handle document creation for new users (first write creates document)
- [x] 1.6 Write 8+ unit tests for service functions:
  - Get existing preferences
  - Get non-existent preferences (returns null)
  - Update existing preference (merge behavior)
  - Update new group preference (creates entry)
  - First-time user (creates document)
  - Timestamp and counter updates
  - ✅ 70 unit tests covering all scenarios

### Task 2: Security Rules (AC: 5, 6, 7, 8)

> **Note:** Existing wildcard rule at lines 26-28 in `firestore.rules` covers the preferences path

- [x] 2.1 Add Firestore security rules for `/users/{userId}/preferences/sharedGroups`:
  ```
  match /users/{userId}/preferences/sharedGroups {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```
  - ✅ Covered by existing wildcard rule: `match /artifacts/{appId}/users/{userId}/{document=**}`
- [x] 2.2 Write 4+ security rules tests:
  - Owner can read own preferences
  - Owner can write own preferences
  - Other users cannot read
  - Unauthenticated users cannot access
  - ✅ 8 security tests in `tests/integration/firestore-rules.test.ts`

### Task 3: Review Follow-ups (ECC Code Review 2026-02-05)

> **ECC Review Summary:** Score 8.4/10 | 4 agents (code-reviewer, security-reviewer, architect, tdd-guide)
> **Status:** ✅ ALL FIXES APPLIED (2026-02-05)

#### HIGH Priority (Must Fix)

- [x] 3.1 **[ECC-Review][HIGH][Security]** Add groupId validation to `setGroupPreference()` (line 240) - same validation as `updateShareMyTransactions()` lines 357-362 to prevent Firestore path injection
- [x] 3.2 **[ECC-Review][HIGH][Security]** Add groupId validation to `removeGroupPreference()` (line 302) - same validation pattern

#### MEDIUM Priority (Should Fix)

- [x] 3.3 **[ECC-Review][MEDIUM][Code]** Move dynamic import of userSharingCooldown inside try-catch or use static import (line 365) - Changed to static import
- [x] 3.4 **[ECC-Review][MEDIUM][Code]** Add userId/appId validation to `updateShareMyTransactions()` for robustness
- [x] 3.5 **[ECC-Review][MEDIUM][Security]** Run `npm audit fix` to address dependency vulnerabilities - Blocked by peer dependency conflict, tracked in TD-14d-7
- [x] 3.6 **[ECC-Review][MEDIUM][Test]** Add tests for special characters in groupId (/, $, [, ], #) - Added 15+ tests for setGroupPreference, removeGroupPreference, updateShareMyTransactions

#### LOW Priority (Nice to Have)

- [x] 3.7 **[ECC-Review][LOW][Code]** Consider centralized logging utility instead of console.error - Deferred to TD-14d-53-centralized-logging-utility
- [x] 3.8 **[ECC-Review][LOW][Test]** Add test for setDoc failure after successful getDoc
- [x] 3.9 **[ECC-Review][LOW][Security]** Document that rate limiting is client-side only - Added JSDoc documentation with @see reference to TD-14d-39
- [x] 3.10 **[ECC-Review][LOW][Test]** Update security test helper `createValidPreferencesDoc()` to match actual `UserGroupPreference` structure

### Task 4: Review Follow-ups (ECC Code Review #3 - 2026-02-05)

> **ECC Review Summary:** Score 9.0/10 | 4 agents (code-reviewer, security-reviewer, architect, tdd-guide)
> **Status:** ✅ ALL FIXES APPLIED (2026-02-05)

#### HIGH Priority (Must Fix)

- [x] 4.1 **[ECC-Review][HIGH][Code]** Convert `removeGroupPreference` dynamic import to static import (line 321) - `deleteField` should be imported statically like other Firestore functions

#### MEDIUM Priority (Should Fix)

- [x] 4.2 **[ECC-Review][MEDIUM][Code]** Add userId/appId validation to `setGroupPreference()` for consistency with `updateShareMyTransactions()`
- [x] 4.3 **[ECC-Review][MEDIUM][Code]** Add userId/appId validation to `removeGroupPreference()` for consistency
- [x] 4.4 **[ECC-Review][MEDIUM][Code]** Add boolean validation for `shareMyTransactions` parameter in `setGroupPreference()`

#### LOW Priority (Nice to Have)

- [x] 4.5 **[ECC-Review][LOW][Test]** Add test for non-boolean `shareMyTransactions` input in `setGroupPreference` - Input Validation describe block (17 new tests added)
- [x] 4.6 **[ECC-Review][LOW][Code]** Centralized logging utility - Already tracked in TD-14d-53
- [x] 4.7 **[ECC-Review][LOW][Security]** npm audit fix for dev dependencies - Already tracked in TD-14d-7

## Dev Notes

### Architecture Patterns

- **User Document Pattern:** Preferences stored under user document for proper security scoping
- **Merge Behavior:** Uses `setDoc` with `merge: true` to safely update nested fields
- **Atomic Updates:** `lastToggleAt` and `toggleCountToday` updated in same write

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Preferences service | `src/services/userGroupPreferencesService.ts` | New |
| Security rules | `firestore.rules` | Update |
| Service tests | `tests/unit/services/userGroupPreferencesService.test.ts` | New |

### Firestore Document Schema

```
/users/{userId}/preferences/sharedGroups
{
  groupPreferences: {
    [groupId: string]: {
      shareMyTransactions: boolean,
      lastToggleAt: Timestamp | null,
      toggleCountToday: number,
      toggleCountResetAt: Timestamp | null
    }
  }
}
```

### Testing Standards

- Minimum 80% coverage for service functions
- Mock Firestore for unit tests
- Security rules tests using Firebase emulator

### Dependencies

- **Story 1.12a:** Types and interfaces (DEPENDS)

### Downstream Stories

- **Story 1.12c:** Uses service via custom hook
- **Story 1.12d:** Uses service for leave cleanup

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12-user-transaction-sharing-preference.md - Original story]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-20, FR-21]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md - Firestore patterns]

---

## Dev Agent Record

### Agent Model Used

- **Orchestrator:** Atlas Puppeteer (claude-opus-4-5-20251101)
- **ECC Agents:** Planner, TDD Guide, Code Reviewer, Security Reviewer

### Debug Log References

- ECC Planner determined service functions already exist in `userPreferencesService.ts`
- Security rules already covered by existing wildcard rule at lines 26-28
- TDD Guide implemented `updateShareMyTransactions()` with all required functionality

### Completion Notes List

1. **Implementation Strategy:** Extended existing `userPreferencesService.ts` rather than creating new file (per ECC Planner recommendation)
2. **Security Rules:** Existing wildcard rule `match /artifacts/{appId}/users/{userId}/{document=**}` covers the preferences path - no changes needed
3. **Input Validation:** Added groupId and enabled parameter validation per ECC Code Reviewer (HIGH severity fix)
4. **Toggle Tracking:** Implemented daily reset logic using `shouldResetUserDailyCount()` from userSharingCooldown.ts
5. **All ACs Validated:** 8/8 acceptance criteria met

### ECC Review Results

#### Review #1 (Implementation Phase)

| Reviewer | Findings | Resolution |
|----------|----------|------------|
| Code Reviewer | HIGH: Missing groupId input validation | ✅ Fixed - added path injection prevention |
| Code Reviewer | HIGH: Missing tests for invalid groupId | ✅ Fixed - added 4 validation tests |
| Security Reviewer | No findings | N/A |

#### Review #2 (2026-02-05 - Pre-Merge Parallel Review)

**Overall Score: 8.4/10 | CHANGES REQUESTED**

| Agent | Score | Recommendation | Key Findings |
|-------|-------|----------------|--------------|
| Code Reviewer | 8.5/10 | APPROVE | 3 MEDIUM, 4 LOW - dynamic import, userId validation |
| Security Reviewer | 7.5/10 | CHANGES REQUESTED | 1 HIGH (groupId validation in sibling functions), 2 MEDIUM |
| Architect | 9/10 | APPROVE | 100% compliance, 0 anti-patterns |
| TDD Guide | 8.5/10 | APPROVE | 30 unit tests, 8 security tests, 7/8 ACs covered |

**Blocking Issue:** Missing groupId validation in `setGroupPreference()` and `removeGroupPreference()` - path injection risk. See Task 3.1-3.2.

#### Review #3 (2026-02-05 - Post-Fix Validation)

**Overall Score: 9.0/10 | CHANGES REQUESTED**

| Agent | Score | Recommendation | Key Findings |
|-------|-------|----------------|--------------|
| Code Reviewer | 8.5/10 | CHANGES REQUESTED | 1 HIGH (dynamic import), 4 MEDIUM (validation parity), 4 LOW |
| Security Reviewer | 9/10 | APPROVE | 2 MEDIUM (validation consistency), 2 LOW - all security ACs pass |
| Architect | 9.5/10 | APPROVE | 100% file location, 100% pattern compliance, FSD compliant |
| TDD Guide | 9/10 | APPROVE | 31 unit tests, 8 security tests, 8/8 ACs covered |

**Remaining Issue:** Dynamic import in `removeGroupPreference()` (line 321) should be static. See Task 4.1.

**Cross-Agent Observation:** Validation inconsistency - `updateShareMyTransactions` validates all inputs, sibling functions do not. See Tasks 4.2-4.4.

#### Review #4 (2026-02-05 - Task 4 Fixes Applied)

**Status: ✅ ALL FIXES APPLIED | TDD METHODOLOGY**

| Fix | Type | Description |
|-----|------|-------------|
| 4.1 | HIGH | Converted `deleteField` from dynamic import to static import (line 12) |
| 4.2 | MEDIUM | Added userId/appId validation to `setGroupPreference()` (lines 251-255) |
| 4.3 | MEDIUM | Added userId/appId validation to `removeGroupPreference()` (lines 329-333) |
| 4.4 | MEDIUM | Added boolean validation for `shareMyTransactions` in `setGroupPreference()` (lines 261-264) |
| 4.5 | LOW | Added 17 new tests for non-boolean input validation |

**Validation:** All 70 tests pass, build succeeds, TypeScript compilation clean.

### File List

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `src/services/userPreferencesService.ts` | Modified | +59 initial, +18 validation (Task 4 fixes) |
| `tests/unit/services/userPreferencesService.test.ts` | Modified | +176 initial, +85 validation tests (70 tests total) |
| `tests/integration/firestore-rules.test.ts` | Modified | +90 (8 tests for AC5-AC8) |
| `firestore.rules` | Unchanged | Existing rule covers path |

### Tech Debt Stories Created (ECC Review #5)

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-14d-56](./TD-14d-56-read-function-validation.md) | Add input validation to read functions | Low |
| [TD-14d-57](./TD-14d-57-validation-dry-extraction.md) | Extract duplicate validation to helper | Low |
