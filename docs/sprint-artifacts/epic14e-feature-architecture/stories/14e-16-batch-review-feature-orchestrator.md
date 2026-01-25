# Story 14e.16: Batch Review Feature Orchestrator

Status: ready-for-dev

## Story

As a **developer**,
I want **a BatchReviewFeature component that orchestrates all batch review rendering**,
So that **App.tsx can render a single component for all batch review functionality, reducing App.tsx complexity by ~400-500 lines**.

## Context

This story creates the final orchestrator component for the batch review feature, completing Part 3 of Epic 14e. It follows the same pattern as ScanFeature (Story 14e-10), rendering phase-appropriate UI from the Zustand store.

### Current Implementation

| Component | Location | Lines | Purpose |
|-----------|----------|-------|---------|
| BatchReviewView | `src/views/BatchReviewView.tsx` | ~614 | Main review UI |
| useBatchReviewViewProps | `src/hooks/app/useBatchReviewViewProps.ts` | ~80 | Props composition hook |
| useBatchReview | `src/hooks/useBatchReview.ts` | ~430 | Business logic hook |
| BatchSummaryCard | `src/components/batch/BatchSummaryCard.tsx` | ~432 | Receipt card display |

### Target Architecture

```
src/features/batch-review/
  index.ts                    # Public API exports
  BatchReviewFeature.tsx      # ✨ THIS STORY - Feature orchestrator
  store/
    useBatchReviewStore.ts    # From 14e-12a/b
    selectors.ts              # From 14e-13
  handlers/
    index.ts                  # From 14e-14a/b/c/d
    types.ts
    navigationHandlers.ts
    editSaveHandlers.ts
    discardCreditHandlers.ts
  components/
    BatchReviewCard.tsx       # From 14e-15
    BatchProgressIndicator.tsx
    BatchHeader.tsx
    states/
      ReviewingState.tsx
      ProcessingState.tsx
      EmptyState.tsx
```

## Acceptance Criteria

### AC1: BatchReviewFeature Component Created
**Given** the batch review store, handlers, and components from previous stories (14e-12 through 14e-15)
**When** this story is completed
**Then:**
- `src/features/batch-review/BatchReviewFeature.tsx` created
- Component subscribes to `useBatchReviewStore()` for phase-based rendering
- Component renders appropriate state UI based on current phase:
  - `idle` → returns null (not visible)
  - `processing` → `<ProcessingState />` with progress indicator
  - `reviewing` → `<ReviewingState />` with receipt cards
  - `editing` → `<ReviewingState />` with edit mode active
  - `saving` → `<ReviewingState />` with save-in-progress indicator
  - `complete` → success message with auto-transition
  - `error` → error display with retry option

### AC2: App.tsx Integration
**Given** BatchReviewFeature orchestrator
**When** replacing inline BatchReviewView in App.tsx
**Then:**
- App.tsx imports `BatchReviewFeature` from `@features/batch-review`
- `{view === 'batch-review' && <BatchReviewFeature />}` replaces current BatchReviewView rendering
- `useBatchReviewViewProps` hook call removed from App.tsx
- BatchReviewView import removed from App.tsx
- ~400-500 lines removed from App.tsx (view rendering, props composition)

### AC3: Internal State Management
**Given** the component using Zustand store
**When** reviewing internal implementation
**Then:**
- Component uses `useBatchPhase()` for phase detection
- Component uses `useBatchProgress()` for progress display
- Component uses `useCurrentBatchItem()` for active item
- Component uses `useBatchReviewActions()` for action dispatch
- NO props passed from App.tsx for state (state is internal)
- Theme, currency, t (translation) can be passed as props OR obtained from context

### AC4: Handler Integration
**Given** handlers extracted in Story 14e-14a/b/c/d
**When** reviewing component event handling
**Then:**
- Navigation handlers called from feature handlers module
- Edit/save handlers called from feature handlers module
- Discard/credit handlers called from feature handlers module
- Component does NOT define business logic inline

### AC5: Processing State Integration
**Given** batch processing may be in progress
**When** `phase === 'processing'`
**Then:**
- `<ProcessingState />` component rendered
- Progress displayed via `useBatchProgress()`
- Cancel processing button functional
- Processing states list shown (from store)

### AC6: Modal Integration
**Given** batch review may need modals
**When** user triggers modal-requiring action
**Then:**
- Discard confirmation uses ModalManager (`openModal('confirmBatchDiscard', {...})`)
- Credit warning uses ModalManager (if applicable)
- NO inline modal rendering in BatchReviewFeature

### AC7: View Visibility Control
**Given** the feature orchestrator pattern
**When** App.tsx renders `<BatchReviewFeature />`
**Then:**
- Component returns `null` when `phase === 'idle'` (not visible)
- Component handles its own visibility logic based on phase
- Alternative: App.tsx conditionally renders based on view state (either pattern acceptable)

### AC8: Feature Export
**Given** the completed feature
**When** importing from feature module
**Then:**
- `src/features/batch-review/index.ts` exports `BatchReviewFeature`
- Public API includes:
  - `BatchReviewFeature` component
  - `useBatchReviewStore` and selectors
  - Types for external consumers (if any)

