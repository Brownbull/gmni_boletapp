# Story 14e.15: Batch Review Feature Components

Status: ready-for-dev

## Story

As a **developer**,
I want **batch review components organized in the feature module using the Zustand store**,
So that **all batch review UI is colocated with batch logic and uses centralized state management**.

## Context

This story moves existing batch review components to the feature directory structure and updates them to consume the `useBatchReviewStore()` Zustand store created in stories 14e-12a/b and 14e-13.

### Current Component Locations

| Component | Current Location | Lines |
|-----------|------------------|-------|
| BatchSummaryCard | `src/components/batch/BatchSummaryCard.tsx` | ~432 |
| BatchReviewView | `src/views/BatchReviewView.tsx` | ~614 |
| useBatchReview | `src/hooks/useBatchReview.ts` | ~430 |

### Target Structure

```
src/features/batch-review/
  components/
    BatchReviewCard.tsx       # Renamed from BatchSummaryCard (clarity)
    BatchProgressIndicator.tsx # Extracted from BatchReviewView
    BatchHeader.tsx           # Header section from BatchReviewView
    states/
      ReviewingState.tsx      # Main reviewing UI state
      ProcessingState.tsx     # Processing progress UI
      EmptyState.tsx          # Empty batch state
    index.ts                  # Barrel exports
  index.ts                    # Feature-level exports
```

**Note:** `BatchSummary.tsx` in `src/components/insights/` is a DIFFERENT component (Epic 10.7 - session summary for insights) and NOT part of this migration.

## Acceptance Criteria

### AC1: Component Directory Structure
**Given** Story 14e-12b and 14e-13 completed (Zustand store with selectors)
**When** this story is completed
**Then:**
- `src/features/batch-review/components/` directory exists
- `src/features/batch-review/components/states/` directory exists
- All batch review components organized under these directories
- Barrel exports from `src/features/batch-review/components/index.ts`

### AC2: BatchReviewCard Component Migration
**Given** `BatchSummaryCard.tsx` in `src/components/batch/`
**When** reviewing the migrated component
**Then:**
- Moved to `src/features/batch-review/components/BatchReviewCard.tsx`
- Renamed from `BatchSummaryCard` to `BatchReviewCard` for clarity
- Uses `useBatchReviewStore()` selectors instead of props for:
  - `discardItem()` action
  - Store-managed state where applicable
- Props for item-specific data (receipt, imageUrl) remain
- All existing functionality preserved
- Component tests migrated to `tests/unit/features/batch-review/components/`

### AC3: BatchProgressIndicator Extraction
**Given** processing progress UI inline in `BatchReviewView.tsx`
**When** reviewing the extracted component
**Then:**
- `BatchProgressIndicator.tsx` created in components directory
- Extracts the processing progress bar and states list
- Uses store selectors for progress state:
  - `useBatchProgress()` - { current, total }
  - `useBatchPhase()` - to determine if showing progress
- Props: `onCancelProcessing: () => void`
- Unit tests cover progress display and cancel interaction

### AC4: State Components Created
**Given** the need for phase-based UI rendering
**When** reviewing state components
**Then:**
- `states/ReviewingState.tsx` - Main review UI with receipt cards list
- `states/ProcessingState.tsx` - Processing progress display (uses BatchProgressIndicator)
- `states/EmptyState.tsx` - Empty batch message
- Each state component renders appropriate UI for its phase
- Uses store selectors for state-specific data

### AC5: Zustand Store Integration
**Given** the components using props for state
**When** reviewing store integration
**Then:**
- Components consume `useBatchReviewStore()` via selectors
- Actions called via store: `discardItem()`, `selectItem()`, `updateItem()`
- Phase-based rendering: `useBatchPhase()` determines which state component to show
- Current item: `useCurrentBatchItem()` for active review
- Progress: `useBatchProgress()` for progress display
- Props reduced to: event handlers, display overrides, styling

### AC6: Unit Tests
**Given** the migrated and new components
**When** running tests
**Then:**
- All existing BatchSummaryCard tests pass (renamed to BatchReviewCard)
- New tests for:
  - BatchProgressIndicator rendering and interaction
  - State components rendering correct UI
  - Store integration (mock store for tests)
- Test location: `tests/unit/features/batch-review/components/`
- Coverage: >80% for new components

### AC7: No Regressions
**Given** the migrated components
**When** testing batch review flow
**Then:**
- All existing batch review functionality works
- Processing → Reviewing → Saving flow unchanged
- Edit, discard, save individual, save all work
- Build succeeds with no TypeScript errors

## Tasks / Subtasks

