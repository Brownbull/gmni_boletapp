# Tech Debt Story 15-TD-13: Transactional Credit Additions & Airlock Deductions

Status: done

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

- [x] **AC1:** `addCredits` and `addSuperCredits` in `useUserCredits` use new transactional `addAndSaveCredits()` / `addAndSaveSuperCredits()` service functions with `runTransaction`
- [x] **AC2:** `useAirlocks` credit deduction calls `deductAndSaveSuperCredits()` instead of client-side arithmetic
- [x] **AC3:** Batch scan refund path uses transactional addition (automatic — App.tsx calls hook's addSuperCredits which is now transactional)
- [x] **AC4:** Unit tests verify all credit mutation paths call transactional service functions
- [x] **AC5:** All existing tests pass (6442 passed, 0 failed)

## Tasks / Subtasks

- [x] **Task 1:** Create `addAndSaveCredits()` and `addAndSaveSuperCredits()` in `userCreditsService.ts`
  - [x] Follow the same `runTransaction` + `transaction.get` pattern as `deductAndSaveCredits`
  - [x] Read fresh balance inside transaction, add amount, write back
  - [x] Add unit tests (11 tests in userCreditsService.add.test.ts)
- [x] **Task 2:** Migrate `addCredits` and `addSuperCredits` in `useUserCredits` to use new transactional functions
  - [x] Remove optimistic update + saveUserCredits pattern
  - [x] Remove `credits` from useCallback dependency arrays (transaction reads fresh data)
- [x] **Task 3:** Migrate `useAirlocks` to use `deductAndSaveSuperCredits`
  - [x] Replace `airlockService.deductCredits()` call with transactional `deductAndSaveSuperCredits`
  - [x] Updated `onCreditsDeducted` callback to receive `UserCredits` (hook has 0 consumers)
- [x] **Task 4:** Migrate batch scan refund to use transactional addition
  - [x] Automatic: App.tsx calls `addUserSuperCredits(1)` which maps to `useUserCredits().addSuperCredits` — now transactional

## Dev Notes

- Source story: [15-TD-10](./15-TD-10-credits-consumer-safety.md)
- Review findings: #2, #3 from ECC code review 2026-02-10
- Files affected: `src/hooks/useUserCredits.ts`, `src/services/userCreditsService.ts`, `src/hooks/useAirlocks.ts`, `src/App.tsx`
- Task 4 (batch scan refund) automatically covered by Task 2 — `addUserSuperCredits(1)` in App.tsx maps to `useUserCredits().addSuperCredits` which is now transactional
- `useAirlocks` hook has 0 consumers and 0 tests — changed for consistency with codebase TOCTOU patterns

### Self-Review Findings (2026-02-10)

**Known Limitation — useAirlocks generate-then-deduct race:**
Airlock generation and credit deduction are two separate Firestore operations (not in same transaction). If generation succeeds but deduction fails, user gets a free airlock. Mitigated by: (1) hook has 0 consumers currently, (2) pre-check `hasEnoughCredits` guards the happy path. Future fix: deduct credits first or use Cloud Function for atomic generation+deduction.

**Known Limitation — No upper bound on credit additions:**
`addAndSaveCredits`/`addAndSaveSuperCredits` validate positive integer but enforce no maximum. Callers currently pass small values (1-10). Defense-in-depth: credit additions should ultimately be server-side Cloud Functions with admin authorization.

**Deferred to TD-14:** Code duplication in transaction read-credits blocks (4x copies), `db: any` type chain, deprecated `_currentCredits` parameter removal.

**Deferred to TD-9:** `creditsRepository.ts` still exposes non-transactional `save()` — should expose transactional `add()`/`addSuper()` methods.

### Senior Developer Review (ECC) — 2026-02-10

- **Agents used:** code-reviewer, security-reviewer (STANDARD classification)
- **Outcome:** APPROVE with 3 quick fixes applied
- **Quick fixes applied:** (1) Un-gated Firestore deduction from `onCreditsDeducted` callback in useAirlocks.ts, (2) DEV-gated `console.error` on new lines in useUserCredits.ts, (3) Renamed misleading `dummyCredits` to `_deprecatedCredits` with comment
- **Deferred items:** 13 findings tracked — see table below

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-14](./15-TD-14-credits-type-safety-cleanup.md) | 4x duplicated transaction read block + `db: any` + `_currentCredits` removal | MEDIUM | UPDATED (added AC6 for shared helper) |
| [15-TD-9](./15-TD-9-dal-polish.md) | `saveUserCredits` non-transactional export bypass | LOW | UPDATED (added note about deprecation) |
| N/A | Airlock generate-then-deduct atomicity (0 consumers) | HIGH | NOTED in Dev Notes only |
| N/A | Firestore rules for credit writes (architecture) | MEDIUM | Future epic — not a TD story |
| N/A | No upper bound on credit additions (business decision) | MEDIUM | NOTED in Dev Notes only |
