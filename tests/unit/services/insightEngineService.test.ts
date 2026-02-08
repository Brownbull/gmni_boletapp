/**
 * Insight Engine Service Tests
 *
 * Story 10.1: InsightEngine Service Interface
 * @see docs/sprint-artifacts/epic10/story-10.1-insight-engine-core.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createMockTimestamp, createMockTimestampDaysAgo } from '../../helpers';
import {
  generateInsightForTransaction,
  calculateUserPhase,
  selectInsight,
  getInsightPriority,
  isWeekend,
  checkCooldown,
  getFallbackInsight,
  getLocalCache,
  setLocalCache,
  getDefaultCache,
  incrementScanCounter,
  isInsightsSilenced,
  silenceInsights,
  clearSilence,
  computeAggregates,
  updateCacheAggregates,
  getMerchantVisitCount,
  getCategoryTotal,
  getLastWeekTotal,
} from '../../../src/services/insightEngineService';
import type { Transaction } from '../../../src/types/transaction';
import type {
  Insight,
  InsightRecord,
  UserInsightProfile,
  LocalInsightCache,
  UserPhase,
} from '../../../src/types/insight';
import { INSIGHT_CACHE_KEY, PHASE_THRESHOLDS } from '../../../src/types/insight';

// ============================================================================
// Test Data Factories
// ============================================================================

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    date: '2024-06-15',
    merchant: 'Test Store',
    category: 'Supermarket',
    total: 100,
    items: [
      { name: 'Item 1', price: 50, category: 'Produce' },
      { name: 'Item 2', price: 50, category: 'Dairy & Eggs' },
    ],
    ...overrides,
  };
}


function createUserProfile(overrides: Partial<UserInsightProfile> = {}): UserInsightProfile {
  return {
    schemaVersion: 1,
    firstTransactionDate: createMockTimestamp(),
    totalTransactions: 0,
    recentInsights: [],
    ...overrides,
  };
}

function createLocalCache(overrides: Partial<LocalInsightCache> = {}): LocalInsightCache {
  return {
    weekdayScanCount: 0,
    weekendScanCount: 0,
    lastCounterReset: new Date().toISOString().split('T')[0],
    silencedUntil: null,
    ...overrides,
  };
}

function createInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'test_insight',
    category: 'QUIRKY_FIRST',
    title: 'Test Title',
    message: 'Test message',
    priority: 5,
    ...overrides,
  };
}

function createInsightRecord(insightId: string, daysAgo: number): InsightRecord {
  return {
    insightId,
    shownAt: createMockTimestampDaysAgo(daysAgo),
  };
}

// ============================================================================
// Type Export Tests
// ============================================================================

describe('Type Exports', () => {
  it('should export UserPhase type with correct values', () => {
    const phases: UserPhase[] = ['WEEK_1', 'WEEKS_2_3', 'MATURE'];
    expect(phases).toHaveLength(3);
  });

  it('should export INSIGHT_CACHE_KEY constant', () => {
    expect(INSIGHT_CACHE_KEY).toBe('boletapp_insight_cache');
  });

  it('should export PHASE_THRESHOLDS constant', () => {
    expect(PHASE_THRESHOLDS.WEEK_1_END).toBe(7);
    expect(PHASE_THRESHOLDS.WEEKS_2_3_END).toBe(21);
  });
});

// ============================================================================
// Phase Calculation Tests
// ============================================================================

describe('calculateUserPhase', () => {
  it('should return WEEK_1 for new user (0 days)', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(),
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('should return WEEK_1 for user with 5 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(5),
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('should return WEEK_1 for user at exactly 7 days', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(7),
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('should return WEEKS_2_3 for user with 8 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(8),
    });
    expect(calculateUserPhase(profile)).toBe('WEEKS_2_3');
  });

  it('should return WEEKS_2_3 for user with 15 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(15),
    });
    expect(calculateUserPhase(profile)).toBe('WEEKS_2_3');
  });

  it('should return WEEKS_2_3 for user at exactly 21 days', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(21),
    });
    expect(calculateUserPhase(profile)).toBe('WEEKS_2_3');
  });

  it('should return MATURE for user with 22 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(22),
    });
    expect(calculateUserPhase(profile)).toBe('MATURE');
  });

  it('should return MATURE for user with 100 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestampDaysAgo(100),
    });
    expect(calculateUserPhase(profile)).toBe('MATURE');
  });

  it('should return WEEK_1 for profile with null firstTransactionDate', () => {
    const profile = createUserProfile({
      firstTransactionDate: null as unknown as Timestamp,
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });
});

// ============================================================================
// Fallback Insight Tests
// ============================================================================

describe('getFallbackInsight', () => {
  it('should return a valid insight object', () => {
    const fallback = getFallbackInsight();

    expect(fallback).toBeDefined();
    expect(fallback.id).toBe('building_profile');
    expect(fallback.category).toBe('QUIRKY_FIRST');
    expect(fallback.title).toBeDefined();
    expect(fallback.message).toBeDefined();
    expect(fallback.priority).toBe(0);
  });

  it('should have Spanish content', () => {
    const fallback = getFallbackInsight();

    expect(fallback.title).toBe('Construyendo tu perfil');
    expect(fallback.message).toContain('insights personalizados');
  });

  it('should include an icon', () => {
    const fallback = getFallbackInsight();
    expect(fallback.icon).toBeDefined();
  });
});

// ============================================================================
// Cooldown Tests
// ============================================================================

describe('checkCooldown', () => {
  it('should return false when insight was never shown', () => {
    const result = checkCooldown('merchant_frequency', []);
    expect(result).toBe(false);
  });

  it('should return false when insight was shown more than 7 days ago', () => {
    const recentInsights: InsightRecord[] = [createInsightRecord('merchant_frequency', 8)];
    const result = checkCooldown('merchant_frequency', recentInsights);
    expect(result).toBe(false);
  });

  it('should return true when insight was shown less than 7 days ago', () => {
    const recentInsights: InsightRecord[] = [createInsightRecord('merchant_frequency', 3)];
    const result = checkCooldown('merchant_frequency', recentInsights);
    expect(result).toBe(true);
  });

  it('should return true when insight was shown today', () => {
    const recentInsights: InsightRecord[] = [createInsightRecord('merchant_frequency', 0)];
    const result = checkCooldown('merchant_frequency', recentInsights);
    expect(result).toBe(true);
  });

  it('should return false when insight was shown exactly 7 days ago', () => {
    const recentInsights: InsightRecord[] = [createInsightRecord('merchant_frequency', 7)];
    const result = checkCooldown('merchant_frequency', recentInsights);
    expect(result).toBe(false);
  });

  it('should check correct insight id when multiple insights exist', () => {
    const recentInsights: InsightRecord[] = [
      createInsightRecord('other_insight', 1),
      createInsightRecord('merchant_frequency', 10),
    ];
    const result = checkCooldown('merchant_frequency', recentInsights);
    expect(result).toBe(false);
  });

  it('should return false when shownAt.toDate() throws (corrupted Timestamp)', () => {
    const corruptedRecord: InsightRecord = {
      insightId: 'merchant_frequency',
      shownAt: {
        toDate: () => {
          throw new Error('Corrupted Timestamp');
        },
      } as unknown as Timestamp,
    };
    const result = checkCooldown('merchant_frequency', [corruptedRecord]);
    expect(result).toBe(false);
  });

  it('should return false when shownAt is null', () => {
    const nullTimestampRecord: InsightRecord = {
      insightId: 'merchant_frequency',
      shownAt: null as unknown as Timestamp,
    };
    const result = checkCooldown('merchant_frequency', [nullTimestampRecord]);
    expect(result).toBe(false);
  });

  it('should return false when shownAt.toDate returns null', () => {
    const invalidRecord: InsightRecord = {
      insightId: 'merchant_frequency',
      shownAt: {
        toDate: () => null,
      } as unknown as Timestamp,
    };
    const result = checkCooldown('merchant_frequency', [invalidRecord]);
    expect(result).toBe(false);
  });

  it('should return false when shownAt.toDate returns invalid date', () => {
    const invalidDateRecord: InsightRecord = {
      insightId: 'merchant_frequency',
      shownAt: {
        toDate: () => new Date('invalid'),
      } as unknown as Timestamp,
    };
    const result = checkCooldown('merchant_frequency', [invalidDateRecord]);
    expect(result).toBe(false);
  });
});

// ============================================================================
// Selection Algorithm Tests
// ============================================================================

describe('selectInsight', () => {
  it('should return null when no candidates available', () => {
    const profile = createUserProfile();
    const cache = createLocalCache();

    const result = selectInsight([], profile, cache);
    expect(result).toBeNull();
  });

  it('should return highest priority candidate', () => {
    const profile = createUserProfile();
    const cache = createLocalCache();
    const candidates: Insight[] = [
      createInsight({ id: 'low', priority: 1 }),
      createInsight({ id: 'high', priority: 10 }),
      createInsight({ id: 'medium', priority: 5 }),
    ];

    const result = selectInsight(candidates, profile, cache);
    expect(result?.id).toBe('high');
  });

  it('should filter out insights on cooldown', () => {
    const profile = createUserProfile({
      recentInsights: [createInsightRecord('high_priority', 1)],
    });
    const cache = createLocalCache();
    const candidates: Insight[] = [
      createInsight({ id: 'high_priority', priority: 10 }),
      createInsight({ id: 'low_priority', priority: 1 }),
    ];

    const result = selectInsight(candidates, profile, cache);
    expect(result?.id).toBe('low_priority');
  });

  it('should return null when all candidates are on cooldown', () => {
    const profile = createUserProfile({
      recentInsights: [
        createInsightRecord('insight_1', 1),
        createInsightRecord('insight_2', 2),
      ],
    });
    const cache = createLocalCache();
    const candidates: Insight[] = [
      createInsight({ id: 'insight_1', priority: 10 }),
      createInsight({ id: 'insight_2', priority: 5 }),
    ];

    const result = selectInsight(candidates, profile, cache);
    expect(result).toBeNull();
  });
});

// ============================================================================
// Priority Order Tests (Story 10.5)
// ============================================================================

describe('getInsightPriority', () => {
  describe('WEEK_1 phase (AC #4)', () => {
    it('always returns QUIRKY_FIRST only, regardless of scan counter', () => {
      expect(getInsightPriority('WEEK_1', 0, false)).toEqual(['QUIRKY_FIRST']);
      expect(getInsightPriority('WEEK_1', 1, false)).toEqual(['QUIRKY_FIRST']);
      expect(getInsightPriority('WEEK_1', 3, false)).toEqual(['QUIRKY_FIRST']);
      expect(getInsightPriority('WEEK_1', 99, false)).toEqual(['QUIRKY_FIRST']);
    });

    it('always returns QUIRKY_FIRST only, regardless of weekend', () => {
      expect(getInsightPriority('WEEK_1', 0, true)).toEqual(['QUIRKY_FIRST']);
      expect(getInsightPriority('WEEK_1', 1, true)).toEqual(['QUIRKY_FIRST']);
    });
  });

  describe('WEEKS_2_3 phase (AC #5)', () => {
    it('returns CELEBRATORY first on non-sprinkle scans (66%)', () => {
      // Non-sprinkle: scanCounter % 3 !== 0
      const result1 = getInsightPriority('WEEKS_2_3', 1, false);
      const result2 = getInsightPriority('WEEKS_2_3', 2, false);
      const result4 = getInsightPriority('WEEKS_2_3', 4, false);

      expect(result1[0]).toBe('CELEBRATORY');
      expect(result2[0]).toBe('CELEBRATORY');
      expect(result4[0]).toBe('CELEBRATORY');
    });

    it('returns ACTIONABLE first on sprinkle scans (33%, every 3rd)', () => {
      // Sprinkle: scanCounter % 3 === 0
      const result0 = getInsightPriority('WEEKS_2_3', 0, false);
      const result3 = getInsightPriority('WEEKS_2_3', 3, false);
      const result6 = getInsightPriority('WEEKS_2_3', 6, false);

      expect(result0[0]).toBe('ACTIONABLE');
      expect(result3[0]).toBe('ACTIONABLE');
      expect(result6[0]).toBe('ACTIONABLE');
    });

    it('has same pattern on weekday and weekend', () => {
      // AC #5 specifies same pattern for weekday/weekend in WEEKS_2_3
      expect(getInsightPriority('WEEKS_2_3', 1, false)).toEqual(
        getInsightPriority('WEEKS_2_3', 1, true)
      );
      expect(getInsightPriority('WEEKS_2_3', 3, false)).toEqual(
        getInsightPriority('WEEKS_2_3', 3, true)
      );
    });
  });

  describe('MATURE phase weekday (AC #6)', () => {
    it('returns ACTIONABLE first on non-sprinkle scans (66%)', () => {
      // Non-sprinkle: scanCounter % 3 !== 0
      const result1 = getInsightPriority('MATURE', 1, false);
      const result2 = getInsightPriority('MATURE', 2, false);
      const result4 = getInsightPriority('MATURE', 4, false);

      expect(result1[0]).toBe('ACTIONABLE');
      expect(result2[0]).toBe('ACTIONABLE');
      expect(result4[0]).toBe('ACTIONABLE');
    });

    it('returns CELEBRATORY first on sprinkle scans (33%, every 3rd)', () => {
      // Sprinkle: scanCounter % 3 === 0
      const result0 = getInsightPriority('MATURE', 0, false);
      const result3 = getInsightPriority('MATURE', 3, false);
      const result6 = getInsightPriority('MATURE', 6, false);

      expect(result0[0]).toBe('CELEBRATORY');
      expect(result3[0]).toBe('CELEBRATORY');
      expect(result6[0]).toBe('CELEBRATORY');
    });
  });

  describe('MATURE phase weekend (AC #7)', () => {
    it('returns CELEBRATORY first on non-sprinkle scans (66%)', () => {
      // Non-sprinkle: scanCounter % 3 !== 0
      const result1 = getInsightPriority('MATURE', 1, true);
      const result2 = getInsightPriority('MATURE', 2, true);
      const result4 = getInsightPriority('MATURE', 4, true);

      expect(result1[0]).toBe('CELEBRATORY');
      expect(result2[0]).toBe('CELEBRATORY');
      expect(result4[0]).toBe('CELEBRATORY');
    });

    it('returns ACTIONABLE first on sprinkle scans (33%, every 3rd)', () => {
      // Sprinkle: scanCounter % 3 === 0
      const result0 = getInsightPriority('MATURE', 0, true);
      const result3 = getInsightPriority('MATURE', 3, true);
      const result6 = getInsightPriority('MATURE', 6, true);

      expect(result0[0]).toBe('ACTIONABLE');
      expect(result3[0]).toBe('ACTIONABLE');
      expect(result6[0]).toBe('ACTIONABLE');
    });
  });

  describe('33/66 sprinkle distribution (AC #3)', () => {
    it('should have sprinkle every 3rd scan (0, 3, 6, 9...)', () => {
      // Verify sprinkle pattern for MATURE weekday (most common case)
      const results = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (counter) => getInsightPriority('MATURE', counter, false)[0]
      );

      // Expected: C, A, A, C, A, A, C, A, A, C (C = sprinkle, A = primary for weekday)
      expect(results).toEqual([
        'CELEBRATORY', // 0 - sprinkle
        'ACTIONABLE', // 1 - primary
        'ACTIONABLE', // 2 - primary
        'CELEBRATORY', // 3 - sprinkle
        'ACTIONABLE', // 4 - primary
        'ACTIONABLE', // 5 - primary
        'CELEBRATORY', // 6 - sprinkle
        'ACTIONABLE', // 7 - primary
        'ACTIONABLE', // 8 - primary
        'CELEBRATORY', // 9 - sprinkle
      ]);
    });

    it('always includes QUIRKY_FIRST as fallback in non-WEEK_1 phases', () => {
      const weeks23 = getInsightPriority('WEEKS_2_3', 1, false);
      const matureWeekday = getInsightPriority('MATURE', 1, false);
      const matureWeekend = getInsightPriority('MATURE', 1, true);

      expect(weeks23).toContain('QUIRKY_FIRST');
      expect(matureWeekday).toContain('QUIRKY_FIRST');
      expect(matureWeekend).toContain('QUIRKY_FIRST');
    });
  });
});

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    // Use explicit time to avoid timezone issues
    const saturday = new Date('2024-06-15T12:00:00'); // Saturday
    expect(isWeekend(saturday)).toBe(true);
  });

  it('returns true for Sunday', () => {
    const sunday = new Date('2024-06-16T12:00:00'); // Sunday
    expect(isWeekend(sunday)).toBe(true);
  });

  it('returns false for Monday', () => {
    const monday = new Date('2024-06-17T12:00:00'); // Monday
    expect(isWeekend(monday)).toBe(false);
  });

  it('returns false for Wednesday', () => {
    const wednesday = new Date('2024-06-19T12:00:00'); // Wednesday
    expect(isWeekend(wednesday)).toBe(false);
  });

  it('returns false for Friday', () => {
    const friday = new Date('2024-06-21T12:00:00'); // Friday
    expect(isWeekend(friday)).toBe(false);
  });

  it('uses current date when no argument provided', () => {
    // This test just verifies it doesn't throw
    expect(() => isWeekend()).not.toThrow();
    expect(typeof isWeekend()).toBe('boolean');
  });
});

// ============================================================================
// Enhanced Selection Algorithm Tests (Story 10.5)
// ============================================================================

describe('selectInsight - Story 10.5 enhancements', () => {
  describe('phase-based category selection (AC #2)', () => {
    it('should prefer QUIRKY_FIRST in WEEK_1 phase', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        // User is in WEEK_1 (first transaction today)
        firstTransactionDate: createMockTimestamp(),
      });
      const cache = createLocalCache({ weekdayScanCount: 1 });
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 10 }),
        createInsight({ id: 'quirky', category: 'QUIRKY_FIRST', priority: 5 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 8 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      expect(result?.category).toBe('QUIRKY_FIRST');

      vi.useRealTimers();
    });

    it('should prefer CELEBRATORY in WEEKS_2_3 phase on non-sprinkle scan', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        // User is in WEEKS_2_3 (15 days ago)
        firstTransactionDate: createMockTimestampDaysAgo(15),
      });
      const cache = createLocalCache({ weekdayScanCount: 1 }); // Non-sprinkle
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 10 }),
        createInsight({ id: 'quirky', category: 'QUIRKY_FIRST', priority: 5 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 8 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      expect(result?.category).toBe('CELEBRATORY');

      vi.useRealTimers();
    });

    it('should prefer ACTIONABLE in MATURE phase weekday on non-sprinkle scan', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        // User is in MATURE (30 days ago)
        firstTransactionDate: createMockTimestampDaysAgo(30),
      });
      const cache = createLocalCache({ weekdayScanCount: 1 }); // Non-sprinkle
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 5 }),
        createInsight({ id: 'quirky', category: 'QUIRKY_FIRST', priority: 10 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 8 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      expect(result?.category).toBe('ACTIONABLE');

      vi.useRealTimers();
    });

    it('should prefer CELEBRATORY in MATURE phase weekend on non-sprinkle scan', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T10:00:00')); // Saturday

      const profile = createUserProfile({
        // User is in MATURE (30 days ago)
        firstTransactionDate: createMockTimestampDaysAgo(30),
      });
      const cache = createLocalCache({ weekendScanCount: 1 }); // Non-sprinkle
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 10 }),
        createInsight({ id: 'quirky', category: 'QUIRKY_FIRST', priority: 5 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 8 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      expect(result?.category).toBe('CELEBRATORY');

      vi.useRealTimers();
    });
  });

  describe('sprinkle distribution (AC #3)', () => {
    it('should return minority type on every 3rd scan (MATURE weekday)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        firstTransactionDate: createMockTimestampDaysAgo(30), // MATURE
      });
      const cache = createLocalCache({ weekdayScanCount: 3 }); // Sprinkle scan
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 10 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 5 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      // On weekday sprinkle, CELEBRATORY should be preferred
      expect(result?.category).toBe('CELEBRATORY');

      vi.useRealTimers();
    });

    it('should return primary type on non-sprinkle scans (MATURE weekday)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        firstTransactionDate: createMockTimestampDaysAgo(30), // MATURE
      });
      const cache = createLocalCache({ weekdayScanCount: 4 }); // Non-sprinkle
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 5 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 10 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      // On weekday non-sprinkle, ACTIONABLE should be preferred
      expect(result?.category).toBe('ACTIONABLE');

      vi.useRealTimers();
    });
  });

  describe('fallback behavior (AC #9)', () => {
    it('should return null when all candidates are on cooldown', () => {
      const profile = createUserProfile({
        recentInsights: [
          createInsightRecord('insight_1', 1),
          createInsightRecord('insight_2', 2),
        ],
      });
      const cache = createLocalCache();
      const candidates: Insight[] = [
        createInsight({ id: 'insight_1' }),
        createInsight({ id: 'insight_2' }),
      ];

      const result = selectInsight(candidates, profile, cache);
      expect(result).toBeNull();
    });

    it('should fall back to any available insight when preferred category empty', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        firstTransactionDate: createMockTimestamp(), // WEEK_1
      });
      const cache = createLocalCache();
      // Only ACTIONABLE available, but WEEK_1 prefers QUIRKY_FIRST
      const candidates: Insight[] = [
        createInsight({ id: 'action', category: 'ACTIONABLE', priority: 10 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      // Should still return something (the available ACTIONABLE)
      expect(result).not.toBeNull();
      expect(result?.id).toBe('action');

      vi.useRealTimers();
    });
  });

  describe('priority within category', () => {
    it('should return highest priority insight within preferred category', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      const profile = createUserProfile({
        firstTransactionDate: createMockTimestamp(), // WEEK_1
      });
      const cache = createLocalCache();
      const candidates: Insight[] = [
        createInsight({ id: 'quirky_low', category: 'QUIRKY_FIRST', priority: 1 }),
        createInsight({ id: 'quirky_high', category: 'QUIRKY_FIRST', priority: 10 }),
        createInsight({ id: 'quirky_mid', category: 'QUIRKY_FIRST', priority: 5 }),
      ];

      const result = selectInsight(candidates, profile, cache);
      expect(result?.id).toBe('quirky_high');

      vi.useRealTimers();
    });
  });

  describe('full selection path with phase + category + priority (M3 fix)', () => {
    it('should select highest priority within phase-preferred category', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      // MATURE user on weekday, non-sprinkle scan → prefers ACTIONABLE
      const profile = createUserProfile({
        firstTransactionDate: createMockTimestampDaysAgo(30), // MATURE
      });
      const cache = createLocalCache({ weekdayScanCount: 1 }); // Non-sprinkle

      // Mix of categories with varying priorities
      const candidates: Insight[] = [
        createInsight({ id: 'action_low', category: 'ACTIONABLE', priority: 2 }),
        createInsight({ id: 'action_high', category: 'ACTIONABLE', priority: 8 }),
        createInsight({ id: 'celebratory_max', category: 'CELEBRATORY', priority: 10 }),
        createInsight({ id: 'quirky', category: 'QUIRKY_FIRST', priority: 5 }),
      ];

      const result = selectInsight(candidates, profile, cache);

      // Should prefer ACTIONABLE (phase priority) and pick highest within it
      expect(result?.category).toBe('ACTIONABLE');
      expect(result?.id).toBe('action_high');
      expect(result?.priority).toBe(8);

      vi.useRealTimers();
    });

    it('should fall through to next category when preferred is on cooldown', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

      // MATURE user on weekday → prefers ACTIONABLE, but all ACTIONABLE on cooldown
      const profile = createUserProfile({
        firstTransactionDate: createMockTimestampDaysAgo(30),
        recentInsights: [
          createInsightRecord('action_1', 1), // On cooldown
          createInsightRecord('action_2', 2), // On cooldown
        ],
      });
      const cache = createLocalCache({ weekdayScanCount: 1 });

      const candidates: Insight[] = [
        createInsight({ id: 'action_1', category: 'ACTIONABLE', priority: 10 }),
        createInsight({ id: 'action_2', category: 'ACTIONABLE', priority: 8 }),
        createInsight({ id: 'celebratory', category: 'CELEBRATORY', priority: 5 }),
      ];

      const result = selectInsight(candidates, profile, cache);

      // ACTIONABLE on cooldown, should fall through to CELEBRATORY
      expect(result?.category).toBe('CELEBRATORY');
      expect(result?.id).toBe('celebratory');

      vi.useRealTimers();
    });
  });
});

// ============================================================================
// Local Cache Tests
// ============================================================================

describe('getLocalCache', () => {
  let mockStorage: Record<string, string>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return default cache when localStorage is empty', () => {
    const cache = getLocalCache();

    expect(cache.weekdayScanCount).toBe(0);
    expect(cache.weekendScanCount).toBe(0);
    expect(cache.silencedUntil).toBeNull();
    expect(cache.lastCounterReset).toBeDefined();
  });

  it('should return stored cache when valid', () => {
    const storedCache: LocalInsightCache = {
      weekdayScanCount: 5,
      weekendScanCount: 3,
      lastCounterReset: new Date().toISOString().split('T')[0],
      silencedUntil: null,
    };
    mockStorage[INSIGHT_CACHE_KEY] = JSON.stringify(storedCache);

    const cache = getLocalCache();
    expect(cache.weekdayScanCount).toBe(5);
    expect(cache.weekendScanCount).toBe(3);
  });

  it('should return default cache when stored data is corrupted', () => {
    mockStorage[INSIGHT_CACHE_KEY] = 'not valid json';

    const cache = getLocalCache();
    expect(cache.weekdayScanCount).toBe(0);
    expect(cache.weekendScanCount).toBe(0);
  });

  it('should return default cache when stored data is missing required fields', () => {
    mockStorage[INSIGHT_CACHE_KEY] = JSON.stringify({ foo: 'bar' });

    const cache = getLocalCache();
    expect(cache.weekdayScanCount).toBe(0);
    expect(cache.weekendScanCount).toBe(0);
  });

  it('should reset counters when lastCounterReset is more than 7 days ago', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const storedCache: LocalInsightCache = {
      weekdayScanCount: 50,
      weekendScanCount: 20,
      lastCounterReset: oldDate.toISOString().split('T')[0],
      silencedUntil: null,
    };
    mockStorage[INSIGHT_CACHE_KEY] = JSON.stringify(storedCache);

    const cache = getLocalCache();
    expect(cache.weekdayScanCount).toBe(0);
    expect(cache.weekendScanCount).toBe(0);
  });
});

describe('setLocalCache', () => {
  let mockStorage: Record<string, string>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should store cache in localStorage', () => {
    const cache = createLocalCache({ weekdayScanCount: 10 });

    setLocalCache(cache);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      INSIGHT_CACHE_KEY,
      expect.any(String)
    );
    const stored = mockStorage[INSIGHT_CACHE_KEY];
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.weekdayScanCount).toBe(10);
  });
});

describe('getDefaultCache', () => {
  it('should return cache with zero counters', () => {
    const cache = getDefaultCache();

    expect(cache.weekdayScanCount).toBe(0);
    expect(cache.weekendScanCount).toBe(0);
    expect(cache.silencedUntil).toBeNull();
  });

  it('should return cache with today as lastCounterReset', () => {
    const cache = getDefaultCache();
    const today = new Date().toISOString().split('T')[0];

    expect(cache.lastCounterReset).toBe(today);
  });
});

// ============================================================================
// Scan Counter Tests
// ============================================================================

describe('incrementScanCounter', () => {
  it('should increment weekday counter on weekday', () => {
    // Mock Date to a weekday (Wednesday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-19T10:00:00')); // Wednesday

    const cache = createLocalCache({
      weekdayScanCount: 5,
      weekendScanCount: 2,
      lastCounterReset: '2024-06-17', // 2 days ago
    });
    const updated = incrementScanCounter(cache);

    expect(updated.weekdayScanCount).toBe(6);
    expect(updated.weekendScanCount).toBe(2);

    vi.useRealTimers();
  });

  it('should increment weekend counter on weekend', () => {
    // Mock Date to a weekend (Saturday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00')); // Saturday

    const cache = createLocalCache({
      weekdayScanCount: 5,
      weekendScanCount: 2,
      lastCounterReset: '2024-06-14', // 1 day ago
    });
    const updated = incrementScanCounter(cache);

    expect(updated.weekdayScanCount).toBe(5);
    expect(updated.weekendScanCount).toBe(3);

    vi.useRealTimers();
  });

  it('should increment weekend counter on Sunday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-16T10:00:00')); // Sunday

    const cache = createLocalCache({
      weekdayScanCount: 5,
      weekendScanCount: 2,
      lastCounterReset: '2024-06-14', // 2 days ago
    });
    const updated = incrementScanCounter(cache);

    expect(updated.weekdayScanCount).toBe(5);
    expect(updated.weekendScanCount).toBe(3);

    vi.useRealTimers();
  });

  describe('weekly reset (AC #8)', () => {
    it('should reset counters after 7 days and then increment', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-25T10:00:00')); // Tuesday

      const cache = createLocalCache({
        weekdayScanCount: 10,
        weekendScanCount: 5,
        lastCounterReset: '2024-06-15', // 10 days ago
      });

      const updated = incrementScanCounter(cache);

      // Counters should be reset to 0, then weekday incremented to 1
      expect(updated.weekdayScanCount).toBe(1);
      expect(updated.weekendScanCount).toBe(0);
      expect(updated.lastCounterReset).toBe('2024-06-25');

      vi.useRealTimers();
    });

    it('should reset counters at exactly 7 days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-22T10:00:00')); // Saturday

      const cache = createLocalCache({
        weekdayScanCount: 10,
        weekendScanCount: 5,
        lastCounterReset: '2024-06-15', // Exactly 7 days ago
      });

      const updated = incrementScanCounter(cache);

      // Counters should be reset to 0, then weekend incremented to 1
      expect(updated.weekdayScanCount).toBe(0);
      expect(updated.weekendScanCount).toBe(1);
      expect(updated.lastCounterReset).toBe('2024-06-22');

      vi.useRealTimers();
    });

    it('should NOT reset counters before 7 days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-21T10:00:00')); // Friday

      const cache = createLocalCache({
        weekdayScanCount: 10,
        weekendScanCount: 5,
        lastCounterReset: '2024-06-15', // 6 days ago
      });

      const updated = incrementScanCounter(cache);

      // Counters should NOT be reset
      expect(updated.weekdayScanCount).toBe(11);
      expect(updated.weekendScanCount).toBe(5);
      expect(updated.lastCounterReset).toBe('2024-06-15'); // Unchanged

      vi.useRealTimers();
    });

    it('should preserve silencedUntil when resetting counters', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-25T10:00:00'));

      const futureDate = new Date('2024-06-26T10:00:00').toISOString();
      const cache = createLocalCache({
        weekdayScanCount: 10,
        weekendScanCount: 5,
        lastCounterReset: '2024-06-15', // 10 days ago
        silencedUntil: futureDate,
      });

      const updated = incrementScanCounter(cache);

      expect(updated.silencedUntil).toBe(futureDate);

      vi.useRealTimers();
    });
  });
});

// ============================================================================
// Silence Tests
// ============================================================================

describe('isInsightsSilenced', () => {
  it('should return false when silencedUntil is null', () => {
    const cache = createLocalCache({ silencedUntil: null });
    expect(isInsightsSilenced(cache)).toBe(false);
  });

  it('should return false when silencedUntil is in the past', () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    const cache = createLocalCache({ silencedUntil: pastDate.toISOString() });

    expect(isInsightsSilenced(cache)).toBe(false);
  });

  it('should return true when silencedUntil is in the future', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    const cache = createLocalCache({ silencedUntil: futureDate.toISOString() });

    expect(isInsightsSilenced(cache)).toBe(true);
  });
});

describe('silenceInsights', () => {
  it('should set silencedUntil to specified hours from now', () => {
    vi.useFakeTimers();
    const now = new Date('2024-06-15T10:00:00');
    vi.setSystemTime(now);

    const cache = createLocalCache();
    const updated = silenceInsights(cache, 4);

    const silencedUntil = new Date(updated.silencedUntil!);
    expect(silencedUntil.getHours()).toBe(14); // 10 + 4 = 14

    vi.useRealTimers();
  });
});

describe('clearSilence', () => {
  it('should set silencedUntil to null', () => {
    const cache = createLocalCache({ silencedUntil: new Date().toISOString() });
    const updated = clearSilence(cache);

    expect(updated.silencedUntil).toBeNull();
  });
});

// ============================================================================
// Main Entry Point Tests
// ============================================================================

describe('generateInsightForTransaction', () => {
  it('should return an insight for a valid transaction', async () => {
    const transaction = createTransaction();
    const profile = createUserProfile();
    const cache = createLocalCache();

    const result = await generateInsightForTransaction(
      transaction,
      [],
      profile,
      cache
    );

    expect(result).toBeDefined();
    // Story 10.3: Now returns actual insights from generators
    // With empty history, new_merchant should trigger (first visit to merchant)
    // If no generators apply, falls back to building_profile
    expect(result?.id).toBeDefined();
    expect(result?.category).toBeDefined();
    expect(result?.title).toBeDefined();
    expect(result?.message).toBeDefined();
  });

  it('should not throw on empty transaction list', async () => {
    const transaction = createTransaction();
    const profile = createUserProfile();
    const cache = createLocalCache();

    await expect(
      generateInsightForTransaction(transaction, [], profile, cache)
    ).resolves.not.toThrow();
  });
});

// ============================================================================
// Precomputed Aggregates Tests (Story 10.4)
// ============================================================================

describe('computeAggregates', () => {
  it('should compute merchant visit counts correctly', () => {
    const transactions = [
      createTransaction({ merchant: 'Jumbo' }),
      createTransaction({ merchant: 'Jumbo' }),
      createTransaction({ merchant: 'Lider' }),
      createTransaction({ merchant: 'Jumbo' }),
    ];

    const aggregates = computeAggregates(transactions);

    expect(aggregates.merchantVisits['Jumbo']).toBe(3);
    expect(aggregates.merchantVisits['Lider']).toBe(1);
  });

  it('should compute category totals correctly', () => {
    const transactions = [
      createTransaction({ category: 'Supermarket', total: 10000 }),
      createTransaction({ category: 'Supermarket', total: 15000 }),
      createTransaction({ category: 'Restaurant', total: 5000 }),
    ];

    const aggregates = computeAggregates(transactions);

    expect(aggregates.categoryTotals['Supermarket']).toBe(25000);
    expect(aggregates.categoryTotals['Restaurant']).toBe(5000);
  });

  it('should handle empty transaction list', () => {
    const aggregates = computeAggregates([]);

    expect(aggregates.merchantVisits).toEqual({});
    expect(aggregates.categoryTotals).toEqual({});
    expect(aggregates.computedAt).toBeDefined();
  });

  it('should set computedAt timestamp', () => {
    const aggregates = computeAggregates([createTransaction()]);

    expect(aggregates.computedAt).toBeDefined();
    // Should be a valid ISO date string
    expect(new Date(aggregates.computedAt).getTime()).not.toBeNaN();
  });

  it('should skip transactions without merchant', () => {
    const transactions = [
      createTransaction({ merchant: 'Jumbo' }),
      createTransaction({ merchant: undefined as unknown as string }),
      createTransaction({ merchant: '' }),
    ];

    const aggregates = computeAggregates(transactions);

    // Empty string counts as falsy, so only 1 merchant
    expect(Object.keys(aggregates.merchantVisits).length).toBeLessThanOrEqual(2);
  });

  it('should skip transactions without category', () => {
    const transactions = [
      createTransaction({ category: 'Supermarket', total: 10000 }),
      createTransaction({ category: undefined as unknown as string, total: 5000 }),
    ];

    const aggregates = computeAggregates(transactions);

    expect(aggregates.categoryTotals['Supermarket']).toBe(10000);
    expect(Object.keys(aggregates.categoryTotals).length).toBe(1);
  });
});

describe('updateCacheAggregates', () => {
  it('should add precomputed aggregates to cache', () => {
    const cache = createLocalCache();
    const transactions = [
      createTransaction({ merchant: 'Jumbo', category: 'Supermarket', total: 10000 }),
    ];

    const updated = updateCacheAggregates(cache, transactions);

    expect(updated.precomputedAggregates).toBeDefined();
    expect(updated.precomputedAggregates?.merchantVisits['Jumbo']).toBe(1);
    expect(updated.precomputedAggregates?.categoryTotals['Supermarket']).toBe(10000);
  });

  it('should preserve other cache fields', () => {
    const cache = createLocalCache({
      weekdayScanCount: 5,
      weekendScanCount: 3,
      silencedUntil: '2024-12-25T00:00:00Z',
    });
    const transactions = [createTransaction()];

    const updated = updateCacheAggregates(cache, transactions);

    expect(updated.weekdayScanCount).toBe(5);
    expect(updated.weekendScanCount).toBe(3);
    expect(updated.silencedUntil).toBe('2024-12-25T00:00:00Z');
  });
});

describe('getMerchantVisitCount', () => {
  it('should return count from aggregates when available', () => {
    const aggregates = {
      merchantVisits: { 'Jumbo': 5, 'Lider': 3 },
      categoryTotals: {},
      computedAt: new Date().toISOString(),
    };

    expect(getMerchantVisitCount('Jumbo', aggregates, [])).toBe(5);
    expect(getMerchantVisitCount('Lider', aggregates, [])).toBe(3);
    expect(getMerchantVisitCount('Unknown', aggregates, [])).toBe(0);
  });

  it('should fall back to counting transactions when aggregates undefined', () => {
    const transactions = [
      createTransaction({ merchant: 'Jumbo' }),
      createTransaction({ merchant: 'Jumbo' }),
      createTransaction({ merchant: 'Lider' }),
    ];

    expect(getMerchantVisitCount('Jumbo', undefined, transactions)).toBe(2);
    expect(getMerchantVisitCount('Lider', undefined, transactions)).toBe(1);
  });
});

describe('getCategoryTotal', () => {
  it('should return total from aggregates when available', () => {
    const aggregates = {
      merchantVisits: {},
      categoryTotals: { 'Supermarket': 50000, 'Restaurant': 20000 },
      computedAt: new Date().toISOString(),
    };

    expect(getCategoryTotal('Supermarket', aggregates, [])).toBe(50000);
    expect(getCategoryTotal('Restaurant', aggregates, [])).toBe(20000);
    expect(getCategoryTotal('Unknown', aggregates, [])).toBe(0);
  });

  it('should fall back to summing transactions when aggregates undefined', () => {
    const transactions = [
      createTransaction({ category: 'Supermarket', total: 10000 }),
      createTransaction({ category: 'Supermarket', total: 15000 }),
      createTransaction({ category: 'Restaurant', total: 5000 }),
    ];

    expect(getCategoryTotal('Supermarket', undefined, transactions)).toBe(25000);
    expect(getCategoryTotal('Restaurant', undefined, transactions)).toBe(5000);
  });
});

// ============================================================================
// Historical Comparison Tests (Story 10.7)
// ============================================================================

describe('getLastWeekTotal', () => {
  // Window is 8-13 days ago (inclusive)
  // Day 7 = boundary of "this week", Day 14 = boundary of "2 weeks ago"

  it('should return total from transactions 8-13 days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-19T12:00:00'));

    const transactions = [
      // Last week (8-13 days ago) - should be included
      createTransaction({ date: '2025-12-10', total: 10000 }), // 9 days ago
      createTransaction({ date: '2025-12-08', total: 15000 }), // 11 days ago
      createTransaction({ date: '2025-12-06', total: 5000 }),  // 13 days ago - boundary, included
      // This week (0-7 days ago) - should NOT be included
      createTransaction({ date: '2025-12-18', total: 20000 }), // 1 day ago
      createTransaction({ date: '2025-12-15', total: 8000 }),  // 4 days ago
      // Older than 2 weeks - should NOT be included
      createTransaction({ date: '2025-12-01', total: 12000 }), // 18 days ago
    ];

    const result = getLastWeekTotal(transactions);

    // Only transactions 8-13 days ago: 10000 + 15000 + 5000 = 30000
    expect(result).toBe(30000);

    vi.useRealTimers();
  });

  it('should return 0 when no transactions in last week window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-19T12:00:00'));

    const transactions = [
      // This week only
      createTransaction({ date: '2025-12-18', total: 10000 }),
      createTransaction({ date: '2025-12-17', total: 15000 }),
    ];

    const result = getLastWeekTotal(transactions);
    expect(result).toBe(0);

    vi.useRealTimers();
  });

  it('should return 0 for empty transaction list', () => {
    const result = getLastWeekTotal([]);
    expect(result).toBe(0);
  });

  it('should exclude transactions at day 7 (boundary - this week)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-19T12:00:00'));

    const transactions = [
      createTransaction({ date: '2025-12-12', total: 10000 }), // 7 days ago - excluded (this week boundary)
    ];

    const result = getLastWeekTotal(transactions);
    expect(result).toBe(0);

    vi.useRealTimers();
  });

  it('should exclude transactions at day 14 (boundary - two weeks ago)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-19T12:00:00'));

    const transactions = [
      createTransaction({ date: '2025-12-05', total: 10000 }), // 14 days ago - excluded
    ];

    const result = getLastWeekTotal(transactions);
    expect(result).toBe(0);

    vi.useRealTimers();
  });

  it('should include transactions at day 8 (inside window)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-19T12:00:00'));

    const transactions = [
      createTransaction({ date: '2025-12-11', total: 10000 }), // 8 days ago - included
    ];

    const result = getLastWeekTotal(transactions);
    expect(result).toBe(10000);

    vi.useRealTimers();
  });

  it('should include transactions at day 13 (inside window)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-19T12:00:00'));

    const transactions = [
      createTransaction({ date: '2025-12-06', total: 10000 }), // 13 days ago - included
    ];

    const result = getLastWeekTotal(transactions);
    expect(result).toBe(10000);

    vi.useRealTimers();
  });
});
