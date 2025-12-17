# Story 10.4: Pattern Detection Insights

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** ready-for-dev
**Story Points:** 5
**Dependencies:** Story 10.2 (Phase Detection & User Profile)

---

## User Story

As a **returning user**,
I want **to see insights about my shopping patterns**,
So that **I discover trends I wouldn't notice on my own**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Brainstorming Document:** [epic-10-insight-engine-brainstorm.md](../../planning/epic-10-insight-engine-brainstorm.md)

---

## Acceptance Criteria

- [ ] **AC #1:** 5 pattern detection insight generators implemented
- [ ] **AC #2:** All generators follow `InsightGenerator` interface pattern
- [ ] **AC #3:** `merchant_frequency` triggers on 2+ visits to same merchant
- [ ] **AC #4:** `category_trend` tracks spending changes vs previous period
- [ ] **AC #5:** `day_pattern` detects consistent shopping day (3+ same weekday)
- [ ] **AC #6:** `spending_velocity` tracks weekly spending rate
- [ ] **AC #7:** `time_pattern` detects consistent shopping time
- [ ] **AC #8:** Precomputed aggregates optimize performance
- [ ] **AC #9:** All generators have Spanish messages (Chilean locale)
- [ ] **AC #10:** Minimum data requirements enforced per generator

---

## Tasks / Subtasks

### Task 1: Implement Pattern Detection Generators (2.5h)

Add to `src/utils/insightGenerators.ts`:

```typescript
// ============================================
// PATTERN DETECTION GENERATORS
// These require transaction history
// ============================================

const merchantFrequencyGenerator: InsightGenerator = {
  id: 'merchant_frequency',
  category: 'ACTIONABLE',
  canGenerate: (tx, history) => {
    // Need 2+ previous visits to this merchant
    const visits = history.filter(h => h.merchant === tx.merchant).length;
    return visits >= 2;
  },
  generate: (tx, history) => {
    const visits = history.filter(h => h.merchant === tx.merchant).length + 1;
    const ordinal = getOrdinalSpanish(visits);

    return {
      id: 'merchant_frequency',
      category: 'ACTIONABLE',
      title: 'Visita frecuente',
      message: `${ordinal} vez en ${tx.merchant} este mes`,
      icon: 'Repeat',
      priority: visits, // More visits = higher priority
      transactionId: tx.id,
    };
  },
};

const categoryTrendGenerator: InsightGenerator = {
  id: 'category_trend',
  category: 'ACTIONABLE',
  canGenerate: (tx, history) => {
    // Need at least 5 transactions in same category from previous period
    const sameCategory = history.filter(h => h.category === tx.category);
    return sameCategory.length >= 5;
  },
  generate: (tx, history) => {
    const thisMonth = history.filter(h =>
      h.category === tx.category &&
      isThisMonth(h.date)
    );
    const lastMonth = history.filter(h =>
      h.category === tx.category &&
      isLastMonth(h.date)
    );

    const thisTotal = thisMonth.reduce((sum, t) => sum + t.total, 0) + tx.total;
    const lastTotal = lastMonth.reduce((sum, t) => sum + t.total, 0);

    if (lastTotal === 0) {
      return {
        id: 'category_trend',
        category: 'ACTIONABLE',
        title: 'Nueva categoría',
        message: `Primer mes con gastos en ${tx.category}`,
        icon: 'TrendingUp',
        priority: 4,
        transactionId: tx.id,
      };
    }

    const change = ((thisTotal - lastTotal) / lastTotal) * 100;
    const direction = change > 0 ? 'subió' : 'bajó';
    const absChange = Math.abs(Math.round(change));

    return {
      id: 'category_trend',
      category: change < 0 ? 'CELEBRATORY' : 'ACTIONABLE',
      title: change < 0 ? '¡Ahorrando!' : 'Tendencia',
      message: `${tx.category} ${direction} ${absChange}% vs mes pasado`,
      icon: change < 0 ? 'TrendingDown' : 'TrendingUp',
      priority: Math.min(absChange / 10, 8), // Cap priority
      transactionId: tx.id,
    };
  },
};

const dayPatternGenerator: InsightGenerator = {
  id: 'day_pattern',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx, history) => {
    const txDay = new Date(tx.date).getDay();
    const sameDayCount = history.filter(h =>
      new Date(h.date).getDay() === txDay
    ).length;
    return sameDayCount >= 3;
  },
  generate: (tx, history) => {
    const txDay = new Date(tx.date).getDay();
    const dayName = getDayNameSpanish(txDay);
    const sameDayCount = history.filter(h =>
      new Date(h.date).getDay() === txDay
    ).length + 1;

    return {
      id: 'day_pattern',
      category: 'QUIRKY_FIRST',
      title: 'Día favorito',
      message: `${sameDayCount} compras en ${dayName} - ¡tu día de compras!`,
      icon: 'Calendar',
      priority: 3,
      transactionId: tx.id,
    };
  },
};

const spendingVelocityGenerator: InsightGenerator = {
  id: 'spending_velocity',
  category: 'ACTIONABLE',
  canGenerate: (tx, history) => {
    // Need at least 1 week of data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const hasWeekData = history.some(h =>
      new Date(h.date) < oneWeekAgo
    );
    return hasWeekData;
  },
  generate: (tx, history) => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeek = history.filter(h => {
      const d = new Date(h.date);
      return d >= thisWeekStart;
    });
    const lastWeek = history.filter(h => {
      const d = new Date(h.date);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    const thisTotal = thisWeek.reduce((sum, t) => sum + t.total, 0) + tx.total;
    const lastTotal = lastWeek.reduce((sum, t) => sum + t.total, 0);

    if (lastTotal === 0) {
      return {
        id: 'spending_velocity',
        category: 'ACTIONABLE',
        title: 'Esta semana',
        message: `Llevas $${thisTotal.toLocaleString('es-CL')} esta semana`,
        icon: 'Gauge',
        priority: 4,
        transactionId: tx.id,
      };
    }

    const change = ((thisTotal - lastTotal) / lastTotal) * 100;

    if (change < -10) {
      return {
        id: 'spending_velocity',
        category: 'CELEBRATORY',
        title: '¡Buen ritmo!',
        message: `${Math.abs(Math.round(change))}% menos que la semana pasada`,
        icon: 'ThumbsUp',
        priority: 6,
        transactionId: tx.id,
      };
    }

    return {
      id: 'spending_velocity',
      category: 'ACTIONABLE',
      title: 'Ritmo semanal',
      message: `$${thisTotal.toLocaleString('es-CL')} esta semana`,
      icon: 'Gauge',
      priority: 3,
      transactionId: tx.id,
    };
  },
};

const timePatternGenerator: InsightGenerator = {
  id: 'time_pattern',
  category: 'QUIRKY_FIRST',
  canGenerate: (tx, history) => {
    if (!tx.time) return false;

    const txHour = parseInt(tx.time.split(':')[0], 10);
    const sameHourRange = history.filter(h => {
      if (!h.time) return false;
      const hHour = parseInt(h.time.split(':')[0], 10);
      return Math.abs(hHour - txHour) <= 1; // Within 1 hour
    });

    return sameHourRange.length >= 3;
  },
  generate: (tx, history) => {
    const txHour = parseInt(tx.time!.split(':')[0], 10);
    const timeOfDay = getTimeOfDaySpanish(txHour);

    return {
      id: 'time_pattern',
      category: 'QUIRKY_FIRST',
      title: 'Tu hora favorita',
      message: `Sueles comprar en la ${timeOfDay}`,
      icon: 'Clock',
      priority: 3,
      transactionId: tx.id,
    };
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getOrdinalSpanish(n: number): string {
  const ordinals: Record<number, string> = {
    1: '1ra', 2: '2da', 3: '3ra', 4: '4ta', 5: '5ta',
    6: '6ta', 7: '7ma', 8: '8va', 9: '9na', 10: '10ma',
  };
  return ordinals[n] || `${n}ª`;
}

function getDayNameSpanish(day: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[day];
}

function getTimeOfDaySpanish(hour: number): string {
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'mañana';
  if (hour < 14) return 'mediodía';
  if (hour < 19) return 'tarde';
  return 'noche';
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear();
}

function isLastMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  return date.getMonth() === lastMonth.getMonth() &&
         date.getFullYear() === lastMonth.getFullYear();
}
```

### Task 2: Precomputed Aggregates (1h)

Add to `src/services/insightEngineService.ts`:

```typescript
import { LocalInsightCache, PrecomputedAggregates } from '../types/insight';

/**
 * Precomputes aggregates for faster pattern detection.
 * Called on app load and after each transaction save.
 */
export function computeAggregates(
  transactions: Transaction[]
): PrecomputedAggregates {
  const merchantVisits: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    // Count merchant visits
    merchantVisits[tx.merchant] = (merchantVisits[tx.merchant] || 0) + 1;

    // Sum category totals
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.total;
  }

  return {
    merchantVisits,
    categoryTotals,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Updates cache with fresh aggregates.
 */
export function updateCacheAggregates(
  cache: LocalInsightCache,
  transactions: Transaction[]
): LocalInsightCache {
  return {
    ...cache,
    precomputedAggregates: computeAggregates(transactions),
  };
}
```

