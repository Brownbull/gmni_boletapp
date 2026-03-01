# Story 15b-3e: DAL: Migrate Remaining View/Component Firebase Imports

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Overview

After DAL stories 15b-3a through 15b-3d migrate hooks to use repositories, 5 view/component files still import Firebase SDK directly: HistoryView and DashboardView call `getFirestore()` for batch delete operations, useSettingsViewData calls both `getFirestore()` and `signOut` from Firebase Auth, AirlockHistoryCard imports `Timestamp` as a runtime value, and NotificationSettings + AppView import `Firestore` without the `type` keyword. This story migrates all 5 files to use existing repositories, hooks, or type-only imports, targeting 0 view/component Firebase runtime imports and service-layer Firebase imports of 8 or fewer files total (down from the current ~12).

## Functional Acceptance Criteria

- [x] **AC1:** 0 view files with direct Firebase runtime SDK imports (type-only excluded)
- [x] **AC2:** 0 component files with direct Firebase runtime SDK imports (type-only excluded)
- [ ] **AC3:** Service-layer Firebase imports ≤8 files total (down from current ~12) — N/A: services are DAL boundary, not migrated per AC-ARCH-NO-3
- [x] **AC4:** `npm run test:quick` passes with 0 failures
- [x] **AC5:** All existing delete-transaction flows in HistoryView and DashboardView continue to work identically

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Each migrated file stays at its existing path (no file moves)
- [x] **AC-ARCH-LOC-2:** No new files created -- only existing files modified

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** Views replace `getFirestore()` + service calls with `useTransactionRepository()` from `@/repositories` — done by 15b-3a
- [x] **AC-ARCH-PATTERN-2:** `useSettingsViewData` uses `authSignOut` from existing `useAuth()` call instead of importing `signOut` from `firebase/auth`
- [x] **AC-ARCH-PATTERN-3:** `useSettingsViewData` uses `services.db` from `useAuth()` instead of `getFirestore()`
- [x] **AC-ARCH-PATTERN-4:** AirlockHistoryCard replaces `Timestamp` import with `import type { TimestampLike } from '@/utils/timestamp'`
- [x] **AC-ARCH-PATTERN-5:** NotificationSettings and AppView change `import { Firestore }` to `import type { Firestore }`
- [x] **AC-ARCH-PATTERN-6:** Type-only imports (`import type { ... }`) remain unchanged and are acceptable

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** Do NOT migrate type-only imports -- only runtime imports need attention
- [x] **AC-ARCH-NO-2:** Do NOT migrate repository implementation files (`src/repositories/**`)
- [x] **AC-ARCH-NO-3:** Do NOT migrate service layer files (`src/services/**`) -- they are the DAL boundary
- [x] **AC-ARCH-NO-4:** Do NOT migrate infrastructure files (`src/config/**`, `src/contexts/AuthContext.tsx`)
- [x] **AC-ARCH-NO-5:** Do NOT change `AirlockRecord` type definition in `src/types/airlock.ts`
- [x] **AC-ARCH-NO-6:** Do NOT add `getFirestore()` calls anywhere -- always use `services.db` from auth context

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

- [x] 1.1 Run `npm run test:quick` and record pass count as baseline — 301 files, 7162 tests
- [x] 1.2 `grep` confirm view/component Firebase imports — 5 files (not 6; HistoryView + DashboardView already migrated by 15b-3a)
- [x] 1.3 Service-layer baseline: 39 lines / 32 files

### Task 2: Migrate HistoryView and DashboardView batch delete

- [x] 2.1-2.6 **SKIP** — Already done by 15b-3a (verified: grep found 0 matches for getFirestore/deleteTransactionsBatch in both files)

### Task 3: Migrate useSettingsViewData

- [x] 3.1 Removed `import { getFirestore } from 'firebase/firestore'` + `import { signOut as firebaseSignOut } from 'firebase/auth'`; replaced with `import type { Firestore } from 'firebase/firestore'`
- [x] 3.2 (combined with 3.1)
- [x] 3.3 Simplified `handleSignOut` to use only `authSignOut()` — removed `firebaseSignOut(services.auth)` fallback
- [x] 3.4 Changed `db: ReturnType<typeof getFirestore> | null` to `db: Firestore | null`
- [x] 3.5 `npx tsc --noEmit` — clean

### Task 4: Migrate AirlockHistoryCard Timestamp import

- [x] 4.1 Replaced `import { Timestamp } from 'firebase/firestore'` with `import type { TimestampLike } from '@/utils/timestamp'`
- [x] 4.2 Updated `formatDate` signature to `timestamp: TimestampLike | undefined` (TimestampLike already includes Date)
- [x] 4.3 `npx tsc --noEmit` — clean

### Task 5: Fix type-only imports in NotificationSettings and AppView

- [x] 5.1 Changed NotificationSettings.tsx to `import type { Firestore } from 'firebase/firestore'`
- [x] 5.2 Changed AppView.tsx to `import type { Firestore } from 'firebase/firestore'`

### Task 6: Final verification

- [x] 6.1 View/component runtime Firebase grep — **0 hits** (AC1+AC2 PASS)
- [x] 6.2 Service-layer total: 34 lines / 32 files (services are DAL boundary per AC-ARCH-NO-3)
- [x] 6.3 `npm run test:quick` — 301 files, 7162 tests passed, 0 regressions

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

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Classification | STANDARD |
| Agents | code-reviewer, security-reviewer |
| Overall Score | 9.5/10 |
| Outcome | APPROVE |
| Findings | 1 (LOW — informational, no fix needed) |
| TD Stories Created | 0 |
| Tests | 301 files, 7162 tests passed, 0 failures |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft -- placeholder with high-level tasks |
| 2026-02-23 | Full rewrite with codebase research. Identified 6 files: 3 views with runtime `getFirestore`/`signOut` imports, 1 component with runtime `Timestamp` import used as type, 2 components with missing `type` keyword on `Firestore` import. Defined specific replacement strategies. Note: 15b-3a may cover HistoryView + DashboardView; verify before executing Task 2. |
| 2026-02-27 | ECC re-creation validation: Validated accurate. Elevated 15b-3a overlap to prerequisite check subtask. Status: ready-for-dev. |