### AC9: Unit Tests
**Given** the orchestrator component
**When** running tests
**Then:**
- Tests verify phase-based rendering for all 6 phases
- Tests verify handler integration (mock store actions)
- Tests verify modal interactions (mock ModalManager)
- Test location: `tests/unit/features/batch-review/BatchReviewFeature.test.tsx`
- Coverage: >80% for orchestrator

### AC10: No Regressions
**Given** the migration
**When** testing batch review flow
**Then:**
- Batch capture → processing → review → save flow works
- Edit individual receipt works
- Discard receipt works
- Save all works
- Error handling works
- Cancel/back navigation works
- Build succeeds with no TypeScript errors

## Atlas Workflow Analysis

> 🗺️ This section generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact | Analysis |
|----------|--------|----------|
| **#3 Batch Processing Flow** | DIRECT | BatchReviewFeature **OWNS** the batch review phase UI. All rendering decisions flow through this orchestrator. |
| **#9 Scan Request Lifecycle** | INDIRECT | Batch review is a sub-phase within scan lifecycle. Must coordinate with ScanFeature (14e-10) for mode transitions. |
| **#1 Scan Receipt Flow** | DOWNSTREAM | Single scans may feed into batch context. Orchestrator must be mode-aware. |

### Downstream Effects to Consider

1. **View routing:** App.tsx view switch logic for `batch-review` will delegate to this feature
2. **State synchronization:** If ScanFeature also manages batch state, need clear boundaries
3. **Navigation:** Back button behavior must coordinate with overall app navigation

### Testing Implications

- **Existing tests to verify:** `tests/unit/views/BatchReviewView.test.tsx`, `tests/unit/hooks/app/useBatchReviewViewProps.test.ts`
- **New scenarios to add:** Feature orchestrator phase transitions, modal integration, handler delegation

### Workflow Chain Visualization

```
BatchCapture → Process API → [BATCH REVIEW FEATURE] → Save → Insights
                                    ↓
                              Phase-based UI:
                              - ProcessingState
                              - ReviewingState
                              - EmptyState/ErrorState
```

## Tasks / Subtasks

- [ ] **Task 1: Create BatchReviewFeature orchestrator** (AC: 1, 3, 7)
  - [ ] 1.1 Create `src/features/batch-review/BatchReviewFeature.tsx`
  - [ ] 1.2 Implement phase-based rendering switch
  - [ ] 1.3 Connect to store selectors (`useBatchPhase()`, `useBatchProgress()`, etc.)
  - [ ] 1.4 Handle idle phase (return null or hidden)
  - [ ] 1.5 Implement phase-to-component mapping

- [ ] **Task 2: Integrate state components** (AC: 1, 5)
  - [ ] 2.1 Import state components from `./components/states/`
  - [ ] 2.2 Wire `<ProcessingState />` for `phase === 'processing'`
  - [ ] 2.3 Wire `<ReviewingState />` for `phase === 'reviewing' | 'editing' | 'saving'`
  - [ ] 2.4 Wire `<EmptyState />` for empty batch scenarios
  - [ ] 2.5 Add error state handling

- [ ] **Task 3: Connect handlers** (AC: 4)
  - [ ] 3.1 Import handlers from `./handlers/`
  - [ ] 3.2 Wire navigation handlers to UI events
  - [ ] 3.3 Wire edit/save handlers to card interactions
  - [ ] 3.4 Wire discard/credit handlers to discard actions

- [ ] **Task 4: Integrate with ModalManager** (AC: 6)
  - [ ] 4.1 Import `useModalStore` from `@managers/ModalManager`
  - [ ] 4.2 Replace inline discard confirmation with `openModal('confirmBatchDiscard', ...)`
  - [ ] 4.3 Remove any inline modal rendering

- [ ] **Task 5: Update feature exports** (AC: 8)
  - [ ] 5.1 Add `BatchReviewFeature` to `src/features/batch-review/index.ts`
  - [ ] 5.2 Verify all public API exports
  - [ ] 5.3 Add any necessary types to exports

- [ ] **Task 6: Migrate App.tsx** (AC: 2)
  - [ ] 6.1 Import `BatchReviewFeature` from `@features/batch-review`
  - [ ] 6.2 Replace `{view === 'batch-review' && <BatchReviewView {...props} />}` with `{view === 'batch-review' && <BatchReviewFeature />}`
  - [ ] 6.3 Remove `useBatchReviewViewProps` hook call
  - [ ] 6.4 Remove `BatchReviewView` import
  - [ ] 6.5 Remove any batch-review-specific props composition
  - [ ] 6.6 Count lines removed (target: 400-500)

- [ ] **Task 7: Write unit tests** (AC: 9)
  - [ ] 7.1 Create `tests/unit/features/batch-review/BatchReviewFeature.test.tsx`
  - [ ] 7.2 Test phase-based rendering for all 6 phases
  - [ ] 7.3 Test handler integration with mocked store
  - [ ] 7.4 Test modal integration with mocked ModalManager
  - [ ] 7.5 Verify >80% coverage

