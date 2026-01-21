# Story 14d.4c: State Variable Removal (Cleanup)

**Epic:** 14d - Scan Architecture Refactor
**Parent Story:** 14d.4 - Refactor Single Scan Flow
**Points:** 5
**Priority:** HIGH
**Status:** Done
**Depends On:** Story 14d.4b
**Completed:** 2026-01-09

## Description

Remove 8 of the 9 App.tsx scan-related state variables (pendingScan handled in 14d.4d) and update all internal usages to use ScanContext directly. This is the cleanup phase after consumers have been migrated.

## Background

After 14d.4a (bridge) and 14d.4b (consumer migration), the App.tsx state variables are redundant. This story removes them and updates `processScan` and other App.tsx functions to dispatch to ScanContext instead of using local state.

## Deliverables

### Files to Update

```
src/
└── App.tsx    # Remove useState declarations, update usages
```

### State Variables to Remove

| Variable | Lines to Update | Notes |
|----------|-----------------|-------|
| `scanImages` | ~15 | Replace with dispatch + ScanContext read |
| `scanError` | ~8 | Replace with processError dispatch |
| `isAnalyzing` | ~10 | Derived from phase |
| `isRescanning` | ~4 | Custom handling needed |
| `scanStoreType` | ~3 | Replace with setStoreType dispatch |
| `scanCurrency` | ~5 | Replace with setCurrency dispatch |
| `scanButtonState` | ~6 | Derived from phase |
| `skipScanCompleteModal` | ~3 | Dialog state handling |

## Technical Specification

### Removal Pattern

```typescript
// Before
const [scanImages, setScanImages] = useState<string[]>([]);

// In processScan:
setScanImages(newImages);

// After
const { state, addImage, setImages } = useScan();

// In processScan:
setImages(newImages);

// Reading:
const scanImages = state.images;
```

### processScan Updates

```typescript
// Before
const processScan = async (imagesToProcess?: string[]) => {
  const images = imagesToProcess ?? scanImages;
  setIsAnalyzing(true);
  setScanError(null);
  // ...
};

// After
const processScan = async (imagesToProcess?: string[]) => {
  const images = imagesToProcess ?? state.images;
  processStart('normal', 1); // Dispatches to state machine
  // Error handling done via processError dispatch
  // ...
};
```

### isRescanning Handling

The `isRescanning` state is used for re-scanning existing transactions (handleRescan). Options:

1. **Add to state machine**: New phase 'rescanning' or flag in state
2. **Keep as local UI state**: Only used in handleRescan, not part of core flow

**Recommendation:** Keep as local UI state (not part of core scan flow).

### scanButtonState Derivation

```typescript
// Remove state variable, derive from ScanContext
function deriveScanButtonState(phase: ScanPhase): ScanButtonState {
  switch (phase) {
    case 'idle': return 'idle';
    case 'capturing': return 'pending';
    case 'scanning': return 'scanning';
    case 'reviewing': return 'complete';
    case 'error': return 'error';
    default: return 'idle';
  }
}
```

## Acceptance Criteria

### State Removal
- [x] **AC1:** Remove `scanImages` useState - use state.images
- [x] **AC2:** Remove `scanError` useState - use state.error
- [x] **AC3:** Remove `isAnalyzing` useState - derived from isProcessing
- [x] **AC4:** Remove `scanStoreType` useState - use state.storeType
- [x] **AC5:** Remove `scanCurrency` useState - use state.currency
- [x] **AC6:** Remove `scanButtonState` useState - derived from state.phase
- [x] **AC7:** `skipScanCompleteModal` kept as local state (UI-specific, not dialog state)

### isRescanning (Decision: Keep as local)
- [x] **AC8:** Keep `isRescanning` as local state (not core flow)

### processScan Updates
- [x] **AC9:** processScan dispatches PROCESS_START on scan begin
- [x] **AC10:** processScan dispatches PROCESS_SUCCESS on API success
- [x] **AC11:** processScan dispatches PROCESS_ERROR on API failure
- [x] **AC12:** All state reads use ScanContext (via aliases)

### Testing
- [x] **AC13:** All existing tests pass (116 scan-related tests)
- [x] **AC14:** No regressions in scan flow (verified manually)
- [x] **AC15:** Manual test: single scan works end-to-end (verified)

