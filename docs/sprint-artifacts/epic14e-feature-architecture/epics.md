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
│   └── credit/        # Simple feature
├── entities/
│   └── transaction/   # Domain object used by multiple features
├── managers/
│   └── ModalManager/  # Centralized modal rendering (Zustand)
├── shared/            # Cross-feature utilities
└── app/
    └── App.tsx        # ~500-800 lines (thin orchestrator)
```

**Why `entities/transaction/` instead of `features/transactions/`?**

Transaction is a **domain object** (entity) that multiple features operate on:
- `scan` feature → creates transactions
- `batch-review` feature → creates transactions
- `categories` feature → categorizes transactions

In FSD, entities are shared domain objects. Features are business capabilities. This distinction prevents circular dependencies and clarifies ownership.

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
- `src/features/` directory created with subdirectories: scan/, batch-review/, categories/, credit/
- `src/entities/` directory created with subdirectory: transaction/
- `src/managers/ModalManager/` directory created
- `src/shared/` directory created with subdirectories: components/, hooks/, utils/, types/
- `src/app/` directory created (App.tsx stays in src/ until Part 5)
- Zustand installed: `zustand@^5`
- Path aliases configured: `@features/*`, `@entities/*`, `@managers/*`, `@shared/*`, `@app/*`
- `vite-tsconfig-paths` plugin installed and configured
- TypeScript types work correctly
- Empty index.ts files in each feature and entity directory
- Build succeeds with new structure

**Technical Notes:**
- Run `npm install zustand vite-tsconfig-paths`
- Configure `baseUrl` and `paths` in `tsconfig.json`
- Add `tsconfigPaths()` plugin to `vite.config.ts`
- **XState intentionally NOT installed** per ADR-018

**Points:** 2

**Story file:** [stories/14e-1-directory-structure-zustand-setup.md](./stories/14e-1-directory-structure-zustand-setup.md)

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
**Test Requirements (Explicit):**
- Unit tests cover ALL valid phase transitions (e.g., idle→capturing, capturing→processing)
- Unit tests cover ALL invalid phase transition attempts (e.g., startSingle when phase !== 'idle')
- Unit tests verify phase guards block and log warnings for invalid transitions
- Unit tests cover edge cases: rapid consecutive calls, reset during operation
- Test matrix documented: [current phase] × [action] → [expected result]

**Technical Notes:**
- Study existing `src/hooks/useScanStateMachine.ts` and `src/types/scanStateMachine.ts`
- Port existing reducer cases to Zustand actions
- Maintain exact same state machine semantics

**Points:** 5

---

### Story 14e.7: Scan Store Selectors & Hooks - CONSOLIDATED

> **Status:** CONSOLIDATED into Story 14e-6c
> **Reason:** When Story 14e-6 was split into 14e-6a/b/c/d, Story 14e-6c absorbed all selector functionality with expanded scope (14 selectors vs 5 originally planned).
> See: [Story 14e-6c](./stories/14e-6c-scan-zustand-selectors-exports.md)

~~**Points:** 3~~ → **Points:** 0 (absorbed into 14e-6c's 2 pts)

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

**Pre-Extraction Requirements:**
- [ ] Dependency audit completed: document ALL dependencies (hooks, state, callbacks, services)
- [ ] Test coverage baseline: run existing tests, document pass/fail state
- [ ] Smoke test checklist created: single scan, batch scan, statement scan, error cases
- [ ] Rollback plan documented: steps to revert if extraction breaks functionality

**Extraction Strategy (Recommended by Archie):**

Extract in layers to minimize risk - do NOT pull 600 lines in one commit:

1. **Layer 1 - Pure Utilities:** Extract pure helper functions with no external dependencies first
2. **Layer 2 - Sub-handlers:** Extract functions that only depend on utilities (e.g., image processing helpers)
3. **Layer 3 - Main Handler:** Extract the main `processScan` orchestration function last

**Optional Safeguard:** Create a thin wrapper function in App.tsx that delegates to the extracted handler. This allows testing both implementations during verification before removing the old code.

**Technical Notes:**
- This is the single largest extraction (~600 lines) - highest risk story
- May need to pass many dependencies initially
- Extract incrementally as described above
- Each layer extraction should be a separate commit for easy rollback

**Points:** 5

---

### Story 14e.9: Scan Feature Components - SPLIT

> **Status:** SPLIT 2026-01-24
> **Reason:** Exceeded sizing limits (6 tasks, 37 subtasks, ~12 files)
> **Split into:** 14e-9a (move), 14e-9b (Zustand update), 14e-9c (state components)

| Sub-Story | Description | Points |
|-----------|-------------|--------|
| **14e-9a** | Move existing components + update imports | 2 |
| **14e-9b** | Update components to use Zustand store | 3 |
| **14e-9c** | Create state components + tests | 3 |

**Total Points:** 8 (increased from 3 due to split overhead)

**Story Files:**
- [14e-9a-move-scan-components.md](./stories/14e-9a-move-scan-components.md)
- [14e-9b-zustand-component-update.md](./stories/14e-9b-zustand-component-update.md)
- [14e-9c-state-components-tests.md](./stories/14e-9c-state-components-tests.md)

~~**Points:** 3~~ → **Points:** 8 (split)

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

**Pre-Deletion Verification (MANDATORY):**
- [ ] Run `grep -r "ScanContext" src/` - must return only the context file itself
- [ ] Run `grep -r "useScan" src/` - must return only new Zustand hooks and old files being deleted
- [ ] Run `grep -r "useScanStateMachine" src/` - must return only the file being deleted
- [ ] Document all consumers found and verify each has been migrated
- [ ] Build succeeds with no errors
- [ ] All tests pass BEFORE deletion

**Technical Notes:**
- May need to keep ScanContext as a thin wrapper during migration
- Delete old files only after all consumers verified migrated
- If ANY consumer still references old hooks, DO NOT delete - fix first

**Reference Documentation for 31 State Variables:**
- `docs/architecture/diagrams/scan-state-machine.md` - State machine design with variable mapping
- `docs/sprint-artifacts/epic14d-refactor-scan/stories/story-14d.1-scan-state-machine-hook.md` - Original migration story
- Use these documents to verify ALL state is accounted for in new Zustand store

**Points:** 2

---

## Part 3: Batch Review Feature

**Goal:** Extract batch review flow using Zustand store.

---

### Story 14e.12: Batch Review Zustand Store Definition - SPLIT

> **Status:** SPLIT 2026-01-25
> **Reason:** Exceeded sizing limits (7 tasks, 27 subtasks)
> **Split into:** 14e-12a (foundation), 14e-12b (actions & tests)

| Sub-Story | Description | Points |
|-----------|-------------|--------|
| **14e-12a** | Store foundation + lifecycle/item actions | 2 |
| **14e-12b** | Save/edit actions + phase guards + tests | 2 |

**Total Points:** 4 (increased from 3 due to split overhead)

**Story Files:**
- [14e-12a-batch-review-store-foundation.md](./stories/14e-12a-batch-review-store-foundation.md)
- [14e-12b-batch-review-store-actions-tests.md](./stories/14e-12b-batch-review-store-actions-tests.md)

~~**Points:** 3~~ → **Points:** 4 (split)

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

### Story 14e.14: Extract Batch Review Handlers - SPLIT

> **Status:** SPLIT 2026-01-25
> **Reason:** Exceeded sizing limits (7 tasks, 30 subtasks)
> **Split into:** 14e-14a (types + navigation), 14e-14b (edit + save), 14e-14c (discard + credit), 14e-14d (integration)

| Sub-Story | Description | Points |
|-----------|-------------|--------|
| **14e-14a** | Handler types + navigation handlers | 2 |
| **14e-14b** | Edit + save handlers | 2 |
| **14e-14c** | Discard + credit check handlers | 2 |
| **14e-14d** | App.tsx integration | 2 |

**Total Points:** 8 (increased from 3 due to split overhead)

**Story Files:**
- [14e-14a-batch-handler-types-navigation.md](./stories/14e-14a-batch-handler-types-navigation.md)
- [14e-14b-batch-handler-edit-save.md](./stories/14e-14b-batch-handler-edit-save.md)
- [14e-14c-batch-handler-discard-credit.md](./stories/14e-14c-batch-handler-discard-credit.md)
- [14e-14d-batch-handler-integration.md](./stories/14e-14d-batch-handler-integration.md)

~~**Points:** 3~~ → **Points:** 8 (split)

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

### Story 14e.19: Transaction Entity Foundation

As a **developer**,
I want **transaction management organized as an entity module**,
So that **domain objects are clearly separated from features per FSD**.

**Context:**

Transaction is a **domain object** (entity) used by multiple features:
- `scan` → creates transactions
- `batch-review` → creates transactions
- `categories` → categorizes transactions

Placing it in `entities/` prevents circular dependencies and clarifies that Transaction is shared data, not a business capability.

**Acceptance Criteria:**

**Given** transaction hooks and utilities scattered across codebase
**When** this story is completed
**Then:**
- `src/entities/transaction/` structure created:
  - index.ts (public API)
  - hooks/useTransactions.ts (existing, re-exported)
  - hooks/useTransactionFilters.ts
  - utils/transactionHelpers.ts
  - types.ts
- Existing transaction hooks moved/re-exported
- Features import from `@entities/transaction`
- No breaking changes to consumers
- Transaction types centralized

**Technical Notes:**
- Add path alias `@entities/*` in tsconfig.json if not present
- This is the only entity for now; structure allows future entities (user, category, etc.)

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
14e.1 → 14e.6a → 14e.6b → 14e.6c → 14e.6d → 14e.8 → 14e.9 → 14e.10 → 14e.11
Note: 14e.7 was consolidated into 14e.6c during the 14e.6 split

Part 3 (Batch Review):
14e.6 (for Zustand store patterns) → 14e.12 → 14e.13 → 14e.14 → 14e.15 → 14e.16

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
| Zustand phase guards miss edge cases | Medium | Explicit test matrix for ALL valid/invalid transitions |
| processScan extraction breaks flow | High | Pre-extraction dependency audit, rollback plan |
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

---

## Test Strategy

### 1. Zustand Store Unit Tests (Stories 14e.6, 14e.12)

Each Zustand store must have comprehensive unit tests covering:

**Phase Transition Matrix:**
```
| Current Phase | Action        | Expected Result              |
|---------------|---------------|------------------------------|
| idle          | startSingle   | → capturing                  |
| idle          | startBatch    | → capturing                  |
| capturing     | processStart  | → processing                 |
| capturing     | startSingle   | BLOCKED (log warning)        |
| processing    | processSuccess| → reviewing                  |
| processing    | startBatch    | BLOCKED (log warning)        |
| ...           | ...           | ...                          |
```

**Edge Case Tests:**
- Rapid consecutive calls (race condition prevention)
- Reset during active operation
- Actions with stale closures
- Undo at boundary conditions

### 2. Integration Tests (Stories 14e.10, 14e.16, 14e.21)

Feature orchestrator integration tests:
- Feature renders correct UI for each phase
- Store actions trigger expected UI updates
- Modal Manager opens/closes correctly from features
- Feature-to-feature communication (if any)

### 3. E2E Smoke Tests (After each Part)

Manual or automated smoke tests after completing each Part:

**Part 1 (Modal Manager):**
- [ ] Open and close 3+ different modals
- [ ] Modal props passed correctly
- [ ] Close via escape key / backdrop click

**Part 2 (Scan Feature):**
- [ ] Single scan: capture → process → review → save
- [ ] Batch scan: capture 3 images → process → review → save all
- [ ] Statement scan: upload → process → review
- [ ] Error handling: network failure during process
- [ ] Cancel mid-flow

**Part 3 (Batch Review):**
- [ ] Approve all items
- [ ] Skip item → come back
- [ ] Reject item with reason
- [ ] Undo last action
- [ ] Complete batch

**Part 4 & 5:**
- [ ] All existing functionality still works
- [ ] No console errors
- [ ] Performance: no noticeable lag

### 4. Regression Prevention

After EVERY story:
```bash
npm run test        # All ~5,700 tests pass
npm run build       # Build succeeds
npm run lint        # No lint errors
```

If any fail → fix before merging, do NOT proceed to next story.
