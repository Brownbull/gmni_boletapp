# Hotfix: v9.6.0 Post-Deployment Issues

**Date:** 2026-01-08
**Version:** 9.6.0 → 9.6.1
**Status:** In Progress (Issue 4 pending deployment)

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

## Issue 4: Wrong View When Returning During Single-Image Scan (v9.6.1)

### Symptoms
- User initiates single-image scan
- While processing (yellow icon on camera FAB), user navigates away
- User clicks camera button to return to the scan
- User sees empty "Revisar Lote" (BatchReviewView) with "0 Recibos" instead of the transaction editor

### Root Cause
The camera FAB click handler in `App.tsx` used `scanStatus` to determine navigation:

```javascript
// OLD (buggy)
if (scanStatus === 'processing' || scanStatus === 'ready') {
    navigateToView('batch-review');
}
```

But `scanStatus` is set to `'processing'` for BOTH:
1. Batch processing (`batchProcessing.isProcessing`)
2. Single-image scanning (`pendingScan?.status === 'analyzing'`)

This caused single-image scans to incorrectly route to `batch-review` (which was empty).

### Fix
Distinguish between batch and single-image processing in the click handler:

```javascript
// NEW (fixed)
if (batchProcessing.isProcessing || batchReviewResults.length > 0) {
    navigateToView('batch-review');
} else if (pendingScan?.status === 'analyzing' || pendingScan?.analyzedTransaction) {
    // Single-image scan in progress or complete - show transaction editor
    navigateToView('transaction-editor');
} else {
    triggerScan();
}
```

### Files Changed
- `src/App.tsx`: Nav `onScanClick` handler (~line 3091)

---

## Outstanding Issues (Monitoring)

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
| TBD | Single-scan navigation fix (Issue 4) | Pending | Pending |

---

## Lessons Learned

1. **React Closure Pitfall**: Always pass values directly to setTimeout callbacks rather than relying on state closures when the callback runs shortly after a state update.

2. **AI Data Contracts**: Document clearly what the AI returns. The `price` field being a line total (not unit price) wasn't documented, leading to incorrect validation logic.

3. **View State Matching**: When adding new views or renaming them, search for all places that check view state (visibility conditions, conditional rendering, etc.).

4. **Navigation After Dialogs**: Modal/dialog handlers should always include navigation logic if the expected UX is to move to a different screen.

5. **Derived State vs Source State**: When computing derived status values (like `scanStatus`), using them directly for logic branching can be fragile. Check the **source state** (`batchProcessing.isProcessing`, `pendingScan?.status`) rather than derived values to ensure correct behavior for all code paths.

---

## Testing Recommendations

For future scan flow changes:
1. Test on actual device (not just emulator)
2. Test full scan-to-save flow
3. Test total mismatch dialog both paths
4. Verify thumbnail displays throughout flow
5. Check for any duplicate dialogs
6. **Navigate away during scan processing** and click camera button to return - verify correct view is shown

---

## v9.6.1 Enhancements Implemented

### Enhancement 1: Grouped Category Selector

**Status:** Implemented ✅

Categories in the category picker are now organized by groups (Food & Dining, Health & Wellness, etc.) with alphabetical sorting within each group. Both store categories and item categories are grouped.

**Files Changed:**
- `src/components/CategorySelectorOverlay.tsx`

### Enhancement 2: Store Category Learning

**Status:** Implemented ✅

When user changes the store category of a transaction, it's now learned alongside the merchant alias. Future scans from the same merchant will auto-apply both the alias AND the store category.

**Files Changed:**
- `src/types/merchantMapping.ts`: Added `storeCategory?: StoreCategory`
- `src/hooks/useMerchantMappings.ts`: Updated `saveMapping` to accept optional category
- `src/views/TransactionEditorView.tsx`: Detect category changes, pass to save
- `src/components/dialogs/LearnMerchantDialog.tsx`: Show category changes in dialog
- `src/App.tsx`: Apply learned category during scan processing (4 locations)

### Enhancement 3: Selective Learning Dialog

**Status:** Implemented ✅

Users can now selectively remove items from the learning dialog before confirming. Each item (alias, category) has a trash icon to remove it. If all items are removed, the dialog closes automatically.

**Files Changed:**
- `src/components/dialogs/LearnMerchantDialog.tsx`: Added internal state, remove buttons, `LearnMerchantSelection` type
- `src/views/TransactionEditorView.tsx`: Updated confirm handler to accept selection

---

## Future Feature: Per-Store Item Name Learning (v9.7.0)

### Overview

Allow users to rename items per-store, with the system learning and auto-applying those names on future scans.

### Target State (Mapping System)

| Mapping Type | Scope | Purpose |
|--------------|-------|---------|
| **Merchant Mapping** | Global | `originalMerchant` → `targetMerchant` (alias) + `storeCategory` |
| **Item Name Mapping** | Per-store | `normalizedMerchant` + `originalItemName` → `targetItemName` + `targetCategory` |
| **Subcategory Mapping** | Global | `normalizedItem` → `subcategory` (user standardizes item names first) |

