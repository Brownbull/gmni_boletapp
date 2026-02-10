# Tech Debt Story 15-TD-14: Credits Type Safety & Dependency Cleanup

Status: ready-for-dev

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

- [ ] **AC1:** `FirebaseServices.db` is typed as `Firestore` (from `firebase/firestore`), not `any`
- [ ] **AC2:** `CreditFirebaseServices.db` in `useCreditState.ts` matches the updated type
- [ ] **AC3:** All callers that construct `FirebaseServices` objects compile without type errors
- [ ] **AC4:** The deprecated `_currentCredits` parameter is removed from `deductAndSaveCredits` and `deductAndSaveSuperCredits` function signatures
- [ ] **AC5:** `credits` is removed from `deductCredits`, `deductSuperCredits`, and `confirmReservedCredits` useCallback dependency arrays
- [ ] **AC6:** Extract shared `readFreshCredits(snap)` helper to eliminate 4x duplicated transaction read block in `userCreditsService.ts`
- [ ] **AC7:** All existing tests pass

## Tasks / Subtasks

- [ ] **Task 1:** Update `FirebaseServices` type chain
  - [ ] Change `db: any` to `db: Firestore` in `useUserCredits.ts`
  - [ ] Change `db: unknown` to `db: Firestore` in `useCreditState.ts`
  - [ ] Trace all callers and update their type annotations
  - [ ] Fix any TS errors in the caller chain
- [ ] **Task 2:** Remove deprecated `_currentCredits` parameter
  - [ ] Remove from `deductAndSaveCredits` signature
  - [ ] Remove from `deductAndSaveSuperCredits` signature
  - [ ] Update all call sites (useUserCredits hook, tests)
  - [ ] Remove `credits` from useCallback dependency arrays
  - [ ] Update test mocks to match new signatures
- [ ] **Task 3:** Extract shared transaction read helper
  - [ ] Create `readFreshCredits(snap: DocumentSnapshot): UserCredits` helper function
  - [ ] Replace 4 identical read blocks in deductAndSaveCredits, deductAndSaveSuperCredits, addAndSaveCredits, addAndSaveSuperCredits
  - [ ] Source: TD-13 code review finding #5 (2026-02-10)

## Dev Notes

- Source story: [15-TD-10](./15-TD-10-credits-consumer-safety.md)
- Review findings: #6, #7 from ECC code review 2026-02-10
- Files affected: `src/hooks/useUserCredits.ts`, `src/features/credit/state/useCreditState.ts`, `src/services/userCreditsService.ts`, callers of FirebaseServices
