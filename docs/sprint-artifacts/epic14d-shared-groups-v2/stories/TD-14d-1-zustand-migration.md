# Tech Debt Story TD-14d-1: Migrate useGroupDialogs to Zustand Store

Status: done

> **Source:** ECC Code Review #2 (2026-02-03) on story 14d-v2-1-7e
> **Priority:** LOW (pattern consistency, no functional impact)
> **Estimated Effort:** 2-4 hours → **Actual: ~1 hour**
> **Risk:** LOW (well-tested, straightforward refactor)

## Story

As a **developer**,
I want **the `useGroupDialogs` hook to use Zustand store pattern instead of 17 useState calls**,
So that **the codebase follows consistent state management patterns with DevTools visibility**.

## Problem Statement

The `useGroupDialogs` hook in `src/features/shared-groups/hooks/useGroupDialogs.ts` uses 17 individual `useState` calls:

```typescript
// Current implementation - 17 useState calls
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [createError, setCreateErrorState] = useState<string | null>(null);
const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
// ... 14 more useState calls
```

This deviates from the documented Zustand pattern in `04-architecture.md` which provides:
- DevTools action naming (`'dialogs/openCreate'`)
- Phase guards for state machine safety
- Centralized state in store for debugging

## Acceptance Criteria

1. **Given** the `useGroupDialogs` hook exists
   **When** I inspect the implementation
   **Then** it should use a Zustand store with devtools

2. **Given** the new `useGroupDialogsStore` store
   **When** actions are dispatched
   **Then** they should appear in Redux DevTools with named actions

3. **Given** existing GruposView.tsx usage
   **When** migrated to use the new store
   **Then** all existing functionality should work identically

4. **Given** existing tests in `tests/unit/hooks/useGroupDialogs.test.ts`
   **When** updated for Zustand store
   **Then** all tests should pass with equivalent coverage

## Tasks / Subtasks

- [x] **Task 1: Create Zustand Store** (AC: #1, #2)
  - [x] 1.1: Create `src/features/shared-groups/store/useGroupDialogsStore.ts`
  - [x] 1.2: Define state interface matching current `GroupDialogsState`
  - [x] 1.3: Define actions interface matching current `GroupDialogsActions`
  - [x] 1.4: Implement store with devtools wrapper
  - [x] 1.5: Add action naming for DevTools visibility

- [x] **Task 2: Update Hook Wrapper** (AC: #3)
  - [x] 2.1: Update `useGroupDialogs` to use store internally
  - [x] 2.2: Maintain existing API for backward compatibility
  - [x] 2.3: Update barrel exports in feature index

- [x] **Task 3: Update Consumers** (AC: #3)
  - [x] 3.1: GruposView.tsx works unchanged (backward compatible API)
  - [x] 3.2: Verify all dialog interactions work correctly (70 tests pass)

- [x] **Task 4: Update Tests** (AC: #4)
  - [x] 4.1: Update hook tests with `beforeEach` store reset
  - [x] 4.2: Ensure same coverage levels (39 hook tests + 27 store tests)
  - [x] 4.3: Run full test suite (all pass)

## Dev Notes

### Expected Store Pattern

```typescript
// src/features/shared-groups/store/useGroupDialogsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useGroupDialogsStore = create<GroupDialogsState & GroupDialogsActions>()(
  devtools(
    (set, get) => ({
      // State
      isCreateDialogOpen: false,
      createError: null,
      isInviteDialogOpen: false,
      selectedGroup: null,
      // ... rest of state

      // Actions with DevTools naming
      openCreateDialog: () =>
        set({ isCreateDialogOpen: true }, false, 'dialogs/openCreate'),
      closeCreateDialog: () =>
        set({ isCreateDialogOpen: false, createError: null }, false, 'dialogs/closeCreate'),
      // ... rest of actions
    }),
    { name: 'group-dialogs-store', enabled: import.meta.env.DEV }
  )
);
```

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/features/shared-groups/store/useGroupDialogsStore.ts` | **NEW** | Zustand store |
| `src/features/shared-groups/store/index.ts` | Modify | Add export |
| `src/features/shared-groups/hooks/useGroupDialogs.ts` | Modify | Use store internally |
| `src/features/shared-groups/index.ts` | Modify | Update exports |
| `tests/unit/hooks/useGroupDialogs.test.ts` | Modify | Update for store |

### Testing Strategy

- Run existing hook tests to ensure backward compatibility
- Add DevTools verification test (DEV mode)
- Verify GruposView.tsx integration tests pass

### Dependencies

- None (standalone refactor)

### References

- [04-architecture.md](../../../architecture/04-architecture.md) - Zustand store pattern
- [useGroupDialogs.ts](../../../../src/features/shared-groups/hooks/useGroupDialogs.ts) - Current implementation
- [14d-v2-1-7e](./14d-v2-1-7e-delete-ui-security-rules.md) - Source of this tech debt item
