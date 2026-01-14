# Story 14.38: Item View Toggle - Grouped vs Original Order

**Status:** done
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** None

---

## Story

**As a** user editing a transaction with many items,
**I want to** toggle between viewing items grouped by category or in their original scan order,
**So that** I can verify items one-by-one in the order they appear on my receipt.

---

## Context

### Problem
When editing a transaction in `TransactionEditorView` or `EditView`, items are automatically grouped by category (e.g., "Fresh Produce", "Packaged Foods", "Beverages") and sorted by price within each group. While this grouped view is useful for understanding spending patterns, it makes it difficult to:

1. **Verify scan accuracy** - Users cannot easily compare the app's item list against the physical receipt line-by-line
2. **Find specific items** - Items are reorganized, so users must search through category groups
3. **Identify missing/duplicate items** - Without original order, detecting OCR errors is harder

### Solution
Add a toggle bar above the items section that allows switching between:
- **Grouped View** (current default) - Items organized by category group, sorted by price descending
- **Original Order** - Items displayed in array index order (as received from scan)

### Technical Context

**Current Item Structure:**
- Items are stored as `TransactionItem[]` array in `Transaction`
- Array index represents the original scan order (no explicit `order` field)
- Display uses `itemsByGroup` memo that re-groups and re-sorts items

**Existing Reusable Pattern:**
- `InsightsViewSwitcher.tsx` provides a pill-style toggle with sliding indicator
- Same visual pattern can be adapted for this feature

---

## Acceptance Criteria

### AC 1: Add Item View Toggle Component

- [x] Create toggle bar component above items section in TransactionEditorView
- [x] Two options: "Por Grupo" / "By Group" (left) and "Original" (right)
- [x] Use pill-style design matching `InsightsViewSwitcher` with sliding background
- [x] Toggle should be compact and fit within the items section header area
- [x] Default view: Grouped (current behavior)

### AC 2: Implement Original Order View

- [x] When "Original" is selected, display items in array index order
- [x] No grouping headers in original view - flat list of all items
- [x] Maintain all item editing capabilities (tap to edit, category selection, delete)
- [x] Show item index number (1, 2, 3...) as visual reference in original view
- [x] Items should still show their category badge for context

### AC 3: Preserve Grouped View Functionality

- [x] Grouped view behavior remains unchanged (default)
- [x] Collapsible groups still work in grouped view
- [x] Sorting by price descending within groups preserved
- [x] Group totals displayed in headers

### AC 4: State Management

- [x] Toggle state should be local to the editor (not persisted)
- [x] Switching views should not affect the underlying item data
- [x] Editing an item in either view updates the same underlying array
- [x] After editing, user stays in their selected view

### AC 5: Visual Design

- [x] Toggle uses theme CSS variables for consistency
- [x] Smooth transition animation when switching views
- [x] Original view uses subtle alternating row backgrounds for readability
- [x] Index numbers styled subtly (muted color, small size)

### AC 6: Apply to Both Editor Views

- [x] Implement in `TransactionEditorView.tsx` (primary editor)
- [x] Implement in `EditView.tsx` (legacy editor) for consistency

---

## Technical Notes

### Existing Code References

**Item Grouping Logic (TransactionEditorView.tsx ~line 472):**
```typescript
const itemsByGroup = useMemo(() => {
  const groups: Record<string, Array<{ item: TransactionItem; originalIndex: number }>> = {};
  currentTransaction.items.forEach((item, index) => {
    const normalizedCategory = normalizeItemCategory(item.category || 'Other');
    const groupKey = getItemCategoryGroup(normalizedCategory);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push({ item, originalIndex: index });
  });
  // Sort and return...
}, [currentTransaction.items]);
```

**Note:** `originalIndex` is already tracked - this will be used for original order view.

**Reusable Toggle Pattern (InsightsViewSwitcher.tsx):**
```tsx
<div className="relative flex items-center p-1 rounded-full"
     style={{ backgroundColor: 'var(--bg-tertiary)' }}>
  {/* Sliding indicator */}
  <div className="absolute h-[calc(100%-8px)] rounded-full transition-all"
       style={{ backgroundColor: 'var(--primary)', width: '50%', left: activeIdx === 0 ? '4px' : '50%' }} />
  {/* Buttons */}
  <button className="relative z-10 flex-1">Por Grupo</button>
  <button className="relative z-10 flex-1">Original</button>
</div>
```

### New State Required

```typescript
type ItemViewMode = 'grouped' | 'original';
const [itemViewMode, setItemViewMode] = useState<ItemViewMode>('grouped');
```

### Original Order Rendering

```typescript
// When itemViewMode === 'original'
currentTransaction.items.map((item, index) => (
  <div key={index}>
    <span className="text-xs text-muted">{index + 1}.</span>
    {/* Existing item display component */}
  </div>
))
```

---

## Out of Scope

- Persisting view preference to user settings
- Drag-and-drop reordering of items
- Adding explicit `order` field to TransactionItem schema
- Sorting options in original view (always array order)

---

## Testing Checklist

- [x] Toggle switches between views smoothly
- [x] Items in original view match array order
- [x] Editing item in original view updates correctly
- [x] Deleting item updates both views properly
- [x] Adding new item appears in correct position (end of list in original, correct group in grouped)
- [x] Index numbers in original view are sequential (1, 2, 3...)
- [x] Toggle state resets when navigating away and back
- [x] Works correctly with 0 items, 1 item, many items (50+)

---

## Dev Agent Record

### Implementation Plan
1. Created reusable `ItemViewToggle` component based on `InsightsViewSwitcher` pattern
2. Added `itemViewMode` state to both TransactionEditorView and EditView
3. Implemented original order view with sequential index numbers
4. Preserved all existing grouped view functionality
5. Added translations for Spanish and English

### Debug Log
- Atlas patterns consulted: InsightsViewSwitcher.tsx for toggle UI pattern
- No issues encountered during implementation
- Build verified successful

### Completion Notes
- **Component created:** `src/components/items/ItemViewToggle.tsx`
- **Views updated:** TransactionEditorView.tsx and EditView.tsx
- **Translations added:** `byGroup`, `originalOrder`, `itemViewModes` in both English and Spanish
- **Tests written:** 32 tests (15 unit + 17 integration) covering all acceptance criteria

---

## File List

### New Files
- `src/components/items/ItemViewToggle.tsx` - Reusable toggle component
- `tests/unit/components/items/ItemViewToggle.test.tsx` - Unit tests (15)
- `tests/unit/components/items/ItemViewToggle.integration.test.tsx` - Integration tests (17)

### Modified Files
- `src/views/TransactionEditorView.tsx` - Added toggle and original order view
- `src/views/EditView.tsx` - Added toggle and original order view
- `src/utils/translations.ts` - Added translation keys for toggle labels
- `src/components/items/index.ts` - Added barrel export for ItemViewToggle (code review fix)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Story created | SM |
| 2026-01-13 | Implementation complete, all ACs satisfied | Dev Agent (Claude) |
| 2026-01-13 | Code review passed - added barrel export, fixed empty ternary | Code Review (Claude) |
