# Story 14e.9b: Update Scan Components for Zustand Store

Status: ready-for-dev

<!-- Part 2/3 of Story 14e-9 split (2026-01-24) -->

## Story

As a **developer**,
I want **scan components updated to use the Zustand store**,
so that **components use the new state management system instead of ScanContext**.

## Acceptance Criteria

1. **AC1: Components Use Zustand Selectors**
   - ScanOverlay uses `useScanPhase()`, `useScanMode()`
   - ScanStatusIndicator uses `useScanPhase()`
   - ScanProgress uses `useScanProgress()`
   - ScanError uses `useScanError()`
   - ScanModeSelector uses `useScanActions()`

2. **AC2: Store Actions Replace Context Dispatch**
   - All `ScanContext.dispatch()` calls replaced with store actions
   - Actions called directly: `useScanActions().startSingle()`
   - No prop drilling for scan actions

3. **AC3: ScanContext Imports Removed**
   - No `useScan()` or `useScanContext()` imports in migrated components
   - Components are self-contained with Zustand hooks

4. **AC4: All Scan Phases Handled**
   - Components handle ALL ScanPhase values
   - Components work with both 'single' and 'batch' modes
   - Proper fallback states

5. **AC5: Existing Behavior Preserved**
   - Visual appearance unchanged
   - User interactions work identically
   - No regressions in scan flow

6. **AC6: Tests Updated**
   - Tests mock Zustand store instead of ScanContext
   - All existing tests pass with new implementation

## Tasks / Subtasks

- [ ] **Task 1: Update ScanOverlay** (AC: 1, 2, 3)
  - [ ] Replace `useScan()` with `useScanPhase()`, `useScanMode()`
  - [ ] Replace dispatch calls with `useScanActions()`
  - [ ] Remove ScanContext imports
  - [ ] Verify overlay renders correctly for all phases

- [ ] **Task 2: Update Indicator Components** (AC: 1, 2, 3)
  - [ ] Update ScanStatusIndicator to use `useScanPhase()`
  - [ ] Update ScanProgress to use `useScanProgress()`
  - [ ] Update ScanError to use `useScanError()`, `useScanActions()`
  - [ ] Update ScanReady to use `useScanPhase()`

- [ ] **Task 3: Update ScanModeSelector** (AC: 1, 2, 3)
  - [ ] Replace dispatch with `useScanActions().startSingle()`, `.startBatch()`
  - [ ] Remove ScanContext imports
  - [ ] Verify mode selection works

- [ ] **Task 4: Update Tests & Verify** (AC: 5, 6)
  - [ ] Create Zustand store mock utility
  - [ ] Update ScanOverlay.test.tsx for Zustand
  - [ ] Update ScanStatusIndicator.test.tsx for Zustand
  - [ ] Update ScanModeSelector.test.tsx for Zustand
  - [ ] Run full test suite
  - [ ] Run smoke test: single scan, batch scan

## Dev Notes

### Zustand Hooks (from Story 14e-6c)

```typescript
// Selector hooks
const phase = useScanPhase();           // 'idle' | 'capturing' | 'scanning' | 'reviewing' | 'saving' | 'error'
const mode = useScanMode();             // 'single' | 'batch' | 'statement'
const progress = useScanProgress();     // { current: number, total: number, status: string }
const error = useScanError();           // Error | null
const results = useScanResults();       // ScanResult[]

// Action hook
const actions = useScanActions();
actions.startSingle();
actions.startBatch();
actions.cancel();
actions.reset();
```

### Migration Pattern

```typescript
// Before (ScanContext)
import { useScan } from '@/contexts/ScanContext';

function ScanStatusIndicator() {
  const { state } = useScan();
  return <div>{state.phase}</div>;
}

// After (Zustand)
import { useScanPhase } from '@features/scan/store';

function ScanStatusIndicator() {
  const phase = useScanPhase();
  return <div>{phase}</div>;
}
```

### Test Mock Pattern

```typescript
// tests/setup/zustand-mocks.ts
import { useScanStore } from '@features/scan/store';

export function mockScanStore(overrides: Partial<ScanStoreState>) {
  const mockState = {
    phase: 'idle',
    mode: 'single',
    ...overrides,
  };
  vi.mocked(useScanPhase).mockReturnValue(mockState.phase);
  vi.mocked(useScanMode).mockReturnValue(mockState.mode);
  // etc.
}
```

### Components to Update

| Component | Current Hook | New Hook(s) |
|-----------|--------------|-------------|
| ScanOverlay | `useScan()` | `useScanPhase()`, `useScanMode()`, `useScanActions()` |
| ScanStatusIndicator | `useScan()` | `useScanPhase()` |
| ScanProgress | `useScan()` | `useScanProgress()` |
| ScanError | `useScan()` | `useScanError()`, `useScanActions()` |
| ScanReady | `useScan()` | `useScanPhase()` |
| ScanModeSelector | `useScan()` | `useScanActions()` |
| ScanSkeleton | None | None (pure UI) |
| ScanCompleteModal | `useScan()` | `useScanResults()` |

### Dependencies

- **Part of split from**: Story 14e-9
- **Depends On**: Story 14e-9a (Components moved), Story 14e-6c (Zustand hooks exist)
- **Blocks**: Story 14e-9c (State components)

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-6c-scan-zustand-selectors-exports.md]
- [Source: src/contexts/ScanContext.tsx] - Current context implementation

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Points:** 3
