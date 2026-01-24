# Story 14c-refactor.33a: TransactionEditorView Interface Rename

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **TransactionEditorView's props interface audited and documented**,
So that **I know exactly which props need hook coverage for direct spreading**.

## Background

### Split Origin

This story is **Part A of a 3-part split** from Story 14c-refactor.33 (TransactionEditorView Props Interface Alignment).

Original story had 4 tasks + 16 subtasks which exceeded the sizing guideline limit of 15 subtasks. Split via `atlas-story-sizing` workflow on 2026-01-23 using the `by_phase` strategy:

- **33a** (this story): Interface audit & documentation
- **33b**: Hook expansion to cover all props
- **33c**: App.tsx integration & verification

### The Problem (from Parent Story)

TransactionEditorView has the most callbacks of any view:
- Transaction CRUD: onSave, onDelete, onCancel
- Navigation: onBack, onNavigateToView
- Mapping saves: category, merchant, subcategory, item name (4)
- Mapping deletes: category, merchant, subcategory, item name (4)
- Mapping updates: category, merchant, subcategory, item name (4)
- Learning prompt responses
- Trust merchant callbacks

The hook `useTransactionEditorViewProps` needs to return all of these.

## Acceptance Criteria

1. **Given** TransactionEditorView has a complex props interface
   **When** this story is completed
   **Then:**
   - ALL props are documented with their types
   - Props are categorized: data vs callback vs config
   - Current hook coverage is identified

2. **Given** some props may have naming mismatches
   **When** this story is completed
   **Then:**
   - Any naming differences between interface and hook are documented
   - Recommended renames are listed for Story 33b

## Tasks / Subtasks

### Task 1: Audit TransactionEditorViewProps Interface

- [x] 1.1 Open `src/views/TransactionEditorView.tsx`
- [x] 1.2 Document ALL props in interface (expect 30+) - **Found 50 props total**
- [x] 1.3 Categorize props:
  - Data props (transaction, mappings, etc.)
  - Callback props (onSave, onDelete, etc.)
  - Config props (isLoading, showLearningPrompt, etc.)
- [x] 1.4 Create props inventory table in Dev Notes

### Task 2: Identify Hook Gaps

