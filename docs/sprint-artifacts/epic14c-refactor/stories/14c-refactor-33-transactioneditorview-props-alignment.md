# Story 14c-refactor.33: TransactionEditorView Props Interface Alignment

Status: split

## Split Notice

**SPLIT 2026-01-23** via `atlas-story-sizing` workflow.

**Reason:** 4 tasks + 16 subtasks exceeded sizing guideline (max 15 subtasks).

**Split Strategy:** `by_phase` (consistent with stories 30, 31, 32)

**Sub-Stories Created:**
- [33a - Interface Rename](14c-refactor-33a-transactioneditorview-interface-rename.md) - 2 pts
- [33b - Hook Expansion](14c-refactor-33b-transactioneditorview-hook-expansion.md) - 2 pts
- [33c - Integration & Verification](14c-refactor-33c-transactioneditorview-integration-verification.md) - 2 pts

**Total:** 6 pts (was 5 pts - minor increase for split overhead)

---

## Original Content (Archived)

## Story

As a **developer maintaining App.tsx**,
I want **TransactionEditorView's props interface to match useTransactionEditorViewProps hook output names**,
So that **App.tsx can use direct spreading `<TransactionEditorView {...transactionEditorViewProps} />`**.

## Background

### The Problem (from Story 29 FR)

TransactionEditorView has a composition hook but requires the most inline props of any view due to:
- Complex callback handlers for save/delete
- Learning prompt callbacks (category, merchant, subcategory, item name)
- Mapping management callbacks
- Credit system integration

### Current State

TransactionEditorView rendering has extensive inline props:

```tsx
{view === 'edit' && (
    <TransactionEditorView
        {...transactionEditorViewDataProps}
        // Many additional inline callbacks
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

### Target State

```tsx
{view === 'edit' && <TransactionEditorView {...transactionEditorViewProps} />}
```

## Acceptance Criteria

1. **Given** useTransactionEditorViewProps exists with partial coverage
   **When** this story is completed
   **Then:**
   - Hook includes ALL props required by TransactionEditorView
   - All mapping callbacks included
   - All learning prompt callbacks included

2. **Given** TransactionEditorView has many callback props
   **When** this story is completed
   **Then:**
   - Callbacks passed through hook options
   - Hook returns them with correct names
   - No transformation needed

3. **Given** App.tsx has ~40+ inline props for TransactionEditorView
   **When** this story is completed
   **Then:**
   - TransactionEditorView renders with single spread
   - App.tsx reduced by estimated ~35-40 lines
   - Tests pass

## Tasks / Subtasks

### Task 1: Audit TransactionEditorViewProps Interface

- [ ] 1.1 Open `src/views/TransactionEditorView.tsx`
- [ ] 1.2 Document ALL props in interface (expect 30+)
- [ ] 1.3 Categorize: data props vs callback props vs config props
- [ ] 1.4 Identify what's missing in hook

### Task 2: Update useTransactionEditorViewProps Hook

- [ ] 2.1 Open `src/hooks/app/useTransactionEditorViewProps.ts`
- [ ] 2.2 Add all mapping-related callbacks to options:
  ```tsx
  onSaveCategoryMapping: (...)
  onSaveMerchantMapping: (...)
  onSaveSubcategoryMapping: (...)
  onSaveItemNameMapping: (...)
  onDeleteCategoryMapping: (...)
  // etc.
  ```
- [ ] 2.3 Add all transaction operation callbacks:
  ```tsx
  onSave: (...)
  onDelete: (...)
  onCancel: (...)
  ```
- [ ] 2.4 Add all data props:
  ```tsx
  categoryMappings
  merchantMappings
  subcategoryMappings
  itemNameMappings
  trustedMerchants
  ```
- [ ] 2.5 Return all props

### Task 3: Update App.tsx Integration

- [ ] 3.1 Update hook call with all new options
- [ ] 3.2 Replace inline props with spread
- [ ] 3.3 Verify rendering

### Task 4: Update Tests & Verification

- [ ] 4.1 Update hook tests for new interface
- [ ] 4.2 Run full test suite
- [ ] 4.3 Manual smoke test:
  - Create new transaction
  - Edit existing transaction
  - Save with category learning
  - Save with merchant learning
  - Delete transaction
- [ ] 4.4 Verify all learning prompts work

## Dev Notes

### Estimation

- **Points:** 5 pts
- **Risk:** MEDIUM - Many callbacks, complex interactions

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 35 (final line count target)

### Callback Complexity

TransactionEditorView has the most callbacks of any view:
- Transaction CRUD: onSave, onDelete, onCancel
- Navigation: onBack, onNavigateToView
- Mapping saves: category, merchant, subcategory, item name (4)
- Mapping deletes: category, merchant, subcategory, item name (4)
- Mapping updates: category, merchant, subcategory, item name (4)
- Learning prompt responses
- Trust merchant callbacks

The hook needs to accept all of these and pass them through.

## References

- [Story 29 Feature Review](14c-refactor-29-app-prop-composition-integration.md)
- [Source: src/views/TransactionEditorView.tsx]
- [Source: src/hooks/app/useTransactionEditorViewProps.ts]

## File List

**Modified:**
- `src/views/TransactionEditorView.tsx` - Update props interface if needed
- `src/hooks/app/useTransactionEditorViewProps.ts` - Expand hook coverage significantly
- `src/App.tsx` - Replace inline props with spread
- `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts` - Update tests
