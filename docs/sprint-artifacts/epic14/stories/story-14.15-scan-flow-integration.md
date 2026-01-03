# Story 14.15: Scan Flow Integration

**Status:** ready-for-dev
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.3, 14.4 (ScanOverlay, QuickSaveCard - both done)
**Mockup:** [scan-overlay.html](../../../uxui/mockups/01_views/scan-overlay.html)

---

## Story

**As a** user scanning a receipt,
**I want to** see the new scan overlay flow with progressive item reveal,
**So that** I have a smoother, more engaging scanning experience.

---

## Context

Stories 14.3 (ScanOverlay) and 14.4 (QuickSaveCard) built the UI components, but they're not wired into the actual scan flow. The current ScanView uses older components. This story integrates the new components.

### Components to Integrate:
- `ScanOverlay` - Non-blocking overlay during processing
- `QuickSaveCard` - Progressive item reveal card
- `useScanOverlayState` - State machine for overlay transitions

---

## Acceptance Criteria

### AC #1: ScanOverlay Displays During Processing
- [ ] After image capture, ScanOverlay appears instead of full-screen loading
- [ ] User can still see the captured image behind the overlay
- [ ] Processing status shows in overlay (scanning, extracting, complete)
- [ ] Cancel button available to abort scan

### AC #2: Progressive Item Reveal
- [ ] When scan completes, items reveal one-by-one with animation
- [ ] Each item slides in with staggered delay (Pattern #60)
- [ ] Total updates as items appear (count-up animation)
- [ ] User can tap "Quick Save" before all items reveal

### AC #3: Quick Save Path
- [ ] "Quick Save" button saves transaction immediately with defaults
- [ ] "Review & Edit" button navigates to EditView for manual review
- [ ] Trust merchant setting auto-applies learned values

### AC #4: Error Handling
- [ ] Scan errors show in overlay (not full page error)
- [ ] Retry option available without leaving the flow
- [ ] Network timeout handled gracefully

### AC #5: Animations Respect Preferences
- [ ] useReducedMotion checked before animations
- [ ] Haptic feedback only when enabled
- [ ] Fallback to instant transitions when motion disabled

---

## Tasks

- [ ] Task 1: Replace current scan processing UI in ScanView with ScanOverlay
- [ ] Task 2: Wire useScanOverlayState to existing useScanState
- [ ] Task 3: Show QuickSaveCard when scan completes successfully
- [ ] Task 4: Implement quick save flow (save with defaults)
- [ ] Task 5: Implement review flow (navigate to EditView)
- [ ] Task 6: Handle error states in overlay
- [ ] Task 7: Add animation timing using DURATION/STAGGER constants
- [ ] Task 8: Test scan flow end-to-end on mobile

---

## File List

**Modified:**
- `src/views/ScanView.tsx` - Main integration point
- `src/hooks/useScanState.ts` - May need overlay state coordination

**Referenced (read-only):**
- `src/components/scan/ScanOverlay.tsx`
- `src/components/scan/QuickSaveCard.tsx`
- `src/hooks/useScanOverlayState.ts`
- `src/components/animation/constants.ts`

**New:**
- `tests/e2e/scan-overlay-flow.spec.ts` - E2E test (optional)

---

## Dev Notes

### State Coordination
```typescript
// ScanView already has useScanState
const { scanState, startScan, resetScan } = useScanState();

// Add overlay state
const overlayState = useScanOverlayState();

// Sync states
useEffect(() => {
  if (scanState === 'processing') {
    overlayState.show();
  } else if (scanState === 'complete') {
    overlayState.setItems(scanResult.items);
  } else if (scanState === 'error') {
    overlayState.setError(scanError);
  }
}, [scanState]);
```

### Quick Save Implementation
```typescript
const handleQuickSave = async () => {
  const transaction = buildTransactionFromScanResult(scanResult, {
    applyTrustedMerchant: true,
    applyLearnedCategories: true,
  });
  await saveTransaction(transaction);
  navigate('/home');
};
```

---

## Test Plan

1. Capture a receipt image
2. Verify ScanOverlay appears with processing status
3. Watch items reveal progressively as scan completes
4. Tap "Quick Save" and verify transaction saved
5. Alternatively, tap "Review & Edit" and verify EditView opens
6. Test error case: disconnect network mid-scan
7. Test cancel: tap cancel during processing
