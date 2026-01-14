# Story 14d.4: Refactor Single Scan Flow

**Epic:** 14d - Scan Architecture Refactor
**Points:** 8 (broken into 18 points across sub-stories)
**Priority:** HIGH
**Status:** In Progress (Divided into Sub-Stories)
**Depends On:** Story 14d.3

---

## Sub-Story Breakdown (2026-01-09)

Analysis revealed **~107 state setter usages** across App.tsx, making this too large for a single implementation session. Story has been divided into 4 sub-stories for incremental migration:

| Sub-Story | Title | Points | Status | Depends On |
|-----------|-------|--------|--------|------------|
| [14d.4a](story-14d.4a-state-bridge-layer.md) | State Bridge Layer (Foundation) | 3 | Ready | 14d.3 |
| [14d.4b](story-14d.4b-consumer-migration.md) | Consumer Migration (Views & Dialogs) | 5 | Backlog | 14d.4a |
| [14d.4c](story-14d.4c-state-variable-removal.md) | State Variable Removal (Cleanup) | 5 | Backlog | 14d.4b |
| [14d.4d](story-14d.4d-pending-scan-migration.md) | pendingScan Migration (Complex) | 5 | Backlog | 14d.4c |

**Total Sub-Story Points:** 18 (was 8, adjusted for actual scope)

### Migration Order

```
14d.4a (Foundation) ─┐
                     ├──► 14d.4c (Cleanup)
14d.4b (Consumers) ──┘        │
                              ▼
                        14d.4d (pendingScan)
```

**See:** [story-14d.4-analysis.md](story-14d.4-analysis.md) for detailed analysis.

---

## Description

Migrate the single receipt scan flow from scattered App.tsx state variables to the unified state machine. This is the largest refactoring story as it touches the core scan functionality.

## Background

Current single scan uses 9 state variables in App.tsx:
- `scanImages`
- `scanError`
- `isRescanning`
- `scanStoreType`
- `scanCurrency`
- `pendingScan`
- `scanButtonState`
- `skipScanCompleteModal`
- `isAnalyzing`

These will be replaced by state machine states and actions.

## Deliverables

### Files to Update

```
src/
├── App.tsx                              # Remove single scan state
├── views/
│   └── TransactionEditorView.tsx        # Use ScanContext
├── components/
│   ├── Nav.tsx                          # FAB click handler
│   └── scan/
│       ├── CurrencyMismatchDialog.tsx   # Use ScanContext
│       ├── TotalMismatchDialog.tsx      # Use ScanContext
│       ├── QuickSaveCard.tsx            # Use ScanContext
│       └── ScanCompleteModal.tsx        # Use ScanContext
└── contexts/
    └── ScanContext.tsx                  # Add processScan logic
```

## Technical Specification

### State Mapping

| Old App.tsx State | New State Machine Location |
|-------------------|---------------------------|
| `scanImages` | `state.images` |
| `scanError` | `state.error` |
| `isRescanning` | Derived from `state.phase === 'processing'` |
| `scanStoreType` | `state.dialogData.storeType` |
| `scanCurrency` | `state.dialogData.currency` |
| `pendingScan` | `state.results[0]` |
| `scanButtonState` | Derived from `state.phase` |
| `skipScanCompleteModal` | `state.dialogData.skipComplete` |
| `isAnalyzing` | `state.phase === 'processing'` |

### ScanContext processScan

```typescript
// src/contexts/ScanContext.tsx - Add scan processing

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, ...computed } = useScanStateMachine();

  // Process single scan (moved from App.tsx)
  const processSingleScan = useCallback(async (
    imageBase64: string,
    userId: string,
    userCurrency: string,
  ) => {
    dispatch({ type: 'ADD_IMAGE', payload: imageBase64 });
    dispatch({ type: 'PROCESS' });

    try {
      // Call Gemini API
      const result = await analyzeReceipt(imageBase64);

      if (!result.success) {
        dispatch({ type: 'PROCESS_ERROR', payload: result.error || 'Scan failed' });
        return;
      }

      const transaction = result.data;

      // Apply mappings
      const withMappings = await applyMappings(transaction, userId);

      dispatch({ type: 'PROCESS_COMPLETE', payload: [withMappings] });

      // Check for currency mismatch
      if (withMappings.currency && withMappings.currency !== userCurrency) {
        dispatch({
          type: 'SHOW_DIALOG',
          payload: {
            type: 'currency',
            data: {
              detected: withMappings.currency,
              expected: userCurrency,
              transaction: withMappings,
            },
          },
        });
        return;
      }

      // Check confidence for Quick Save
      const confidence = calculateConfidence(withMappings);
      if (confidence >= 0.85) {
        dispatch({
          type: 'SHOW_DIALOG',
          payload: {
            type: 'quicksave',
            data: { transaction: withMappings, confidence },
          },
        });
      } else {
        // Go to editor
        dispatch({
          type: 'SHOW_DIALOG',
          payload: { type: 'complete', data: { transaction: withMappings } },
        });
      }
    } catch (error) {
      dispatch({
        type: 'PROCESS_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [dispatch]);

  // ... rest of provider
}
```

