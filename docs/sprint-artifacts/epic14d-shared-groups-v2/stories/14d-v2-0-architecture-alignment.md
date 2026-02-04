# Story 14d-v2-0: Architecture Alignment

Status: done

## Story

As a **developer**,
I want **the shared groups feature infrastructure aligned with Epic 14e architecture**,
So that **all Epic 14d-v2 stories can build on consistent Zustand patterns**.

## Context

This story was added during Epic Review to align Epic 14d-v2 with architectural changes from Epic 14e:

- **ADR-018:** Zustand-only for client state management
- **Epic 14e outcome:** 7 Zustand stores created, NavigationContext deleted
- **Conflict identified:** Story 14d-v2-1.10 originally referenced ViewModeContext (React Context)

This story creates the foundation before Epic 1 begins.

## Acceptance Criteria

### Core Functionality

1. **Given** the Epic 14e Zustand-only pattern (ADR-018)
   **When** Epic 14d-v2 view mode state is implemented
   **Then** it uses a Zustand store at `src/shared/stores/useViewModeStore.ts`
   **And** follows the same patterns as useNavigationStore

2. **Given** the feature directory structure from Epic 14e
   **When** the shared-groups feature directory is created
   **Then** it exists at `src/features/shared-groups/`
   **And** includes standard subdirectories: `store/`, `handlers/`, `hooks/`, `components/`, `types.ts`

3. **Given** existing ViewModeContext consumers in the codebase
   **When** the migration is complete
   **Then** all consumers use `useViewModeStore` instead
   **And** `ViewModeContext.tsx` is deleted
   **And** all tests pass

4. **Given** AppProviders.tsx wraps the application
   **When** ViewModeContext is removed
   **Then** AppProviders no longer includes ViewModeProvider
   **And** application renders correctly

## Dependencies

### Upstream (Required First)
- None - this is the first story in Epic 14d-v2

### Downstream (Depends on This)
- **All Epic 1 stories** - can assume Zustand patterns exist
- **Story 14d-v2-1.10a-d** - uses useViewModeStore

## Tasks / Subtasks

