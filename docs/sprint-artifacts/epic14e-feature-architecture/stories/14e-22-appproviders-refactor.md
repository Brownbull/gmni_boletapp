# Story 14e.22: AppProviders Refactor

Status: ready-for-dev

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Created:** 2026-01-25
**Author:** Atlas Create-Story Workflow

---

## Story

As a **developer**,
I want **all providers consolidated into an AppProviders component in src/app/**,
So that **App.tsx doesn't have deeply nested providers and the app shell architecture is complete**.

---

## Context

### Current State

Provider composition is currently split across multiple locations:

**1. main.tsx (External - Root Level):**
- QueryClientProvider (React Query)
- AuthProvider (Firebase auth)
- ViewModeProvider (personal vs shared group)
- ScanProvider (scan state machine)
- AppErrorBoundary

**2. src/components/App/AppProviders.tsx (Story 14c-refactor.11):**
- ThemeProvider (fontFamily)
- NavigationProvider (view navigation)
- AppStateProvider (toasts, operation status)
- NotificationProvider (in-app notifications)

**3. App.tsx (Inline):**
- ViewHandlersProvider (wraps view section)
- HistoryFiltersProvider (view-scoped, remains in views)
- AnalyticsProvider (view-scoped, remains in views)

### What This Story Does

1. **Moves** `AppProviders` from `src/components/App/` to `src/app/` (new FSD app layer)
2. **Consolidates** ViewHandlersProvider into AppProviders (removing inline usage from App.tsx)
3. **Updates** all imports to use `@app/AppProviders` path alias
4. **Prepares** for Story 14e-21 (FeatureOrchestrator) integration

### What This Story Does NOT Do

- Does NOT move main.tsx providers (they must wrap App component)
- Does NOT change view-scoped providers (HistoryFiltersProvider, AnalyticsProvider stay per-view)
- Does NOT change provider functionality - only composition location

---

## Acceptance Criteria

### AC1: AppProviders Moved to src/app/

**Given** existing `src/components/App/AppProviders.tsx`
**When** this story is completed
**Then:**
- [ ] `src/app/AppProviders.tsx` created with all provider composition
- [ ] Types exported from `src/app/types.ts`
- [ ] Component exported from `src/app/index.ts`
- [ ] Old `src/components/App/AppProviders.tsx` deleted
- [ ] Old export removed from `src/components/App/index.ts`

### AC2: ViewHandlersProvider Consolidated

**Given** ViewHandlersProvider currently used inline in App.tsx
**When** this story is completed
**Then:**
- [ ] ViewHandlersProvider included in AppProviders composition
- [ ] Handler bundles passed as props to AppProviders
- [ ] ViewHandlersProvider removed from App.tsx render section
- [ ] Views continue to access handlers via `useViewHandlers()`

### AC3: App.tsx Integration

**Given** the new AppProviders in src/app/
**When** this story is completed
**Then:**
- [ ] App.tsx imports from `'@app/AppProviders'` or `'./app/AppProviders'`
- [ ] Provider nesting removed from App.tsx render section
- [ ] Single `<AppProviders {...props}>` wraps main content
- [ ] TypeScript compiles without errors

### AC4: Tests & Verification

**Given** AppProviders refactored
**When** tests are run
**Then:**
- [ ] Existing AppProviders tests migrated to new location
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test`
- [ ] No console errors during app rendering
- [ ] All views render correctly with handlers available

---

## Tasks / Subtasks

### Task 1: Create AppProviders in src/app/ (AC: 1)

- [ ] **1.1** Create `src/app/AppProviders.tsx`:
  - Copy content from `src/components/App/AppProviders.tsx`
  - Update imports to use proper paths
  - Add comprehensive JSDoc documentation
- [ ] **1.2** Create `src/app/types.ts`:
  - Move `AppProvidersProps` type from `src/components/App/types.ts`
  - Add any new props needed for ViewHandlersProvider
- [ ] **1.3** Update `src/app/index.ts`:
  - Export `AppProviders` and types
  - Remove placeholder comment

### Task 2: Consolidate ViewHandlersProvider (AC: 2)

- [ ] **2.1** Add handler props to AppProvidersProps:
  ```typescript
  interface AppProvidersProps {
    // Existing props
    fontFamily?: string;
    db: Firestore | null;
    userId: string | null;
    appId: string | null;
    // New handler props
    handlers?: {
      transaction: TransactionHandlers;
      scan: ScanHandlers;
      navigation: NavigationHandlers;
      dialog: DialogHandlers;
    };
  }
  ```
- [ ] **2.2** Wrap children with ViewHandlersProvider in AppProviders:
  ```typescript
  <ViewHandlersProvider
    transaction={handlers?.transaction}
    scan={handlers?.scan}
    navigation={handlers?.navigation}
    dialog={handlers?.dialog}
  >
    {children}
  </ViewHandlersProvider>
  ```
- [ ] **2.3** Make handlers optional (graceful degradation for tests)

### Task 3: Update App.tsx & Cleanup (AC: 3, 4)

- [ ] **3.1** Update App.tsx import:
  ```typescript
  import { AppProviders } from '@app/AppProviders';
  // OR if path alias not working:
  import { AppProviders } from './app/AppProviders';
  ```
- [ ] **3.2** Refactor App.tsx render section:
  - Pass handler bundles to AppProviders
  - Remove inline ViewHandlersProvider
  - Keep view-scoped providers (HistoryFiltersProvider, AnalyticsProvider) in place
- [ ] **3.3** Delete old files:
  - Delete `src/components/App/AppProviders.tsx`
  - Remove AppProviders export from `src/components/App/index.ts`
  - Update `src/components/App/types.ts` (remove AppProvidersProps if moved)
- [ ] **3.4** Run verification:
  - `npm run build`
  - `npm run test`
  - Manual smoke test (navigate all views)
- [ ] **3.5** Migrate tests (if any exist for AppProviders)

---

## Dev Notes

### Provider Hierarchy After This Story

```
main.tsx (Root - UNCHANGED)
├── QueryClientProvider
├── AuthProvider
├── ViewModeProvider
├── ScanProvider
└── AppErrorBoundary
    └── App.tsx
        └── AppProviders (NEW LOCATION: src/app/)
            ├── ThemeProvider
            ├── NavigationProvider
            ├── AppStateProvider
            ├── NotificationProvider
            └── ViewHandlersProvider (CONSOLIDATED)
                └── App content
                    ├── FeatureOrchestrator (Story 14e-21)
                    └── Views (with view-scoped providers)
```

### AppProviders Component Pattern

```typescript
// src/app/AppProviders.tsx

import { ThemeProvider, NavigationProvider, AppStateProvider, NotificationProvider, ViewHandlersProvider } from '../contexts';
import type { AppProvidersProps } from './types';

/**
 * App-level provider composition for the app shell architecture.
 *
 * Consolidates all app-level context providers in correct order.
 * External providers (Auth, Query, Scan) remain in main.tsx.
 * View-scoped providers (Analytics, HistoryFilters) remain per-view.
 *
 * @see docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md
 */
