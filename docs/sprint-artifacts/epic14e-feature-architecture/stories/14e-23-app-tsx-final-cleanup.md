# Story 14e.23: App.tsx Final Cleanup

Status: ready-for-dev

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Created:** 2026-01-25
**Author:** Atlas Create-Story Workflow

---

## Story

As a **developer**,
I want **App.tsx refactored to its final minimal form (500-800 lines)**,
So that **the app shell architecture is complete with a clean separation between orchestration and features**.

---

## Context

### Epic 14e Progress

This is the **final story** in Epic 14e - Feature-Based Architecture. All prerequisite stories must be complete:

| Part | Stories | Status | Key Deliverable |
|------|---------|--------|-----------------|
| Part 1 | 14e-0 to 14e-5 | done/ready | Modal Manager, directory structure |
| Part 2 | 14e-6a-d to 14e-11 | ready | Scan feature, Zustand store |
| Part 3 | 14e-12a/b to 14e-16 | ready | Batch review feature |
| Part 4 | 14e-17 to 14e-20b | ready | Categories, credit, transactions, UI state |
| Part 5 | 14e-21, 14e-22 | ready | FeatureOrchestrator, AppProviders |

### Current State

- **App.tsx:** ~3,231 lines (as of 2026-01-25)
- **Target:** 500-800 lines
- **Required reduction:** ~2,400-2,700 lines

### What Remains in App.tsx After Cleanup

Per architecture decision (ADR-018), App.tsx should contain ONLY:

1. **Auth initialization** - useAuth() hook call
2. **AppProviders wrapper** - Single provider composition
3. **FeatureOrchestrator** - Renders all features
4. **View routing** - Switch/conditional for DashboardView, HistoryView, TrendsView, etc.
5. **Essential early returns** - Loading state, error state, login redirect

### What Gets REMOVED

| Section | Estimated Lines | Destination |
|---------|-----------------|-------------|
| Feature-specific rendering | ~500 | FeatureOrchestrator |
| Modal rendering | ~300 | ModalManager |
| Scan state/handlers | ~800 | ScanFeature |
| Batch review state/handlers | ~400 | BatchReviewFeature |
| Credit warning dialog | ~100 | CreditFeature |
| Category editor | ~100 | CategoriesFeature |
| Toast/settings state | ~100 | Shared hooks/stores |
| Provider nesting | ~100 | AppProviders |

---

## Acceptance Criteria

### AC1: App.tsx Reduced to Target Size

**Given** all features extracted in Parts 1-5
**When** this story is completed
**Then:**
- [ ] App.tsx is 500-800 lines total
- [ ] Line count verified: `wc -l src/App.tsx`
- [ ] No feature-specific logic remains in App.tsx
- [ ] Only essential orchestration code remains

### AC2: Clean Architecture Structure

**Given** the refactored App.tsx
**When** reviewing the code structure
**Then:**
- [ ] AppProviders wraps all content (from Story 14e-22)
- [ ] FeatureOrchestrator renders all features (from Story 14e-21)
- [ ] View routing is clean switch/conditional (not scattered)
- [ ] Early returns handle: loading, error, unauthenticated states
- [ ] No inline modal rendering (all via ModalManager)

### AC3: Imports Cleanup

**Given** the extracted features
**When** reviewing App.tsx imports
**Then:**
- [ ] Removed imports for components now in features
- [ ] Removed imports for hooks now in feature stores
- [ ] Removed imports for handlers now in feature handlers
- [ ] Clean import structure using path aliases where appropriate
- [ ] No unused imports (verified by TypeScript/ESLint)

### AC4: State Cleanup

**Given** state now managed by Zustand stores
**When** reviewing App.tsx state declarations
**Then:**
- [ ] Removed useState for: scan state, batch state, modal state, toast state
- [ ] Removed useRef for feature-specific refs (moved to features)
- [ ] Only essential state remains: view, settingsSubview, minimal UI toggles
- [ ] No feature-specific callbacks/handlers defined in App.tsx

