/**
 * useInsightProfile Hook Unit Tests
 *
 * Story 10.6: Scan Complete Insight Card
 * Tests for the insight profile hook that manages Firestore profile and local cache.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInsightProfile } from '@features/insights/hooks/useInsightProfile';
import * as insightEngineService from '@features/insights/services/insightEngineService';

// Mock the repository hook — stable reference to avoid infinite re-renders
const mockGetOrCreate = vi.fn();
const mockRecordInsightShown = vi.fn();
const mockTrackTransaction = vi.fn();
const mockDeleteInsight = vi.fn();
const mockDeleteInsights = vi.fn();
const mockRepoInstance = {
  getOrCreate: mockGetOrCreate,
  recordInsightShown: mockRecordInsightShown,
  trackTransaction: mockTrackTransaction,
  deleteInsight: mockDeleteInsight,
  deleteInsights: mockDeleteInsights,
};
vi.mock('@/repositories', () => ({
  useInsightProfileRepository: vi.fn(() => mockRepoInstance),
}));

vi.mock('@features/insights/services/insightEngineService', () => ({
  getLocalCache: vi.fn(),
  setLocalCache: vi.fn(),
  incrementScanCounter: vi.fn(),
}));

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  uid: 'test-user-123',
} as any;

const mockServices = {
  db: {} as any,
  appId: 'test-app',
};

const mockProfile = {
  schemaVersion: 1,
  firstTransactionDate: { toDate: () => new Date('2025-01-01') } as any,
  totalTransactions: 5,
  recentInsights: [],
};

const mockCache = {
  weekdayScanCount: 0,
  weekendScanCount: 0,
  lastCounterReset: '2025-12-19',
  silencedUntil: null,
};

// ============================================================================
// Tests
// ============================================================================

describe('useInsightProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (insightEngineService.getLocalCache as any).mockReturnValue(mockCache);
    (insightEngineService.incrementScanCounter as any).mockImplementation(
      (cache: any) => ({ ...cache, weekdayScanCount: cache.weekdayScanCount + 1 })
    );
    mockGetOrCreate.mockResolvedValue(mockProfile);
    mockRecordInsightShown.mockResolvedValue(undefined);
    mockTrackTransaction.mockResolvedValue(undefined);
    mockDeleteInsight.mockResolvedValue(undefined);
    mockDeleteInsights.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('returns null profile when user is null', () => {
      const { result } = renderHook(() => useInsightProfile(null, null));

      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('returns null profile when services is null', () => {
      const { result } = renderHook(() => useInsightProfile(mockUser, null));

      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('loads profile when user and services are provided', async () => {
      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(mockGetOrCreate).toHaveBeenCalled();
    });

    it('loads local cache on initialization', () => {
      renderHook(() => useInsightProfile(mockUser, mockServices));

      expect(insightEngineService.getLocalCache).toHaveBeenCalled();
    });
  });

  describe('recordShown', () => {
    it('records insight shown and refreshes profile', async () => {
      const updatedProfile = { ...mockProfile, recentInsights: [{ insightId: 'test', shownAt: {} as any }] };
      mockGetOrCreate
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(updatedProfile);

      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordShown('test_insight', 'tx_123');
      });

      expect(mockRecordInsightShown).toHaveBeenCalledWith(
        'test_insight',
        'tx_123',
        undefined  // fullInsight parameter is optional
      );
    });

    // Story 10a.5: Verify full insight content is passed through to repository
    it('passes full insight content to repository for history storage', async () => {
      const updatedProfile = {
        ...mockProfile,
        recentInsights: [{
          insightId: 'merchant_frequency',
          shownAt: {} as any,
          title: 'Visita frecuente',
          message: '3ra vez en Jumbo este mes',
          icon: 'Repeat',
          category: 'ACTIONABLE',
        }],
      };
      mockGetOrCreate
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(updatedProfile);

      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fullInsight = {
        title: 'Visita frecuente',
        message: '3ra vez en Jumbo este mes',
        icon: 'Repeat',
        category: 'ACTIONABLE',
      };

      await act(async () => {
        await result.current.recordShown('merchant_frequency', 'tx_456', fullInsight);
      });

      expect(mockRecordInsightShown).toHaveBeenCalledWith(
        'merchant_frequency',
        'tx_456',
        fullInsight
      );
    });

    it('does nothing when user or services are null', async () => {
      const { result } = renderHook(() => useInsightProfile(null, null));

      await act(async () => {
        await result.current.recordShown('test_insight');
      });

      expect(mockRecordInsightShown).not.toHaveBeenCalled();
    });
  });

  describe('trackTransaction', () => {
    it('tracks transaction and refreshes profile', async () => {
      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const txDate = new Date('2025-12-19');
      await act(async () => {
        await result.current.trackTransaction(txDate);
      });

      expect(mockTrackTransaction).toHaveBeenCalledWith(txDate);
    });

    it('does nothing when user or services are null', async () => {
      const { result } = renderHook(() => useInsightProfile(null, null));

      await act(async () => {
        await result.current.trackTransaction(new Date());
      });

      expect(mockTrackTransaction).not.toHaveBeenCalled();
    });
  });

  describe('incrementCounter', () => {
    it('increments scan counter and updates cache', async () => {
      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.cache.weekdayScanCount;

      act(() => {
        result.current.incrementCounter();
      });

      expect(insightEngineService.incrementScanCounter).toHaveBeenCalled();
      expect(insightEngineService.setLocalCache).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles profile load error gracefully', async () => {
      mockGetOrCreate.mockRejectedValue(new Error('Load failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load insight profile:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles recordShown error gracefully', async () => {
      mockRecordInsightShown.mockRejectedValue(new Error('Record failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useInsightProfile(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordShown('test_insight');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to record insight shown:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
