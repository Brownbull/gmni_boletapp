/**
 * Tests for useUserCredits hook
 *
 * Story 14.24: Persistent Transaction State
 * Story 15-TD-10: Credits Consumer Transaction Safety
 * Tests credit reserve/confirm/refund pattern and transactional deduction.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserCredits } from '../../../src/hooks/useUserCredits';
import { DEFAULT_CREDITS } from '../../../src/types/scan';

// Mock Firebase services
const mockGetUserCredits = vi.fn();
const mockSaveUserCredits = vi.fn();
const mockDeductAndSaveCredits = vi.fn();
const mockDeductAndSaveSuperCredits = vi.fn();

vi.mock('../../../src/services/userCreditsService', () => ({
  getUserCredits: (...args: unknown[]) => mockGetUserCredits(...args),
  saveUserCredits: (...args: unknown[]) => mockSaveUserCredits(...args),
  deductAndSaveCredits: (...args: unknown[]) => mockDeductAndSaveCredits(...args),
  deductAndSaveSuperCredits: (...args: unknown[]) => mockDeductAndSaveSuperCredits(...args),
}));

describe('useUserCredits', () => {
  const mockUser = { uid: 'test-user-123' } as any;
  const mockServices = { db: {}, appId: 'test-app' };
  const initialCredits = { remaining: 100, used: 5, superRemaining: 10, superUsed: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetUserCredits.mockResolvedValue(initialCredits);
    mockSaveUserCredits.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('returns default credits when no user', () => {
      const { result } = renderHook(() => useUserCredits(null, null));

      expect(result.current.credits).toEqual(DEFAULT_CREDITS);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
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
      expect(result.current.error).toBeNull();
    });

    it('sets error state when getUserCredits throws', async () => {
      mockGetUserCredits.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
      // Falls back to default credits
      expect(result.current.credits).toEqual(DEFAULT_CREDITS);
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
      // Should NOT have called any persistence function
      expect(mockSaveUserCredits).not.toHaveBeenCalled();
      expect(mockDeductAndSaveCredits).not.toHaveBeenCalled();
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
    it('uses transactional deductAndSaveCredits for normal credits (TD-10)', async () => {
      const deductedResult = { remaining: 99, used: 6, superRemaining: 10, superUsed: 0 };
      mockDeductAndSaveCredits.mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reserve
      act(() => {
        result.current.reserveCredits(1, 'normal');
      });

      // Confirm — should call deductAndSaveCredits, NOT saveUserCredits
      let confirmResult: boolean;
      await act(async () => {
        confirmResult = await result.current.confirmReservedCredits();
      });

      expect(confirmResult!).toBe(true);
      expect(result.current.hasReservedCredits).toBe(false);
      expect(mockDeductAndSaveCredits).toHaveBeenCalledWith(
        mockServices.db, mockUser.uid, mockServices.appId,
        expect.any(Object), // credits param (deprecated, ignored)
        1 // amount
      );
      expect(mockSaveUserCredits).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('uses transactional deductAndSaveSuperCredits for super credits (TD-10)', async () => {
      const deductedResult = { remaining: 100, used: 5, superRemaining: 9, superUsed: 1 };
      mockDeductAndSaveSuperCredits.mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reserve super credits
      act(() => {
        result.current.reserveCredits(1, 'super');
      });

      // Confirm
      await act(async () => {
        await result.current.confirmReservedCredits();
      });

      expect(mockDeductAndSaveSuperCredits).toHaveBeenCalledWith(
        mockServices.db, mockUser.uid, mockServices.appId,
        expect.any(Object), 1
      );
      expect(mockDeductAndSaveCredits).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('refunds reservation on transaction failure', async () => {
      mockDeductAndSaveCredits.mockRejectedValueOnce(new Error('Insufficient credits'));

      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reserve
      act(() => {
        result.current.reserveCredits(1, 'normal');
      });

      // Confirm — should fail and refund
      let confirmResult: boolean;
      await act(async () => {
        confirmResult = await result.current.confirmReservedCredits();
      });

      expect(confirmResult!).toBe(false);
      expect(result.current.hasReservedCredits).toBe(false);
      // Should restore to original credits (before reservation)
      expect(result.current.credits).toEqual(initialCredits);
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
      expect(mockDeductAndSaveCredits).not.toHaveBeenCalled();
    });
  });

  describe('deductCredits', () => {
    it('calls deductAndSaveCredits (transactional) instead of saveUserCredits (TD-10)', async () => {
      const deductedResult = { remaining: 99, used: 6, superRemaining: 10, superUsed: 0 };
      mockDeductAndSaveCredits.mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductCredits(1);
      });

      expect(deductResult!).toBe(true);
      expect(mockDeductAndSaveCredits).toHaveBeenCalledWith(
        mockServices.db, mockUser.uid, mockServices.appId,
        expect.any(Object), // credits param (deprecated)
        1
      );
      expect(mockSaveUserCredits).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('returns false when insufficient credits (from transaction)', async () => {
      mockDeductAndSaveCredits.mockRejectedValueOnce(new Error('Insufficient credits'));

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

    it('returns false on network error without throwing', async () => {
      mockDeductAndSaveCredits.mockRejectedValueOnce(new Error('Network unavailable'));

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

  describe('deductSuperCredits', () => {
    it('calls deductAndSaveSuperCredits (transactional) (TD-10)', async () => {
      const deductedResult = { remaining: 100, used: 5, superRemaining: 9, superUsed: 1 };
      mockDeductAndSaveSuperCredits.mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductSuperCredits(1);
      });

      expect(deductResult!).toBe(true);
      expect(mockDeductAndSaveSuperCredits).toHaveBeenCalledWith(
        mockServices.db, mockUser.uid, mockServices.appId,
        expect.any(Object), 1
      );
      expect(mockSaveUserCredits).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('returns false when insufficient super credits', async () => {
      mockDeductAndSaveSuperCredits.mockRejectedValueOnce(new Error('Insufficient super credits'));

      const { result } = renderHook(() => useUserCredits(mockUser, mockServices));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductSuperCredits(1);
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
      expect(mockSaveUserCredits).toHaveBeenCalledWith(
        mockServices.db, mockUser.uid, mockServices.appId,
        expect.objectContaining({ remaining: initialCredits.remaining + 10 })
      );
    });
  });
});
