# Story 14e.9c: Create State Components & Tests

Status: ready-for-dev

<!-- Part 3/3 of Story 14e-9 split (2026-01-24) -->

## Story

As a **developer**,
I want **state-specific components created for each scan phase**,
so that **the scan feature orchestrator can render phase-appropriate UI**.

## Acceptance Criteria

1. **AC1: State Components Created**
   - `states/IdleState.tsx` - Renders when phase === 'idle'
   - `states/ProcessingState.tsx` - Renders when phase === 'scanning'
   - `states/ReviewingState.tsx` - Renders when phase === 'reviewing'
   - `states/ErrorState.tsx` - Renders when phase === 'error'

2. **AC2: Phase-Gated Rendering**
   - Each component checks phase from `useScanPhase()`
   - Returns `null` if phase doesn't match
   - Clear phase-to-component mapping

3. **AC3: Mode-Aware Rendering**
   - Components check mode via `useScanMode()`
   - Different UI for 'single' vs 'batch' where appropriate
   - Statement mode handled (or shows placeholder)

4. **AC4: Reuses Existing Components**
   - ProcessingState wraps ScanProgress
   - ErrorState wraps ScanError
   - Avoids code duplication

5. **AC5: Unit Tests**
   - Each state component has comprehensive tests
   - Tests verify phase-gated rendering
   - Tests verify mode-aware variations
   - Tests verify Zustand store integration

6. **AC6: Exports & Integration**
   - State components exported from `states/index.ts`
   - Re-exported from main `components/index.ts`
   - Ready for Story 14e-10 (Orchestrator)

## Tasks / Subtasks

- [ ] **Task 1: Create IdleState Component** (AC: 1, 2, 3)
  - [ ] Create `states/IdleState.tsx`
  - [ ] Read phase from `useScanPhase()`
  - [ ] Return null if phase !== 'idle'
  - [ ] Render camera-ready prompt UI
  - [ ] Handle mode-specific messaging

- [ ] **Task 2: Create ProcessingState Component** (AC: 1, 2, 4)
  - [ ] Create `states/ProcessingState.tsx`
  - [ ] Read phase from `useScanPhase()`
  - [ ] Return null if phase !== 'scanning'
  - [ ] Wrap ScanProgress component
  - [ ] Pass progress data from `useScanProgress()`

- [ ] **Task 3: Create ReviewingState Component** (AC: 1, 2, 3)
  - [ ] Create `states/ReviewingState.tsx`
  - [ ] Read phase from `useScanPhase()`
  - [ ] Return null if phase !== 'reviewing'
  - [ ] Render result preview UI
  - [ ] Mode-aware: single vs batch review layout

- [ ] **Task 4: Create ErrorState Component** (AC: 1, 2, 4)
  - [ ] Create `states/ErrorState.tsx`
  - [ ] Read phase from `useScanPhase()`
  - [ ] Return null if phase !== 'error'
  - [ ] Wrap ScanError component
  - [ ] Add retry action via `useScanActions().reset()`

- [ ] **Task 5: Create State Component Tests** (AC: 5)
  - [ ] Create `tests/unit/features/scan/components/states/` directory
  - [ ] Create IdleState.test.tsx - phase guard, mode variations
  - [ ] Create ProcessingState.test.tsx - phase guard, progress display
  - [ ] Create ReviewingState.test.tsx - phase guard, mode variations
  - [ ] Create ErrorState.test.tsx - phase guard, retry action

- [ ] **Task 6: Exports & Barrel Files** (AC: 6)
  - [ ] Create `states/index.ts` with all state exports
  - [ ] Update `components/index.ts` to re-export states
  - [ ] Verify build succeeds
  - [ ] Run all tests

## Dev Notes

### State Component Pattern

```typescript
// states/ProcessingState.tsx
import { useScanPhase, useScanProgress } from '../store';
import { ScanProgress } from '../ScanProgress';

export function ProcessingState() {
  const phase = useScanPhase();
  const progress = useScanProgress();

  // Phase guard - don't render if wrong phase
  if (phase !== 'scanning') return null;

  return <ScanProgress progress={progress} />;
}
```

### ErrorState with Retry

```typescript
// states/ErrorState.tsx
import { useScanPhase, useScanError, useScanActions } from '../store';
import { ScanError } from '../ScanError';

export function ErrorState() {
  const phase = useScanPhase();
  const error = useScanError();
  const { reset } = useScanActions();

  if (phase !== 'error') return null;

  return (
    <ScanError
      error={error}
      onRetry={reset}
    />
  );
}
```

### Mode-Aware IdleState

```typescript
// states/IdleState.tsx
export function IdleState() {
  const phase = useScanPhase();
  const mode = useScanMode();

  if (phase !== 'idle') return null;

  const message = mode === 'batch'
    ? 'Tap to add more receipts'
    : 'Tap to scan a receipt';

  return <div className="idle-prompt">{message}</div>;
}
```

### Test Pattern

```typescript
// IdleState.test.tsx
describe('IdleState', () => {
  it('renders when phase is idle', () => {
    vi.mocked(useScanPhase).mockReturnValue('idle');
    vi.mocked(useScanMode).mockReturnValue('single');

    render(<IdleState />);
    expect(screen.getByText(/tap to scan/i)).toBeInTheDocument();
  });

  it('returns null when phase is not idle', () => {
    vi.mocked(useScanPhase).mockReturnValue('scanning');

    const { container } = render(<IdleState />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows batch message in batch mode', () => {
    vi.mocked(useScanPhase).mockReturnValue('idle');
    vi.mocked(useScanMode).mockReturnValue('batch');

    render(<IdleState />);
    expect(screen.getByText(/add more receipts/i)).toBeInTheDocument();
  });
});
```

### Directory Structure After Completion

```
src/features/scan/components/
├── index.ts                    # Exports all + states
├── ScanOverlay.tsx             # From 14e-9a/b
├── ScanStatusIndicator.tsx
├── ... (other moved components)
└── states/
    ├── index.ts               # State exports
    ├── IdleState.tsx          # NEW
    ├── ProcessingState.tsx    # NEW
    ├── ReviewingState.tsx     # NEW
    └── ErrorState.tsx         # NEW

tests/unit/features/scan/components/states/
├── IdleState.test.tsx         # NEW
├── ProcessingState.test.tsx   # NEW
├── ReviewingState.test.tsx    # NEW
└── ErrorState.test.tsx        # NEW
```

### Dependencies

- **Part of split from**: Story 14e-9
- **Depends On**: Story 14e-9a (move), Story 14e-9b (Zustand update), Story 14e-6c (hooks)
- **Blocks**: Story 14e-10 (Scan Feature Orchestrator)

### Atlas Workflow Impact

#### Affected Workflows
- **Scan Receipt Flow (#1)**: New state components for visual layer
- **Quick Save Flow (#2)**: ReviewingState handles quick save preview

#### Testing Implications
- **New test scenarios**: Phase-gated rendering for each component
- **Mode variations**: Test single vs batch rendering

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e9]
- [Source: src/features/scan/store/] - Zustand hooks (from Story 14e-6c)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Points:** 3
