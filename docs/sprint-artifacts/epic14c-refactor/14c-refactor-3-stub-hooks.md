# Story 14c-refactor.3: Stub Hooks

Status: ready-for-dev

## Story

As a **developer**,
I want **shared group React hooks replaced with empty-return stubs**,
So that **components don't crash when calling hooks and the app remains functional**.

## Acceptance Criteria

1. **Given** hooks `useSharedGroups.ts`, `useUserSharedGroups.ts`, `useSharedGroupTransactions.ts` have full implementations
   **When** this story is completed
   **Then:**
   - `useSharedGroups` returns `{ sharedGroups: [], loading: false, error: null }`
   - `useUserSharedGroups` returns `{ groups: [], isLoading: false, error: undefined, groupCount: 0, hasGroups: false, getGroupById: () => undefined }`
   - `useSharedGroupTransactions` is deleted entirely
   - `useNotificationDeltaFetch` is deleted or returns no-op
   - `useStorageStrategy` is deleted or returns stub
   - All type exports are preserved for import compatibility
   - App compiles and runs without errors

## Tasks / Subtasks

- [ ] Task 1: Delete useSharedGroupTransactions.ts (AC: #1)
  - [ ] Delete `src/hooks/useSharedGroupTransactions.ts`
  - [ ] Find all imports and update/remove them

- [ ] Task 2: Stub useSharedGroups.ts (AC: #1)
  - [ ] Replace implementation with stub returning empty state
  - [ ] Keep type exports (`UseSharedGroupsReturn`)
  - [ ] Remove unused imports (Firebase, services)

- [ ] Task 3: Stub useUserSharedGroups.ts (AC: #1)
  - [ ] Replace implementation with stub returning empty state
  - [ ] Keep type exports (`UseUserSharedGroupsResult`, `SharedGroup` re-export)
  - [ ] Remove unused imports (Firebase, services)
  - [ ] Keep `getGroupById` as function returning `undefined`

- [ ] Task 4: Update consumers of deleted hooks (AC: #1)
  - [ ] Find components importing `useSharedGroupTransactions`
  - [ ] Remove or comment out usage
  - [ ] Ensure no TypeScript errors

- [ ] Task 5: Verify build success (AC: #1)
  - [ ] Run `npm run build`
  - [ ] Fix any TypeScript compilation errors
  - [ ] Ensure no remaining references to deleted hooks

## Dev Notes

### Files to Delete
- `src/hooks/useSharedGroupTransactions.ts` (~688 lines) - Complex React Query + IndexedDB hook

### Files to Modify
- `src/hooks/useSharedGroups.ts` - Replace with stub (~83 lines → ~30 lines)
- `src/hooks/useUserSharedGroups.ts` - Replace with stub (~145 lines → ~40 lines)

### Stub Implementation Pattern

```typescript
// useSharedGroups.ts stub
import type { SharedGroup } from '../types/sharedGroup';

export interface UseSharedGroupsReturn {
    sharedGroups: SharedGroup[];
    loading: boolean;
    error: string | null;
}

export function useSharedGroups(_userId: string | null): UseSharedGroupsReturn {
    return {
        sharedGroups: [],
        loading: false,
        error: null,
    };
}

export default useSharedGroups;
```

```typescript
// useUserSharedGroups.ts stub
import { useCallback, useMemo } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { SharedGroup } from '../types/sharedGroup';

export interface UseUserSharedGroupsResult {
  groups: SharedGroup[];
  isLoading: boolean;
  error: Error | undefined;
  groupCount: number;
  hasGroups: boolean;
  getGroupById: (groupId: string) => SharedGroup | undefined;
}

export function useUserSharedGroups(
  _db: Firestore,
  _userId: string | undefined
): UseUserSharedGroupsResult {
  const getGroupById = useCallback(
    (_groupId: string): SharedGroup | undefined => undefined,
    []
  );

  return useMemo(
    () => ({
      groups: [],
      isLoading: false,
      error: undefined,
      groupCount: 0,
      hasGroups: false,
      getGroupById,
    }),
    [getGroupById]
  );
}

export type { SharedGroup } from '../types/sharedGroup';
```

### Type Exports to Preserve

Keep these exports for backwards compatibility:
- `UseSharedGroupsReturn` interface
- `UseUserSharedGroupsResult` interface
- `SharedGroup` re-export from `useUserSharedGroups.ts`

### Hooks to Consider (may have consumers)

- `useSharedGroupTransactions` - Used by SharedGroupTransactionsView component
- `useNotificationDeltaFetch` - Used by App.tsx or notification handler
- `useStorageStrategy` - Used for offline warning display

### Components That May Import These Hooks

Search for these patterns:
- `from '../hooks/useSharedGroupTransactions'`
- `from '../hooks/useSharedGroups'`
- `from '../hooks/useUserSharedGroups'`

### Architecture Context

From Epic 14c Retrospective:
> Hooks should return empty/stub values without subscribing to any real-time data or making network calls. This ensures components render without data but don't crash.

### Testing Standards

- Run `npm run build` to verify compilation
- Manual smoke test: App should load, hook calls should return empty arrays
- Components using these hooks may show empty state (expected behavior)

### Project Structure Notes

- Hooks directory: `src/hooks/`
- Components that consume these hooks may be in `src/components/` or `src/pages/`
- This story depends on services being stubbed first (Story 14c-refactor.2)

### Dependencies

- **Depends on:** Story 14c-refactor.2 (Services must be stubbed first)
- **Blocks:** Story 14c-refactor.5 (UI components depend on hooks returning predictable values)

### References

- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.3] - Story definition
- [Source: src/hooks/useSharedGroupTransactions.ts] - Current hook implementation

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Household Sharing Flow (#10)**: Components will receive empty group lists
- **Learning Flow**: No shared group analytics will be computed

### Downstream Effects to Consider

- Components will render empty states (expected)
- Any conditional rendering based on `hasGroups` will show "no groups" state
- ViewModeSwitcher will not show shared group options
- SharedGroupTransactionsView will not render (hook deleted)

### Important Note

**These effects are intentional.** Story 14c-refactor.5 (Placeholder UI) will add "Coming soon" tooltips to disabled features.

### Testing Implications

- **Existing tests to delete:** Tests for these hooks (Story 14c-refactor.17)
- **Manual verification:** Ensure App loads without console errors

### Workflow Chain Visualization

```
[STUB: useSharedGroups] → ViewModeSwitcher → Shows empty
[STUB: useUserSharedGroups] → GroupSelector → Shows "no groups"
[DELETE: useSharedGroupTransactions] → SharedGroupTransactionsView disabled
```

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation - files modified/deleted)
