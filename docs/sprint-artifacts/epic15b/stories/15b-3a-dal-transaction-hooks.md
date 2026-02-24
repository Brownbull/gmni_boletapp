# Story 15b-3a: DAL: Migrate Transaction Hooks to TransactionRepository

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 3
**Priority:** HIGH
**Status:** drafted

## Overview

Nine non-repository files in `src/` import transaction functions directly from `@/services/firestore` instead of going through the `TransactionRepository` established in Epic 15 Phase 6. The migration replaces these direct service imports with repository calls, ensuring all transaction data access flows through the DAL. The target state is zero direct `services/firestore` transaction-function imports outside `src/repositories/`. All nine methods needed (`add`, `update`, `delete`, `wipeAll`, `subscribe`, `subscribeRecentScans`, `getPage`, `deleteBatch`, `updateBatch`) already exist in `TransactionRepository`; however, two configuration constants (`LISTENER_LIMITS`, `PAGINATION_PAGE_SIZE`) must be re-exported from the repository layer before consumers can switch.

## Functional Acceptance Criteria

- [ ] **AC1:** All 9 identified transaction service consumers use TransactionRepository instead of direct service imports
- [ ] **AC2:** No direct `services/firestore` transaction-function imports remain outside `src/repositories/` (grep returns 0 lines, excluding App.tsx which is Phase 4)
- [ ] **AC3:** TransactionRepository re-exports `LISTENER_LIMITS` and `PAGINATION_PAGE_SIZE` constants for consumer use
- [ ] **AC4:** Each consumer migrated individually with `npx tsc --noEmit` passing between migrations
- [ ] **AC5:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** TransactionRepository at `src/repositories/transactionRepository.ts` (existing, extend with constant re-exports)
- [ ] **AC-ARCH-LOC-2:** Consumer files that change: `src/hooks/useTransactions.ts`, `src/hooks/useRecentScans.ts`, `src/hooks/usePaginatedTransactions.ts`, `src/hooks/app/useTransactionHandlers.ts`, `src/features/scan/hooks/useScanHandlers.ts`, `src/features/batch-review/hooks/useBatchReviewHandlers.ts`, `src/features/batch-review/handlers/save.ts`, `src/features/history/views/HistoryView.tsx`, `src/features/dashboard/views/DashboardView/DashboardView.tsx`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** Hooks that already receive `services`/`user` as props use `createTransactionRepository()` factory with those values (NOT `useTransactionRepository()` hook, to avoid duplicating auth context)
- [ ] **AC-ARCH-PATTERN-2:** React component consumers (`HistoryView`, `DashboardView`) use `useTransactionRepository()` hook, eliminating their `getFirestore()` calls
- [ ] **AC-ARCH-PATTERN-3:** The `save.ts` pure function handler creates repository from `context.services`/`context.user` via factory
- [ ] **AC-ARCH-PATTERN-4:** `transaction.ts` type imports are preserved -- only runtime service imports are replaced
- [ ] **AC-ARCH-PATTERN-5:** `usePaginatedTransactions` cursor typed as `PaginationCursor` (opaque) from `@/repositories/types`, not `QueryDocumentSnapshot`

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No direct `firebase/firestore` runtime imports in migrated consumer hooks (type-only imports for `Timestamp` etc. permitted)
- [ ] **AC-ARCH-NO-2:** No new business logic added to TransactionRepository during this migration
- [ ] **AC-ARCH-NO-3:** Do NOT use `useTransactionRepository()` hook inside hooks that already receive `services`/`user` as props -- creates redundant auth lookups
- [ ] **AC-ARCH-NO-4:** No batch migration -- one consumer file per subtask, tests run between each
- [ ] **AC-ARCH-NO-5:** App.tsx is OUT OF SCOPE -- it is deferred to story 15b-4f (Phase 4)

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| TransactionRepository | `src/repositories/transactionRepository.ts` | Re-export `LISTENER_LIMITS` and `PAGINATION_PAGE_SIZE` constants |
| Repository barrel | `src/repositories/index.ts` | Export the two constants |
| useTransactions | `src/hooks/useTransactions.ts` | Replace `subscribeToTransactions` with `repo.subscribe(cb)` |
| useRecentScans | `src/hooks/useRecentScans.ts` | Replace `subscribeToRecentScans` with `repo.subscribeRecentScans(cb)` |
| usePaginatedTransactions | `src/hooks/usePaginatedTransactions.ts` | Replace `getTransactionPage` + constants; adapt cursor to `PaginationCursor` |
| useTransactionHandlers | `src/hooks/app/useTransactionHandlers.ts` | Replace 4 imports with `createTransactionRepository()` factory |
| useScanHandlers | `src/features/scan/hooks/useScanHandlers.ts` | Replace `addTransaction` with `createTransactionRepository()` |
| useBatchReviewHandlers | `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | Replace `addTransaction` with `createTransactionRepository()` |
| save handler | `src/features/batch-review/handlers/save.ts` | Replace `addTransaction` with factory call |
| HistoryView | `src/features/history/views/HistoryView.tsx` | Replace `deleteTransactionsBatch` + `getFirestore()` with `useTransactionRepository()` |
| DashboardView | `src/features/dashboard/views/DashboardView/DashboardView.tsx` | Replace `deleteTransactionsBatch` + `getFirestore()` with `useTransactionRepository()` |

### Unchanged Files

| File | Exact Path | Reason |
|------|------------|--------|
| firestore service | `src/services/firestore.ts` | Repository wraps it; service stays as implementation detail |
| App.tsx | `src/App.tsx` | Deferred to story 15b-4f (Phase 4 -- App.tsx fan-out reduction) |
| Repository types | `src/repositories/types.ts` | `PaginationCursor` already exists |

## Tasks / Subtasks

### Task 1: Establish baseline and audit consumers

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 `grep -rn "from.*services/firestore" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/` -- confirm 10 lines (9 consumers + App.tsx)
- [ ] 1.3 Verify TransactionRepository has all 9 methods: `add`, `update`, `delete`, `subscribe`, `subscribeRecentScans`, `wipeAll`, `getPage`, `deleteBatch`, `updateBatch`
- [ ] 1.4 Identify missing re-exports: `LISTENER_LIMITS`, `PAGINATION_PAGE_SIZE` constants

### Task 2: Add constant re-exports to TransactionRepository

- [ ] 2.1 In `src/repositories/transactionRepository.ts`: add `export { LISTENER_LIMITS, PAGINATION_PAGE_SIZE } from '@/services/firestore'`
- [ ] 2.2 In `src/repositories/index.ts`: add barrel export for the two constants
- [ ] 2.3 Run `npx tsc --noEmit` -- fix any type errors

### Task 3: Migrate simple subscription hooks (useTransactions + useRecentScans)

- [ ] 3.1 Open `src/hooks/useTransactions.ts` (85 lines)
- [ ] 3.2 Replace `subscribeToTransactions` import with `createTransactionRepository` from `@/repositories/transactionRepository`
- [ ] 3.3 Create repo from props: `const repo = createTransactionRepository({ db: services!.db, userId: user!.uid, appId: services!.appId })`
- [ ] 3.4 Replace call: `subscribeToTransactions(services!.db, user!.uid, services!.appId, cb)` → `repo.subscribe(cb)`
- [ ] 3.5 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 3.6 Open `src/hooks/useRecentScans.ts` (86 lines)
- [ ] 3.7 Apply same pattern: replace `subscribeToRecentScans` import and call with `repo.subscribeRecentScans(cb)`
- [ ] 3.8 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Migrate usePaginatedTransactions

- [ ] 4.1 Open `src/hooks/usePaginatedTransactions.ts` (212 lines)
- [ ] 4.2 Replace `import { getTransactionPage, LISTENER_LIMITS, PAGINATION_PAGE_SIZE, type TransactionPage } from '../services/firestore'` with imports from `@/repositories/transactionRepository`
- [ ] 4.3 Change cursor type: replace `QueryDocumentSnapshot<DocumentData>` with `PaginationCursor` from `@/repositories/types` -- the cursor is opaque (consumers pass it back without inspecting)
- [ ] 4.4 Replace call: `getTransactionPage(services.db, userId, appId, cursor, size)` → `repo.getPage(cursor, size)` using `createTransactionRepository()` factory
- [ ] 4.5 Update `getNextPageParam`: replace `lastPage.lastDoc` with `lastPage.cursor`
- [ ] 4.6 Remove `import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'` (no longer needed)
- [ ] 4.7 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 4.8 Run `npx vitest run tests/unit/hooks/usePaginatedTransactions.test.tsx` -- all pass

