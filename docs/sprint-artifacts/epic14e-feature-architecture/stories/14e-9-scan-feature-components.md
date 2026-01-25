# Story 14e.9: Scan Feature Components

Status: split

<!-- Note: Story created via atlas-create-story workflow 2026-01-24 -->
<!-- SPLIT 2026-01-24: Exceeded sizing limits (6 tasks, 37 subtasks, ~12 files) -->
<!-- Split into: 14e-9a (move), 14e-9b (Zustand update), 14e-9c (state components) -->

## Split Stories

| Story | Description | Points | Status |
|-------|-------------|--------|--------|
| [14e-9a](./14e-9a-move-scan-components.md) | Move existing components + update imports | 2 | ready-for-dev |
| [14e-9b](./14e-9b-zustand-component-update.md) | Update components to use Zustand store | 3 | ready-for-dev |
| [14e-9c](./14e-9c-state-components-tests.md) | Create state components + tests | 3 | ready-for-dev |

**Total Points:** 8 (increased from original 3 due to split overhead)

---

## Original Story (Archived for Reference)

### Story

As a **developer**,
I want **scan-related components organized in the scan feature directory**,
so that **all scan UI is colocated with scan logic and uses the Zustand store**.

## Acceptance Criteria

1. **AC1: Component Directory Structure**
   - `src/features/scan/components/` directory created
   - Existing components moved from `src/components/scan/`
   - State-specific components organized in `states/` subdirectory

2. **AC2: State-Based Components Created**
   - `states/IdleState.tsx` - Renders when phase === 'idle'
   - `states/ProcessingState.tsx` - Renders when phase === 'scanning' (with progress)
   - `states/ReviewingState.tsx` - Renders when phase === 'reviewing'
   - `states/ErrorState.tsx` - Renders when phase === 'error'
   - Components accept minimal props, read phase from `useScanStore()`

3. **AC3: Components Use Zustand Store**
   - All migrated components use `useScanStore()` hooks instead of ScanContext
   - Components call store actions directly (e.g., `useScanActions().cancel()`)
   - No prop drilling for scan state/actions

4. **AC4: Existing Behavior Preserved**
   - ScanOverlay visual behavior unchanged
   - ScanStatusIndicator displays correct phase text
   - ScanModeSelector works with FAB long-press
   - ScanError displays error messages correctly
   - All existing visual/interaction patterns preserved

5. **AC5: All Scan Phases Handled**
   - Components handle ALL ScanPhase values: 'idle', 'capturing', 'scanning', 'reviewing', 'saving', 'error'
   - Components work with both scan modes: 'single' and 'batch'
   - Proper fallback/loading states for edge cases

6. **AC6: Unit Tests**
   - Each state component has unit tests
   - Tests verify correct rendering for each phase
   - Tests verify Zustand store integration
   - Existing test files migrated with passing tests

7. **AC7: Barrel Exports**
   - `src/features/scan/components/index.ts` exports all public components
   - Clear public API for feature consumers

## Tasks / Subtasks

- [ ] **Task 1: Create Directory Structure** (AC: 1)
  - [ ] Create `src/features/scan/components/` directory
  - [ ] Create `src/features/scan/components/states/` subdirectory
  - [ ] Create `src/features/scan/components/index.ts` barrel file

- [ ] **Task 2: Move Existing Components** (AC: 1, 4)
  - [ ] Move ScanOverlay.tsx to new location
  - [ ] Move ScanStatusIndicator.tsx to new location
  - [ ] Move ScanModeSelector.tsx to new location
  - [ ] Move ScanProgress.tsx to new location
  - [ ] Move ScanError.tsx to new location
  - [ ] Move ScanReady.tsx to new location
  - [ ] Move ScanSkeleton.tsx to new location
  - [ ] Move ScanCompleteModal.tsx to new location
  - [ ] Update all import paths across codebase

- [ ] **Task 3: Update Components to Use Zustand Store** (AC: 3, 5)
  - [ ] Update ScanOverlay to use `useScanStore()` selectors
  - [ ] Update ScanStatusIndicator to use `useScanPhase()` selector
  - [ ] Update ScanProgress to use `useScanProgress()` selector
  - [ ] Update ScanError to use `useScanError()` selector
  - [ ] Update ScanModeSelector to use `useScanActions()`
  - [ ] Replace all ScanContext.dispatch with store actions
  - [ ] Remove ScanContext imports from migrated components

- [ ] **Task 4: Create State Components** (AC: 2, 5)
  - [ ] Create `states/IdleState.tsx` - Camera-ready prompt UI
  - [ ] Create `states/ProcessingState.tsx` - Wraps ScanProgress with phase guard
  - [ ] Create `states/ReviewingState.tsx` - Result preview UI
  - [ ] Create `states/ErrorState.tsx` - Wraps ScanError with retry action
  - [ ] Each component checks phase from store before rendering
  - [ ] Add mode-aware rendering (single vs batch)

