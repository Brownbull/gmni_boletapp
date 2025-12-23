# Story 10a.2: Fix "This Month" Navigation

**Story Points:** 1
**Status:** Ready for Development
**Dependencies:** None

---

## User Story

As a **user tapping the "This Month" card**,
I want **to navigate to the Analytics view filtered to the current month**,
So that **I can see a detailed breakdown of my monthly spending**.

---

## Acceptance Criteria

### AC1: This Month Navigates to Analytics
**Given** I am on the Home screen
**When** I tap the "This Month" summary card
**Then** I navigate to the Analytics (Trends) view
**And** the view is filtered to the current month

### AC2: Month Chart Visible
**Given** I tapped "This Month" from Home
**When** the Analytics view loads
**Then** I see the monthly breakdown chart
**And** the temporal breadcrumb shows the current month

---

## Technical Notes

### Current Behavior
The `onViewTrends(currentMonth)` callback is called but may not be passing the month filter correctly to TrendsView.

### Files to Modify
- `src/views/DashboardView.tsx` - Verify callback
- `src/App.tsx` - Ensure month filter is applied when navigating to trends

### Implementation Steps
1. Trace `onViewTrends(currentMonth)` through App.tsx
2. Ensure the month value (YYYY-MM format) is passed to TrendsView
3. TrendsView should initialize with temporal level = 'month' and the specific month

---

## Testing Requirements

### E2E Tests
- [ ] Tapping "This Month" opens Analytics at month level
- [ ] Correct month is displayed in breadcrumb

---

## Definition of Done
- [ ] All ACs verified
- [ ] E2E test passing
- [ ] Code review approved
