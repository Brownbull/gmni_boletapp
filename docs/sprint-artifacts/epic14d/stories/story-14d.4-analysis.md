# Story 14d.4: Single Scan Refactor - Analysis & Implementation Plan

**Epic:** 14d - Scan Architecture Refactor
**Status:** In Progress (Analysis Complete)
**Date:** 2026-01-09

## Executive Summary

Story 14d.4 requires migrating 9 state variables from App.tsx to the ScanContext state machine. Analysis reveals **107 state setter usages** across App.tsx, making this a significant refactoring task that should be divided into sub-stories.

## Scope Analysis

### State Variables to Migrate (9 total)

| Variable | Type | Setter Usages | Primary Consumers |
|----------|------|---------------|-------------------|
| `scanImages` | `string[]` | ~15 | App.tsx, TransactionEditorView |
| `scanError` | `string \| null` | ~8 | App.tsx, TransactionEditorView, Nav |
| `isAnalyzing` | `boolean` | ~10 | App.tsx, TransactionEditorView, Nav |
| `isRescanning` | `boolean` | ~4 | App.tsx, TransactionEditorView |
| `scanStoreType` | `ReceiptType` | ~3 | App.tsx, processScan |
| `scanCurrency` | `SupportedCurrency` | ~5 | App.tsx, processScan |
| `pendingScan` | `PendingScan \| null` | ~35 | App.tsx, persistence logic |
| `scanButtonState` | `ScanButtonState` | ~6 | App.tsx, TransactionEditorView |
| `skipScanCompleteModal` | `boolean` | ~3 | App.tsx, TransactionEditorView |

### State Machine Mapping

| Old App.tsx State | New State Machine Location | Notes |
|-------------------|---------------------------|-------|
| `scanImages` | `state.images` | Direct mapping |
| `scanError` | `state.error` | Direct mapping |
| `isAnalyzing` | `state.phase === 'scanning'` | Derived from phase |
| `isRescanning` | Custom flag or phase | Needs handling |
| `scanStoreType` | `state.storeType` | Already in state |
| `scanCurrency` | `state.currency` | Already in state |
| `pendingScan` | Complex - see below | Requires refactoring |
| `scanButtonState` | Derived from `state.phase` | Computed value |
| `skipScanCompleteModal` | `state.activeDialog` handling | Dialog state |

### Key Complexity: pendingScan

The `pendingScan` object (`PendingScan`) is used for:
1. **Persistence**: Saving scan state across navigation/refresh
2. **Status tracking**: 'idle' | 'analyzing' | 'analyzed' | 'error'
3. **Transaction storage**: Holds the analyzed transaction result
4. **Image reference**: Stores captured images

This requires careful mapping to the new state machine structure.

### Dependencies Analysis

```
processScan function (300+ lines) uses:
├── useUserCredits (reserveCredits, confirmCredits, refundCredits)
├── useCategoryMappings (mappings, incrementMappingUsage)
├── useMerchantMappings (findMerchantMatch, incrementMerchantMappingUsage)
├── useItemNameMappings (applyItemNameMappings)
├── useUserPreferences (defaultCurrency, defaultCountry, defaultCity)
├── useTrustedMerchants (checkTrusted, recordMerchantScan)
├── useInsightProfile (generateInsight, addToBatch)
├── useScanOverlayState (startUpload, setProgress, setReady, setError)
├── Services (analyzeReceipt, firestoreAddTransaction)
└── UI state (setView, setToastMessage, setCurrentTransaction, etc.)
```

## Recommended Sub-Story Breakdown

### Sub-Story 14d.4a: State Bridge Layer (Foundation)
**Points:** 3
**Priority:** HIGH

Create a bridge layer that syncs App.tsx state with ScanContext:
- Add `useScanStateBridge` hook that syncs local state → ScanContext
- App.tsx continues using local state setters
- ScanContext state is populated via bridge
- Components start reading from ScanContext

**ACs:**
- [ ] `useScanStateBridge` hook created
- [ ] Bridge syncs scanImages → state.images
- [ ] Bridge syncs scanError → state.error
- [ ] Bridge syncs phase transitions
- [ ] Existing tests still pass

### Sub-Story 14d.4b: Consumer Migration (Views & Dialogs)
**Points:** 5
**Priority:** HIGH

Update consumers to read from ScanContext instead of props:
- TransactionEditorView reads from ScanContext
- Dialog components read from ScanContext.state.activeDialog
- Nav reads scan state from ScanContext

**ACs:**
- [ ] TransactionEditorView uses `useScan()` for scan state
- [ ] CurrencyMismatchDialog uses ScanContext
- [ ] TotalMismatchDialog uses ScanContext
- [ ] QuickSaveCard uses ScanContext
- [ ] ScanCompleteModal uses ScanContext
- [ ] All dialog tests pass

### Sub-Story 14d.4c: State Variable Removal (Cleanup)
**Points:** 5
**Priority:** HIGH

Remove App.tsx state variables and use ScanContext directly:
- Remove useState declarations
- Update all internal usages to use ScanContext
- Clean up prop drilling

**ACs:**
- [ ] Remove `scanImages` useState (AC1)
- [ ] Remove `scanError` useState (AC2)
- [ ] Remove `isAnalyzing` useState (AC9)
- [ ] Remove `isRescanning` useState (AC3)
- [ ] Remove `scanStoreType` useState (AC4)
- [ ] Remove `scanCurrency` useState (AC5)
- [ ] Remove `scanButtonState` useState (AC7)
- [ ] Remove `skipScanCompleteModal` useState (AC8)
- [ ] All tests pass

### Sub-Story 14d.4d: pendingScan Migration (Complex)
**Points:** 5
**Priority:** HIGH

Handle the complex `pendingScan` state migration:
- Map PendingScan fields to ScanContext state
- Update persistence logic (pendingScanStorage)
- Handle status transitions
- Remove pendingScan useState (AC6)

**ACs:**
- [ ] pendingScan fields mapped to ScanContext
- [ ] Persistence reads from/writes to ScanContext
- [ ] Recovery on app load works
- [ ] Remove `pendingScan` useState (AC6)
- [ ] Integration tests pass

## Migration Order

```
14d.4a (Foundation) ─┐
                     ├──► 14d.4c (Cleanup)
14d.4b (Consumers) ──┘        │
                              ▼
                        14d.4d (pendingScan)
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regression in scan flow | Medium | High | Keep old code commented, test each step |
| State synchronization bugs | Medium | Medium | Use bridge pattern with logging |
| Test failures | High | Medium | Fix tests incrementally |
| Persistence issues | Low | High | Test recovery scenarios thoroughly |

## Test Strategy

1. **Unit Tests**: Update existing tests to mock ScanContext
2. **Integration Tests**: Verify full scan flow works end-to-end
3. **Manual Testing**: Test on mobile device (PWA)
4. **Regression Tests**: Run full test suite after each sub-story

## Timeline Estimate

| Sub-Story | Estimated Time |
|-----------|----------------|
| 14d.4a | 1-2 hours |
| 14d.4b | 2-3 hours |
| 14d.4c | 2-3 hours |
| 14d.4d | 2-3 hours |
| **Total** | **7-11 hours** |

## Decision Points

1. **Keep processScan in App.tsx**: Yes - too many dependencies to move
2. **Use bridge pattern**: Yes - safer incremental migration
3. **Split into sub-stories**: Yes - manageable chunks with clear ACs
4. **Preserve existing persistence**: Yes - pendingScanStorage continues to work

---

*Analysis by Atlas-Dev workflow - Story 14d.4 Session 1*
