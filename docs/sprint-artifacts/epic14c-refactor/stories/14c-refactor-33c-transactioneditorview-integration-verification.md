# Story 14c-refactor.33c: TransactionEditorView Integration & Verification

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **TransactionEditorView to render with a single spread `{...transactionEditorViewProps}`**,
So that **App.tsx is reduced by ~35-40 lines and follows the view composition pattern**.

## Background

### Split Origin

This story is **Part C of a 3-part split** from Story 14c-refactor.33 (TransactionEditorView Props Interface Alignment).

- **33a**: Interface audit & documentation - DONE (dependency)
- **33b**: Hook expansion to cover all props - DONE (dependency)
- **33c** (this story): App.tsx integration & verification

### Target State

**Before (current):**
```tsx
{view === 'edit' && (
    <TransactionEditorView
        {...transactionEditorViewDataProps}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        onSaveCategoryMapping={saveMapping}
        onSaveMerchantMapping={saveMerchantMapping}
        onSaveSubcategoryMapping={saveSubcategoryMapping}
        onSaveItemNameMapping={saveItemNameMapping}
        // ... 20+ more props
    />
)}
```

**After:**
```tsx
{view === 'edit' && <TransactionEditorView {...transactionEditorViewProps} />}
```

## Acceptance Criteria

1. **Given** Stories 33a and 33b are complete
   **When** this story is completed
   **Then:**
   - TransactionEditorView renders with single spread
   - App.tsx reduced by ~35-40 lines
   - No inline props remain

2. **Given** TransactionEditorView has complex interactions
   **When** this story is completed
   **Then:**
   - All functionality verified via manual smoke test
   - All learning prompts work correctly
   - Save/delete/cancel work correctly

3. **Given** test suite must pass
   **When** this story is completed
   **Then:**
   - Full test suite passes (`npm test`)
   - No TypeScript errors

## Tasks / Subtasks

### Task 1: Update App.tsx Hook Call

- [x] 1.1 Update `useTransactionEditorViewProps` call with all new options
- [x] 1.2 Pass all required callbacks (from 33b interface)
- [x] 1.3 Pass all required data props
- [x] 1.4 Verify TypeScript compilation

### Task 2: Replace Inline Props with Spread

- [x] 2.1 Remove all inline props from TransactionEditorView rendering
- [x] 2.2 Replace with single spread: `{...transactionEditorViewProps}`
- [x] 2.3 Verify rendering works in browser

### Task 3: Run Tests & Verification

- [x] 3.1 Run full test suite: `npm test`
- [x] 3.2 Fix any failing tests (N/A - pre-existing DashboardView failures unrelated)
- [x] 3.3 Manual smoke test: PASSED 2026-01-23
  - [x] Create new transaction (verify fields)
  - [x] Edit existing transaction (verify load)
  - [x] Save with category learning prompt
  - [x] Save with merchant learning prompt
  - [x] Delete transaction
  - [x] Cancel editing
- [x] 3.4 Verify all learning prompt callbacks fire correctly (via hook tests)

### Task 4: Measure Line Reduction

- [x] 4.1 Count lines before change
- [x] 4.2 Count lines after change
- [x] 4.3 Document reduction in Completion Notes

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Integration only, hook already covers all props

### Dependencies

- **Requires:** Story 33a (interface audit) - MUST BE DONE
- **Requires:** Story 33b (hook expansion) - MUST BE DONE
- **Blocks:** Story 35 (final line count target)

### Smoke Test Checklist

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Create new transaction | Tap FAB → scan → save | Transaction created |
| Edit existing | Tap transaction in History | Editor loads with data |
| Category learning | Edit category → save | Learning prompt appears |
| Merchant learning | Edit merchant → save | Learning prompt appears |
| Delete transaction | Tap delete → confirm | Transaction deleted |
| Cancel editing | Tap back/cancel | Returns to previous view |
| Mapping save | Save with "Remember this" | Mapping persisted |

### Expected Line Reduction

- Current inline props: ~40 lines
- After spread: ~1 line
- **Net reduction: ~39 lines**

## References

- [Story 33a](14c-refactor-33a-transactioneditorview-interface-rename.md) - Props inventory
- [Story 33b](14c-refactor-33b-transactioneditorview-hook-expansion.md) - Hook expansion
- [Parent Story 33](14c-refactor-33-transactioneditorview-props-alignment.md)
- [Pattern: Story 30c, 31c, 32c - Integration approach]

## File List

**Modified:**
- `src/App.tsx` - Update hook call + replace inline props with spread
- `src/hooks/app/useTransactionEditorViewProps.ts` - Made required callbacks required (not optional)

**Verification Only:**
- `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts` - Run tests (46 tests pass)

## Completion Notes

**Date:** 2026-01-23

### Implementation Summary

1. **Extracted 12 callback handlers** from inline JSX to named `useCallback`/`useMemo` functions:
   - `handleEditorUpdateTransaction`
   - `handleEditorSave`
   - `handleEditorCancel`
   - `handleEditorPhotoSelect`
   - `handleEditorProcessScan`
   - `handleEditorRetry`
   - `handleEditorRescan` (conditional via useMemo)
   - `handleEditorDelete` (conditional via useMemo)
   - `handleEditorBatchPrevious` (conditional via useMemo)
   - `handleEditorBatchNext` (conditional via useMemo)
   - `handleEditorBatchModeClick`
   - `handleEditorGroupsChange`

2. **Updated hook call** to pass all 17 callbacks to `useTransactionEditorViewProps`

3. **Replaced 238 lines of inline JSX** with single spread pattern:
   ```tsx
   {view === 'transaction-editor' && (
       <TransactionEditorView
           key={scanState.batchEditingIndex !== null ? `batch-${scanState.batchEditingIndex}` : 'single'}
           {...transactionEditorViewProps}
       />
   )}
   ```

4. **Updated hook types** to make required callbacks required (not optional):
   - `onUpdateTransaction`, `onSave`, `onCancel` (required)
   - `onPhotoSelect`, `onProcessScan`, `onRetry` (required)
   - `onSaveMapping`, `onSaveMerchantMapping`, `onSaveSubcategoryMapping`, `onSaveItemNameMapping` (required)
   - `onBatchModeClick`, `onGroupsChange`, `onRequestEdit` (required)
   - `onDelete`, `onRescan`, `onBatchPrevious`, `onBatchNext` (optional - context-dependent)

### Line Reduction

- **Before:** 4217 lines
- **After:** 4206 lines
- **Net reduction:** 11 lines (render section: ~230 lines reduced, handlers added: ~215 lines)

Note: The story estimated ~35-40 lines reduction for inline props only. The actual implementation extracted complex inline handlers (~200 lines) to named callback functions, resulting in a smaller net reduction but much cleaner render section.

### Test Results

- **Hook tests:** 46/46 passing
- **Full test suite:** 5903/5909 passing (6 pre-existing DashboardView failures unrelated to this story)
- **TypeScript:** No errors

### Pattern Compliance

This story follows the same single-spread pattern established in:
- Story 30c (HistoryView)
- Story 31c (TrendsView)
- Story 32c (BatchReviewView)
