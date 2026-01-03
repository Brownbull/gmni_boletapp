# Story 14.14: Transaction List Redesign

**Status:** ready-for-dev
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.1 (Animation Framework), Story 9.19 (History Filters)
**Mockup:** [transaction-list.html](../../../uxui/mockups/01_views/transaction-list.html)

---

## Story

**As a** user browsing my transaction history,
**I want to** see transactions in the new card-based design with swipe navigation,
**So that** browsing my history feels modern and responsive.

---

## Context

The transaction-list.html mockup shows:
- New card design for transaction items
- Filter chips at top
- Date group headers
- Swipe gestures for time navigation (week/month)

This story updates HistoryView to match the mockup.

---

## Acceptance Criteria

### AC #1: Transaction Card Redesign
- [ ] Each transaction displayed as a card (not list item)
- [ ] Card shows: merchant icon/emoji, merchant name, total, date
- [ ] Category color indicator on card edge
- [ ] Swipe-to-delete gesture (optional, if in mockup)

### AC #2: Date Grouping
- [ ] Transactions grouped by date with sticky headers
- [ ] Header shows: "Today", "Yesterday", or formatted date
- [ ] Group totals shown in header (optional)

### AC #3: Filter Chips
- [ ] Active filters shown as chips below header
- [ ] Chips are tappable to remove filter
- [ ] "Clear All" option when multiple filters active
- [ ] Chip design matches mockup (pill shape, colors)

### AC #4: Swipe Time Navigation
- [ ] useSwipeNavigation integrated for week/month navigation
- [ ] Swipe left = next period, swipe right = previous
- [ ] Works in conjunction with existing filter buttons
- [ ] Visual feedback during swipe gesture

### AC #5: Screen Transitions
- [ ] PageTransition wraps HistoryView content
- [ ] Staggered entry for transaction cards
- [ ] Smooth transition when filters change

---

## Tasks

- [ ] Task 1: Update TransactionCard component styling
- [ ] Task 2: Add date grouping logic with sticky headers
- [ ] Task 3: Integrate filter chips display
- [ ] Task 4: Add useSwipeNavigation to HistoryView
- [ ] Task 5: Implement PageTransition + TransitionChild
- [ ] Task 6: Add stagger animation for card list
- [ ] Task 7: Update empty state design
- [ ] Task 8: Test scrolling performance with 100+ transactions
- [ ] Task 9: Verify existing filter functionality still works

---

## File List

**Modified:**
- `src/views/HistoryView.tsx` - Main refresh target
- `src/components/transaction/TransactionCard.tsx` - Card redesign

**New:**
- `src/components/history/FilterChips.tsx` - Optional extraction
- `src/components/history/DateGroupHeader.tsx` - Optional extraction

**Referenced:**
- `src/hooks/useSwipeNavigation.ts`
- `src/hooks/useHistoryFilters.ts`
- `src/components/animation/PageTransition.tsx`

---

## Dev Notes

### Date Grouping
```typescript
const groupedTransactions = useMemo(() => {
  const groups: Record<string, Transaction[]> = {};

  for (const tx of filteredTransactions) {
    const dateKey = formatDateGroup(tx.date); // "Today", "Yesterday", "Dec 28"
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  }

  return Object.entries(groups);
}, [filteredTransactions]);
```

### Sticky Headers with Virtualization
```typescript
// If using react-window or similar
// Headers need special handling for sticky positioning
// Consider whether virtualization is needed for performance
```

### Swipe Integration
```typescript
const { goNextPeriod, goPrevPeriod } = useHistoryFilters();
const swipeHandlers = useSwipeNavigation({
  onSwipeLeft: goNextPeriod,
  onSwipeRight: goPrevPeriod,
});
```

---

## Test Plan

1. Open History view with transactions
2. Verify cards display with new design
3. Check date grouping is correct
4. Apply a filter, verify chip appears
5. Tap chip to remove filter
6. Swipe left/right to navigate time periods
7. Scroll through 100+ transactions (if available)
8. Test on mobile for touch interactions
