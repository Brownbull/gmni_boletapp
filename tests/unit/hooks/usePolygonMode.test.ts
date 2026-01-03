/**
 * usePolygonMode Hook Tests
 *
 * Story 14.6: Polygon Dual Mode
 * Epic 14: Core Implementation
 *
 * Tests for the hook that manages polygon mode state,
 * persistence, and data aggregation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePolygonMode,
  aggregateByMerchantCategory,
  aggregateByItemGroup,
} from '../../../src/hooks/usePolygonMode';
import type { Transaction } from '../../../src/types/transaction';

// Mock localStorage
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

describe('usePolygonMode', () => {
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
    vi.clearAllMocks();
  });

  describe('Mode state management', () => {
    it('returns categories as default mode', () => {
      const { result } = renderHook(() => usePolygonMode());

      expect(result.current.mode).toBe('categories');
    });

    it('updates mode when setMode is called', () => {
      const { result } = renderHook(() => usePolygonMode());

      act(() => {
        result.current.setMode('groups');
      });

      expect(result.current.mode).toBe('groups');
    });

    it('toggles between modes with toggleMode', () => {
      const { result } = renderHook(() => usePolygonMode());

      expect(result.current.mode).toBe('categories');

      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe('groups');

      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe('categories');
    });
  });

  describe('AC #5: Mode persistence in localStorage', () => {
    it('saves mode to localStorage on change', () => {
      const { result } = renderHook(() => usePolygonMode());

      act(() => {
        result.current.setMode('groups');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'boletapp:polygon-mode',
        'groups'
      );
    });

    it('loads saved mode from localStorage on mount', () => {
      mockStorage['boletapp:polygon-mode'] = 'groups';

      const { result } = renderHook(() => usePolygonMode());

      expect(result.current.mode).toBe('groups');
    });

    it('defaults to categories if localStorage has invalid value', () => {
      mockStorage['boletapp:polygon-mode'] = 'invalid';

      const { result } = renderHook(() => usePolygonMode());

      expect(result.current.mode).toBe('categories');
    });

    it('defaults to categories if localStorage is empty', () => {
      const { result } = renderHook(() => usePolygonMode());

      expect(result.current.mode).toBe('categories');
    });
  });
});

describe('aggregateByMerchantCategory', () => {
  const createTransaction = (
    category: string,
    total: number,
    items: { category?: string; price: number }[] = []
  ): Transaction => ({
    id: `tx-${Math.random()}`,
    date: '2024-01-15',
    merchant: 'Test Merchant',
    category: category as Transaction['category'],
    total,
    items: items.map((item) => ({
      name: 'Test Item',
      price: item.price,
      category: item.category,
    })),
  });

  it('groups transactions by merchant category', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, []),
      createTransaction('Supermarket', 50000, []),
      createTransaction('Restaurant', 75000, []),
    ];

    const result = aggregateByMerchantCategory(transactions);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.name === 'Supermarket')?.amount).toBe(150000);
    expect(result.find((c) => c.name === 'Restaurant')?.amount).toBe(75000);
  });

  it('sorts by amount descending', () => {
    const transactions: Transaction[] = [
      createTransaction('Restaurant', 50000, []),
      createTransaction('Supermarket', 100000, []),
      createTransaction('Transport', 75000, []),
    ];

    const result = aggregateByMerchantCategory(transactions);

    expect(result[0].name).toBe('Supermarket');
    expect(result[1].name).toBe('Transport');
    expect(result[2].name).toBe('Restaurant');
  });

  it('assigns colors to each category', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, []),
      createTransaction('Restaurant', 75000, []),
    ];

    const result = aggregateByMerchantCategory(transactions);

    result.forEach((category) => {
      expect(category.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('handles empty transaction list', () => {
    const result = aggregateByMerchantCategory([]);

    expect(result).toHaveLength(0);
  });

  it('handles transactions with "Other" category', () => {
    const transactions: Transaction[] = [
      createTransaction('Other', 100000, []),
      createTransaction('Other', 50000, []),
    ];

    const result = aggregateByMerchantCategory(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Other');
    expect(result[0].amount).toBe(150000);
  });
});

describe('aggregateByItemGroup', () => {
  const createTransaction = (
    category: string,
    total: number,
    items: { category?: string; price: number }[]
  ): Transaction => ({
    id: `tx-${Math.random()}`,
    date: '2024-01-15',
    merchant: 'Test Merchant',
    category: category as Transaction['category'],
    total,
    items: items.map((item) => ({
      name: 'Test Item',
      price: item.price,
      category: item.category,
    })),
  });

  it('groups items by item category (group)', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, [
        { category: 'Produce', price: 30000 },
        { category: 'Produce', price: 20000 },
        { category: 'Pantry', price: 50000 },
      ]),
    ];

    const result = aggregateByItemGroup(transactions);

    expect(result.find((c) => c.name === 'Produce')?.amount).toBe(50000);
    expect(result.find((c) => c.name === 'Pantry')?.amount).toBe(50000);
  });

  it('aggregates across multiple transactions', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, [
        { category: 'Produce', price: 30000 },
      ]),
      createTransaction('Supermarket', 50000, [
        { category: 'Produce', price: 20000 },
      ]),
    ];

    const result = aggregateByItemGroup(transactions);

    expect(result.find((c) => c.name === 'Produce')?.amount).toBe(50000);
  });

  it('sorts by amount descending', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, [
        { category: 'Produce', price: 20000 },
        { category: 'Pantry', price: 50000 },
        { category: 'Beverages', price: 30000 },
      ]),
    ];

    const result = aggregateByItemGroup(transactions);

    expect(result[0].name).toBe('Pantry');
    expect(result[1].name).toBe('Beverages');
    expect(result[2].name).toBe('Produce');
  });

  it('assigns colors to each item group', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, [
        { category: 'Produce', price: 50000 },
        { category: 'Pantry', price: 50000 },
      ]),
    ];

    const result = aggregateByItemGroup(transactions);

    result.forEach((category) => {
      expect(category.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('handles items without category as "Other"', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, [
        { price: 30000 }, // No category
        { category: 'Produce', price: 70000 },
      ]),
    ];

    const result = aggregateByItemGroup(transactions);

    expect(result.find((c) => c.name === 'Other')?.amount).toBe(30000);
    expect(result.find((c) => c.name === 'Produce')?.amount).toBe(70000);
  });

  it('handles empty transaction list', () => {
    const result = aggregateByItemGroup([]);

    expect(result).toHaveLength(0);
  });

  it('handles transactions with no items', () => {
    const transactions: Transaction[] = [
      createTransaction('Supermarket', 100000, []),
    ];

    const result = aggregateByItemGroup(transactions);

    expect(result).toHaveLength(0);
  });
});
