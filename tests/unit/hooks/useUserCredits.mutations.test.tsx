/**
 * Tests for useUserCredits hook — mutation operations
 *
 * Covers: deductCredits, deductSuperCredits, addCredits, addSuperCredits
 * Split from useUserCredits.test.tsx (TD-15b-28)
 *
 * Story 15b-3d: Migrated from userCreditsService mocks to ICreditsRepository mock.
 * Tests transactional deduction/addition via repository.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserCredits } from '../../../src/hooks/useUserCredits';
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

describe('useUserCredits — mutations', () => {
  const mockUser = { uid: 'test-user-123' } as any;
  const initialCredits = { remaining: 100, used: 5, superRemaining: 10, superUsed: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    (mockRepo.get as ReturnType<typeof vi.fn>).mockResolvedValue(initialCredits);
    (mockRepo.save as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  describe('deductCredits', () => {
    it('calls repo.deduct (transactional) instead of repo.save (TD-10)', async () => {
      const deductedResult = { remaining: 99, used: 6, superRemaining: 10, superUsed: 0 };
      (mockRepo.deduct as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductCredits(1);
      });

      expect(deductResult!).toBe(true);
      expect(mockRepo.deduct).toHaveBeenCalledWith(1);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('returns false when insufficient credits (from transaction)', async () => {
      (mockRepo.deduct as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Insufficient credits'));

      const { result } = renderHook(() => useUserCredits(mockUser));

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
      (mockRepo.deduct as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network unavailable'));

      const { result } = renderHook(() => useUserCredits(mockUser));

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
    it('calls repo.deductSuper (transactional) (TD-10)', async () => {
      const deductedResult = { remaining: 100, used: 5, superRemaining: 9, superUsed: 1 };
      (mockRepo.deductSuper as ReturnType<typeof vi.fn>).mockResolvedValueOnce(deductedResult);

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deductResult: boolean;
      await act(async () => {
        deductResult = await result.current.deductSuperCredits(1);
      });

      expect(deductResult!).toBe(true);
      expect(mockRepo.deductSuper).toHaveBeenCalledWith(1);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(deductedResult);
    });

    it('returns false when insufficient super credits', async () => {
      (mockRepo.deductSuper as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Insufficient super credits'));

      const { result } = renderHook(() => useUserCredits(mockUser));

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
    it('calls repo.add (transactional) instead of repo.save (TD-13)', async () => {
      const addedResult = { remaining: 110, used: 5, superRemaining: 10, superUsed: 0 };
      (mockRepo.add as ReturnType<typeof vi.fn>).mockResolvedValueOnce(addedResult);

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addCredits(10);
      });

      expect(mockRepo.add).toHaveBeenCalledWith(10);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(addedResult);
    });

    it('throws user-safe error on failure (TD-13, TD-15b-28)', async () => {
      (mockRepo.add as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Amount must be a positive integer'));

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addCredits(-1);
        })
      ).rejects.toThrow('Unable to add credits. Please try again later.');
    });
  });

  describe('addSuperCredits', () => {
    it('calls repo.addSuper (transactional) instead of repo.save (TD-13)', async () => {
      const addedResult = { remaining: 100, used: 5, superRemaining: 15, superUsed: 0 };
      (mockRepo.addSuper as ReturnType<typeof vi.fn>).mockResolvedValueOnce(addedResult);

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSuperCredits(5);
      });

      expect(mockRepo.addSuper).toHaveBeenCalledWith(5);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(result.current.credits).toEqual(addedResult);
    });

    it('throws user-safe error on failure (TD-13, TD-15b-28)', async () => {
      (mockRepo.addSuper as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Amount must be a positive integer'));

      const { result } = renderHook(() => useUserCredits(mockUser));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addSuperCredits(-1);
        })
      ).rejects.toThrow('Unable to add credits. Please try again later.');
    });
  });
});
