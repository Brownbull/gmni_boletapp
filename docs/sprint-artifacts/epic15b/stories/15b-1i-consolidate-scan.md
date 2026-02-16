# Story 15b-1i: Consolidate features/scan/

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Delete dead ScanView/ScanResultView files (zero import consumers) and move 3 remaining scan-specific hooks from `src/hooks/` into `features/scan/hooks/`. The feature already has 33 files (~380K) — this consolidates the last scattered scan code.

**Key corrections from ECC analysis:**
- `ScanView.tsx` (73 lines, @deprecated) has **zero import consumers** — DELETE, not move
- `ScanResultView.tsx` (1,554 lines) has **zero import consumers** (replaced by `TransactionEditorViewInternal`) — DELETE, not move
- `useRecentScans.ts` is **cross-feature** (5 consumers: dashboard, history, items, reports, App.tsx) — stays in `src/hooks/`
- Only 3 hooks need to move: `useScanHandlers`, `useScanOverlayState`, `useScanState`

## Functional Acceptance Criteria

- [x] **AC1:** `ScanView.tsx` and `ScanResultView.tsx` deleted (zero import consumers verified)
- [x] **AC2:** `useScanState.ts`, `useScanOverlayState.ts`, `useScanHandlers.ts` moved into `src/features/scan/hooks/`
- [x] **AC3:** 3 test files migrated to `tests/unit/features/scan/hooks/`
- [x] **AC4:** Re-export shims at old locations for backward compatibility
- [x] **AC5:** `npm run test:quick` passes with 0 failures
- [x] **AC6:** `src/features/scan/hooks/index.ts` updated with new exports
- [x] **AC7:** CI config `vitest.config.ci.group-hooks-scan.ts` updated with new test paths

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** `useScanState.ts` located at `src/features/scan/hooks/useScanState.ts`
- [x] **AC-ARCH-LOC-2:** `useScanOverlayState.ts` located at `src/features/scan/hooks/useScanOverlayState.ts`
- [x] **AC-ARCH-LOC-3:** `useScanHandlers.ts` located at `src/features/scan/hooks/useScanHandlers.ts`
- [x] **AC-ARCH-LOC-4:** Re-export shim at `src/hooks/useScanState.ts`
- [x] **AC-ARCH-LOC-5:** Re-export shim at `src/hooks/useScanOverlayState.ts`
- [x] **AC-ARCH-LOC-6:** Re-export shim at `src/hooks/app/useScanHandlers.ts`
- [x] **AC-ARCH-LOC-7:** 3 unit tests under `tests/unit/features/scan/hooks/`
- [x] **AC-ARCH-LOC-8:** No ScanView.tsx or ScanResultView.tsx exists anywhere in `src/views/`

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** Re-export shims contain ONLY `export` statements — re-export all named exports and types from canonical location
- [x] **AC-ARCH-PATTERN-2:** `src/features/scan/hooks/index.ts` exports all 3 moved hooks plus existing `useScanInitiation`
- [x] **AC-ARCH-PATTERN-3:** `src/hooks/app/index.ts` re-exports `useScanHandlers` via shim (barrel chain preserved)
- [x] **AC-ARCH-PATTERN-4:** All moved test files import from `@features/scan/hooks/*` — not old `@/hooks/` paths
- [x] **AC-ARCH-PATTERN-5:** All `../../` relative imports in moved hooks converted to `@/` path aliases

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — moved hooks must NOT import from scan barrel (`@features/scan`); must use deep paths
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/hooks/useScanState' tests/unit/features/scan/` returns 0 matches
- [x] **AC-ARCH-NO-3:** No stale imports — `grep -r "from.*views/ScanView\|from.*views/ScanResultView" src/` returns 0 matches
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** `useRecentScans.ts` must NOT be moved (cross-feature: 5 consumers)

## File Specification

### Deleted Files (2)

| File | Lines | Reason |
|------|-------|--------|
| `src/views/ScanView.tsx` | 73 | @deprecated since Story 9.9, zero import consumers |
| `src/views/ScanResultView.tsx` | 1,554 | Replaced by TransactionEditorViewInternal, zero import consumers |

### Moved Source Files (3)

| File | From | To |
|------|------|----|
| useScanState.ts (188L) | `src/hooks/useScanState.ts` | `src/features/scan/hooks/useScanState.ts` |
| useScanOverlayState.ts (240L) | `src/hooks/useScanOverlayState.ts` | `src/features/scan/hooks/useScanOverlayState.ts` |
| useScanHandlers.ts (956L) | `src/hooks/app/useScanHandlers.ts` | `src/features/scan/hooks/useScanHandlers.ts` |

### Moved Test Files (3)

