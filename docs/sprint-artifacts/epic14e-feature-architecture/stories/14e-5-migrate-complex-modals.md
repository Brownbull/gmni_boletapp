# Story 14e-5: Migrate Complex Modals to Modal Manager

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Status:** done
**Created:** 2026-01-24
**Completed:** 2026-01-25
**Author:** Atlas-Enhanced Create Story Workflow

---

## User Story

As a **developer**,
I want **complex modals migrated to the Modal Manager**,
So that **App.tsx render section contains no inline modal rendering and modal state is centralized**.

---

## Context

### Current State

After Story 14e-4, we have:
- `ModalManager` component rendering in App.tsx
- Simple modals migrated: `signOut`, `creditInfo`
- AppOverlays.tsx still renders 15+ overlay components including complex modals
- Complex modals have state coupling to views (HistoryView, TransactionEditorView) and contexts (ScanContext)

### Target State

Remaining non-scan modals migrated to Modal Manager:
1. All learning dialogs use Modal Manager
2. Transaction conflict dialog uses Modal Manager
3. Delete transactions modal uses Modal Manager
4. AppOverlays contains ONLY scan-related overlays (defer to Part 2)
5. ~200-300 lines of modal state/handler code removed from App.tsx and views

### Modals to Migrate (Complex Pattern)

Based on codebase analysis, these modals have complex state but are suitable for Modal Manager migration:

| Modal | Current Location | Props Pattern | Complexity |
|-------|------------------|---------------|------------|
| `transactionConflict` | AppOverlays via useDialogHandlers | isOpen, conflictData, 4 handlers | HIGH - multi-step state |
| `deleteTransactions` | HistoryView inline | selectedIds, onConfirm, onCancel | MEDIUM - selection coupling |
| `learnMerchant` | Individual views | transactionData, onSave, onDismiss | MEDIUM - timing-critical |
| `learnSubcategory` | Individual views | itemData, onSave, onDismiss | MEDIUM - timing-critical |
| `categoryLearning` | Individual views | categoryData, onSave, onDismiss | MEDIUM - timing-critical |
| `itemNameSuggestion` | Individual views | itemData, suggestions, onSave | MEDIUM - fuzzy match state |
| `insightDetail` | Not wired yet | insightId, onClose | LOW - display only |

### Modals NOT Migrated (Defer to Part 2 - Scan Feature)

| Modal | Reason | Migrate In |
|-------|--------|------------|
| `currencyMismatch` | ScanContext activeDialog system | Part 2 (14e.6-11) |
| `totalMismatch` | ScanContext activeDialog system | Part 2 (14e.6-11) |
| `quickSave` | ScanContext dialog system | Part 2 (14e.6-11) |
| `batchComplete` | ScanContext dialog system | Part 2 (14e.6-11) |
| `creditWarning` | Batch processing state coupling | Part 2 (14e.6-11) |
| `trustMerchant` | Scan flow timing-critical | Part 2 (14e.6-11) |

**Rationale:** Scan-related modals use ScanContext's `activeDialog` pattern. Migrating them requires refactoring ScanContext to use Modal Manager, which is Part 2 scope.

---

## Acceptance Criteria

### AC1: TransactionConflictDialog Migrated

**Given** TransactionConflictDialog rendered in AppOverlays.tsx
**When** this story is completed
**Then:**
- [x] TransactionConflictDialog removed from AppOverlays.tsx
- [x] TransactionConflictDialog registered in Modal Manager registry
- [x] `showConflictDialog` state in useDialogHandlers replaced with `openModal('transactionConflict', {...})`
- [x] All conflict dialog props passed through Modal Manager
- [x] Conflict resolution flow works: view conflicting, discard, or close
- [x] Props extracted to AppOverlays.tsx removed (~50 lines)

### AC2: DeleteTransactionsModal Migrated

**Given** DeleteTransactionsModal rendered inline in HistoryView.tsx
**When** this story is completed
**Then:**
- [x] DeleteTransactionsModal removed from HistoryView.tsx render section
- [x] DeleteTransactionsModal registered in Modal Manager registry
- [x] HistoryView calls `openModal('deleteTransactions', { selectedIds, onConfirm, onCancel })`
- [x] Selection state passed correctly via modal props
- [x] Bulk delete flow works: select items → delete button → confirm → delete
- [x] Modal JSX removed from HistoryView (~30 lines)

