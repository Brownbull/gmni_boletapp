# Story 15b-3d: DAL: Migrate Credits Hooks to CreditsRepository

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Overview

There are 7 non-repository source files that import directly from `userCreditsService.ts`. They fall into two categories: (A) `useUserCredits.ts`, which imports 5 runtime Firestore functions (`getUserCredits`, `deductAndSaveCredits`, `deductAndSaveSuperCredits`, `addAndSaveCredits`, `addAndSaveSuperCredits`), and (B) 6 view/component files that import only the pure formatting utilities `formatCreditsDisplay`/`formatSuperCreditsDisplay`. The hook must be migrated to use `ICreditsRepository`, which first requires adding the missing `add()` and `addSuper()` methods. The formatting utilities have no Firestore dependency and should be relocated to `src/utils/creditFormatters.ts` so views never need to import from a service file. TOCTOU safety must be preserved -- the repository already delegates `deduct`/`deductSuper` to transactional service methods, and the new `add`/`addSuper` methods must do the same.

## Functional Acceptance Criteria

- [ ] **AC1:** All 7 direct `userCreditsService` consumers in non-repository source files are migrated away from direct service imports
- [ ] **AC2:** Zero direct `userCreditsService` imports remain outside `src/repositories/` and `src/utils/` after migration
- [ ] **AC3:** `useUserCredits.ts` uses `ICreditsRepository` (via `useCreditsRepository()`) for all Firestore operations
- [ ] **AC4:** CreditsRepository methods `deduct`, `deductSuper`, `add`, `addSuper` all delegate to `runTransaction()`-based service functions
- [ ] **AC5:** `formatCreditsDisplay` and `formatSuperCreditsDisplay` are importable from `@/utils/creditFormatters`
- [ ] **AC6:** Each consumer migrated individually with tests passing between changes
- [ ] **AC7:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** CreditsRepository at `src/repositories/creditsRepository.ts` (exists, modified)
- [ ] **AC-ARCH-LOC-2:** Credit formatting utilities at `src/utils/creditFormatters.ts` (new)
- [ ] **AC-ARCH-LOC-3:** `src/hooks/useUserCredits.ts` imports from `@/repositories` not `@/services`
- [ ] **AC-ARCH-LOC-4:** All 6 view/component files import formatters from `@/utils/creditFormatters` not `@/services`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** `useUserCredits` receives `ICreditsRepository` from `useCreditsRepository()` hook -- does not construct its own Firestore references
- [ ] **AC-ARCH-PATTERN-2:** Repository `add()` delegates to `addAndSaveCredits()` (which uses `runTransaction()`)
- [ ] **AC-ARCH-PATTERN-3:** Repository `addSuper()` delegates to `addAndSaveSuperCredits()` (which uses `runTransaction()`)
- [ ] **AC-ARCH-PATTERN-4:** Type-only imports (`import type { UserCredits }`) may still come from `@/types/scan` -- only runtime service imports are replaced
- [ ] **AC-ARCH-PATTERN-5:** `formatCreditsDisplay` in new utility file is a copy of the pure function -- no behavioral changes

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No direct `firebase/firestore` runtime imports in `useUserCredits.ts` after migration
- [ ] **AC-ARCH-NO-2:** CreditsRepository must NOT bypass `runTransaction()` for credit mutations (deduct, deductSuper, add, addSuper)
- [ ] **AC-ARCH-NO-3:** View/component files must NOT import from `@/services/userCreditsService` after migration
- [ ] **AC-ARCH-NO-4:** No new `@deprecated` `save()` usages introduced -- only transactional methods

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| CreditsRepository | `src/repositories/creditsRepository.ts` | Add `add()` and `addSuper()` methods to `ICreditsRepository` interface and implementation |
| useUserCredits.ts | `src/hooks/useUserCredits.ts` | Replace 5 `userCreditsService` imports with `useCreditsRepository()` usage |
| Nav.tsx | `src/components/Nav.tsx` | Replace formatter import to `@/utils/creditFormatters` |
| TransactionEditorViewInternal.tsx | `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` | Replace formatter import to `@/utils/creditFormatters` |
| EditView.tsx | `src/features/transaction-editor/views/EditView.tsx` | Replace formatter import to `@/utils/creditFormatters` |
| BatchReviewFeature.tsx | `src/features/batch-review/BatchReviewFeature.tsx` | Replace formatter import to `@/utils/creditFormatters` |
| BatchCaptureView.tsx | `src/features/batch-review/views/BatchCaptureView.tsx` | Replace formatter import to `@/utils/creditFormatters` |
| BatchReviewView.tsx | `src/features/batch-review/views/BatchReviewView.tsx` | Replace formatter import to `@/utils/creditFormatters` |
| useUserCredits.test.tsx | `tests/unit/hooks/useUserCredits.test.tsx` | Update mock from `userCreditsService` to `@/repositories/hooks` |

