# Batch Scanning Feature Improvements (v9.7.0)

**Date:** 2026-01-08
**Version:** 9.7.0
**Status:** In Progress

## Summary

Major improvements to the batch scanning feature to match the single transaction scan UX and fix various UI/credit issues.

---

## Changes Completed

### 1. FAB Batch Mode Bug Fix

**Issue:** Camera FAB icon stayed in "batch mode" (amber gradient + Layers icon) even after exiting batch mode.

**Root Cause:** The `isBatchMode` prop in Nav.tsx used an OR condition that checked both `view` and a state flag that wasn't being reset:
```javascript
isBatchMode={view === 'batch-capture' || isBatchCaptureMode}
```

**Fix:** Simplified to only check view state:
```javascript
isBatchMode={view === 'batch-capture'}
```

**Files Changed:**
- `src/App.tsx`: Line ~3293

---

### 2. BatchCaptureView Header Redesign

**Changes:**
- Header now matches TransactionEditorView layout exactly
- Title changed from "Modo Lote" to "Escanea" with Layers icon indicator
- Credit badges with super credits (yellow) and normal credits (primary)
- Removed double header (excluded from TopHeader in App.tsx)
- Proper safe-area handling and margins

**Files Changed:**
- `src/views/BatchCaptureView.tsx`: Complete header redesign
- `src/App.tsx`: Added `batch-capture` to TopHeader exclusion list
- `src/App.tsx`: Added `batch-capture` to main padding exclusions

---

### 3. Credit System Fixes

**Issue:** Batch scanning was showing incorrect credit usage (1 per image instead of 1 total).

**Fix:**
- Batch scanning uses **1 super credit total** for the entire batch (up to 10 images)
- Credit is deducted when processing **completes** (not when saving)
- Removed redundant credit warning popup before processing
- Updated credit display in BatchCaptureView to show "1" instead of image count

**Files Changed:**
- `src/App.tsx`: `handleBatchConfirmWithCreditCheck` now uses `1` instead of `batchImages.length`
- `src/App.tsx`: `onProcessBatch` callback deducts super credit after processing
- `src/App.tsx`: `handleBatchSaveComplete` no longer deducts credits (already done)
- `src/views/BatchCaptureView.tsx`: Credit display shows `creditsNeeded = hasImages ? 1 : 0`

---

### 4. BatchProcessingOverlay Component

**New Component:** `src/components/scan/BatchProcessingOverlay.tsx`

**Features:**
- Full-screen overlay matching single scan ProcessingOverlay style
- Shows "Escaneando 1 de 3" progress text
- Progress bar with current/total
- Batch mode badge (Layers icon)
- "Puedes navegar mientras procesamos" tip
- Only shows on batch-related views (not when navigating to Analytics, etc.)
- Leaves nav bar accessible for navigation

**Files Changed:**
- `src/components/scan/BatchProcessingOverlay.tsx`: New component
- `src/components/scan/index.ts`: Export added
- `src/App.tsx`: Added overlay with view check condition

---

### 5. BatchReviewView Header & Layout Redesign

**Header Changes:**
- Now matches TransactionEditorView/BatchCaptureView style exactly
- Left side: Back chevron + "Resultado" title + Layers batch icon
- Right side: Credit badges (super/normal) + X close button
- Uses CSS variables for consistent theming

**Summary Row Changes:**
- Left side: "2 Recibos" count + review warning badge
- Right side: "Total £53.21" (separated from count)

**Other Fixes:**
- Removed duplicate header (batch-review excluded from TopHeader)
- Added proper padding exclusions for batch-review view
- Auto-navigate back to dashboard when all receipts are discarded

**Files Changed:**
- `src/views/BatchReviewView.tsx`: Complete header redesign, summary row split
- `src/App.tsx`: Added `batch-review` to header/padding exclusions, pass credits props

---

### 6. BatchSummaryCard Redesign

**Issue:** Batch review cards didn't match the transaction list style.

