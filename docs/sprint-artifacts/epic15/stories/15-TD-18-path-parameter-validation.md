# Story 15-TD-18: Path Parameter Format Validation

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** ready-for-dev

## Description

Add format validation for `userId`, `transactionId`, and `notificationId` parameters in `firestorePaths.ts` path builder functions, and clean up the dead `validateAppId` function in `validation.ts`.

## Source

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-8
> **Priority:** MEDIUM
> **Estimated Effort:** 2 points

- **Finding #1 (HIGH):** userId/transactionId/notificationId are passed directly into path templates without format validation. A malformed value like `../admin` could construct a path that escapes user scope. Mitigated by Firestore Security Rules (`auth.uid == userId`) but defense-in-depth calls for code-level validation.
- **Finding #3 (HIGH):** `validateAppId` in `validation.ts` (allowlist-based, `['boletapp']`) has zero callers after TD-8 connected format validation via `assertValidAppId` in `firestorePaths.ts`. Dead code should be removed or connected at the app layer.

## Acceptance Criteria

- [ ] **AC1:** All path builder functions in `firestorePaths.ts` validate `userId` format (no `/`, `..`, or control chars)
- [ ] **AC2:** `transactionDocSegments` validates `transactionId` format
- [ ] **AC3:** `notificationDocSegments` validates `notificationId` format
- [ ] **AC4:** Dead `validateAppId` in `validation.ts` either connected at auth initialization or removed
- [ ] **AC5:** Unit tests for invalid userId/transactionId/notificationId values
- [ ] **AC6:** All existing tests pass

## Tasks

- [ ] **Task 1:** Add `assertValidSegment(value, label)` helper in `firestorePaths.ts`
  - [ ] Reuse same `/^[a-zA-Z0-9_-]+$/` pattern (or similar safe charset)
  - [ ] Apply to `userId` in all 14 functions
  - [ ] Apply to `transactionId` in `transactionDocSegments`
  - [ ] Apply to `notificationId` in `notificationDocSegments`
- [ ] **Task 2:** Resolve dead `validateAppId` in `validation.ts`
  - [ ] Evaluate: connect at auth/app init OR remove entirely
  - [ ] Update/remove tests accordingly
- [ ] **Task 3:** Add unit tests for segment validation
  - [ ] Parametrized invalid values: `../hack`, `user/id`, empty string
  - [ ] Verify all 14 functions validate userId

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firestorePaths.ts` | MODIFY | Add assertValidSegment for userId/transactionId/notificationId |
| `src/utils/validation.ts` | MODIFY | Remove or connect dead validateAppId |
| `tests/unit/lib/firestorePaths.test.ts` | MODIFY | Add segment validation tests |
| `tests/unit/utils/validation.test.ts` | MODIFY | Update if validateAppId removed |

## Dev Notes

- Source story: [15-TD-8](./15-TD-8-input-validation-hardening.md)
- Review findings: #1, #3
- Firestore Security Rules provide server-side mitigation (`auth.uid == userId`)
- `userId` in practice comes from `auth.currentUser.uid` (well-formed Firebase Auth UID)
- Defense-in-depth: validate at code layer even though rules enforce at server layer
