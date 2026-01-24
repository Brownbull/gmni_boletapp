# Story 14c-refactor.31a: TrendsView Interface Rename

Status: done

<!-- Split from Story 14c-refactor.31 via atlas-story-sizing workflow (2026-01-23) -->

## Story

As a **developer maintaining App.tsx**,
I want **TrendsViewProps interface names audited and cleaned up**,
So that **the interface is ready for direct spreading from the composition hook**.

## Background

### Split Context

This story is Part 1 of 3 from the original Story 31 split:
- **31a (this):** Interface audit and cleanup
- **31b:** Hook expansion
- **31c:** Integration and verification

### The Problem

TrendsView has naming mismatches between its props interface and the useTrendsViewProps hook output. Before the hook can be expanded (Story 31b), the interface needs to be audited and cleaned up.

### TrendsView Complexity Note

TrendsView is the most complex view with:
- Multiple chart types (polygon, donut, bar, sankey)
- Drill-down navigation
- Period comparison
- Filter interactions

Changes to the interface must preserve all functionality.

## Acceptance Criteria

1. **Given** TrendsViewProps interface exists
   **When** this story is completed
   **Then:**
   - All props documented with current names
   - Naming mismatches identified and renamed to cleaner names
   - Deprecated handler props removed (onBack, onNavigateToView, onNavigateToHistory)
   - Internal usages updated to match

2. **Given** TrendsView uses useViewHandlers() internally (from Story 27)
   **When** deprecated props are removed
   **Then:**
   - View continues to compile and function
   - Navigation still works via context

## Tasks / Subtasks

### Task 1: Audit TrendsViewProps Interface (AC: #1)

- [x] 1.1 Open `src/views/TrendsView.tsx`
- [x] 1.2 Document all props in interface (create props inventory list)
- [x] 1.3 Identify naming mismatches with hook output
- [x] 1.4 Identify deprecated props to remove

### Task 2: Update TrendsViewProps Interface (AC: #1, #2)

- [x] 2.1 Rename any props to cleaner names (if applicable) - NONE NEEDED
- [x] 2.2 Remove deprecated props from interface (onBack, onNavigateToView, onNavigateToHistory)
- [x] 2.3 Update internal usages within TrendsView.tsx
- [x] 2.4 Verify TypeScript compilation passes

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Interface changes only, no business logic

### Dependencies

- **Requires:** Story 27 (ViewHandlersContext) - DONE
- **Blocks:** Story 31b (hook expansion needs clean interface)

### Deprecated Props to Remove

Based on Story 27 context migration:
- `onBack` - replaced by useViewHandlers().navigation.navigateBack
- `onNavigateToView` - replaced by useViewHandlers().navigation.navigateToView
- `onNavigateToHistory` - replaced by useViewHandlers().navigation.handleNavigateToHistory

### References

- [Story 27: View Context Migration](14c-refactor-27-view-context-migration.md)
- [Story 31 (original, split)](14c-refactor-31-trendsview-props-alignment.md)
- [Source: src/views/TrendsView.tsx]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging required

### Completion Notes List

1. **Props Inventory (Task 1.2):** Documented all 23 props in TrendsViewProps interface
2. **Naming Mismatches (Task 1.3):** No naming mismatches found - data props already match hook output names
3. **Deprecated Props Removed (Task 2.2):**
   - Removed `onNavigateToHistory` prop (lines 219-222)
   - Removed `onBack` prop (lines 223-227)
   - Removed `onNavigateToView` prop (lines 232-233)
4. **Internal Usages Updated (Task 2.3):**
   - Added `navigateToView = navigation.navigateToView` from context
   - Updated `handleProfileNavigate` to use `navigateToView` instead of `onNavigateToView` prop
5. **TypeScript Compilation:** PASSED with no errors
6. **Tests:** 5099 tests pass (6 failing are pre-existing DashboardView pagination issues tracked in story 14c-refactor-36)

### File List

**Modified:**
- `src/views/TrendsView.tsx` - Removed deprecated props from interface, updated internal usages
- `src/components/App/viewRenderers.tsx` - Updated migration status table to include onNavigateToView

## Code Review Fixes

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| Type Safety - `as any` cast | LOW | Replaced `view as any` with `view as View` and added proper View type import |

**Additional file modified during code review:**
- `src/views/TrendsView.tsx` - Added View type import, replaced `as any` with `as View`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story implemented - removed 3 deprecated props, verified functionality | Dev Agent (Opus 4.5) |
| 2026-01-23 | Code review APPROVED - Fixed LOW-1 (as any cast) | Atlas Code Review (Opus 4.5) |