### Task 3: Update Generator Registry (0.5h)

Update the `INSIGHT_GENERATORS` registry in `insightGenerators.ts`:

```typescript
export const INSIGHT_GENERATORS: Record<string, InsightGenerator> = {
  // Transaction-Intrinsic (Story 10.3)
  biggest_item: biggestItemGenerator,
  item_count: itemCountGenerator,
  unusual_hour: unusualHourGenerator,
  weekend_warrior: weekendWarriorGenerator,
  new_merchant: newMerchantGenerator,
  new_city: newCityGenerator,
  category_variety: categoryVarietyGenerator,

  // Pattern Detection (THIS STORY)
  merchant_frequency: merchantFrequencyGenerator,
  category_trend: categoryTrendGenerator,
  day_pattern: dayPatternGenerator,
  spending_velocity: spendingVelocityGenerator,
  time_pattern: timePatternGenerator,
};
```

### Task 4: Unit Tests (1h)

Add to `tests/unit/utils/insightGenerators.test.ts`:

```typescript
describe('Pattern Detection Generators', () => {
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

    it('generates correct ordinal message', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [
        createTransaction({ merchant: 'Jumbo' }),
        createTransaction({ merchant: 'Jumbo' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('3ra vez');
    });
  });

  describe('category_trend', () => {
    const gen = INSIGHT_GENERATORS.category_trend;

    it('requires 5+ transactions in category', () => {
      const tx = createTransaction({ category: 'Supermarket' });
      const history = Array(4).fill(createTransaction({ category: 'Supermarket' }));
      expect(gen.canGenerate(tx, history)).toBe(false);

      const history5 = Array(5).fill(createTransaction({ category: 'Supermarket' }));
      expect(gen.canGenerate(tx, history5)).toBe(true);
    });
  });

  describe('day_pattern', () => {
    const gen = INSIGHT_GENERATORS.day_pattern;

    it('triggers when 3+ same weekday', () => {
      const tx = createTransaction({ date: '2025-12-17' }); // Wednesday
      const history = [
        createTransaction({ date: '2025-12-10' }), // Wednesday
        createTransaction({ date: '2025-12-03' }), // Wednesday
        createTransaction({ date: '2025-11-26' }), // Wednesday
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });
  });

  describe('spending_velocity', () => {
    const gen = INSIGHT_GENERATORS.spending_velocity;

    it('requires at least 1 week of data', () => {
      const tx = createTransaction();
      const recentHistory = [createTransaction({ date: '2025-12-16' })];
      expect(gen.canGenerate(tx, recentHistory)).toBe(false);

      const olderHistory = [createTransaction({ date: '2025-12-01' })];
      expect(gen.canGenerate(tx, olderHistory)).toBe(true);
    });
  });

  describe('time_pattern', () => {
    const gen = INSIGHT_GENERATORS.time_pattern;

    it('triggers when 3+ same time range', () => {
      const tx = createTransaction({ time: '14:30' });
      const history = [
        createTransaction({ time: '14:00' }),
        createTransaction({ time: '15:00' }),
        createTransaction({ time: '14:45' }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger without time', () => {
      const tx = createTransaction({ time: undefined });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });
  });
});
```

---

## Technical Summary

This story implements **pattern detection** - insights that require transaction history. These generators identify trends and patterns the user wouldn't notice.

**Generator Categories:**
| Generator | Category | Minimum Data | Purpose |
|-----------|----------|--------------|---------|
| `merchant_frequency` | ACTIONABLE | 2+ visits | Track repeat visits |
| `category_trend` | ACTIONABLE/CELEBRATORY | 5+ in category | Show spending changes |
| `day_pattern` | QUIRKY_FIRST | 3+ same day | Identify shopping habits |
| `spending_velocity` | ACTIONABLE/CELEBRATORY | 1 week | Weekly pace tracking |
| `time_pattern` | QUIRKY_FIRST | 3+ same time | Identify time preferences |

**Performance Optimization:**
- Precomputed aggregates stored in localStorage
- Aggregates refreshed on app load and after saves
- O(1) lookups for merchant visits and category totals

---

## Project Structure Notes

**Files to modify:**
- `src/utils/insightGenerators.ts` - Add pattern detection generators
- `src/services/insightEngineService.ts` - Add aggregate computation

**Files to create:**
- Additional tests in `tests/unit/utils/insightGenerators.test.ts`

---

## Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] 5 pattern detection generators implemented
- [ ] Precomputed aggregates working
- [ ] All generators have minimum data requirements
- [ ] All messages in Spanish (Chilean locale)
- [ ] Unit tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-17 | 1.0 | Story created from architecture (replaces Monthly Summary View) |