- [x] Task 1: Create feature directory structure (AC: #2)
  - [x] Create `src/features/shared-groups/` directory
  - [x] Create `src/features/shared-groups/index.ts` (public API)
  - [x] Create `src/features/shared-groups/store/` subdirectory
  - [x] Create `src/features/shared-groups/handlers/` subdirectory
  - [x] Create `src/features/shared-groups/hooks/` subdirectory
  - [x] Create `src/features/shared-groups/components/` subdirectory
  - [x] Create `src/features/shared-groups/types.ts` placeholder

- [x] Task 2: Create useViewModeStore (AC: #1)
  - [x] Create `src/shared/stores/useViewModeStore.ts`
  - [x] Implement ViewModeState interface:
    ```typescript
    interface ViewModeState {
      mode: 'personal' | 'group';
      groupId: string | null;
      group: SharedGroup | null;
    }
    ```
  - [x] Implement actions:
    - `setPersonalMode(): void`
    - `setGroupMode(groupId: string, group?: SharedGroup): void`
    - `updateGroupData(group: SharedGroup): void`
  - [x] Implement selectors:
    - `selectIsGroupMode(state): boolean`
    - `selectCurrentGroupId(state): string | null`
  - [x] Add DevTools naming: `{ name: 'view-mode-store' }`
  - [x] Export `useViewMode` convenience hook (wraps store with selectors)

- [x] Task 3: Create useViewModeStore tests (AC: #1)
  - [x] Create `tests/unit/shared/stores/useViewModeStore.test.ts`
  - [x] Test initial state (personal mode, null group)
  - [x] Test `setPersonalMode` clears group data
  - [x] Test `setGroupMode` sets mode and group (stub behavior - logs warning)
  - [x] Test `updateGroupData` updates group without mode change (stub behavior)
  - [x] Test selector functions
  - [x] Test action stability (same reference across renders)

- [x] Task 4: Identify ViewModeContext consumers (AC: #3)
  - [x] Search codebase for `useViewMode` imports from ViewModeContext
  - [x] List all consumer files (found 8 consumers)
  - [x] Document import path changes needed
  - [x] Note: `useViewModeOptional` consumers no longer need null checks

- [x] Task 5: Migrate ViewModeContext consumers (AC: #3)
  - [x] Update each consumer to import from `@/shared/stores/useViewModeStore`
  - [x] Replace `useViewMode()` calls with new hook
  - [x] Replace `useViewModeOptional()` with direct store access
  - [x] Verify TypeScript compilation for each file

- [x] Task 6: Update AppProviders.tsx (AC: #4)
  - [x] Remove `ViewModeProvider` import (was in main.tsx)
  - [x] Remove `<ViewModeProvider>` wrapper from component tree
  - [x] Update exports from `src/contexts/index.ts` (remove ViewMode exports)
  - [x] Note: Store is auto-initialized, no provider needed

- [x] Task 7: Delete ViewModeContext (AC: #3)
  - [x] Delete `src/contexts/ViewModeContext.tsx`
  - [x] Delete `tests/unit/contexts/ViewModeContext.test.tsx`
  - [x] Update `src/contexts/index.ts` exports
  - [x] Add migration comment pointing to useViewModeStore

- [x] Task 8: Verify all tests pass (AC: #1, #3)
  - [x] Run `npm test` - 6203 tests pass
  - [x] Run `npm run build` - succeeds
  - [x] Run `npm run type-check` - no TypeScript errors
  - [x] Verify no console warnings about missing context

## Dev Notes

### Architecture Decision Reference

This story implements findings from the Epic 14d-v2 Architecture Alignment Plan:
- **Decision 1:** ViewMode State Management → Option A (Zustand Store)
- **Decision 2:** Feature Directory Structure → Option A (Feature Directory)

See: [14d-v2-architecture-alignment-plan.md](../14d-v2-architecture-alignment-plan.md)

### useViewModeStore Pattern

Follow the established pattern from Epic 14e stores:

```typescript
// src/shared/stores/useViewModeStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SharedGroup } from '@/types/sharedGroup';

// Types
export type ViewMode = 'personal' | 'group';

interface ViewModeState {
  mode: ViewMode;
  groupId: string | null;
  group: SharedGroup | null;
}

interface ViewModeActions {
  setPersonalMode: () => void;
  setGroupMode: (groupId: string, group?: SharedGroup) => void;
  updateGroupData: (group: SharedGroup) => void;
}

type ViewModeStore = ViewModeState & ViewModeActions;

// Store
export const useViewModeStore = create<ViewModeStore>()(
  devtools(
    (set) => ({
      // Initial state - always personal mode
      mode: 'personal',
      groupId: null,
      group: null,

      // Actions
      setPersonalMode: () =>
        set(
          { mode: 'personal', groupId: null, group: null },
          false,
          'setPersonalMode'
        ),

      setGroupMode: (groupId, group) =>
        set(
          { mode: 'group', groupId, group: group ?? null },
          false,
          'setGroupMode'
        ),

      updateGroupData: (group) =>
        set({ group }, false, 'updateGroupData'),
    }),
    { name: 'view-mode-store' }
  )
);

// Selectors
export const selectIsGroupMode = (state: ViewModeStore) => state.mode === 'group';
export const selectCurrentGroupId = (state: ViewModeStore) => state.groupId;
export const selectCurrentGroup = (state: ViewModeStore) => state.group;

// Convenience hook (optional - for easier migration)
export function useViewMode() {
  const mode = useViewModeStore((state) => state.mode);
  const groupId = useViewModeStore((state) => state.groupId);
  const group = useViewModeStore((state) => state.group);
  const isGroupMode = useViewModeStore(selectIsGroupMode);
  const setPersonalMode = useViewModeStore((state) => state.setPersonalMode);
  const setGroupMode = useViewModeStore((state) => state.setGroupMode);
  const updateGroupData = useViewModeStore((state) => state.updateGroupData);

  return {
    mode,
    groupId,
    group,
    isGroupMode,
    setPersonalMode,
    setGroupMode,
    updateGroupData,
  };
}
```

### Known ViewModeContext Consumers

Based on codebase analysis, update these files:
1. `src/contexts/index.ts` - exports
2. `src/app/AppProviders.tsx` - provider
3. Components using `useViewMode()` or `useViewModeOptional()`

### Feature Directory Structure

```
src/features/shared-groups/
├── index.ts                     # Public API exports
├── types.ts                     # Feature-specific types
├── store/
│   └── index.ts                 # Re-exports from shared/stores
├── handlers/
│   └── .gitkeep                 # Placeholder for sync/membership handlers
├── hooks/
│   └── .gitkeep                 # Placeholder for TanStack Query hooks
└── components/
    └── .gitkeep                 # Components migrate here from SharedGroups/
```

### Migration Path for useViewModeOptional

The old `useViewModeOptional()` returned `null` outside provider. For Zustand:

```typescript
// Old pattern (Context)
const viewMode = useViewModeOptional();
if (!viewMode) return <DefaultUI />;

// New pattern (Zustand) - store always available
const mode = useViewModeStore((state) => state.mode);
// No null check needed - store always initialized
```

### Estimate

~3 story points based on:
- Store creation: 2 hours
- Tests: 2 hours
- Consumer migration: 3 hours
- Cleanup and verification: 1 hour

## References

- [Epic 14e Architecture Decision (ADR-018)](../../epic14e-feature-architecture/architecture-decision.md)
- [Architecture Alignment Plan](../14d-v2-architecture-alignment-plan.md)
- [useNavigationStore Pattern](../../../../src/shared/stores/useNavigationStore.ts)
- [ViewModeContext (DELETED)](../../../../src/contexts/ViewModeContext.tsx)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered

### Completion Notes List

- Created `src/features/shared-groups/` feature directory with standard subdirectories (store, handlers, hooks, components, types.ts)
- Created `src/shared/stores/useViewModeStore.ts` following Epic 14e Zustand patterns:
  - ViewModeState with mode, groupId, group
  - Actions: setPersonalMode, setGroupMode (stub), updateGroupData (stub)
  - Selectors: selectIsGroupMode, selectCurrentGroupId, selectCurrentGroup
  - Convenience hook: useViewMode() for easy migration from ViewModeContext
  - DevTools integration with 'view-mode-store' name
- Created 37 unit tests for the new store in `tests/unit/shared/stores/useViewModeStore.test.ts`
- Migrated 8 consumers from `@/contexts/ViewModeContext` to `@/shared/stores/useViewModeStore`:
  - src/App.tsx
  - src/hooks/useAnalyticsTransactions.ts
  - src/views/HistoryView/useHistoryViewData.ts
  - src/views/TrendsView/useTrendsViewData.ts
  - src/views/TransactionEditorView/useTransactionEditorData.ts
  - src/components/SharedGroups/ViewModeSwitcher.tsx
- Removed ViewModeProvider from `src/main.tsx`
- Deleted `src/contexts/ViewModeContext.tsx` and its test file
- Updated `src/contexts/index.ts` with migration comment
- Updated `src/app/AppProviders.tsx` comment to reflect Zustand-based state
- Updated test mocks in 2 test files to use new store path
- All 6203 tests pass, build succeeds

### File List

**New Files:**
- `src/features/shared-groups/index.ts` - Feature barrel exports
- `src/features/shared-groups/types.ts` - Type re-exports from sharedGroup
- `src/features/shared-groups/store/index.ts` - Store re-exports
- `src/features/shared-groups/handlers/index.ts` - Placeholder
- `src/features/shared-groups/hooks/index.ts` - Placeholder
- `src/features/shared-groups/components/index.ts` - Placeholder
- `src/shared/stores/useViewModeStore.ts` - Zustand store (233 lines)
- `tests/unit/shared/stores/useViewModeStore.test.ts` - Unit tests (37 tests)

**Modified Files:**
- `src/shared/stores/index.ts` - Added useViewModeStore exports
- `src/main.tsx` - Removed ViewModeProvider
- `src/App.tsx` - Updated import path
- `src/hooks/useAnalyticsTransactions.ts` - Updated import path
- `src/views/HistoryView/useHistoryViewData.ts` - Updated import path
- `src/views/TrendsView/useTrendsViewData.ts` - Updated import path
- `src/views/TransactionEditorView/useTransactionEditorData.ts` - Updated import path
- `src/components/SharedGroups/ViewModeSwitcher.tsx` - Updated import path
- `src/contexts/index.ts` - Removed ViewModeContext exports, added migration comment
- `src/app/AppProviders.tsx` - Updated comment
- `tests/unit/hooks/useAnalyticsTransactions.test.ts` - Updated mock path
- `tests/unit/views/TrendsView/useTrendsViewData.test.ts` - Updated mock path
- `tests/unit/views/HistoryView/useHistoryViewData.test.ts` - Updated mock path (code review fix)
- `tests/unit/views/DashboardView/useDashboardViewData.test.ts` - Updated mock path (code review fix)
- `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` - Updated mock path (code review fix)

**Deleted Files:**
- `src/contexts/ViewModeContext.tsx` - Replaced by useViewModeStore
- `tests/unit/contexts/ViewModeContext.test.tsx` - Replaced by useViewModeStore.test.ts
