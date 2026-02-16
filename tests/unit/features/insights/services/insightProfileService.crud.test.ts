/**
 * Insight Profile Service Tests
 *
 * Story 10.2: Phase Detection & User Profile
 * Tests Firestore CRUD operations for UserInsightProfile
 *
 * Story 15-TD-20: Updated mocks for runTransaction wrapping.
 * Story 15-TD-24: All remaining functions (trackTransactionForProfile, setFirstTransactionDate,
 * clearRecentInsights, resetInsightProfile) now also wrapped in runTransaction.
 * ALL mutation functions use transaction.get/set/update — only getInsightProfile uses standalone getDoc.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createMockTimestamp, createMockTimestampDaysAgo } from '../../../../helpers';
import {
  getOrCreateInsightProfile,
  getInsightProfile,
  trackTransactionForProfile,
  setFirstTransactionDate,
  recordInsightShown,
  clearRecentInsights,
  resetInsightProfile,
} from '@features/insights/services/insightProfileService';
import type { UserInsightProfile, InsightRecord } from '../../../../../src/types/insight';
import { MAX_RECENT_INSIGHTS } from '../../../../../src/types/insight';

// Transaction mock for functions wrapped in runTransaction (TD-20)
const mockTransaction = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    runTransaction: vi.fn((_db: unknown, fn: (t: typeof mockTransaction) => unknown) =>
      fn(mockTransaction)
    ),
    increment: vi.fn((n) => ({ __increment: n })),
    Timestamp: {
      now: vi.fn(() => ({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      })),
      fromDate: vi.fn((date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      })),
    },
  };
});

// Import mocked functions for assertions
import { doc, getDoc, setDoc, updateDoc, runTransaction, increment } from 'firebase/firestore';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockFirestore() {
  return {} as import('firebase/firestore').Firestore;
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

function createInsightRecord(insightId: string, daysAgo: number): InsightRecord {
  return {
    insightId,
    shownAt: createMockTimestampDaysAgo(daysAgo),
  };
}

/** Mock transaction.get to return an existing profile snapshot */
function mockTransactionExistingProfile(overrides: Partial<UserInsightProfile> = {}) {
  const profile = createUserProfile(overrides);
  mockTransaction.get.mockResolvedValueOnce({
    exists: () => true,
    data: () => profile,
  });
  return profile;
}

/** Mock transaction.get to return a missing profile snapshot */
function mockTransactionMissingProfile() {
  mockTransaction.get.mockResolvedValueOnce({
    exists: () => false,
  });
}

// ============================================================================
// getOrCreateInsightProfile Tests
// Story 15-TD-20: Now uses runTransaction with transaction.get/set
// ============================================================================

describe('getOrCreateInsightProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should return existing profile when it exists', async () => {
    mockTransactionExistingProfile({ totalTransactions: 10 });

    const db = createMockFirestore();
    const result = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(result.totalTransactions).toBe(10);
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it('should create new profile when it does not exist', async () => {
    mockTransactionMissingProfile();

    const db = createMockFirestore();
    const result = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(mockTransaction.set).toHaveBeenCalled();
    expect(result.schemaVersion).toBe(1);
    expect(result.totalTransactions).toBe(0);
    expect(result.recentInsights).toEqual([]);
  });

  it('should create profile with null firstTransactionDate for new users', async () => {
    mockTransactionMissingProfile();

    const db = createMockFirestore();
    const result = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(result.firstTransactionDate).toBeNull();
  });

  it('should use correct Firestore path', async () => {
    mockTransactionExistingProfile();

    const db = createMockFirestore();
    await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(doc).toHaveBeenCalledWith(
      db,
      'artifacts',
      'app1',
      'users',
      'user123',
      'insightProfile',
      'profile'
    );
  });
});

// ============================================================================
// getInsightProfile Tests (unchanged - still uses standalone getDoc)
// ============================================================================

describe('getInsightProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return profile when it exists', async () => {
    const existingProfile = createUserProfile({ totalTransactions: 5 });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => existingProfile,
    });

    const db = createMockFirestore();
    const result = await getInsightProfile(db, 'user123', 'app1');

    expect(result).not.toBeNull();
    expect(result?.totalTransactions).toBe(5);
  });

  it('should return null when profile does not exist', async () => {
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    const result = await getInsightProfile(db, 'user123', 'app1');

    expect(result).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
  });
});

