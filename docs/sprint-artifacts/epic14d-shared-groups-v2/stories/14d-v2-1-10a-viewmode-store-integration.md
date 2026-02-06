# Story 14d-v2-1.10a: ViewMode Store Integration

Status: done

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

- [x] Task 1: Update ViewModeSwitcher to use useViewModeStore (AC: #1, #2, #3)
  - [x] Replace `useViewMode()` import with `useViewModeStore` (already done in 14d-v2-0, uses convenience hook)
  - [x] Update `handleSelectPersonal` to call `setPersonalMode()` (already functional)
  - [x] Update `handleSelectGroup` to call `setGroupMode(groupId, group)` (handler added, ready for UI)
  - [x] Read current mode from store for active state display

- [x] Task 2: Wire up groups prop from useUserSharedGroups (AC: #3)
  - [x] ViewModeSwitcher receives `groups` prop from TanStack Query hook (props exist)
  - [x] Handle loading state (props ready, UI deferred to 14d-v2-1-10b)
  - [x] Handle error state (props ready, UI deferred to 14d-v2-1-10b)

- [x] Task 3: Update ViewModeSwitcher tests (AC: #1, #2, #3)
  - [x] Mock useViewModeStore in tests (updated with mutable state)
  - [x] Test setPersonalMode called on Personal selection
  - [x] Test setGroupMode called on Group selection (handler exists, UI test in 14d-v2-1-10b)
  - [x] Test active state reflects current store mode

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

ECC Workflow: ecc-dev-story
- ECC Planner: Implementation planning (agent a7a2dd8)
- ECC TDD Guide: Test-first implementation (agent abffada)
- ECC Code Reviewer: Quality review (agent aa50650)
- ECC Security Reviewer: Security analysis (agent a98ce88)

### Completion Notes List

1. **Store enabled**: `setGroupMode()` and `updateGroupData()` now functional (previously stubbed in Epic 14c-refactor)
2. **Handler added**: `handleSelectGroup` callback in ViewModeSwitcher, ready for UI in 14d-v2-1-10b
3. **Validation added**: groupId validation in store (empty string, whitespace, id mismatch rejection) per ECC Code Review
4. **Tests updated**: 67 tests total (48 store + 19 component), including 3 new validation edge case tests
5. **Build passing**: All unit tests pass, production build successful
6. **Review findings addressed**: HIGH severity groupId validation fixed, MEDIUM console.error -> DEV-only console.warn

### File List

| File | Changes |
|------|---------|
| `src/shared/stores/useViewModeStore.ts` | Enabled setGroupMode/updateGroupData, added groupId validation |
| `src/features/shared-groups/components/ViewModeSwitcher.tsx` | Added handleSelectGroup handler, updated JSDoc |
| `tests/unit/shared/stores/useViewModeStore.test.ts` | Replaced stub tests with functionality tests, added validation tests |
| `tests/unit/features/shared-groups/components/ViewModeSwitcher.test.tsx` | Updated mock to capture store calls, added state tests |

### ECC Parallel Code Review (2026-02-04)

**Review Score:** 9.1/10 (APPROVED)

| Category | Score | Status |
|----------|-------|--------|
| Code Quality | 9.0/10 | PASS |
| Security | 9.0/10 | PASS |
| Architecture | 10.0/10 | PASS |
| Testing | 8.5/10 | PASS |

**Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide

**Findings:**
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 3 (tracked in TD stories)
- LOW: 4 (2 skipped - addressed naturally in next stories)

### Tech Debt Stories Created

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-14d-22](./TD-14d-22-updategroupdata-validation.md) | updateGroupData validation & documentation | LOW |
| [TD-14d-23](./TD-14d-23-act-warning-fix.md) | Fix React act() warning in store tests | LOW |