export function AppProviders({
  children,
  fontFamily = 'outfit',
  db,
  userId,
  appId,
  handlers,
}: AppProvidersProps): JSX.Element {
  return (
    <ThemeProvider fontFamily={fontFamily}>
      <NavigationProvider>
        <AppStateProvider>
          <NotificationProvider
            db={db ?? null}
            userId={userId ?? null}
            appId={appId ?? null}
          >
            {handlers ? (
              <ViewHandlersProvider
                transaction={handlers.transaction}
                scan={handlers.scan}
                navigation={handlers.navigation}
                dialog={handlers.dialog}
              >
                {children}
              </ViewHandlersProvider>
            ) : (
              children
            )}
          </NotificationProvider>
        </AppStateProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}
```

### App.tsx Usage Pattern

```typescript
// App.tsx - BEFORE (simplified)
return (
  <>
    <AppOverlays {...overlayProps} />
    <main>
      <ViewHandlersProvider
        transaction={transactionHandlers}
        scan={scanHandlers}
        navigation={navigationHandlers}
        dialog={dialogHandlers}
      >
        {/* Views with inline providers */}
      </ViewHandlersProvider>
    </main>
  </>
);

// App.tsx - AFTER
import { AppProviders } from '@app/AppProviders';

return (
  <AppProviders
    fontFamily={userPreferences?.fontFamily}
    db={services?.db ?? null}
    userId={user?.uid ?? null}
    appId={services?.appId ?? null}
    handlers={{
      transaction: transactionHandlers,
      scan: scanHandlers,
      navigation: navigationHandlers,
      dialog: dialogHandlers,
    }}
  >
    <AppOverlays {...overlayProps} />
    <main>
      {/* Views - cleaner, no ViewHandlersProvider wrapper */}
    </main>
  </AppProviders>
);
```

### Important: View-Scoped Providers Stay In Place

**DO NOT move these providers:**
- `HistoryFiltersProvider` - Used per-view with initialState props
- `AnalyticsProvider` - Used only in TrendsView with temporal state

These are intentionally view-scoped to prevent unnecessary re-renders. See [viewRenderers.tsx:70](src/components/App/viewRenderers.tsx#L70) comment.

### Path Alias Configuration

Verify `@app/*` alias is configured in tsconfig.json (from Story 14e-1):

```json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/app/*"],
      "@features/*": ["./src/features/*"],
      "@managers/*": ["./src/managers/*"],
      "@shared/*": ["./src/shared/*"],
      "@entities/*": ["./src/entities/*"]
    }
  }
}
```

### Smoke Test Checklist

Execute after refactoring:

**1. App Loads**
- [ ] App renders without errors
- [ ] Console has no provider-related warnings

**2. Theme Works**
- [ ] Theme changes apply (if toggle available)
- [ ] Font family renders correctly

**3. Navigation Works**
- [ ] Navigate between Dashboard, History, Trends, Settings
- [ ] View routing functions correctly

**4. Handlers Work**
- [ ] Open a modal (tests dialog handlers)
- [ ] Start a scan (tests scan handlers)
- [ ] Navigate from analytics to history (tests navigation handlers)

**5. Notifications Work**
- [ ] Toast messages display
- [ ] In-app notifications load (if user has any)

### Directory Structure After Completion

```
src/
├── app/
│   ├── index.ts              # Exports AppProviders
│   ├── AppProviders.tsx      # MOVED from src/components/App/
│   └── types.ts              # AppProvidersProps
├── components/
│   └── App/
│       ├── index.ts          # REMOVED AppProviders export
│       ├── AppLayout.tsx     # Unchanged
│       ├── AppOverlays.tsx   # Unchanged
│       └── types.ts          # REMOVED AppProvidersProps (moved)
└── contexts/
    └── ViewHandlersContext.tsx  # Unchanged (just imported differently)
```

### Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 3 | ≤4 | OK |
| Subtasks | 12 | ≤15 | OK |
| Files | 5-6 | ≤8 | OK |

**Story fits within context window capacity.**

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e22]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: src/components/App/AppProviders.tsx] - Current implementation
- [Source: src/main.tsx] - Root providers
- [Depends on: 14e-1] - Directory Structure & Path Aliases
- [Depends on: 14e-21] - FeatureOrchestrator (conceptual dependency)
- [Blocks: 14e-23] - App.tsx Final Cleanup

---

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

**None** - This story is a structural refactoring that does not change workflow behavior.

### Downstream Effects to Consider

- Story 14e-21 (FeatureOrchestrator) will render inside AppProviders
- Story 14e-23 (App.tsx Final Cleanup) will benefit from cleaner provider structure

### Testing Implications

- **Existing tests to verify:** All component tests that render within provider context
- **New scenarios to add:** None (behavior unchanged)

### Workflow Chain Visualization

```
main.tsx providers → AppProviders (THIS STORY) → FeatureOrchestrator → Features
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
