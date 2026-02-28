# Story 15b-3e: DAL: Migrate Remaining View/Component Firebase Imports

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 2
**Priority:** MEDIUM
**Status:** ready-for-dev

## Overview

After DAL stories 15b-3a through 15b-3d migrate hooks to use repositories, 5 view/component files still import Firebase SDK directly: HistoryView and DashboardView call `getFirestore()` for batch delete operations, useSettingsViewData calls both `getFirestore()` and `signOut` from Firebase Auth, AirlockHistoryCard imports `Timestamp` as a runtime value, and NotificationSettings + AppView import `Firestore` without the `type` keyword. This story migrates all 5 files to use existing repositories, hooks, or type-only imports, targeting 0 view/component Firebase runtime imports and service-layer Firebase imports of 8 or fewer files total (down from the current ~12).

## Functional Acceptance Criteria

- [ ] **AC1:** 0 view files with direct Firebase runtime SDK imports (type-only excluded)
- [ ] **AC2:** 0 component files with direct Firebase runtime SDK imports (type-only excluded)
- [ ] **AC3:** Service-layer Firebase imports ≤8 files total (down from current ~12)
- [ ] **AC4:** `npm run test:quick` passes with 0 failures
- [ ] **AC5:** All existing delete-transaction flows in HistoryView and DashboardView continue to work identically

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Each migrated file stays at its existing path (no file moves)
- [ ] **AC-ARCH-LOC-2:** No new files created -- only existing files modified

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** Views replace `getFirestore()` + service calls with `useTransactionRepository()` from `@/repositories`
- [ ] **AC-ARCH-PATTERN-2:** `useSettingsViewData` uses `authSignOut` from existing `useAuth()` call instead of importing `signOut` from `firebase/auth`
- [ ] **AC-ARCH-PATTERN-3:** `useSettingsViewData` uses `services.db` from `useAuth()` instead of `getFirestore()`
- [ ] **AC-ARCH-PATTERN-4:** AirlockHistoryCard replaces `Timestamp` import with `import type { TimestampLike } from '@/utils/timestamp'`
- [ ] **AC-ARCH-PATTERN-5:** NotificationSettings and AppView change `import { Firestore }` to `import type { Firestore }`
- [ ] **AC-ARCH-PATTERN-6:** Type-only imports (`import type { ... }`) remain unchanged and are acceptable

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Do NOT migrate type-only imports -- only runtime imports need attention
- [ ] **AC-ARCH-NO-2:** Do NOT migrate repository implementation files (`src/repositories/**`)
- [ ] **AC-ARCH-NO-3:** Do NOT migrate service layer files (`src/services/**`) -- they are the DAL boundary
- [ ] **AC-ARCH-NO-4:** Do NOT migrate infrastructure files (`src/config/**`, `src/contexts/AuthContext.tsx`)
- [ ] **AC-ARCH-NO-5:** Do NOT change `AirlockRecord` type definition in `src/types/airlock.ts`
- [ ] **AC-ARCH-NO-6:** Do NOT add `getFirestore()` calls anywhere -- always use `services.db` from auth context

## File Specification

### Modified Files

| File | Exact Path | Firebase Import Being Removed | Replacement |
|------|------------|-------------------------------|-------------|
| HistoryView | `src/features/history/views/HistoryView.tsx` | `import { getFirestore } from 'firebase/firestore'` + `deleteTransactionsBatch` service call | `useTransactionRepository()` → `txRepo.deleteBatch(ids)` |
| DashboardView | `src/features/dashboard/views/DashboardView/DashboardView.tsx` | `import { getFirestore } from 'firebase/firestore'` + `deleteTransactionsBatch` service call | `useTransactionRepository()` → `txRepo.deleteBatch(ids)` |
| useSettingsViewData | `src/features/settings/views/SettingsView/useSettingsViewData.ts` | `import { getFirestore } from 'firebase/firestore'` and `import { signOut as firebaseSignOut } from 'firebase/auth'` | `authSignOut` from existing `useAuth()` call for sign-out; `services.db` for db |
| AirlockHistoryCard | `src/features/insights/components/AirlockHistoryCard.tsx` | `import { Timestamp } from 'firebase/firestore'` (used only as type) | `import type { TimestampLike } from '@/utils/timestamp'` |
| NotificationSettings | `src/features/settings/components/NotificationSettings.tsx` | `import { Firestore } from 'firebase/firestore'` (type-only use) | `import type { Firestore } from 'firebase/firestore'` |
| AppView | `src/features/settings/components/subviews/AppView.tsx` | `import { Firestore } from 'firebase/firestore'` (type-only use) | `import type { Firestore } from 'firebase/firestore'` |

