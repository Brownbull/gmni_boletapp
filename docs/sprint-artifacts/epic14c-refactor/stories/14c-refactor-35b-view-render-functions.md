# Story 14c-refactor.35b: Final Cleanup - View Render Functions

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **remaining views moved to render functions in viewRenderers.tsx**,
So that **App.tsx is reduced and view rendering logic is consolidated**.

## Background

### Part of Story 35 Split

This story is Part B of 4 stories split from the original story 14c-refactor.35 (Final App.tsx Line Count Target). The split was performed via `atlas-story-sizing` workflow because the original story exceeded sizing guidelines.

**Split breakdown:**
- **35a:** Audit & Documentation (Task 1) - PREREQUISITE
- **35b (this story):** View Render Functions (Task 2)
- **35c:** Handler Hook Extraction (Task 3) - CAN PARALLEL with 35b
- **35d:** Dead Code & Verification (Tasks 4-5)

### Focus

After stories 30-34, some views don't have composition hooks:
- InsightsView
- ReportsView
- BatchCaptureView
- NotificationsView
- StatementScanView

These can be moved to render functions in viewRenderers.tsx even without composition hooks, following the pattern established in Story 22c.

## Acceptance Criteria

1. **Given** views without composition hooks exist in App.tsx
   **When** this story is completed
   **Then:**
   - Small views converted to `renderViewName()` functions in viewRenderers.tsx
   - OR kept inline with documented reason

2. **Given** viewRenderers.tsx is updated
   **When** the build runs
   **Then:**
   - TypeScript compiles without errors
   - All existing tests pass

## Tasks / Subtasks

### Task 1: Move Remaining Views to Render Functions

For views without composition hooks:
- [x] 1.1 InsightsView - evaluate and move to `renderInsightsView()` (verify if already exists)
- [x] 1.2 ReportsView - evaluate and move to `renderReportsView()` (verify if already exists)
- [x] 1.3 BatchCaptureView - evaluate inline vs render function
- [x] 1.4 NotificationsView - evaluate inline vs render function
- [x] 1.5 StatementScanView - verify already uses `renderStatementScanView()`

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Following established patterns from Story 22c

### Dependencies

- **Requires:**
  - Story 35a (Audit) - MUST be done (provides list of movable code)
- **Blocks:** Story 35d (Final verification)

### Decision Criteria

Move to render function IF:
- View is relatively simple (< 50 lines of JSX)
- Props can be passed cleanly
- No complex state management inline

Keep inline IF:
- View has complex inline state management
- View has tight coupling to App.tsx state
- Moving would require significant prop threading

Document the decision for each view in the story's Completion Notes.

## References

- [Story 35a](14c-refactor-35a-audit-documentation.md) - Audit provides movable code list
- [Story 22c](14c-refactor-22c-renderviewswitch.md) - Established render function pattern
- [viewRenderers.tsx](../../../src/components/App/viewRenderers.tsx) - Target file

## Dev Agent Record

### Completion Notes

**Date:** 2026-01-24

**Summary:** All five views were evaluated. Four views already use render functions (verified in Story 22c). One view (BatchCaptureView) remains inline with documented reason per decision criteria.

#### View-by-View Decisions

| View | Decision | Reason | Location |
|------|----------|--------|----------|
| InsightsView | ✅ Already using `renderInsightsView()` | Extracted in Story 22c | App.tsx:3555 |
| ReportsView | ✅ Already using `renderReportsView()` | Extracted in Story 22c | App.tsx:3777 |
| NotificationsView | ✅ Already using `renderAlertsView()` | Extracted in Story 22c | App.tsx:3703 |
| StatementScanView | ✅ Already using `renderStatementScanView()` | Extracted in Story 22c | App.tsx:3724 |
| BatchCaptureView | ⚠️ **KEEP INLINE** | Complex state management | App.tsx:3575-3693 |

#### BatchCaptureView - Detailed Decision

BatchCaptureView remains inline for the following reasons per the story's decision criteria:

1. **Complex inline state management:** ~117 lines of JSX with multiple async handlers
2. **Tight coupling to App.tsx state:** Uses 12+ inline callbacks that require:
   - `deductUserSuperCredits`, `addUserSuperCredits` (credit system)
   - `dispatchProcessStart`, `dispatchBatchItemStart`, `dispatchBatchItemSuccess`, `dispatchBatchItemError`, `dispatchBatchComplete` (ScanContext state machine)
   - `setBatchImages`, `setView`, `setToastMessage`, `resetScanContext`, `startBatchScanContext` (App.tsx state)
   - `batchProcessing.startProcessing` (batch processing service)
3. **Significant prop threading required:** Would need 20+ props including async callbacks with complex error handling logic

The render function `renderBatchCaptureView` exists in viewRenderers.tsx (line 278) but is NOT used by App.tsx because the inline version contains all the necessary complex callbacks that cannot be cleanly passed as props without significant refactoring of the batch processing flow.

**Future consideration:** Story 35a audit identifies P2 priority extraction targets for batch processing callbacks. If `useBatchNavigation` and `useBatchProcessing` hooks are created in a future story, BatchCaptureView could then use `renderBatchCaptureView`.

### Test Results

- **TypeScript:** ✅ Compiles without errors
- **Tests:** 6041 passed, 6 failed (pre-existing DashboardView pagination issues tracked in Story 14c-refactor-36), 62 skipped
- **No regressions introduced**

## File List

**Examined (no changes needed):**
- `src/App.tsx` - Verified render function usage for 4 views, documented inline decision for BatchCaptureView
- `src/components/App/viewRenderers.tsx` - Verified all render functions exist (lines 148, 223, 234, 245, 278)

**No code changes required** - This story was verification-focused. All render functions already exist from Story 22c, and App.tsx already uses them appropriately.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-24 | Story created via atlas-story-sizing | SM |
| 2026-01-24 | All tasks verified complete, documented BatchCaptureView inline decision | Dev (atlas-dev-story) |
| 2026-01-24 | Atlas Code Review PASSED - test counts updated (6041 passed) | Dev (atlas-code-review) |
