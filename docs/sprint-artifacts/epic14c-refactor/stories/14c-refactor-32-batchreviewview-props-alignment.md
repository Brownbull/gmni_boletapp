# Story 14c-refactor.32: BatchReviewView Props Interface Alignment

Status: split

> **SPLIT 2026-01-23** via atlas-story-sizing workflow
> **Reason:** 4 tasks + 15 subtasks at LARGE sizing limit; splitting for consistency with Stories 30/31
> **Split strategy:** by_phase (interface → hook → integration)
> **Sub-stories:** 32a (interface rename), 32b (hook expansion), 32c (integration verification)

## Story

As a **developer maintaining App.tsx**,
I want **BatchReviewView's props interface to match useBatchReviewViewProps hook output names**,
So that **App.tsx can use direct spreading `<BatchReviewView {...batchReviewViewProps} />`**.

## Background

### The Problem (from Story 29 FR)

BatchReviewView has a composition hook but still requires manual prop mapping in App.tsx.

### Current State

BatchReviewView rendering requires inline props alongside hook output.

### Target State

```tsx
{view === 'batch-review' && <BatchReviewView {...batchReviewViewProps} />}
```

## Acceptance Criteria

1. **Given** useBatchReviewViewProps exists with partial coverage
   **When** this story is completed
   **Then:**
   - Hook includes ALL props required by BatchReviewView
   - Interface names match between hook output and view input

2. **Given** App.tsx has inline props for BatchReviewView
   **When** this story is completed
   **Then:**
   - BatchReviewView renders with single spread
   - App.tsx reduced by estimated ~15-20 lines
   - Tests pass

## Tasks / Subtasks

### Task 1: Audit BatchReviewViewProps Interface

- [ ] 1.1 Open `src/views/BatchReviewView.tsx`
- [ ] 1.2 Document all props in interface
- [ ] 1.3 Identify naming mismatches with hook
- [ ] 1.4 Identify missing props in hook

### Task 2: Update useBatchReviewViewProps Hook

- [ ] 2.1 Open `src/hooks/app/useBatchReviewViewProps.ts`
- [ ] 2.2 Add all missing props to options interface
- [ ] 2.3 Add all missing props to return type
- [ ] 2.4 Ensure naming matches view expectations

### Task 3: Update App.tsx Integration

- [ ] 3.1 Update hook call with new options
- [ ] 3.2 Replace inline props with spread
- [ ] 3.3 Verify rendering

### Task 4: Update Tests & Verification

- [ ] 4.1 Update hook tests
- [ ] 4.2 Run full test suite
- [ ] 4.3 Manual smoke test batch review flow
- [ ] 4.4 Verify edit/save/discard work

## Dev Notes

### Estimation

- **Points:** 3 pts
- **Risk:** LOW - BatchReviewView is simpler than History/Trends

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 35 (final line count target)

## References

- [Story 29 Feature Review](14c-refactor-29-app-prop-composition-integration.md)
- [Source: src/views/BatchReviewView.tsx]
- [Source: src/hooks/app/useBatchReviewViewProps.ts]

## File List

**Modified:**
- `src/views/BatchReviewView.tsx` - Update props interface if needed
- `src/hooks/app/useBatchReviewViewProps.ts` - Expand hook coverage
- `src/App.tsx` - Replace inline props with spread
- `tests/unit/hooks/app/useBatchReviewViewProps.test.ts` - Update tests
