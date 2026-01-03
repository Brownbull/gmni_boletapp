# Story 13.8: Mockup - Transaction List + Filters

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Ready for Dev
**Story Points:** 3
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user reviewing my transactions**,
I want **comprehensive filtering options**,
So that **I can find specific transactions quickly and analyze subsets of my spending**.

---

## Acceptance Criteria

- [ ] **AC #1:** Filter panel mockup with all filter types
- [ ] **AC #2:** Filter chip states (active, inactive, clearable)
- [ ] **AC #3:** Swipe gesture integration for time navigation
- [ ] **AC #4:** Empty state design for no results

---

## Filter Categories

### Time Filters
- Quick presets: Today, This Week, This Month
- Custom date range picker
- Swipe navigation between periods

### Location Filters
- City/Region selection
- Store/Merchant filter
- Map view option (future)

### Transaction Date vs Scan Date
- Toggle between date types
- Visual indicator of which is active
- Useful for batch-scanned receipts

### Category Filters
- Multi-select categories
- Subcategory drill-down
- "All Categories" reset

---

## Key Elements to Design

### Filter Panel
- Expandable/collapsible
- Grouped by filter type
- Clear visual hierarchy
- "Apply" and "Clear All" actions

### Filter Chips
- Active state (colored, filled)
- Inactive state (outlined)
- Removable (X button)
- Count indicator for multi-select

### Transaction Cards
- Consistent with existing design
- Category color indicator
- Quick actions (edit, delete)
- Swipe actions optional

### Empty State
- Friendly message
- Clear filter suggestion
- Scan CTA if no transactions

---

## Design States

### Default (No Filters)
- All transactions, recent first
- Filter button visible
- Period indicator

### Filters Applied
- Filter chips visible
- Filtered count shown
- Clear filters option

### Empty Results
- Friendly illustration
- "No transactions match"
- Suggestion to adjust filters

---

## Deliverable

**File:** `docs/uxui/mockups/transaction-list.excalidraw` or Figma

**Include:**
- Default list view
- Filter panel expanded
- Filter chips in action
- Empty state
- Swipe gesture indicators

---

## Definition of Done

- [ ] Filter panel mockup complete
- [ ] All filter types represented
- [ ] Chip states designed
- [ ] Empty state designed
- [ ] Swipe integration shown
- [ ] Reviewed by Gabe

---

## Context References

- **Epic Definition:** Story 13.6 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)
- **Existing Filters:** Epic 9 History filters implementation

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
