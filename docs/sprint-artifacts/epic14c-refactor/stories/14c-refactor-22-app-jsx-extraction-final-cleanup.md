# Story 14c-refactor.22: App.tsx JSX Extraction & Final Cleanup

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **App.tsx JSX/view rendering moved into AppRoutes and final cleanup completed**,
So that **App.tsx becomes a ~200-300 line composition root, achieving the original architecture goal from Story 14c-refactor.11**.

## Background

This is the final story of three to complete the App.tsx decomposition:

- **14c-refactor.20**: Transaction + Scan handlers (~350 lines) ✅
- **14c-refactor.21**: Navigation + Dialog handlers (~200 lines) ✅
- **14c-refactor.22** (this story): JSX/view rendering into AppRoutes + final cleanup (~3200 lines)

After this story, App.tsx will be a simple composition root that:
1. Imports and composes hooks
2. Passes handlers to AppRoutes via render props or context
3. Renders AppLayout with AppRoutes inside

### Current State (2026-01-21)

- **App.tsx**: 5,079 lines (target: ~200-300 lines)
- **AppRoutes**: Currently a thin wrapper with render prop pattern
- **AppProviders**: Created but NOT integrated
- **Handler hooks**: 14c-refactor.20 and 14c-refactor.21 must be completed first

## Acceptance Criteria

### Core Functionality

1. **Given** App.tsx contains ~3200 lines of JSX view rendering
   **When** this story is completed
   **Then:**
   - Move view switch/case logic from App.tsx return into `AppRoutes`
   - AppRoutes receives handlers via render props or dedicated context
   - Each view receives only the props it needs (no massive prop drilling)
   - Create view-specific wrapper components if needed for complex props

2. **Given** AppProviders was created but not integrated
   **When** this story is completed
   **Then:**
   - Integrate AppProviders in App.tsx or main.tsx (coordinate placement)
   - Remove duplicate provider setup from App.tsx
   - Verify provider order matches Atlas workflow requirements

3. **Given** all handlers and JSX are extracted
   **When** measuring App.tsx
   **Then:**
   - App.tsx is ~200-300 lines total
   - App.tsx contains only:
     - Hook imports and calls (~50 lines)
     - Handler hook usage (~20 lines)
     - AppLayout + AppRoutes composition (~30 lines)
     - Overlay/modal rendering (~50 lines)
   - All existing functionality preserved
   - All tests pass
   - Build succeeds

