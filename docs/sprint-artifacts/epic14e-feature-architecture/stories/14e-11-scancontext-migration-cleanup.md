# Story 14e.11: ScanContext Migration & Cleanup

Status: ready-for-dev

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Created:** 2026-01-25
**Author:** Atlas Create-Story Workflow

---

## Story

As a **developer**,
I want **the existing ScanContext and useScanStateMachine replaced by the new Zustand store**,
So that **we have a single source of truth for scan state and no duplicate state management**.

---

## Context

### Epic 14e Progress

This story is the **final cleanup of Part 2 (Scan Feature Extraction)**. It removes the legacy implementation after all components have migrated to Zustand:

| Story | Purpose | Status |
|-------|---------|--------|
| 14e-6a/b/c/d | Scan Zustand store | ready-for-dev |
| 14e-8a/b/c | processScan handler extraction | ready-for-dev |
| 14e-9a/b/c | Scan components moved and updated | ready-for-dev |
| 14e-10 | ScanFeature orchestrator | ready-for-dev |
| **14e-11** | **Delete legacy ScanContext** | **THIS STORY** |

### Files to Delete

| File | Lines | Description |
|------|-------|-------------|
| `src/contexts/ScanContext.tsx` | ~680 | React context wrapper around useScanStateMachine |
| `src/hooks/useScanStateMachine.ts` | ~898 | useReducer-based state machine (Epic 14d) |

**Total cleanup:** ~1,578 lines of legacy code

### Why This Story Exists

Per ADR-018, the codebase is moving from:
- **Before:** TanStack Query + useReducer (ScanContext) + scattered state
- **After:** TanStack Query + Zustand (single client state paradigm)

This story eliminates the "2.5 paradigms" problem by removing the useReducer implementation.

### Dependencies

| Story | Provides | Required Status |
|-------|----------|-----------------|
| 14e-6d | Zustand store with all selectors | ✅ complete |
| 14e-10 | ScanFeature using Zustand | ✅ complete |

⚠️ **CRITICAL:** Do NOT execute this story until 14e-10 is verified complete.

---

## Acceptance Criteria

### AC1: Pre-Deletion Verification (MANDATORY)

**Given** the migration to Zustand store is complete
**When** this story begins
**Then:**
- [ ] Run `grep -r "ScanContext" src/` - must return ONLY the context file itself
- [ ] Run `grep -r "useScan\b" src/` - must return ONLY new Zustand hooks and old files being deleted
- [ ] Run `grep -r "useScanStateMachine" src/` - must return ONLY the file being deleted
- [ ] Run `grep -r "ScanProvider" src/` - must return ONLY the context file and App.tsx provider removal
- [ ] Document all consumers found before proceeding
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test`

### AC2: ScanContext Deleted

**Given** no components reference ScanContext
**When** this story is completed
**Then:**
- [ ] `src/contexts/ScanContext.tsx` deleted
- [ ] `ScanProvider` removed from App.tsx provider chain
- [ ] All imports of ScanContext removed
- [ ] Build succeeds without ScanContext

### AC3: useScanStateMachine Deleted

**Given** no components or contexts reference useScanStateMachine
**When** this story is completed
**Then:**
- [ ] `src/hooks/useScanStateMachine.ts` deleted
- [ ] All imports of useScanStateMachine removed
- [ ] Build succeeds without useScanStateMachine

### AC4: Test Suite Maintained

**Given** the legacy implementation had ~74 tests
**When** this story is completed
**Then:**
- [ ] Legacy test files migrated or deleted:
  - `tests/unit/hooks/useScanStateMachine.test.ts` - DELETE (Zustand tests replace)
  - `tests/unit/contexts/ScanContext.test.tsx` - DELETE (if exists)
- [ ] New Zustand store tests exist and pass (from 14e-6d)
- [ ] All 5,700+ tests continue to pass
- [ ] No test coverage regression

### AC5: 31 State Variables Accounted For

**Given** the original state machine had 31 variables (per Epic 14d documentation)
**When** verifying migration completeness
**Then:**
- [ ] All 31 variables mapped to Zustand store (document mapping below)
- [ ] No state lost during migration
- [ ] Reference: `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

### AC6: Zero Regressions

**Given** scan functionality works via Zustand store
**When** legacy code is deleted
**Then:**
- [ ] Single scan flow works end-to-end
- [ ] Batch scan flow works end-to-end
- [ ] Quick Save flow works
- [ ] Navigation blocking preserved
- [ ] FAB mode selector works
- [ ] No console errors related to scan

