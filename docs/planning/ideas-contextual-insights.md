# Contextual Insights & Insight History - Feature Ideas

**Date:** 2025-12-20
**Status:** IDEA / PLANNING
**Origin:** User feedback during v9.1.0 development session

---

## Problem Statement

Current insights provide surface-level observations without meaningful context:
1. "3ª vez en H&M" doesn't indicate time frame (this month? this year? ever?)
2. No comparison data to help users understand their spending patterns
3. Insights are shown once and forgotten - no way to review past insights

---

## Proposed Enhancements

### 1. Time-Framed Insights ✅ (IMPLEMENTED in v9.1.0)

**Before:** "3ª vez en H&M"
**After:** "3ª vez en H&M este mes" or "5ª vez en H&M este año"

**Status:** Implemented in PR #109

---

### 2. Contextual Comparison Insights (Epic F7 Candidate)

Inspired by coffee shop labels: "150mg coffee in americano vs 300mg in grande"
Apply same concept to spending - give users reference points for their transactions.

#### Proposed Insight Types

| Insight ID | Category | Message Example | Context Needed |
|------------|----------|-----------------|----------------|
| `merchant_avg_spend` | ACTIONABLE | "Gastas en promedio $15.000 en H&M" | Historical merchant totals |
| `vs_merchant_avg` | ACTIONABLE | "Esta compra es 20% más alta que tu promedio en H&M" | Current vs historical avg |
| `category_breakdown` | QUIRKY_FIRST | "En supermercados: 40% alimentos, 30% bebidas" | Category item distribution |
| `time_spending_pattern` | ACTIONABLE | "Compras nocturnas son 18% más caras que diurnas" | Time-based totals |
| `item_unit_price` | QUIRKY_FIRST | "Este café: $2.500/unidad vs $2.000 promedio" | Item price tracking |
| `merchant_comparison` | ACTIONABLE | "15% más caro que otros cafés en tu historial" | Cross-merchant comparison |

#### Technical Requirements

- Extend `PrecomputedAggregates` with:
  - `merchantAverages: Record<string, { avg: number, count: number }>`
  - `categoryItemBreakdown: Record<string, Record<string, number>>`
  - `timeOfDayTotals: Record<'morning' | 'afternoon' | 'evening' | 'night', number>`
- Performance: Stay within 100ms budget for aggregate computation
- Generator complexity: Medium (requires historical calculation)

---

### 3. Insight History & Analytics Panel (Epic F6 Extension)

Allow users to review past insights and see patterns over time.

#### User Stories

1. As a user, I want to see my past insights so I can recall interesting patterns
2. As a user, I want to see my most common insights to understand my behavior
3. As a user, I want to see a "highlight reel" of my best/most interesting insights

#### Proposed Features

**A. Insight History View (Settings → Insights)**
- List of last 30 insights with dates
- Group by week/month
- Click to see the transaction that triggered it

**B. Insight Analytics (Analytics → Insights tab)**
- Most frequent insight types
- "Your patterns" summary (e.g., "You're a weekend shopper")
- Milestone celebrations ("10th scan!", "First duplicate caught!")

**C. Enhanced Storage**
Current storage (InsightRecord):
```typescript
{
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
}
```

Proposed (InsightHistoryRecord):
```typescript
{
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
  // NEW: Store full insight for history
  title: string;
  message: string;
  category: InsightCategory;
}
```

#### Technical Considerations

- Firestore document size limits (~1MB)
- Consider separate collection for insight history if > 30 records
- Client-side pagination for history view
- Consider localStorage cache for quick history access

---

## Epic Placement Recommendation

| Feature | Epic | Priority | Points |
|---------|------|----------|--------|
| Time-framed insights | v9.1.0 | HIGH | ✅ Done |
| Contextual comparisons | F7 (New) or 10.x | MEDIUM | ~8 pts |
| Insight History View | F6 Extension | MEDIUM | ~5 pts |
| Insight Analytics Panel | F6 Extension | LOW | ~8 pts |

---

## Next Steps

1. ✅ Time-framed insights: Implemented (PR #109)
2. [ ] Add to Epic F6 backlog: Insight History View
3. [ ] Create Epic F7 or 10.x: Contextual Comparison Insights
4. [ ] User research: Which contextual insights would users find most valuable?

---

## References

- Epic 10 Architecture: `docs/sprint-artifacts/epic10/architecture-epic10-insight-engine.md`
- Insight Types: `src/types/insight.ts`
- Current Generators: `src/utils/insightGenerators.ts`
- Epic F6 (Deferred): Analytics Dashboard & Scheduled Insights
