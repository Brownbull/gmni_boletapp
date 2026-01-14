/**
 * Insight Profile Service Tests
 *
 * Story 10.2: Phase Detection & User Profile
 * Tests Firestore CRUD operations for UserInsightProfile
 *
 * NOTE: These tests mock Firestore operations since we're testing the service logic,
 * not the Firestore SDK itself. Integration tests with Firebase emulator would
 * test actual Firestore behavior.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  getOrCreateInsightProfile,
  getInsightProfile,
  trackTransactionForProfile,
  setFirstTransactionDate,
  recordInsightShown,
  clearRecentInsights,
  resetInsightProfile,
} from '../../../src/services/insightProfileService';
import type { UserInsightProfile, InsightRecord } from '../../../src/types/insight';
import { MAX_RECENT_INSIGHTS } from '../../../src/types/insight';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
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
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockFirestore() {
  return {} as import('firebase/firestore').Firestore;
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

function createInsightRecord(insightId: string, daysAgo: number): InsightRecord {
  return {
    insightId,
    shownAt: createMockTimestamp(daysAgo),
  };
}

// ============================================================================
// getOrCreateInsightProfile Tests
// ============================================================================

describe('getOrCreateInsightProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing profile when it exists', async () => {
    const existingProfile = createUserProfile({ totalTransactions: 10 });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => existingProfile,
    });

    const db = createMockFirestore();
    const result = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(result.totalTransactions).toBe(10);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('should create new profile when it does not exist', async () => {
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    const result = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(setDoc).toHaveBeenCalled();
    expect(result.schemaVersion).toBe(1);
    expect(result.totalTransactions).toBe(0);
    expect(result.recentInsights).toEqual([]);
  });

  it('should create profile with null firstTransactionDate for new users', async () => {
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    const result = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(result.firstTransactionDate).toBeNull();
  });

  it('should use correct Firestore path', async () => {
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

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
// getInsightProfile Tests
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
// ============================================================================

describe('trackTransactionForProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should increment totalTransactions', async () => {
    const existingProfile = createUserProfile({
      totalTransactions: 5,
      firstTransactionDate: createMockTimestamp(10),
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => existingProfile,
    });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].totalTransactions).toEqual({ __increment: 1 });
  });

  it('should set firstTransactionDate when profile has no firstTransactionDate', async () => {
    const newProfile = createUserProfile({
      firstTransactionDate: null as unknown as Timestamp,
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => newProfile,
    });

    const transactionDate = new Date('2024-06-15');
    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', transactionDate);

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeDefined();
  });

  it('should NOT overwrite existing firstTransactionDate', async () => {
    const existingProfile = createUserProfile({
      firstTransactionDate: createMockTimestamp(30), // Already set
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => existingProfile,
    });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeUndefined();
  });

  it('should create profile if it does not exist', async () => {
    // First call: profile doesn't exist
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    expect(setDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });
});

// ============================================================================
// setFirstTransactionDate Tests
// ============================================================================

describe('setFirstTransactionDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set firstTransactionDate explicitly', async () => {
    const profile = createUserProfile({
      firstTransactionDate: null as unknown as Timestamp,
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const firstDate = new Date('2024-01-15');
    const db = createMockFirestore();
    await setFirstTransactionDate(db, 'user123', 'app1', firstDate);

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeDefined();
  });

  it('should create profile if it does not exist before setting date', async () => {
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    await setFirstTransactionDate(db, 'user123', 'app1', new Date());

    expect(setDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });
});

// ============================================================================
// recordInsightShown Tests
// ============================================================================

describe('recordInsightShown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add new insight record to recentInsights', async () => {
    const profile = createUserProfile({ recentInsights: [] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'merchant_frequency');

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(1);
    expect(updateCall[1].recentInsights[0].insightId).toBe('merchant_frequency');
  });

  it('should include transactionId when provided', async () => {
    const profile = createUserProfile({ recentInsights: [] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'merchant_frequency', 'tx123');

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights[0].transactionId).toBe('tx123');
  });

  it('should trim recentInsights to MAX_RECENT_INSIGHTS', async () => {
    // Create profile with MAX_RECENT_INSIGHTS entries
    const existingInsights: InsightRecord[] = Array.from(
      { length: MAX_RECENT_INSIGHTS },
      (_, i) => createInsightRecord(`insight_${i}`, i)
    );

    const profile = createUserProfile({ recentInsights: existingInsights });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'new_insight');

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(MAX_RECENT_INSIGHTS);
    // New insight should be at the end
    expect(
      updateCall[1].recentInsights[MAX_RECENT_INSIGHTS - 1].insightId
    ).toBe('new_insight');
    // First insight should be dropped (FIFO)
    expect(updateCall[1].recentInsights[0].insightId).toBe('insight_1');
  });

  // Story 10a.5: Test full insight content storage
  it('should store full insight content (title, message, category, icon)', async () => {
    const profile = createUserProfile({ recentInsights: [] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'merchant_frequency', 'tx123', {
      title: 'Visita frecuente',
      message: '3ra vez en Jumbo este mes',
      category: 'ACTIONABLE',
      icon: 'Repeat',
    });

    const updateCall = (updateDoc as Mock).mock.calls[0];
    const storedRecord = updateCall[1].recentInsights[0];
    expect(storedRecord.insightId).toBe('merchant_frequency');
    expect(storedRecord.transactionId).toBe('tx123');
    expect(storedRecord.title).toBe('Visita frecuente');
    expect(storedRecord.message).toBe('3ra vez en Jumbo este mes');
    expect(storedRecord.category).toBe('ACTIONABLE');
    expect(storedRecord.icon).toBe('Repeat');
  });

  // Story 10a.5 AC2: Backward compatibility - old records without new fields
  it('should not error when reading old records without new fields', async () => {
    // Simulate old InsightRecord format (only insightId, shownAt, transactionId)
    const oldStyleRecord: InsightRecord = {
      insightId: 'old_insight',
      shownAt: createMockTimestamp(1),
      transactionId: 'old_tx',
      // No title, message, category, icon - simulating old data
    };

    const profile = createUserProfile({ recentInsights: [oldStyleRecord] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    // Adding a new insight should not error even with old records present
    await recordInsightShown(db, 'user123', 'app1', 'new_insight', 'tx_new', {
      title: 'New Title',
      message: 'New Message',
    });

    const updateCall = (updateDoc as Mock).mock.calls[0];
    // Should have both old and new records
    expect(updateCall[1].recentInsights).toHaveLength(2);
    // Old record should be preserved without new fields
    expect(updateCall[1].recentInsights[0].title).toBeUndefined();
    // New record should have the new fields
    expect(updateCall[1].recentInsights[1].title).toBe('New Title');
  });

  it('should handle partial fullInsight object (only some fields provided)', async () => {
    const profile = createUserProfile({ recentInsights: [] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    // Only provide title and message, no category or icon
    await recordInsightShown(db, 'user123', 'app1', 'test_insight', undefined, {
      title: 'Test Title',
      message: 'Test Message',
    });

    const updateCall = (updateDoc as Mock).mock.calls[0];
    const storedRecord = updateCall[1].recentInsights[0];
    expect(storedRecord.title).toBe('Test Title');
    expect(storedRecord.message).toBe('Test Message');
    expect(storedRecord.category).toBeUndefined();
    expect(storedRecord.icon).toBeUndefined();
  });
});

// ============================================================================
// clearRecentInsights Tests
// ============================================================================

describe('clearRecentInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear all recent insights', async () => {
    const profile = createUserProfile({
      recentInsights: [
        createInsightRecord('insight_1', 1),
        createInsightRecord('insight_2', 2),
      ],
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await clearRecentInsights(db, 'user123', 'app1');

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights).toEqual([]);
  });

  it('should create profile if it does not exist', async () => {
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    await clearRecentInsights(db, 'user123', 'app1');

    expect(setDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });
});

// ============================================================================
// resetInsightProfile Tests
// ============================================================================

describe('resetInsightProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset totalTransactions to 0', async () => {
    const profile = createUserProfile({
      totalTransactions: 100,
      firstTransactionDate: createMockTimestamp(50),
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    expect(updateDoc).toHaveBeenCalled();
    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].totalTransactions).toBe(0);
  });

  it('should clear recentInsights', async () => {
    const profile = createUserProfile({
      recentInsights: [createInsightRecord('test', 1)],
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights).toEqual([]);
  });

  it('should preserve firstTransactionDate', async () => {
    const originalTimestamp = createMockTimestamp(50);
    const profile = createUserProfile({
      firstTransactionDate: originalTimestamp,
      totalTransactions: 100,
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await resetInsightProfile(db, 'user123', 'app1');

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBe(originalTimestamp);
  });
});

// ============================================================================
// Acceptance Criteria Verification Tests
// ============================================================================

describe('Story 10.2 Acceptance Criteria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC #4: UserInsightProfile Firestore document created on first insight generation', async () => {
    // When profile doesn't exist, getOrCreateInsightProfile creates it
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    const db = createMockFirestore();
    const profile = await getOrCreateInsightProfile(db, 'user123', 'app1');

    expect(setDoc).toHaveBeenCalled();
    expect(profile.schemaVersion).toBe(1);
  });

  it('AC #5: Profile tracks firstTransactionDate accurately', async () => {
    const profile = createUserProfile({
      firstTransactionDate: null as unknown as Timestamp,
    });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const transactionDate = new Date('2024-06-15');
    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', transactionDate);

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].firstTransactionDate).toBeDefined();
  });

  it('AC #6: Profile tracks totalTransactions count', async () => {
    const profile = createUserProfile({ totalTransactions: 5 });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await trackTransactionForProfile(db, 'user123', 'app1', new Date());

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].totalTransactions).toEqual({ __increment: 1 });
  });

  it('AC #7: Profile stores recentInsights array (max 50 entries per Story 10a.5)', async () => {
    // Create profile at max capacity
    const existingInsights = Array.from({ length: MAX_RECENT_INSIGHTS }, (_, i) =>
      createInsightRecord(`insight_${i}`, i)
    );

    const profile = createUserProfile({ recentInsights: existingInsights });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
    });

    const db = createMockFirestore();
    await recordInsightShown(db, 'user123', 'app1', 'new_insight');

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights).toHaveLength(MAX_RECENT_INSIGHTS);
  });
});

// ============================================================================
// Story 14.17: recordIntentionalResponse Tests
// ============================================================================

describe('recordIntentionalResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update matching insight with intentional response', async () => {
    const { recordIntentionalResponse } = await import('../../../src/services/insightProfileService');

    const targetInsight = createInsightRecord('category_trend', 0);
    const profile = createUserProfile({ recentInsights: [targetInsight] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
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

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe('intentional');
    expect(updateCall[1].recentInsights[0].intentionalResponseAt).toBeDefined();
  });

  it('should update matching insight with unintentional response', async () => {
    const { recordIntentionalResponse } = await import('../../../src/services/insightProfileService');

    const targetInsight = createInsightRecord('spending_velocity', 0);
    const profile = createUserProfile({ recentInsights: [targetInsight] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
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

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe('unintentional');
  });

  it('should store null response when dismissed without answering', async () => {
    const { recordIntentionalResponse } = await import('../../../src/services/insightProfileService');

    const targetInsight = createInsightRecord('category_trend', 0);
    const profile = createUserProfile({ recentInsights: [targetInsight] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
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

    const updateCall = (updateDoc as Mock).mock.calls[0];
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe(null);
  });

  it('should only update matching insight, leaving others unchanged', async () => {
    const { recordIntentionalResponse } = await import('../../../src/services/insightProfileService');

    const insight1 = createInsightRecord('category_trend', 1);
    const insight2 = createInsightRecord('merchant_frequency', 0);
    const profile = createUserProfile({ recentInsights: [insight1, insight2] });

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => profile,
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

    const updateCall = (updateDoc as Mock).mock.calls[0];
    // First insight should be updated
    expect(updateCall[1].recentInsights[0].intentionalResponse).toBe('intentional');
    // Second insight should not have intentionalResponse
    expect(updateCall[1].recentInsights[1].intentionalResponse).toBeUndefined();
  });
});
