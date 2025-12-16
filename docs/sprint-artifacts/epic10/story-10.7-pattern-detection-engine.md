# Story 10.7: Pattern Detection Engine

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 3
**Dependencies:** Story 10.1 (Insight Engine Core)

---

## User Story

As a **user**,
I want **the app to detect my spending patterns automatically**,
So that **I can understand when and how I spend without manually analyzing data**.

---

## Acceptance Criteria

- [ ] **AC #1:** System detects time-of-day patterns (morning/afternoon/evening/night)
- [ ] **AC #2:** System detects day-of-week patterns (weekday vs weekend)
- [ ] **AC #3:** System detects spending velocity changes (acceleration/deceleration)
- [ ] **AC #4:** Patterns require minimum 20 data points before generating insights
- [ ] **AC #5:** Pattern insights integrate with existing Insight Engine
- [ ] **AC #6:** `day_pattern` insight: "Gastas 3x más los fines de semana"
- [ ] **AC #7:** `time_pattern` insight: "Compras de noche cuestan 25% más"
- [ ] **AC #8:** Pattern detection completes in <500ms for typical data

---

## Tasks / Subtasks

### Task 1: Create Pattern Detection Service (1h)
- [ ] Create `src/services/patternDetection.ts`
- [ ] Define pattern interfaces:
  ```typescript
  type PatternType = 'time_of_day' | 'day_of_week' | 'velocity';

  interface Pattern {
    type: PatternType;
    confidence: number;
    dataPoints: number;
    metadata: Record<string, any>;
  }

  interface TimeOfDayPattern extends Pattern {
    type: 'time_of_day';
    metadata: {
      peakPeriod: 'morning' | 'afternoon' | 'evening' | 'night';
      peakAverage: number;
      offPeakAverage: number;
      ratio: number;
    };
  }

  interface DayOfWeekPattern extends Pattern {
    type: 'day_of_week';
    metadata: {
      weekdayAverage: number;
      weekendAverage: number;
      ratio: number;
    };
  }

  interface VelocityPattern extends Pattern {
    type: 'velocity';
    metadata: {
      currentWeekRate: number;
      previousWeekRate: number;
      changePercentage: number;
      direction: 'accelerating' | 'decelerating' | 'stable';
    };
  }
  ```

### Task 2: Implement Time-of-Day Pattern Detection (0.5h)
- [ ] Define time periods:
  - Morning: 6am - 12pm
  - Afternoon: 12pm - 6pm
  - Evening: 6pm - 9pm
  - Night: 9pm - 6am
- [ ] Group transactions by time period
- [ ] Calculate average spend per period
- [ ] Detect if one period is significantly higher (>25% more)
- [ ] Generate `time_pattern` insight when pattern found

**Example:**
```typescript
// If night spending average is $15,000 and day average is $12,000
// Ratio: 15000/12000 = 1.25 (25% more)
// Insight: "Compras de noche cuestan 25% más que el promedio"
```

### Task 3: Implement Day-of-Week Pattern Detection (0.5h)
- [ ] Classify days:
  - Weekday: Monday - Friday
  - Weekend: Saturday - Sunday
- [ ] Calculate average daily spend for each group
- [ ] Detect if weekend spending is significantly different (>50% more)
- [ ] Generate `day_pattern` insight when pattern found

**Example:**
```typescript
// Weekday average: $10,000/day
// Weekend average: $30,000/day
// Ratio: 30000/10000 = 3x
// Insight: "Gastas 3x más los fines de semana"
```

### Task 4: Implement Velocity Detection (0.5h)
- [ ] Calculate spending rate ($ per day) for current week
- [ ] Compare to previous week's rate
- [ ] Detect significant changes (>20% difference)
- [ ] Generate velocity insight when pattern found

**Example:**
```typescript
// Last week: $70,000 / 7 days = $10,000/day
// This week (5 days): $75,000 / 5 days = $15,000/day
// Change: +50%
// Insight: "Esta semana estás gastando 50% más rápido"
```

### Task 5: Integrate with Insight Engine (0.5h)
- [ ] Add pattern types to InsightEngine
- [ ] Create insight generators for each pattern type:
  - `generateDayPatternInsight(pattern)`
  - `generateTimePatternInsight(pattern)`
  - `generateVelocityInsight(pattern)`
- [ ] Set appropriate priorities (patterns are informational, medium priority)
- [ ] Respect minimum data points requirement (20)

### Task 6: Add Pattern Insights to Translations (0.25h)
- [ ] Add to `src/utils/translations.ts`:
  ```typescript
  // English
  insightDayPattern: 'You spend {ratio}x more on weekends',
  insightTimePatternMorning: 'Your morning purchases cost {percentage}% more than average',
  insightTimePatternNight: 'Your night purchases cost {percentage}% more than average',
  insightVelocityUp: 'You\'re spending {percentage}% faster this week',
  insightVelocityDown: 'You\'re spending {percentage}% slower this week',

  // Spanish
  insightDayPattern: 'Gastas {ratio}x más los fines de semana',
  insightTimePatternMorning: 'Tus compras de mañana cuestan {percentage}% más',
  insightTimePatternNight: 'Tus compras de noche cuestan {percentage}% más',
  insightVelocityUp: 'Esta semana estás gastando {percentage}% más rápido',
  insightVelocityDown: 'Esta semana estás gastando {percentage}% más lento',
  ```

