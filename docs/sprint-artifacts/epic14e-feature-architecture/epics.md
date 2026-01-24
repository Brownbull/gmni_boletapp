---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md
  - docs/sprint-artifacts/epic14c-refactor/app-architecture-final.md
  - docs/sprint-artifacts/epic14c-refactor/35a-app-audit-report.md
lastUpdated: 2026-01-24
adrReference: ADR-018 (Zustand-only state management)
---

# Gastify - Epic 14e: Feature-Based Architecture

## Overview

This epic transforms the monolithic App.tsx (~3,387 lines) into a feature-based architecture with Zustand stores for state management, achieving a target of 500-800 lines.

**Context:** Epic 14c-refactor completed significant refactoring but hit structural limits:
- Extracted 6,033 lines to hooks (composition + handlers)
- App.tsx still at 3,387 lines due to architectural constraints
- Original 1,500-2,000 line target was unrealistic without fundamental changes
- **Dead code identified:** `useScanStateBridge.ts` (17KB) exists but is not imported anywhere

**This Epic:** Implements Zustand-unified architecture (per ADR-018):
1. **Feature Slicing** - Organize code by feature domain
2. **Zustand Stores** - For all client state (scan, batch, modals)
3. **Modal Manager** - Centralized modal rendering

**State Management Philosophy:**
- Server state → TanStack Query (unchanged)
- Client state → Zustand (scan, batch, modals, UI state)
- Local component state → useState

**Approach:** Incremental extraction - each phase delivers value and can be paused if priorities change.

---

## Architecture Reference

See [architecture-decision.md](./architecture-decision.md) for full technical details including ADR-018.

### Target Structure

```
src/
├── features/
│   ├── scan/          # Zustand store + handlers + components
│   ├── batch-review/  # Zustand store + handlers + components
│   ├── categories/    # Simple feature
│   ├── credit/        # Simple feature
│   └── transactions/  # Core data feature
├── managers/
│   └── ModalManager/  # Centralized modal rendering (Zustand)
├── shared/            # Cross-feature utilities
└── app/
    └── App.tsx        # ~500-800 lines (thin orchestrator)
```

---

## Epic Summary

| Part | Focus | Stories | Points |
|------|-------|---------|--------|
| 0 | Cleanup (Pre-requisite) | 1 | 1 |
| 1 | Foundation & Modal Manager | 5 | 13 |
| 2 | Scan Feature Extraction | 6 | 21 |
| 3 | Batch Review Feature | 5 | 16 |
| 4 | Simple Features | 4 | 12 |
| 5 | App Shell Finalization | 4 | 10 |
| **Total** | | **25** | **~73** |

---

## Part 0: Cleanup (Pre-requisite)

**Goal:** Remove dead code from Epic 14d migration before introducing new architecture.

---

### Story 14e.0: Delete Bridge Layer Dead Code

As a **developer**,
I want **dead code from Epic 14d migration removed from the codebase**,
So that **the codebase is clean before introducing new architecture**.

**Acceptance Criteria:**

**Given** `src/hooks/useScanStateBridge.ts` exists but is not imported anywhere
**When** this story is completed
**Then:**
- `src/hooks/useScanStateBridge.ts` deleted (17KB dead code)
- Build succeeds
- All tests pass
- Scan flow works (smoke test)

**Technical Notes:**
- Verify no imports exist before deletion: `grep -r "useScanStateBridge" src/`
- This was a migration bridge from Epic 14d that completed successfully

**Points:** 1

**Story file:** [stories/14e-0-delete-bridge-dead-code.md](./stories/14e-0-delete-bridge-dead-code.md)

---

## Part 1: Foundation & Modal Manager

**Goal:** Establish directory structure and implement centralized modal management.

---

### Story 14e.1: Directory Structure & Zustand Setup

As a **developer**,
I want **the feature-based directory structure and Zustand dependency set up**,
So that **I have the foundation for feature extraction**.

**Acceptance Criteria:**

**Given** the current flat src/ structure
**When** this story is completed
**Then:**
- `src/features/` directory created with subdirectories: scan/, batch-review/, categories/, credit/, transactions/
- `src/managers/ModalManager/` directory created
- `src/shared/` directory created with subdirectories: components/, hooks/, utils/, types/
- `src/app/` directory created (App.tsx stays in src/ until Part 5)
- Zustand installed: `zustand@^5`
- TypeScript types work correctly
- Empty index.ts files in each feature directory
- Build succeeds with new structure

**Technical Notes:**
- Run `npm install zustand`
- **XState intentionally NOT installed** per ADR-018

**Points:** 2