// ============================================================================
// trackTransactionForProfile Tests
// Story 15-TD-24: Now uses runTransaction with transaction.get/update
// ============================================================================

describe('trackTransactionForProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should increment totalTransactions', async () => {
    mockTransactionExistingProfile({
      totalTransactions: 5,
      firstTransactionDate: createMockTimestampDaysAgo(10),
    });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].totalTransactions).toEqual({ __increment: 1 });
  });

  it('should set firstTransactionDate when profile has no firstTransactionDate', async () => {
    mockTransactionExistingProfile({
      firstTransactionDate: null as unknown as import('firebase/firestore').Timestamp,
    });

    const transactionDate = new Date('2024-06-15');
    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', transactionDate);

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeDefined();
  });

  it('should NOT overwrite existing firstTransactionDate', async () => {
    mockTransactionExistingProfile({
      firstTransactionDate: createMockTimestampDaysAgo(30),
    });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeUndefined();
  });

  it('should create profile if it does not exist', async () => {
    mockTransactionMissingProfile();

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    // getOrCreateProfileInTransaction creates via transaction.set
    expect(mockTransaction.set).toHaveBeenCalled();
    // trackTransactionForProfile updates via transaction.update
    expect(mockTransaction.update).toHaveBeenCalled();
  });

  it('should NOT call standalone updateDoc', async () => {
    mockTransactionExistingProfile();

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    expect(updateDoc).not.toHaveBeenCalled();
  });
});

// ============================================================================
// setFirstTransactionDate Tests
// Story 15-TD-24: Now uses runTransaction with transaction.get/update
// ============================================================================

describe('setFirstTransactionDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should set firstTransactionDate explicitly', async () => {
    mockTransactionExistingProfile({
      firstTransactionDate: null as unknown as import('firebase/firestore').Timestamp,
    });

    const firstDate = new Date('2024-01-15');
    const db = createMockFirestore();
    await setFirstTransactionDate(db, 'user123', 'app1', firstDate);

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeDefined();
  });

  it('should create profile if it does not exist before setting date', async () => {
    mockTransactionMissingProfile();

    const db = createMockFirestore();
    await setFirstTransactionDate(db, 'user123', 'app1', new Date());

    // getOrCreateProfileInTransaction creates via transaction.set
    expect(mockTransaction.set).toHaveBeenCalled();
    // setFirstTransactionDate updates via transaction.update
    expect(mockTransaction.update).toHaveBeenCalled();
  });

  it('should NOT call standalone updateDoc', async () => {
    mockTransactionExistingProfile();

    const db = createMockFirestore();
    await setFirstTransactionDate(db, 'user123', 'app1', new Date());

    expect(updateDoc).not.toHaveBeenCalled();
  });
});

// ============================================================================
// recordInsightShown Tests
// Story 15-TD-20: Now uses runTransaction with transaction.get/update
// ============================================================================

