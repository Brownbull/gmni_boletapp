# Story 10.5 Context: Selection Algorithm + Sprinkle Distribution

**Purpose:** Context document for implementing the insight selection algorithm.
**Architecture:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Updated:** 2025-12-17 (Architecture-Aligned)

---

## Target Files

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/services/insightEngineService.ts` | Add selection functions |
| Create | `tests/unit/services/insightSelection.test.ts` | Selection algorithm tests |

---

## Selection Algorithm Overview

```
Candidates → Filter by cooldown → Get priority order → Group by category → Return top
```

1. **Filter by cooldown**: Remove insights shown in last 7 days
2. **Get priority order**: Based on phase + sprinkle counter
3. **Group by category**: QUIRKY_FIRST, CELEBRATORY, ACTIONABLE
4. **Return top**: Highest priority from highest-priority category

---

## Priority Order Function (ADR-017)

```typescript
// src/services/insightEngineService.ts

import { InsightCategory, UserPhase } from '../types/insight';

/**
 * Returns insight category priority order based on phase and sprinkle logic.
 *
 * ADR-017 Phase-Based Priority System:
 * - WEEK_1: 100% Quirky First
 * - WEEKS_2_3: 66% Celebratory / 33% Actionable (same weekday/weekend)
 * - MATURE Weekday: 66% Actionable / 33% Celebratory
 * - MATURE Weekend: 66% Celebratory / 33% Actionable
 *
 * 33/66 Sprinkle: Every 3rd scan gets the "minority" type.
 */
export function getInsightPriority(
  phase: UserPhase,
  scanCounter: number,
  isWeekend: boolean
): InsightCategory[] {
  if (phase === 'WEEK_1') {
    return ['QUIRKY_FIRST'];
  }

  if (phase === 'WEEKS_2_3') {
    // Same pattern weekday and weekend during weeks 2-3
    return scanCounter % 3 === 0
      ? ['ACTIONABLE', 'CELEBRATORY', 'QUIRKY_FIRST']  // 33% sprinkle
      : ['CELEBRATORY', 'ACTIONABLE', 'QUIRKY_FIRST']; // 66% primary
  }

  // MATURE phase - weekday/weekend differentiation
  if (isWeekend) {
    return scanCounter % 3 === 0
      ? ['ACTIONABLE', 'CELEBRATORY', 'QUIRKY_FIRST']  // 33% sprinkle
      : ['CELEBRATORY', 'ACTIONABLE', 'QUIRKY_FIRST']; // 66% primary
  } else {
    return scanCounter % 3 === 0
      ? ['CELEBRATORY', 'ACTIONABLE', 'QUIRKY_FIRST']  // 33% sprinkle
      : ['ACTIONABLE', 'CELEBRATORY', 'QUIRKY_FIRST']; // 66% primary
  }
}

/**
 * Checks if today is a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
```

---

## Selection Algorithm Implementation

```typescript
import {
  Insight,
  InsightRecord,
  UserInsightProfile,
  LocalInsightCache,
  InsightCategory
} from '../types/insight';

const COOLDOWN_DAYS = 7;

/**
 * Selects the best insight from candidates using phase-based priority.
 *
 * Algorithm:
 * 1. Filter out insights on cooldown
 * 2. Get priority order for current phase
 * 3. Group candidates by category
 * 4. Return highest priority candidate, or null for fallback
 */
export function selectInsight(
  candidates: Insight[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Insight | null {
  // Step 1: Filter by cooldown
  const available = candidates.filter(
    c => !checkCooldown(c.id, profile.recentInsights)
  );

  if (available.length === 0) {
    return null; // Caller should use fallback
  }

  // Step 2: Get priority order
  const phase = calculateUserPhase(profile);
  const scanCounter = isWeekend()
    ? cache.weekendScanCount
    : cache.weekdayScanCount;
  const priorityOrder = getInsightPriority(phase, scanCounter, isWeekend());

  // Step 3: Group by category
  const byCategory = new Map<InsightCategory, Insight[]>();
  for (const insight of available) {
    const existing = byCategory.get(insight.category) || [];
    existing.push(insight);
    byCategory.set(insight.category, existing);
  }

  // Step 4: Return highest priority
  for (const category of priorityOrder) {
    const categoryInsights = byCategory.get(category);
    if (categoryInsights && categoryInsights.length > 0) {
      // Sort by priority within category (higher = better)
      categoryInsights.sort((a, b) => b.priority - a.priority);
      return categoryInsights[0];
    }
  }

  // Fallback to any available insight
  return available[0];
}

/**
 * Checks if an insight is on cooldown (shown in last 7 days).
 */
export function checkCooldown(
  insightId: string,
  recentInsights: InsightRecord[]
): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COOLDOWN_DAYS);

  return recentInsights.some(
    record =>
      record.insightId === insightId &&
      record.shownAt.toDate() > cutoff
  );
}
```

---

## Counter Management

```typescript
/**
 * Increments the appropriate scan counter and resets if week changed.
 */
