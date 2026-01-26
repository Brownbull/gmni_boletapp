# Story 14e.9b: Update Scan Components for Zustand Store

Status: done

<!-- Part 2/3 of Story 14e-9 split (2026-01-24) -->

## Story

As a **developer**,
I want **scan components updated to use the Zustand store**,
so that **components use the new state management system instead of ScanContext**.

## Acceptance Criteria

> **⚠️ Scope Deviation Note (2026-01-26):** Investigation revealed that only ScanCompleteModal used ScanContext hooks directly. Other components (ScanOverlay, ScanStatusIndicator, ScanProgress, ScanError, ScanReady, ScanModeSelector) were already prop-based presentation components. AC1-4 applied only to ScanCompleteModal migration. See Dev Agent Record for details.

1. **AC1: Components Use Zustand Selectors** ✅
   - ~~ScanOverlay uses `useScanPhase()`, `useScanMode()`~~ *N/A - prop-based*
   - ~~ScanStatusIndicator uses `useScanPhase()`~~ *N/A - prop-based*
   - ~~ScanProgress uses `useScanProgress()`~~ *N/A - prop-based*
   - ~~ScanError uses `useScanError()`~~ *N/A - prop-based*
   - ~~ScanModeSelector uses `useScanActions()`~~ *N/A - prop-based*
   - **ScanCompleteModal uses `useScanActiveDialog()`, `useScanActions()`** ✅

2. **AC2: Store Actions Replace Context Dispatch** ✅
   - ScanCompleteModal: `useScanActions().resolveDialog()` replaces context dispatch
   - Other components: N/A (prop-based, no dispatch calls)

3. **AC3: ScanContext Imports Removed** ✅
   - ScanCompleteModal: No `useScanOptional()` import
   - Other components: Already had no ScanContext imports

4. **AC4: All Scan Phases Handled** ✅
   - ScanCompleteModal handles SCAN_COMPLETE dialog type
   - Other components: N/A (receive phase via props)

5. **AC5: Existing Behavior Preserved** ✅
   - Visual appearance unchanged
   - User interactions work identically
   - No regressions in scan flow

6. **AC6: Tests Updated** ✅
   - Tests mock Zustand store instead of ScanContext
   - All existing tests pass with new implementation (5451 unit + 347 integration)

## Tasks / Subtasks

- [x] **Task 1: Update ScanOverlay** (AC: 1, 2, 3) — *N/A: Prop-based*
  - [x] ~~Replace `useScan()` with `useScanPhase()`, `useScanMode()`~~ *Already prop-based*
  - [x] ~~Replace dispatch calls with `useScanActions()`~~ *No dispatch calls*
  - [x] ~~Remove ScanContext imports~~ *No ScanContext imports*
  - [x] Verify overlay renders correctly for all phases — *Tests pass*

- [x] **Task 2: Update Indicator Components** (AC: 1, 2, 3) — *N/A: Prop-based*
  - [x] ~~Update ScanStatusIndicator to use `useScanPhase()`~~ *Already prop-based*
  - [x] ~~Update ScanProgress to use `useScanProgress()`~~ *Already prop-based*
  - [x] ~~Update ScanError to use `useScanError()`, `useScanActions()`~~ *Already prop-based*
  - [x] ~~Update ScanReady to use `useScanPhase()`~~ *Already prop-based*

- [x] **Task 3: Update ScanModeSelector** (AC: 1, 2, 3) — *N/A: Prop-based*
  - [x] ~~Replace dispatch with `useScanActions().startSingle()`, `.startBatch()`~~ *Calls onSelectMode prop*
  - [x] ~~Remove ScanContext imports~~ *No ScanContext imports*
  - [x] Verify mode selection works — *31 tests pass*

- [x] **Task 4: Update Tests & Verify** (AC: 5, 6)
  - [x] Create Zustand store mock utility — `resetScanStore()`, `setScanStoreState()`, `getScanStoreState()`
  - [x] ~~Update ScanOverlay.test.tsx for Zustand~~ *No changes needed (prop-based)*
  - [x] ~~Update ScanStatusIndicator.test.tsx for Zustand~~ *No changes needed (prop-based)*
  - [x] ~~Update ScanModeSelector.test.tsx for Zustand~~ *No changes needed (prop-based)*
  - [x] Update ScanCompleteModal tests for Zustand — *23 tests in DialogScanContextIntegration.test.tsx*
  - [x] Run full test suite — *5451 unit + 347 integration tests pass*
  - [x] Run smoke test: single scan, batch scan — *via integration tests*

