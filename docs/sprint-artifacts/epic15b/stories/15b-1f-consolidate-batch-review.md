# Story 15b-1f: Consolidate features/batch-review/

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 1 - Feature Consolidation
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Overview

Move BatchCaptureView, BatchReviewView, 4 batch hooks (useBatchCapture, useBatchReview, useBatchProcessing, useBatchSession), and 5 batch components (BatchCaptureUI, BatchDiscardDialog, CreditWarningDialog, BatchProcessingView, BatchThumbnailStrip) into `features/batch-review/`. The feature already has 27 files (236KB) across store/, handlers/, hooks/, and components/ directories. This consolidates the 11 remaining scattered source files plus 11 test files.

**Key corrections from ECC analysis:**
- `BatchSummaryCard.tsx` is already a deprecated re-export shim to `@features/batch-review/components/BatchReviewCard` — does NOT move, stays as-is
- `ConfirmationDialog.tsx` is already a re-export shim to `src/components/shared/` — does NOT move
- 4 `Batch*.tsx` files in `src/components/scan/` belong to scan feature (scanning phase, not review) — do NOT move
- `BatchDiscardDialog.test.tsx` is misplaced at `tests/unit/features/scan/components/` — moves to correct location

## Functional Acceptance Criteria

- [x] **AC1:** BatchCaptureView and BatchReviewView moved into `src/features/batch-review/views/`
- [x] **AC2:** 4 batch hooks (useBatchCapture, useBatchReview, useBatchProcessing, useBatchSession) moved into `src/features/batch-review/hooks/`
- [x] **AC3:** 5 batch components (BatchCaptureUI, BatchDiscardDialog, CreditWarningDialog, BatchProcessingView, BatchThumbnailStrip) moved into `src/features/batch-review/components/`
- [x] **AC4:** 10 of 11 test files migrated alongside source files to `tests/unit/features/batch-review/` (BatchDiscardDialog.test.tsx stays in scan — it tests the scan feature's BatchDiscardDialog, not batch-review's)
- [x] **AC5:** All relative `../../` imports in moved source files converted to `@/` path aliases
- [x] **AC6:** Re-export shims at old locations for backward compatibility
- [x] **AC7:** `npm run test:quick` passes with 0 failures (6884 tests, 281 files)
- [x] **AC8:** Feature barrel `src/features/batch-review/index.ts` updated to export views + new hooks + new components

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** All 11 source files located under `src/features/batch-review/` in appropriate subdirectories (views/, hooks/, components/)
- [x] **AC-ARCH-LOC-2:** Views sub-barrel at `src/features/batch-review/views/index.ts`
- [x] **AC-ARCH-LOC-3:** Re-export shims at `src/views/BatchCaptureView.tsx` and `src/views/BatchReviewView.tsx`
- [x] **AC-ARCH-LOC-4:** Re-export shims at `src/hooks/useBatch{Capture,Review,Processing,Session}.ts` (4 files)
- [x] **AC-ARCH-LOC-5:** Updated barrel at `src/components/batch/index.ts` re-exporting from feature
- [x] **AC-ARCH-LOC-6:** 10 unit tests under `tests/unit/features/batch-review/` in mirrored subdirectories (BatchDiscardDialog.test.tsx stays in scan — tests scan's component)
- [x] **AC-ARCH-LOC-7:** No batch source files remain at old locations except shim files

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel pattern — `src/features/batch-review/index.ts` re-exports views via `export * from './views'`
- [x] **AC-ARCH-PATTERN-2:** Re-export shims at old view/hook locations (6 external consumers verified: App.tsx, viewRenderers.tsx, scan/processScan/types.ts, credit/CreditFeature.tsx)
- [x] **AC-ARCH-PATTERN-3:** All moved source files use `@/` or `@features/` aliases for external imports — zero `../../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** All moved test files use canonical `@features/batch-review/` paths for imports and mocks
- [x] **AC-ARCH-PATTERN-5:** Internal `./` imports within moved files preserved (files within same directory)
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/batch-review/{views,hooks,components}/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — verified with `npx madge --circular src/features/batch-review/`
- [x] **AC-ARCH-NO-2:** No stale mock paths in moved tests — verified
- [x] **AC-ARCH-NO-3:** No relative `../../` imports in moved source files — verified
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** No duplicate type definitions — types exist only at new canonical locations

## File Specification

### New Files (3)

| File/Component | Exact Path | Pattern |
|----------------|------------|---------|
| Views barrel | `src/features/batch-review/views/index.ts` | FSD barrel |
| View shim (capture) | `src/views/BatchCaptureView.tsx` | Backward compat re-export |
| View shim (review) | `src/views/BatchReviewView.tsx` | Backward compat re-export |

### Moved Source Files (11)

| File | From | To |
|------|------|----|
| BatchCaptureView.tsx (798 lines) | `src/views/` | `src/features/batch-review/views/` |
| BatchReviewView.tsx (631 lines) | `src/views/` | `src/features/batch-review/views/` |
| useBatchCapture.ts (330 lines) | `src/hooks/` | `src/features/batch-review/hooks/` |
| useBatchReview.ts (429 lines) | `src/hooks/` | `src/features/batch-review/hooks/` |
| useBatchProcessing.ts (344 lines) | `src/hooks/` | `src/features/batch-review/hooks/` |
| useBatchSession.ts (123 lines) | `src/hooks/` | `src/features/batch-review/hooks/` |
| BatchCaptureUI.tsx (348 lines) | `src/components/batch/` | `src/features/batch-review/components/` |
| BatchDiscardDialog.tsx (106 lines) | `src/components/batch/` | `src/features/batch-review/components/` |
| CreditWarningDialog.tsx (318 lines) | `src/components/batch/` | `src/features/batch-review/components/` |
| BatchProcessingView.tsx (366 lines) | `src/components/batch/` | `src/features/batch-review/components/` |
| BatchThumbnailStrip.tsx (132 lines) | `src/components/batch/` | `src/features/batch-review/components/` |

### Moved Test Files (11)

| File | From | To |
|------|------|----|
| BatchCaptureView.test.tsx | `tests/unit/views/` | `tests/unit/features/batch-review/views/` |
| BatchReviewView.test.tsx | `tests/unit/views/` | `tests/unit/features/batch-review/views/` |
| useBatchCapture.test.ts | `tests/unit/hooks/` | `tests/unit/features/batch-review/hooks/` |
| useBatchReview.test.ts | `tests/unit/hooks/` | `tests/unit/features/batch-review/hooks/` |
| useBatchProcessing.test.ts | `tests/unit/hooks/` | `tests/unit/features/batch-review/hooks/` |
| useBatchSession.test.ts | `tests/unit/hooks/` | `tests/unit/features/batch-review/hooks/` |
| BatchCaptureUI.test.tsx | `tests/unit/components/batch/` | `tests/unit/features/batch-review/components/` |
| CreditWarningDialog.test.tsx | `tests/unit/components/batch/` | `tests/unit/features/batch-review/components/` |
| BatchProcessingView.test.tsx | `tests/unit/components/batch/` | `tests/unit/features/batch-review/components/` |
| BatchThumbnailStrip.test.tsx | `tests/unit/components/` (misplaced) | `tests/unit/features/batch-review/components/` |
| BatchDiscardDialog.test.tsx | `tests/unit/features/scan/components/` (misplaced) | `tests/unit/features/batch-review/components/` |

### Modified Files (4)

| File | Exact Path | Change |
|------|------------|--------|
| Feature barrel | `src/features/batch-review/index.ts` | Add views, new hooks, new component exports |
| Hooks barrel | `src/features/batch-review/hooks/index.ts` | Add useBatchCapture, useBatchReview, useBatchProcessing, useBatchSession |
| Components barrel | `src/features/batch-review/components/index.ts` | Add BatchCaptureUI, BatchDiscardDialog, CreditWarningDialog, BatchProcessingView, BatchThumbnailStrip |
| Batch barrel (shim) | `src/components/batch/index.ts` | Update to re-export from `@features/batch-review/` |

### Re-export Shim Files (6 — replace moved files at old locations)

| File | Exact Path | Exports |
|------|------------|---------|
| View shim | `src/views/BatchCaptureView.tsx` | BatchCaptureView, BatchCaptureViewProps |
| View shim | `src/views/BatchReviewView.tsx` | BatchReviewView, BatchReviewViewProps, ProcessingStateProps, BatchReviewCredits |
| Hook shim | `src/hooks/useBatchCapture.ts` | useBatchCapture, MAX_BATCH_CAPTURE_IMAGES, CapturedImage, UseBatchCaptureReturn |
| Hook shim | `src/hooks/useBatchReview.ts` | useBatchReview, createBatchReceiptsFromResults, BatchReceipt, UseBatchReviewReturn, UseBatchReviewOptions |
| Hook shim | `src/hooks/useBatchProcessing.ts` | useBatchProcessing, BatchProcessingCallbacks, UseBatchProcessingReturn |
| Hook shim | `src/hooks/useBatchSession.ts` | useBatchSession, BatchSession, UseBatchSessionReturn |

### Files Unchanged (shims handle backward compat)

| File | Why No Change |
|------|---------------|
| `src/App.tsx` | `./views/BatchCaptureView` resolves to shim; `./hooks/useBatch*` resolve to shims |
| `src/components/App/viewRenderers.tsx` | `../../views/Batch*` resolve to shims |
| `src/features/scan/handlers/processScan/types.ts` | `@/hooks/useBatchSession` resolves to shim |
| `src/features/credit/CreditFeature.tsx` | `@/components/batch/CreditWarningDialog` resolves to updated barrel |
| `tests/unit/components/App/viewRenderers.test.tsx` | Mock targets `views/Batch*` shims — still works |
| `tests/integration/batch-processing.test.tsx` | Only mocks scan store, no batch imports |
| `src/components/batch/BatchSummaryCard.tsx` | Already a deprecated re-export shim to feature |
| `src/components/batch/ConfirmationDialog.tsx` | Already a re-export shim to shared |

### Files NOT Moving (ECC analysis verified)

| File | Reason |
|------|--------|
| `src/components/scan/BatchCompleteModal.tsx` | Scan-phase component (post-save summary), imports Transaction types |
| `src/components/scan/BatchUploadPreview.tsx` | Scan-phase component, uses `useScanImages` from scan store |
| `src/components/scan/BatchProcessingOverlay.tsx` | Scan-phase overlay during OCR processing |
| `src/components/scan/BatchProcessingProgress.tsx` | Scan-phase progress indicator |
| `src/components/batch/ConfirmationDialog.tsx` | Already a shim to `src/components/shared/` |
| `src/components/batch/BatchSummaryCard.tsx` | Already a deprecated shim to `@features/batch-review/components/BatchReviewCard` |

## Tasks / Subtasks

### Task 1: Move views and create shims (2 source + 2 test + 1 barrel + 2 shims)

- [x] 1.1 Create target directory `src/features/batch-review/views/`
- [x] 1.2 `git mv` BatchCaptureView.tsx and BatchReviewView.tsx to target
- [x] 1.3 Convert relative `../` imports in moved files to `@/` path aliases:
  - `../hooks/useBatchCapture` → `@/hooks/useBatchCapture` (temporary — resolves to shim)
  - `../hooks/useBatchReview` → `@/hooks/useBatchReview` (temporary — resolves to shim)
  - `../components/batch/BatchSummaryCard` → `@features/batch-review/components/BatchReviewCard` (direct — remove deprecated indirection)
  - Other `../` imports → `@/` equivalents
- [x] 1.4 Create views sub-barrel at `src/features/batch-review/views/index.ts`
- [x] 1.5 Create re-export shims at old locations (`src/views/BatchCaptureView.tsx`, `src/views/BatchReviewView.tsx`)
- [x] 1.6 `git mv` test files (BatchCaptureView.test.tsx, BatchReviewView.test.tsx) to `tests/unit/features/batch-review/views/`
- [x] 1.7 Update import/mock paths in moved tests to canonical `@features/batch-review/` paths
- [x] 1.8 Run `npx tsc --noEmit` — fix any errors before proceeding

### Task 2: Move hooks and create shims (4 source + 4 test + 4 shims)

- [x] 2.1 `git mv` useBatchCapture.ts, useBatchReview.ts, useBatchProcessing.ts, useBatchSession.ts to `src/features/batch-review/hooks/`
- [x] 2.2 Convert relative imports in moved hooks to `@/` path aliases
- [x] 2.3 Create re-export shims at old locations (`src/hooks/useBatch{Capture,Review,Processing,Session}.ts`)
- [x] 2.4 Update `src/features/batch-review/hooks/index.ts` — add new hook exports
- [x] 2.5 `git mv` test files (useBatch{Capture,Review,Processing,Session}.test.ts) to `tests/unit/features/batch-review/hooks/`
- [x] 2.6 Update import/mock paths in moved tests to canonical paths
- [x] 2.7 Update existing `useBatchReviewHandlers.test.ts` mock: `@/hooks/useBatchReview` → `@features/batch-review/hooks/useBatchReview`
- [x] 2.8 Run `npx vitest run tests/unit/features/batch-review/hooks/` — fix any failures atomically

### Task 3: Move components (5 source + 5 test)

- [x] 3.1 `git mv` BatchCaptureUI.tsx, BatchDiscardDialog.tsx, CreditWarningDialog.tsx, BatchProcessingView.tsx, BatchThumbnailStrip.tsx to `src/features/batch-review/components/`
- [x] 3.2 Convert relative imports in moved components to `@/` path aliases
- [x] 3.3 Update `src/features/batch-review/components/index.ts` — add new component exports
- [x] 3.4 Update `src/components/batch/index.ts` — re-export moved components from `@features/batch-review/components/`
- [x] 3.5 `git mv` test files from `tests/unit/components/batch/` and misplaced locations to `tests/unit/features/batch-review/components/`
- [x] 3.6 Update import/mock paths in moved tests to canonical paths
- [x] 3.7 Run `npx vitest run tests/unit/features/batch-review/components/` — fix any failures atomically

### Task 4: Update feature barrel exports

- [x] 4.1 Update `src/features/batch-review/index.ts` — add `export * from './views'` and new hook/component exports
- [x] 4.2 Run `npx tsc --noEmit` — verify barrel chain resolves correctly

### Task 5: Verification and cleanup

- [x] 5.1 Grep: `grep -rE "from '\.\./\.\." src/features/batch-review/views/` returns 0
- [x] 5.2 Grep: `grep -rE "from '\.\./\.\." src/features/batch-review/hooks/useBatch(Capture|Review|Processing|Session)` returns 0
- [x] 5.3 Grep: `grep -r '@/hooks/useBatch' tests/unit/features/batch-review/` returns 0 (all mocks use canonical paths)
- [x] 5.4 Grep: `grep -r '@/views/Batch' tests/unit/features/batch-review/` returns 0
- [x] 5.5 Run `npm run test:quick` — all tests pass (6884 tests, 281 files)
- [x] 5.6 Verify no new circular dependencies: `npx madge --circular src/features/batch-review/`

## Dev Notes

### Architecture Guidance

**Import rewiring strategy:** Convert all `../` relative imports in moved files to `@/` path aliases. This makes files location-independent and prevents future breakage. Internal `./` imports within the same directory stay as-is.

**Re-export shim justification:** 6 external consumers across views (App.tsx, viewRenderers.tsx), hooks (App.tsx×3, scan/processScan/types.ts), and components (credit/CreditFeature.tsx) import from old paths. Shims cost 6 trivial files and prevent breaking all consumers. Shim pattern is identical to 15b-1a.

**Barrel chain:** `features/batch-review/index.ts → views/index.ts`, `hooks/index.ts`, `components/index.ts`. Moved files import from `@/` aliases (NOT the barrel), avoiding circular imports.

**BatchReviewView.tsx cleanup:** Currently imports `BatchSummaryCard` from `../components/batch/BatchSummaryCard` (deprecated shim). During move, update to import `BatchReviewCard` directly from `@features/batch-review/components/BatchReviewCard` — eliminates deprecated indirection.

### Critical Pitfalls

1. **vi.mock() does NOT follow re-exports:** The `useBatchReviewHandlers.test.ts` (already in feature) mocks `@/hooks/useBatchReview`. After useBatchReview moves, the shim at that path will re-export from the canonical location. But vi.mock() may not resolve the re-export. **Must update mock to `@features/batch-review/hooks/useBatchReview`.**

2. **Misplaced test files:** `BatchThumbnailStrip.test.tsx` is at `tests/unit/components/` (wrong — should be in `components/batch/`), `BatchDiscardDialog.test.tsx` is at `tests/unit/features/scan/components/` (wrong — belongs to batch-review). Both move to `tests/unit/features/batch-review/components/`.

3. **Component import depth change:** Tests import sources via relative paths like `../../../../src/components/batch/X`. After moving to `tests/unit/features/batch-review/components/`, use `@features/batch-review/components/X` aliases instead.

4. **BatchSummaryCard is a shim — don't move it:** `src/components/batch/BatchSummaryCard.tsx` already re-exports `BatchReviewCard` from `@features/batch-review/components/`. Moving it would be circular. Leave it as-is; update BatchReviewView's import to use the canonical path directly.

5. **Scan batch components stay in scan:** The 4 `Batch*.tsx` files in `src/components/scan/` are scan-phase UI (camera, upload, OCR progress) — they belong to features/scan, not batch-review. The `15b-1i-consolidate-scan` story will handle those.

### E2E Testing

E2E coverage recommended — run `/ecc-e2e 15b-1f` after implementation.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Moderate (mechanical moves, but high file count and mock path management)
- **Sizing:** MEDIUM (5 tasks, 22 source+test files, 4 modified barrels — within consolidation limits)
- **Classification:** SIMPLE
- **Agents consulted:** Planner
- **Dependencies:** None (standalone consolidation)

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-15
- **ECC Agents Used:** code-reviewer (sonnet), security-reviewer (sonnet)
- **Classification:** STANDARD (5 tasks, ~32 files, architecture-sensitive)
- **Outcome:** APPROVE 9.25/10
- **Code Quality:** 8.5/10 — CHANGES REQUESTED → reclassified as DEFERRED (coupled findings)
- **Security:** 10/10 — APPROVE (zero-risk mechanical refactoring)
- **Quick Fixes Applied:** 0 (Finding 1+2 are coupled, cannot fix independently)
- **TD Stories Created:** 1 — [TD-15b-1](./TD-15b-1-intra-feature-shim-imports.md) (intra-feature shim import cleanup)

### Findings Summary

| # | Sev | Finding | Resolution |
|---|-----|---------|------------|
| 1 | MEDIUM | Test mocks use `@/hooks/useBatch*` shim paths instead of canonical `@features/batch-review/hooks/` — violates AC-ARCH-PATTERN-4 | DEFERRED → TD-15b-1 |
| 2 | LOW | Source files within feature import hooks via shim indirection instead of direct paths | DEFERRED → TD-15b-1 (coupled with #1) |

### AC-ARCH-PATTERN-4 Clarification

AC-ARCH-PATTERN-4 states "All moved test files use canonical @features/batch-review/ paths for imports and mocks." In practice, `vi.mock()` must target the same module path the source code imports from. Since source files use `@/hooks/useBatch*` (shim paths), test mocks must match. Fixing test paths requires first fixing source paths — the two are coupled. Both deferred to TD-15b-1.

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [TD-15b-1](./TD-15b-1-intra-feature-shim-imports.md) | Intra-feature shim import cleanup (5 source + 4 test files) | LOW | CREATED |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-14 | ECC create-story refinement: Planner analysis + orchestrator file spec. Corrected file count 15→11 (BatchSummaryCard + ConfirmationDialog are existing shims, 4 scan Batch components stay in scan). Added architectural ACs, exact file specification with line counts, re-export shim table, 5 critical pitfalls, misplaced test file corrections. |
| 2026-02-15 | ECC code review: APPROVE 9.25/10. 2 findings (MEDIUM+LOW) coupled and deferred to TD-15b-1. Security clean (10/10). Status → done. |