**Redesigned BatchSummaryCard:**
- Now matches TransactionCard style from HistoryView
- Receipt thumbnail on left with category badge
- Merchant name (colored by category) and amount on first row
- Meta pills for date/time, location, item count
- Expandable items section (first 5 items)
- Edit and Discard buttons at bottom
- Status badges (Ready/Review/Edited/Error)

**Files Changed:**
- `src/components/batch/BatchSummaryCard.tsx`: Complete redesign

---

### 7. Nav FAB Improvements

**Changes:**
- Shows **Layers icon** during batch mode, processing, or ready-to-review states
- Shows **Camera icon** only when idle
- Colors use theme's `--primary` CSS variable for default state
- Batch/processing uses amber gradient
- Long-press blocked when batch results are pending review

**Files Changed:**
- `src/components/Nav.tsx`: `getFabGradient` and icon logic updated
- `src/App.tsx`: `onBatchClick` handler checks for active batch

---

### 8. Currency Display Fixes (GBP/Multi-Currency Support)

**Issue:** GBP amounts showing incorrectly (£18.99 displayed as $2,399).

**Root Cause:**
1. `formatCurrency` wasn't dividing by 100 for currencies with decimals
2. Views used user's default currency instead of transaction's currency

**Fixes:**

**formatCurrency function (`src/utils/currency.ts`):**
- Now properly handles `usesCents` currencies (USD, GBP, EUR) by dividing by 100
- Uses currency's `decimals` setting for fraction digits
- Added helper functions `parseDisplayAmount()` and `toDisplayAmount()`

**TransactionEditorView & EditView:**
- Added `displayCurrency = transaction?.currency || currency`
- All formatCurrency calls now use transaction's currency

**BatchSummaryCard:**
- Uses `transaction.currency` if available, falls back to prop

**BatchReviewView:**
- Added `detectedCurrency` from useBatchReview hook
- Summary total uses detected currency

**useBatchReview Hook:**
- Added `detectedCurrency` return value (detects common currency across receipts)

**Files Changed:**
- `src/utils/currency.ts`: Complete rewrite with proper decimal handling
- `src/views/TransactionEditorView.tsx`: Added displayCurrency
- `src/views/EditView.tsx`: Added displayCurrency
- `src/components/batch/BatchSummaryCard.tsx`: Use transaction currency
- `src/views/BatchReviewView.tsx`: Use detected currency
- `src/hooks/useBatchReview.ts`: Added detectedCurrency

---

### 9. Single Receipt Discard Confirmation

**Changes:**
- Updated dialog to be batch-specific
- Message: "Esta boleta del lote tiene alta confianza y no será guardada."
- Buttons now have icons: Trash2 for "Descartar", RotateCcw for "Volver"
- Changed "Seguir revisando" to "Volver" for cleaner UX

**Files Changed:**
- `src/views/BatchReviewView.tsx`: Updated dialog buttons with icons
- `src/utils/translations.ts`: Updated translations

---

### 10. Batch Navigation in TransactionEditorView

**Feature:** Navigate between receipts while editing without returning to batch review.

**UI Changes:**
- Centered pill below header: `[ < ]  🧾 1 de 2  [ > ]`
- Previous/Next buttons with ChevronLeft/ChevronRight icons
- Buttons disabled at first/last receipt
- Receipt icon in the counter pill

**Implementation:**
- Added `onBatchPrevious` and `onBatchNext` props
- Updated `batchEditingReceipt` state to include `allReceipts` array
- Navigation handlers update current receipt in-place

**Translation:**
- Uses `batchOfMax` for "de" (Spanish) / "of" (English)

**Files Changed:**
- `src/views/TransactionEditorView.tsx`: Navigation buttons, Receipt icon
- `src/views/BatchReviewView.tsx`: Pass allReceipts in onEditReceipt
- `src/App.tsx`: Navigation handlers, updated state type

---

### 11. Translations Added/Updated