### AC5: View Routing Clean

**Given** the simplified App.tsx
**When** the app renders different views
**Then:**
- [ ] Each view renders with minimal props (uses context)
- [ ] HistoryFiltersProvider/AnalyticsProvider remain per-view (intentional)
- [ ] View rendering logic is readable and maintainable
- [ ] Views access handlers via useViewHandlers() hook

### AC6: All Tests Pass

**Given** the refactored App.tsx
**When** running the test suite
**Then:**
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] No TypeScript errors
- [ ] E2E smoke tests pass (manual or automated)

### AC7: No Functional Regressions

**Given** the refactored architecture
**When** testing all user workflows
**Then:**
- [ ] **Workflow #1 (Scan Receipt)**: Capture -> Process -> Review -> Save works
- [ ] **Workflow #3 (Batch Processing)**: Batch capture -> Review -> Save all works
- [ ] **Workflow #4 (Analytics Navigation)**: Trends -> Drill-down -> History works
- [ ] **Workflow #6 (History Filter)**: Filters apply correctly across views
- [ ] All modal interactions work (open, close, actions)
- [ ] Toast notifications display correctly
- [ ] Credit warnings trigger appropriately

---

## Tasks / Subtasks

### Task 1: Audit Current App.tsx Sections (AC: 1, 3, 4)

- [ ] **1.1** Document current line count and section breakdown
- [ ] **1.2** Identify all imports that can be removed (already in features)
- [ ] **1.3** Identify all useState/useRef that can be removed (already in stores)
- [ ] **1.4** Identify all handler definitions that can be removed (already in features)
- [ ] **1.5** Create removal checklist with line ranges

### Task 2: Integrate FeatureOrchestrator & AppProviders (AC: 2)

- [ ] **2.1** Verify FeatureOrchestrator renders all features correctly
- [ ] **2.2** Verify AppProviders includes all necessary providers
- [ ] **2.3** Replace inline provider nesting with AppProviders
- [ ] **2.4** Replace scattered feature rendering with FeatureOrchestrator
- [ ] **2.5** Position FeatureOrchestrator correctly relative to view routing

### Task 3: Clean Up App.tsx Code (AC: 1, 3, 4)

- [ ] **3.1** Remove unused imports (scan components, batch components, modals)
- [ ] **3.2** Remove feature-specific useState declarations
- [ ] **3.3** Remove feature-specific useRef declarations
- [ ] **3.4** Remove feature-specific handler functions
- [ ] **3.5** Remove AppOverlays component call (features handle overlays)
- [ ] **3.6** Simplify view routing section (views use context for handlers)
- [ ] **3.7** Clean up comments and documentation
- [ ] **3.8** Verify final line count is 500-800 lines

### Task 4: Verification & Testing (AC: 5, 6, 7)

- [ ] **4.1** Run `npm run build` - verify success
- [ ] **4.2** Run `npm run test` - verify all tests pass
- [ ] **4.3** Run `npm run lint` - verify no errors
- [ ] **4.4** Execute smoke test checklist (see Dev Notes)
- [ ] **4.5** Verify view navigation works for all views
- [ ] **4.6** Verify feature interactions (scan, batch, credit, categories)
- [ ] **4.7** Document final line count and architecture

---

## Dev Notes

### Target App.tsx Structure