- [ ] **Task 8: Verification and cleanup** (AC: 10)
  - [ ] 8.1 Run full test suite - all tests pass
  - [ ] 8.2 Build succeeds with no TypeScript errors
  - [ ] 8.3 Smoke test batch review flow:
    - [ ] Batch capture → processing → review
    - [ ] Edit individual receipt
    - [ ] Discard receipt
    - [ ] Save all receipts
    - [ ] Error scenarios
    - [ ] Cancel/back navigation
  - [ ] 8.4 Verify lines removed from App.tsx
  - [ ] 8.5 Update any broken imports in other files

## Dev Notes

### Store Selectors (from 14e-13)

```typescript
// Available selectors
import {
  useBatchReviewPhase,       // () => 'idle' | 'processing' | 'reviewing' | 'editing' | 'saving' | 'complete' | 'error'
  useCurrentBatchItem,       // () => BatchReceipt | null
  useBatchProgress,          // () => { current: number; total: number; completed: string[]; failed: string[] }
  useIsBatchReviewing,       // () => boolean
  useBatchReviewActions,     // () => { startBatch, addItem, selectItem, ... }
} from '@features/batch-review';
```

### Component Pattern

```typescript
// src/features/batch-review/BatchReviewFeature.tsx
import { useBatchReviewPhase, useBatchProgress, useBatchReviewActions } from './store';
import { ProcessingState, ReviewingState, EmptyState } from './components/states';
import { useModalStore } from '@managers/ModalManager';

export const BatchReviewFeature: React.FC = () => {
  const phase = useBatchReviewPhase();
  const progress = useBatchProgress();
  const actions = useBatchReviewActions();
  const { openModal } = useModalStore();

  // Idle phase - not visible
  if (phase === 'idle') return null;

  // Phase-based rendering
  switch (phase) {
    case 'processing':
      return <ProcessingState progress={progress} onCancel={actions.cancelProcessing} />;

    case 'reviewing':
    case 'editing':
    case 'saving':
      return (
        <ReviewingState
          isSaving={phase === 'saving'}
          isEditing={phase === 'editing'}
          onEdit={actions.editItem}
          onDiscard={(id) => openModal('confirmBatchDiscard', { receiptId: id })}
          onSaveAll={actions.saveAll}
        />
      );

    case 'complete':
      return <SuccessState onDismiss={actions.reset} />;

    case 'error':
      return <ErrorState error={/* from store */} onRetry={actions.retry} />;

    default:
      return null;
  }
};
```

### Backwards Compatibility During Migration

The component will temporarily need to support both patterns:

```typescript
// Temporary: Accept props for gradual migration
interface BatchReviewFeatureProps {
  // Legacy props (deprecated, for migration only)
  theme?: 'light' | 'dark';
  currency?: Currency;
  t?: (key: string) => string;
}

// Use props if provided, otherwise get from context/store
const theme = props.theme ?? useTheme();
```

Remove legacy props after App.tsx migration is verified.

### Dependencies

- **Depends on:**
  - Story 14e-1 (directory structure)
  - Story 14e-2, 14e-3 (ModalManager) - for modal integration
  - Story 14e-12a/b (Batch Review Zustand Store)
  - Story 14e-13 (Store Selectors)
  - Story 14e-14a/b/c/d (Handlers)
  - Story 14e-15 (Components)
- **Blocks:** None (completes Part 3)
- **Parallel with:** Story 14e-10 (ScanFeature orchestrator) if not yet complete

### Migration Checklist

After App.tsx migration, verify these references are removed/updated:

- [ ] `import { BatchReviewView } from './views/BatchReviewView'` - REMOVED
- [ ] `const batchReviewViewDataProps = useBatchReviewViewProps({...})` - REMOVED
- [ ] `{view === 'batch-review' && <BatchReviewView {...batchReviewViewDataProps} />}` - REPLACED
- [ ] Any inline batch-review state in App.tsx - REMOVED

### Lines to Remove from App.tsx

Based on current implementation:

| Section | Estimated Lines |
|---------|-----------------|
| BatchReviewView import | ~1 |
| useBatchReviewViewProps call + params | ~50-100 |
| View rendering conditional | ~5 |
| Props composition logic | ~50-100 |
| Batch-specific handlers (if any remain) | ~200-300 |
| **Total Estimated** | **~400-500** |

### Project Structure Notes

- Follows FSD feature pattern established in 14e-1
- Orchestrator pattern mirrors ScanFeature (14e-10)
- State components from `states/` subdirectory render phase-specific UI

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#story-14e16]
- [Source: src/views/BatchReviewView.tsx - Current view implementation]
- [Source: src/hooks/app/useBatchReviewViewProps.ts - Current props hook]
- [Source: src/App.tsx - Lines 2279, 2968 - Current integration points]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-10-scan-feature-orchestrator.md - Reference pattern]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
