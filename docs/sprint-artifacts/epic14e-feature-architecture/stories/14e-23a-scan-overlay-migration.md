# Story 14e.23a: Migrate Scan Overlays to ScanFeature

Status: done

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Created:** 2026-01-27
**Author:** Atlas Dev-Story Workflow
**Blocks:** 14e-23 (App.tsx Final Cleanup)

---

## Story

As a **developer**,
I want **scan-related overlays migrated from AppOverlays to ScanFeature**,
So that **ScanFeature fully owns scan flow UI and AppOverlays can be simplified**.

---

## Context

### Background

Story 14e-11 (ScanContext Migration Cleanup) intentionally deferred overlay migration to avoid breaking existing functionality. Comments in ScanFeature.tsx state:

> "ScanOverlay in AppOverlays already handles processing state as a fixed overlay. Return null to avoid duplicate UI."

This story completes the deferred work by migrating scan-specific overlays to ScanFeature.

### Current State

**AppOverlays handles these scan-related overlays:**
- ScanOverlay (~50 lines) - Processing progress/error display
- QuickSaveCard (~60 lines) - Trusted merchant quick save
- BatchCompleteModal (~50 lines) - Batch completion celebration
- CurrencyMismatchDialog (~30 lines) - Currency detection mismatch
- TotalMismatchDialog (~30 lines) - OCR total vs items mismatch

**ScanFeature returns null for:**
- `phase='scanning'` - Handled by ScanOverlay
- `phase='saving'` - Handled by QuickSaveCard
- `phase='error'` - Handled by ScanOverlay

### Target State

ScanFeature renders all scan-related overlays based on Zustand store state. AppOverlays no longer renders scan overlays.

---

## Acceptance Criteria

### AC1: ScanFeature Renders Processing UI

**Given** ScanFeature phase is 'scanning'
**When** the component renders
**Then:**
- [x] ScanOverlay is rendered by ScanFeature (not AppOverlays)
- [x] Progress, ETA, and error display work correctly
- [x] Cancel and retry callbacks are wired

### AC2: ScanFeature Renders QuickSaveCard

**Given** scan state has activeDialog type 'QUICK_SAVE'
**When** the dialog is triggered
**Then:**
- [x] QuickSaveCard is rendered by ScanFeature
- [x] Save, Edit, Cancel callbacks work
- [x] Currency formatting is correct

### AC3: ScanFeature Renders BatchCompleteModal

**Given** scan state has activeDialog type 'BATCH_COMPLETE'
**When** batch processing completes
**Then:**
- [x] BatchCompleteModal is rendered by ScanFeature
- [x] Transaction summary displays correctly
- [x] Navigation to history works

### AC4: ScanFeature Renders Mismatch Dialogs

**Given** scan state has activeDialog type 'CURRENCY_MISMATCH' or 'TOTAL_MISMATCH'
**When** the dialog is triggered
**Then:**
- [x] CurrencyMismatchDialog renders for currency issues
- [x] TotalMismatchDialog renders for total/items discrepancy
- [x] All callbacks are properly wired

### AC5: AppOverlays Simplified

**Given** scan overlays moved to ScanFeature
**When** reviewing AppOverlays
**Then:**
- [x] ScanOverlay import removed from AppOverlays
- [x] QuickSaveCard import removed from AppOverlays
- [x] BatchCompleteModal rendering removed from AppOverlays
- [x] CurrencyMismatchDialog rendering removed from AppOverlays
- [x] TotalMismatchDialog rendering removed from AppOverlays
- [x] All scan-related props removed from AppOverlaysProps interface

### AC6: Tests Pass

**Given** the migration is complete
**When** running test suite
**Then:**
- [x] All existing tests pass (5911 tests)
- [x] ScanFeature tests cover new overlay rendering (24 new tests added for ScanOverlay, QuickSaveCard, BatchCompleteModal, CurrencyMismatchDialog, TotalMismatchDialog)
- [ ] No regressions in scan flow E2E (pending manual smoke test)

---

## Tasks

### Task 1: Add Overlay Props to ScanFeatureProps

**Files:** `src/features/scan/ScanFeature.tsx`

