/**
 * Tests for useUserCredits hook
 *
 * Story 14.24: Persistent Transaction State
 * Tests credit reserve/confirm/refund pattern
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserCredits } from '../../../src/hooks/useUserCredits';
import { DEFAULT_CREDITS } from '../../../src/types/scan';

// Mock Firebase services
const mockGetUserCredits = vi.fn();
const mockSaveUserCredits = vi.fn();

vi.mock('../../../src/services/userCreditsService', () => ({
  getUserCredits: (...args: unknown[]) => mockGetUserCredits(...args),
  saveUserCredits: (...args: unknown[]) => mockSaveUserCredits(...args),
}));

describe('useUserCredits', () => {
  const mockUser = { uid: 'test-user-123' } as any;
  const mockServices = { db: {}, appId: 'test-app' };
  const initialCredits = { remaining: 100, used: 5, superRemaining: 10, superUsed: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserCredits.mockResolvedValue(initialCredits);
    mockSaveUserCredits.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('returns default credits when no user', () => {
      const { result } = renderHook(() => useUserCredits(null, null));

      expect(result.current.credits).toEqual(DEFAULT_CREDITS);
      expect(result.current.loading).toBe(false);
    });

    it('loads credits from service when user is provided', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetUserCredits).toHaveBeenCalledWith(
        mockServices.db,
        mockUser.uid,
        mockServices.appId
      );
      expect(result.current.credits).toEqual(initialCredits);
    });
  });

  describe('reserveCredits', () => {
    it('reserves credits without persisting to Firestore', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let reserveResult: boolean;
      act(() => {
        reserveResult = result.current.reserveCredits(1, 'normal');
      });

      expect(reserveResult!).toBe(true);
      expect(result.current.hasReservedCredits).toBe(true);
      // Credits should be deducted locally
      expect(result.current.credits.remaining).toBe(initialCredits.remaining - 1);
      expect(result.current.credits.used).toBe(initialCredits.used + 1);
      // Should NOT have called saveUserCredits (that's the point of reserve)
      expect(mockSaveUserCredits).not.toHaveBeenCalled();
    });

    it('returns false when insufficient credits', async () => {
      mockGetUserCredits.mockResolvedValue({ ...initialCredits, remaining: 0 });
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let reserveResult: boolean;
      act(() => {
        reserveResult = result.current.reserveCredits(1, 'normal');
      });

      expect(reserveResult!).toBe(false);
      expect(result.current.hasReservedCredits).toBe(false);
    });

    it('reserves super credits when type is super', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reserveCredits(1, 'super');
      });

      expect(result.current.credits.superRemaining).toBe(initialCredits.superRemaining - 1);
      expect(result.current.credits.superUsed).toBe(initialCredits.superUsed + 1);
    });
  });

  describe('confirmReservedCredits', () => {
    it('persists reserved credits to Firestore', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First reserve
      act(() => {
        result.current.reserveCredits(1, 'normal');
      });

      // Then confirm
      let confirmResult: boolean;
      await act(async () => {
        confirmResult = await result.current.confirmReservedCredits();
      });

      expect(confirmResult!).toBe(true);
      expect(result.current.hasReservedCredits).toBe(false);
      expect(mockSaveUserCredits).toHaveBeenCalled();
    });

    it('returns false when no reservation exists', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let confirmResult: boolean;
      await act(async () => {
        confirmResult = await result.current.confirmReservedCredits();
      });

      expect(confirmResult!).toBe(false);
    });
  });

  describe('refundReservedCredits', () => {
    it('restores credits to pre-reservation state', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reserve a credit
      act(() => {
        result.current.reserveCredits(1, 'normal');
      });

      // Verify deducted
      expect(result.current.credits.remaining).toBe(initialCredits.remaining - 1);

      // Refund
      act(() => {
        result.current.refundReservedCredits();
      });

      // Should be restored
      expect(result.current.credits.remaining).toBe(initialCredits.remaining);
      expect(result.current.credits.used).toBe(initialCredits.used);
      expect(result.current.hasReservedCredits).toBe(false);
      // Should NOT persist - just local state change
      expect(mockSaveUserCredits).not.toHaveBeenCalled();
    });
  });

  describe('deductCredits', () => {
    it('deducts and persists to Firestore immediately', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductCredits(1);
      });

      expect(deductResult!).toBe(true);
      expect(result.current.credits.remaining).toBe(initialCredits.remaining - 1);
      expect(mockSaveUserCredits).toHaveBeenCalled();
    });

    it('returns false when insufficient credits', async () => {
      mockGetUserCredits.mockResolvedValue({ ...initialCredits, remaining: 0 });
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductCredits(1);
      });

      expect(deductResult!).toBe(false);
    });
  });

  describe('addCredits', () => {
    it('adds credits and persists to Firestore', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addCredits(10);
      });

      expect(result.current.credits.remaining).toBe(initialCredits.remaining + 10);
      expect(mockSaveUserCredits).toHaveBeenCalled();
    });
  });
});
