# Story 14d-v2-1.10a: ViewMode Store Integration

Status: ready-for-dev

## Story

As a **developer**,
I want **the useViewModeStore integrated with the ViewModeSwitcher component**,
So that **switching between Personal and Group views updates application state correctly**.

## Context

This is the first of 4 sub-stories split from the original Story 14d-v2-1.10.

**Original Story Split:**
- **14d-v2-0:** Architecture alignment (Zustand store creation, consumer migration)
- **14d-v2-1.10a:** This story - ViewMode store integration with switcher
- **14d-v2-1.10b:** ViewModeSwitcher UI implementation
- **14d-v2-1.10c:** Header mode indicator
- **14d-v2-1.10d:** Data filtering integration

## Acceptance Criteria

### Core Functionality

1. **Given** the useViewModeStore exists (from 14d-v2-0)
   **When** ViewModeSwitcher calls `setGroupMode(groupId, group)`
   **Then** the store state updates to group mode
   **And** `selectIsGroupMode` returns true

2. **Given** ViewModeSwitcher displays the group selector
   **When** user selects "Personal"
   **Then** `setPersonalMode()` is called
   **And** store state updates to personal mode

3. **Given** the ViewModeSwitcher component
   **When** rendered
   **Then** it reads current mode from `useViewModeStore`
   **And** shows correct selection state (Personal or Group)

## Dependencies

### Upstream (Required First)
- **Story 14d-v2-0:** Architecture Alignment (useViewModeStore exists)
- **Story 14d-v2-1.4:** Create Shared Group (groups exist to select)

### Downstream (Depends on This)
- **Story 14d-v2-1.10b:** ViewModeSwitcher UI needs store integration
- **Story 14d-v2-1.10c:** Header indicator needs store state
- **Story 14d-v2-1.10d:** Data filtering needs mode state

## Tasks / Subtasks

- [ ] Task 1: Update ViewModeSwitcher to use useViewModeStore (AC: #1, #2, #3)
  - [ ] Replace `useViewMode()` import with `useViewModeStore`
  - [ ] Update `handleSelectPersonal` to call `setPersonalMode()`
  - [ ] Update `handleSelectGroup` to call `setGroupMode(groupId, group)`
  - [ ] Read current mode from store for active state display

- [ ] Task 2: Wire up groups prop from useUserSharedGroups (AC: #3)
  - [ ] ViewModeSwitcher receives `groups` prop from TanStack Query hook
  - [ ] Handle loading state (groups not yet fetched)
  - [ ] Handle error state (fetch failed)

- [ ] Task 3: Update ViewModeSwitcher tests (AC: #1, #2, #3)
  - [ ] Mock useViewModeStore in tests
  - [ ] Test setPersonalMode called on Personal selection
  - [ ] Test setGroupMode called on Group selection
  - [ ] Test active state reflects current store mode

## Dev Notes

### Store Access Pattern

```typescript
// ViewModeSwitcher.tsx
import { useViewModeStore } from '@/shared/stores';

export function ViewModeSwitcher({ groups, onClose }: Props) {
  const mode = useViewModeStore((state) => state.mode);
  const groupId = useViewModeStore((state) => state.groupId);
  const setPersonalMode = useViewModeStore((state) => state.setPersonalMode);
  const setGroupMode = useViewModeStore((state) => state.setGroupMode);

  const handleSelectPersonal = () => {
    setPersonalMode();
    onClose?.();
  };

  const handleSelectGroup = (group: SharedGroup) => {
    setGroupMode(group.id, group);
    onClose?.();
  };

  // ...
}
```

### File Locations

| File | Purpose |
|------|---------|
| `src/components/SharedGroups/ViewModeSwitcher.tsx` | Component to update (existing) |
| `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` | Tests to update (existing) |

> **Architecture Note:** These files are in the legacy location (`src/components/SharedGroups/`). Per 14d-v2-ui-conventions.md, they should be in `src/features/shared-groups/components/`. This migration is tracked in tech debt story [TD-14d-2-fsd-component-location](./TD-14d-2-fsd-component-location.md). For now, continue modifying files in their current location until TD-14d-2 is complete.

### Estimate

~2 story points

## References

- [Story 14d-v2-0: Architecture Alignment](./14d-v2-0-architecture-alignment.md)
- [Original Story 14d-v2-1.10](./14d-v2-1-10-view-mode-switcher.md)
- [Architecture Alignment Plan](../14d-v2-architecture-alignment-plan.md)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