1.1. Add overlay-specific props to ScanFeatureProps interface:
   - ScanOverlay props (scanOverlay state, onCancel, onRetry, onDismiss)
   - QuickSaveCard props (onSave, onEdit, onCancel, currency, formatCurrency, etc.)
   - BatchCompleteModal props (onDismiss, onNavigateToHistory, onGoHome)
   - CurrencyMismatchDialog props (userCurrency, onUseDetected, onUseDefault, onCancel)
   - TotalMismatchDialog props (onUseItemsSum, onKeepOriginal, onCancel)

### Task 2: Update ScanFeature Phase Rendering

**Files:** `src/features/scan/ScanFeature.tsx`

2.1. Import overlay components from `@components/scan`
2.2. Update `phase='scanning'` to render ScanOverlay
2.3. Update `phase='error'` to render ScanOverlay error state
2.4. Add dialog rendering based on scanState.activeDialog.type:
   - QUICK_SAVE → QuickSaveCard
   - BATCH_COMPLETE → BatchCompleteModal
   - CURRENCY_MISMATCH → CurrencyMismatchDialog
   - TOTAL_MISMATCH → TotalMismatchDialog

### Task 3: Update FeatureOrchestrator

**Files:** `src/app/FeatureOrchestrator.tsx`

3.1. Expand scanFeatureProps type to include overlay props
3.2. Verify props are passed through correctly

### Task 4: Update App.tsx to Pass Overlay Props

**Files:** `src/App.tsx`

4.1. Add overlay props to FeatureOrchestrator scanFeatureProps
4.2. Move handler definitions from AppOverlays call to scanFeatureProps

### Task 5: Remove Scan Overlays from AppOverlays

**Files:** `src/components/App/AppOverlays.tsx`

5.1. Remove ScanOverlay import and rendering
5.2. Remove QuickSaveCard import and rendering
5.3. Remove BatchCompleteModal rendering
5.4. Remove CurrencyMismatchDialog import and rendering
5.5. Remove TotalMismatchDialog import and rendering
5.6. Remove corresponding props from AppOverlaysProps interface
5.7. Remove corresponding props destructuring

### Task 6: Verification

6.1. Run unit tests: `npm run test:unit -- --run`
6.2. Run smoke tests for scan flow
6.3. Verify no console errors during scan flow
6.4. Document line count changes

### Review Follow-ups (Archie - 2026-01-27)

- [x] [Archie-Review][HIGH] Add ScanFeature tests for overlay rendering - ScanOverlay visibility when phase is 'scanning' or 'error' [tests/unit/features/scan/ScanFeature.test.tsx]
- [x] [Archie-Review][HIGH] Add ScanFeature tests for QuickSaveCard rendering when dialog handlers provided [tests/unit/features/scan/ScanFeature.test.tsx]
- [x] [Archie-Review][HIGH] Add ScanFeature tests for BatchCompleteModal rendering when activeDialog.type === BATCH_COMPLETE [tests/unit/features/scan/ScanFeature.test.tsx]
- [x] [Archie-Review][HIGH] Add ScanFeature tests for mismatch dialog rendering [tests/unit/features/scan/ScanFeature.test.tsx]
- [x] [Archie-Review][MEDIUM] Update test comments from "ScanOverlay in AppOverlays handles processing state" to reflect 14e-23a migration [tests/unit/features/scan/ScanFeature.test.tsx:9,222-314]
- [x] [Archie-Review][LOW] Add useScanStore mock for activeDialog in ScanFeature tests [tests/unit/features/scan/ScanFeature.test.tsx:29-33]

### Review Follow-ups (AI Code Review - 2026-01-27)

**Git Staging Issues (CRITICAL - must fix before commit):**
- [x] [AI-Review][CRITICAL] Stage ScanFeature.tsx - implementation changes are unstaged (`git add src/features/scan/ScanFeature.tsx`)
- [x] [AI-Review][CRITICAL] Stage index.ts - barrel export changes are unstaged (`git add src/features/scan/index.ts`)
- [x] [AI-Review][CRITICAL] Stage story file - story document is untracked (`git add docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-23a-scan-overlay-migration.md`)
- [x] [AI-Review][MEDIUM] Verify AppOverlays.tsx staging - has both staged and unstaged changes, run `git add src/components/App/AppOverlays.tsx`

