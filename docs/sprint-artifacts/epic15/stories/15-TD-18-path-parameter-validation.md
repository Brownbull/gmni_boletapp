# Story 15-TD-18: Path Parameter Format Validation

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Description

Add format validation for `userId`, `transactionId`, and `notificationId` parameters in `firestorePaths.ts` path builder functions, and clean up the dead `validateAppId` function in `validation.ts`.

## Source

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-8
> **Priority:** MEDIUM
> **Estimated Effort:** 2 points

- **Finding #1 (HIGH):** userId/transactionId/notificationId are passed directly into path templates without format validation. A malformed value like `../admin` could construct a path that escapes user scope. Mitigated by Firestore Security Rules (`auth.uid == userId`) but defense-in-depth calls for code-level validation.
- **Finding #3 (HIGH):** `validateAppId` in `validation.ts` (allowlist-based, `['boletapp']`) has zero callers after TD-8 connected format validation via `assertValidAppId` in `firestorePaths.ts`. Dead code should be removed or connected at the app layer.

## Acceptance Criteria

- [x] **AC1:** All path builder functions in `firestorePaths.ts` validate `userId` format (no `/`, `..`, or control chars)
- [x] **AC2:** `transactionDocSegments` validates `transactionId` format
- [x] **AC3:** `notificationDocSegments` validates `notificationId` format
- [x] **AC4:** Dead `validateAppId` in `validation.ts` either connected at auth initialization or removed
- [x] **AC5:** Unit tests for invalid userId/transactionId/notificationId values
- [x] **AC6:** All existing tests pass

## Tasks

- [x] **Task 1:** Add `assertValidSegment(value, label)` helper in `firestorePaths.ts`
  - [x] Reuse same `/^[a-zA-Z0-9_-]+$/` pattern (or similar safe charset)
  - [x] Apply to `userId` in all 14 functions
  - [x] Apply to `transactionId` in `transactionDocSegments`
  - [x] Apply to `notificationId` in `notificationDocSegments`
- [x] **Task 2:** Resolve dead `validateAppId` in `validation.ts`
  - [x] Evaluate: connect at auth/app init OR remove entirely
  - [x] Update/remove tests accordingly
- [x] **Task 3:** Add unit tests for segment validation
  - [x] Parametrized invalid values: `../hack`, `user/id`, empty string
  - [x] Verify all 14 functions validate userId

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
- `validateAppId` removed (not connected) — zero callers, superseded by `assertValidAppId` in firestorePaths.ts
- `assertValidSegment` added with MAX_SEGMENT_LENGTH=256 (review finding fix)
- Tests: 88 firestorePaths tests (76→88), 18 validation tests (36→18 after dead code removal)
- ECC code review: APPROVE (2 MEDIUM addressed, 2 LOW accepted)
- ECC security review: APPROVE (regex blocks path traversal, null bytes, unicode, URL encoding)
- Future hardening: extend `*DocSegments` builders to airlocks, records, mappings, merchantTrust — tracked in [15-TD-23](./15-TD-23-doc-id-segment-validation.md)

## Senior Developer Review (ECC)

- **Review date:** 2026-02-12
- **Classification:** STANDARD
- **ECC agents:** code-reviewer, security-reviewer
- **Outcome:** APPROVE (9/10)
- **Quick fixes applied:** 4 (DRY refactor, typeof guard, boundary test, constant rationale comments)
- **TD stories created:** 1 (15-TD-23: doc-ID segment validation in service functions)

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-23](./15-TD-23-doc-id-segment-validation.md) | Document ID segment validation in service functions | LOW | CREATED |
