# Story 10.4 Context: Pattern Detection Insights

**Purpose:** Context document for implementing history-based pattern detection generators.
**Architecture:** [architecture-epic10-insight-engine.md](./architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files to Modify/Create

| File | Action |
|------|--------|
| `src/utils/insightGenerators.ts` | ADD 5 pattern detection generators |
| `src/services/insightEngineService.ts` | ADD precomputed aggregates functions |
| `tests/unit/utils/insightGenerators.test.ts` | ADD pattern detection tests |

---

## Dependencies

**Must exist before this story:**
- Story 10.2: `calculateUserPhase()` in insightEngineService
- Story 10.3: `INSIGHT_GENERATORS` registry, `generateAllCandidates()`

---

## 5 Pattern Detection Generators

| ID | Category | Minimum Data | Triggers When |
|----|----------|--------------|---------------|
| `merchant_frequency` | ACTIONABLE | 2+ visits | Same merchant visited before |
| `category_trend` | ACTIONABLE/CELEBRATORY | 5+ in category | Compares to last month |
| `day_pattern` | QUIRKY_FIRST | 3+ same day | Consistent shopping day |
| `spending_velocity` | ACTIONABLE/CELEBRATORY | 1 week | Weekly pace tracking |
| `time_pattern` | QUIRKY_FIRST | 3+ same time | Consistent shopping time |

---

## Key Difference from Story 10.3

**Story 10.3 (Cold-Start):** Works with ANY single transaction, no history needed
**Story 10.4 (Patterns):** REQUIRES transaction history, has minimum data requirements

---

## Helper Functions Needed

```typescript
// Spanish ordinals
function getOrdinalSpanish(n: number): string {
  const ordinals: Record<number, string> = {
    1: '1ra', 2: '2da', 3: '3ra', 4: '4ta', 5: '5ta',
    6: '6ta', 7: '7ma', 8: '8va', 9: '9na', 10: '10ma',
  };
  return ordinals[n] || `${n}ª`;
}

// Spanish day names
function getDayNameSpanish(day: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[day];
}

// Time of day
function getTimeOfDaySpanish(hour: number): string {
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'mañana';
  if (hour < 14) return 'mediodía';
  if (hour < 19) return 'tarde';
  return 'noche';
}

// Date helpers
function isThisMonth(dateStr: string): boolean { /* ... */ }
function isLastMonth(dateStr: string): boolean { /* ... */ }
```

---

## Precomputed Aggregates

For performance, precompute common aggregates and store in localStorage cache:

```typescript
// src/services/insightEngineService.ts

export interface PrecomputedAggregates {
  merchantVisits: Record<string, number>;   // { "Jumbo": 5, "Lider": 3 }
  categoryTotals: Record<string, number>;   // { "Supermarket": 150000 }
  computedAt: string;                        // ISO timestamp
}

export function computeAggregates(
  transactions: Transaction[]
): PrecomputedAggregates {
  const merchantVisits: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    merchantVisits[tx.merchant] = (merchantVisits[tx.merchant] || 0) + 1;
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.total;
  }

  return { merchantVisits, categoryTotals, computedAt: new Date().toISOString() };
}
```

---

## Generator Pattern (with history)

```typescript
const merchantFrequencyGenerator: InsightGenerator = {
  id: 'merchant_frequency',
  category: 'ACTIONABLE',
  canGenerate: (tx, history) => {
    // REQUIRES at least 2 previous visits
    const visits = history.filter(h => h.merchant === tx.merchant).length;
    return visits >= 2;
  },
  generate: (tx, history) => {
    const visits = history.filter(h => h.merchant === tx.merchant).length + 1;
    return {
      id: 'merchant_frequency',
      category: 'ACTIONABLE',
      title: 'Visita frecuente',
      message: `${getOrdinalSpanish(visits)} vez en ${tx.merchant} este mes`,
      icon: 'Repeat',
      priority: visits,
      transactionId: tx.id,
    };
  },
};
```

---

## Dynamic Category Selection

Some generators change category based on the data:

```typescript
// category_trend can be CELEBRATORY (spending down) or ACTIONABLE (spending up)
const change = ((thisTotal - lastTotal) / lastTotal) * 100;

return {
  id: 'category_trend',
  category: change < 0 ? 'CELEBRATORY' : 'ACTIONABLE',  // Dynamic!
  title: change < 0 ? '¡Ahorrando!' : 'Tendencia',
  // ...
};
```

---

## Update Registry

After implementing, add to the INSIGHT_GENERATORS registry:

```typescript
export const INSIGHT_GENERATORS: Record<string, InsightGenerator> = {
  // Transaction-Intrinsic (Story 10.3)
  biggest_item: biggestItemGenerator,
  item_count: itemCountGenerator,
  // ... 5 more from 10.3

  // Pattern Detection (THIS STORY)
  merchant_frequency: merchantFrequencyGenerator,
  category_trend: categoryTrendGenerator,
  day_pattern: dayPatternGenerator,
  spending_velocity: spendingVelocityGenerator,
  time_pattern: timePatternGenerator,
};
```

---

## Testing with History

```typescript
describe('merchant_frequency', () => {
  const gen = INSIGHT_GENERATORS.merchant_frequency;

  it('triggers when 2+ previous visits', () => {
    const tx = createTransaction({ merchant: 'Jumbo' });
    const history = [
      createTransaction({ merchant: 'Jumbo' }),
      createTransaction({ merchant: 'Jumbo' }),
    ];
    expect(gen.canGenerate(tx, history)).toBe(true);
  });

  it('does not trigger on first visit', () => {
    const tx = createTransaction({ merchant: 'Jumbo' });
    expect(gen.canGenerate(tx, [])).toBe(false);
  });
});
```

---

## Performance Budget

From Architecture:
- Total insight generation: <100ms
- Individual generator: <10ms
- Use precomputed aggregates for O(1) lookups
