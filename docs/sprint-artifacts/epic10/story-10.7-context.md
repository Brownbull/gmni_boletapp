# Story 10.7 Context: Pattern Detection Engine

**Purpose:** This document aggregates all relevant codebase context for implementing the Pattern Detection Engine.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/services/patternDetection.ts` | Pattern detection service |
| `tests/unit/services/patternDetection.test.ts` | Unit tests |

---

## Files to Modify

| File | Purpose |
|------|---------|
| `src/services/insightEngine.ts` | Integrate pattern insights |
| `src/types/insight.ts` | Add pattern insight types |
| `src/utils/translations.ts` | Add pattern strings |

---

## Transaction Date/Time Fields

```
Location: /home/khujta/projects/bmad/boletapp/src/types/transaction.ts (125 lines)

Transaction interface (lines 80-110):

interface Transaction {
  id?: string;
  date: string;           // YYYY-MM-DD (required)
  time?: string;          // HH:mm (optional, v2.6.0+)
  merchant: string;
  alias?: string;
  category: StoreCategory;
  total: number;
  items: TransactionItem[];
  country?: string;
  city?: string;
  currency?: string;
  receiptType?: string;
  promptVersion?: string;
  createdAt?: any;
}

IMPORTANT: time field is OPTIONAL - pattern detection must handle
transactions without time values (legacy data).
```

---

## Existing Date Utilities

```
Location: /home/khujta/projects/bmad/boletapp/src/utils/date.ts (219 lines)

Available functions:
  getQuarterFromMonth(month: string): string - Lines 101-108
  getWeeksInMonth(month, locale) - Lines 138-172
  getQuartersInYear(year) - Lines 54-62

For pattern detection, need to add:
  - parseTime(timeStr: string): { hour: number; minute: number }
  - getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night'
  - getDayOfWeek(dateStr: string): number  // 0-6
  - isWeekend(dateStr: string): boolean
```

---

## Pattern Type Definitions

```typescript
// src/types/insight.ts (add to existing)

export type PatternType = 'time_of_day' | 'day_of_week' | 'velocity';

export interface Pattern {
  type: PatternType;
  confidence: number;   // 0-1
  dataPoints: number;   // Number of transactions analyzed
  metadata: Record<string, any>;
}

export interface TimeOfDayPattern extends Pattern {
  type: 'time_of_day';
  metadata: {
    peakPeriod: 'morning' | 'afternoon' | 'evening' | 'night';
    peakAverage: number;
    offPeakAverage: number;
    ratio: number;
  };
}

export interface DayOfWeekPattern extends Pattern {
  type: 'day_of_week';
  metadata: {
    weekdayAverage: number;
    weekendAverage: number;
    ratio: number;
  };
}

export interface VelocityPattern extends Pattern {
  type: 'velocity';
  metadata: {
    currentWeekRate: number;
    previousWeekRate: number;
    changePercentage: number;
    direction: 'accelerating' | 'decelerating' | 'stable';
  };
}
```

---

## Time Period Classification

```typescript
// Time periods for time-of-day pattern

const TIME_PERIODS = {
  morning: { start: 6, end: 12 },    // 6:00 AM - 11:59 AM
  afternoon: { start: 12, end: 18 }, // 12:00 PM - 5:59 PM
  evening: { start: 18, end: 21 },   // 6:00 PM - 8:59 PM
  night: { start: 21, end: 6 }       // 9:00 PM - 5:59 AM (wraps)
};

function getTimeOfDay(hour: number): keyof typeof TIME_PERIODS {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';  // 21-5
}

function parseTime(timeStr: string): number | null {
  if (!timeStr) return null;

  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  return hours;
}
```

---

## Pattern Detection Service

```typescript
// src/services/patternDetection.ts

import { Transaction } from '../types/transaction';
import {
  Pattern,
  TimeOfDayPattern,
  DayOfWeekPattern,
  VelocityPattern
} from '../types/insight';

const MIN_DATA_POINTS = 20;
const TIME_RATIO_THRESHOLD = 1.25;  // 25% higher
const DAY_RATIO_THRESHOLD = 1.5;    // 50% higher
const VELOCITY_THRESHOLD = 20;       // 20% change

export class PatternDetectionService {

