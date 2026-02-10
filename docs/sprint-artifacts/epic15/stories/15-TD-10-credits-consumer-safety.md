# Story 15-TD-10: Credits Consumer Transaction Safety

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** CRITICAL
**Status:** review

## Description

The `useUserCredits` hook — the only active consumer of credit deduction in the app — bypasses the transactional `deductAndSaveCredits()` function from TD-1. It calls `setDoc()` directly with stale state, making the TD-1 TOCTOU fix effectively dead code. Additionally, `getUserCredits()` silently returns `DEFAULT_CREDITS` on error, hiding connectivity issues from users.

## Source

- **Code Review Finding #1 (CRITICAL):** `useUserCredits` hook calls `setDoc` directly after computing new balances from stale React state, bypassing the `runTransaction`-based `deductAndSaveCredits()` added in TD-1. Two concurrent tabs can both read `remaining: 5`, both deduct 1, and both write `remaining: 4` — a classic lost-update race.
- **Code Review Finding #13 (MEDIUM):** `getUserCredits()` returns `DEFAULT_CREDITS` (1200 remaining) on any error, including network failures. This silently gives users phantom credits that don't match Firestore.

## Acceptance Criteria

- [x] **AC1:** `useUserCredits` hook uses `deductAndSaveCredits()` / `deductAndSaveSuperCredits()` from `userCreditsService` for all credit deductions instead of inline `setDoc()` + stale state arithmetic
- [x] **AC2:** The hook's deduction path goes through `runTransaction` (verifiable via test mock assertions)
- [x] **AC3:** `getUserCredits()` propagates errors to callers instead of silently returning default credits
- [x] **AC4:** Callers of `getUserCredits()` handle the error case (loading state, retry, or user-visible error)
- [x] **AC5:** Unit tests verify the hook calls `deductAndSaveCredits` (not inline `setDoc`) and that `getUserCredits` propagates errors
- [x] **AC6:** All existing tests pass

## Tasks

- [x] **Task 1:** Migrate `useUserCredits` hook to use service functions
  - [x]Replace inline `setDoc` deduction with call to `deductAndSaveCredits()`
  - [x]Replace inline super credit deduction with `deductAndSaveSuperCredits()`
  - [x]Remove the stale-state arithmetic from the hook
  - [x]Verify the returned credits object updates via the hook's subscription, not inline state
- [x] **Task 2:** Fix `getUserCredits()` error handling
  - [x]Remove `catch` that returns `DEFAULT_CREDITS`
  - [x]Let errors propagate to callers
  - [x]Update callers to handle the new error path (loading/error states)
- [x] **Task 3:** Add/update unit tests
  - [x]Test that `useUserCredits.deductCredits()` calls `deductAndSaveCredits` service function
  - [x]Test that `getUserCredits` throws on network error instead of returning defaults
  - [x]Test that concurrent deductions go through transaction (mock verification)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useUserCredits.ts` | MODIFY | Use service deduction functions instead of inline setDoc |
| `src/services/userCreditsService.ts` | MODIFY | Remove silent DEFAULT_CREDITS fallback in getUserCredits |
| `tests/unit/hooks/useUserCredits.test.ts` | CREATE/MODIFY | Test transactional deduction path |
| `tests/unit/services/userCreditsService.test.ts` | MODIFY | Test error propagation |
| Callers of `getUserCredits` | MODIFY | Handle error case |

## Dev Notes

- This is the highest priority TD item because it means the entire TD-1 TOCTOU fix for credits is dead code — the production code path never reaches `deductAndSaveCredits()`
- The hook currently: reads credits → computes new balance locally → writes with `setDoc()`. This must change to: calls `deductAndSaveCredits(amount)` → lets transaction handle read-compute-write
- After this fix, the `_currentCredits` parameter in `deductAndSaveCredits` can be fully removed (it's already `@deprecated` via code review Fix #5)
- `DEFAULT_CREDITS` returning on error is dangerous: a user with 0 credits who has a network blip would see 1200 credits appear
