/**
 * Tests for useUserCredits hook — initialization and reservation
 *
 * Covers: initialization, reserveCredits, confirmReservedCredits, refundReservedCredits
 * Mutation tests (deduct/add) split to useUserCredits.mutations.test.tsx (TD-15b-28)
 *
 * Story 14.24: Persistent Transaction State
 * Story 15-TD-10: Credits Consumer Transaction Safety
 * Story 15b-3d: Migrated from userCreditsService mocks to ICreditsRepository mock.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserCredits } from '../../../src/hooks/useUserCredits';
import { DEFAULT_CREDITS } from '../../../src/types/scan';
import type { ICreditsRepository } from '../../../src/repositories/creditsRepository';

// Mock the repository hook
const mockRepo: ICreditsRepository = {
  get: vi.fn(),
  save: vi.fn(),
  deduct: vi.fn(),
  deductSuper: vi.fn(),
  add: vi.fn(),
  addSuper: vi.fn(),
};

vi.mock('../../../src/repositories/hooks', () => ({
  useCreditsRepository: () => mockRepo,
}));

describe('useUserCredits', () => {
  const mockUser = { uid: 'test-user-123' } as any;
  const initialCredits = { remaining: 100, used: 5, superRemaining: 10, superUsed: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    (mockRepo.get as ReturnType<typeof vi.fn>).mockResolvedValue(initialCredits);
    (mockRepo.save as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('returns default credits when no user', () => {
      const { result } = renderHook(() => useUserCredits(null));

      expect(result.current.credits).toEqual(DEFAULT_CREDITS);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('loads credits from repository when user is provided', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRepo.get).toHaveBeenCalled();
      expect(result.current.credits).toEqual(initialCredits);
      expect(result.current.error).toBeNull();
    });

    it('sets user-safe error when repo.get throws', async () => {
      (mockRepo.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('permission-denied'));
      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Unable to load credits. Please try again later.');
      // Falls back to default credits
      expect(result.current.credits).toEqual(DEFAULT_CREDITS);
    });
  });

  describe('reserveCredits', () => {
    it('reserves credits without persisting to Firestore', async () => {
      const { result } = renderHook(() => useUserCredits(mockUser));

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
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockRepo.deduct).not.toHaveBeenCalled();
    });

    it('returns false when insufficient credits', async () => {
      (mockRepo.get as ReturnType<typeof vi.fn>).mockResolvedValue({ ...initialCredits, remaining: 0 });
      const { result } = renderHook(() => useUserCredits(mockUser));

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
      const { result } = renderHook(() => useUserCredits(mockUser));

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
    it('uses transactional repo.deduct for normal credits (TD-10)', async () => {
      const deductedResult = { remaining: 99, used: 6, superRemaining: 10, superUsed: 0 };
      (mockRepo.deduct as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Reserve
      act(() => {
        result.current.reserveCredits(1, 'normal');
      });

      // Confirm — should call repo.deduct, NOT repo.save
      let confirmResult: boolean;
      await act(async () => {
        confirmResult = await result.current.confirmReservedCredits();
      });

      expect(confirmResult!).toBe(true);
      expect(result.current.hasReservedCredits).toBe(false);
      expect(mockRepo.deduct).toHaveBeenCalledWith(1);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('uses transactional repo.deductSuper for super credits (TD-10)', async () => {
      const deductedResult = { remaining: 100, used: 5, superRemaining: 9, superUsed: 1 };
      (mockRepo.deductSuper as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser));

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

      expect(mockRepo.deductSuper).toHaveBeenCalledWith(1);
      expect(mockRepo.deduct).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('refunds reservation on transaction failure', async () => {
      (mockRepo.deduct as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Insufficient credits'));

      const { result } = renderHook(() => useUserCredits(mockUser));

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
      const { result } = renderHook(() => useUserCredits(mockUser));

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
      const { result } = renderHook(() => useUserCredits(mockUser));

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
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(mockRepo.deduct).not.toHaveBeenCalled();
    });
  });
});
