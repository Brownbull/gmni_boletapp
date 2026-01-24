# Story 14c-refactor.36: DashboardView Test Selector Fixes

Status: done

## Story

As a **developer maintaining test reliability**,
I want **DashboardView pagination tests to use correct selectors**,
So that **tests accurately reflect the component implementation and CI passes reliably**.

## Background

During story 30a validation, 6 pre-existing test failures were discovered in DashboardView.test.tsx. The tests expected the full list view with pagination to render when clicking "View All".

### Root Cause (Corrected)

The initial analysis was incorrect. The pagination buttons DO use text (`{t('prev')}` and `{t('next')}`), not icon-only buttons.

The actual root cause: After Story 14c-refactor.27, `DashboardView` gets `handleNavigateToHistory` from `ViewHandlersContext`. When this callback is provided (which the test-utils automatically do), clicking "View All" calls the navigation handler instead of showing the inline full list view with pagination:

```tsx
// In handleViewAll()
if (onNavigateToHistory) {  // Always truthy due to ViewHandlersContext mock
    onNavigateToHistory({...});  // Calls mock - navigates away
} else {
    setShowFullList(true);  // Never reached - full list view never shown
}
```

The fix: Override `handleNavigateToHistory` to `undefined` in the pagination tests so `setShowFullList(true)` executes and the inline pagination UI renders.

### Failing Tests (5 tests in Pagination block + 2 tests in Filter Bar block = 7 affected)

Tests in "DashboardView > Full List View (View All) > Pagination in Full List":
1. `should show paginated transactions (first page)`
2. `should show pagination controls when multiple pages exist`
3. `should navigate to next page when next button clicked`
4. `should disable prev button on first page`
5. `should disable next button on last page`

Tests in "DashboardView > Full List View (View All) > AC#6: Filter Bar in Full List":
6. `should show back button in full list view`
7. `should return to dashboard when back button is clicked`

Note: 1 test in Filter Bar block is skipped (`should show filter bar in full list view`).

## Acceptance Criteria

1. **Given** DashboardView pagination uses icon buttons
   **When** tests run
   **Then:**
   - Tests use `getByLabelText` or `getByRole('button', { name: ... })` instead of `getByText`
   - All 6 failing tests pass

2. **Given** the fix is applied
   **When** full DashboardView test suite runs
   **Then:**
   - All 41 DashboardView tests accounted for: 39 passing + 2 skipped
   - The 7 previously failing tests (5 pagination + 2 filter bar) now pass
   - No regression in other test files

## Tasks / Subtasks

### Task 1: Analyze Current Implementation

- [x] 1.1 Identify how DashboardView renders pagination buttons (aria-label, data-testid, etc.)
- [x] 1.2 Document the correct selector pattern to use

### Task 2: Fix Test Context Setup

- [x] 2.1 Add `beforeEach` to override `handleNavigateToHistory` to `undefined` for pagination tests
- [x] 2.2 Add `afterEach` to restore the mock function
- [x] 2.3 Apply fix to both "AC#6: Filter Bar in Full List" and "Pagination in Full List" describe blocks

### Task 3: Validate

- [x] 3.1 Run DashboardView tests: `npm test -- tests/unit/views/DashboardView.test.tsx`
- [x] 3.2 Verify all 41 tests pass (39 passing, 2 skipped expected)
- [x] 3.3 Run broader test suite to check for regressions (5,280 tests pass)

## Dev Notes

### Estimation

- **Points:** 1 pt
- **Risk:** LOW - Test-only changes, no production code modified

### Dependencies

- **Requires:** None (independent test fix)
- **Blocks:** None (but improves CI reliability)

### Cross-References

- **Discovered during:** Story 30a validation
- **Root cause related to:** Story 14c-refactor.27 (ViewHandlersContext migration)

## File List

**Modified:**
- `tests/unit/views/DashboardView.test.tsx` - Override ViewHandlersContext navigation handler for Full List View tests
- `tests/setup/test-utils.tsx` - Added `disableNavigationHandler()` and `restoreNavigationHandler()` helper functions

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story created from 30a validation findings | Atlas Dev Story |
| 2026-01-24 | Implemented: Added beforeEach/afterEach to override handleNavigateToHistory in Full List View tests. All 41 tests accounted for (39 passing + 2 skipped). 5,280 total tests pass with no regressions. | Atlas Dev Story |
| 2026-01-24 | Code review fix: Consolidated duplicate beforeEach/afterEach to parent describe, added helper functions to test-utils.tsx. | Atlas Code Review |