---

## Tasks / Subtasks

### Task 1: Pre-Deletion Verification (AC: 1, 5)

This task is BLOCKING - do not proceed if any check fails.

- [ ] **1.1** Run consumer audit:
  ```bash
  grep -r "ScanContext" src/ --include="*.ts" --include="*.tsx"
  grep -r "useScan\b" src/ --include="*.ts" --include="*.tsx"
  grep -r "useScanStateMachine" src/ --include="*.ts" --include="*.tsx"
  grep -r "ScanProvider" src/ --include="*.ts" --include="*.tsx"
  ```
- [ ] **1.2** Document all findings in Dev Notes section
- [ ] **1.3** For ANY consumer found (other than files being deleted):
  - STOP - fix migration first
  - Update component to use Zustand hooks
  - Return to 1.1
- [ ] **1.4** Verify build: `npm run build`
- [ ] **1.5** Verify tests: `npm run test`
- [ ] **1.6** Complete 31-variable mapping table (see Dev Notes)

### Task 2: Delete Legacy Files (AC: 2, 3)

Only proceed if Task 1 passes all checks.

- [ ] **2.1** Delete `src/contexts/ScanContext.tsx`
- [ ] **2.2** Delete `src/hooks/useScanStateMachine.ts`
- [ ] **2.3** Remove ScanProvider from App.tsx:
  ```diff
  - import { ScanProvider } from './contexts/ScanContext';
  ...
  - <ScanProvider>
      <AppContent />
  - </ScanProvider>
  ```
- [ ] **2.4** Remove any orphaned imports in other files
- [ ] **2.5** Verify build: `npm run build`

### Task 3: Test Cleanup (AC: 4)

- [ ] **3.1** Delete legacy test files:
  - `tests/unit/hooks/useScanStateMachine.test.ts`
  - `tests/unit/contexts/ScanContext.test.tsx` (if exists)
- [ ] **3.2** Update any test imports that referenced legacy files
- [ ] **3.3** Run full test suite: `npm run test`
- [ ] **3.4** Verify test count is reasonable (expect ~74 tests to be deleted/replaced)
- [ ] **3.5** Verify Zustand store tests exist in `tests/unit/features/scan/store/`

### Task 4: Final Verification (AC: 6)

- [ ] **4.1** Execute smoke test checklist (see Dev Notes)
- [ ] **4.2** Verify all 4 workflow chains work:
  - [ ] Workflow #1: Single scan flow
  - [ ] Workflow #2: Quick Save flow
  - [ ] Workflow #3: Batch processing flow
  - [ ] Workflow #9: FAB mode selector + lifecycle
- [ ] **4.3** Run lint: `npm run lint`
- [ ] **4.4** Final build: `npm run build`
- [ ] **4.5** Document lines removed (target: ~1,578 lines)

---

## Dev Notes

### Pre-Deletion Consumer Audit Template

```markdown
## Consumer Audit Results

**Date:** ____
**Verified by:** ____

### ScanContext Consumers
| File | Usage | Migration Status |
|------|-------|------------------|
| `src/App.tsx` | ScanProvider | TO BE REMOVED |
| (list all) | | |

### useScan Consumers
| File | Usage | Migration Status |
|------|-------|------------------|
| (list all) | | |

### useScanStateMachine Consumers
| File | Usage | Migration Status |
|------|-------|------------------|
| `src/contexts/ScanContext.tsx` | Hook call | TO BE DELETED |
| (list all) | | |

### Blockers Found
- [ ] None / [ ] List blockers here

### Ready to Proceed: [ ] Yes / [ ] No
```

### 31 State Variable Mapping

Reference: `src/hooks/useScanStateMachine.ts:40-76`