```typescript
// src/App.tsx - Target Structure (~500-800 lines)

// === IMPORTS (~50-80 lines) ===
import React from 'react';
import { AppProviders } from '@app/AppProviders';
import { FeatureOrchestrator } from '@app/FeatureOrchestrator';
import { AppLayout, shouldShowTopHeader, View } from './components/App';
import { TopHeader } from './components/TopHeader';
import { Nav } from './components/Nav';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView, HistoryView, TrendsView, SettingsView, ... } from './views';
import { useAuth } from './hooks/useAuth';
import { HistoryFiltersProvider } from './contexts/HistoryFiltersContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
// ... minimal additional imports

// === HELPER FUNCTIONS (~30-50 lines) ===
// reconcileItemsTotal (if still needed) or moved to utils

// === APP COMPONENT (~400-600 lines) ===
function App() {
  // === Auth & Services (~20 lines) ===
  const { user, services, initError, signIn, signInWithTestCredentials, signOut } = useAuth();

  // === Essential State (~20 lines) ===
  const [view, setView] = useState<View>('dashboard');
  const [settingsSubview, setSettingsSubview] = useState<SettingsSubview>('main');
  // ... minimal other state (analytics navigation state, etc.)

  // === Minimal Hooks (~50 lines) ===
  // Only hooks needed for view routing and top-level coordination
  const transactions = useTransactions(user, services);
  // ... other essential data hooks

  // === View Props Composition (~100 lines) ===
  // Use composition hooks for view props
  const dashboardViewProps = useDashboardViewProps({ ... });
  const historyViewProps = useHistoryViewProps({ ... });
  // ... other view props

  // === Early Returns (~30 lines) ===
  if (initError) return <ErrorScreen />;
  if (!user) return <LoginScreen />;

  // === Render (~200-300 lines) ===
  return (
    <AppProviders {...providerProps}>
      <AppLayout theme={theme} colorTheme={colorTheme}>
        <TopHeader ... />

        <FeatureOrchestrator />

        <main>
          {/* Clean view routing */}
          {view === 'dashboard' && <HistoryFiltersProvider><DashboardView {...} /></HistoryFiltersProvider>}
          {view === 'history' && <HistoryFiltersProvider><HistoryView {...} /></HistoryFiltersProvider>}
          {view === 'trends' && <HistoryFiltersProvider><AnalyticsProvider><TrendsView {...} /></AnalyticsProvider></HistoryFiltersProvider>}
          {view === 'settings' && <SettingsView {...} />}
          {/* ... other views */}
        </main>

        <Nav ... />
      </AppLayout>
    </AppProviders>
  );
}

export default App;
```

### What Moves Where

| Current App.tsx Section | New Location | Story |
|-------------------------|--------------|-------|
| AppOverlays component | FeatureOrchestrator (features render their own overlays) | 14e-21 |
| ModalManager render | FeatureOrchestrator | 14e-21 |
| Scan state/handlers | ScanFeature + useScanStore | 14e-6, 14e-8, 14e-10 |
| Batch review state/handlers | BatchReviewFeature + useBatchReviewStore | 14e-12, 14e-14, 14e-16 |
| Credit warning dialog | CreditFeature | 14e-18c |
| Category editor | CategoriesFeature + ModalManager | 14e-17 |
| Toast state | useToast hook | 14e-20a |
| Settings state | useSettingsStore | 14e-20b |
| Provider nesting | AppProviders | 14e-22 |

### Sections to KEEP in App.tsx

These sections MUST remain in App.tsx:

1. **useAuth() hook call** - Provides user, services, signOut
2. **View state** - `const [view, setView] = useState<View>('dashboard')`
3. **Settings subview state** - For settings navigation
4. **Analytics initial state** - For TrendsView navigation
5. **Essential data hooks** - transactions, userPreferences (needed for view props)
6. **Composition hooks** - useDashboardViewProps, useHistoryViewProps, etc.
7. **View routing** - Conditional rendering of views
8. **Nav component** - Bottom navigation
9. **TopHeader component** - Top bar with user info

### Smoke Test Checklist

Execute after cleanup:

**1. App Loads**
- [ ] App renders without errors
- [ ] Console has no critical errors
- [ ] User can sign in

**2. View Navigation**
- [ ] Dashboard -> History -> Trends -> Settings navigation works
- [ ] Back navigation works in all views
- [ ] View state preserved correctly

