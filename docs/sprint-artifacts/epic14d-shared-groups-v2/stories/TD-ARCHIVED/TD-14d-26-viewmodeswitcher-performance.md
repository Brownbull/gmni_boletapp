# Tech Debt Story TD-14d-26: ViewModeSwitcher Performance Optimization

Status: ready-for-dev

> **Source:** ECC Code Review #2 (2026-02-04) on story 14d-v2-1-10b
> **Priority:** LOW (Performance optimization for edge cases)
> **Estimated Effort:** ~1 hour
> **Risk:** LOW (Non-breaking optimization)

## Story

As a **developer**,
I want **ViewModeSwitcher to be optimized for re-render performance**,
So that **the component performs well even with many groups**.

## Problem Statement

The ECC Code Reviewer identified two related performance concerns:

1. **ViewModeOption not memoized**: The sub-component re-renders on every state change (e.g., `focusedIndex` changes during keyboard navigation). With 10+ groups, this creates unnecessary DOM updates.

2. **Inline arrow functions in groups.map**: `onClick={() => handleSelectGroup(group)}` creates new function references on each render, contributing to unnecessary child re-renders.

**Impact Assessment:**
- Current usage: Most users have 1-5 groups (LOW impact)
- Edge case: Users with 10+ groups would notice keyboard navigation lag
- Severity: MEDIUM for code quality, LOW for user impact

## Acceptance Criteria

1. **Given** ViewModeOption component
   **When** the component is defined
   **Then** it is wrapped with `React.memo`

2. **Given** group options in ViewModeSwitcher
   **When** keyboard navigation changes `focusedIndex`
   **Then** only the affected option (focused/unfocused) re-renders

3. **Given** the onClick handler for groups
   **When** the component renders
   **Then** handler references are stable across re-renders

4. **Given** the optimization is applied
   **When** running tests
   **Then** all 40 existing tests still pass

## Tasks / Subtasks

- [ ] Task 1: Memoize ViewModeOption component (AC: #1, #2)
  - [ ] Wrap ViewModeOption with `React.memo`
  - [ ] Consider custom comparison function if needed
  - [ ] File: `ViewModeSwitcher.tsx:389`

- [ ] Task 2: Stabilize onClick handlers (AC: #3)
  - [ ] Option A: Move handler creation inside ViewModeOption
  - [ ] Option B: Create stable handler map with useMemo
  - [ ] Option C: Pass group.id and let child call parent handler
  - [ ] File: `ViewModeSwitcher.tsx:306`

- [ ] Task 3: Verify tests pass (AC: #4)
  - [ ] Run: `npm run test -- ViewModeSwitcher.test.tsx`
  - [ ] Verify all 40 tests pass
  - [ ] No new tests needed (behavior unchanged)

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low - isolated changes | Low - file stable |
| **Context window fit** | Would bloat 14d-v2-1-10b | Clean separation |
| **Sprint capacity** | Uses current sprint time | Scheduled for later |
| **Accumulation risk** | Low | Low |
| **User impact** | Most users unaffected | Most users unaffected |

**Recommendation:** Defer - Performance optimization for edge case (many groups)

### Implementation Options

**Option A: React.memo + Callback in Child**
```tsx
const ViewModeOption = React.memo<ViewModeOptionProps>(({
  testId, id, isActive, icon, name, description, onClick, optionRef
}) => {
  // ... existing implementation
});

// Parent passes stable handler reference
const handleGroupClick = useCallback((groupId: string) => {
  const group = groups.find(g => g.id === groupId);
  if (group) handleSelectGroup(group);
}, [groups, handleSelectGroup]);

// Usage
<ViewModeOption
  onClick={() => handleGroupClick(group.id)}
  // ... other props
/>
```

**Option B: React.memo + Handler Map**
```tsx
const ViewModeOption = React.memo<ViewModeOptionProps>(...);

// Create stable handler map
const groupHandlers = useMemo(() => {
  const handlers = new Map<string, () => void>();
  groups.forEach(g => handlers.set(g.id, () => handleSelectGroup(g)));
  return handlers;
}, [groups, handleSelectGroup]);

// Usage
<ViewModeOption
  onClick={groupHandlers.get(group.id)!}
  // ... other props
/>
```

**Option C: Pass Icon Type Instead of JSX (most effective)**
```tsx
interface ViewModeOptionProps {
  iconType: 'user' | 'users' | 'plus'; // Instead of icon: React.ReactNode
  // ...
}

const ViewModeOption = React.memo<ViewModeOptionProps>(({ iconType, ... }) => {
  const icon = iconType === 'user' ? <User size={ICON_SIZE} />
             : iconType === 'users' ? <Users size={ICON_SIZE} />
             : <Plus size={ICON_SIZE} />;
  // ...
});
```

### Performance Testing (Optional)

To validate the optimization:
```tsx
// Add to development testing
const ViewModeOptionWithLog = React.memo(ViewModeOption, (prev, next) => {
  if (prev.isActive !== next.isActive || prev.name !== next.name) {
    console.log(`[ViewModeOption] ${next.name} re-render required`);
    return false;
  }
  console.log(`[ViewModeOption] ${next.name} skipped re-render`);
  return true;
});
```

### Dependencies

- None

### References

- [Story 14d-v2-1-10b](./14d-v2-1-10b-viewmodeswitcher-ui.md) - Source of this tech debt item
- [ViewModeSwitcher Component](../../../../src/features/shared-groups/components/ViewModeSwitcher.tsx)
- [TD-14d-24](./TD-14d-24-viewmodeswitcher-code-quality.md) - Related code quality story (completed)