| File | From | To |
|------|------|----|
| useScanState.test.ts | `tests/unit/hooks/useScanState.test.ts` | `tests/unit/features/scan/hooks/useScanState.test.ts` |
| useScanOverlayState.test.ts | `tests/unit/hooks/useScanOverlayState.test.ts` | `tests/unit/features/scan/hooks/useScanOverlayState.test.ts` |
| useScanHandlers.test.ts | `tests/unit/hooks/app/useScanHandlers.test.ts` | `tests/unit/features/scan/hooks/useScanHandlers.test.ts` |

### Re-export Shim Files (3)

| File | Re-exports From |
|------|-----------------|
| `src/hooks/useScanState.ts` | `@features/scan/hooks/useScanState` |
| `src/hooks/useScanOverlayState.ts` | `@features/scan/hooks/useScanOverlayState` |
| `src/hooks/app/useScanHandlers.ts` | `@features/scan/hooks/useScanHandlers` |

### Modified Files (3)

| File | Exact Path | Change |
|------|------------|--------|
| Scan hooks barrel | `src/features/scan/hooks/index.ts` | Add exports for 3 moved hooks |
| App hooks barrel | `src/hooks/app/index.ts` | Re-export via shim (or no change if barrel already resolves) |
| CI config | `tests/config/vitest.config.ci.group-hooks-scan.ts` | Update test paths |

### Files Unchanged (shim handles backward compat)

| File | Why No Change |
|------|---------------|
| `src/App.tsx` | Imports via `./hooks/app` barrel and `./hooks/useScanOverlayState` — shims resolve |
| `src/features/scan/components/ScanOverlay.tsx` | `@/hooks/useScanState` — shim resolves |
| `src/features/scan/components/ScanReady.tsx` | `@/hooks/useScanState` — shim resolves |
| `src/features/scan/components/ScanError.tsx` | `@/hooks/useScanState` — shim resolves |
| `src/features/scan/components/ScanStatusIndicator.tsx` | `@/hooks/useScanState` — shim resolves |
| `src/features/scan/components/states/ErrorState.tsx` | `@/hooks/useScanState` — shim resolves |
| `src/features/scan/ScanFeature.tsx` | `@/hooks/useScanOverlayState` — shim resolves |

## Tasks / Subtasks

### Task 1: Delete dead view files (2 files)

- [x] 1.1 Verify zero import consumers: `grep -r "import.*ScanView\|import.*ScanResultView" src/` — 0 matches
- [x] 1.2 Delete `src/views/ScanView.tsx`
- [x] 1.3 Delete `src/views/ScanResultView.tsx`
- [x] 1.4 Run `npx tsc --noEmit` — confirm no compilation errors

### Task 2: Move scan hooks to feature module (3 files)

- [x] 2.1 `git mv src/hooks/useScanState.ts src/features/scan/hooks/useScanState.ts`
- [x] 2.2 `git mv src/hooks/useScanOverlayState.ts src/features/scan/hooks/useScanOverlayState.ts`
- [x] 2.3 `git mv src/hooks/app/useScanHandlers.ts src/features/scan/hooks/useScanHandlers.ts`
- [x] 2.4 Convert any `../../` relative imports in moved hooks to `@/` path aliases
- [x] 2.5 Verify `useScanOverlayState.ts` internal import of `./useScanState` still resolves (same dir after move)

### Task 3: Create re-export shims at old locations (3 files)

- [x] 3.1 Create `src/hooks/useScanState.ts` — re-export all named exports + types from `@features/scan/hooks/useScanState`
- [x] 3.2 Create `src/hooks/useScanOverlayState.ts` — re-export all from `@features/scan/hooks/useScanOverlayState`
- [x] 3.3 Create `src/hooks/app/useScanHandlers.ts` — re-export all from `@features/scan/hooks/useScanHandlers`
- [x] 3.4 Run `npx tsc --noEmit` — verify shims resolve correctly

### Task 4: Move test files and fix imports (3 files)

- [x] 4.1 Create target directory `tests/unit/features/scan/hooks/` (if not exists)
- [x] 4.2 `git mv tests/unit/hooks/useScanState.test.ts tests/unit/features/scan/hooks/`
- [x] 4.3 `git mv tests/unit/hooks/useScanOverlayState.test.ts tests/unit/features/scan/hooks/`
- [x] 4.4 `git mv tests/unit/hooks/app/useScanHandlers.test.ts tests/unit/features/scan/hooks/`
- [x] 4.5 Update imports in moved tests: `@/hooks/useScanState` → `@features/scan/hooks/useScanState` (and similar)
- [x] 4.6 Update `vi.mock()` paths in moved tests to target canonical (new) paths
- [x] 4.7 Run `npx vitest run tests/unit/features/scan/hooks/` — fix any failures atomically

### Task 5: Update barrel exports and CI config (3 files)

- [x] 5.1 Update `src/features/scan/hooks/index.ts` — add exports for useScanState, useScanOverlayState, useScanHandlers (types + hooks)
- [x] 5.2 Verify `src/hooks/app/index.ts` still resolves (shim at old location handles it — no changes needed)
- [x] 5.3 Update `tests/config/vitest.config.ci.group-hooks-scan.ts` — change test paths to new location
- [x] 5.4 Run `npx tsc --noEmit` — verify full type resolution