### TransactionEditorView Updates

```typescript
// src/views/TransactionEditorView.tsx

import { useScan } from '../contexts/ScanContext';

export function TransactionEditorView({ mode, transactionId }: Props) {
  const {
    state: scanState,
    resolveDialog,
    cancel,
    isProcessing,
  } = useScan();

  // Get transaction from state machine for new scans
  const transaction = mode === 'new'
    ? scanState.results[0]
    : existingTransaction;

  // Handle save
  const handleSave = async () => {
    // Save logic...
    resolveDialog('complete', { saved: true });
  };

  // Handle cancel
  const handleCancel = () => {
    cancel();
  };

  return (
    <div>
      {isProcessing && <ProcessingOverlay />}
      {/* Editor content */}
    </div>
  );
}
```

## Acceptance Criteria

### State Migration

- [ ] **AC1:** Remove `scanImages` from App.tsx
- [ ] **AC2:** Remove `scanError` from App.tsx
- [ ] **AC3:** Remove `isRescanning` from App.tsx
- [ ] **AC4:** Remove `scanStoreType` from App.tsx
- [ ] **AC5:** Remove `scanCurrency` from App.tsx
- [ ] **AC6:** Remove `pendingScan` from App.tsx
- [ ] **AC7:** Remove `scanButtonState` from App.tsx
- [ ] **AC8:** Remove `skipScanCompleteModal` from App.tsx
- [ ] **AC9:** Remove `isAnalyzing` from App.tsx

### Functionality Preserved

- [ ] **AC10:** Single tap on FAB triggers file picker
- [ ] **AC11:** Image capture transitions to processing state
- [ ] **AC12:** Gemini API call works as before
- [ ] **AC13:** Mappings applied correctly
- [ ] **AC14:** Currency mismatch dialog shows when needed
- [ ] **AC15:** Quick Save card shows for high confidence
- [ ] **AC16:** Edit flow works for low confidence
- [ ] **AC17:** Save to Firestore works
- [ ] **AC18:** Cancel clears state and returns to dashboard

### Testing

- [ ] **AC19:** All existing single scan tests pass
- [ ] **AC20:** No regression in scan-to-save time
- [ ] **AC21:** Error handling works correctly
- [ ] **AC22:** Integration test for full flow

## Test Cases

```typescript
describe('Single Scan Flow (State Machine)', () => {
  describe('capture', () => {
    it('should transition to capturing on FAB click');
    it('should add image to state on file select');
  });

  describe('processing', () => {
    it('should call Gemini API with image');
    it('should apply mappings to result');
    it('should transition to complete on success');
    it('should transition to error on failure');
  });

  describe('dialogs', () => {
    it('should show currency dialog on mismatch');
    it('should show quick save for high confidence');
    it('should go to editor for low confidence');
  });

  describe('save', () => {
    it('should save transaction to Firestore');
    it('should reset state after save');
  });
});
```

## Migration Checklist

1. [ ] Add processSingleScan to ScanContext
2. [ ] Update FAB to use ScanContext
3. [ ] Update TransactionEditorView to use ScanContext
4. [ ] Update dialog components to use ScanContext
5. [ ] Remove state variables from App.tsx one by one
6. [ ] Run tests after each removal
7. [ ] Fix any broken references

## Dependencies

- Story 14d.3: Navigation Blocking

## Blocks

- Story 14d.5: Batch Scan Refactor
- Story 14d.6: Unified Dialog Handling

## Notes

- This is the largest story - consider breaking into sub-tasks
- Keep old code commented until verified working
- Test each state variable removal individually

---

*Story created by Atlas - Project Intelligence Guardian*