- [ ] **Task 1: Create component directory structure** (AC: 1)
  - [ ] 1.1 Create `src/features/batch-review/components/` directory
  - [ ] 1.2 Create `src/features/batch-review/components/states/` directory
  - [ ] 1.3 Create `src/features/batch-review/components/index.ts` barrel export
  - [ ] 1.4 Update `src/features/batch-review/index.ts` to export components

- [ ] **Task 2: Migrate BatchReviewCard (BatchSummaryCard)** (AC: 2, 5)
  - [ ] 2.1 Copy `BatchSummaryCard.tsx` to `components/BatchReviewCard.tsx`
  - [ ] 2.2 Rename component and update imports
  - [ ] 2.3 Replace prop-based actions with store actions where appropriate
  - [ ] 2.4 Update import paths for dependencies (`@features/batch-review/store`)
  - [ ] 2.5 Create re-export alias from old location for backwards compatibility (temporary)
  - [ ] 2.6 Migrate existing tests to `tests/unit/features/batch-review/components/`

- [ ] **Task 3: Extract BatchProgressIndicator** (AC: 3, 5)
  - [ ] 3.1 Create `components/BatchProgressIndicator.tsx`
  - [ ] 3.2 Extract progress bar and states list UI from BatchReviewView
  - [ ] 3.3 Integrate with store selectors (`useBatchProgress()`)
  - [ ] 3.4 Add props for cancel handler
  - [ ] 3.5 Write unit tests for progress display and cancel

- [ ] **Task 4: Create state components** (AC: 4, 5)
  - [ ] 4.1 Create `states/ProcessingState.tsx` using BatchProgressIndicator
  - [ ] 4.2 Create `states/ReviewingState.tsx` with receipt cards list
  - [ ] 4.3 Create `states/EmptyState.tsx` for empty batch
  - [ ] 4.4 Integrate store selectors in each state component
  - [ ] 4.5 Write unit tests for each state component

- [ ] **Task 5: Verify and cleanup** (AC: 6, 7)
  - [ ] 5.1 Run full test suite - all tests pass
  - [ ] 5.2 Build succeeds with no TypeScript errors
  - [ ] 5.3 Smoke test batch review flow in app
  - [ ] 5.4 Update imports in BatchReviewView to use new components (prep for 14e-16)
  - [ ] 5.5 Document any breaking changes or migration notes

## Dev Notes

### Store Selectors Available (from 14e-13)

```typescript
// From src/features/batch-review/store/selectors.ts
import {
  useBatchReviewPhase,
  useCurrentBatchItem,
  useBatchProgress,
  useIsBatchReviewing,
  useBatchReviewActions,
} from '@features/batch-review';
```

### Component Pattern

Components should follow this pattern for store integration:

```typescript
// src/features/batch-review/components/BatchReviewCard.tsx
import { useBatchReviewStore } from '../store';

export const BatchReviewCard: React.FC<BatchReviewCardProps> = ({
  receipt,
  theme,
  currency,
  t,
  onEdit,
  onSave,
}) => {
  // Get actions from store
  const discardItem = useBatchReviewStore((state) => state.discardItem);

  const handleDiscard = () => {
    discardItem(receipt.id);
  };

  // ... rest of component
};
```

### Test Mocking Pattern

```typescript
// tests/unit/features/batch-review/components/BatchReviewCard.test.ts
import { useBatchReviewStore } from '@features/batch-review';

// Mock the store
vi.mock('@features/batch-review', () => ({
  useBatchReviewStore: vi.fn(() => ({
    discardItem: vi.fn(),
    // ... other mocked state/actions
  })),
}));
```

### Dependencies

- **Depends on:**
  - Story 14e-1 (directory structure)
  - Story 14e-12a/b (Zustand store)
  - Story 14e-13 (store selectors)
- **Blocks:** Story 14e-16 (BatchReviewFeature orchestrator)

### Atlas Workflow Impact

**Workflow #3 (Batch Processing):** DIRECT
- Components render batch processing results
- Store actions for discard/edit integrated

**Workflow #9 (Scan Lifecycle):** INDIRECT
- Batch review is a sub-phase of scan flow
- Components must integrate with scan phase transitions

### Backwards Compatibility

During migration, maintain re-exports from old locations:

```typescript
// src/components/batch/BatchSummaryCard.tsx (temporary alias)
export { BatchReviewCard as BatchSummaryCard } from '@features/batch-review/components';
```

Remove these aliases in Story 14e-16 when BatchReviewFeature orchestrator takes over.

### Project Structure Notes

- Components follow FSD feature structure
- State components in `states/` subdirectory for phase-based rendering pattern
- Tests mirror source structure under `tests/unit/features/`

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#story-14e15]
- [Source: src/components/batch/BatchSummaryCard.tsx - Current implementation]
- [Source: src/views/BatchReviewView.tsx - Current view with inline progress UI]
- [Source: src/hooks/useBatchReview.ts - Hook being replaced by store]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