4. **Given** the refactor is complete
   **When** verifying workflow chains
   **Then:**
   - Auth → Scan → Save Critical Path works
   - Scan Receipt Flow (#1) works
   - Analytics Navigation Flow (#4) works
   - History Filter Flow (#6) works
   - Deep Link Flow works

### Atlas Workflow Impact Requirements

5. **Given** AnalyticsProvider and HistoryFiltersProvider are view-scoped
   **When** extracting JSX to AppRoutes
   **Then:**
   - AnalyticsProvider remains wrapping ONLY TrendsView (NOT moved to AppProviders)
   - HistoryFiltersProvider remains wrapping ONLY HistoryView/ItemsView
   - This preserves performance (prevents unnecessary re-renders)
   - Test: Verify providers are not in AppProviders.tsx

6. **Given** overlays/modals are rendered at App.tsx level
   **When** extracting view JSX
   **Then:**
   - All overlays continue to render at correct z-index
   - QuickSaveCard timing remains correct during scan flow
   - ScanOverlay, CreditWarningDialog, TransactionConflictDialog, BatchCompleteModal render correctly
   - Test: Complete scan flow, verify QuickSaveCard appears at correct time

7. **Given** scroll position is managed via refs
   **When** extracting JSX
   **Then:**
   - `mainRef` forwarding works for scroll position restoration
   - `scrollPositionsRef` preserves per-view scroll positions
   - Test: Scroll in History, navigate to Dashboard, navigate back, verify position restored

8. **Given** provider order is critical for context access
   **When** integrating AppProviders
   **Then:**
   - Provider order preserved: `QueryClientProvider → AuthProvider → ViewModeProvider → ScanProvider` (main.tsx)
   - Provider order preserved: `ThemeProvider → NavigationProvider → AppStateProvider → NotificationProvider` (AppProviders)
   - AuthProvider must wrap ScanProvider for `user.uid` access in scan handlers
   - Test: Verify ScanContext can access user.uid

## Tasks / Subtasks

### Task 1: Analyze Current JSX Structure (AC: #1, #5)

- [ ] 1.1 Inventory current switch/case in App.tsx return (lines ~2800-5076)
- [ ] 1.2 Document view-specific prop requirements for each view
- [ ] 1.3 Identify which providers are view-scoped vs app-scoped
- [ ] 1.4 Document overlay/modal rendering locations and z-index requirements
- [ ] 1.5 Map ref usage (mainRef, scrollPositionsRef) through view rendering

### Task 2: Design Handler Passing Strategy (AC: #1, #6)

- [ ] 2.1 Evaluate Option A (render props) vs Option B (ViewHandlersContext)
- [ ] 2.2 Document decision rationale
- [ ] 2.3 If Option B: Create `src/contexts/ViewHandlersContext.tsx`
- [ ] 2.4 If Option B: Add type definitions for handler bundles
- [ ] 2.5 If Option B: Add unit tests for ViewHandlersContext

### Task 3: Create View Wrapper Components (AC: #1, #5)

- [ ] 3.1 Identify views with complex prop requirements:
  - TransactionEditorView (scan state, handlers, mode)
  - TrendsView (analytics state, navigation, drill-down)
  - HistoryView/ItemsView (filters, pagination, navigation)
  - BatchCaptureView/BatchReviewView (batch state, handlers)
- [ ] 3.2 Create wrapper components OR document why not needed
- [ ] 3.3 Ensure wrappers preserve view-scoped providers (AnalyticsProvider, HistoryFiltersProvider)
- [ ] 3.4 Add unit tests for wrapper components

### Task 4: Refactor AppRoutes for View Rendering (AC: #1, #4)

- [ ] 4.1 Update AppRoutes to handle full view switch/case
- [ ] 4.2 Pass handlers via chosen strategy (render props or context)
- [ ] 4.3 Preserve view-scoped provider wrapping pattern
- [ ] 4.4 Ensure mainRef forwarding for scroll position
- [ ] 4.5 Add integration tests for AppRoutes view rendering

### Task 5: Create AppOverlays Component (AC: #6)

- [ ] 5.1 Inventory all overlays/modals in App.tsx return:
  - ScanOverlay
  - QuickSaveCard
  - CreditWarningDialog
  - TransactionConflictDialog
  - BatchCompleteModal
  - CurrencyMismatchDialog
  - TotalMismatchDialog
  - TrustMerchantPrompt
  - JoinGroupDialog
  - InsightCard / BuildingProfileCard
  - PersonalRecordBanner
  - SessionComplete
  - BatchSummary
  - NavigationBlocker
  - PWAUpdatePrompt
- [ ] 5.2 Decide: Keep in App.tsx OR extract to AppOverlays component
- [ ] 5.3 If extracted: Create `src/components/App/AppOverlays.tsx`
- [ ] 5.4 Ensure z-index and timing preserved
- [ ] 5.5 Add unit tests for overlay rendering conditions

### Task 6: Integrate AppProviders (AC: #2, #8)

- [ ] 6.1 Decide placement: App.tsx (recommended) vs main.tsx
- [ ] 6.2 Integrate AppProviders with correct provider order
- [ ] 6.3 Remove duplicate provider setup from App.tsx
- [ ] 6.4 Verify provider order: AuthProvider wraps ScanProvider
- [ ] 6.5 Add integration test for provider access chain

### Task 7: Final App.tsx Cleanup (AC: #3)

- [ ] 7.1 Move view switch/case to AppRoutes
- [ ] 7.2 Refactor return statement to use AppLayout + AppRoutes
- [ ] 7.3 Keep only overlay/modal rendering in App.tsx (or use AppOverlays)
- [ ] 7.4 Remove all extracted code (no dead code)
- [ ] 7.5 Verify line count is ~200-300 lines
- [ ] 7.6 Run `wc -l src/App.tsx` to confirm

### Task 8: Comprehensive Verification (AC: #3, #4, #5, #6, #7, #8)

- [ ] 8.1 Run full test suite: `npm test`
- [ ] 8.2 Run build: `npm run build`
- [ ] 8.3 Run TypeScript compiler: `npm run typecheck`
- [ ] 8.4 Count App.tsx lines (must be ~200-300)
- [ ] 8.5 Manual smoke test checklist:
  - [ ] App loads without errors
  - [ ] Login/logout works
  - [ ] Navigation between all 15 views works
  - [ ] Scan receipt flow works (single mode)
  - [ ] Batch scan flow works (batch mode)
  - [ ] Quick save flow works (high confidence receipt)
  - [ ] Transaction save/edit/delete works
  - [ ] Analytics drill-down to filtered History works
  - [ ] Filter persistence works (navigate History→Dashboard→History)
  - [ ] Scroll position restoration works
  - [ ] Deep link `/join/abc123` shows "Coming soon" tooltip
  - [ ] Error boundary shows recovery UI
  - [ ] Theme switching works (Normal/Professional/Mono)
  - [ ] PWA viewport and safe areas correct
  - [ ] All overlays render at correct z-index

## Dev Notes

### Estimation

- **Points:** 5 pts
- **Risk:** HIGH - Large JSX refactor, many view integrations, complex state dependencies

### Dependencies

- **Requires:** Stories 14c-refactor.20, 14c-refactor.21 MUST be complete (all handlers extracted)
- **Blocks:** None (this completes the App.tsx decomposition)

### Handler Passing Strategy Analysis

**Option A: Render Props (Current AppRoutes Pattern)**
```tsx
<AppRoutes
  view={view}
  renderView={(view) => {
    switch(view) {
      case 'dashboard': return <DashboardView {...dashboardProps} />;
      // ...
    }
  }}
/>
```
- **Pros:** Simple, explicit, easy to test
- **Cons:** All props still defined in App.tsx, less reduction

**Option B: ViewHandlersContext**
```tsx
<ViewHandlersContext.Provider value={{ transaction, scan, navigation, dialog }}>
  <AppRoutes view={view} />
</ViewHandlersContext.Provider>
```
- **Pros:** Clean separation, views consume what they need
- **Cons:** Adds indirection, harder to trace data flow

**Recommendation:** Option A (render props) for this story. Option B can be a follow-up optimization if needed. The render prop pattern is already established and allows gradual migration.

### View-Scoped Provider Pattern (CRITICAL)

```tsx
// ❌ WRONG: Moving view-scoped providers to AppProviders causes re-renders
<AppProviders>
  <AnalyticsProvider> {/* BAD: Every state change re-renders ALL views */}
    <HistoryFiltersProvider>
      <AppRoutes />
    </HistoryFiltersProvider>
  </AnalyticsProvider>
</AppProviders>

// ✅ CORRECT: Keep view-scoped providers wrapping only their views
<AppRoutes
  view={view}
  renderView={(view) => {
    switch(view) {
      case 'trends':
        return (
          <AnalyticsProvider {...}>
            <TrendsView {...} />
          </AnalyticsProvider>
        );
      case 'history':
        return (
          <HistoryFiltersProvider>
            <HistoryView {...} />
          </HistoryFiltersProvider>
        );
    }
  }}
/>
```

### App.tsx Target Structure (~200-300 lines)

```tsx
function App() {
  // === Hook calls (~50 lines) ===
  const { user, services } = useAuth();
  const transactions = useTransactions(user, services);
  const { theme, colorTheme, fontFamily } = useUserPreferences(...);
  const scanState = useScan();
  // ... other data hooks

  // === Handler hooks (~20 lines) ===
  const transactionHandlers = useTransactionHandlers({ user, services, ... });
  const scanHandlers = useScanHandlers({ user, services, scanState, ... });
  const navigationHandlers = useNavigationHandlers({ ... });
  const dialogHandlers = useDialogHandlers({ ... });

  // === Early returns (~20 lines) ===
  if (!user) return <LoginScreen />;

  // === Main render (~100 lines) ===
  return (
    <AppProviders
      fontFamily={fontFamily}
      db={services?.db}
      userId={user?.uid}
      appId={services?.appId}
    >
      <AppLayout theme={theme} colorTheme={colorTheme}>
        {shouldShowTopHeader(view) && <TopHeader {...topHeaderProps} />}
        <AppMainContent isFullScreenView={isFullScreenView(view)} mainRef={mainRef}>
          <AppRoutes
            view={view}
            renderView={(v) => renderViewSwitch(v, { transactionHandlers, scanHandlers, ... })}
          />
        </AppMainContent>
        <Nav {...navProps} />
      </AppLayout>

      {/* Overlays/modals (~50 lines) */}
      <ScanOverlay {...scanOverlayProps} />
      <QuickSaveCard {...quickSaveProps} />
      <CreditWarningDialog {...creditWarningProps} />
      {/* ... other overlays */}
    </AppProviders>
  );
}

// Helper function outside component (~100-150 lines)
function renderViewSwitch(view: View, handlers: ViewHandlers): ReactNode {
  switch (view) {
    case 'dashboard': return <DashboardView {...} />;
    case 'trends': return <AnalyticsProvider><TrendsView {...} /></AnalyticsProvider>;
    // ... other views
  }
}
```

### Overlay Z-Index Reference

| Overlay | Z-Index | Condition |
|---------|---------|-----------|
| ScanOverlay | 50 | `scanState.isProcessing` |
| QuickSaveCard | 40 | `showQuickSave && quickSaveData` |
| BatchCompleteModal | 40 | `scanState.dialogType === 'batch-complete'` |
| CreditWarningDialog | 50 | `showCreditWarning` |
| TransactionConflictDialog | 50 | `showConflictDialog` |
| InsightCard | 30 | `showInsight && currentInsight` |
| NavigationBlocker | 60 | Always (handles browser back) |
| PWAUpdatePrompt | 60 | `showUpdatePrompt` |

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **Auth → Scan → Save Critical Path (#1)** | The entire App.tsx return statement contains view rendering that coordinates auth state with view visibility. Moving JSX to AppRoutes must preserve conditional rendering that shows `LoginScreen` when user is null. Provider order (`AuthProvider` → `ScanProvider`) must be maintained. |
| **Scan Receipt Flow (#1)** | All scan-related views (`scan-result`, `transaction-editor`, `batch-capture`, `batch-review`) receive props from App.tsx. The switch/case at lines ~2800-5000 passes complex prop objects. These must be passed via render props or context to maintain scan state machine integration. |
| **Quick Save Flow (#2)** | `QuickSaveCard`, `TrustMerchantPrompt`, and related overlays are rendered conditionally. Dialog state (`showQuickSave`, `quickSaveData`) and handlers must be accessible for correct rendering timing. |
| **Analytics Navigation Flow (#4)** | `TrendsView` receives `analyticsInitialState`, `pendingDistributionView`, and callbacks. `AnalyticsProvider` is view-scoped (NOT app-scoped). JSX extraction must NOT move it to AppProviders. |
| **History Filter Flow (#6)** | `HistoryView` and `ItemsView` share `HistoryFiltersProvider`. This provider is view-scoped. JSX extraction must preserve the pattern where filters are scoped to these views only. |
| **Batch Processing Flow (#3)** | `BatchCaptureView` and `BatchReviewView` receive batch state from App.tsx. The `batchProcessing` hook results and `scanState.batchReceipts` must be accessible. |

### Downstream Effects to Consider

1. **Provider Order Critical**: AppProviders integration must preserve:
   - main.tsx: `QueryClientProvider → AuthProvider → ViewModeProvider → ScanProvider`
   - App.tsx: `ThemeProvider → NavigationProvider → AppStateProvider → NotificationProvider`

2. **View-Scoped Providers**: `AnalyticsProvider` and `HistoryFiltersProvider` are intentionally view-scoped to prevent unnecessary re-renders. Moving to AppProviders would cause performance regression.

3. **Overlay/Modal Rendering**: Many overlays depend on view state. Consider keeping in App.tsx or creating `AppOverlays` component.

4. **Ref Management**: `mainRef` and `scrollPositionsRef` must be accessible in extracted JSX.

### Testing Implications

- **Existing tests to verify:** `tests/unit/components/App/*.test.tsx` (106 existing tests)
- **New scenarios to add:**
  - Integration test: Full app render with all providers
  - Handler accessibility test: Verify handlers available in AppRoutes
  - Provider order test: Verify context access in nested views
  - Scroll position test: Verify mainRef forwarding works
  - Overlay timing test: Verify QuickSaveCard appears at correct time in scan flow

### Workflow Chain Visualization

```
[User Action: Navigate/Scan/Save]
        ↓
[App.tsx: Hook calls + Handler hooks]
        ↓
[AppProviders: Theme, Navigation, AppState, Notification]
        ↓
[AppLayout: Theme classes, structure]
        ↓
[AppRoutes: View switch/case]
        │
        ├── dashboard → DashboardView
        ├── trends → AnalyticsProvider → TrendsView
        ├── history → HistoryFiltersProvider → HistoryView
        ├── transaction-editor → TransactionEditorView
        ├── batch-capture → BatchCaptureView
        ├── batch-review → BatchReviewView
        └── ... (15 total views)
        ↓
[Overlays: ScanOverlay, QuickSaveCard, Dialogs]
        ↓
[Nav: Bottom navigation]
```

## References

- [Source: Story 14c-refactor.11](14c-refactor-11-app-decomposition-components.md) - Component architecture
- [Source: Story 14c-refactor.20](14c-refactor-20-app-handler-extraction.md) - Transaction/Scan handlers
- [Source: Story 14c-refactor.21](14c-refactor-21-app-navigation-dialog-handlers.md) - Navigation/Dialog handlers
- [Source: src/App.tsx:2800-5079] - JSX to extract (5,079 lines total)
- [Source: src/components/App/AppRoutes.tsx] - Current render prop pattern
- [Source: src/components/App/AppProviders.tsx] - Provider composition (not yet integrated)
- [Source: src/components/App/types.ts] - View types and classifications
- [Source: Atlas 08-workflow-chains.md] - All workflow requirements
- [Source: Atlas 04-architecture.md] - Provider patterns, React Query integration

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

## File List

**To Create:**
- `src/contexts/ViewHandlersContext.tsx` (if using context approach - optional)
- `src/components/App/AppOverlays.tsx` (if extracting overlays - optional)
- `tests/unit/components/App/AppRoutes.integration.test.tsx`

**To Modify:**
- `src/App.tsx` - Final cleanup to ~200-300 lines
- `src/components/App/AppRoutes.tsx` - Add view rendering logic
- `src/components/App/index.ts` - Export new components
- `src/main.tsx` - Potentially adjust provider placement

**Existing Files (no changes expected):**
- `src/components/App/AppProviders.tsx` - Already created, just needs integration
- `src/components/App/AppLayout.tsx` - Already created
- `src/components/App/AppErrorBoundary.tsx` - Already created
- `src/components/App/types.ts` - Already has View type and utilities
