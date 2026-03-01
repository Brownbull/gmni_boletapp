# Tech Debt Story TD-15b-28: Credits Hook & Repository Cleanup

Status: done

> **Source:** ECC Code Review (2026-02-28) on story 15b-3d
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story
As a **developer**, I want **credits hook and repository cleanup (test splitting, dead import removal, input validation, error sanitization)**, so that **test files stay within limits, dead code is removed, and defense-in-depth patterns are consistent**.

## Acceptance Criteria

- [x] **AC1:** `useUserCredits.test.tsx` split into 2 files under 300 lines each (e.g., reservation tests vs. mutation tests)
- [x] **AC2:** Deprecated `FirebaseServices` interface, `import type { Firestore }` removed from `useUserCredits.ts` (requires updating callers to stop passing `_services`)
- [x] **AC3:** CreditsRepository `add`/`addSuper`/`deduct`/`deductSuper` validate input (`Number.isFinite(amount) && amount > 0`) before delegating to service
- [x] **AC4:** Firestore service errors wrapped in user-safe messages before reaching UI state
- [x] **AC5:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Split test file
- [x] Split `tests/unit/hooks/useUserCredits.test.tsx` into `useUserCredits.test.tsx` (init + reserve/confirm/refund) and `useUserCredits.mutations.test.tsx` (deduct/add methods)
- [x] Each file under 300 lines

### Task 2: Remove deprecated _services param
- [x] Remove `FirebaseServices` interface and `_services` param from `useUserCredits`
- [x] Update all callers to stop passing services arg
- [x] Remove `import type { Firestore }` (becomes unused)

### Task 3: Add repository input validation
- [x] Add `Number.isFinite(amount) && amount > 0` guard to `add`, `addSuper`, `deduct`, `deductSuper` in `creditsRepository.ts`
- [x] Add unit tests for invalid inputs

### Task 4: Sanitize error messages
- [x] Wrap Firestore errors in user-safe Error objects before `setError()` in `useUserCredits.ts`

## Dev Notes
- Source story: [15b-3d](./15b-3d-dal-credits-hooks.md)
- Review findings: #1 (test split), #3 (dead imports), #6 (input validation), #7 (error sanitization)
- Files affected: `tests/unit/hooks/useUserCredits.test.tsx`, `src/hooks/useUserCredits.ts`, `src/repositories/creditsRepository.ts`
- AC2 note: `import type { User }` kept — actively used in function signature `user: User | null`
- AC2 note: `useCreditState.ts` wrapper's services param prefixed `_services?` (optional) — cascade cleanup of CreditFeature props deferred to separate story
- New files: `tests/unit/hooks/useUserCredits.mutations.test.tsx`, `tests/unit/repositories/creditsRepository.test.ts`
- Additional callers updated: `App.tsx`, `useSettingsViewData.ts`, `useTransactionEditorData.ts`, `useCreditState.ts`
- Repository validation: `validateAmount()` helper — complementary to service-layer integer check
- Error sanitization: user-safe messages in `setError()` calls; raw errors preserved in `console.error` for debugging

## Senior Developer Review (ECC)
- **Date:** 2026-02-28
- **Agents:** code-reviewer, security-reviewer (STANDARD classification)
- **Score:** 8.75/10 — APPROVE WITH CHANGES
- **Fixes applied:** 2 quick fixes
  - #1 (HIGH): `addCredits`/`addSuperCredits` now throw user-safe error messages instead of raw Firestore errors
  - #2 (MEDIUM): `validateAmount()` now includes `Number.isInteger()` check, aligned with service-layer validation
- **Deferred:** `useCreditState.ts` still has dead `Firestore` import + `CreditFirebaseServices` — cascade cleanup deferred (LOW)
