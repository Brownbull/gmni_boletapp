# Tech Debt Story TD-14d-25: ViewModeSwitcher Test Quality Improvements

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-10b
> **Priority:** Medium (test quality improvements)
> **Estimated Effort:** ~45 minutes
> **Risk:** Low (test-only changes)

## Story

As a **developer**,
I want **ViewModeSwitcher tests to have better coverage and less duplication**,
So that **the test suite is more maintainable and catches edge cases**.

## Problem Statement

The ECC TDD Guide review identified test quality improvements that were deferred:
1. Missing edge case test for groups without ID
2. Duplicate test in two describe blocks
3. Repetitive test setup patterns

## Acceptance Criteria

1. **Given** a group without an `id` property
   **When** the user tries to select it
   **Then** a test verifies `setGroupMode` is NOT called

2. **Given** the test file
   **When** checking for duplicate tests
   **Then** the duplicate "loading state" test is removed from one block

3. **Given** tests that set up `mockViewModeState`
   **When** writing new tests
   **Then** a helper function reduces duplication

## Tasks / Subtasks

- [ ] Task 1: Add test for group without ID edge case
  - [ ] Create test: "does not call setGroupMode when group has no id"
  - [ ] Test the defensive code at component line 102-107
  - [ ] Verify console.warn is called in DEV mode (optional)

- [ ] Task 2: Remove duplicate loading state test
  - [ ] Identify duplicate at line 218 (AC#2 block) and line 436 (Loading State block)
  - [ ] Keep the one in "Loading State" block (more appropriate location)
  - [ ] Remove from "AC #2: Empty State" block

- [ ] Task 3: Create test setup helper
  - [ ] Add `renderWithState(state, props)` helper function
  - [ ] Refactor tests that manually set `mockViewModeState` before render
  - [ ] Reduces ~10-15 lines of boilerplate per test

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low - test file only | Low |
| **Context window fit** | Would bloat 14d-v2-1-10b | Clean separation |
| **Sprint capacity** | Uses current sprint time | Scheduled for later |
| **Accumulation risk** | Minor | Minor |
| **Dependency risk** | None | None |

**Recommendation:** Defer - Test improvements that don't affect production code.

### Code Examples

```tsx
// Task 1: Edge case test
it('does not call setGroupMode when group has no id', () => {
  const groupWithoutId = { ...mockGroups[0], id: undefined };
  render(<ViewModeSwitcher {...defaultProps} groups={[groupWithoutId as SharedGroup]} />);

  fireEvent.click(screen.getByText('Family'));

  expect(mockSetGroupMode).not.toHaveBeenCalled();
});
```

```tsx
// Task 3: Test setup helper
const renderWithState = (
  state: Partial<typeof mockViewModeState>,
  props: Partial<typeof defaultProps> = {}
) => {
  mockViewModeState = { ...mockViewModeState, ...state };
  return render(<ViewModeSwitcher {...defaultProps} {...props} />);
};

// Usage
renderWithState({ mode: 'group', groupId: 'group-1' });
```

### Dependencies

- None

### References

- [Story 14d-v2-1-10b](./14d-v2-1-10b-viewmodeswitcher-ui.md) - Source of this tech debt item
- [ViewModeSwitcher Test File](../../../../tests/unit/features/shared-groups/components/ViewModeSwitcher.test.tsx)