### Task 5: Migrate useTransactionHandlers

- [ ] 5.1 Open `src/hooks/app/useTransactionHandlers.ts` (498 lines)
- [ ] 5.2 Replace the 4 firestore function imports with `import { createTransactionRepository } from '@/repositories/transactionRepository'`
- [ ] 5.3 Create memoized repo: `const repo = useMemo(() => services && user ? createTransactionRepository({ db: services.db, userId: user.uid, appId: services.appId }) : null, [services, user])`
- [ ] 5.4 Replace all call sites: `firestoreAddTransaction(db, user.uid, appId, tDoc)` → `repo!.add(tDoc)`, similarly for `update`, `delete`, `wipeAll`
- [ ] 5.5 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 5.6 Run `npx vitest run tests/unit/hooks/app/useTransactionHandlers.test.ts` -- all pass

### Task 6: Migrate scan and batch-review consumers

> **HARD PREREQUISITE:** `useScanHandlers.ts` is >800 lines and the pre-edit hook will BLOCK edits to it. Story **15b-2l** (decompose useScanHandlers.ts) must be complete before starting this task. If the hook blocks, stop and complete 15b-2l first.

- [ ] 6.1 Open `src/features/scan/hooks/useScanHandlers.ts`
- [ ] 6.2 Replace `addTransaction` import with `createTransactionRepository`; create repo from existing `services`/`user` props; replace call site
- [ ] 6.3 Run `npx tsc --noEmit` -- fix type errors
- [ ] 6.4 Run `npx vitest run tests/unit/features/scan/hooks/useScanHandlers.test.ts` -- all pass
- [ ] 6.5 Open `src/features/batch-review/hooks/useBatchReviewHandlers.ts`
- [ ] 6.6 Apply same pattern; replace `addTransaction` call
- [ ] 6.7 Run `npx tsc --noEmit` -- fix type errors
- [ ] 6.8 Run `npx vitest run tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts` -- all pass
- [ ] 6.9 Open `src/features/batch-review/handlers/save.ts` (158 lines)
- [ ] 6.10 Create repo from `context.services`/`context.user`: `const repo = createTransactionRepository({ db: services.db, userId: user.uid, appId: services.appId })`; replace `firestoreAddTransaction(...)` with `repo.add(finalTx)`
- [ ] 6.11 Run `npx tsc --noEmit` -- fix type errors