**Story file:** [stories/14e-1-directory-structure-xstate-setup.md](./stories/14e-1-directory-structure-xstate-setup.md)

---

### Story 14e.2: Modal Manager Zustand Store

As a **developer**,
I want **a Zustand store for centralized modal state management**,
So that **modals can be opened from anywhere without prop drilling**.

**Acceptance Criteria:**

**Given** modals are currently rendered inline in App.tsx
**When** this story is completed
**Then:**
- `src/managers/ModalManager/useModalStore.ts` created with:
  - `activeModal: ModalType | null`
  - `modalProps: Record<string, unknown>`
  - `openModal(type, props)` action
  - `closeModal()` action
  - `isOpen(type)` selector
- `src/managers/ModalManager/types.ts` created with ModalType union type
- Store typed for all current modals in App.tsx (~15 modal types)
- Unit tests for store actions
- Export from `src/managers/ModalManager/index.ts`

**Technical Notes:**
- Inventory all current modals in App.tsx first
- Type ModalType as string literal union for type safety

**Points:** 3

---

### Story 14e.3: Modal Manager Component

As a **developer**,
I want **a Modal Manager component that renders the active modal**,
So that **modal rendering is centralized and App.tsx render section is simplified**.

**Acceptance Criteria:**

**Given** the modal store from Story 14e.2
**When** this story is completed
**Then:**
- `src/managers/ModalManager/ModalManager.tsx` created
- MODALS registry maps ModalType to modal components
- Component renders active modal with props from store
- Renders null when no modal active
- Handles onClose by calling closeModal()
- Unit tests verify correct modal rendering
- Integration test with 2-3 sample modals

**Points:** 2

---

### Story 14e.4: Migrate Simple Modals to Modal Manager

As a **developer**,
I want **simple modals migrated to the Modal Manager**,
So that **we validate the pattern before migrating complex modals**.

**Acceptance Criteria:**

**Given** Modal Manager component from Story 14e.3
**When** this story is completed
**Then:**
- The following modals migrated to Modal Manager:
  - ConfirmDeleteDialog (simplest)
  - ExportDataDialog
  - WipeDataDialog
  - ManagePaymentMethodsDialog
  - CurrencyInfoModal
- Modal JSX removed from App.tsx render section
- Modal state variables removed from App.tsx
- Handlers updated to use `openModal()` instead of setState
- All modal functionality works as before
- ~200-300 lines removed from App.tsx

**Points:** 3

---

### Story 14e.5: Migrate Complex Modals to Modal Manager

As a **developer**,
I want **remaining modals migrated to the Modal Manager**,
So that **App.tsx render section contains no inline modal rendering**.

**Acceptance Criteria:**

**Given** simple modals migrated in Story 14e.4
**When** this story is completed
**Then:**
- All remaining modals migrated:
  - CategoryEditorModal
  - AddCategoryDialog
  - TotalAmountDialog
  - QuickSaveModal
  - ScanResultModal
  - CreditInfoModal
  - All other modals in App.tsx
- Zero inline modal rendering in App.tsx
- ModalManager rendered in App.tsx once
- Handlers use openModal() consistently
- ~500-700 additional lines removed from App.tsx
- All modal tests pass

**Technical Notes:**
- Some modals have complex props - ensure type safety
- May need to pass callback functions through modalProps

**Points:** 3

---

## Part 2: Scan Feature Extraction

**Goal:** Extract the scan flow (largest single feature) using Zustand store.

**Migration Approach:** The existing `useScanStateMachine` (useReducer) will be migrated to a Zustand store. Same state machine logic, different container.

---

### Story 14e.6: Scan Zustand Store Definition

As a **developer**,
I want **a Zustand store defining the scan flow states and actions**,
So that **the scan flow has centralized, global state management**.

**Acceptance Criteria:**

**Given** the current scan flow in `useScanStateMachine` and `ScanContext`
**When** this story is completed
**Then:**
- `src/features/scan/store/useScanStore.ts` created
- Store defines typed phases: idle, capturing, processing, reviewing, editing, saving, success, error
- Store state includes: images, results, error, mode, requestId, userId, batchProgress
- All actions migrated from existing `scanReducer`
- Phase guards prevent invalid transitions (same logic as current reducer)
- DevTools middleware enabled for debugging
- Store exported with TypeScript types
- Unit tests verify state transitions match existing behavior

**Technical Notes:**
- Study existing `src/hooks/useScanStateMachine.ts` and `src/types/scanStateMachine.ts`
- Port existing reducer cases to Zustand actions
- Maintain exact same state machine semantics

**Points:** 5

---

### Story 14e.7: Scan Store Selectors & Hooks