### Task 6: Verification and cleanup

- [x] 6.1 Grep: `grep -r "from.*views/ScanView\|from.*views/ScanResultView" src/` → 0 matches
- [x] 6.2 Grep: `grep -r "@/hooks/useScanState" tests/unit/features/scan/` → 0 matches (no stale mocks)
- [x] 6.3 Run `npm run test:quick` — all tests pass
- [x] 6.4 Verify no new circular dependencies: `npx madge --circular src/features/scan/`

## Dev Notes

### Architecture Guidance

**Dead code deletion:** ScanView.tsx was deprecated at Story 9.9 (scan functionality moved to EditView). ScanResultView.tsx was replaced by TransactionEditorViewInternal.tsx (confirmed in its JSDoc: "combines ScanResultView and EditView functionality"). Both have zero import consumers — safe to delete.

**Re-export shim justification:** 7 external consumers depend on `@/hooks/useScanState` (App.tsx + 5 scan feature components + useScanOverlayState), 3 consumers depend on `@/hooks/useScanOverlayState` (App.tsx + ScanFeature.tsx + ScanOverlay.tsx), 1 consumer depends on useScanHandlers via barrel. Shims cost 3 trivial files and prevent breaking ~11 import sites.

**Why useRecentScans stays:** 5 consumers across 5 different features — dashboard (`useDashboardViewData`), history (`useHistoryViewData`), items (`useItemsViewData`), reports (`ReportsView`), App.tsx. Clearly cross-feature shared code.

**Import resolution after move:** `useScanOverlayState` imports `ScanErrorType` from `useScanState`. Since both move to the same directory (`features/scan/hooks/`), the internal `./useScanState` import stays valid.

### Critical Pitfalls

1. **useScanHandlers barrel chain:** `App.tsx` → `hooks/app/index.ts` → `hooks/app/useScanHandlers.ts` (shim) → `features/scan/hooks/useScanHandlers.ts`. Verify the barrel at `hooks/app/index.ts` still resolves after git mv replaces the original with a shim.

2. **Test import depth change:** Test files move from `tests/unit/hooks/` (depth 3) to `tests/unit/features/scan/hooks/` (depth 5). Any relative path imports (e.g., `../../setup/test-utils`) need updating. Prefer `@/` aliases where possible.

3. **CI config stale paths:** `vitest.config.ci.group-hooks-scan.ts` explicitly lists test file paths — MUST update to new paths or tests won't run in CI.

4. **useScanHandlers relative imports:** This file (956 lines) likely has many `../../` relative imports to App-level modules. After moving to `features/scan/hooks/`, all relative imports must convert to `@/` path aliases.

5. **ScanResultView.tsx deletion impact on 15b-2b:** The epic lists `15b-2b-decompose-scan-result-view` (3 pts, 1,554 lines). Since ScanResultView is dead code and will be deleted here, story 15b-2b should be cancelled or re-scoped. Flag for sprint planning.

### Files that do NOT move (ECC Planner verified)

- `useRecentScans.ts` — cross-feature (5 consumers: dashboard, history, items, reports, App.tsx)
- `useActiveTransaction.ts`, `useBatchProcessing.ts`, `useBatchSession.ts`, `useBatchReview.ts` — cross-feature or batch-domain
- `useNavigationHandlers.ts`, `useDialogHandlers.ts`, `useTransactionHandlers.ts` — app-level coordination hooks

### E2E Testing

E2E coverage recommended — run `/ecc-e2e 15b-1i` after implementation.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple (mechanical moves + dead code deletion, known pattern)
- **Classification:** SIMPLE
- **Agents consulted:** Planner (sonnet)
- **Dependencies:** None (all consumers handled by re-export shims)

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-15
- **ECC Agents:** code-reviewer (sonnet), security-reviewer (sonnet), architect (sonnet), tdd-guide (haiku)
- **Classification:** COMPLEX (14 files, 6 tasks)
- **Outcome:** APPROVE 9.875/10
- **Findings:** 0 CRITICAL, 0 HIGH, 3 LOW (all pre-existing, not introduced by this story)
- **Quick fixes applied:** 0
- **TD stories created:** 0 (pre-existing `any` types tracked by 15b-2l-decompose-scan-handlers)
- **Architecture ACs:** 18/18 PASS (8 location, 5 pattern, 5 anti-pattern)
- **TEA Score:** 94/100 (128 tests, GOOD)
- **Session cost:** $9.93

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-14 | ECC create-story refinement: Planner analysis. Corrected scope — ScanView + ScanResultView are dead code (DELETE, not move), useRecentScans is cross-feature (stays). Reduced to 6 tasks with 3 hook moves + 3 test moves + 3 shims + 2 deletes. Added architectural ACs, exact file specification, 5 critical pitfalls. Flagged 15b-2b for cancellation (ScanResultView is dead code). |