  detectAllPatterns(transactions: Transaction[]): Pattern[] {
    const patterns: Pattern[] = [];

    const timePattern = this.detectTimeOfDayPattern(transactions);
    if (timePattern) patterns.push(timePattern);

    const dayPattern = this.detectDayOfWeekPattern(transactions);
    if (dayPattern) patterns.push(dayPattern);

    const velocityPattern = this.detectVelocityPattern(transactions);
    if (velocityPattern) patterns.push(velocityPattern);

    return patterns;
  }

  detectTimeOfDayPattern(transactions: Transaction[]): TimeOfDayPattern | null {
    // Filter to transactions with time data
    const withTime = transactions.filter(t => t.time);

    if (withTime.length < MIN_DATA_POINTS) return null;

    const periods = this.groupByTimeOfDay(withTime);
    const averages = this.calculatePeriodAverages(periods);

    // Find peak period
    const peakPeriod = this.findPeakPeriod(averages);
    const offPeakAverage = this.calculateOffPeakAverage(averages, peakPeriod);

    if (offPeakAverage === 0) return null;

    const ratio = averages[peakPeriod] / offPeakAverage;

    if (ratio < TIME_RATIO_THRESHOLD) return null;

    return {
      type: 'time_of_day',
      confidence: Math.min(ratio / 2, 1),
      dataPoints: withTime.length,
      metadata: {
        peakPeriod,
        peakAverage: averages[peakPeriod],
        offPeakAverage,
        ratio: Math.round(ratio * 100) / 100
      }
    };
  }

  detectDayOfWeekPattern(transactions: Transaction[]): DayOfWeekPattern | null {
    if (transactions.length < MIN_DATA_POINTS) return null;

    const { weekday, weekend } = this.groupByDayType(transactions);

    // Need transactions in both groups
    if (weekday.length < 5 || weekend.length < 2) return null;

    const weekdayAvg = this.averageDailySpend(weekday, 5);
    const weekendAvg = this.averageDailySpend(weekend, 2);

    if (weekdayAvg === 0) return null;

    const ratio = weekendAvg / weekdayAvg;

    if (ratio < DAY_RATIO_THRESHOLD) return null;

    return {
      type: 'day_of_week',
      confidence: Math.min(ratio / 4, 1),
      dataPoints: transactions.length,
      metadata: {
        weekdayAverage: Math.round(weekdayAvg),
        weekendAverage: Math.round(weekendAvg),
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

    if (previousRate === 0) return null;

    const changePercentage = ((currentRate - previousRate) / previousRate) * 100;

    if (Math.abs(changePercentage) < VELOCITY_THRESHOLD) return null;

    return {
      type: 'velocity',
      confidence: Math.min(Math.abs(changePercentage) / 100, 1),
      dataPoints: thisWeek.length + lastWeek.length,
      metadata: {
        currentWeekRate: Math.round(currentRate),
        previousWeekRate: Math.round(previousRate),
        changePercentage: Math.round(changePercentage),
        direction: changePercentage > 0 ? 'accelerating' : 'decelerating'
      }
    };
  }

  // Private helper methods...

  private groupByTimeOfDay(transactions: Transaction[]): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: []
    };

    for (const tx of transactions) {
      const hour = this.parseTimeHour(tx.time!);
      if (hour === null) continue;

      const period = this.getTimeOfDay(hour);
      groups[period].push(tx);
    }

    return groups;
  }

  private groupByDayType(transactions: Transaction[]): {
    weekday: Transaction[];
    weekend: Transaction[];
  } {
    const weekday: Transaction[] = [];
    const weekend: Transaction[] = [];

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const day = date.getDay();

      if (day === 0 || day === 6) {
        weekend.push(tx);
      } else {
        weekday.push(tx);
      }
    }