As a **developer**,
I want **typed selectors and hooks for the scan store**,
So that **components have ergonomic access to scan state**.

**Acceptance Criteria:**

**Given** the scan store from Story 14e.6
**When** this story is completed
**Then:**
- Computed selectors created:
  - `useScanPhase()` - current phase
  - `useScanMode()` - current mode (single/batch/statement)
  - `useIsScanning()` - true if not idle
  - `useCanNavigateFreely()` - true if safe to leave
  - `useHasActiveRequest()` - compatibility with existing API
- Action hooks created:
  - `useScanActions()` - all actions (startSingle, startBatch, etc.)
- TypeScript types for all selectors
- Unit tests verify selectors return correct values

**Points:** 3

---

### Story 14e.8: Extract processScan Handler

As a **developer**,
I want **the processScan function extracted to a feature handler**,
So that **the 600-line handler is no longer in App.tsx**.

**Acceptance Criteria:**

**Given** the processScan function in App.tsx
**When** this story is completed
**Then:**
- `src/features/scan/handlers/processScan.ts` created
- Function extracted with all logic intact
- Function uses scan store actions directly
- Dependencies passed as parameters or accessed via hooks
- Original function in App.tsx replaced with handler import
- All scan tests pass
- No regressions in scan functionality

**Technical Notes:**
- This is the single largest extraction - be thorough
- May need to pass many dependencies initially

**Points:** 5

---

### Story 14e.9: Scan Feature Components

As a **developer**,
I want **scan-related components organized in the scan feature**,
So that **all scan UI is colocated with scan logic**.

**Acceptance Criteria:**

**Given** scan components in various locations
**When** this story is completed
**Then:**
- Move/create components in `src/features/scan/components/`:
  - ScanOverlay.tsx (may already exist)
  - ScanResultModal.tsx (extract from ModalManager if simpler)
  - states/IdleState.tsx
  - states/ProcessingState.tsx
  - states/ReviewingState.tsx
  - states/ErrorState.tsx
- Components use `useScanStore()` for state
- Components call store actions directly
- Unit tests for each state component

**Points:** 3

---

### Story 14e.10: Scan Feature Orchestrator

As a **developer**,
I want **a ScanFeature component that orchestrates scan rendering**,
So that **App.tsx can render a single component for all scan functionality**.

**Acceptance Criteria:**

**Given** scan store and components from previous stories
**When** this story is completed
**Then:**
- `src/features/scan/ScanFeature.tsx` created
- Component renders appropriate state UI based on store phase
- Component handles scan modals (or delegates to ModalManager)
- Export from `src/features/scan/index.ts`
- App.tsx imports and renders `<ScanFeature />`
- Remove all scan-specific code from App.tsx
- All scan tests pass

**Points:** 3

---

### Story 14e.11: ScanContext Migration & Cleanup

As a **developer**,
I want **the existing ScanContext replaced by the new Zustand store**,
So that **we have a single source of truth for scan state**.

**Acceptance Criteria:**

**Given** ScanFeature working with Zustand store
**When** this story is completed
**Then:**
- Existing `src/contexts/ScanContext.tsx` deleted or refactored to use Zustand store
- Existing `src/hooks/useScanStateMachine.ts` deleted (replaced by Zustand store)
- No duplicate state management for scan flow
- Components using old ScanContext/useScan migrated to new store hooks
- All 31 scan-related state variables accounted for in Zustand store
- Zero regressions in scan functionality
- App.tsx scan-related code reduced by ~800-1000 lines total

**Technical Notes:**
- May need to keep ScanContext as a thin wrapper during migration
- Delete old files only after all consumers migrated

**Points:** 2

---

## Part 3: Batch Review Feature

**Goal:** Extract batch review flow using Zustand store.

---

### Story 14e.12: Batch Review Zustand Store Definition

As a **developer**,
I want **a Zustand store defining the batch review flow**,
So that **batch review has centralized, predictable state management**.

**Acceptance Criteria:**

**Given** the current batch review logic in App.tsx
**When** this story is completed
**Then:**
- `src/features/batch-review/store/useBatchReviewStore.ts` created
- Store defines typed phases: idle, loading, reviewing, processing, complete, error
- Store state includes: items, currentIndex, processedCount, errors
- Actions defined: nextItem, approve, skip, reject, undo, complete
- Phase guards prevent invalid transitions
- DevTools middleware enabled
- TypeScript types for all state and actions
- Unit tests verify transitions

**Points:** 3

---

### Story 14e.13: Batch Review Store Selectors & Hooks

As a **developer**,
I want **typed selectors and hooks for the batch review store**,
So that **components have ergonomic access to batch review state**.

