/**
 * Airlock Service Tests
 *
 * Story 14.33c.1: Airlock Generation & Persistence
 * Tests CRUD operations and mock generation for airlocks
 *
 * NOTE: These tests mock Firestore operations since we're testing the service logic,
 * not the Firestore SDK itself.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createMockTimestamp } from '../../helpers';
import {
  generateAirlock,
  getUserAirlocks,
  markAirlockViewed,
  hasEnoughCredits,
  deductCredits,
} from '@features/insights/services/airlockService';
import type { AirlockRecord } from '../../../src/types/airlock';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
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
import { collection, doc, addDoc, getDocs, updateDoc, query, orderBy, limit } from 'firebase/firestore';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockFirestore() {
  return {} as import('firebase/firestore').Firestore;
}


function createMockAirlock(overrides: Partial<AirlockRecord> = {}): AirlockRecord {
  return {
    id: 'airlock-1',
    userId: 'user-123',
    title: 'Tu café de la semana',
    message: 'Gastaste $45 en café esta semana.',
    emoji: '☕',
    recommendation: 'Reduce tu consumo de café.',
    createdAt: createMockTimestamp(),
    viewedAt: null,
    ...overrides,
  };
}

// ============================================================================
// hasEnoughCredits Tests
// ============================================================================

describe('hasEnoughCredits', () => {
  it('returns true when credits >= cost', () => {
    expect(hasEnoughCredits(5, 1)).toBe(true);
    expect(hasEnoughCredits(1, 1)).toBe(true);
    expect(hasEnoughCredits(10, 5)).toBe(true);
  });

  it('returns false when credits < cost', () => {
    expect(hasEnoughCredits(0, 1)).toBe(false);
    expect(hasEnoughCredits(2, 5)).toBe(false);
  });

  it('uses default cost of 1 when not specified', () => {
    expect(hasEnoughCredits(1)).toBe(true);
    expect(hasEnoughCredits(0)).toBe(false);
  });
});

// ============================================================================
// deductCredits Tests
// ============================================================================

describe('deductCredits', () => {
  it('deducts the specified cost from credits', () => {
    expect(deductCredits(10, 1)).toBe(9);
    expect(deductCredits(5, 3)).toBe(2);
  });

  it('uses default cost of 1 when not specified', () => {
    expect(deductCredits(5)).toBe(4);
  });

  it('never returns negative balance', () => {
    expect(deductCredits(0, 1)).toBe(0);
    expect(deductCredits(1, 5)).toBe(0);
  });
});

// ============================================================================
// generateAirlock Tests
// ============================================================================

describe('generateAirlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves airlock to Firestore and returns the created record', async () => {
    const db = createMockFirestore();
    const userId = 'user-123';
    const appId = 'test-app';

    // Mock addDoc to return a document reference
    (addDoc as Mock).mockResolvedValueOnce({ id: 'new-airlock-id' });

    const result = await generateAirlock(db, userId, appId);

    // Verify collection path
    expect(collection).toHaveBeenCalledWith(
      db,
      `artifacts/${appId}/users/${userId}/airlocks`
    );

    // Verify addDoc was called with correct data structure
    expect(addDoc).toHaveBeenCalled();
    const addDocArgs = (addDoc as Mock).mock.calls[0][1];
    expect(addDocArgs).toMatchObject({
      userId,
      createdAt: 'server-timestamp',
      viewedAt: null,
    });
    expect(addDocArgs.title).toBeDefined();
    expect(addDocArgs.message).toBeDefined();
    expect(addDocArgs.emoji).toBeDefined();

    // Verify returned result
    expect(result.id).toBe('new-airlock-id');
    expect(result.userId).toBe(userId);
    expect(result.title).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.emoji).toBeDefined();
  });

  it('generates different insights on multiple calls', async () => {
    const db = createMockFirestore();
    const userId = 'user-123';
    const appId = 'test-app';

    let callCount = 0;
    (addDoc as Mock).mockImplementation(() => {
      callCount++;
      return Promise.resolve({ id: `airlock-${callCount}` });
    });

    // Generate multiple airlocks and collect titles
    const titles = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const result = await generateAirlock(db, userId, appId);
      titles.add(result.title);
    }

    // After 8 generations, we should have multiple unique titles
    // (due to the random selection mechanism)
    expect(titles.size).toBeGreaterThan(1);
  });
});

// ============================================================================
// getUserAirlocks Tests
// ============================================================================

describe('getUserAirlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no airlocks exist', async () => {
    const db = createMockFirestore();

    (getDocs as Mock).mockResolvedValueOnce({
      docs: [],
    });

    const result = await getUserAirlocks(db, 'user-123', 'test-app');

    expect(result).toEqual([]);
  });

  it('returns airlocks sorted by createdAt desc', async () => {
    const db = createMockFirestore();
    const userId = 'user-123';
    const appId = 'test-app';

    const mockAirlocks = [
      { id: 'airlock-1', data: () => createMockAirlock({ id: 'airlock-1' }) },
      { id: 'airlock-2', data: () => createMockAirlock({ id: 'airlock-2' }) },
    ];

    (getDocs as Mock).mockResolvedValueOnce({
      docs: mockAirlocks,
    });

    const result = await getUserAirlocks(db, userId, appId);

    // Verify query was built with orderBy and limit
    expect(query).toHaveBeenCalled();
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limit).toHaveBeenCalledWith(50); // MAX_AIRLOCK_HISTORY

    // Verify results
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('airlock-1');
  });

  it('maps Firestore documents to AirlockRecord correctly', async () => {
    const db = createMockFirestore();

    const mockData = {
      userId: 'user-123',
      title: 'Test Title',
      message: 'Test Message',
      emoji: '🎯',
      recommendation: 'Test recommendation',
      createdAt: createMockTimestamp(),
      viewedAt: null,
    };

    (getDocs as Mock).mockResolvedValueOnce({
      docs: [
        { id: 'airlock-test', data: () => mockData },
      ],
    });

    const result = await getUserAirlocks(db, 'user-123', 'test-app');

    expect(result[0]).toMatchObject({
      id: 'airlock-test',
      ...mockData,
    });
  });
});

// ============================================================================
// markAirlockViewed Tests
// ============================================================================

describe('markAirlockViewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the viewedAt field to serverTimestamp', async () => {
    const db = createMockFirestore();
    const userId = 'user-123';
    const appId = 'test-app';
    const airlockId = 'airlock-1';

    (updateDoc as Mock).mockResolvedValueOnce(undefined);

    await markAirlockViewed(db, userId, appId, airlockId);

    // Verify doc path
    expect(doc).toHaveBeenCalledWith(
      db,
      `artifacts/${appId}/users/${userId}/airlocks`,
      airlockId
    );

    // Verify updateDoc was called with viewedAt
    expect(updateDoc).toHaveBeenCalled();
    const updateArgs = (updateDoc as Mock).mock.calls[0][1];
    expect(updateArgs).toEqual({
      viewedAt: 'server-timestamp',
    });
  });
});

// ============================================================================
// Integration-style Tests
// ============================================================================

describe('Airlock Service Integration', () => {
  it('AC3: validates credit check before generation flow', () => {
    // User starts with 10 credits
    let credits = 10;

    // Check if can generate
    expect(hasEnoughCredits(credits, 1)).toBe(true);

    // Deduct credit
    credits = deductCredits(credits, 1);
    expect(credits).toBe(9);

    // Can still generate more
    expect(hasEnoughCredits(credits, 1)).toBe(true);

    // Deduct remaining
    credits = deductCredits(credits, 9);
    expect(credits).toBe(0);

    // Now cannot generate
    expect(hasEnoughCredits(credits, 1)).toBe(false);
  });

  it('AC5: mock generation produces valid airlock structure', async () => {
    const db = createMockFirestore();
    (addDoc as Mock).mockResolvedValueOnce({ id: 'test-id' });

    const airlock = await generateAirlock(db, 'user-123', 'test-app');

    // Verify required fields for AC5
    expect(airlock.id).toBeDefined();
    expect(airlock.userId).toBe('user-123');
    expect(airlock.title).toBeDefined();
    expect(typeof airlock.title).toBe('string');
    expect(airlock.title.length).toBeGreaterThan(0);
    expect(airlock.message).toBeDefined();
    expect(typeof airlock.message).toBe('string');
    expect(airlock.emoji).toBeDefined();
    expect(airlock.viewedAt).toBeNull();
  });
});
