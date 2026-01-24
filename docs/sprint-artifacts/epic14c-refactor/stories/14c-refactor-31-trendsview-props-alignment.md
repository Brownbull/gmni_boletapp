# Story 14c-refactor.31: TrendsView Props Interface Alignment

Status: split

<!-- SPLIT on 2026-01-23 via atlas-story-sizing workflow -->
<!-- This story exceeded sizing limits (5 tasks, 17 subtasks) and was split into: -->
<!-- - 31a: TrendsView Interface Rename (2 pts) -->
<!-- - 31b: useTrendsViewProps Hook Expansion (2 pts) -->
<!-- - 31c: TrendsView Integration & Verification (2 pts) -->
<!-- Total: 6 pts (was 5 pts - split enables cleaner implementation) -->

## Story

As a **developer maintaining App.tsx**,
I want **TrendsView's props interface to match useTrendsViewProps hook output names**,
So that **App.tsx can use direct spreading `<TrendsView {...trendsViewProps} />` and reduce inline prop code**.

## Background

### The Problem (from Story 29 FR)

Similar to HistoryView, TrendsView has naming mismatches and missing props in the composition hook that prevent direct spreading.

### Current State

TrendsView rendering in App.tsx still has inline props that should come from the composition hook:

```tsx
{view === 'trends' && (
    <TrendsView
        {...trendsViewDataProps}
        // Additional inline props not in hook
        colorTheme={colorTheme}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        // ... more inline props
    />
)}
```

### Target State

```tsx
{view === 'trends' && <TrendsView {...trendsViewProps} />}
```

## Acceptance Criteria

1. **Given** useTrendsViewProps exists with partial coverage
   **When** this story is completed
   **Then:**
   - Hook includes ALL props required by TrendsView
   - No inline props needed in App.tsx
   - Interface names match between hook output and view input

2. **Given** TrendsView has deprecated handler props
   **When** this story is completed
   **Then:**
   - Deprecated props removed from interface (onBack, onNavigateToView, onNavigateToHistory)
   - View uses useViewHandlers() internally (already done in Story 27)

3. **Given** App.tsx has inline props for TrendsView
   **When** this story is completed
   **Then:**
   - TrendsView renders with single spread
   - App.tsx reduced by estimated ~25-30 lines
   - Tests pass

## Tasks / Subtasks

### Task 1: Audit TrendsViewProps Interface

- [ ] 1.1 Open `src/views/TrendsView.tsx`
- [ ] 1.2 Document all props in interface
- [ ] 1.3 Identify naming mismatches with hook
- [ ] 1.4 Identify missing props in hook

### Task 2: Update useTrendsViewProps Hook

- [ ] 2.1 Open `src/hooks/app/useTrendsViewProps.ts`
- [ ] 2.2 Add all missing props to options interface
- [ ] 2.3 Add all missing props to return type
- [ ] 2.4 Ensure naming matches view expectations

### Task 3: Update TrendsViewProps Interface (if needed)

- [ ] 3.1 Rename any props to cleaner names (if applicable)
- [ ] 3.2 Remove deprecated props from interface
- [ ] 3.3 Update internal usages

### Task 4: Update App.tsx Integration

- [ ] 4.1 Update hook call with new options
- [ ] 4.2 Replace inline props with spread
- [ ] 4.3 Verify rendering

### Task 5: Update Tests & Verification

- [ ] 5.1 Update hook tests
- [ ] 5.2 Run full test suite
- [ ] 5.3 Manual smoke test TrendsView
- [ ] 5.4 Verify chart interactions work
- [ ] 5.5 Verify drill-down navigation works

## Dev Notes

### Estimation

- **Points:** 5 pts
- **Risk:** MEDIUM - TrendsView has complex interactions

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 35 (final line count target)

### TrendsView Complexity

TrendsView is the most complex view with:
- Multiple chart types (polygon, donut, bar, sankey)
- Drill-down navigation
- Period comparison
- Filter interactions

Ensure all these features continue working after prop changes.

## References

- [Story 29 Feature Review](14c-refactor-29-app-prop-composition-integration.md)
- [Source: src/views/TrendsView.tsx]
- [Source: src/hooks/app/useTrendsViewProps.ts]

## File List

**Modified:**
- `src/views/TrendsView.tsx` - Update props interface
- `src/hooks/app/useTrendsViewProps.ts` - Expand hook coverage
- `src/App.tsx` - Replace inline props with spread
- `tests/unit/hooks/app/useTrendsViewProps.test.ts` - Update tests
