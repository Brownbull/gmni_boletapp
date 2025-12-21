# Story 10a.1: Home Screen Consolidation

**Story Points:** 5
**Status:** ✅ Done
**Dependencies:** None
**Completed:** 2025-12-20

---

## User Story

As a **user viewing the Home screen**,
I want **to see my summary cards and all my transactions with filters in one place**,
So that **I don't need to switch tabs to view my full transaction history**.

---

## Acceptance Criteria

### AC1: Scan AI CTA Removed
**Given** I am on the Home screen
**When** the view loads
**Then** the "Scan AI" CTA card is NOT visible
**And** only the Total Spent and This Month summary cards appear

### AC2: Filter Bar Added
**Given** I am on the Home screen
**When** the view loads
**Then** the HistoryFilterBar appears below the summary cards
**And** filters include: temporal, category, location (same as current History)

### AC3: Full Transaction List
**Given** I am on the Home screen
**When** the view loads
**Then** I see ALL my transactions (paginated)
**And** NOT just the 5 most recent
**And** pagination controls appear at the bottom

### AC4: Duplicate Badges Visible
**Given** I am on the Home screen
**When** a transaction is a potential duplicate
**Then** the amber duplicate warning badge is visible
**And** same styling as current HistoryView

### AC5: Thumbnail Clicks Work
**Given** I am on the Home screen
**When** I click a transaction thumbnail
**Then** the ImageViewer modal opens
**And** I can view the full receipt image

### AC6: Filter State Preserved
**Given** I apply filters on the Home screen
**When** I navigate away and return
**Then** filter state is preserved for the session

---

## Technical Notes

### Files to Modify
- `src/views/DashboardView.tsx` - Major refactor
- `src/App.tsx` - Update DashboardView props

### Implementation Steps
1. Remove the Scan AI CTA card section from DashboardView
2. Add HistoryFilterBar import and component below summary cards
3. Change from `transactions` (5 recent) to `allTransactions` (all)
4. Add pagination state and controls
5. Add duplicate detection using `getDuplicateIds()`
6. Wrap component with HistoryFiltersProvider or ensure it's wrapped in App.tsx

### Code Pattern Reference
Use the same transaction card pattern from HistoryView:
- `TransactionThumbnail` component
- `normalizeTransaction()` utility
- `getDuplicateIds()` for duplicate detection
- Amber border for duplicates

---

## Testing Requirements

### Unit Tests
- [x] DashboardView renders without Scan AI CTA
- [x] Filter bar appears below summary cards
- [x] All transactions displayed with pagination
- [x] Duplicate badge appears for duplicate transactions
- [x] Filter state preserved across interactions (AC#6)

### E2E Tests
- [ ] User can filter transactions on Home screen
- [ ] Pagination navigates correctly
- [ ] Thumbnail click opens ImageViewer

---

## Definition of Done
- [x] All ACs verified
- [x] Unit tests passing (24 new tests, 1331 unit tests total)
- [ ] E2E tests passing
- [x] Code review approved
- [x] No TypeScript errors

---

## Implementation Notes

### Changes Made
1. **DashboardView.tsx**: Major refactor
   - Removed Scan AI CTA card and its Camera/Receipt icons
   - Added HistoryFilterBar component for filtering
   - Changed from 5 recent transactions to full paginated list (10 per page)
   - Added duplicate detection with amber badges using `getDuplicateIds()`
   - Added empty state when filters match no transactions
   - Added pagination controls (prev/next buttons)
   - Added useEffect to reset page when filters change

2. **App.tsx**: Provider wrapper
   - Wrapped DashboardView with HistoryFiltersProvider for filter context

3. **New Test File**: `tests/unit/views/DashboardView.test.tsx`
   - 24 comprehensive unit tests covering all ACs
   - Tests for: Scan CTA removal, filter bar, pagination, duplicates, thumbnails, empty state
   - Added AC#6 filter state preservation tests (code review fix)

### Key Patterns Used
- Reused existing components: HistoryFilterBar, TransactionThumbnail, ImageViewer
- Reused services: getDuplicateIds(), filterTransactionsByHistoryFilters()
- Consistent with HistoryView card styling and duplicate badge pattern
