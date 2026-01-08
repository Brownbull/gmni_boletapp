# Hotfix: v9.6.0 Post-Deployment Issues

**Date:** 2026-01-08
**Version:** 9.6.0 → 9.6.1 (implicit via hotfixes)
**Status:** Deployed to Production

## Summary

After deploying v9.6.0 (Epic 14 - Settings, Editor, Persistent State), several production issues were discovered and fixed through emergency hotfixes.

---

## Issue 1: Scan Returns 400 Error (PR #143)

### Symptoms
- User captures image on phone
- Cloud Function returns HTTP 400 error
- Scan fails immediately after auth passes

### Root Cause
**React stale closure bug** in `processScan`:
```javascript
// handleFileSelect sets state then calls processScan
setScanImages(updatedImages);
setTimeout(() => processScan(), 100);  // processScan reads OLD state
```

The `processScan` function captured the old `scanImages` value (empty `[]`) from the closure before React's state update propagated.

### Fix
Modified `processScan` to accept optional images parameter:
```javascript
const processScan = async (imagesToProcess?: string[]) => {
    const images = imagesToProcess ?? scanImages;
    // ...
};

// Call site passes images directly
setTimeout(() => processScan(updatedImages), 100);
```

### Files Changed
- `src/App.tsx`: `processScan` signature and call site

---

## Issue 2: Multiple Scan UI Bugs (PR #145)

### 2a. Blank Screen During Processing

**Symptom:** User sees blank screen while scan is processing, no loading indicator.

**Root Cause:** ScanOverlay visibility condition only checked `scan` and `edit` views, but user was on `scan-result` view.

**Fix:** Added `scan-result` and `transaction-editor` to visibility condition:
```javascript
visible={(isAnalyzing || scanOverlay.state === 'error') &&
  (view === 'scan' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor')}
```

### 2b. Wrong Total Calculation (4 Million Instead of 25,920)

**Symptom:** Total mismatch dialog showed ~4 million when actual total was 25,920.

**Root Cause:** `calculateItemsSum` was multiplying `price × quantity`, but AI returns `price` as the **line total** (already multiplied).

**Example:**
- Receipt: 180 EXTRA COLOR × $144 = $25,920
- AI returns: `{ name: "EXTRA COLOR", price: 25920, qty: 180 }`
- Old calc: 25920 × 180 = 4,665,600 ❌
- New calc: 25920 ✓

**Fix:** Removed quantity multiplication from `calculateItemsSum`:
```javascript
// Price is already the line total (qty × unit price), so just sum prices
return items.reduce((sum, item) => {
    const price = typeof item.price === 'number' ? item.price : 0;
    return sum + price;
}, 0);
```

### 2c. Blank Page After "Keep Original"

**Symptom:** After selecting "Keep original" in total mismatch dialog, user sees blank page.

**Root Cause:** `continueScanWithTransaction` set the transaction state but didn't navigate to the editor view.

**Fix:** Added navigation after mismatch resolution:
```javascript
setTransactionEditorMode('new');
navigateToView('transaction-editor');
```

### 2d. Missing Thumbnail

**Symptom:** Thumbnail not showing in scan result view.

**Root Cause:** `scanImages` was cleared prematurely in `continueScanWithTransaction`.

**Fix:** Don't clear `scanImages` until transaction is saved or discarded.

### Files Changed
- `src/App.tsx`: ScanOverlay visibility, continueScanWithTransaction
- `src/utils/totalValidation.ts`: calculateItemsSum logic
- `tests/unit/utils/totalValidation.test.ts`: Updated tests for new logic

---

## Issue 3: New Category Request (PR #146)

### Request
User requested new "Almacén" category for small neighborhood shops/bodegas that don't fit the large Supermarket category.

### Implementation
Added `Almacen` to StoreCategory:
- `shared/schema/categories.ts`: Added to STORE_CATEGORIES array
- `src/config/categoryColors.ts`: Earthy brown color scheme, food-dining group
- `src/utils/categoryEmoji.ts`: 🏪 emoji
- `src/utils/categoryTranslations.ts`: "Corner Store" (en) / "Almacén" (es)
- `src/utils/reportUtils.ts`: Spanish display name

The unified schema auto-syncs to AI prompts via prebuild script.

---

## Outstanding Issues (Not Yet Fixed)

### Double Category Mapping Dialog
**Symptom:** Category mapping dialog ("Remember this category?") appears twice during scan flow.

**Status:** Not reproduced in code analysis. May have been resolved by other fixes. Needs user verification.

### Transaction Not Saved After Double Confirm
**Symptom:** After confirming twice in dialogs, transaction doesn't actually save.

**Status:** Not reproduced in code analysis. May be related to double dialog issue. Needs user verification.

---

## Deployment History

| PR | Description | Merged | Deployed |
|----|-------------|--------|----------|
| #143 | Stale closure fix | 2026-01-08 05:24 | 2026-01-08 05:38 |
| #145 | Scan UI fixes | 2026-01-08 06:01 | 2026-01-08 06:09 |
| #146 | Almacén category | 2026-01-08 06:18 | 2026-01-08 06:24 |

---

## Lessons Learned

1. **React Closure Pitfall**: Always pass values directly to setTimeout callbacks rather than relying on state closures when the callback runs shortly after a state update.

2. **AI Data Contracts**: Document clearly what the AI returns. The `price` field being a line total (not unit price) wasn't documented, leading to incorrect validation logic.

3. **View State Matching**: When adding new views or renaming them, search for all places that check view state (visibility conditions, conditional rendering, etc.).

4. **Navigation After Dialogs**: Modal/dialog handlers should always include navigation logic if the expected UX is to move to a different screen.

---

## Testing Recommendations

For future scan flow changes:
1. Test on actual device (not just emulator)
2. Test full scan-to-save flow
3. Test total mismatch dialog both paths
4. Verify thumbnail displays throughout flow
5. Check for any duplicate dialogs