| # | Variable | Old Location | New Zustand Location | Verified |
|---|----------|--------------|---------------------|----------|
| 1 | phase | ScanState.phase | useScanStore.phase | [ ] |
| 2 | mode | ScanState.mode | useScanStore.mode | [ ] |
| 3 | requestId | ScanState.requestId | useScanStore.requestId | [ ] |
| 4 | userId | ScanState.userId | useScanStore.userId | [ ] |
| 5 | startedAt | ScanState.startedAt | useScanStore.startedAt | [ ] |
| 6 | images | ScanState.images | useScanStore.images | [ ] |
| 7 | results | ScanState.results | useScanStore.results | [ ] |
| 8 | activeResultIndex | ScanState.activeResultIndex | useScanStore.activeResultIndex | [ ] |
| 9 | creditStatus | ScanState.creditStatus | useScanStore.creditStatus | [ ] |
| 10 | creditType | ScanState.creditType | useScanStore.creditType | [ ] |
| 11 | creditsCount | ScanState.creditsCount | useScanStore.creditsCount | [ ] |
| 12 | activeDialog | ScanState.activeDialog | useScanStore.activeDialog | [ ] |
| 13 | error | ScanState.error | useScanStore.error | [ ] |
| 14 | batchProgress | ScanState.batchProgress | useScanStore.batchProgress | [ ] |
| 15 | batchReceipts | ScanState.batchReceipts | useScanStore.batchReceipts | [ ] |
| 16 | batchEditingIndex | ScanState.batchEditingIndex | useScanStore.batchEditingIndex | [ ] |
| 17 | storeType | ScanState.storeType | useScanStore.storeType | [ ] |
| 18 | currency | ScanState.currency | useScanStore.currency | [ ] |
| 19-31 | Computed values | ScanComputedValues | Zustand selectors | [ ] |

**Computed values (19-31):**
- hasActiveRequest
- isProcessing
- isIdle
- hasError
- hasDialog
- isBlocking
- creditSpent
- canNavigateFreely
- canSave
- currentView
- imageCount
- resultCount
- isBatchMode

### Smoke Test Checklist

Execute after deletion:

**1. Single Scan Flow (Workflow #1)**
- [ ] Tap FAB → Camera opens
- [ ] Take photo → Processing animation shows
- [ ] Success → EditView shows with transaction data
- [ ] Save → Transaction saved, credit deducted
- [ ] Cancel during review → Returns to idle

**2. Quick Save Flow (Workflow #2)**
- [ ] Scan high-confidence receipt
- [ ] QuickSaveCard appears (≥85% confidence)
- [ ] Accept → Transaction auto-saved
- [ ] Decline → EditView opens

**3. Batch Processing Flow (Workflow #3)**
- [ ] Long-press FAB → Select batch mode
- [ ] Capture 3 receipts
- [ ] Process → Parallel processing with progress
- [ ] Review → BatchReviewView shows all results
- [ ] Save all → Transactions saved

**4. FAB + Lifecycle (Workflow #9)**
- [ ] Short tap FAB → Single mode scan
- [ ] Long-press FAB → Mode selector popup
- [ ] Select batch → Batch capture starts
- [ ] During scan → Navigation blocked
- [ ] After cancel/save → Navigation unblocked

**5. Error Handling**
- [ ] Network error → ErrorState shows with retry
- [ ] Cancel mid-scan with credit spent → Warning dialog

### Expected Line Reduction

| File | Lines Before | Lines After | Reduction |
|------|--------------|-------------|-----------|
| `src/contexts/ScanContext.tsx` | ~680 | 0 | -680 |
| `src/hooks/useScanStateMachine.ts` | ~898 | 0 | -898 |
| **Total** | ~1,578 | 0 | **-1,578** |

### Files Affected

**Deleted:**
- `src/contexts/ScanContext.tsx`
- `src/hooks/useScanStateMachine.ts`
- `tests/unit/hooks/useScanStateMachine.test.ts` (if exists)
- `tests/unit/contexts/ScanContext.test.tsx` (if exists)

**Modified:**
- `src/App.tsx` - Remove ScanProvider
- Any files with orphaned imports

### Rollback Plan

If issues discovered after deletion:

1. `git stash` current changes
2. Restore deleted files from git: `git checkout HEAD -- src/contexts/ScanContext.tsx src/hooks/useScanStateMachine.ts`
3. Investigate what component still requires legacy code
4. Fix migration in that component
5. Retry deletion

### Atlas Workflow Analysis Summary

| Workflow | Risk | Key Verification |
|----------|------|------------------|
| #1 Scan Receipt | LOW | Zustand store tested in 14e-6d |
| #2 Quick Save | LOW | Confidence routing tested |
| #3 Batch Processing | LOW | Batch flow tested |
| #9 Scan Lifecycle | LOW | FAB integration tested |

**Overall Risk: LOW** - This is cleanup after verified migration.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e11]
- [Source: docs/sprint-artifacts/epic14d/scan-request-lifecycle.md] - 31 state variables
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md]
- [Depends on: 14e-10] - ScanFeature orchestrator complete
- [Blocked by: 14e-6d, 14e-8c, 14e-9c, 14e-10] - All scan Zustand migration

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during development_

### Completion Notes List

_To be filled during development_

### File List

_To be filled during development_
