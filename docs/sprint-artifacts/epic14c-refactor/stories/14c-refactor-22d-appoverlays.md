# Story 14c-refactor.22d: AppOverlays Component Extraction

Status: done

## Story

As a **developer**,
I want **all overlay/modal rendering extracted to an AppOverlays component**,
So that **App.tsx is cleaner and overlay logic is centralized**.

## Background

This story was split from 14c-refactor.22a (Task 4). App.tsx contains ~656 lines of overlay and modal rendering. These overlays have specific z-index requirements and visibility conditions.

**Current State:**
- 15 overlay components rendered inline in App.tsx
- ~656 lines of overlay JSX
- Z-index management scattered throughout

**Target State:**
- Single `<AppOverlays {...props} />` component
- All overlays rendered in one place
- Z-index layering preserved
- ~300-400 line reduction in App.tsx

## Acceptance Criteria

1. **Given** App.tsx renders 15 overlay components inline
   **When** this story is completed
   **Then:**
   - AppOverlays.tsx component created
   - All 15 overlays moved to new component
   - App.tsx uses `<AppOverlays {...overlayProps} />`

2. **Given** overlays have specific z-index requirements
   **When** rendering overlays
   **Then:**
   - Z-index layering preserved (see reference table)
   - NavigationBlocker always at z-60 (highest)
   - PWAUpdatePrompt at z-60
   - Dialogs at z-50
   - Cards/banners at z-30-40

3. **Given** overlays have visibility conditions
   **When** passing props
   **Then:**
   - AppOverlaysProps interface includes all visibility flags
   - All handlers passed as props
   - Component is memoized to prevent unnecessary re-renders

4. **Given** the component is extracted
   **When** measuring App.tsx
   **Then:**
   - App.tsx reduced by ~300-400 lines
   - All overlays render at correct timing
   - No visual regressions

## Tasks / Subtasks

### Task 1: Create AppOverlaysProps Interface

- [x] 1.1 Define interface with all visibility flags:
  - `scanState` (for ScanOverlay, QuickSave, BatchComplete, Currency/Total dialogs)
  - `showCreditWarning` / `creditWarningData`
  - `showConflictDialog` / `conflictDialogData`
  - `showTrustPrompt` / `trustPromptData`
  - `showInsightCard` / `currentInsight`
  - `showBuildingProfile`
  - `personalRecord` / `showRecordBanner`
  - `showSessionComplete` / `sessionContext`
  - `showBatchSummary` / `batchSummaryData`
  - `showUpdatePrompt`
- [x] 1.2 Define all handler props
- [x] 1.3 Use proper TypeScript types (no `any`)

### Task 2: Create AppOverlays Component

- [x] 2.1 Create `src/components/App/AppOverlays.tsx`
- [x] 2.2 Import all overlay/modal components
- [x] 2.3 Implement render logic for each overlay:
  - ScanOverlay (z-50)
  - QuickSaveCard (z-40)
  - BatchCompleteModal (z-40)
  - CreditWarningDialog (z-50)
  - CurrencyMismatchDialog (z-50)
  - TotalMismatchDialog (z-50)
  - TransactionConflictDialog (z-50)
  - TrustMerchantPrompt (z-40)
  - InsightCard (z-30)
  - BuildingProfileCard (z-30)
  - PersonalRecordBanner (z-30)
  - SessionComplete (z-40)
  - BatchSummary (z-40)
  - NavigationBlocker (z-60)
  - PWAUpdatePrompt (z-60)
- [x] 2.4 Wrap component with React.memo for performance

### Task 3: Update App.tsx

- [x] 3.1 Import AppOverlays from components/App
- [x] 3.2 Prepare overlayProps object with all visibility flags and handlers
- [x] 3.3 Replace inline overlay JSX with `<AppOverlays {...overlayProps} />`
- [x] 3.4 Remove dead overlay code from App.tsx
- [x] 3.5 Verify line count reduction (~300-400 lines)

### Task 4: Export and Verify

- [x] 4.1 Export AppOverlays from `components/App/index.ts`
- [x] 4.2 Export AppOverlaysProps interface
- [x] 4.3 Run `npm run type-check` - must pass
- [x] 4.4 Run `npm test` - all tests pass (5759 tests)
- [x] 4.5 Manual smoke test:
  - [x] ScanOverlay appears during scan
  - [x] QuickSaveCard shows after scan complete
  - [x] Toast notifications work
  - [x] Conflict dialog shows on duplicate
  - [x] Insight cards appear correctly

---

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** MEDIUM - Many overlays with specific timing/visibility logic

### Dependencies

- **Requires:** Story 22a complete (hooks integrated - provides handlers)
- **Blocks:** Story 22e (final verification)
- **Can parallel with:** Story 22b, 22c (no dependencies between them)