### New Files

| File | Exact Path | Pattern | Est. Lines |
|------|------------|---------|------------|
| creditFormatters.ts | `src/utils/creditFormatters.ts` | Pure formatting utilities | ~30 |

### Unchanged Files (verify only)

| File | Exact Path | Reason |
|------|------------|--------|
| userCreditsService.ts | `src/services/userCreditsService.ts` | Functions remain -- repository imports them |
| repositories/index.ts | `src/repositories/index.ts` | ICreditsRepository exports automatically include new methods |
| useCreditsRepository | `src/repositories/hooks.ts` | Already exists and returns `ICreditsRepository | null` |
| useCreditState.ts | `src/features/credit/state/useCreditState.ts` | Wrapper around useUserCredits -- update only if signature changes |

## Tasks / Subtasks

### Task 1: Establish baseline and audit consumers

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `grep -rn "from.*userCreditsService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/` -- confirm exactly 7 consumer files
- [ ] 1.3 Verify CreditsRepository has transactional versions of `get`, `deduct`, `deductSuper` -- confirm `add` and `addSuper` are missing
- [ ] 1.4 Verify `useUserCredits` calls `deductAndSaveCredits` / `deductAndSaveSuperCredits` / `addAndSaveCredits` / `addAndSaveSuperCredits` (all transactional) -- confirm TD-10 fix is in place

### Task 2: Extend CreditsRepository with add/addSuper methods

- [ ] 2.1 Add `add(amount: number): Promise<UserCredits>` to `ICreditsRepository` interface in `creditsRepository.ts`
- [ ] 2.2 Add `addSuper(amount: number): Promise<UserCredits>` to `ICreditsRepository` interface
- [ ] 2.3 Implement both in `createCreditsRepository` factory, delegating to `addAndSaveCredits` and `addAndSaveSuperCredits` from `userCreditsService` (these already use `runTransaction()`)
- [ ] 2.4 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.5 Run `npm run test:quick` -- confirm no regressions

### Task 3: Extract formatting utilities to creditFormatters.ts

- [ ] 3.1 Create `src/utils/creditFormatters.ts` with `formatCreditsDisplay` and `formatSuperCreditsDisplay` (copy pure functions -- no Firestore dependency)
- [ ] 3.2 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Migrate 6 view/component files to use @/utils/creditFormatters

- [ ] 4.1 Update `src/components/Nav.tsx`: change import to `@/utils/creditFormatters`
- [ ] 4.2 Update 3 batch-review files (`BatchReviewFeature.tsx`, `BatchCaptureView.tsx`, `BatchReviewView.tsx`): change import to `@/utils/creditFormatters`
- [ ] 4.3 Update 2 transaction-editor files (`TransactionEditorViewInternal.tsx`, `EditView.tsx`): change import to `@/utils/creditFormatters`
- [ ] 4.4 Run `npm run test:quick` -- confirm no regressions

### Task 5: Migrate useUserCredits.ts to CreditsRepository

- [ ] 5.1 Change `useUserCredits` to obtain repo via `useCreditsRepository()` -- does not take `services` param for Firestore operations
- [ ] 5.2 Replace `getUserCredits(services.db, user.uid, services.appId)` calls with `repo.get()`
- [ ] 5.3 Replace `deductAndSaveCredits(...)` / `deductAndSaveSuperCredits(...)` calls with `repo.deduct(amount)` / `repo.deductSuper(amount)`
- [ ] 5.4 Replace `addAndSaveCredits(...)` / `addAndSaveSuperCredits(...)` calls with `repo.add(amount)` / `repo.addSuper(amount)`
- [ ] 5.5 Preserve null-safety: `if (!repo) return false` (replaces `if (!user || !services) return false`)
- [ ] 5.6 Update `tests/unit/hooks/useUserCredits.test.tsx`: mock `useCreditsRepository` from `@/repositories/hooks` instead of mocking `userCreditsService` functions
- [ ] 5.7 Run `npm run test:quick` -- confirm no regressions