### Task 7: Migrate view consumers (HistoryView + DashboardView)

- [ ] 7.1 Open `src/features/history/views/HistoryView.tsx`
- [ ] 7.2 Add `const txRepo = useTransactionRepository()` from `@/repositories`
- [ ] 7.3 Remove `import { deleteTransactionsBatch } from '@/services/firestore'` and `import { getFirestore } from 'firebase/firestore'`
- [ ] 7.4 Replace `const db = getFirestore(); await deleteTransactionsBatch(db, userId, appId, ids)` with `await txRepo!.deleteBatch(ids)`
- [ ] 7.5 Run `npx tsc --noEmit` -- fix type errors
- [ ] 7.6 Open `src/features/dashboard/views/DashboardView/DashboardView.tsx`
- [ ] 7.7 Apply same pattern: add `useTransactionRepository()`, remove 2 imports, replace inline call
- [ ] 7.8 Run `npx tsc --noEmit` -- fix type errors

### Task 8: Verify no remaining direct imports

- [ ] 8.1 `grep -rn "from.*services/firestore" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/ | grep -v "App.tsx"` -- returns 0 lines
- [ ] 8.2 Run `npm run test:quick` -- all tests pass
- [ ] 8.3 Run `npx tsc --noEmit` -- zero errors

## Dev Notes

### Migration Pattern A: Hooks receiving services/user as props

These hooks receive `services` and `user` from App.tsx. Use factory, not hook:

```typescript
// Before:
import { addTransaction as firestoreAddTransaction } from '@/services/firestore';
await firestoreAddTransaction(services.db, user.uid, services.appId, tDoc);

// After:
import { createTransactionRepository } from '@/repositories/transactionRepository';
const repo = useMemo(
  () => services && user ? createTransactionRepository({ db: services.db, userId: user.uid, appId: services.appId }) : null,
  [services, user]
);
await repo!.add(tDoc);
```