### AC3: Learning Dialogs Migrated

**Given** LearnMerchantDialog, CategoryLearningPrompt, SubcategoryLearningPrompt rendered in various views
**When** this story is completed
**Then:**
- [x] All learning dialogs registered in Modal Manager registry
- [x] Learning dialog timing preserved (appears after transaction save, before navigation)
- [x] `openModal('learnMerchant', {...})` called from appropriate handlers
- [x] Learning flow works: save transaction → learning prompt appears → user confirms → mapping saved
- [x] onSave callbacks execute correctly through Modal Manager props

### AC4: ItemNameSuggestionDialog Migrated

**Given** ItemNameSuggestionDialog for fuzzy matching item name suggestions
**When** this story is completed
**Then:**
- [x] ItemNameSuggestionDialog registered in Modal Manager registry
- [x] Suggestion list and selection state passed via modal props
- [x] Dialog appears when editing item names with suggestions available
- [x] Selection callback correctly updates item name

### AC5: AppOverlays Cleanup

**Given** migrated modals removed from AppOverlays
**When** this story is completed
**Then:**
- [x] AppOverlays.tsx only contains scan-related overlays and banners
- [x] TransactionConflictDialog removed from AppOverlays imports
- [x] Props related to migrated modals removed from AppOverlaysProps interface
- [x] ~100 lines removed from AppOverlays.tsx

### AC6: Unit Tests for Modal Migrations

**Given** migrated modals
**When** tests are run
**Then:**
- [x] Tests for TransactionConflictDialog via Modal Manager (open, close, handlers)
- [x] Tests for DeleteTransactionsModal via Modal Manager (selection, confirm, cancel)
- [x] Tests for learning dialogs via Modal Manager (timing, callbacks)
- [x] All tests pass

### AC7: No Regression in Critical Flows (Atlas Workflow Chains)