- [x] **Task 5: ScanCompleteModal Migration** (AC: 1, 2, 3, 4) — *Actual migration work*
  - [x] Replace `useScanOptional()` with `useScanActiveDialog()`, `useScanActions()`
  - [x] Add new selectors: `useScanActiveDialog()`, `useScanError()`, `useScanResults()`
  - [x] Maintain backward compatibility with prop-based usage
  - [x] Update DialogScanContextIntegration.test.tsx for Zustand

### Review Follow-ups (AI)

> Atlas-enhanced code review performed 2026-01-26

- [x] [AI-Review][HIGH] Update task checkboxes to reflect actual work done - Tasks 1-3 marked N/A (prop-based), Task 4 complete, Task 5 added for ScanCompleteModal
- [x] [AI-Review][HIGH] Add scope deviation note to ACs - Documented that AC1-4 only applied to ScanCompleteModal
- [x] [AI-Review][MEDIUM] Add architectural decision: See Dev Notes below - prop-based components preserved
- [x] [AI-Review][MEDIUM] Add unit tests for new selectors OR document coverage - Integration tests in DialogScanContextIntegration.test.tsx cover selectors (23 tests)
- [x] [AI-Review][LOW] Add test summary to Dev Agent Record - "23 tests pass in DialogScanContextIntegration.test.tsx"

#### Test Import Resolution Issues (Dev Cycle 2) — ✅ RESOLVED

> Discovered during Archie post-dev review 2026-01-26. Fixed 2026-01-26.

- [x] [AI-Review][HIGH] Fix `@features/scan/components` import resolution in moved test files
  - **Root cause:** `vite.config.ts` missing explicit path aliases for test files (tsconfig.json `include: ['src']` limits tsconfigPaths scope)
  - **Fix:** Added `resolve.alias` in `vite.config.ts` with `@features`, `@entities`, `@managers`, `@shared`, `@app`, `@` aliases
  - All tests now pass: ScanModeSelector (31), ScanOverlay (25), ScanStatusIndicator tests

- [x] [AI-Review][HIGH] Fix `@/components/scan/*` imports in DialogScanContextIntegration.test.tsx
  - **Root cause:** Same as above - missing path aliases in vite.config.ts for integration tests
  - **Fix:** Same fix as above - added `@` alias resolving to `src`
  - All 23 tests pass

- [x] [AI-Review][MEDIUM] Run full test suite after fixes
  - Unit tests: 5451 passed, 33 skipped (220 files)
  - Integration tests: 347 passed, 29 skipped (25 files)
  - Total: **5798 tests pass** ✅

#### Post-Dev Feature Review (Archie) — ✅ APPROVED 2026-01-26

> 🚒 React Opinionated Architect post-dev review

**Verdict:** ✅ APPROVED WITH NOTES (0 HIGH, 1 MEDIUM, 2 LOW)

**Compliant Areas:**
- FSD layer placement: ScanCompleteModal correctly in `features/scan/components/`
- Zustand selectors: `useScanActiveDialog()`, `useScanActions()` with `useShallow()`
- State management: No server state in Zustand, clean dialog pattern
- Testing: Accessible queries, proper store isolation via `resetScanStore()`
- Backward compatibility: Dual API (store + props) well-documented

**Findings (accepted as-is):**
- [MEDIUM] Test file location: DialogScanContextIntegration.test.tsx is cross-component integration test, acceptable in `tests/unit/`
- [LOW] New selectors (`useScanError`, `useScanResults`) covered by integration tests, direct unit tests optional
- [LOW] Import path convention (`@/` vs `@features/`) is consistent and functional

**Test Results:** 5451 unit + 347 integration = 5798 tests pass ✅

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

