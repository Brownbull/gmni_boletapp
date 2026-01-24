# Story 14c-refactor.33b: TransactionEditorView Hook Expansion

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **useTransactionEditorViewProps hook to return ALL required props**,
So that **TransactionEditorView can be rendered with a single spread**.

## Background

### Split Origin

This story is **Part B of a 3-part split** from Story 14c-refactor.33 (TransactionEditorView Props Interface Alignment).

- **33a**: Interface audit & documentation - DEPENDENCY
- **33b** (this story): Hook expansion to cover all props
- **33c**: App.tsx integration & verification

### The Problem

TransactionEditorView has the most inline props of any view due to:
- Complex callback handlers for save/delete
- Learning prompt callbacks (category, merchant, subcategory, item name)
- Mapping management callbacks (save, delete, update for 4 mapping types)
- Credit system integration
- Trust merchant callbacks

The hook needs to accept all callbacks via options and pass them through.

## Acceptance Criteria

1. **Given** Story 33a identified all required props
   **When** this story is completed
   **Then:**
   - Hook includes ALL mapping-related callbacks
   - Hook includes ALL transaction operation callbacks
   - Hook includes ALL data props

2. **Given** callbacks need to be passed via hook options
   **When** this story is completed
   **Then:**
   - Hook options interface accepts all callbacks
   - Hook returns them with correct names
   - No transformation needed in App.tsx

3. **Given** hook changes require test updates
   **When** this story is completed
   **Then:**
   - Hook tests updated for new options interface
   - Tests verify all props are returned correctly

## Tasks / Subtasks

### Task 1: Expand Hook Options Interface

- [x] 1.1 Open `src/hooks/app/useTransactionEditorViewProps.ts`
- [x] 1.2 Add all mapping-related callbacks to options (4 callbacks):
  - `onSaveMapping`, `onSaveMerchantMapping`, `onSaveSubcategoryMapping`, `onSaveItemNameMapping`
  - Note: Delete callbacks not in interface (Story 33a finding)
- [x] 1.3 Add all transaction operation callbacks:
  - `onUpdateTransaction`, `onSave`, `onDelete`, `onCancel`
- [x] 1.4 Add scan handler callbacks:
  - `onPhotoSelect`, `onProcessScan`, `onRetry`, `onRescan`
- [x] 1.5 Add batch/group callbacks:
  - `onBatchPrevious`, `onBatchNext`, `onBatchModeClick`, `onGroupsChange`, `onRequestEdit`

### Task 2: Add Data Props to Hook Return

- [x] 2.1 Add all 17 callbacks to return value (passthrough)
- [x] 2.2 Ensure proper typing for all props (imported StoreCategory, ItemCategory)
- [x] 2.3 Update useMemo dependencies to include all callbacks
- [x] 2.4 Make callbacks optional for backward compatibility during transition

### Task 3: Update Hook Tests

- [x] 3.1 Open `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts`
- [x] 3.2 Add tests for new options (19 callback passthrough tests)
- [x] 3.3 Add tests for callback stability and optional undefined
- [x] 3.4 Run hook tests: `npm test useTransactionEditorViewProps` - **46 tests pass**

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** MEDIUM - Many callbacks to wire through

### Dependencies

- **Requires:** Story 33a (props inventory) - MUST BE DONE FIRST
- **Blocks:** Story 33c (App.tsx integration)

### Hook Pattern (from stories 30b/31b/32b)

```tsx
// Options interface
interface UseTransactionEditorViewPropsOptions {
  // Transaction data
  transaction: Transaction | null;
  // ... existing options ...

  // NEW: Mapping callbacks (passthrough)
  onSaveCategoryMapping: (...) => Promise<void>;
  onSaveMerchantMapping: (...) => Promise<void>;
  // ... all callbacks ...
}

// Return type should match TransactionEditorViewProps exactly
interface UseTransactionEditorViewPropsReturn {
  // All props needed by TransactionEditorView
  transaction: Transaction | null;
  onSave: (...) => Promise<void>;
  onDelete: (...) => Promise<void>;
  // ... all props ...
}
```

### Testing Expectations

- Expect 10-15 new test cases for callback passthrough
- Use vi.fn() for callback mocks
- Verify no transformation/modification of callbacks

## References

- [Story 33a](14c-refactor-33a-transactioneditorview-interface-rename.md) - Props inventory (dependency)
- [Story 33c](14c-refactor-33c-transactioneditorview-integration-verification.md) - Integration (blocks)
- [Parent Story 33](14c-refactor-33-transactioneditorview-props-alignment.md)
- [Pattern: Story 30b, 31b, 32b - Hook expansion approach]

## File List

**Modified:**
- `src/hooks/app/useTransactionEditorViewProps.ts` - Expand hook coverage
- `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts` - Update tests

---

## Dev Agent Record

### Implementation Summary

**Story 33a Gap Analysis Input:**
- 31/31 data props already covered ✅
- 17 callbacks NOT in hook needed to be added

**Callbacks Added (17 total):**

| Category | Callbacks |
|----------|-----------|
| Transaction ops (4) | `onUpdateTransaction`, `onSave`, `onCancel`, `onDelete` |
| Scan handlers (4) | `onPhotoSelect`, `onProcessScan`, `onRetry`, `onRescan` |
| Mapping callbacks (4) | `onSaveMapping`, `onSaveMerchantMapping`, `onSaveSubcategoryMapping`, `onSaveItemNameMapping` |
| Batch navigation (3) | `onBatchPrevious`, `onBatchNext`, `onBatchModeClick` |
| Group/edit (2) | `onGroupsChange`, `onRequestEdit` |

**Key Implementation Details:**
- All callbacks made **optional** in both options and return interfaces for backward compatibility
- Story 33c will wire callbacks from App.tsx
- TypeScript check passes (no breaking changes to App.tsx)
- Pattern follows Story 30b/31b/32b approach

### Completion Notes

- **Tests:** 46 tests pass (19 new callback passthrough tests added)
- **All hooks/app tests:** 352 tests pass
- **TypeScript:** No errors
- **Backward compatibility:** Maintained via optional callbacks

### Debug Log

- 2026-01-23: Loaded Atlas knowledge (04-architecture.md, 05-testing.md)
- 2026-01-23: Read Story 33a props inventory - 17 callbacks needed
- 2026-01-23: Added StoreCategory/ItemCategory imports for callback types
- 2026-01-23: Expanded options interface with 17 callbacks (all optional)
- 2026-01-23: Expanded return type with 17 callbacks (all optional)
- 2026-01-23: Updated hook destructuring and useMemo
- 2026-01-23: Added 19 callback passthrough tests (17 per-callback + 2 stability)
- 2026-01-23: TypeScript check passed, 46 tests pass

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story created via atlas-story-sizing split from 14c-refactor.33 | SM |
| 2026-01-23 | Implemented hook expansion with 17 callback passthrough | Dev |
| 2026-01-23 | Code review passed - 3 LOW issues fixed (test count 20→19), status→done | Atlas Review |
