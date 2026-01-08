# Story 14.14: Transaction List Redesign

**Status:** done
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
- [x] Each transaction displayed as a card (not list item)
- [x] Card shows: merchant icon/emoji, merchant name, total, date
- [x] Category color indicator on card edge
- [x] Expandable items section with chevron toggle

### AC #2: Date Grouping
- [x] Transactions grouped by date with sticky headers
- [x] Header shows: "Today", "Yesterday", or formatted date
- [x] Group totals shown in header

### AC #3: Filter Chips
- [x] Active filters shown as chips below header
- [x] Chips are tappable to remove filter
- [x] "Clear All" option when multiple filters active
- [x] Chip design matches mockup (pill shape, colors)

### AC #4: Swipe Time Navigation
- [x] useSwipeNavigation integrated for week/month navigation
- [x] Swipe left = next period, swipe right = previous
- [x] Works in conjunction with existing filter buttons
- [x] Visual feedback during swipe gesture

### AC #5: Screen Transitions
- [x] PageTransition wraps HistoryView content
- [x] Staggered entry for transaction cards via TransitionChild
- [x] Smooth transition when filters change

---

## Tasks

- [x] Task 1: Create TransactionCard component with new card design
- [x] Task 2: Add date grouping logic with sticky headers (DateGroupHeader)
- [x] Task 3: Create FilterChips component for active filter display
- [x] Task 4: Add useSwipeNavigation to HistoryView
- [x] Task 5: Implement PageTransition + TransitionChild wrappers
- [x] Task 6: Add stagger animation for card list
- [x] Task 7: Update empty state design with scan prompt
- [x] Task 8: Update tests for new card structure
- [x] Task 9: Verify existing filter functionality still works
- [x] Task 10: Add pagination with configurable page size (15/30/60 items)

---

## Implementation Summary

### New Components Created
- `src/components/history/TransactionCard.tsx` - Card-based transaction display with:
  - Receipt thumbnail on left
  - Merchant name + amount on first row
  - Category icon + meta pills (time, location) on second row
  - Expandable items section with chevron toggle
  - Duplicate warning indicator

- `src/components/history/DateGroupHeader.tsx` - Sticky date group headers with:
  - "Today", "Yesterday", or formatted date labels
  - Group totals display
  - Utility functions: groupTransactionsByDate, formatDateGroupLabel, calculateGroupTotal

- `src/components/history/FilterChips.tsx` - Active filter chips with:
  - Calendar/Tag/MapPin icons per filter type
  - One-tap removal per filter
  - "Clear All" when multiple filters active

### Modified Files
- `src/views/HistoryView.tsx` - Full redesign using new components:
  - PageTransition wrapper
  - TransitionChild staggered animations
  - Date-grouped transaction list
  - Swipe navigation integration
  - Enhanced empty states
  - Configurable pagination (15/30/60 items per page)

- `src/components/history/index.ts` - Added exports for new components

- `tests/unit/components/HistoryViewThumbnails.test.tsx` - Updated for new card structure

### New Test Files
- `tests/unit/components/history/TransactionCard.test.tsx`
- `tests/unit/components/history/DateGroupHeader.test.tsx`
- `tests/unit/components/history/FilterChips.test.tsx`

---

## File List

**Modified:**
- `src/views/HistoryView.tsx` - Main refresh target
- `src/components/history/index.ts` - Added exports

**New:**
- `src/components/history/TransactionCard.tsx` - New card component
- `src/components/history/FilterChips.tsx` - Filter chip display
- `src/components/history/DateGroupHeader.tsx` - Sticky date headers
- `tests/unit/components/history/TransactionCard.test.tsx`
- `tests/unit/components/history/DateGroupHeader.test.tsx`
- `tests/unit/components/history/FilterChips.test.tsx`

**Referenced:**
- `src/hooks/useSwipeNavigation.ts`
- `src/hooks/useHistoryFilters.ts`
- `src/components/animation/PageTransition.tsx`
- `src/components/animation/TransitionChild.tsx`

---

## Test Plan

1. ✅ Open History view with transactions
2. ✅ Verify cards display with new design (merchant, amount, category icon, meta pills)
3. ✅ Check date grouping is correct ("Today", "Yesterday", formatted dates)
4. ✅ Apply a filter, verify chip appears
5. ✅ Tap chip to remove filter
6. ✅ Swipe left/right to navigate time periods (when temporal filter active)
7. ✅ Expand transaction to see items
8. ✅ Test empty states (no transactions, no matching filters)
9. ✅ All 49 new component tests pass
10. ✅ All 30 HistoryView tests pass (including 13 new pagination tests)
11. ✅ Page size selector shows 15/30/60 options
12. ✅ Default page size is 15 items
13. ✅ Changing page size resets to page 1