    return { weekday, weekend };
  }

  private getTransactionsThisWeek(transactions: Transaction[]): Transaction[] {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= weekStart && txDate <= now;
    });
  }

  private getTransactionsLastWeek(transactions: Transaction[]): Transaction[] {
    const now = new Date();
    const thisWeekStart = this.getWeekStart(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= lastWeekStart && txDate <= lastWeekEnd;
    });
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private calculateDailyRate(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;

    const total = transactions.reduce((sum, tx) => sum + tx.total, 0);
    const dates = new Set(transactions.map(tx => tx.date));
    const days = dates.size || 1;

    return total / days;
  }

  private parseTimeHour(timeStr: string): number | null {
    if (!timeStr) return null;
    const [hours] = timeStr.split(':').map(Number);
    return isNaN(hours) ? null : hours;
  }

  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'night';
  }

  private calculatePeriodAverages(
    periods: Record<string, Transaction[]>
  ): Record<string, number> {
    const averages: Record<string, number> = {};

    for (const [period, txs] of Object.entries(periods)) {
      if (txs.length === 0) {
        averages[period] = 0;
      } else {
        const total = txs.reduce((sum, tx) => sum + tx.total, 0);
        averages[period] = total / txs.length;
      }
    }

    return averages;
  }

  private findPeakPeriod(averages: Record<string, number>): string {
    let peak = 'morning';
    let maxAvg = 0;

    for (const [period, avg] of Object.entries(averages)) {
      if (avg > maxAvg) {
        maxAvg = avg;
        peak = period;
      }
    }

    return peak;
  }

  private calculateOffPeakAverage(
    averages: Record<string, number>,
    peakPeriod: string
  ): number {
    const offPeakPeriods = Object.entries(averages)
      .filter(([period]) => period !== peakPeriod)
      .filter(([, avg]) => avg > 0);

    if (offPeakPeriods.length === 0) return 0;

    const total = offPeakPeriods.reduce((sum, [, avg]) => sum + avg, 0);
    return total / offPeakPeriods.length;
  }

  private averageDailySpend(transactions: Transaction[], expectedDays: number): number {
    const total = transactions.reduce((sum, tx) => sum + tx.total, 0);
    return total / expectedDays;
  }
}

// Export singleton instance
export const patternDetectionService = new PatternDetectionService();
```

---

## Integration with Insight Engine

```typescript
// src/services/insightEngine.ts (add pattern integration)

import { patternDetectionService } from './patternDetection';
import { translateStoreCategory } from '../utils/categoryTranslations';

// Add to InsightType
export type InsightType =
  | 'frequency'
  | 'merchant_concentration'
  | 'category_growth'
  | 'improvement'
  | 'milestone'
  | 'day_pattern'     // NEW
  | 'time_pattern';   // NEW

// Add pattern insight generators
function generatePatternInsights(
  transactions: Transaction[],
  locale: 'en' | 'es'
): Insight[] {
  const patterns = patternDetectionService.detectAllPatterns(transactions);
  const insights: Insight[] = [];

  for (const pattern of patterns) {
    const insight = patternToInsight(pattern, locale);
    if (insight) insights.push(insight);
  }

  return insights;
}

function patternToInsight(pattern: Pattern, locale: 'en' | 'es'): Insight | null {
  switch (pattern.type) {
    case 'day_of_week':
      return {
        type: 'day_pattern',
        message: locale === 'es'
          ? `Gastas ${pattern.metadata.ratio}x más los fines de semana`
          : `You spend ${pattern.metadata.ratio}x more on weekends`,
        messageKey: 'insightDayPattern',
        emoji: '📅',
        confidence: pattern.confidence,
        priority: 7,
        dataPoints: pattern.dataPoints,
        metadata: pattern.metadata
      };

    case 'time_of_day':
      const periodName = getPeriodName(pattern.metadata.peakPeriod, locale);
      const percentage = Math.round((pattern.metadata.ratio - 1) * 100);
      return {
        type: 'time_pattern',
        message: locale === 'es'
          ? `Tus compras de ${periodName} cuestan ${percentage}% más`
          : `Your ${periodName} purchases cost ${percentage}% more`,
        messageKey: 'insightTimePattern',
        emoji: '🕐',
        confidence: pattern.confidence,
        priority: 6,
        dataPoints: pattern.dataPoints,
        metadata: pattern.metadata
      };

    case 'velocity':
      const dir = pattern.metadata.direction;
      const change = Math.abs(pattern.metadata.changePercentage);
      return {
        type: dir === 'accelerating' ? 'velocity_up' : 'velocity_down',
        message: locale === 'es'
          ? `Esta semana estás gastando ${change}% ${dir === 'accelerating' ? 'más' : 'menos'} rápido`
          : `You're spending ${change}% ${dir === 'accelerating' ? 'faster' : 'slower'} this week`,
        messageKey: dir === 'accelerating' ? 'insightVelocityUp' : 'insightVelocityDown',
        emoji: dir === 'accelerating' ? '🚀' : '🐢',
        confidence: pattern.confidence,
        priority: 5,
        dataPoints: pattern.dataPoints,
        metadata: pattern.metadata
      };

    default:
      return null;
  }
}