**Documentation:**
- [x] [AI-Review][HIGH] Add Dev Agent Record section with File List to story before marking complete

---

## Technical Notes

### Overlay Visibility Logic

**IMPORTANT (Archie Review 2026-01-27):** ScanFeature uses **phase-based visibility**, NOT view-based visibility.

The old `currentView` check in AppOverlays is NOT migrated to ScanFeature. Per story 14e-23b architecture:
- `currentView` is removed from AppOverlays entirely
- Only NavigationBlocker (moved to App.tsx) needs `currentView`
- ScanFeature determines visibility from Zustand store phase

**ScanFeature visibility logic:**

```typescript
// Phase-based visibility (NOT view-based)
switch (phase) {
  case 'scanning':
    // Show ScanOverlay - always visible during scanning phase
    return <ScanOverlay visible={true} ... />;

  case 'error':
    // Show ScanOverlay error state
    return <ScanOverlay visible={true} state="error" ... />;

  // ... other phases
}

// Dialog visibility from Zustand activeDialog
const activeDialog = useScanStore(state => state.activeDialog);

// QuickSaveCard
if (activeDialog?.type === DIALOG_TYPES.QUICK_SAVE) {
  return <QuickSaveCard ... />;
}

// BatchCompleteModal
if (activeDialog?.type === DIALOG_TYPES.BATCH_COMPLETE) {
  const batchCompleteData = activeDialog.data as BatchCompleteDialogData;
  return <BatchCompleteModal transactions={batchCompleteData.transactions} ... />;
}
```

**Rationale:** ScanFeature owns scan state via Zustand. It should not depend on App-level routing state. The scan overlay is modal (z-50) - it floats above all views regardless of which view is "underneath".

### Props Migration

Props currently passed to AppOverlays that will move to ScanFeature:

- `scanOverlay` - ScanOverlayStateHook
- `isAnalyzing` - boolean
- `scanImages` - string[]
- `onScanOverlayCancel/Retry/Dismiss` - handlers
- `onQuickSave/Edit/Cancel/Complete` - handlers
- `isQuickSaving` - boolean
- `currency`, `formatCurrency` - formatting
- `userCurrency` - SupportedCurrency
- `onCurrencyUseDetected/UseDefault/Cancel` - handlers
- `onTotalUseItemsSum/KeepOriginal/Cancel` - handlers
- `userCreditsRemaining` - number
- `onBatchCompleteDismiss/NavigateToHistory/GoHome` - handlers

---

## Definition of Done

- [x] All acceptance criteria verified
- [x] Unit tests pass (5911 tests passing including 24 new overlay tests)
- [x] No TypeScript errors
- [x] Smoke test: single scan flow works
- [x] Smoke test: batch scan flow works
- [x] Smoke test: quick save card appears for trusted merchants
- [x] Code review approved

---

## Dev Agent Record

### File List

**Modified:**
- `src/features/scan/ScanFeature.tsx` - Added overlay rendering (ScanOverlay, QuickSaveCard, BatchCompleteModal, CurrencyMismatchDialog, TotalMismatchDialog); **Fix:** Added `currentView` prop and view-based visibility to match batch mode navigation behavior
- `src/features/scan/index.ts` - Updated barrel exports for ActiveGroupInfo type
- `src/components/App/AppOverlays.tsx` - Removed scan overlay imports, props, and rendering
- `tests/unit/components/App/AppOverlays.test.tsx` - Removed scan overlay mocks and tests
- `tests/unit/features/scan/ScanFeature.test.tsx` - Added 24 overlay rendering tests (Story 14e-23a), updated comments, added useScanStore mock for activeDialog
- `src/App.tsx` - **Fix:** Added `currentView: view` prop to scanFeatureProps for view-based overlay visibility