### Design Decisions

1. **Implementation Approach:** Option A - New Collection
   - Create `item_name_mappings` collection in Firestore
   - Follows existing pattern of category_mappings, subcategory_mappings

2. **Learning Dialog:** Same dialog as merchant learning
   - Compact Tailwind design showing all learnable items
   - Each item has a remove (trash) button
   - Unified "Remember" button for all selected items

3. **Cross-Store Suggestions:** Intelligent suggestions with user confirmation
   - If an item name from Store A matches a learned pattern from Store B:
     - Show a glowing outline on the item name field
     - Display info icon with "Be aware" indicator
     - Clicking icon shows: "This name is also known as [learned name] at [other store]. Change it?"
     - User confirms or cancels

4. **Settings Management:** Add to "My Memories" section
   - Display per-store item name mappings alongside existing mappings
   - Allow view/edit/delete operations

### Data Model

```typescript
// New: src/types/itemNameMapping.ts
interface ItemNameMapping {
  id?: string;
  // Key fields for matching
  normalizedMerchant: string;  // Which store this applies to
  originalItemName: string;    // AI-detected name
  normalizedItemName: string;  // For fuzzy matching
  // Target values
  targetItemName: string;      // User's preferred name
  targetCategory?: ItemCategory; // Optional: also learn category per-store
  // Metadata
  confidence: number;
  source: 'user';
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Implementation Tasks

#### Phase 1: Core Infrastructure
- [ ] Create `ItemNameMapping` type (`src/types/itemNameMapping.ts`)
- [ ] Create `itemNameMappingService.ts` (CRUD operations)
- [ ] Create `useItemNameMappings` hook
- [ ] Add Firestore collection path: `artifacts/{appId}/users/{userId}/item_name_mappings`

#### Phase 2: Detection & Learning
- [ ] Track original item names in TransactionEditorView (useRef)
- [ ] Detect item name changes on save
- [ ] Extend LearnMerchantDialog to show item name changes
- [ ] Compact dialog design with Tailwind components
- [ ] Save item name mappings when confirmed

#### Phase 3: Apply Learned Names
- [ ] During scan processing, after merchant match:
  - Load item name mappings for matched merchant
  - Apply learned names to items (fuzzy match)
  - Mark items with `nameSource: 'learned'`

#### Phase 4: Cross-Store Suggestions
- [ ] Create `ItemNameSuggestionIndicator` component (glowing outline)
- [ ] Create `ItemNameSuggestionDialog` component
- [ ] In TransactionEditorView, check if item name has cross-store matches
- [ ] Show indicator and dialog when applicable

#### Phase 5: Settings UI
- [ ] Add "Item Names" section to My Memories
- [ ] Group mappings by store
- [ ] Allow edit/delete operations

### UI Flow Examples

**Learning Flow:**
1. User scans receipt at "Jumbo"
2. AI returns item: "PROD LACTEO 1L"
3. User renames to: "Leche Entera"
4. On save, learning dialog shows:
   - Merchant alias change (if any)
   - Store category change (if any)
   - Item name change: "PROD LACTEO 1L" → "Leche Entera" @ Jumbo
5. User confirms, mapping saved

**Auto-Apply Flow:**
1. User scans new receipt at "Jumbo"
2. AI returns item: "PROD LACTEO 1L"
3. System matches merchant → finds item name mapping
4. Auto-renames to: "Leche Entera"
5. User sees correct name immediately

**Cross-Store Suggestion Flow:**
1. User scans receipt at "Lider" (new store)
2. AI returns item: "PROD LACTEO 1L"
3. System detects: no mapping for Lider, but Jumbo has "Leche Entera"
4. Item name field shows glowing outline + info icon
5. User clicks icon → popup: "At Jumbo, this is called 'Leche Entera'. Apply?"
6. User confirms → name changed, new mapping saved for Lider

### Files to Create/Modify

**New Files:**
- `src/types/itemNameMapping.ts`
- `src/services/itemNameMappingService.ts`
- `src/hooks/useItemNameMappings.ts`
- `src/components/ItemNameSuggestionIndicator.tsx`
- `src/components/dialogs/ItemNameSuggestionDialog.tsx`

**Modified Files:**
- `src/views/TransactionEditorView.tsx` - detect changes, show indicators
- `src/components/dialogs/LearnMerchantDialog.tsx` - include item names
- `src/App.tsx` - apply learned names during scan
- `src/views/SettingsView.tsx` - add item names section

### Notes for Atlas Agent

When resuming this feature:
1. Start with Phase 1 (infrastructure) - it's self-contained
2. The existing mapping services are good templates to follow
3. LearnMerchantDialog already supports selective learning - extend it
4. Consider Firestore read costs: limit queries, use indexes
5. Test fuzzy matching threshold for item names (may need different threshold than merchant names)