function getPeriodName(period: string, locale: 'en' | 'es'): string {
  const names = {
    en: { morning: 'morning', afternoon: 'afternoon', evening: 'evening', night: 'night' },
    es: { morning: 'mañana', afternoon: 'tarde', evening: 'noche', night: 'noche' }
  };
  return names[locale][period] || period;
}
```

---

## Translation Strings to Add

```typescript
// src/utils/translations.ts

// English
insightDayPattern: 'You spend {ratio}x more on weekends',
insightTimePatternMorning: 'Your morning purchases cost {percentage}% more than average',
insightTimePatternAfternoon: 'Your afternoon purchases cost {percentage}% more than average',
insightTimePatternEvening: 'Your evening purchases cost {percentage}% more than average',
insightTimePatternNight: 'Your night purchases cost {percentage}% more than average',
insightVelocityUp: "You're spending {percentage}% faster this week",
insightVelocityDown: "You're spending {percentage}% slower this week",

// Spanish
insightDayPattern: 'Gastas {ratio}x más los fines de semana',
insightTimePatternMorning: 'Tus compras de mañana cuestan {percentage}% más',
insightTimePatternAfternoon: 'Tus compras de tarde cuestan {percentage}% más',
insightTimePatternEvening: 'Tus compras de noche cuestan {percentage}% más',
insightTimePatternNight: 'Tus compras de noche cuestan {percentage}% más',
insightVelocityUp: 'Esta semana estás gastando {percentage}% más rápido',
insightVelocityDown: 'Esta semana estás gastando {percentage}% más lento',
```

---

## Statistical Thresholds

| Pattern | Threshold | Rationale |
|---------|-----------|-----------|
| Time-of-Day | 25% higher | Noticeable but not extreme |
| Day-of-Week | 50% higher | 2x is common weekend behavior |
| Velocity | 20% change | Significant behavioral shift |
| Min Data Points | 20 | Statistical reliability |

These can be adjusted based on user feedback.

---

## Testing Considerations

```typescript
// tests/unit/services/patternDetection.test.ts

import { describe, it, expect } from 'vitest';
import { PatternDetectionService } from '../../../src/services/patternDetection';

describe('PatternDetectionService', () => {

  describe('detectTimeOfDayPattern', () => {
    it('returns null with insufficient data', () => {
      const service = new PatternDetectionService();
      const result = service.detectTimeOfDayPattern([]);
      expect(result).toBeNull();
    });

    it('detects evening peak pattern', () => {
      const service = new PatternDetectionService();
      const transactions = createMockTransactions({
        evening: { count: 15, avgAmount: 20000 },
        morning: { count: 10, avgAmount: 8000 }
      });

      const result = service.detectTimeOfDayPattern(transactions);

      expect(result).not.toBeNull();
      expect(result?.metadata.peakPeriod).toBe('evening');
      expect(result?.metadata.ratio).toBeGreaterThan(1.25);
    });

    it('handles transactions without time field', () => {
      const service = new PatternDetectionService();
      const transactions = [
        { date: '2025-01-01', total: 10000 }, // No time
        { date: '2025-01-02', time: '14:00', total: 15000 }
      ];

      // Should not throw
      const result = service.detectTimeOfDayPattern(transactions);
      expect(result).toBeNull(); // Not enough data
    });
  });

  describe('detectDayOfWeekPattern', () => {
    it('detects weekend spending pattern', () => {
      const service = new PatternDetectionService();
      const transactions = createWeekendHeavyTransactions();

      const result = service.detectDayOfWeekPattern(transactions);

      expect(result).not.toBeNull();
      expect(result?.metadata.ratio).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('detectVelocityPattern', () => {
    it('detects accelerating spending', () => {
      const service = new PatternDetectionService();
      const transactions = createAcceleratingTransactions();

      const result = service.detectVelocityPattern(transactions);

      expect(result).not.toBeNull();
      expect(result?.metadata.direction).toBe('accelerating');
    });

    it('detects decelerating spending', () => {
      const service = new PatternDetectionService();
      const transactions = createDeceleratingTransactions();

      const result = service.detectVelocityPattern(transactions);

      expect(result).not.toBeNull();
      expect(result?.metadata.direction).toBe('decelerating');
    });
  });

});

// Helper functions for test data generation
function createMockTransactions(config) { ... }
function createWeekendHeavyTransactions() { ... }
function createAcceleratingTransactions() { ... }
function createDeceleratingTransactions() { ... }
```

---

## Performance Target

- Pattern detection: <500ms for 1000 transactions
- Use early returns when minimum data points not met
- Cache computed values where appropriate
- Consider Web Worker for large datasets (future optimization)
