# Story 14c-refactor.21: App.tsx Handler Extraction - Navigation & Dialog

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **navigation and dialog event handlers extracted from App.tsx into custom hooks**,
So that **view switching and modal management logic is modularized, completing the handler extraction phase**.

## Background

This is the second of three stories to complete the App.tsx decomposition:

- **14c-refactor.20**: Transaction + Scan handlers (~350 lines) ✅
- **14c-refactor.21** (this story): Navigation + Dialog handlers (~200 lines)
- **14c-refactor.22**: JSX/view rendering into AppRoutes + final cleanup (~3200 lines)

## Acceptance Criteria

### Core Functionality

1. **Given** App.tsx contains navigation handlers
   **When** this story is completed
   **Then:**
   - Create `src/hooks/app/useNavigationHandlers.ts` containing:
     - `handleViewChange` - switch between app views
     - `handleNavigateToHistory` - navigate to filtered history view
     - `handleDrillDown` - analytics drill-down navigation
     - `handleFilterClear` - clear filters on navigation (preserves 14.13b logic)
   - Handlers integrate with NavigationContext from 14c-refactor.9
   - Filter clearing logic from App.tsx (lines 1031-1057) preserved

2. **Given** App.tsx contains dialog handlers
   **When** this story is completed
   **Then:**
   - Create `src/hooks/app/useDialogHandlers.ts` containing:
     - `handleOpenModal` - open various modals (credit info, conflict, etc.)
     - `handleCloseModal` - close modal with optional callback
     - `handleConfirmAction` - confirmation dialog handling
     - `handleToast` - toast notification management
   - Handlers manage modal state consistently
   - Toast notifications work across all views

3. **Given** the handlers are extracted
   **When** App.tsx uses these hooks
   **Then:**
   - App.tsx imports and uses `useNavigationHandlers` and `useDialogHandlers`
   - All navigation and dialog flows continue to work
   - Filter persistence from analytics to history works (Story 14.13b)
   - No TypeScript errors
   - Existing tests pass

### Atlas Workflow Impact Requirements

