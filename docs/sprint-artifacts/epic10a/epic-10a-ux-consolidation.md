# Epic 10a: UX Consolidation - Home & Insights Tabs

**Date:** 2025-12-20
**Status:** PLANNING
**Priority:** HIGH
**Estimated Points:** ~13 pts

---

## Problem Statement

Current app has fragmented navigation:
- **Home (Dashboard)**: Shows summary cards, scan CTA, and 5 recent transactions
- **Receipts (History)**: Shows full transaction list with filters

Users must switch tabs to see their full transaction history. The scan CTA on Home duplicates the floating action button functionality.

---

## Proposed Changes

### New Structure

| Tab | Icon | Content |
|-----|------|---------|
| **Home** | Home | Monthly summary + Filters + All transactions (consolidated) |
| **Analytics** | BarChart3 | (unchanged) |
| **Scan FAB** | Camera | (unchanged - center button) |
| **Insights** | Lightbulb | New insight history panel |
| **Settings** | Settings | (unchanged) |

### Home Tab Transformation

**Current DashboardView:**
```
┌─────────────────────────────┐
│ Overview        [+] button  │
│ Welcome message             │
├─────────────────────────────┤
│ ┌───────────┐ ┌───────────┐│
│ │ Total     │ │ This      ││
│ │ Spent     │ │ Month     ││
│ └───────────┘ └───────────┘│
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Scan AI CTA (redundant) │ │  ← REMOVE
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [5 recent transactions]     │
└─────────────────────────────┘
```

**New HomeView:**
```
┌─────────────────────────────┐
│ Overview        [+] button  │
│ Welcome message             │
├─────────────────────────────┤
│ ┌───────────┐ ┌───────────┐│
│ │ Total     │ │ This      ││  ← FIX: This Month click → Analytics month view
│ │ Spent     │ │ Month     ││
│ └───────────┘ └───────────┘│
├─────────────────────────────┤
│ [Filter Bar from History]   │  ← MOVE filters here
├─────────────────────────────┤
│ [All transactions list]     │  ← Full list with pagination
│ [with duplicates + badges]  │
└─────────────────────────────┘
```

### New Insights Tab

**InsightsView:**
```
┌─────────────────────────────┐
│ ← Back     Insights         │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ "You're a weekend       │ │  ← User pattern summary
│ │  shopper!"              │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Recent Insights             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔄 3ª vez en H&M este   │ │
│ │    mes                  │ │
│ │    Dec 20, 2025         │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ⚠️ Posible duplicado    │ │
│ │    detectado            │ │
│ │    Dec 19, 2025         │ │
│ └─────────────────────────┘ │
│ ...more insights...         │
└─────────────────────────────┘
```

---

## Stories

### Story 10a.1: Home Screen Consolidation (5 pts)
**Goal:** Merge Dashboard and History into unified Home screen

**Tasks:**
1. Remove Scan AI CTA card from DashboardView
2. Add HistoryFilterBar below summary cards
3. Replace 5-transaction limit with full paginated list
4. Keep duplicate detection and all HistoryView features
5. Update HomeView to use HistoryFiltersProvider

**Acceptance Criteria:**
- [ ] AC1: Scan AI CTA card removed from Home
- [ ] AC2: Filter bar appears below summary cards
- [ ] AC3: All transactions shown (paginated)
- [ ] AC4: Duplicate badges visible on Home
- [ ] AC5: Thumbnail clicks work
- [ ] AC6: Filter state preserved during session

### Story 10a.2: Fix "This Month" Navigation (1 pt)
**Goal:** Clicking "This Month" card navigates to Analytics month view

**Tasks:**
1. Fix `onViewTrends(currentMonth)` to navigate to month detail in Analytics

**Acceptance Criteria:**
- [ ] AC1: Clicking "This Month" opens Analytics filtered to current month
- [ ] AC2: Month chart/breakdown visible

### Story 10a.3: Nav Tab Rename - Receipts → Insights (1 pt)
**Goal:** Rename nav tab and update icon

**Tasks:**
1. Change Nav.tsx: `ListIcon` → `Lightbulb`
2. Change label from `receipts` to `insights`
3. Add translation key for "insights"
4. Update view routing from 'list' to 'insights'

**Acceptance Criteria:**
- [ ] AC1: Tab shows Lightbulb icon
- [ ] AC2: Tab shows "Insights" label
- [ ] AC3: Clicking navigates to InsightsView

### Story 10a.4: Insights History View (5 pts)
**Goal:** Create new InsightsView showing insight history

**Tasks:**
1. Create `src/views/InsightsView.tsx`
2. Extend InsightRecord storage to include full insight content
3. Create InsightHistoryCard component
4. Implement chronological list with grouping by week
5. Add click-to-navigate to source transaction
6. Add user pattern summary section (future enhancement placeholder)

**Acceptance Criteria:**
- [ ] AC1: InsightsView renders list of past insights
- [ ] AC2: Insights grouped by week (This Week, Last Week, Earlier)
- [ ] AC3: Each insight card shows icon, title, message, date
- [ ] AC4: Clicking insight navigates to source transaction
- [ ] AC5: Empty state when no insights

### Story 10a.5: Update InsightRecord Storage (1 pt)
**Goal:** Store full insight content for history retrieval

**Current Schema:**
```typescript
interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
}
```

**New Schema:**
```typescript
interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
  // NEW: Full insight content for history
  title: string;
  message: string;
  category: InsightCategory;
  icon?: string;
}
```

**Acceptance Criteria:**
- [ ] AC1: New insights saved with full content
- [ ] AC2: Backward compatible with old records (show id only if no title)
- [ ] AC3: Profile storage size stays under limits

---

## Technical Considerations

### File Changes

| File | Change |
|------|--------|
| `src/views/DashboardView.tsx` | Remove Scan CTA, add filters, show all transactions |
| `src/views/HistoryView.tsx` | Deprecated - content moved to DashboardView |
| `src/views/InsightsView.tsx` | NEW - Insight history panel |
| `src/components/Nav.tsx` | Change list→insights, ListIcon→Lightbulb |
| `src/App.tsx` | Update view routing, remove 'list' view |
| `src/types/insight.ts` | Extend InsightRecord |
| `src/services/insightEngineService.ts` | Save full insight content |
| `src/utils/translations.ts` | Add 'insights' translation |

### Migration Strategy

1. **No data migration needed** - Old InsightRecords without title/message still work
2. **New records** will include full content
3. **Fallback display** for old records: Show insight ID as title

---

## Dependencies

- Epic 10 (Insight Engine) - COMPLETE
- HistoryFiltersProvider - EXISTS
- InsightRecord type - EXISTS (needs extension)

---

## Out of Scope (Future)

- Insight Analytics Panel (most frequent types, patterns) → Epic F6
- Contextual Comparison Insights ("coffee weight" style) → Epic F7
- Milestone celebrations ("10th scan!") → Future

---

## References

- Current DashboardView: `src/views/DashboardView.tsx`
- Current HistoryView: `src/views/HistoryView.tsx`
- Filter Context: `src/contexts/HistoryFiltersContext.tsx`
- Insight Types: `src/types/insight.ts`
- Planning Ideas: `docs/planning/ideas-contextual-insights.md`
