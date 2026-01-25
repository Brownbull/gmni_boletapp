# Story 14e-5: Migrate Complex Modals to Modal Manager

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Status:** ready-for-dev
**Created:** 2026-01-24
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
- [ ] TransactionConflictDialog removed from AppOverlays.tsx
- [ ] TransactionConflictDialog registered in Modal Manager registry
- [ ] `showConflictDialog` state in useDialogHandlers replaced with `openModal('transactionConflict', {...})`
- [ ] All conflict dialog props passed through Modal Manager
- [ ] Conflict resolution flow works: view conflicting, discard, or close
- [ ] Props extracted to AppOverlays.tsx removed (~50 lines)

### AC2: DeleteTransactionsModal Migrated

**Given** DeleteTransactionsModal rendered inline in HistoryView.tsx
**When** this story is completed
**Then:**
- [ ] DeleteTransactionsModal removed from HistoryView.tsx render section
- [ ] DeleteTransactionsModal registered in Modal Manager registry
- [ ] HistoryView calls `openModal('deleteTransactions', { selectedIds, onConfirm, onCancel })`
- [ ] Selection state passed correctly via modal props
- [ ] Bulk delete flow works: select items → delete button → confirm → delete
- [ ] Modal JSX removed from HistoryView (~30 lines)

### AC3: Learning Dialogs Migrated

**Given** LearnMerchantDialog, CategoryLearningPrompt, SubcategoryLearningPrompt rendered in various views
**When** this story is completed
**Then:**
- [ ] All learning dialogs registered in Modal Manager registry
- [ ] Learning dialog timing preserved (appears after transaction save, before navigation)
- [ ] `openModal('learnMerchant', {...})` called from appropriate handlers
- [ ] Learning flow works: save transaction → learning prompt appears → user confirms → mapping saved
- [ ] onSave callbacks execute correctly through Modal Manager props

### AC4: ItemNameSuggestionDialog Migrated

**Given** ItemNameSuggestionDialog for fuzzy matching item name suggestions
**When** this story is completed
**Then:**
- [ ] ItemNameSuggestionDialog registered in Modal Manager registry
- [ ] Suggestion list and selection state passed via modal props
- [ ] Dialog appears when editing item names with suggestions available
- [ ] Selection callback correctly updates item name

### AC5: AppOverlays Cleanup

**Given** migrated modals removed from AppOverlays
**When** this story is completed
**Then:**
- [ ] AppOverlays.tsx only contains scan-related overlays and banners
- [ ] TransactionConflictDialog removed from AppOverlays imports
- [ ] Props related to migrated modals removed from AppOverlaysProps interface
- [ ] ~100 lines removed from AppOverlays.tsx

### AC6: Unit Tests for Modal Migrations

**Given** migrated modals
**When** tests are run
**Then:**
- [ ] Tests for TransactionConflictDialog via Modal Manager (open, close, handlers)
- [ ] Tests for DeleteTransactionsModal via Modal Manager (selection, confirm, cancel)
- [ ] Tests for learning dialogs via Modal Manager (timing, callbacks)
- [ ] All tests pass

### AC7: No Regression in Critical Flows (Atlas Workflow Chains)