**English:**
- `scanning`: "Scanning"
- `batchResult`: "Result"
- `batchDiscardConfirmNo`: "Go back"
- `batchDiscardConfirmMessage`: "This batch receipt has high confidence..."

**Spanish:**
- `scanning`: "Escaneando"
- `batchResult`: "Resultado"
- `batchDiscardConfirmNo`: "Volver"
- `batchDiscardConfirmMessage`: "Esta boleta del lote tiene alta confianza..."
- `myPurchase`: "Mi Compra" (restored)

**Files Changed:**
- `src/utils/translations.ts`: Added/updated translations

---

## Outstanding Issues / Known Bugs

### 1. Batch Navigation Buttons Not Working
**Issue:** The Previous/Next navigation buttons in TransactionEditorView don't navigate between receipts.
**Priority:** High
**Notes:** The handlers are wired up but may have state synchronization issues.

### 2. Dropdown Menus Getting Cut Off
**Issue:** When editing currency or other dropdowns, the menu gets cut off at screen edge.
**Priority:** Medium
**Notes:** Likely needs portal rendering or position adjustment.

### 3. Swipe Navigation (Enhancement)
**Feature Request:** Add swipe gesture to navigate between receipts (swipe left/right).
**Priority:** Low
**Notes:** Would improve mobile UX for batch editing.

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/App.tsx` | FAB fix, credit deduction, batch navigation handlers, view exclusions |
| `src/components/Nav.tsx` | Icon/color logic for batch states, long-press blocking |
| `src/views/BatchCaptureView.tsx` | Header redesign, credit display |
| `src/views/BatchReviewView.tsx` | Header redesign, currency detection, allReceipts |
| `src/views/TransactionEditorView.tsx` | Navigation buttons, displayCurrency |
| `src/views/EditView.tsx` | displayCurrency support |
| `src/components/batch/BatchSummaryCard.tsx` | Complete redesign, transaction currency |
| `src/components/batch/CreditWarningDialog.tsx` | Styling update |
| `src/components/scan/BatchProcessingOverlay.tsx` | New component |
| `src/components/scan/index.ts` | Export added |
| `src/hooks/useBatchReview.ts` | State sync fix, detectedCurrency |
| `src/utils/currency.ts` | Complete rewrite with decimal handling |
| `src/utils/translations.ts` | New/updated translations |

---

## Continuation Prompt

```
Continue: Batch Scanning Story (v9.7.0) - Bug Fixes

Context:
We've been implementing batch scanning UI improvements for Story 12.1. This session we completed:
- BatchReviewView header redesigned to match TransactionEditorView (back + title + Layers icon, credit badges + X)
- Summary row split (receipts count left, total right)
- Currency fixes for GBP/multi-currency (formatCurrency now handles decimals properly)
- Batch navigation buttons added to TransactionEditorView (Previous/Next with pill showing "1 de 2")
- Single receipt discard dialog improved with icons and "Volver" button
- Long-press FAB blocked when batch has pending results

Current State:
The batch scanning flow is working with proper currency display. However, there are bugs to fix:

Outstanding Issues:
1. **Batch Navigation Buttons Not Working** (HIGH PRIORITY)
   - The Previous/Next buttons in TransactionEditorView don't navigate between receipts
   - Handlers are in App.tsx (handleBatchPrevious, handleBatchNext)
   - Need to debug why state updates aren't reflecting

2. **Dropdown Menus Cut Off** (MEDIUM)
   - Currency selector and other dropdowns get cut off at screen edge
   - May need portal rendering or position adjustment

3. **Swipe Navigation Enhancement** (LOW)
   - Add swipe gesture to navigate between receipts in batch editing
   - Would improve mobile UX

Reference Files:
- docs/sprint-artifacts/epic14/batch-scanning-v9.7.0.md (this document)
- src/views/TransactionEditorView.tsx (navigation buttons at line ~1145)
- src/App.tsx (navigation handlers at line ~1789)
- src/views/BatchReviewView.tsx
- src/utils/currency.ts
```
