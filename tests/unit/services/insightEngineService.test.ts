/**
 * Insight Engine Service Tests
 *
 * Story 10.1: InsightEngine Service Interface
 * @see docs/sprint-artifacts/epic10/story-10.1-insight-engine-core.md
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  generateInsightForTransaction,
  calculateUserPhase,
  selectInsight,
  checkCooldown,
  getFallbackInsight,
  getLocalCache,
  setLocalCache,
  getDefaultCache,
  incrementScanCounter,
  isInsightsSilenced,
  silenceInsights,
  clearSilence,
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

function createMockTimestamp(daysAgo: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toMillis: () => date.getTime(),
    isEqual: () => false,
    valueOf: () => '',
    toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
  } as unknown as Timestamp;
}

function createUserProfile(overrides: Partial<UserInsightProfile> = {}): UserInsightProfile {
  return {
    schemaVersion: 1,
    firstTransactionDate: createMockTimestamp(0),
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
    shownAt: createMockTimestamp(daysAgo),
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
      firstTransactionDate: createMockTimestamp(0),
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('should return WEEK_1 for user with 5 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(5),
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('should return WEEK_1 for user at exactly 7 days', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(7),
    });
    expect(calculateUserPhase(profile)).toBe('WEEK_1');
  });

  it('should return WEEKS_2_3 for user with 8 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(8),
    });
    expect(calculateUserPhase(profile)).toBe('WEEKS_2_3');
  });

  it('should return WEEKS_2_3 for user with 15 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(15),
    });
    expect(calculateUserPhase(profile)).toBe('WEEKS_2_3');
  });

  it('should return WEEKS_2_3 for user at exactly 21 days', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(21),
    });
    expect(calculateUserPhase(profile)).toBe('WEEKS_2_3');
  });

  it('should return MATURE for user with 22 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(22),
    });
    expect(calculateUserPhase(profile)).toBe('MATURE');
  });

  it('should return MATURE for user with 100 days history', () => {
    const profile = createUserProfile({
      firstTransactionDate: createMockTimestamp(100),
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

    const cache = createLocalCache({ weekdayScanCount: 5, weekendScanCount: 2 });
    const updated = incrementScanCounter(cache);

    expect(updated.weekdayScanCount).toBe(6);
    expect(updated.weekendScanCount).toBe(2);

    vi.useRealTimers();
  });

  it('should increment weekend counter on weekend', () => {
    // Mock Date to a weekend (Saturday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00')); // Saturday

    const cache = createLocalCache({ weekdayScanCount: 5, weekendScanCount: 2 });
    const updated = incrementScanCounter(cache);

    expect(updated.weekdayScanCount).toBe(5);
    expect(updated.weekendScanCount).toBe(3);

    vi.useRealTimers();
  });

  it('should increment weekend counter on Sunday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-16T10:00:00')); // Sunday

    const cache = createLocalCache({ weekdayScanCount: 5, weekendScanCount: 2 });
    const updated = incrementScanCounter(cache);

    expect(updated.weekdayScanCount).toBe(5);
    expect(updated.weekendScanCount).toBe(3);

    vi.useRealTimers();
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
  it('should return fallback insight (stub implementation)', async () => {
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
    expect(result?.id).toBe('building_profile');
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
