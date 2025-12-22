# Epic 10a Technical Context

**Epic:** 10a - UX Consolidation (Home & Insights Tabs)
**Created:** 2025-12-20
**Status:** Ready for Implementation

---

## Executive Summary

Epic 10a restructures the app's navigation by:
1. Merging Dashboard (Home) + History (Receipts) into a unified Home screen
2. Repurposing the Receipts tab as an Insights History panel
3. Extending InsightRecord storage to enable insight history display

This is a UX-focused epic that builds on Epic 10's Insight Engine foundation.

---

## Architecture Overview

### Current Navigation Structure
```
┌─────────────────────────────────────────────────────────┐
│ Home (Dashboard)    │ Analytics │ [Scan] │ Receipts │ Settings │
│ - Summary cards     │           │   FAB  │ - Filters│          │
│ - Scan AI CTA       │           │        │ - All tx │          │
│ - 5 recent tx       │           │        │          │          │
└─────────────────────────────────────────────────────────┘
```

### New Navigation Structure
```
┌─────────────────────────────────────────────────────────┐
│ Home               │ Analytics │ [Scan] │ Insights │ Settings │
│ - Summary cards    │           │   FAB  │ - Past   │          │
│ - Filter bar       │           │        │   insights│         │
│ - All transactions │           │        │ - Weekly │          │
│   (paginated)      │           │        │   groups │          │
└─────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Consolidated HomeView (DashboardView refactor)

**Current DashboardView Props:**
```typescript
interface DashboardViewProps {
  transactions: Transaction[];      // 5 recent
  allTransactions?: Transaction[];  // All for totals
  // ... other props
}
```

**After Consolidation:**
- Remove Scan AI CTA section
- Add HistoryFilterBar component
- Change `transactions` to use `allTransactions`
- Add pagination state (historyPage, setHistoryPage)
- Add duplicate detection with `getDuplicateIds()`
- Wrap with HistoryFiltersProvider

### 2. New InsightsView

**Component Structure:**
```typescript
interface InsightsViewProps {
  onBack: () => void;
  onEditTransaction: (tx: Transaction) => void;
  theme: string;
  t: (key: string) => string;
}
```

**Data Flow:**
```
App.tsx
  └── InsightsView
        ├── getUserInsightProfile() → InsightRecord[]
        ├── groupByWeek(insights)
        └── InsightHistoryCard (for each insight)
              └── onClick → navigate to EditView(transactionId)
```

### 3. Extended InsightRecord

**Current Schema:**
```typescript
interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
}
```

**Extended Schema:**
```typescript
interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
  // NEW: Full content for history display
  title?: string;
  message?: string;
  category?: InsightCategory;
  icon?: string;
}
```

---

## File Impact Analysis

| File | Change Type | Description |
|------|-------------|-------------|
| `src/views/DashboardView.tsx` | MAJOR REFACTOR | Remove CTA, add filters, full tx list |
| `src/views/InsightsView.tsx` | NEW | Insight history panel |
| `src/components/Nav.tsx` | MINOR | Icon + label change |
| `src/components/insights/InsightHistoryCard.tsx` | NEW | History card component |
| `src/types/insight.ts` | MINOR | Extend InsightRecord |
| `src/services/insightEngineService.ts` | MINOR | Store full insight content |
| `src/utils/translations.ts` | MINOR | Add 'insights' key |
| `src/App.tsx` | MINOR | Update View type, add InsightsView |

---

## Data Migration Strategy

**No migration required.** The schema extension is backward compatible:
- Old InsightRecords without `title`/`message` will show `insightId` as fallback
- New insights will be stored with full content
- FIFO cleanup limits to 50 records to prevent storage bloat

---

## Testing Strategy

### Unit Tests
- DashboardView: filters, pagination, duplicate detection
- InsightsView: grouping, card rendering, empty state
- InsightRecord: new fields optional, old records work

### E2E Tests
- Home screen shows all transactions with filters
- "This Month" navigates to Analytics
- Insights tab shows insight history
- Tapping insight navigates to transaction

---

## Performance Considerations

### Home Screen
- Already have `allTransactions` passed as prop
- Pagination limits DOM nodes (10-20 per page)
- Duplicate detection is memoized (O(n) once)
- Filter operations are memoized

### Insights Panel
- Load `shownInsights` array from UserInsightProfile
- Max 50 records (FIFO limit) = fast render
- Week grouping is O(n) on small dataset

---

## Dependencies

| Dependency | Status | Used By |
|------------|--------|---------|
| Epic 10 (Insight Engine) | COMPLETE | InsightRecord type |
| HistoryFiltersProvider | EXISTS | Story 10a.1 |
| HistoryFilterBar | EXISTS | Story 10a.1 |
| getDuplicateIds() | EXISTS | Story 10a.1 |
| getUserInsightProfile() | EXISTS | Story 10a.4 |

---

## Implementation Order

1. **Story 10a.5** (1 pt) - Extend InsightRecord schema first
2. **Story 10a.3** (1 pt) - Nav tab rename (independent)
3. **Story 10a.1** (5 pts) - Home consolidation (main work)
4. **Story 10a.2** (1 pt) - This Month fix (quick)
5. **Story 10a.4** (5 pts) - Insights view (depends on 10a.5)

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| DashboardView refactor breaks existing behavior | Medium | High | Comprehensive testing, staged deployment |
| Old InsightRecords display poorly | Low | Low | Graceful fallback to insightId |
| Performance with many transactions | Low | Medium | Already paginated, memoized |

---

## Related Documents

- [Epic 10a Planning](./epic-10a-ux-consolidation.md)
- [Epic 10 Architecture](../epic10/architecture-epic10-insight-engine.md)
- [Ideas Origin](../../planning/ideas-contextual-insights.md)