**Applies to:** `useTransactionHandlers`, `useScanHandlers`, `useBatchReviewHandlers`, `useTransactions`, `useRecentScans`

### Migration Pattern B: Views with inline getFirestore()

```typescript
// Before:
import { getFirestore } from 'firebase/firestore';
import { deleteTransactionsBatch } from '@/services/firestore';
const db = getFirestore();
await deleteTransactionsBatch(db, userId, appId, transactionIds);

// After:
import { useTransactionRepository } from '@/repositories';
const txRepo = useTransactionRepository();
await txRepo!.deleteBatch(transactionIds);
```

**Applies to:** `HistoryView`, `DashboardView`

### TransactionRepository Method Map

| Service Function | Repository Method | Key Difference |
|------------------|-------------------|----------------|
| `addTransaction(db, uid, appId, tx)` | `repo.add(tx)` | Context params eliminated |
| `updateTransaction(db, uid, appId, id, updates)` | `repo.update(id, updates)` | Context params eliminated |
| `deleteTransaction(db, uid, appId, id)` | `repo.delete(id)` | Context params eliminated |
| `wipeAllTransactions(db, uid, appId)` | `repo.wipeAll()` | Context params eliminated |
| `subscribeToTransactions(db, uid, appId, cb)` | `repo.subscribe(cb)` | Context params eliminated |
| `subscribeToRecentScans(db, uid, appId, cb)` | `repo.subscribeRecentScans(cb)` | Context params eliminated |
| `getTransactionPage(db, uid, appId, cursor, size)` | `repo.getPage(cursor, size)` | Cursor type is `PaginationCursor` (opaque) |
| `deleteTransactionsBatch(db, uid, appId, ids)` | `repo.deleteBatch(ids)` | Context params eliminated |
| `updateTransactionsBatch(db, uid, appId, ids, updates)` | `repo.updateBatch(ids, updates)` | Context params eliminated |

### Critical Pitfalls

1. **usePaginatedTransactions cursor type change:** The service's `TransactionPage` exposes `lastDoc: QueryDocumentSnapshot` while the repository exposes `cursor: PaginationCursor` (opaque). The `getNextPageParam` callback accesses `lastPage.lastDoc` -- this MUST change to `lastPage.cursor`. `initialPageParam` typed as `QueryDocumentSnapshot` must also change to `PaginationCursor`.

2. **usePaginatedTransactions constant imports:** `LISTENER_LIMITS` and `PAGINATION_PAGE_SIZE` must be re-exported from `transactionRepository.ts` in Task 2 BEFORE this consumer is migrated in Task 4.

3. **Hook props vs useAuth() mismatch:** Do NOT use `useTransactionRepository()` in hooks that receive `services`/`user` as props. Use `createTransactionRepository()` factory instead to avoid redundant auth lookups.

4. **Mock paths in tests:** Tests mock `@/services/firestore`. After migration, mocks must target `@/repositories/transactionRepository` or `@/repositories`. Run each consumer's test immediately after migration.

5. **useScanHandlers is >800 lines:** This file exceeds the 800-line hook limit. The migration only changes the import line and call site (minimal diff). If the pre-edit hook blocks, split the file first (story 15b-2l should have been completed before this story).

6. **App.tsx is deferred:** App.tsx imports `addTransaction` from `services/firestore`. This is handled in story 15b-4f (Phase 4). Do not migrate it here.

## ECC Analysis Summary

- **Risk Level:** LOW-MEDIUM (most consumers are simple import swaps, but `usePaginatedTransactions` requires cursor type adaptation)
- **Complexity:** Medium -- 9 consumers with 3 distinct migration patterns (prop-based factory hooks, view hooks, pure function)
- **Sizing:** 8 tasks / 25 subtasks / 11 files (within updated limits: max 8 tasks, max 40 subtasks, max 12 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- TransactionRepository with all 9 methods established in Epic 15 Phase 6

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft with estimated ~8 consumers |
| 2026-02-23 | Full rewrite. Confirmed 9 consumers (App.tsx deferred to 15b-4f). All 9 repository methods already exist; 2 constants need re-export. Identified 3 migration patterns: prop-based factory (5 hooks), useTransactionRepository hook (2 views), pure function factory (1 handler). Key complexity: `usePaginatedTransactions` cursor type change. Points raised from 2 to 3. |
