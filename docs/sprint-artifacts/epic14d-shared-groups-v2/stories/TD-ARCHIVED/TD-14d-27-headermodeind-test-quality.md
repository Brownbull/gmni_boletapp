# Tech Debt Story TD-14d-27: HeaderModeIndicator Test Quality Improvements

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10c
> **Priority:** Medium (HIGH severity finding + MEDIUM test quality)
> **Estimated Effort:** 1-2 hours
> **Risk:** Low (test-only changes)

## Story

As a **developer**,
I want **complete and precise test mocks for HeaderModeIndicator**,
So that **tests are robust against interface changes and clearly document expected behavior**.

## Problem Statement

The ECC Code Review identified several test quality issues:

1. **HIGH**: Test mock `mockGroup` is missing required `SharedGroup` properties (`appId`, `shareCode`, `shareCodeExpiresAt`, `memberUpdates`). Uses `as never` casting which may cause issues if tests are refactored.

2. **MEDIUM**: Test assertion for truncation at line 196-198 checks `textContent?.length <= 18` but could be more explicit about expected output being exactly `'My Very Long Gr...'` (18 characters).

3. **LOW**: No explicit test for Enter/Space key activation calling `onOpen`. While native button behavior is relied upon (correct), explicit testing would document the expected behavior.

4. **LOW**: Mock returns `isGroupMode` but component computes it locally - minor inconsistency.

## Acceptance Criteria

1. **Given** the test mock for `SharedGroup`
   **When** I review the mock definition
   **Then** all required properties from the interface are present (no `as never` casting)

2. **Given** the truncation test
   **When** I review the assertion
   **Then** it explicitly expects `'My Very Long Gr...'` (exact match)

3. **Given** the keyboard accessibility tests
   **When** I run the test suite
   **Then** there are explicit tests for Enter and Space key activation

## Tasks / Subtasks

- [ ] Task 1: Complete SharedGroup mock
  - [ ] Add `appId`, `shareCode`, `shareCodeExpiresAt`, `memberUpdates` properties
  - [ ] Remove `as never` casting from timestamp mocks
  - [ ] Verify tests still pass

- [ ] Task 2: Improve truncation test precision
  - [ ] Change assertion to `expect(name).toHaveTextContent('My Very Long Gr...')`
  - [ ] Add exact length check: `expect(name.textContent).toBe('My Very Long Gr...')`

- [ ] Task 3: Add keyboard activation tests
  - [ ] Add test: "calls onOpen when Enter key is pressed"
  - [ ] Add test: "calls onOpen when Space key is pressed"
  - [ ] Use `fireEvent.keyDown` or user-event library

- [ ] Task 4: Clean up mock inconsistency
  - [ ] Remove unused `isGroupMode` from mock return (component computes locally)

## Dev Notes

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/features/shared-groups/components/HeaderModeIndicator.test.tsx` | Modify | Fix all test quality issues |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low | Low - test file only |
| **Context window fit** | Easy | Easy |
| **Sprint capacity** | 1-2 hrs | Scheduled for later |
| **Accumulation risk** | Low | May compound if interface changes |
| **Dependency risk** | None | None |

**Recommendation:** Defer - tests pass and provide good coverage. Fix during next refactor.

### References

- [14d-v2-1-10c-header-mode-indicator.md](./14d-v2-1-10c-header-mode-indicator.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Code Reviewer agent