### Task 6: Final verification

- [ ] 6.1 Run `grep -rn "from.*userCreditsService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/ | grep -v "utils/creditFormatters"` -- confirm 0 matches
- [ ] 6.2 Run `npx tsc --noEmit` -- zero type errors
- [ ] 6.3 Run `npm run test:quick` -- pass count matches or exceeds baseline

## Dev Notes

### TOCTOU Safety Context

Credits service had TOCTOU fixes in Epic 15 (TD-1, TD-10, TD-13). The `useUserCredits` hook was specifically identified in TD-10 as bypassing transaction safety. The current code already calls the transactional service functions (`deductAndSaveCredits`, `addAndSaveCredits`, etc.) directly. The migration preserves this by routing through `ICreditsRepository`, which delegates to the same transactional functions. The `save()` method on the repository is marked `@deprecated` -- it uses non-transactional `setDoc` and must NOT be introduced by this migration.

### Formatting Utilities Are Pure Functions

`formatCreditsDisplay` and `formatSuperCreditsDisplay` have zero Firestore dependency -- they are pure `number -> string` formatters. Moving them to `src/utils/creditFormatters.ts` follows the existing pattern where `src/utils/currency.ts` houses currency formatting. Views importing from a service file is an architecture violation that this task fixes.

### Migration Pattern: useUserCredits

```typescript
// Before:
import { getUserCredits, deductAndSaveCredits, ... } from '../services/userCreditsService';
export function useUserCredits(user, services) {
  const userCredits = await getUserCredits(services.db, user.uid, services.appId);
  const updated = await deductAndSaveCredits(services.db, user.uid, services.appId, amount);
}

// After:
import { useCreditsRepository } from '@/repositories';
export function useUserCredits(user) {
  const repo = useCreditsRepository();
  if (!repo) return false;
  const userCredits = await repo.get();
  const updated = await repo.deduct(amount);
}
```

### Migration Pattern: View formatters

```typescript
// Before:
import { formatCreditsDisplay } from '@/services/userCreditsService';

// After:
import { formatCreditsDisplay } from '@/utils/creditFormatters';
```

### Critical Pitfalls

1. **Signature change ripple:** `useUserCredits` currently takes `(user, services)`. If it changes to use `useCreditsRepository()` internally, it no longer needs `services` param. Update callers (`App.tsx`, `useCreditState.ts`) if the signature changes.

2. **Null repository handling:** `useCreditsRepository()` returns `ICreditsRepository | null` when not authenticated. Null check must replace the existing `!services` guard.

3. **visibilitychange useEffect:** The hook has a `useEffect` for `visibilitychange` that calls `getUserCredits` directly. This must also use `repo.get()`. Ensure `repo` is in the effect dependency array.

4. **Test mock strategy:** The current test mocks `userCreditsService`. After migration, mock `useCreditsRepository` from `@/repositories/hooks` to return a fake `ICreditsRepository`. This simplifies the mock setup (one object instead of 6 function mocks).

5. **console.error statements:** The hook has multiple `console.error` calls. These are existing error logging and must be preserved. The pre-edit hook warns only on `console.log`, not `console.error`.

## ECC Analysis Summary

- **Risk Level:** LOW (pure import path changes for 6 view files; repository extension is additive; hook migration preserves behavior)
- **Complexity:** Low-Medium -- 7 consumers but 6 are trivial import swaps; 1 hook requires careful signature/test rework
- **Sizing:** 6 tasks / 21 subtasks / 10 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None (CreditsRepository and `useCreditsRepository()` hook already exist)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (placeholder with ~4 consumers estimated) |
| 2026-02-23 | Full rewrite. Grep found 7 actual consumers (1 hook + 6 formatter imports). Discovered CreditsRepository missing `add()`/`addSuper()` methods. Added Task 2 for repository extension. Split formatters to `src/utils/creditFormatters.ts` (pure functions do not belong in repository). Detailed migration patterns and pitfalls documented. |
