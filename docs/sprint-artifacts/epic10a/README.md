# Epic 10a: UX Consolidation - Home & Insights Tabs

**Epic Status:** Ready for Implementation
**Architecture:** [epic-10a-ux-consolidation.md](./epic-10a-ux-consolidation.md)
**Total Story Points:** ~13 points
**Estimated Duration:** 1 week

---

## Epic Summary

Epic 10a consolidates the user experience by merging the Home (Dashboard) and Receipts (History) views into a unified Home screen, and repurposing the Receipts tab as an Insights History panel. This reduces navigation friction and gives users easy access to their past insights.

**Key Transformation:**
- **Before:** Home (summary) + Receipts (history) = 2 separate tabs for transaction data
- **After:** Home (summary + filters + all transactions) + Insights (insight history) = streamlined experience

---

## Story Map

```
Epic 10a: UX Consolidation (~13 points)
│
├── Story 10a.1: Home Screen Consolidation (5 points)
│   └── Dependencies: None
│   └── Deliverable: Merged Dashboard + History into unified Home
│
├── Story 10a.2: Fix "This Month" Navigation (1 point)
│   └── Dependencies: None
│   └── Deliverable: This Month card navigates to Analytics month view
│
├── Story 10a.3: Nav Tab Rename - Receipts → Insights (1 point)
│   └── Dependencies: None
│   └── Deliverable: Tab icon and label change
│
├── Story 10a.4: Insights History View (5 points)
│   └── Dependencies: Story 10a.5
│   └── Deliverable: New InsightsView with historical insights list
│
└── Story 10a.5: Update InsightRecord Storage (1 point)
    └── Dependencies: None
    └── Deliverable: Extended InsightRecord schema with full content
```

---

## Stories Index

| Story | Title | Points | Status | Story File |
|-------|-------|--------|--------|------------|
| 10a.1 | Home Screen Consolidation | 5 | Ready | [story-10a.1-home-consolidation.md](./story-10a.1-home-consolidation.md) |
| 10a.2 | Fix "This Month" Navigation | 1 | Ready | [story-10a.2-this-month-fix.md](./story-10a.2-this-month-fix.md) |
| 10a.3 | Nav Tab Rename | 1 | Ready | [story-10a.3-nav-tab-rename.md](./story-10a.3-nav-tab-rename.md) |
| 10a.4 | Insights History View | 5 | Ready | [story-10a.4-insights-history-view.md](./story-10a.4-insights-history-view.md) |
| 10a.5 | Update InsightRecord Storage | 1 | Ready | [story-10a.5-insight-record-storage.md](./story-10a.5-insight-record-storage.md) |

---

## Implementation Order

```
Day 1: Foundation
  10a.5 InsightRecord Storage (1 pt) ──►
  10a.3 Nav Tab Rename (1 pt) ──────────►

Day 2-3: Core Changes
  10a.1 Home Screen Consolidation (5 pts) ──────────────►
  10a.2 This Month Fix (1 pt) ───►

Day 4-5: Insights Panel
  10a.4 Insights History View (5 pts) ────────────────────►
```

---

## Key Files to Modify

| Story | Files |
|-------|-------|
| 10a.1 | `src/views/DashboardView.tsx`, `src/App.tsx` |
| 10a.2 | `src/views/DashboardView.tsx` |
| 10a.3 | `src/components/Nav.tsx`, `src/utils/translations.ts` |
| 10a.4 | `src/views/InsightsView.tsx` (NEW), `src/App.tsx` |
| 10a.5 | `src/types/insight.ts`, `src/services/insightEngineService.ts` |

---

## Dependencies

- Epic 10 (Insight Engine) - COMPLETE
- HistoryFiltersProvider - EXISTS
- InsightRecord type - EXISTS (needs extension)

---

## Success Criteria

1. Home tab shows summary cards + filter bar + all transactions
2. Scan AI CTA card removed from Home
3. "This Month" card navigates to Analytics month view
4. Receipts tab renamed to Insights with Lightbulb icon
5. Insights tab shows historical insight list
6. Old insights without full content display gracefully

---

## References

- Planning Document: [epic-10a-ux-consolidation.md](./epic-10a-ux-consolidation.md)
- Ideas Origin: [ideas-contextual-insights.md](../../planning/ideas-contextual-insights.md)
- Epic 10 Architecture: [architecture-epic10-insight-engine.md](../epic10/architecture-epic10-insight-engine.md)

---

## Created

- **Date:** 2025-12-20
- **Author:** Claude (via BMAD Framework)
- **Origin:** User feedback session - insight history feature request