**Given** migrated modals and Modal Manager
**When** manual testing is performed
**Then:**
- [ ] **Learning Flow (#5):** Edit category → prompt appears → confirm → mapping saved
- [ ] **History Filter Flow (#6):** Select transactions → delete → confirm → deleted
- [ ] **Single Active Transaction (#9):** New scan with pending → conflict dialog → resolve
- [ ] **Trust Merchant Flow (#8):** Trust prompt still appears correctly (not migrated but not broken)
- [ ] No visual or functional regressions

### AC8: Learning Dialog Timing Preserved (Atlas-Suggested)

**Given** learning dialogs migrated to Modal Manager
**When** user edits a transaction field eligible for learning
**Then:**
- [ ] Learning dialog appears 300-500ms after field blur (not immediately)
- [ ] Dialog does not block transaction save operation
- [ ] Dialog dismisses cleanly on background tap or explicit close
- [ ] Navigation after dismiss works without stale state

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

- [ ] **Task 1: Update Modal Registry & Types (AC: #1, #2, #3, #4)**
  - [ ] Add all complex modal entries to registry.ts
  - [ ] Add TypeScript interfaces for all modal props
  - [ ] Export types from index.ts
  - [ ] Verify lazy loading works for all entries

- [ ] **Task 2: Migrate TransactionConflictDialog (AC: #1, #7)**
  - [ ] Remove state variables from useDialogHandlers
  - [ ] Create openConflictDialog using Modal Manager
  - [ ] Update all call sites that set conflict dialog state
  - [ ] Remove from AppOverlays.tsx imports
  - [ ] Remove from AppOverlays.tsx render
  - [ ] Remove props from AppOverlaysProps interface
  - [ ] Test conflict resolution flow end-to-end

- [ ] **Task 3: Migrate DeleteTransactionsModal (AC: #2, #7)**
  - [ ] Locate DeleteTransactionsModal in HistoryView
  - [ ] Update handleDeleteClick to use openModal
  - [ ] Pass selection state via modal props
  - [ ] Remove inline modal JSX from HistoryView
  - [ ] Test bulk delete flow

- [ ] **Task 4: Migrate Learning Dialogs (AC: #3, #8)**
  - [ ] Identify all locations where learning dialogs are triggered
  - [ ] Update LearnMerchantDialog to use Modal Manager
  - [ ] Update CategoryLearningPrompt to use Modal Manager
  - [ ] Update SubcategoryLearningPrompt to use Modal Manager
  - [ ] Preserve timing (300-500ms delay after save)
  - [ ] Test learning flow end-to-end

- [ ] **Task 5: Migrate ItemNameSuggestionDialog (AC: #4)**
  - [ ] Locate ItemNameSuggestionDialog usage
  - [ ] Update to use Modal Manager
  - [ ] Pass suggestions and handlers via modal props
  - [ ] Test item name editing with suggestions

- [ ] **Task 6: AppOverlays Cleanup (AC: #5)**
  - [ ] Remove all migrated modal imports
  - [ ] Remove all migrated modal props from interface
  - [ ] Remove all migrated modal JSX
  - [ ] Verify remaining overlays still work (scan-related)
  - [ ] Count lines removed (~100-150 expected)

- [ ] **Task 7: Write Unit Tests (AC: #6)**
  - [ ] Test TransactionConflictDialog via Modal Manager
  - [ ] Test DeleteTransactionsModal via Modal Manager
  - [ ] Test learning dialog timing
  - [ ] Test modal open/close state transitions

- [ ] **Task 8: Manual Verification (AC: #7, #8)**
  - [ ] Test Learning Flow (#5): Edit → prompt → confirm → saved
  - [ ] Test History Filter Flow (#6): Select → delete → confirm → deleted
  - [ ] Test Single Active Transaction (#9): Pending → new scan → conflict → resolve
  - [ ] Verify scan dialogs still work (not migrated)
  - [ ] Check for console errors

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
| `src/managers/ModalManager/registry.ts` | Add complex modal entries |
| `src/managers/ModalManager/types.ts` | Add complex modal prop types |
| `src/hooks/app/useDialogHandlers.ts` | Remove conflict dialog state, use openModal |
| `src/components/App/AppOverlays.tsx` | Remove TransactionConflictDialog |
| `src/views/HistoryView.tsx` | Migrate DeleteTransactionsModal to openModal |
| `src/hooks/app/useTransactionHandlers.ts` | Update learning dialog triggers |
| `src/views/TransactionEditorView.tsx` | Update learning dialog triggers (if any) |

---

## Definition of Done

- [ ] All complex modals registered in Modal Manager registry
- [ ] TransactionConflictDialog migrated and removed from AppOverlays
- [ ] DeleteTransactionsModal migrated and removed from HistoryView
- [ ] Learning dialogs migrated with timing preserved
- [ ] ItemNameSuggestionDialog migrated
- [ ] Unit tests created and passing
- [ ] Manual testing confirms all flows work
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes
- [ ] `npm run lint` passes

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
| Files to Modify | 7 | ≤8 | MEDIUM |
| Files to Create | 0 | ≤8 | SMALL |

**Assessment:** MEDIUM-LARGE (3 pts) - At upper limit of single-session capacity. Task count is high but each task is well-defined. Consider breaking into 14e-5a (conflict + delete modals) and 14e-5b (learning modals) if implementation exceeds context window.

**Mitigation:** If context window exhausted, split at Task 4 boundary (after conflict + delete, before learning dialogs).

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
