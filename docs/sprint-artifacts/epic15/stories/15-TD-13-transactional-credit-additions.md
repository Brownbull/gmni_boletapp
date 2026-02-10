# Tech Debt Story 15-TD-13: Transactional Credit Additions & Airlock Deductions

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-10) on story 15-TD-10
> **Priority:** HIGH
> **Estimated Effort:** 3 points

## Story

As a **developer**,
I want **all credit mutation paths (additions and airlock deductions) to use Firestore transactions**,
So that **concurrent tab/session operations cannot cause lost updates or overdrafts on any credit path**.

## Context

TD-10 fixed the TOCTOU bypass for credit *deductions* (scan path) by routing through `deductAndSaveCredits()` with `runTransaction`. However, the *addition* paths (`addCredits`, `addSuperCredits`) and the airlock credit deduction path (`useAirlocks`) still use the non-transactional `saveUserCredits(setDoc)` pattern — the same class of vulnerability.

### Specific Gaps

1. **addCredits / addSuperCredits** (`src/hooks/useUserCredits.ts:189-248`): Read stale React state, compute new balance, write via `saveUserCredits(setDoc)`. Two tabs adding credits simultaneously can overwrite each other.
2. **useAirlocks credit deduction** (`src/hooks/useAirlocks.ts:110-119`): Uses `airlockService.deductCredits()` which is pure client-side math (`Math.max(0, credits - cost)`), then passes result to a callback. No Firestore transaction.
3. **Batch scan refund** (`src/App.tsx:1761,1770`): Calls `addUserSuperCredits(1)` on failure, which uses the non-transactional path.

## Acceptance Criteria

- [ ] **AC1:** `addCredits` and `addSuperCredits` in `useUserCredits` use new transactional `addAndSaveCredits()` / `addAndSaveSuperCredits()` service functions with `runTransaction`
- [ ] **AC2:** `useAirlocks` credit deduction calls `deductAndSaveSuperCredits()` instead of client-side arithmetic
- [ ] **AC3:** Batch scan refund path uses transactional addition
- [ ] **AC4:** Unit tests verify all credit mutation paths call transactional service functions
- [ ] **AC5:** All existing tests pass

## Tasks / Subtasks

- [ ] **Task 1:** Create `addAndSaveCredits()` and `addAndSaveSuperCredits()` in `userCreditsService.ts`
  - [ ] Follow the same `runTransaction` + `transaction.get` pattern as `deductAndSaveCredits`
  - [ ] Read fresh balance inside transaction, add amount, write back
  - [ ] Add unit tests
- [ ] **Task 2:** Migrate `addCredits` and `addSuperCredits` in `useUserCredits` to use new transactional functions
  - [ ] Remove optimistic update + saveUserCredits pattern
  - [ ] Update tests
- [ ] **Task 3:** Migrate `useAirlocks` to use `deductAndSaveSuperCredits`
  - [ ] Replace `airlockService.deductCredits()` call
  - [ ] Update tests
- [ ] **Task 4:** Migrate batch scan refund to use transactional addition
  - [ ] Update `App.tsx` refund calls

## Dev Notes

- Source story: [15-TD-10](./15-TD-10-credits-consumer-safety.md)
- Review findings: #2, #3 from ECC code review 2026-02-10
- Files affected: `src/hooks/useUserCredits.ts`, `src/services/userCreditsService.ts`, `src/hooks/useAirlocks.ts`, `src/features/insights/services/airlockService.ts`, `src/App.tsx`