- [x] 2.1 Open `src/hooks/app/useTransactionEditorViewProps.ts`
- [x] 2.2 List what the hook currently returns - **31 data props**
- [x] 2.3 Identify missing props (what hook doesn't cover) - **17 active callbacks + 2 deprecated**
- [x] 2.4 Document naming mismatches (if any) - **None found**
- [x] 2.5 Update story with gap analysis for Story 33b

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Documentation and analysis only

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 33b (hook expansion needs gap analysis)

---

## Props Inventory (TransactionEditorViewProps)

**Source:** `src/views/TransactionEditorView.tsx` lines 108-253

**Total Props: 50** (31 data/config + 2 utility functions + 17 callbacks + 2 deprecated)

### Data Props (29 props)

| # | Prop Name | Type | Category | Hook Coverage |
|---|-----------|------|----------|---------------|
| 1 | `transaction` | `Transaction \| null` | Data | ✅ hook |
| 2 | `mode` | `'new' \| 'existing'` | Config | ✅ hook |
| 3 | `readOnly` | `boolean?` | Config | ✅ hook |
| 4 | `isOtherUserTransaction` | `boolean?` | Config | ✅ hook |
| 5 | `ownerProfile` | `{ displayName?, photoURL? }?` | Data | ✅ hook |
| 6 | `ownerId` | `string?` | Data | ✅ hook |
| 7 | `scanButtonState` | `ScanButtonState` | Data | ✅ hook |
| 8 | `isProcessing` | `boolean` | Data | ✅ hook |
| 9 | `processingEta` | `number \| null?` | Data | ✅ hook |
| 10 | `scanError` | `string \| null?` | Data | ✅ hook |
| 11 | `skipScanCompleteModal` | `boolean?` | Config | ✅ hook |
| 12 | `thumbnailUrl` | `string?` | Data | ✅ hook |
| 13 | `pendingImageUrl` | `string?` | Data | ✅ hook |
| 14 | `isRescanning` | `boolean?` | Data | ✅ hook |
| 15 | `theme` | `'light' \| 'dark'` | Config | ✅ hook |
| 16 | `currency` | `string` | Data | ✅ hook |
| 17 | `lang` | `Language` | Config | ✅ hook |
| 18 | `credits` | `UserCredits` | Data | ✅ hook |
| 19 | `storeCategories` | `string[]` | Data | ✅ hook |
| 20 | `distinctAliases` | `string[]?` | Data | ✅ hook |
| 21 | `batchContext` | `{ index, total } \| null?` | Data | ✅ hook |
| 22 | `defaultCity` | `string?` | Data | ✅ hook |
| 23 | `defaultCountry` | `string?` | Data | ✅ hook |
| 24 | `isSaving` | `boolean?` | Data | ✅ hook |
| 25 | `animateItems` | `boolean?` | Config | ✅ hook |
| 26 | `creditUsed` | `boolean?` | Data | ✅ hook |
| 27 | `itemNameMappings` | `ItemNameMapping[]?` | Data | ✅ hook |
| 28 | `availableGroups` | `GroupWithMeta[]?` | Data | ✅ hook |
| 29 | `groupsLoading` | `boolean?` | Data | ✅ hook |

### Utility Function Props (2 props)

| # | Prop Name | Type | Hook Coverage |
|---|-----------|------|---------------|
| 30 | `t` | `(key: string) => string` | ✅ hook |
| 31 | `formatCurrency` | `(amount, currency) => string` | ✅ hook |

### Callback Props - NOT in Hook (17 props)

| # | Prop Name | Type | Source |
|---|-----------|------|--------|
| 32 | `onUpdateTransaction` | `(tx: Transaction) => void` | App.tsx state |
| 33 | `onSave` | `(tx: Transaction) => Promise<void>` | useTransactionHandlers |
| 34 | `onCancel` | `() => void` | useNavigationHandlers |
| 35 | `onPhotoSelect` | `(file: File) => void` | useScanHandlers |
| 36 | `onProcessScan` | `() => void` | useScanHandlers |
| 37 | `onRetry` | `() => void` | useScanHandlers |
| 38 | `onRescan` | `() => Promise<void>?` | useScanHandlers |
| 39 | `onDelete` | `(id: string) => void?` | useTransactionHandlers |
| 40 | `onSaveMapping` | `(item, cat, source?) => Promise<string>?` | App.tsx inline |
| 41 | `onSaveMerchantMapping` | `(orig, target, cat?) => Promise<string>?` | App.tsx inline |
| 42 | `onSaveSubcategoryMapping` | `(item, subcat, source?) => Promise<string>?` | App.tsx inline |
| 43 | `onSaveItemNameMapping` | `(merchant, orig, target, cat?) => Promise<string>?` | App.tsx inline |
| 44 | `onBatchPrevious` | `() => void?` | ScanContext/App.tsx |
| 45 | `onBatchNext` | `() => void?` | ScanContext/App.tsx |
| 46 | `onBatchModeClick` | `() => void?` | App.tsx |
| 47 | `onGroupsChange` | `(groupIds: string[]) => void?` | App.tsx |
| 48 | `onRequestEdit` | `() => void?` | App.tsx |

### Deprecated Props (2 props) - Use ViewHandlersContext

| # | Prop Name | Replacement |
|---|-----------|-------------|
| 49 | `onShowToast` | `useViewHandlers().dialog.showToast` |
| 50 | `onCreditInfoClick` | `useViewHandlers().dialog.openCreditInfoModal` |

---

## Gap Analysis Summary

### Hook Coverage: 31/31 Data Props ✅ COMPLETE

The `useTransactionEditorViewProps` hook already returns **ALL data props** needed by the interface. No naming mismatches were found.

**Note:** Hook internally transforms `creditUsedInSession` (from deps) → `creditUsed` (in output). This is an intentional transformation for view consumption, not a mismatch.

### Callbacks NOT in Hook (by design)

**17 callbacks** are passed directly from App.tsx or handler hooks:

| Source | Callbacks | Count |
|--------|-----------|-------|
| App.tsx state | `onUpdateTransaction` | 1 |
| useTransactionHandlers | `onSave`, `onDelete` | 2 |
| useNavigationHandlers | `onCancel` | 1 |
| useScanHandlers | `onPhotoSelect`, `onProcessScan`, `onRetry`, `onRescan` | 4 |
| App.tsx inline (mapping) | `onSaveMapping`, `onSaveMerchantMapping`, `onSaveSubcategoryMapping`, `onSaveItemNameMapping` | 4 |
| App.tsx/ScanContext | `onBatchPrevious`, `onBatchNext`, `onBatchModeClick` | 3 |
| App.tsx | `onGroupsChange`, `onRequestEdit` | 2 |

---

## Recommendations for Story 33b

### Option A: Minimal Changes (Recommended)

Since the hook already covers ALL data props, Story 33b should focus on:

1. **Add callback props to the hook** that aren't already in ViewHandlersContext:
   - Mapping callbacks (4): `onSaveMapping`, `onSaveMerchantMapping`, `onSaveSubcategoryMapping`, `onSaveItemNameMapping`
   - Batch navigation (3): `onBatchPrevious`, `onBatchNext`, `onBatchModeClick`
   - Transaction update: `onUpdateTransaction`
   - Group handling: `onGroupsChange`, `onRequestEdit`

2. **Callbacks already in handler hooks** (no changes needed):
   - `onSave`, `onDelete` → useTransactionHandlers
   - `onCancel` → useNavigationHandlers
   - `onPhotoSelect`, `onProcessScan`, `onRetry`, `onRescan` → useScanHandlers

### Option B: Create Dedicated Mapping Handlers Hook

Create `useTransactionMappingHandlers` hook for the 4 mapping callbacks, keeping the hook responsibility focused.

**Why Option A is Recommended:** Mapping callbacks are tightly coupled to TransactionEditorView and don't warrant a separate abstraction. Creating a dedicated hook would add complexity without clear separation-of-concerns benefit. The 4 mapping callbacks are only used by this view.

### Interface Changes: NONE REQUIRED

Unlike HistoryView (which needed prop renames), TransactionEditorView's interface already aligns with the hook output names. No interface changes are needed.

---

## Correction from Parent Story Estimate

The parent story estimated:
- "Mapping deletes (4)" - **NOT FOUND** in interface
- "Mapping updates (4)" - **NOT FOUND** in interface
- "Trust merchant callbacks" - **NOT FOUND** in interface
- "onBack, onNavigateToView" - **NOT FOUND** - Uses `onCancel` instead

The actual interface is simpler than estimated. Total callbacks: **17** (not 20+).

---

### Deliverables

1. ✅ Props inventory table added to this story's Dev Notes section
2. ✅ Gap analysis identifying what's missing from hook
3. ✅ Clear input for Story 33b implementation

## References

- [Parent Story 33](14c-refactor-33-transactioneditorview-props-alignment.md)
- [Source: src/views/TransactionEditorView.tsx]
- [Source: src/hooks/app/useTransactionEditorViewProps.ts]
- [Atlas Sizing Pattern: Story 30/31/32 props alignment split]
- Created via `atlas-story-sizing` workflow on 2026-01-23 using `by_phase` strategy

## File List

**Read-Only (Analysis):**
- `src/views/TransactionEditorView.tsx` - Audit props interface (lines 108-253)
- `src/hooks/app/useTransactionEditorViewProps.ts` - Identify gaps (lines 152-195)

> **Note:** Git shows modifications to these files from Stories 26, 27 in same epic. This story performed read-only analysis without modifying source code.

**Modified:**
- This story file (add props inventory and gap analysis)

---

## Dev Agent Record

### Implementation Plan

1. Read TransactionEditorViewProps interface from TransactionEditorView.tsx
2. Extract and categorize all 50 props (data, callbacks, config, deprecated)
3. Read TransactionEditorDataProps from useTransactionEditorViewProps.ts
4. Compare hook output against interface requirements
5. Document findings in props inventory table and gap analysis
6. Provide clear recommendations for Story 33b

### Completion Notes

- **Props Found:** 50 total (more than expected 30+)
- **Hook Coverage:** 31/31 data props already covered ✅
- **Naming Mismatches:** None found ✅
- **Interface Changes Needed:** None (unlike HistoryView/TrendsView)
- **Key Finding:** Parent story overestimated callback complexity - actual interface is simpler
- **Story 33b Focus:** Add 10+ callback props to hook (mapping, batch nav, transaction updates)

### Debug Log

- 2026-01-23: Loaded Atlas knowledge (04-architecture.md, 05-testing.md)
- 2026-01-23: Interface at lines 108-253 (145 lines)
- 2026-01-23: Hook already returns all data props via TransactionEditorDataProps
- 2026-01-23: Deprecated props identified: onShowToast, onCreditInfoClick
- 2026-01-23: Analysis complete - no code changes, documentation only

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story created via atlas-story-sizing split from 14c-refactor.33 | SM |
| 2026-01-23 | Completed props inventory (50 props) and gap analysis | Dev |
| 2026-01-23 | Code review: Fixed 5 issues (1 MEDIUM, 4 LOW) - task clarity, transformation note, file list note, option rationale, split reference | Atlas Review |