- [ ] **Task 5: Migrate & Create Tests** (AC: 6)
  - [ ] Move existing tests from `tests/unit/components/scan/`
  - [ ] Update test imports for new locations
  - [ ] Create tests for IdleState component
  - [ ] Create tests for ProcessingState component
  - [ ] Create tests for ReviewingState component
  - [ ] Create tests for ErrorState component
  - [ ] Verify all existing tests pass

- [ ] **Task 6: Barrel Exports & Integration** (AC: 7)
  - [ ] Export all components from `index.ts`
  - [ ] Add re-exports for backward compatibility if needed
  - [ ] Verify build succeeds
  - [ ] Run smoke test: single scan, batch scan

## Dev Notes

### Existing Components to Move

Located in `src/components/scan/`:

| Component | Purpose | Zustand Hook Needed |
|-----------|---------|---------------------|
| ScanOverlay.tsx | Camera overlay with capture UI | `useScanPhase()`, `useScanMode()` |
| ScanStatusIndicator.tsx | Phase status text display | `useScanPhase()` |
| ScanModeSelector.tsx | FAB long-press mode popup | `useScanActions()` |
| ScanProgress.tsx | Processing progress bar | `useScanProgress()` |
| ScanError.tsx | Error message display | `useScanError()`, `useScanActions()` |
| ScanReady.tsx | Ready-to-scan state | `useScanPhase()` |
| ScanSkeleton.tsx | Loading placeholder | None (pure UI) |
| ScanCompleteModal.tsx | Completion summary | `useScanResults()` |

### State Components Design

```typescript
// Example: states/ProcessingState.tsx
export function ProcessingState() {
  const phase = useScanPhase();
  const progress = useScanProgress();

  if (phase !== 'scanning') return null;

  return <ScanProgress progress={progress} />;
}
```

### Zustand Hooks Required (from Story 14e-6c)

```typescript
// Selector hooks from useScanStore
useScanPhase()      // Returns current phase
useScanMode()       // Returns 'single' | 'batch' | 'statement'
useScanProgress()   // Returns { current, total, status }
useScanError()      // Returns error state
useScanResults()    // Returns scan results
useScanActions()    // Returns all actions
```

### Import Path Updates

After migration, update imports like:
```typescript
// Before
import { ScanOverlay } from '@/components/scan/ScanOverlay';

// After
import { ScanOverlay } from '@features/scan/components';
```

### Target Directory Structure

```
src/features/scan/components/
├── index.ts                    # Barrel exports
├── ScanOverlay.tsx            # Moved + updated
├── ScanStatusIndicator.tsx    # Moved + updated
├── ScanModeSelector.tsx       # Moved + updated
├── ScanProgress.tsx           # Moved + updated
├── ScanError.tsx              # Moved + updated
├── ScanReady.tsx              # Moved + updated
├── ScanSkeleton.tsx           # Moved (pure UI)
├── ScanCompleteModal.tsx      # Moved + updated
└── states/
    ├── index.ts               # State components exports
    ├── IdleState.tsx          # NEW
    ├── ProcessingState.tsx    # NEW
    ├── ReviewingState.tsx     # NEW
    └── ErrorState.tsx         # NEW
```

### Project Structure Notes

- Follows FSD (Feature-Sliced Design) principles
- Components are feature-owned, not shared
- Public API via barrel exports only
- Internal components can be private (not exported from index.ts)

### Testing Strategy

1. **Existing tests migration**: Move and update paths
2. **State component tests**: Phase-gated rendering
3. **Store integration tests**: Verify store calls
4. **Visual regression**: Manual smoke test

### Dependencies

- **Depends On**: Story 14e-6c (Scan Store Selectors) - provides hooks
- **Blocks**: Story 14e-10 (Scan Feature Orchestrator)

### Atlas Workflow Impact

> This section generated by Atlas workflow chain analysis

#### Affected Workflows
- **Scan Receipt Flow (#1)**: UI layer restructuring (HIGH impact)
- **Quick Save Flow (#2)**: ScanResultModal and reviewing state (MEDIUM impact)
- **Batch Processing Flow (#3)**: State components shared with batch mode (MEDIUM impact)

#### Testing Implications
- **Existing tests to verify**: ScanOverlay.test.tsx, ScanStatusIndicator.test.tsx, ScanModeSelector.test.tsx
- **New test scenarios**: Phase-gated rendering, mode-aware rendering, store action calls

#### Workflow Chain Visualization
```
Camera Tap → [IdleState] → Mode Select → [ProcessingState] → [ReviewingState/ErrorState] → Save
```

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e9]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md]
- [Source: src/components/scan/*] - Current component locations
- [Source: src/types/scanStateMachine.ts] - ScanPhase type definition

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