**3. Scan Flow (via FeatureOrchestrator)**
- [ ] FAB tap opens camera/scan
- [ ] Take photo -> Processing shows
- [ ] Review -> Save works
- [ ] Quick save triggers when confidence >= 85%

**4. Batch Flow (via FeatureOrchestrator)**
- [ ] Long-press FAB -> Mode selector
- [ ] Batch capture -> Process -> Review -> Save all

**5. Modal Interactions (via ModalManager)**
- [ ] Open category editor modal
- [ ] Open credit info modal
- [ ] Open confirm delete dialog
- [ ] All modals close correctly

**6. Feature Interactions**
- [ ] Credit warning shows when insufficient credits
- [ ] Toast notifications display
- [ ] Category mappings apply on scan

### Removed Components/Code

These should NOT appear in App.tsx after cleanup:

- `AppOverlays` component - Replaced by features
- `BatchUploadPreview` - Moved to ScanFeature
- `BatchProcessingOverlay` - Moved to ScanFeature
- `processScan` function - Moved to scan/handlers
- `handleBatch*` functions - Moved to batch-review/handlers
- `showCreditWarning` state - Moved to CreditFeature
- `showTrustPrompt` state - Moved to ScanFeature
- Individual modal states - Moved to useModalStore
- `fileInputRef` - Moved to ScanFeature
- `batchImages` state - Moved to useScanStore

### Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 4 | ≤4 | OK |
| Subtasks | 22 | ≤15 | LARGE |
| Files | 2-3 | ≤8 | OK |

**Note:** Story exceeds subtask guideline due to comprehensive verification requirements. This is acceptable for a final cleanup story that touches the entire application architecture.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e23]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md]
- [Depends on: 14e-21] - FeatureOrchestrator
- [Depends on: 14e-22] - AppProviders Refactor
- [Depends on: 14e-10] - ScanFeature
- [Depends on: 14e-16] - BatchReviewFeature
- [Depends on: 14e-17] - CategoriesFeature
- [Depends on: 14e-18c] - CreditFeature
- [Depends on: 14e-20a/b] - Toast + Settings extraction
- [Blocks: 14e-24] - Documentation & Architecture Guide

---

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

**LOW IMPACT** - This story removes code already extracted to features. No workflow behavior changes.

| Workflow | Impact | Reason |
|----------|--------|--------|
| #1 Scan Receipt | INDIRECT | ScanFeature handles; App.tsx just renders FeatureOrchestrator |
| #2 Quick Save | INDIRECT | ScanFeature handles internally |
| #3 Batch Processing | INDIRECT | BatchReviewFeature handles |
| #4 Analytics Navigation | DIRECT (view routing) | View routing remains in App.tsx - no changes |
| #5 Learning Flow | NO IMPACT | Handled by feature hooks |
| #6 History Filter | DIRECT (view routing) | View routing remains in App.tsx - no changes |
| #9 Scan Lifecycle | INDIRECT | Features handle via FeatureOrchestrator |

### Downstream Effects to Consider

- FeatureOrchestrator becomes the single point for feature rendering
- AppProviders consolidates all context providers
- Views access handlers via useViewHandlers() context (already migrated)

### Testing Implications

- **Existing tests to verify:** All component and integration tests
- **New scenarios to add:** None (behavior unchanged)
- **Critical verification:** E2E smoke tests for all workflows

### Workflow Chain Visualization

```
App.tsx (orchestration)
   |
   +-- AppProviders (context providers)
   |      |
   |      +-- ThemeProvider, NavigationProvider, etc.
   |
   +-- FeatureOrchestrator (feature composition)
   |      |
   |      +-- ScanFeature (Workflow #1, #2, #9)
   |      +-- BatchReviewFeature (Workflow #3)
   |      +-- CategoriesFeature (Workflow #5)
   |      +-- CreditFeature (credit warnings)
   |      +-- ModalManager (all modals)
   |
   +-- View Routing (Workflow #4, #6)
          |
          +-- DashboardView, HistoryView, TrendsView, etc.
```

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