**Given** migrated modals and Modal Manager
**When** manual testing is performed
**Then:**
- [x] **Learning Flow (#5):** Edit category → prompt appears → confirm → mapping saved
- [x] **History Filter Flow (#6):** Select transactions → delete → confirm → deleted
- [x] **Single Active Transaction (#9):** New scan with pending → conflict dialog → resolve
- [x] **Trust Merchant Flow (#8):** Trust prompt still appears correctly (not migrated but not broken)
- [x] No visual or functional regressions

### AC8: Learning Dialog Timing Preserved (Atlas-Suggested)

**Given** learning dialogs migrated to Modal Manager
**When** user edits a transaction field eligible for learning
**Then:**
- [x] Learning dialog appears 300-500ms after field blur (not immediately)
- [x] Dialog does not block transaction save operation
- [x] Dialog dismisses cleanly on background tap or explicit close
- [x] Navigation after dismiss works without stale state

---

## Technical Implementation

### Step 1: Update Modal Registry

```tsx
// src/managers/ModalManager/registry.ts - Add complex modal entries

transactionConflict: React.lazy(
  () => import('@/components/dialogs/TransactionConflictDialog')
) as LazyModalComponent<'transactionConflict'>,

deleteTransactions: React.lazy(
  () => import('@/components/history/DeleteTransactionsModal')
) as LazyModalComponent<'deleteTransactions'>,

learnMerchant: React.lazy(
  () => import('@/components/dialogs/LearnMerchantDialog')
) as LazyModalComponent<'learnMerchant'>,

learnSubcategory: React.lazy(
  () => import('@/components/SubcategoryLearningPrompt')
) as LazyModalComponent<'learnSubcategory'>,

categoryLearning: React.lazy(
  () => import('@/components/CategoryLearningPrompt')
) as LazyModalComponent<'categoryLearning'>,

itemNameSuggestion: React.lazy(
  () => import('@/components/dialogs/ItemNameSuggestionDialog')
) as LazyModalComponent<'itemNameSuggestion'>,
```

### Step 2: Update Modal Types

```tsx
// src/managers/ModalManager/types.ts - Add prop types for complex modals

export interface TransactionConflictModalProps {
  isOpen: boolean;
  conflictingTransaction: ConflictingTransaction | null;
  conflictReason: ConflictReason | null;
  onContinueCurrent?: () => void;
  onViewConflicting: () => void;
  onDiscardConflicting: () => void;
  onClose: () => void;
  t: (key: string) => string;
  lang?: 'en' | 'es';
  formatCurrency?: (amount: number, currency: string) => string;
}

export interface DeleteTransactionsModalProps {
  selectedIds: string[];
  selectedTransactions: Transaction[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

export interface LearnMerchantModalProps {
  merchantName: string;
  category: string;
  subcategory?: string;
  onSave: (mapping: MerchantMapping) => Promise<void>;
  onDismiss: () => void;
  t: (key: string) => string;
}
```

### Step 3: Migrate TransactionConflictDialog

```tsx
// src/hooks/app/useDialogHandlers.ts

// Remove:
// const [showConflictDialog, setShowConflictDialog] = useState(false);
// const [conflictDialogData, setConflictDialogData] = useState<ConflictDialogData | null>(null);

// Update:
import { useModalActions } from '@managers/ModalManager';

const { openModal, closeModal } = useModalActions();

const openConflictDialog = useCallback((data: ConflictDialogData) => {
  openModal('transactionConflict', {
    isOpen: true,
    conflictingTransaction: data.conflictingTransaction,
    conflictReason: data.conflictReason,
    onContinueCurrent: () => closeModal(),
    onViewConflicting: () => {
      // Navigate to conflicting transaction
      closeModal();
      // ... existing view logic
    },
    onDiscardConflicting: () => {
      // Discard and close
      closeModal();
      // ... existing discard logic
    },
    onClose: () => closeModal(),
    t,
    lang,
    formatCurrency,
  });
}, [openModal, closeModal, t, lang, formatCurrency]);
```

### Step 4: Remove from AppOverlays

```tsx
// src/components/App/AppOverlays.tsx

// Remove from imports:
// import { TransactionConflictDialog } from '../dialogs/TransactionConflictDialog';

// Remove from AppOverlaysProps interface:
// showConflictDialog: boolean;
// conflictDialogData: ConflictDialogData | null;
// onConflictClose: () => void;
// onConflictViewCurrent: () => void;
// onConflictDiscard: () => void;

// Remove from render:
// <TransactionConflictDialog ... />
```

### Step 5: Migrate DeleteTransactionsModal

```tsx
// src/views/HistoryView.tsx

import { useModalActions } from '@managers/ModalManager';

// Inside component:
const { openModal, closeModal } = useModalActions();

const handleDeleteClick = useCallback(() => {
  openModal('deleteTransactions', {
    selectedIds: Array.from(selectedTransactionIds),
    selectedTransactions: selectedTransactions,
    onConfirm: async () => {
      await deleteTransactions(Array.from(selectedTransactionIds));
      clearSelection();
      closeModal();
    },
    onCancel: () => closeModal(),
    isDeleting: false, // Could be managed via modal state
  });
}, [openModal, closeModal, selectedTransactionIds, selectedTransactions, deleteTransactions, clearSelection]);

// Remove inline modal rendering:
// {showDeleteModal && <DeleteTransactionsModal ... />}
```

### Step 6: Migrate Learning Dialogs

Learning dialogs are typically triggered from save handlers. The key is preserving timing:

```tsx
// In transaction save handler (e.g., useTransactionHandlers.ts)

const handleSaveWithLearning = useCallback(async (transaction: Transaction, changes: Changes) => {
  // 1. Save transaction first (non-blocking)
  await saveTransaction(transaction);

  // 2. Check if learning prompt should appear
  if (shouldShowLearningPrompt(changes)) {
    // 3. Delay slightly for UX (transaction saved feedback first)
    setTimeout(() => {
      openModal('learnMerchant', {
        merchantName: transaction.merchant,
        category: transaction.category,
        subcategory: transaction.subcategory,
        onSave: async (mapping) => {
          await saveMerchantMapping(mapping);
          closeModal();
        },
        onDismiss: () => closeModal(),
        t,
      });
    }, 300);
  }
}, [saveTransaction, openModal, closeModal, saveMerchantMapping, t]);
```

---

## Tasks / Subtasks

- [x] **Task 1: Update Modal Registry & Types (AC: #1, #2, #3, #4)**
  - [x] Add all complex modal entries to registry.ts
  - [x] Add TypeScript interfaces for all modal props
  - [x] Export types from index.ts
  - [x] Verify lazy loading works for all entries

- [x] **Task 2: Migrate TransactionConflictDialog (AC: #1, #7)**
  - [x] Remove state variables from useDialogHandlers
  - [x] Create openConflictDialog using Modal Manager
  - [x] Update all call sites that set conflict dialog state
  - [x] Remove from AppOverlays.tsx imports
  - [x] Remove from AppOverlays.tsx render
  - [x] Remove props from AppOverlaysProps interface
  - [x] Test conflict resolution flow end-to-end

- [x] **Task 3: Migrate DeleteTransactionsModal (AC: #2, #7)**
  - [x] Locate DeleteTransactionsModal in HistoryView
  - [x] Update handleDeleteClick to use openModal
  - [x] Pass selection state via modal props
  - [x] Remove inline modal JSX from HistoryView
  - [x] Test bulk delete flow

- [x] **Task 4: Migrate Learning Dialogs (AC: #3, #8)**
  - [x] Identify all locations where learning dialogs are triggered
  - [x] Update LearnMerchantDialog to use Modal Manager
  - [x] Update CategoryLearningPrompt to use Modal Manager
  - [x] Update SubcategoryLearningPrompt to use Modal Manager
  - [x] Preserve timing (300-500ms delay after save)
  - [x] Test learning flow end-to-end

- [x] **Task 5: Migrate ItemNameSuggestionDialog (AC: #4)**
  - [x] Locate ItemNameSuggestionDialog usage
  - [x] Update to use Modal Manager
  - [x] Pass suggestions and handlers via modal props
  - [x] Test item name editing with suggestions

- [x] **Task 6: AppOverlays Cleanup (AC: #5)**
  - [x] Remove all migrated modal imports
  - [x] Remove all migrated modal props from interface
  - [x] Remove all migrated modal JSX
  - [x] Verify remaining overlays still work (scan-related)
  - [x] Count lines removed (~100-150 expected)

- [x] **Task 7: Write Unit Tests (AC: #6)**
  - [x] Test TransactionConflictDialog via Modal Manager
  - [x] Test DeleteTransactionsModal via Modal Manager
  - [x] Test learning dialog timing
  - [x] Test modal open/close state transitions

- [x] **Task 8: Manual Verification (AC: #7, #8)**
  - [x] Test Learning Flow (#5): Edit → prompt → confirm → saved
  - [x] Test History Filter Flow (#6): Select → delete → confirm → deleted
  - [x] Test Single Active Transaction (#9): Pending → new scan → conflict → resolve
  - [x] Verify scan dialogs still work (not migrated)
  - [x] Check for console errors - Debug logs removed
  - [x] Bug fix: Batch receipts preserved after edit+save
  - [x] Bug fix: FAB navigates to correct view for active batch scan
  - [x] Bug fix: Single scan limits to one image

---

## Dev Notes

### Migration Strategy

This story completes Part 1 of Epic 14e (Modal Manager). The key principles:

1. **Non-scan modals only** - Scan-related modals (CurrencyMismatch, TotalMismatch, QuickSave, BatchComplete) remain in AppOverlays until Part 2 (Scan Feature Extraction)

2. **Preserve timing** - Learning dialogs must appear AFTER transaction save, with slight delay (300-500ms) for better UX

3. **Handler composition** - Modal handlers (onSave, onConfirm) should:
   - Execute the business logic
   - Close the modal via `closeModal()`
   - Handle errors gracefully

4. **Props vs State** - Modal visibility is now managed by Modal Manager store, not local state. But handlers still need access to component state (selection, transaction data).

### What Remains in AppOverlays After This Story

```tsx
// AppOverlays.tsx will contain ONLY:
- NavigationBlocker (not a modal)
- PWAUpdatePrompt (not a modal)
- ScanOverlay (scan flow)
- CreditWarningDialog (batch processing)
- CurrencyMismatchDialog (scan flow)
- TotalMismatchDialog (scan flow)
- QuickSaveCard (scan flow)
- BatchCompleteModal (batch processing)
- TrustMerchantPrompt (scan flow timing)
- SessionComplete (session management)
- BatchSummary (insight display)
- InsightCard (inline banner)
- BuildingProfileCard (inline banner)
- PersonalRecordBanner (inline banner)
```

### Z-Index Compatibility

Modal Manager renders at z-50. Migrated modals should work at same layer:
- z-60: NavigationBlocker, PWAUpdatePrompt (unchanged)
- z-50: ModalManager (all migrated modals)
- z-40: Cards (QuickSave, BatchComplete, etc.) - unchanged
- z-30: Banners (Insight, PersonalRecord) - unchanged

### TransactionConflictDialog Specifics

The TransactionConflictDialog has complex handler logic:
1. `onContinueCurrent` - Close dialog, stay on current view
2. `onViewConflicting` - Navigate to conflicting transaction
3. `onDiscardConflicting` - Discard pending transaction and close

These handlers need access to navigation functions and ScanContext state. Solution: pass handlers as props to openModal, where handlers are already closures with necessary context.

### Testing Considerations

Learning dialog timing is critical. Tests should verify:
```tsx
// Timing test example
it('shows learning dialog 300-500ms after save', async () => {
  const { getByRole } = render(<Component />);

  // Trigger save
  fireEvent.click(getByRole('button', { name: /save/i }));

  // Dialog should NOT appear immediately
  expect(queryByRole('dialog')).toBeNull();

  // Wait for delay
  await waitFor(() => {
    expect(getByRole('dialog')).toBeInTheDocument();
  }, { timeout: 600 });
});
```

---

## Atlas Workflow Analysis

### Affected Workflows

| Workflow | Impact | Details |
|----------|--------|---------|
| Learning Flow (#5) | MEDIUM | Learning dialogs migration - timing-critical |
| History Filter Flow (#6) | LOW | DeleteTransactionsModal migration |
| Single Active Transaction (#9) | MEDIUM | TransactionConflictDialog migration |
| Trust Merchant Flow (#8) | NONE | TrustMerchantPrompt not migrated (scan flow) |
| Quick Save Flow (#2) | NONE | QuickSaveCard not migrated (scan flow) |
| Scan Receipt Flow (#1) | NONE | Scan dialogs not migrated |
| Batch Processing Flow (#3) | NONE | Batch modals not migrated |

### Workflow Touchpoints

**TransactionConflictDialog:**
- Triggered from: New scan when pending transaction exists
- Blocking: Yes (user must resolve conflict)
- Critical path: Single Active Transaction paradigm

**DeleteTransactionsModal:**
- Triggered from: HistoryView selection mode
- Blocking: Yes (confirmation required)
- Critical path: Data deletion

**Learning Dialogs:**
- Triggered from: Transaction save with learnable changes
- Blocking: No (fires after save)
- Critical path: Learning system adoption

### Push Alert

**MEDIUM RISK MIGRATION**

This story migrates modals with state coupling and timing requirements:
1. TransactionConflictDialog has multi-step conflict resolution
2. Learning dialogs have timing constraints (must appear after save)
3. DeleteTransactionsModal depends on selection state from HistoryView

**Mitigations:**
- Preserve handler closures with full context
- Use setTimeout for learning dialog timing
- Pass selection state via modal props
- Comprehensive testing of all flows

---

## Files to Create

| File | Purpose |
|------|---------|
| None | All modals already exist as components |

## Files to Modify

| File | Change |
|------|--------|
| `src/managers/ModalManager/registry.tsx` | Add complex modal entries (7 modals) |
| `src/managers/ModalManager/types.ts` | Add complex modal prop types |
| `src/managers/ModalManager/index.ts` | Export new types |
| `src/hooks/app/useDialogHandlers.ts` | Remove conflict dialog state, use openModalDirect |
| `src/components/App/AppOverlays.tsx` | Remove TransactionConflictDialog |
| `src/views/HistoryView.tsx` | Migrate DeleteTransactionsModal to openModal |
| `src/views/DashboardView.tsx` | Migrate DeleteTransactionsModal to openModal |
| `src/views/TransactionEditorView.tsx` | Update learning dialog triggers (useEffect hooks) |
| `src/App.tsx` | Ensure ModalManager is rendered |
| `vitest.config.unit.ts` | Add tsconfigPaths() for @managers/* alias resolution |
| `tests/unit/hooks/app/useDialogHandlers.test.ts` | Update tests for Modal Manager integration |
| `tests/unit/managers/ModalManager/ModalManager.integration.test.tsx` | Add complex modal tests |
| `tests/unit/components/App/AppOverlays.test.tsx` | Remove TransactionConflictDialog tests |

---

## Definition of Done

- [x] All complex modals registered in Modal Manager registry
- [x] TransactionConflictDialog migrated and removed from AppOverlays
- [x] DeleteTransactionsModal migrated and removed from HistoryView
- [x] Learning dialogs migrated with timing preserved
- [x] ItemNameSuggestionDialog migrated
- [x] Unit tests created and passing
- [x] Manual testing confirms all flows work
- [x] `npm run build` succeeds
- [x] `npm run test` passes (217/218 test files)
- [x] No lint script configured (ESLint 9 migration pending)

---

## Dependencies

- **Depends on:** Story 14e-1 (Directory Structure & Zustand Setup)
- **Depends on:** Story 14e-2 (Modal Manager Zustand Store)
- **Depends on:** Story 14e-3 (Modal Manager Component)
- **Depends on:** Story 14e-4 (Migrate Simple Modals) - CRITICAL
- **Blocks:** Part 2 (Scan Feature Extraction - modals will reference Modal Manager)

---

## References

- [Architecture Decision](../architecture-decision.md) - ADR-018: Zustand-only state management
- [Epic 14e Overview](../epics.md) - Story 14e.5 definition
- [Story 14e-4](14e-4-migrate-simple-modals.md) - Simple modals migration pattern
- [Atlas Workflow Chains](_bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md)
- [Source: src/components/App/AppOverlays.tsx] - Current overlay rendering
- [Source: src/components/dialogs/TransactionConflictDialog.tsx] - Conflict dialog implementation
- [Source: src/components/history/DeleteTransactionsModal.tsx] - Delete modal implementation
- [Source: src/components/dialogs/LearnMerchantDialog.tsx] - Learning dialog implementation

---

## Story Sizing Analysis

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 8 | ≤4 | LARGE |
| Subtasks | 35 | ≤15 | LARGE |
| Files to Modify | 13 | ≤8 | LARGE |
| Files to Create | 0 | ≤8 | SMALL |

**Assessment:** MEDIUM-LARGE (3 pts) - At upper limit of single-session capacity. Task count is high but each task is well-defined. Consider breaking into 14e-5a (conflict + delete modals) and 14e-5b (learning modals) if implementation exceeds context window.

**Mitigation:** If context window exhausted, split at Task 4 boundary (after conflict + delete, before learning dialogs).

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Atlas Code Review: 2026-01-25
- Build verification: `npm run build` PASSED
- Test verification: `npm run test:quick` 217/218 passed (1 skipped expected)

### Completion Notes List

1. **Issue Found & Fixed:** AppOverlays.test.tsx had outdated tests expecting `showConflictDialog` props that were removed in this story
2. **Issue Found & Fixed:** vitest.config.unit.ts was missing `tsconfigPaths()` plugin, causing `@managers/*` and `@/*` path aliases to fail in tests
3. **Issue Found & Fixed:** Removed mock and test describe block for TransactionConflictDialog from AppOverlays.test.tsx
4. **Documentation Update:** Files to Modify list expanded to include DashboardView, App.tsx, and test files
5. **Atlas Validation:** All workflow chains (#5, #6, #9) preserved with proper integration
6. **Atlas Code Review (2026-01-25):** Story documentation updated - AC checkboxes marked complete, File List expanded with bug fix files, lint DoD item corrected (no lint script configured)

### File List

**Source Files Modified:**
- `src/managers/ModalManager/registry.tsx` - 7 complex modal entries added
- `src/managers/ModalManager/types.ts` - All complex modal prop interfaces
- `src/managers/ModalManager/index.ts` - Type exports
- `src/hooks/app/useDialogHandlers.ts` - Uses openModalDirect/closeModalDirect
- `src/components/App/AppOverlays.tsx` - TransactionConflictDialog removed
- `src/views/HistoryView.tsx` - Uses useModalActions for deleteTransactions
- `src/views/DashboardView.tsx` - Uses useModalActions for deleteTransactions
- `src/views/TransactionEditorView.tsx` - useEffect hooks for learning modals

**Config Files Modified:**
- `vitest.config.unit.ts` - Added tsconfigPaths() for path alias support

**Test Files Modified:**
- `tests/unit/hooks/app/useDialogHandlers.test.ts` - Modal Manager integration tests
- `tests/unit/managers/ModalManager/ModalManager.integration.test.tsx` - 23 modal types
- `tests/unit/components/App/AppOverlays.test.tsx` - Removed TransactionConflictDialog tests
- `tests/unit/hooks/app/useTransactionHandlers.test.ts` - Bug fix test updates

**Bug Fix Files (discovered during manual testing):**
- `src/App.tsx` - Batch edit mode fix, single scan image limit
- `src/components/Nav.tsx` - FAB navigation to correct batch view
- `src/hooks/app/useTransactionHandlers.ts` - Batch save handler fixes
- `src/hooks/useScanStateMachine.ts` - Debug log cleanup
- `src/utils/translations.ts` - Added `singleScanOneImageOnly` key

### Bugs Found & Fixed During Testing (2026-01-25)

**Bug 1: Batch receipts reappearing after edit+save**
- **Symptom:** After editing and saving a batch receipt, returning to batch-review showed the saved receipt still in the list (allowing duplicate saves)
- **Root Cause:** `handleEditorSave` in App.tsx unconditionally called `setScanImages([])` after saving, which triggered `resetScanContext()` and wiped all batch state including the receipts list
- **Fix:** Modified `handleEditorSave` and `handleEditorCancel` to capture `wasInBatchEditingMode` before calling `saveTransaction`, and only call `setScanImages([])` when NOT in batch editing mode
- **Files Modified:** `src/App.tsx`

**Bug 2: FAB navigating to wrong view during active batch scan**
- **Symptom:** When batch results were ready and user navigated away then tapped FAB, they were redirected to transaction-editor instead of batch-review
- **Root Cause:** `navigateToActiveRequest()` in Nav.tsx always navigated to `'transaction-editor'` regardless of the current scan mode/phase
- **Fix:** Updated `navigateToActiveRequest` to check `scanContext.state.mode` and `scanContext.state.phase`:
  - Batch mode + reviewing/scanning → `'batch-review'`
  - Batch mode + capturing → `'batch-capture'`
  - Single mode / fallback → `'transaction-editor'`
- **Files Modified:** `src/components/Nav.tsx`

**Bug 3: Single scan allowing multiple image selection**
- **Symptom:** When triggering single scan (via FAB tap), user could select multiple images which confused the app into batch mode behavior
- **Root Cause:** File input had `multiple` attribute, and `handleFileSelect` routed to batch preview when multiple images detected regardless of intended scan mode
- **Fix:** Modified `handleFileSelect` to detect single scan mode (`scanState.mode !== 'batch'`) and only use the first image when multiple are selected, showing toast message suggesting batch mode for multiple images. Does not auto-trigger scan - lets user review the image first and manually press scan button.
- **Files Modified:** `src/App.tsx`, `src/utils/translations.ts` (added `singleScanOneImageOnly` key)

**Debug Logging Cleanup:**
- Removed debug `console.log` statements added during debugging from:
  - `src/hooks/useScanStateMachine.ts` - DISCARD_BATCH_RECEIPT logs
  - `src/App.tsx` - handleBatchEditReceipt log
  - `src/hooks/app/useTransactionHandlers.ts` - batch save debug logs