**Acceptance Criteria:**

**Given** the batch review store from Story 14e.12
**When** this story is completed
**Then:**
- Computed selectors created:
  - `useBatchReviewPhase()` - current phase
  - `useCurrentBatchItem()` - current item being reviewed
  - `useBatchProgress()` - { current, total, completed, failed }
  - `useIsBatchReviewing()` - true if in reviewing phase
- Action hooks created:
  - `useBatchReviewActions()` - all actions
- TypeScript types exported
- Unit tests verify selector behavior

**Points:** 2

---

### Story 14e.14: Extract Batch Review Handlers

As a **developer**,
I want **batch review handlers extracted to feature handlers**,
So that **batch logic is colocated with batch state**.

**Acceptance Criteria:**

**Given** batch handlers in App.tsx (handleBatch*, handleApproveItem, etc.)
**When** this story is completed
**Then:**
- `src/features/batch-review/handlers/` created with:
  - approveItem.ts
  - skipItem.ts
  - rejectItem.ts
  - processBatch.ts
- Handlers use batch review store actions
- Original handlers in App.tsx removed
- All batch tests pass

**Points:** 3

---

### Story 14e.15: Batch Review Feature Components

As a **developer**,
I want **batch review components organized in the feature**,
So that **all batch UI is colocated with batch logic**.

**Acceptance Criteria:**

**Given** batch components in various locations
**When** this story is completed
**Then:**
- Components in `src/features/batch-review/components/`:
  - BatchReviewCard.tsx
  - BatchProgressIndicator.tsx
  - BatchSummary.tsx
  - states/ReviewingState.tsx
  - states/CompleteState.tsx
- Components use `useBatchReviewStore()` for state
- Unit tests for components

**Points:** 3

---

### Story 14e.16: Batch Review Feature Orchestrator

As a **developer**,
I want **a BatchReviewFeature component that orchestrates batch review**,
So that **App.tsx can render a single component for batch functionality**.

**Acceptance Criteria:**

**Given** batch store and components from previous stories
**When** this story is completed
**Then:**
- `src/features/batch-review/BatchReviewFeature.tsx` created
- Component renders based on store phase
- Export from `src/features/batch-review/index.ts`
- App.tsx imports and renders `<BatchReviewFeature />`
- Remove batch-specific code from App.tsx
- ~400-500 lines removed from App.tsx

**Points:** 5

---

## Part 4: Simple Features

**Goal:** Extract remaining simple features using Feature Slicing (Zustand stores where needed).

---

### Story 14e.17: Categories Feature Extraction

As a **developer**,
I want **category management extracted to a feature module**,
So that **category logic is colocated and isolated**.

**Acceptance Criteria:**

**Given** category-related code scattered in App.tsx and hooks
**When** this story is completed
**Then:**
- `src/features/categories/` structure created:
  - CategoriesFeature.tsx
  - state/useCategoriesState.ts (wraps existing hooks)
  - handlers/saveCategory.ts, deleteCategory.ts
  - components/CategoryEditorModal.tsx (if not in ModalManager)
- Export from index.ts
- App.tsx uses <CategoriesFeature />
- Category-related code removed from App.tsx
- All category tests pass

**Points:** 3

---

### Story 14e.18: Credit Feature Extraction

As a **developer**,
I want **credit/payment functionality extracted to a feature module**,
So that **credit logic is colocated and isolated**.

**Acceptance Criteria:**

**Given** credit-related code in App.tsx (handleCredit*, credit state)
**When** this story is completed
**Then:**
- `src/features/credit/` structure created:
  - CreditFeature.tsx
  - state/useCreditState.ts
  - handlers/fetchCreditInfo.ts, processCredit.ts
  - components/CreditInfoModal.tsx (if not in ModalManager)
- Export from index.ts
- App.tsx uses <CreditFeature />
- Credit-related code removed from App.tsx
- All credit tests pass

**Points:** 3

---

### Story 14e.19: Transactions Feature Foundation

As a **developer**,
I want **transaction management organized as a feature module**,
So that **core data handling has clear ownership**.

**Acceptance Criteria:**

**Given** transaction hooks and utilities scattered across codebase
**When** this story is completed
**Then:**
- `src/features/transactions/` structure created:
  - index.ts (public API)
  - hooks/useTransactions.ts (existing, re-exported)
  - hooks/useTransactionFilters.ts
  - utils/transactionHelpers.ts
  - types.ts
- Existing transaction hooks moved/re-exported
- No breaking changes to consumers
- Transaction types centralized

**Points:** 3

---

### Story 14e.20: Remaining UI State Extraction