export function incrementScanCounter(cache: LocalInsightCache): LocalInsightCache {
  const today = new Date().toISOString().split('T')[0];
  const lastReset = cache.lastCounterReset;

  // Check if we need to reset (new week)
  const lastResetDate = new Date(lastReset);
  const todayDate = new Date(today);
  const daysSinceReset = Math.floor(
    (todayDate.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newCache = { ...cache };

  if (daysSinceReset >= 7) {
    // Reset counters
    newCache.weekdayScanCount = 0;
    newCache.weekendScanCount = 0;
    newCache.lastCounterReset = today;
  }

  // Increment appropriate counter
  if (isWeekend()) {
    newCache.weekendScanCount++;
  } else {
    newCache.weekdayScanCount++;
  }

  return newCache;
}
```

---

## Phase-Based Priority Reference Table

| Phase | Weekday Priority | Weekend Priority |
|-------|------------------|------------------|
| `WEEK_1` | `[QUIRKY_FIRST]` | `[QUIRKY_FIRST]` |
| `WEEKS_2_3` (66%) | `[CELEBRATORY, ACTIONABLE, QUIRKY]` | `[CELEBRATORY, ACTIONABLE, QUIRKY]` |
| `WEEKS_2_3` (33%) | `[ACTIONABLE, CELEBRATORY, QUIRKY]` | `[ACTIONABLE, CELEBRATORY, QUIRKY]` |
| `MATURE` (66%) | `[ACTIONABLE, CELEBRATORY, QUIRKY]` | `[CELEBRATORY, ACTIONABLE, QUIRKY]` |
| `MATURE` (33%) | `[CELEBRATORY, ACTIONABLE, QUIRKY]` | `[ACTIONABLE, CELEBRATORY, QUIRKY]` |

---

## 33/66 Sprinkle Logic

The "sprinkle" ensures variety:

```
Scan 1 → 66% (primary)
Scan 2 → 66% (primary)
Scan 3 → 33% (minority)  ← sprinkle!
Scan 4 → 66% (primary)
Scan 5 → 66% (primary)
Scan 6 → 33% (minority)  ← sprinkle!
...
```

**Formula:** `scanCounter % 3 === 0` triggers the minority type.

---

## Cooldown Logic

- **Purpose:** Prevent showing the same insight type repeatedly
- **Duration:** 7 days
- **Tracking:** `recentInsights[]` in UserInsightProfile (max 30 entries)
- **Check:** `insightId` matches AND `shownAt` is within 7 days

---

## localStorage Cache Structure

```typescript
interface LocalInsightCache {
  weekdayScanCount: number;      // For sprinkle calculation
  weekendScanCount: number;      // Separate counter for weekends
  lastCounterReset: string;      // ISO date for weekly reset
  silencedUntil: string | null;  // For batch mode silence
  precomputedAggregates?: {...}; // Optional performance cache
}
```

**Key:** `boletapp_insight_cache`

---

## Unit Tests

```typescript
// tests/unit/services/insightSelection.test.ts

import { describe, it, expect, vi } from 'vitest';
import {
  getInsightPriority,
  selectInsight,
  checkCooldown,
  incrementScanCounter,
  isWeekend
} from '../../../src/services/insightEngineService';

describe('getInsightPriority', () => {
  describe('WEEK_1 phase', () => {
    it('always returns QUIRKY_FIRST only', () => {
      expect(getInsightPriority('WEEK_1', 0, false)).toEqual(['QUIRKY_FIRST']);
      expect(getInsightPriority('WEEK_1', 1, true)).toEqual(['QUIRKY_FIRST']);
      expect(getInsightPriority('WEEK_1', 99, false)).toEqual(['QUIRKY_FIRST']);
    });
  });

  describe('WEEKS_2_3 phase', () => {
    it('returns CELEBRATORY first on non-sprinkle scans', () => {
      const result = getInsightPriority('WEEKS_2_3', 1, false);
      expect(result[0]).toBe('CELEBRATORY');
    });

    it('returns ACTIONABLE first on sprinkle scans (every 3rd)', () => {
      const result = getInsightPriority('WEEKS_2_3', 3, false);
      expect(result[0]).toBe('ACTIONABLE');
    });
  });

  describe('MATURE phase', () => {
    it('weekday: returns ACTIONABLE first on non-sprinkle', () => {
      const result = getInsightPriority('MATURE', 1, false);
      expect(result[0]).toBe('ACTIONABLE');
    });

    it('weekday: returns CELEBRATORY first on sprinkle (every 3rd)', () => {
      const result = getInsightPriority('MATURE', 3, false);
      expect(result[0]).toBe('CELEBRATORY');
    });

    it('weekend: returns CELEBRATORY first on non-sprinkle', () => {
      const result = getInsightPriority('MATURE', 1, true);
      expect(result[0]).toBe('CELEBRATORY');
    });

    it('weekend: returns ACTIONABLE first on sprinkle (every 3rd)', () => {
      const result = getInsightPriority('MATURE', 3, true);
      expect(result[0]).toBe('ACTIONABLE');
    });
  });
});

describe('checkCooldown', () => {
  it('returns false for insight not in recent list', () => {
    expect(checkCooldown('new_insight', [])).toBe(false);
  });

  it('returns true for insight shown within 7 days', () => {
    const recent = [{
      insightId: 'test_insight',
      shownAt: { toDate: () => new Date() },
    }];
    expect(checkCooldown('test_insight', recent as any)).toBe(true);
  });

  it('returns false for insight shown over 7 days ago', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    const recent = [{
      insightId: 'test_insight',
      shownAt: { toDate: () => oldDate },
    }];
    expect(checkCooldown('test_insight', recent as any)).toBe(false);
  });
});

describe('incrementScanCounter', () => {
  it('increments weekday counter on weekday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-17')); // Wednesday

    const cache = {
      weekdayScanCount: 5,
      weekendScanCount: 2,
      lastCounterReset: '2025-12-15',
      silencedUntil: null,
    };

    const result = incrementScanCounter(cache);
    expect(result.weekdayScanCount).toBe(6);
    expect(result.weekendScanCount).toBe(2);

    vi.useRealTimers();
  });

  it('resets counters after 7 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-25'));

    const cache = {
      weekdayScanCount: 10,
      weekendScanCount: 5,
      lastCounterReset: '2025-12-15',
      silencedUntil: null,
    };

    const result = incrementScanCounter(cache);
    expect(result.weekdayScanCount).toBe(1);
    expect(result.weekendScanCount).toBe(0);
    expect(result.lastCounterReset).toBe('2025-12-25');

    vi.useRealTimers();
  });
});
```

---

## Dependencies

**Requires from previous stories:**
- Story 10.2: `calculateUserPhase()` function
- Story 10.3: Transaction-intrinsic insight generators (QUIRKY_FIRST)
- Story 10.4: Pattern detection generators (CELEBRATORY, ACTIONABLE)

---

## Integration with generateInsightForTransaction

```typescript
export async function generateInsightForTransaction(
  transaction: Transaction,
  allTransactions: Transaction[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Promise<Insight | null> {
  // 1. Generate all candidate insights (Stories 10.3, 10.4)
  const candidates = generateAllCandidates(transaction, allTransactions);

  // 2. Select best insight (THIS STORY)
  const selected = selectInsight(candidates, profile, cache);

  // 3. Return selected or fallback
  return selected || getFallbackInsight();
}
```

---

## Key Differences from Old PRD

| Old (PRD) | New (Architecture) |
|-----------|-------------------|
| Analytics Insight Cards (UI) | Selection Algorithm + Sprinkle (Logic) |
| Confidence scoring | Phase-based priority |
| No variety mechanism | 33/66 sprinkle distribution |
| InsightCardsContainer | Moved to future story |
