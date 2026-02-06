# Tech Debt Story TD-14d-23: Fix React act() Warning in Store Tests

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-10a
> **Priority:** LOW (Warning only, tests pass)
> **Estimated Effort:** 30 min - 1 hr
> **Risk:** LOW (Cosmetic improvement, no functional impact)

## Story

As a **developer**,
I want **store tests to not produce React act() warnings**,
So that **test output is clean and potential issues are not masked**.

## Problem Statement

The test at `useViewModeStore.test.ts:414-425` calls `useViewModeStore.setState()` without wrapping it in `act()`, which can cause React testing warnings:

```
Warning: An update to TestComponent inside a test was not wrapped in act(...).
```

While the test passes, this warning:
1. Clutters test output
2. May mask other warnings
3. Indicates non-idiomatic test patterns

## Acceptance Criteria

1. **Given** the store tests run
   **When** all tests complete
   **Then** no React act() warnings are logged
   **And** all tests still pass

## Tasks / Subtasks

- [ ] Task 1: Fix act() warning in setPersonalMode test (AC: #1)
  - [ ] Wrap `useViewModeStore.setState()` call in `act()`
  - [ ] Verify test still passes
  - [ ] Verify no warnings in test output

- [ ] Task 2: Audit other tests for similar patterns (AC: #1)
  - [ ] Search for `useViewModeStore.setState` outside act() in renderHook tests
  - [ ] Fix any additional occurrences

## Dev Notes

### Current Implementation (lines 414-425)

```typescript
it('setPersonalMode action works', () => {
  const { result } = renderHook(() => useViewMode());

  // Set some state first
  useViewModeStore.setState({ groupId: 'test' });  // ❌ Not wrapped in act()

  act(() => {
    result.current.setPersonalMode();
  });

  expect(result.current.groupId).toBeNull();
});
```

### Recommended Fix

```typescript
it('setPersonalMode action works', () => {
  const { result } = renderHook(() => useViewMode());

  act(() => {
    useViewModeStore.setState({ groupId: 'test' });  // ✅ Wrapped in act()
  });

  act(() => {
    result.current.setPersonalMode();
  });

  expect(result.current.groupId).toBeNull();
});
```

### Alternative Pattern

For direct store manipulation outside React rendering, consider using the store directly without renderHook for setup:

```typescript
it('setPersonalMode action works', () => {
  // Setup: Direct store manipulation (no React involved)
  useViewModeStore.setState({ groupId: 'test' });

  // Test: React hook behavior
  const { result } = renderHook(() => useViewMode());

  act(() => {
    result.current.setPersonalMode();
  });

  expect(result.current.groupId).toBeNull();
});
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Sprint capacity | 30 min | Scheduled later |
| Accumulation risk | Low | Warnings accumulate |
| Dependency risk | None | None |

**Recommendation:** Can be done in next sprint or as part of test maintenance

### References

- [14d-v2-1-10a Story](./14d-v2-1-10a-viewmode-store-integration.md) - Source of this tech debt item
- [useViewModeStore.test.ts](../../../tests/unit/shared/stores/useViewModeStore.test.ts) - File to modify