**Not Modified (verified no changes needed):**
- `src/app/FeatureOrchestrator.tsx` - Already passes scanFeatureProps through (spreads all props to ScanFeature)

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-27 | Dev Agent | Initial implementation of overlay migration |
| 2026-01-27 | AI Code Review | Added Review Follow-ups for git staging issues |
| 2026-01-27 | Dev Agent | Completed all review follow-ups: staged files, added 24 overlay rendering tests, updated test comments |
| 2026-01-27 | Dev Agent | Fixed single scan navigation blocking issue - added view-based visibility to match batch mode behavior |
| 2026-01-27 | Atlas Code Review | Code review APPROVED - staged remaining unstaged files (AppOverlays.test.tsx, FeatureOrchestrator.tsx) |
| 2026-01-27 | Gabe | Manual smoke tests PASSED - overlay working correctly |

---

## Architectural Review Notes (Archie - 2026-01-27)

**Review Status:** ✅ APPROVED (GO)

### FSD Layer Compliance
✅ Moving scan-specific overlays from `components/App/AppOverlays` to `features/scan/ScanFeature` is the correct FSD pattern. Features should own their UI.

### Key Architectural Decisions

**1. Phase + View-Based Visibility (UPDATED 2026-01-27)**
- **Original Design:** Phase-based only (no view awareness)
- **Updated Design:** Phase + view-based visibility for single scan mode
- **Reason:** User testing revealed single scan overlay blocked ALL views during navigation, unlike batch mode which correctly shows BatchProcessingOverlay only on scan-related views
- **Solution:** Added `currentView` prop to ScanFeature with view-based check:
  - Single scan overlay only visible on: 'scan', 'scan-result', 'transaction-editor'
  - This matches batch mode's `BatchProcessingOverlay` which has: `visible={batchProcessing.isProcessing && (view === 'batch-capture' || view === 'batch-review')}`
- **Key insight:** `scanOverlay.state !== 'idle'` check ensures batch mode never shows ScanOverlay (uses BatchProcessingOverlay instead)

**2. Props Consideration**
- Story adds ~25 props to ScanFeatureProps (handlers for all overlays)
- This is acceptable for incremental migration but consider future optimization:
  - Dialogs could read visibility directly from Zustand `activeDialog`
  - Handlers could be defined in ScanFeature or a handlers module
  - This would reduce prop-drilling through FeatureOrchestrator

**3. Dual State Sources (Documented Tech Debt)**
- Overlays read from both Zustand store (`phase`, `activeDialog`) and `useScanOverlayState` hook (`progress`, `eta`, `error`)
- This is acceptable for incremental migration
- Future story should unify into single Zustand scan store

### Blocking Dependencies
- None - story can proceed

### Depends On
- Story 14e-10 (ScanFeature exists) ✅ Complete
- Story 14e-6 (Zustand scan store) ✅ Complete

### Blocks
- Story 14e-23b (AppOverlays Simplification) - depends on this completing first
- Story 14e-23 (App.tsx Final Cleanup)

---

## Post-Dev Feature Review (Archie - 2026-01-27)

**Review Status:** ⚠️ APPROVED WITH NOTES

### Pattern Compliance
- ✅ **FSD Layer Rules**: Moving scan overlays from `components/App/AppOverlays` to `features/scan/ScanFeature` follows correct FSD pattern
- ✅ **State Management**: Correctly reads `activeDialog` from Zustand store for dialog visibility
- ✅ **Phase-based Visibility**: ScanFeature determines overlay visibility from Zustand phase, not `currentView`
- ✅ **Code Organization**: Good JSDoc, story references, clear separation via `renderOverlays()`
- ✅ **Props Chain**: App.tsx → FeatureOrchestrator → ScanFeature works correctly

### Findings
| Severity | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | Tests missing overlay rendering coverage | ScanFeature.test.tsx |
| 🟡 MEDIUM | Test comments outdated (still reference AppOverlays) | ScanFeature.test.tsx:9,222-314 |
| 🟢 LOW | useScanStore mock not set up for activeDialog | ScanFeature.test.tsx:29-33 |

### Verdict
Implementation is correct and follows all FSD/state management patterns. Test coverage doesn't validate new overlay functionality but existing tests pass. Action items added to Tasks section for follow-up.