As a **developer**,
I want **remaining UI state extracted from App.tsx**,
So that **App.tsx contains minimal local state**.

**Acceptance Criteria:**

**Given** remaining UI state in App.tsx after feature extraction
**When** this story is completed
**Then:**
- Identify remaining useState in App.tsx
- Extract to appropriate features or create:
  - `src/shared/hooks/useUIState.ts` for global UI state
  - `src/shared/hooks/useToast.ts` for toast notifications
- Zustand store for any global UI state if needed
- App.tsx useState calls minimized to essential only
- Document any state that MUST remain in App.tsx

**Points:** 3

---

## Part 5: App Shell Finalization

**Goal:** Refactor App.tsx to a thin orchestrator.

---

### Story 14e.21: Create FeatureOrchestrator

As a **developer**,
I want **a FeatureOrchestrator component that composes all features**,
So that **App.tsx becomes a thin shell**.

**Acceptance Criteria:**

**Given** all features extracted in Parts 2-4
**When** this story is completed
**Then:**
- `src/app/FeatureOrchestrator.tsx` created
- Component renders:
  - ScanFeature
  - BatchReviewFeature
  - CategoriesFeature
  - CreditFeature
  - ModalManager
- Component handles feature visibility based on app state
- View routing remains in App.tsx (or extracted here)
- Clean separation of concerns

**Points:** 3

---

### Story 14e.22: AppProviders Refactor

As a **developer**,
I want **all providers extracted to an AppProviders component**,
So that **App.tsx doesn't have deeply nested providers**.

**Acceptance Criteria:**

**Given** multiple providers in App.tsx (Auth, Query, Theme, etc.)
**When** this story is completed
**Then:**
- `src/app/AppProviders.tsx` created
- All providers composed in correct order
- App.tsx wraps children with <AppProviders>
- Provider nesting removed from App.tsx
- TypeScript types for provider props if needed

**Points:** 2

---

### Story 14e.23: App.tsx Final Cleanup

As a **developer**,
I want **App.tsx refactored to its final minimal form**,
So that **we achieve the 500-800 line target**.

**Acceptance Criteria:**

**Given** all features and orchestrator complete
**When** this story is completed
**Then:**
- App.tsx contains only:
  - Auth initialization
  - AppProviders wrapper
  - FeatureOrchestrator
  - AppLayout with view routing
  - Essential early returns (loading, error)
- App.tsx is 500-800 lines
- No feature-specific logic remains
- All tests pass
- No regressions

**Points:** 3

---

### Story 14e.24: Documentation & Architecture Guide

As a **developer**,
I want **comprehensive documentation for the new architecture**,
So that **future developers understand the patterns and conventions**.

**Acceptance Criteria:**

**Given** the complete feature-based architecture
**When** this story is completed
**Then:**
- `docs/architecture/feature-based-architecture.md` created
- Documents:
  - Directory structure and conventions
  - Feature creation guide
  - State machine patterns
  - Modal Manager usage
  - When to use state machines vs simple features
- README.md updated with architecture overview
- Code comments added to key files
- Architecture diagram created (Excalidraw or Mermaid)

**Points:** 2

---

## Dependencies

### Story Dependencies

```
Part 1 (Foundation):
14e.1 → 14e.2 → 14e.3 → 14e.4 → 14e.5

Part 2 (Scan):
14e.1 → 14e.6 → 14e.7 → 14e.8 → 14e.9 → 14e.10 → 14e.11

Part 3 (Batch Review):
14e.6 (for XState patterns) → 14e.12 → 14e.13 → 14e.14 → 14e.15 → 14e.16

Part 4 (Simple Features):
14e.5 (Modal Manager complete) → 14e.17, 14e.18, 14e.19, 14e.20

Part 5 (Finalization):
All Part 1-4 → 14e.21 → 14e.22 → 14e.23 → 14e.24
```

### External Dependencies

- Epic 14c must be complete (it is)
- No Epic 14d dependency (can run in parallel)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| XState learning curve | Medium | Start with scan (most complex), patterns apply to batch |
| Feature boundary disputes | Low | Architecture doc defines ownership |
| Breaks existing tests | Medium | Run tests after each story, fix immediately |
| Scope creep | Medium | Strict story boundaries, no gold plating |

---

## Success Criteria

1. **App.tsx Lines:** 500-800 (from 3,850)
2. **Feature Isolation:** Each feature <1,000 lines
3. **State Machines:** Scan + Batch Review flows explicit
4. **Modal Manager:** 100% modals registered
5. **Test Coverage:** Maintained or improved
6. **No Regressions:** All existing functionality works
