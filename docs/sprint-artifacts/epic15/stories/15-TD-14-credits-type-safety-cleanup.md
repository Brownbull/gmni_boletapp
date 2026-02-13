# Tech Debt Story 15-TD-14: Credits Type Safety & Dependency Cleanup

Status: done

> **Source:** ECC Code Review (2026-02-10) on story 15-TD-10
> **Priority:** MEDIUM
> **Estimated Effort:** 2 points

## Story

As a **developer**,
I want **the credits system to use proper TypeScript types and minimal useCallback dependencies**,
So that **type safety is enforced across the caller chain and unnecessary re-renders are avoided**.

## Context

Two related cleanup items from the TD-10 code review:

1. **`db: any` in FirebaseServices** (`src/hooks/useUserCredits.ts:56`): The `db` field uses explicit `any`, violating the project's no-any rule. Changing to `Firestore` requires updating `CreditFirebaseServices` in `useCreditState.ts` and all callers that construct the services object. The wrapper in `useCreditState.ts` already uses `db: unknown` which is closer but still not correct.

2. **Stale `credits` in useCallback deps** (`useUserCredits.ts:162,185,335`): The `deductCredits`, `deductSuperCredits`, and `confirmReservedCredits` callbacks include `credits` in their dependency arrays. Since `deductAndSaveCredits` reads fresh data inside the transaction (ignoring the `_currentCredits` parameter), the `credits` dependency only causes unnecessary callback recreation on every credit state change. Removing it requires also removing `credits` from the function call (removing the deprecated `_currentCredits` parameter entirely).

## Acceptance Criteria

- [x] **AC1:** `FirebaseServices.db` is typed as `Firestore` (from `firebase/firestore`), not `any`
- [x] **AC2:** `CreditFirebaseServices.db` in `useCreditState.ts` matches the updated type
- [x] **AC3:** All callers that construct `FirebaseServices` objects compile without type errors
- [x] **AC4:** The deprecated `_currentCredits` parameter is removed from `deductAndSaveCredits` and `deductAndSaveSuperCredits` function signatures
- [x] **AC5:** `credits` is removed from `deductCredits`, `deductSuperCredits`, and `confirmReservedCredits` useCallback dependency arrays
- [x] **AC6:** Extract shared `readFreshCredits(snap)` helper to eliminate 4x duplicated transaction read block in `userCreditsService.ts`
- [x] **AC7:** All existing tests pass

## Tasks / Subtasks

- [x] **Task 1:** Update `FirebaseServices` type chain
  - [x] Change `db: any` to `db: Firestore` in `useUserCredits.ts`
  - [x] Change `db: unknown` to `db: Firestore` in `useCreditState.ts`
  - [x] Trace all callers and update their type annotations
  - [x] Fix any TS errors in the caller chain
- [x] **Task 2:** Remove deprecated `_currentCredits` parameter
  - [x] Remove from `deductAndSaveCredits` signature
  - [x] Remove from `deductAndSaveSuperCredits` signature
  - [x] Update all call sites (useUserCredits hook, useAirlocks, creditsRepository, tests)
  - [x] Remove `credits` from useCallback dependency arrays
  - [x] Update test mocks to match new signatures
- [x] **Task 3:** Extract shared transaction read helper
  - [x] Create `readFreshCredits(snap: DocumentSnapshot): UserCredits` helper function
  - [x] Replace 4 identical read blocks in deductAndSaveCredits, deductAndSaveSuperCredits, addAndSaveCredits, addAndSaveSuperCredits
  - [x] Source: TD-13 code review finding #5 (2026-02-10)

## Dev Notes

- Source story: [15-TD-10](./15-TD-10-credits-consumer-safety.md)
- Review findings: #6, #7 from ECC code review 2026-02-10
- Files affected: `src/hooks/useUserCredits.ts`, `src/features/credit/state/useCreditState.ts`, `src/services/userCreditsService.ts`, callers of FirebaseServices

## Senior Developer Review (ECC)

- **Review date:** 2026-02-10
- **Classification:** STANDARD
- **ECC agents:** code-reviewer, security-reviewer
- **Overall score:** 8.5/10
- **Outcome:** APPROVED — all 7 ACs verified, 6 quick fixes applied, 2 complex items already tracked
- **Quick fixes applied:** (1) Removed dead `currentCredits` param from `ICreditsRepository`, (2) Consistent `console.error` pattern (removed DEV-gating from addCredits/addSuperCredits), (3) `getUserCredits` delegates to `readFreshCredits`, (4) Removed noisy try/catch from `saveUserCredits`, (5) DEV-gated 3 `console.warn` calls, (6) JSDoc alias note on `formatSuperCreditsDisplay`
- **Deferred items:** All already tracked — airlock atomicity in TD-13 Known Limitations, repository add/addSuper in TD-9