## Migration Script (Reference)

For each state variable:

```bash
# 1. Comment out the useState declaration
# const [scanImages, setScanImages] = useState<string[]>([]);

# 2. Add ScanContext destructuring
# const { state, setImages } = useScan();

# 3. Replace setter calls
# setScanImages(x) → setImages(x) or addImage(x)

# 4. Replace state reads
# scanImages → state.images

# 5. Run tests
npm test

# 6. If passing, remove commented line
```

## Notes

- This story does NOT remove `pendingScan` - that's 14d.4d
- Keep `isRescanning` local - it's a UI concern, not core state
- Test after EACH variable removal to catch issues early
- If regressions occur, revert that specific variable and investigate

---

## Implementation Summary (2026-01-09)

### Architectural Changes

1. **ScanProvider Moved to main.tsx** - Enables `useScan()` hook in App.tsx
2. **useScanStateBridge Removed** - No longer needed; App uses context directly
3. **processScan Updated** - Dispatches `PROCESS_START`, `PROCESS_SUCCESS`, `PROCESS_ERROR`

### State Variable Migrations

| Variable | Migration Approach | Status |
|----------|-------------------|--------|
| `scanImages` | Alias to `scanState.images` + wrapper setter | ✅ Done |
| `scanError` | Alias to `scanState.error` + `dispatchProcessError` | ✅ Done |
| `isAnalyzing` | Alias to `isContextProcessing` + no-op setter | ✅ Done |
| `scanStoreType` | Alias to `scanState.storeType` + wrapper setter | ✅ Done |
| `scanCurrency` | Alias to `scanState.currency` + wrapper setter | ✅ Done |
| `scanButtonState` | Derived from `scanState.phase` via `useMemo` | ✅ Done |
| `skipScanCompleteModal` | Kept as local state (UI-specific) | ✅ Kept |
| `isRescanning` | Kept as local state (not core flow) | ✅ Kept |

### Files Modified

- `src/main.tsx` - Added ScanProvider wrapper
- `src/App.tsx` - Major migration (useScan hook, state aliases, processScan updates)
- `src/views/DashboardView.tsx` - Fixed unrelated unused variables
- `src/views/TransactionEditorView.tsx` - Fixed unrelated unused variable

### Test Results

- Build: ✅ Passes
- Scan-related tests: ✅ All pass (116 tests)
- Manual verification: ✅ Multiple receipts scanned successfully
- 1 unrelated failure in Firebase functions test (missing import)

### Bug Fixes During Implementation

1. **State machine phase transitions** - Added `startSingleScan` dispatch in `setScanImages` wrapper to transition from `idle` → `capturing` before setting images
2. **Context reset on cancel** - `setScanImages([])` now properly calls `resetScanContext()` to clear state when user cancels
3. **Thumbnail fallback** - Simplified fallback logic to always use `scanImages[0]` if available, regardless of `scanButtonState`

---

## Code Review (2026-01-10)

### Issues Found and Fixed

| Issue | Severity | Resolution |
|-------|----------|------------|
| **36 dead `setScanButtonState` calls** | HIGH | Removed all no-op calls, removed the wrapper function |
| **setTimeout race condition in setScanImages** | MEDIUM | Documented the pattern; setTimeout(0) is necessary for React state update deferral |
| **setScanError(null) no-op** | MEDIUM | Documented that error clearing is handled by reset/processStart |

### Changes Made

1. **Removed `setScanButtonState` wrapper** (was no-op) - Now only `scanButtonState` derived from `useMemo` remains
2. **Removed all 36 `setScanButtonState()` calls** - Replaced with comments explaining state derivation
3. **Added documentation** to `setScanImages` wrapper explaining the setTimeout(0) pattern
4. **Added documentation** to `setScanError` wrapper clarifying that null is a no-op

### Files Modified

- `src/App.tsx` - Removed dead code, improved documentation

### Technical Notes

- The `scanButtonState` is now purely derived from `scanState.phase` via `useMemo`
- All phase transitions happen through ScanContext dispatch actions
- The old setter calls were redundant since state machine handles transitions

---

*Sub-story created for incremental migration of Story 14d.4*
