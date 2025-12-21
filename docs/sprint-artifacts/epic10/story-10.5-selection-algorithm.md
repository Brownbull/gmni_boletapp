# Story 10.5: Selection Algorithm + Sprinkle Distribution

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** done
**Story Points:** 3
**Dependencies:** Stories 10.3 (Transaction-Intrinsic), 10.4 (Pattern Detection)

---

## User Story

As a **user**,
I want **variety in the insights I see**,
So that **I don't get bored seeing the same type of insight every time**.

---

## Architecture Reference

**Architecture Document:** [architecture-epic10-insight-engine.md](../../planning/architecture-epic10-insight-engine.md)
**Key ADRs:** ADR-017 (Phase-Based Priority System)

---

## Acceptance Criteria

- [x] **AC #1:** `selectInsight()` filters candidates by cooldown (1-week no-repeat)
- [x] **AC #2:** Selection respects phase-based priority order
- [x] **AC #3:** 33/66 sprinkle distribution works (every 3rd scan gets minority type)
- [x] **AC #4:** WEEK_1 phase returns only QUIRKY_FIRST insights
- [x] **AC #5:** WEEKS_2_3 phase returns 66% CELEBRATORY / 33% ACTIONABLE
- [x] **AC #6:** MATURE weekday returns 66% ACTIONABLE / 33% CELEBRATORY
- [x] **AC #7:** MATURE weekend returns 66% CELEBRATORY / 33% ACTIONABLE
- [x] **AC #8:** Scan counters reset weekly (localStorage)
- [x] **AC #9:** When no candidates pass filters, fallback insight returned

---

## Tasks / Subtasks

### [x] Task 1: Implement Priority Order Function (0.5h)

In `src/services/insightEngineService.ts`:

```typescript
import { InsightCategory, UserPhase, LocalInsightCache } from '../types/insight';

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

### [x] Task 2: Implement Selection Algorithm (1h)

```typescript
import {
  Insight,
  InsightRecord,
  UserInsightProfile,
  LocalInsightCache
} from '../types/insight';

const COOLDOWN_DAYS = 7;

/**
 * Selects the best insight from candidates using phase-based priority.
 *
 * Algorithm:
 * 1. Filter out insights on cooldown
 * 2. Get priority order for current phase
 * 3. Group candidates by category
 * 4. Return highest priority candidate, or fallback
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

### [x] Task 3: Implement Counter Management (0.5h)

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

### [x] Task 4: Unit Tests (1h)

Add to `tests/unit/services/insightEngineService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      shownAt: { toDate: () => new Date() }, // Today
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
      lastCounterReset: '2025-12-15', // 10 days ago
      silencedUntil: null,
    };

    const result = incrementScanCounter(cache);
    expect(result.weekdayScanCount).toBe(1); // Reset + increment
    expect(result.weekendScanCount).toBe(0);
    expect(result.lastCounterReset).toBe('2025-12-25');

    vi.useRealTimers();
  });
});
```

---

## Technical Summary

This story implements the **heart of the Insight Engine** - the selection algorithm that determines which insight to show. It's based on ADR-017 Phase-Based Priority System.

**Key Concepts:**

1. **Phase-Based Priority**: User's phase determines which insight categories are preferred
2. **33/66 Sprinkle**: Every 3rd scan gets the "minority" type for variety
3. **Cooldown**: Same insight type can't be shown twice in 7 days
4. **Weekly Reset**: Scan counters reset every 7 days

**Selection Flow:**
```
Candidates → Filter by cooldown → Get priority order → Group by category → Return top
```

---

## Project Structure Notes

**Files to modify:**
- `src/services/insightEngineService.ts` - Add selection functions

**Files to modify (tests):**
- `tests/unit/services/insightEngineService.test.ts` - Added 65+ new tests for selection algorithm

**Dependencies:**
- Story 10.3: Transaction-intrinsic generators provide QUIRKY_FIRST candidates
- Story 10.4: Pattern detection generators provide CELEBRATORY/ACTIONABLE candidates

---

## Definition of Done

- [x] All 9 acceptance criteria verified
- [x] Selection algorithm produces correct results for all phase/counter combinations
- [x] Cooldown filtering works correctly
- [x] Counter reset works after 7 days
- [x] Unit tests passing with >90% coverage
- [x] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Implemented the complete selection algorithm for the Insight Engine per ADR-017 Phase-Based Priority System:

1. **getInsightPriority()**: Returns category priority order based on user phase and sprinkle logic
   - WEEK_1: 100% QUIRKY_FIRST
   - WEEKS_2_3: 66/33 CELEBRATORY/ACTIONABLE (weekday and weekend same)
   - MATURE weekday: 66/33 ACTIONABLE/CELEBRATORY
   - MATURE weekend: 66/33 CELEBRATORY/ACTIONABLE
   - 33% sprinkle on every 3rd scan (scanCounter % 3 === 0)

2. **isWeekend()**: Helper to check if date is Saturday/Sunday

3. **selectInsight()**: Full selection algorithm with:
   - Cooldown filtering (1-week no-repeat)
   - Phase-based category priority
   - Grouping by category
   - Priority sorting within category
   - Fallback to any available if preferred empty

4. **incrementScanCounter()**: Enhanced to check weekly reset (7+ days since last reset)

### Files Modified
- `src/services/insightEngineService.ts` - Added `getInsightPriority()`, `isWeekend()`, enhanced `selectInsight()` and `incrementScanCounter()`
- `tests/unit/services/insightEngineService.test.ts` - Added 50+ new tests for all ACs

### Test Results
- **Unit Tests**: 1,226 passing (35 test files)
- **Integration Tests**: 328 passing (24 test files)
- **Build**: Successful (949.94 KB bundle)

---

## Review Notes

**Code Review Date:** 2025-12-19
**Reviewer:** Claude Opus 4.5 (Atlas-Enhanced)

### Summary
All 9 acceptance criteria verified and implemented correctly. Selection algorithm follows ADR-017 Phase-Based Priority System exactly as documented.

### Issues Found & Fixed
- **M1:** Updated stale comment in `generateInsightForTransaction()` (line 72)
- **M2:** Corrected story documentation - tests are in `insightEngineService.test.ts` not separate file
- **M3:** Added 2 integration tests for full selection path with phase + category + priority
- **L3:** Added proper JSDOC to `maybeResetCounters()` function
- **L4:** Added comment clarifying `isWeekend()` result caching

### Architecture Validation (Atlas)
- ✅ ADR-017 compliance verified
- ✅ No workflow chain impacts
- ✅ Testing patterns followed (defensive Timestamp handling)

### Test Results Post-Review
- **Unit Tests:** 1,228 passing (+2 new tests)
- **Build:** Successful (949.94 KB bundle)

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted as "Analytics Insight Cards" |
| 2025-12-17 | 2.0 | **Retrofitted** - Renamed to "Selection Algorithm + Sprinkle Distribution" per architecture. Analytics cards moved to future story. |
| 2025-12-19 | 2.1 | **Implementation Complete** - All 9 ACs verified, 50+ tests added, ready for code review. |
| 2025-12-19 | 2.2 | **Code Review Passed** - Atlas-enhanced review, 5 issues fixed, 2 new tests added, status → done. |