### Z-Index Reference

| Overlay | Z-Index | Condition |
|---------|---------|-----------|
| NavigationBlocker | 60 | Always rendered (handles browser back) |
| PWAUpdatePrompt | 60 | `showUpdatePrompt` |
| ScanOverlay | 50 | `scanState.isProcessing` |
| CreditWarningDialog | 50 | `showCreditWarning` |
| CurrencyMismatchDialog | 50 | `scanState.dialogType === 'currency-mismatch'` |
| TotalMismatchDialog | 50 | `scanState.dialogType === 'total-mismatch'` |
| TransactionConflictDialog | 50 | `showConflictDialog` |
| QuickSaveCard | 40 | `scanState.dialogType === 'quick-save'` |
| BatchCompleteModal | 40 | `scanState.dialogType === 'batch-complete'` |
| TrustMerchantPrompt | 40 | `showTrustPrompt` |
| SessionComplete | 40 | `showSessionComplete` |
| BatchSummary | 40 | `showBatchSummary` |
| InsightCard | 30 | `showInsightCard && currentInsight` |
| BuildingProfileCard | 30 | `showBuildingProfile` |
| PersonalRecordBanner | 30 | `personalRecord && showRecordBanner` |

### Component Structure

```typescript
interface AppOverlaysProps {
  // Scan state (controls multiple dialogs)
  scanState: ScanState;
  scanOverlay: ScanOverlayState;

  // Dialog visibility flags
  showCreditWarning: boolean;
  showConflictDialog: boolean;
  showTrustPrompt: boolean;
  showInsightCard: boolean;
  showBuildingProfile: boolean;
  showRecordBanner: boolean;
  showSessionComplete: boolean;
  showBatchSummary: boolean;
  showUpdatePrompt: boolean;

  // Dialog data
  creditWarningData: CreditWarningData | null;
  conflictDialogData: ConflictDialogData | null;
  trustPromptData: TrustPromptData | null;
  currentInsight: Insight | null;
  personalRecord: PersonalRecord | null;
  sessionContext: SessionContext | null;
  batchSummaryData: BatchSummaryData | null;

  // Handlers (from useScanHandlers, useDialogHandlers)
  onScanOverlayCancel: () => void;
  onScanOverlayRetry: () => void;
  onQuickSave: () => Promise<void>;
  onQuickSaveEdit: () => void;
  onQuickSaveCancel: () => void;
  // ... etc
}

export const AppOverlays = React.memo(function AppOverlays(props: AppOverlaysProps) {
  return (
    <>
      {/* Z-60: Highest priority */}
      <NavigationBlocker />
      {props.showUpdatePrompt && <PWAUpdatePrompt />}

      {/* Z-50: Dialogs */}
      {props.scanState.isProcessing && <ScanOverlay {...} />}
      {props.showCreditWarning && <CreditWarningDialog {...} />}
      {/* ... etc */}
    </>
  );
});
```

---

## References

- [Source: Story 22a](14c-refactor-22a-interim-cleanup.md) - Parent story
- [Source: src/App.tsx] - Overlay JSX to extract
- [Source: src/hooks/app/useScanHandlers.ts] - Provides overlay handlers
- [Source: src/hooks/app/useDialogHandlers.ts] - Provides dialog handlers

## File List

**To Create:**
- `src/components/App/AppOverlays.tsx` - New component (~599 lines)
- `tests/unit/components/App/AppOverlays.test.tsx` - Unit tests (28 tests)

**To Modify:**
- `src/components/App/index.ts` - Export AppOverlays, AppOverlaysProps
- `src/App.tsx` - Replace inline overlays with component (~773 lines removed)

---

## Code Review Fixes (Atlas-Enhanced Review 2026-01-22)

**Issues Fixed:**
1. **M1 - Missing Unit Tests**: Added `tests/unit/components/App/AppOverlays.test.tsx` with 28 tests covering all conditional rendering logic
2. **M2 - Documentation Discrepancy**: Fixed "14 overlays" to "15 overlays" in Background and AC sections

**Issues Deferred:**
- **L1 - Z-Index Values**: Pre-existing condition in child components. Not in scope for this story (extraction only).
- **L3 - Line Count Estimate**: Actual 599 lines vs estimated 300-400 lines. Acceptable given 15 overlays vs 14 planned.

**Metrics:**
- App.tsx: 1228 deletions, 455 insertions = 773 net lines removed (exceeds ~300-400 target)
- AppOverlays.tsx: 599 lines (thorough TypeScript interface)
- Tests: 28 new tests passing

---

*Story created: 2026-01-22 via story split from 14c-refactor.22a*