### Task 7: Testing (0.5h)
- [ ] Unit tests for time-of-day detection
- [ ] Unit tests for day-of-week detection
- [ ] Unit tests for velocity detection
- [ ] Test minimum data point requirement
- [ ] Test edge cases: insufficient data, no patterns found
- [ ] Performance test: <500ms for 1000 transactions

---

## Technical Summary

The Pattern Detection Engine adds two deferred insight types (`day_pattern` and `time_pattern`) plus velocity detection. These provide deeper behavioral insights that require more data points to generate reliably.

**Design Principles:**
1. **Data-driven:** Only show patterns with statistical significance
2. **Minimum threshold:** 20 data points prevents spurious patterns
3. **Neutral framing:** Informational, not judgmental
4. **Configurable:** Thresholds can be adjusted based on user feedback

**Pattern Priority in Insight Engine:**
| Priority | Type | Threshold |
|----------|------|-----------|
| 7 | day_pattern | Weekend ratio >= 2x |
| 6 | time_pattern | Period ratio >= 1.25x |
| 5 | velocity | Week change >= 20% |

---

## Project Structure Notes

- **Files to create:**
  - `src/services/patternDetection.ts`
  - `src/services/patternDetection.test.ts`

- **Files to modify:**
  - `src/services/insightEngine.ts` - Integrate pattern insights
  - `src/utils/translations.ts` - Add pattern strings

- **Expected test locations:**
  - `tests/unit/services/patternDetection.test.ts`

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 10.1 (Insight Engine Core)

---

## Key Code References

**From habits loops.md - Pattern Detection:**
```typescript
type InsightType =
  | 'frequency'
  | 'merchant_concentration'
  | 'day_pattern'        // Deferred - now implementing
  | 'time_pattern'       // Deferred - now implementing
  | 'category_growth'
  | 'improvement'
  | 'milestone';
```

**Pattern Detection Algorithm:**
```typescript
// src/services/patternDetection.ts
export class PatternDetectionService {
  private readonly MIN_DATA_POINTS = 20;

  detectTimeOfDayPattern(transactions: Transaction[]): TimeOfDayPattern | null {
    if (transactions.length < this.MIN_DATA_POINTS) return null;

    const periods = this.groupByTimeOfDay(transactions);
    const averages = this.calculatePeriodAverages(periods);

    // Find peak period
    const peakPeriod = this.findPeakPeriod(averages);
    const offPeakAverage = this.calculateOffPeakAverage(averages, peakPeriod);

    const ratio = averages[peakPeriod] / offPeakAverage;

    if (ratio < 1.25) return null; // Not significant

    return {
      type: 'time_of_day',
      confidence: Math.min(ratio / 2, 1), // Higher ratio = higher confidence
      dataPoints: transactions.length,
      metadata: {
        peakPeriod,
        peakAverage: averages[peakPeriod],
        offPeakAverage,
        ratio
      }
    };
  }

  detectDayOfWeekPattern(transactions: Transaction[]): DayOfWeekPattern | null {
    if (transactions.length < this.MIN_DATA_POINTS) return null;

    const { weekday, weekend } = this.groupByDayType(transactions);

    // Calculate average daily spend
    const weekdayAvg = this.averageDailySpend(weekday, 5);
    const weekendAvg = this.averageDailySpend(weekend, 2);

    const ratio = weekendAvg / weekdayAvg;

    if (ratio < 1.5) return null; // Not significant (need 50% more)

    return {
      type: 'day_of_week',
      confidence: Math.min(ratio / 4, 1),
      dataPoints: transactions.length,
      metadata: {
        weekdayAverage: weekdayAvg,
        weekendAverage: weekendAvg,
        ratio: Math.round(ratio * 10) / 10
      }
    };
  }

  detectVelocityPattern(transactions: Transaction[]): VelocityPattern | null {
    const thisWeek = this.getTransactionsThisWeek(transactions);
    const lastWeek = this.getTransactionsLastWeek(transactions);

    if (thisWeek.length < 3 || lastWeek.length < 5) return null;

    const currentRate = this.calculateDailyRate(thisWeek);
    const previousRate = this.calculateDailyRate(lastWeek);

    const changePercentage = ((currentRate - previousRate) / previousRate) * 100;

    if (Math.abs(changePercentage) < 20) return null; // Not significant

    return {
      type: 'velocity',
      confidence: Math.min(Math.abs(changePercentage) / 100, 1),
      dataPoints: thisWeek.length + lastWeek.length,
      metadata: {
        currentWeekRate: currentRate,
        previousWeekRate: previousRate,
        changePercentage: Math.round(changePercentage),
        direction: changePercentage > 0 ? 'accelerating' : 'decelerating'
      }
    };
  }
}
```

---

## Statistical Thresholds

| Pattern | Threshold | Rationale |
|---------|-----------|-----------|
| Time-of-Day | 25% higher | Noticeable but not extreme |
| Day-of-Week | 50% higher | 2x is common weekend behavior |
| Velocity | 20% change | Significant behavioral shift |

These thresholds can be adjusted based on user feedback. Too sensitive = too many insights. Too conservative = missed patterns.

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR39-FR42
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 3.1 Insights

---

## Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Time-of-day detection working
- [ ] Day-of-week detection working
- [ ] Velocity detection working
- [ ] Minimum data points enforced
- [ ] Integrated with Insight Engine
- [ ] <500ms performance verified
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
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