## Tasks / Subtasks

### Task 1: Baseline audit

- [ ] 1.1 Run `npm run test:quick` and record pass count as baseline
- [ ] 1.2 `grep -rn "from 'firebase/" src/features/*/views/ src/views/ src/features/*/components/ src/components/ --include="*.ts" --include="*.tsx" | grep -v "import type"` -- confirm 6 files
- [ ] 1.3 Count service-layer baseline: `grep -rn "from 'firebase/" src/ --include="*.ts" --include="*.tsx" | grep -v "import type" | grep -v "repositories/" | grep -v "config/" | grep -v "types/" | grep -v "contexts/" | wc -l` -- record for comparison

### Task 2: Migrate HistoryView and DashboardView batch delete

- [ ] 2.1 In `src/features/history/views/HistoryView.tsx`: add `import { useTransactionRepository } from '@/repositories'`; call `const txRepo = useTransactionRepository()` at component top level
- [ ] 2.2 Replace `const db = getFirestore(); await deleteTransactionsBatch(db, userId, appId, transactionIds)` with `await txRepo?.deleteBatch(transactionIds)` -- preserve null guard
- [ ] 2.3 Remove `import { getFirestore } from 'firebase/firestore'` and `deleteTransactionsBatch` service import from HistoryView
- [ ] 2.4 In `src/features/dashboard/views/DashboardView/DashboardView.tsx`: same pattern -- add `useTransactionRepository`, replace `getFirestore()` + `deleteTransactionsBatch` call with `txRepo?.deleteBatch(selectedTxIds)`
- [ ] 2.5 Remove `import { getFirestore } from 'firebase/firestore'` and `deleteTransactionsBatch` service import from DashboardView
- [ ] 2.6 Run `npx tsc --noEmit` -- fix any type errors

### Task 3: Migrate useSettingsViewData

- [ ] 3.1 In `src/features/settings/views/SettingsView/useSettingsViewData.ts`: remove `import { getFirestore } from 'firebase/firestore'`
- [ ] 3.2 Remove `import { signOut as firebaseSignOut } from 'firebase/auth'`
- [ ] 3.3 Update `handleSignOut` callback: use `authSignOut()` (already destructured from `useAuth()`) instead of `firebaseSignOut(services.auth)`; remove the fallback branch
- [ ] 3.4 Update any `db: ReturnType<typeof getFirestore>` type annotations to `db: Firestore | null` with `import type { Firestore } from 'firebase/firestore'`
- [ ] 3.5 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Migrate AirlockHistoryCard Timestamp import

- [ ] 4.1 In `src/features/insights/components/AirlockHistoryCard.tsx`: replace `import { Timestamp } from 'firebase/firestore'` with `import type { TimestampLike } from '@/utils/timestamp'`
- [ ] 4.2 Update `formatDate` function signature: `timestamp: Timestamp | Date | undefined` → `timestamp: TimestampLike | Date | undefined` (compatible -- `toDateSafe` already accepts `TimestampLike`)
- [ ] 4.3 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Fix type-only imports in NotificationSettings and AppView

- [ ] 5.1 In `src/features/settings/components/NotificationSettings.tsx`: change `import { Firestore }` to `import type { Firestore } from 'firebase/firestore'`
- [ ] 5.2 In `src/features/settings/components/subviews/AppView.tsx`: change `import { Firestore }` to `import type { Firestore } from 'firebase/firestore'`

### Task 6: Final verification

- [ ] 6.1 `grep -rn "from 'firebase/" src/features/*/views/ src/views/ src/features/*/components/ src/components/ --include="*.ts" --include="*.tsx" | grep -v "import type"` -- must return 0 hits
- [ ] 6.2 Count service-layer total: same command as 1.3 -- must be ≤8
- [ ] 6.3 Run `npm run test:quick` -- all pass, no regressions