4. **Given** analytics drill-down to history (History Filter Flow #6)
   **When** user navigates via `handleNavigateToHistory`
   **Then:**
   - `pendingHistoryFilters` and `pendingDistributionView` are correctly passed
   - Filters are cleared on subsequent navigation away from related views
   - Test: Navigate from TrendsView to History with filters, then to Settings, verify filters cleared

5. **Given** QuickSave dialog is open (Quick Save Flow #2)
   **When** user navigates away via `navigateToView`
   **Then:**
   - The dialog is dismissed via `dismissScanDialog` before view change
   - No floating QuickSave dialogs over other views
   - Test: Open QuickSave, navigate to Dashboard, verify dialog dismissed

6. **Given** scroll position was saved for a view
   **When** user navigates back via `navigateBack`
   **Then:**
   - Scroll position is restored correctly from `scrollPositionsRef`
   - `mainRef` scroll position management works with extracted hook
   - Test: Scroll in History, navigate away, navigate back, verify scroll position restored

## Tasks / Subtasks

### Task 1: Analyze Navigation Handlers

- [ ] 1.1 Inventory navigation handlers in App.tsx (lines ~850-950)
- [ ] 1.2 Document filter clearing logic (lines 1031-1057)
- [ ] 1.3 Map integration with NavigationContext

### Task 2: Create useNavigationHandlers Hook

- [ ] 2.1 Create `src/hooks/app/useNavigationHandlers.ts`
- [ ] 2.2 Extract `handleViewChange` with filter clear integration
- [ ] 2.3 Extract `handleNavigateToHistory` with drillDownPath
- [ ] 2.4 Extract `handleDrillDown` for analytics navigation
- [ ] 2.5 Extract `handleFilterClear` preserving 14.13b logic
- [ ] 2.6 Add unit tests (target: 15+ tests)
- [ ] 2.7 Integrate into App.tsx

### Task 3: Analyze Dialog Handlers

- [ ] 3.1 Inventory dialog/modal handlers in App.tsx (lines ~950-1050)
- [ ] 3.2 Document modal state management
- [ ] 3.3 Map toast notification patterns

### Task 4: Create useDialogHandlers Hook

- [ ] 4.1 Create `src/hooks/app/useDialogHandlers.ts`
- [ ] 4.2 Extract `handleOpenModal` for all modal types
- [ ] 4.3 Extract `handleCloseModal` with callbacks
- [ ] 4.4 Extract `handleConfirmAction` for confirmations
- [ ] 4.5 Extract `handleToast` for notifications
- [ ] 4.6 Add unit tests (target: 15+ tests)
- [ ] 4.7 Integrate into App.tsx

### Task 5: Verification

- [ ] 5.1 Run full test suite
- [ ] 5.2 Run build
- [ ] 5.3 Manual test: Navigate between views
- [ ] 5.4 Manual test: Analytics drill-down to history
- [ ] 5.5 Manual test: Modal open/close
- [ ] 5.6 Manual test: Toast notifications

## Dev Notes

### Estimation

- **Points:** 3 pts
- **Risk:** MEDIUM - Navigation state management

### Dependencies

- **Requires:** Story 14c-refactor.20 complete (transaction/scan handlers)
- **Blocks:** 14c-refactor.22 (final cleanup)

### Handler Inventory

| Handler | Approx Lines | Key Dependencies |
|---------|-------------|------------------|
| handleViewChange | ~40 | NavigationContext, filter clearing |
| handleNavigateToHistory | ~30 | HistoryFiltersContext, drillDownPath |
| handleDrillDown | ~25 | AnalyticsContext |
| handleFilterClear | ~30 | HistoryFiltersContext |
| handleOpenModal | ~30 | Modal state |
| handleCloseModal | ~20 | Modal state, callbacks |
| handleConfirmAction | ~25 | Confirmation state |
| handleToast | ~20 | Toast state |

### Filter Clearing Logic (from App.tsx lines 1031-1057)

```typescript
// When navigating away from history, clear filters
// When navigating from analytics with drillDownPath, preserve filters
// This logic MUST be preserved in useNavigationHandlers
```

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **History Filter Flow (#6)** | `navigateToView` and filter clearing logic directly controls how users navigate from analytics to filtered history. Extracting handlers must preserve the 14.13b filter persistence logic. |
| **Analytics Navigation Flow (#4)** | `analyticsInitialState`, `pendingDistributionView`, and navigation handlers enable drill-down from TrendsView to filtered History/Items. Handler extraction must maintain state passing. |
| **Scan Receipt Flow (#1)** | Navigation handlers interact with ScanContext dialog dismissal (`dismissScanDialog`) when navigating away from scan views. |
| **Quick Save Flow (#2)** | `navigateToView` dismisses QuickSave dialog when navigating to non-editor views - this timing is critical for UX. |

### Downstream Effects to Consider

1. **Filter persistence**: `pendingHistoryFilters` state and clearing logic in `useEffect` must be coordinated with navigation handlers - if extracted incorrectly, filters may clear unexpectedly or persist when they shouldn't
2. **Scroll position management**: `navigateToView` and `navigateBack` manage scroll positions via refs - these must be passed correctly to the extracted hook
3. **ScanContext dialog integration**: Navigation dismisses QuickSave dialogs - the hook must receive `dismissScanDialog` action from ScanContext
4. **Analytics state initialization**: `setAnalyticsInitialState` for "This Month" card navigation must be accessible in the extracted hook

### Testing Implications

- **Existing tests to verify:** Filter persistence tests, navigation tests
- **New scenarios to add:**
  - Test `navigateToView` clears filters when navigating from unrelated views
  - Test `navigateToView` preserves filters when navigating from related views (history/items/transaction-editor/trends/dashboard)
  - Test `navigateBack` restores scroll position
  - Test QuickSave dialog dismissal on navigation

### Workflow Chain Visualization

```
[User Action: Navigate]
        ↓
[useNavigationHandlers] → navigateToView()
        ↓
[Save Scroll Position] → scrollPositionsRef[currentView]
        ↓
[Check Filter Clearing] ─── From related view? → Preserve pendingHistoryFilters
        │
       No (from unrelated view)
        ↓
[Clear Filters] → setPendingHistoryFilters(null)
        ↓
[Check QuickSave Dialog] ─── Dialog open? → dismissScanDialog()
        ↓
[Set View] → setView(targetView)
        ↓
[Reset Scroll] → mainRef.scrollTo(0, 0)
```

## References

- [Source: Story 14c-refactor.20](14c-refactor-20-app-handler-extraction.md) - Transaction/Scan handlers (prerequisite)
- [Source: Story 14.13b] - Filter persistence requirements
- [Source: src/App.tsx:1065-1117] - `navigateToView` and `navigateBack` implementations
- [Source: src/App.tsx:1028-1054] - Filter clearing useEffect logic
- [Source: src/contexts/NavigationContext.tsx] - Navigation state (14c-refactor.9)
- [Source: Atlas 08-workflow-chains.md] - History Filter Flow #6, Analytics Navigation Flow #4

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

## File List

**To Create:**
- `src/hooks/app/useNavigationHandlers.ts`
- `src/hooks/app/useDialogHandlers.ts`
- `tests/unit/hooks/app/useNavigationHandlers.test.ts`
- `tests/unit/hooks/app/useDialogHandlers.test.ts`

**To Modify:**
- `src/App.tsx` - Import and use new hooks
- `src/hooks/app/index.ts` - Add new exports
