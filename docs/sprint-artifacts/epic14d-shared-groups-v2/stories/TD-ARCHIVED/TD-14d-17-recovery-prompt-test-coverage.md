# Tech Debt Story TD-14d-17: RecoverySyncPrompt Test Coverage

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-9
> **Priority:** MEDIUM (improves test quality, enables confident refactoring)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW (additive tests, no breaking changes)

## Story

As a **developer**,
I want **comprehensive test coverage for RecoverySyncPrompt error and focus scenarios**,
So that **edge cases are verified and future refactoring is safe**.

## Problem Statement

The RecoverySyncPrompt component (Story 14d-v2-1-9) has good coverage for happy paths but lacks tests for:

1. **Error state display (T2):** When `onFullSync` rejects with an error, the component displays an error message via `syncError` state and `role="alert"`. This path is implemented but not tested.

2. **Focus management (L3):** The component implements focus trapping and restoration:
   - Focus moves to close button when dialog opens (lines 82-86)
   - Focus returns to previously focused element on close (lines 96-101)

   These behaviors are implemented but not verified by tests.

## Acceptance Criteria

### AC1: Error State Test
Given `onFullSync` is called and rejects with an error,
When the user clicks "Full Sync",
Then the error message is displayed with `role="alert"`.

### AC2: Error Retry Test
Given an error is displayed,
When the user clicks "Full Sync" again,
Then the previous error clears and a new sync attempt is made.

### AC3: Focus on Open Test
Given the dialog is closed,
When `isOpen` becomes true,
Then focus moves to the close button.

### AC4: Focus Restoration Test
Given the dialog is open and a button outside had focus,
When the dialog closes,
Then focus returns to the previously focused element.

## Tasks / Subtasks

### Task 1: Error State Tests (AC: 1, 2)

- [ ] 1.1 Add test: "displays error message when onFullSync fails"
  ```typescript
  it('displays error message when onFullSync fails', async () => {
      const error = new Error('Network error');
      const onFullSync = vi.fn().mockRejectedValue(error);
      const props = createDefaultProps({ onFullSync });
      render(<RecoverySyncPrompt {...props} />);

      await user.click(screen.getByRole('button', { name: /Full Sync/i }));

      await waitFor(() => {
          expect(screen.getByTestId('recovery-sync-error')).toBeInTheDocument();
          expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
  });
  ```
- [ ] 1.2 Add test: "clears error and retries when clicking Full Sync again"

### Task 2: Focus Management Tests (AC: 3, 4)

- [ ] 2.1 Add test: "focuses close button when dialog opens"
- [ ] 2.2 Add test: "restores focus to previously focused element when dialog closes"
- [ ] 2.3 Verify tests work with `userEvent` timing

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer to TD Story |
|--------|--------|-------------------|
| **Merge conflict risk** | Low - additive tests | Low - isolated work |
| **Context window fit** | Would extend current story | Clean separation |
| **Sprint capacity** | Uses current sprint time | Scheduled for later |
| **Accumulation risk** | Resolved immediately | Minimal - tests are additive |
| **Dependency risk** | Blocks nothing | Story 2.6 may benefit from these tests |

**Recommendation:** DEFER - Tests can be added during Story 2.6 integration or as a standalone improvement.

### Dependencies

- None - can be implemented independently

### References

- [14d-v2-1-9-firestore-ttl-offline.md](./14d-v2-1-9-firestore-ttl-offline.md) - Source of this tech debt item
- ECC Review items: T2 (MEDIUM), L3 (LOW)