describe('recordInsightShown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should add new insight record to recentInsights', async () => {
    mockTransactionExistingProfile({ recentInsights: [] });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'merchant_frequency');

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(1);
    expect(updateCall[1].recentInsights[0].insightId).toBe('merchant_frequency');
  });

  it('should include transactionId when provided', async () => {
    mockTransactionExistingProfile({ recentInsights: [] });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'merchant_frequency', 'tx123');

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights[0].transactionId).toBe('tx123');
  });

  it('should trim recentInsights to MAX_RECENT_INSIGHTS', async () => {
    const existingInsights: InsightRecord[] = Array.from(
      { length: MAX_RECENT_INSIGHTS },
      (_, i) => createInsightRecord(`insight_${i}`, i)
    );

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: existingInsights }),
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'new_insight');

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(MAX_RECENT_INSIGHTS);
    expect(
      updateCall[1].recentInsights[MAX_RECENT_INSIGHTS - 1].insightId
    ).toBe('new_insight');
    expect(updateCall[1].recentInsights[0].insightId).toBe('insight_1');
  });

  it('should store full insight content (title, message, category, icon)', async () => {
    mockTransactionExistingProfile({ recentInsights: [] });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'merchant_frequency', 'tx123', {
      title: 'Visita frecuente',
      message: '3ra vez en Jumbo este mes',
      category: 'ACTIONABLE',
      icon: 'Repeat',
    });

    const updateCall = mockTransaction.update.mock.calls[0];
    const storedRecord = updateCall[1].recentInsights[0];
    expect(storedRecord.insightId).toBe('merchant_frequency');
    expect(storedRecord.transactionId).toBe('tx123');
    expect(storedRecord.title).toBe('Visita frecuente');
    expect(storedRecord.message).toBe('3ra vez en Jumbo este mes');
    expect(storedRecord.category).toBe('ACTIONABLE');
    expect(storedRecord.icon).toBe('Repeat');
  });

  it('should not error when reading old records without new fields', async () => {
    const oldStyleRecord: InsightRecord = {
      insightId: 'old_insight',
      shownAt: createMockTimestampDaysAgo(1),
      transactionId: 'old_tx',
    };

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: [oldStyleRecord] }),
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'new_insight', 'tx_new', {
      title: 'New Title',
      message: 'New Message',
    });

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(2);
    expect(updateCall[1].recentInsights[0].title).toBeUndefined();
    expect(updateCall[1].recentInsights[1].title).toBe('New Title');
  });

  it('should handle partial fullInsight object (only some fields provided)', async () => {
    mockTransactionExistingProfile({ recentInsights: [] });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'test_insight', undefined, {
      title: 'Test Title',
      message: 'Test Message',
    });

    const updateCall = mockTransaction.update.mock.calls[0];
    const storedRecord = updateCall[1].recentInsights[0];
    expect(storedRecord.title).toBe('Test Title');
    expect(storedRecord.message).toBe('Test Message');
    expect(storedRecord.category).toBeUndefined();
    expect(storedRecord.icon).toBeUndefined();
  });
});

// ============================================================================
// clearRecentInsights Tests
// Story 15-TD-24: Now uses runTransaction with transaction.get/update
// ============================================================================

describe('clearRecentInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should clear all recent insights', async () => {
    mockTransactionExistingProfile({
      recentInsights: [
        createInsightRecord('insight_1', 1),
        createInsightRecord('insight_2', 2),
      ],
    });

    const db = createMockFirestore();
    await clearRecentInsights(db, 'user123', 'app1');

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights).toEqual([]);
  });

  it('should create profile if it does not exist', async () => {
    mockTransactionMissingProfile();

    const db = createMockFirestore();
    await clearRecentInsights(db, 'user123', 'app1');

    // getOrCreateProfileInTransaction creates via transaction.set
    expect(mockTransaction.set).toHaveBeenCalled();
    // clearRecentInsights updates via transaction.update
    expect(mockTransaction.update).toHaveBeenCalled();
  });

  it('should NOT call standalone updateDoc', async () => {
    mockTransactionExistingProfile();

    const db = createMockFirestore();
    await clearRecentInsights(db, 'user123', 'app1');

    expect(updateDoc).not.toHaveBeenCalled();
  });
});

// ============================================================================
// resetInsightProfile Tests
// Story 15-TD-24: Now uses runTransaction with transaction.get/update
// ============================================================================