## Dev Notes

### Categorization of Firebase Imports

**Acceptable (do NOT migrate):**
- `src/repositories/**` — DAL boundary implementations
- `src/services/**` — service layer (target: ≤8 files)
- `src/config/firebase.ts` — infrastructure initialization
- `src/contexts/AuthContext.tsx` — auth infrastructure
- `src/lib/firestoreBatch.ts` — shared infrastructure utility
- `src/utils/migrateCreatedAt.ts` — one-time migration script
- `src/types/**` — type definition files
- Any `import type { ... }` — type-only imports (tree-shaken at build)

**Must migrate (this story):**
- `HistoryView.tsx` -- `getFirestore` runtime call
- `DashboardView.tsx` -- `getFirestore` runtime call
- `useSettingsViewData.ts` -- `getFirestore` + `signOut` runtime imports
- `AirlockHistoryCard.tsx` -- `Timestamp` runtime import (used only as type)
- `NotificationSettings.tsx` -- `Firestore` runtime import (used only as type)
- `AppView.tsx` -- `Firestore` runtime import (used only as type)

### Note on 15b-3a Overlap

> **Hard dependency:** Complete 15b-3a before starting this story. HistoryView and DashboardView batch-delete migrations are covered by 15b-3a Task 7. If 15b-3a ran first, Tasks 2.1-2.5 in this story will already be done — verify with `grep -n "deleteTransactionsBatch\|getFirestore" src/features/history/views/HistoryView.tsx src/features/dashboard/views/DashboardView/DashboardView.tsx` before starting Task 2. If grep returns 0 lines, skip Task 2 entirely.

> **Null-guard style:** Story 15b-3a Task 7 uses `txRepo!.deleteBatch(ids)` (bang assertion — safe inside auth context). If 15b-3a has already run, the bang assertion is already in place. Do NOT change it to optional chaining (`txRepo?.deleteBatch`) — pick one style per file and leave it. If implementing Task 2 from scratch (15b-3a skipped Task 7), use bang assertion to be consistent with the rest of the codebase.

### Critical Pitfalls

1. **`useTransactionRepository()` returns null when unauthenticated.** Preserve existing guards: `if (!txRepo) throw new Error(...)` or `txRepo?.deleteBatch(ids)` with null handling.

2. **DashboardView delete callback `onTransactionsDeleted?.()`.** This callback (from `_testOverrides`) must be preserved -- call it after `deleteBatch`.

3. **`useSettingsViewData` already has `authSignOut` from `useAuth()`.** The `handleSignOut` callback has a fallback to `firebaseSignOut(services.auth)`. After migration, use `authSignOut()` only -- the fallback is redundant.

4. **AirlockHistoryCard `formatDate` uses `Timestamp` in union type.** After changing to `TimestampLike`, the function still works because `toDateSafe` already handles all `TimestampLike` variants. Do NOT change `AirlockRecord.createdAt` type in `src/types/airlock.ts`.

5. **NotificationSettings and AppView `Firestore` imports are type-only** (used in prop interfaces). Simply adding the `type` keyword prevents Firebase module bundling.

## ECC Analysis Summary

- **Risk Level:** LOW (cleanup story; targeted import replacements with no behavioral changes)
- **Complexity:** Low -- 6 files to modify, all with clear 1:1 replacements
- **Sizing:** 6 tasks / 19 subtasks / 6 files (within limits: max 8 tasks, max 40 subtasks, max 12 files)
- **Agents consulted:** Architect
- **Dependencies:** Complete after 15b-3a through 15b-3d (this catches stragglers in views/components)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft -- placeholder with high-level tasks |
| 2026-02-23 | Full rewrite with codebase research. Identified 6 files: 3 views with runtime `getFirestore`/`signOut` imports, 1 component with runtime `Timestamp` import used as type, 2 components with missing `type` keyword on `Firestore` import. Defined specific replacement strategies. Note: 15b-3a may cover HistoryView + DashboardView; verify before executing Task 2. |
| 2026-02-27 | ECC re-creation validation: Validated accurate. Elevated 15b-3a overlap to prerequisite check subtask. Status: ready-for-dev. |