| Component | Original Hook | Actual Status | New Hook(s) |
|-----------|--------------|---------------|-------------|
| ScanOverlay | *Expected: `useScan()`* | **Prop-based** | N/A |
| ScanStatusIndicator | *Expected: `useScan()`* | **Prop-based** | N/A |
| ScanProgress | *Expected: `useScan()`* | **Prop-based** | N/A |
| ScanError | *Expected: `useScan()`* | **Prop-based** | N/A |
| ScanReady | *Expected: `useScan()`* | **Prop-based** | N/A |
| ScanModeSelector | *Expected: `useScan()`* | **Prop-based** | N/A |
| ScanSkeleton | None | Pure UI | N/A |
| **ScanCompleteModal** | `useScanOptional()` | **Migrated** ✅ | `useScanActiveDialog()`, `useScanActions()` |

### Architectural Decision: Prop-based Presentation Components

> **Decision:** Prop-based presentation components will NOT be converted to smart Zustand-hook-based components.

**Rationale:**
1. **Testability:** Prop-based components are easier to test (no store mocking needed)
2. **Reusability:** Pure presentation components are more portable
3. **Follows Existing Patterns:** App.tsx → AppOverlays → components pattern works well
4. **Single Responsibility:** Components render UI, parent manages state

**Future Consideration:** If smart components are needed (e.g., for independent mounting), that's a separate architectural decision for Story 14e-9c or later.

### Dependencies

- **Part of split from**: Story 14e-9
- **Depends On**: Story 14e-9a (Components moved), Story 14e-6c (Zustand hooks exist)
- **Blocks**: Story 14e-9c (State components)

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-6c-scan-zustand-selectors-exports.md]
- [Source: src/contexts/ScanContext.tsx] - Current context implementation

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5

### Debug Log References
N/A

### Completion Notes List

**Implementation Note (2026-01-26):**

Upon investigation, the story's premise that components use `useScan()` from ScanContext was **incorrect for most components**. The actual findings:

1. **ScanCompleteModal** - Was the ONLY component using `useScanOptional()` from ScanContext
   - ✅ **Migrated**: Now uses `useScanActiveDialog()` + `useScanActions()` from Zustand store
   - ✅ Backward compatible with prop-based usage

2. **Other components** (ScanOverlay, ScanStatusIndicator, ScanProgress, ScanError, ScanReady, ScanModeSelector) - Were already **prop-based** components that receive state via props. They don't use `useScan()` directly.
   - These components are "dumb" presentation components
   - State is passed down from parent (App.tsx via AppOverlays)
   - No migration needed as they don't use context

**Selectors Added to Zustand Store:**
- `useScanActiveDialog()` - Returns active dialog state
- `useScanError()` - Returns error message
- `useScanResults()` - Returns scan results array

**Test Utilities Added:**
- `resetScanStore()` - Reset store between tests
- `setScanStoreState()` - Set specific test state
- `getScanStoreState()` - Get current store state for assertions

**Note:** Converting prop-based components to "smart" Zustand-hook-based components would be a separate architectural decision (Story 14e-9c or later).

**Test Summary (Dev Cycle 2 - 2026-01-26):**
- DialogScanContextIntegration.test.tsx: 23 tests pass (ScanCompleteModal Zustand integration)
- ScanModeSelector.test.tsx: 31 tests pass
- ScanOverlay.test.tsx: 25 tests pass
- ScanStatusIndicator.test.tsx: tests pass
- Full suite: 5451 unit + 347 integration = **5798 tests pass**

### File List

**Modified:**
- `src/features/scan/components/ScanCompleteModal.tsx` - Migrated from ScanContext to Zustand
- `src/features/scan/store/selectors.ts` - Added useScanActiveDialog, useScanError, useScanResults
- `src/features/scan/store/index.ts` - Export new selectors
- `tests/setup/test-utils.tsx` - Added Zustand store mock utilities (resetScanStore, setScanStoreState, getScanStoreState)
- `tests/unit/components/scan/DialogScanContextIntegration.test.tsx` - Updated ScanCompleteModal tests to use Zustand
- `vite.config.ts` - Added explicit path aliases for integration tests in tests/ directory (Dev Cycle 2 fix)
- `vitest.config.unit.ts` - Added explicit path aliases for unit tests in tests/ directory (Dev Cycle 2 fix)

**Points:** 3