describe('resetInsightProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should reset totalTransactions to 0', async () => {
    mockTransactionExistingProfile({
      totalTransactions: 100,
      firstTransactionDate: createMockTimestampDaysAgo(50),
    });

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    expect(mockTransaction.update).toHaveBeenCalled();
    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].totalTransactions).toBe(0);
  });

  it('should clear recentInsights', async () => {
    mockTransactionExistingProfile({
      recentInsights: [createInsightRecord('test', 1)],
    });

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights).toEqual([]);
  });

  it('should preserve firstTransactionDate', async () => {
    const originalTimestamp = createMockTimestampDaysAgo(50);
    mockTransactionExistingProfile({
      firstTransactionDate: originalTimestamp,
      totalTransactions: 100,
    });

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBe(originalTimestamp);
  });

  it('should NOT call standalone updateDoc', async () => {
    mockTransactionExistingProfile();

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    expect(updateDoc).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Acceptance Criteria Verification Tests
// ============================================================================

describe('Story 10.2 Acceptance Criteria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('AC #4: UserInsightProfile Firestore document created on first insight generation', async () => {
    mockTransactionMissingProfile();

    const db = createMockFirestore();
    const profile = await getOrCreateInsightProfile(db, 'user123', 'app1');

    // TD-20: Now creates via transaction.set instead of standalone setDoc
    expect(mockTransaction.set).toHaveBeenCalled();
    expect(profile.schemaVersion).toBe(1);
  });

  it('AC #5: Profile tracks firstTransactionDate accurately', async () => {
    mockTransactionExistingProfile({
      firstTransactionDate: null as unknown as import('firebase/firestore').Timestamp,
    });

    const transactionDate = new Date('2024-06-15');
    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', transactionDate);

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeDefined();
  });

  it('AC #6: Profile tracks totalTransactions count', async () => {
    mockTransactionExistingProfile({ totalTransactions: 5 });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].totalTransactions).toEqual({ __increment: 1 });
  });

  it('AC #7: Profile stores recentInsights array (max 50 entries per Story 10a.5)', async () => {
    const existingInsights = Array.from({ length: MAX_RECENT_INSIGHTS }, (_, i) =>
      createInsightRecord(`insight_${i}`, i)
    );

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: existingInsights }),
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'new_insight');

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(MAX_RECENT_INSIGHTS);
  });
});

// ============================================================================
// Story 14.17: recordIntentionalResponse Tests
// Story 15-TD-20: Now uses runTransaction with transaction.get/update
// ============================================================================

describe('recordIntentionalResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTransaction).mockImplementation((_db, fn) => fn(mockTransaction));
  });

  it('should update matching insight with intentional response', async () => {
    const { recordIntentionalResponse } = await import('@features/insights/services/insightProfileService');

    const targetInsight = createInsightRecord('category_trend', 0);

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: [targetInsight] }),
    });

    const db = createMockFirestore();
    await recordIntentionalResponse(
      db,
      'user123',
      'app1',
      'category_trend',
      targetInsight.shownAt.seconds,
      'intentional'
    );

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe('intentional');
    expect(updateCall[1].recentInsights[0].intentionalResponseAt).toBeDefined();
  });

  it('should update matching insight with unintentional response', async () => {
    const { recordIntentionalResponse } = await import('@features/insights/services/insightProfileService');

    const targetInsight = createInsightRecord('spending_velocity', 0);

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: [targetInsight] }),
    });

    const db = createMockFirestore();
    await recordIntentionalResponse(
      db,
      'user123',
      'app1',
      'spending_velocity',
      targetInsight.shownAt.seconds,
      'unintentional'
    );

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe('unintentional');
  });

  it('should store null response when dismissed without answering', async () => {
    const { recordIntentionalResponse } = await import('@features/insights/services/insightProfileService');

    const targetInsight = createInsightRecord('category_trend', 0);

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: [targetInsight] }),
    });

    const db = createMockFirestore();
    await recordIntentionalResponse(
      db,
      'user123',
      'app1',
      'category_trend',
      targetInsight.shownAt.seconds,
      null
    );

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe(null);
  });

  it('should only update matching insight, leaving others unchanged', async () => {
    const { recordIntentionalResponse } = await import('@features/insights/services/insightProfileService');

    const insight1 = createInsightRecord('category_trend', 1);
    const insight2 = createInsightRecord('merchant_frequency', 0);

    mockTransaction.get.mockResolvedValueOnce({
      exists: () => true,
      data: () => createUserProfile({ recentInsights: [insight1, insight2] }),
    });

    const db = createMockFirestore();
    await recordIntentionalResponse(
      db,
      'user123',
      'app1',
      'category_trend',
      insight1.shownAt.seconds,
      'intentional'
    );

    const updateCall = mockTransaction.update.mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe('intentional');
    expect(updateCall[1].recentInsights[1].intentionalResponse).toBeUndefined();
  });
});
