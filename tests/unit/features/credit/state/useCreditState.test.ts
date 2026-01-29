/**
 * Unit tests for useCreditState hook
 * Story 14e-18a: Verify wrapper hook passthrough behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { User } from 'firebase/auth';
import { useCreditState } from '@features/credit';
import { useUserCredits } from '@/hooks/useUserCredits';
import { DEFAULT_CREDITS } from '@/types/scan';

// Mock the source hook
vi.mock('@/hooks/useUserCredits', () => ({
  useUserCredits: vi.fn(),
}));

const mockUseUserCredits = vi.mocked(useUserCredits);

describe('useCreditState', () => {
  const mockUser = { uid: 'test-user-123' } as User;
  const mockServices = { db: {}, appId: 'test-app-id' };

  const mockCredits = {
    remaining: 10,
    used: 5,
    superRemaining: 3,
    superUsed: 2,
  };

  const mockDeductCredits = vi.fn().mockResolvedValue(true);
  const mockDeductSuperCredits = vi.fn().mockResolvedValue(true);
  const mockAddCredits = vi.fn().mockResolvedValue(undefined);
  const mockAddSuperCredits = vi.fn().mockResolvedValue(undefined);
  const mockRefreshCredits = vi.fn().mockResolvedValue(undefined);
  const mockReserveCredits = vi.fn().mockReturnValue(true);
  const mockConfirmReservedCredits = vi.fn().mockResolvedValue(true);
  const mockRefundReservedCredits = vi.fn();

  const mockUseUserCreditsResult = {
    credits: mockCredits,
    loading: false,
    hasReservedCredits: false,
    deductCredits: mockDeductCredits,
    deductSuperCredits: mockDeductSuperCredits,
    addCredits: mockAddCredits,
    addSuperCredits: mockAddSuperCredits,
    refreshCredits: mockRefreshCredits,
    reserveCredits: mockReserveCredits,
    confirmReservedCredits: mockConfirmReservedCredits,
    refundReservedCredits: mockRefundReservedCredits,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserCredits.mockReturnValue(mockUseUserCreditsResult);
  });

  describe('delegation to useUserCredits', () => {
    it('should pass user and services to useUserCredits', () => {
      renderHook(() => useCreditState(mockUser, mockServices));

      expect(mockUseUserCredits).toHaveBeenCalledWith(mockUser, mockServices);
    });

    it('should handle null user', () => {
      renderHook(() => useCreditState(null, mockServices));

      expect(mockUseUserCredits).toHaveBeenCalledWith(null, mockServices);
    });

    it('should handle null services', () => {
      renderHook(() => useCreditState(mockUser, null));

      expect(mockUseUserCredits).toHaveBeenCalledWith(mockUser, null);
    });

    it('should handle both null user and services', () => {
      renderHook(() => useCreditState(null, null));

      expect(mockUseUserCredits).toHaveBeenCalledWith(null, null);
    });
  });

  describe('credit state exposure', () => {
    it('should expose credits from useUserCredits', () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      expect(result.current.credits).toEqual(mockCredits);
    });

    it('should expose loading state', () => {
      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        loading: true,
      });

      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      expect(result.current.loading).toBe(true);
    });

    it('should expose hasReservedCredits', () => {
      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        hasReservedCredits: true,
      });

      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      expect(result.current.hasReservedCredits).toBe(true);
    });
  });

  describe('credit operations', () => {
    it('should expose deductCredits function', async () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      const success = await result.current.deductCredits(1);

      expect(mockDeductCredits).toHaveBeenCalledWith(1);
      expect(success).toBe(true);
    });

    it('should expose deductSuperCredits function', async () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      const success = await result.current.deductSuperCredits(1);

      expect(mockDeductSuperCredits).toHaveBeenCalledWith(1);
      expect(success).toBe(true);
    });

    it('should expose addCredits function', async () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      await result.current.addCredits(5);

      expect(mockAddCredits).toHaveBeenCalledWith(5);
    });

    it('should expose addSuperCredits function', async () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      await result.current.addSuperCredits(3);

      expect(mockAddSuperCredits).toHaveBeenCalledWith(3);
    });

    it('should expose refreshCredits function', async () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      await result.current.refreshCredits();

      expect(mockRefreshCredits).toHaveBeenCalled();
    });
  });

  describe('credit reservation operations', () => {
    it('should expose reserveCredits function', () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      const reserved = result.current.reserveCredits(2, 'normal');

      expect(mockReserveCredits).toHaveBeenCalledWith(2, 'normal');
      expect(reserved).toBe(true);
    });

    it('should expose reserveCredits for super credits', () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      result.current.reserveCredits(1, 'super');

      expect(mockReserveCredits).toHaveBeenCalledWith(1, 'super');
    });

    it('should expose confirmReservedCredits function', async () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      const confirmed = await result.current.confirmReservedCredits();

      expect(mockConfirmReservedCredits).toHaveBeenCalled();
      expect(confirmed).toBe(true);
    });

    it('should expose refundReservedCredits function', () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      result.current.refundReservedCredits();

      expect(mockRefundReservedCredits).toHaveBeenCalled();
    });
  });

  describe('reference stability', () => {
    it('should maintain stable references when credits do not change', () => {
      const { result, rerender } = renderHook(() =>
        useCreditState(mockUser, mockServices)
      );

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // Same reference when no changes
      expect(firstResult).toBe(secondResult);
    });

    it('should update reference when credits change', () => {
      const { result, rerender } = renderHook(() =>
        useCreditState(mockUser, mockServices)
      );

      const firstResult = result.current;

      // Update mock to return new credits
      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        credits: { ...mockCredits, remaining: 9 },
      });

      rerender();
      const secondResult = result.current;

      // Different reference when credits change
      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.credits.remaining).toBe(9);
    });

    it('should update reference when loading state changes', () => {
      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        loading: true,
      });

      const { result, rerender } = renderHook(() =>
        useCreditState(mockUser, mockServices)
      );

      const firstResult = result.current;
      expect(firstResult.loading).toBe(true);

      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        loading: false,
      });

      rerender();
      const secondResult = result.current;

      expect(secondResult.loading).toBe(false);
      expect(firstResult).not.toBe(secondResult);
    });

    it('should update reference when hasReservedCredits changes', () => {
      const { result, rerender } = renderHook(() =>
        useCreditState(mockUser, mockServices)
      );

      const firstResult = result.current;
      expect(firstResult.hasReservedCredits).toBe(false);

      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        hasReservedCredits: true,
      });

      rerender();
      const secondResult = result.current;

      expect(secondResult.hasReservedCredits).toBe(true);
      expect(firstResult).not.toBe(secondResult);
    });
  });

  describe('default state', () => {
    it('should work with default credits when useUserCredits returns defaults', () => {
      mockUseUserCredits.mockReturnValue({
        ...mockUseUserCreditsResult,
        credits: DEFAULT_CREDITS,
      });

      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      expect(result.current.credits).toEqual(DEFAULT_CREDITS);
    });
  });

  describe('type exports', () => {
    it('should return a result matching UseCreditStateResult type', () => {
      const { result } = renderHook(() => useCreditState(mockUser, mockServices));

      // Type check - all expected properties exist
      expect(typeof result.current.credits).toBe('object');
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.hasReservedCredits).toBe('boolean');
      expect(typeof result.current.deductCredits).toBe('function');
      expect(typeof result.current.deductSuperCredits).toBe('function');
      expect(typeof result.current.addCredits).toBe('function');
      expect(typeof result.current.addSuperCredits).toBe('function');
      expect(typeof result.current.refreshCredits).toBe('function');
      expect(typeof result.current.reserveCredits).toBe('function');
      expect(typeof result.current.confirmReservedCredits).toBe('function');
      expect(typeof result.current.refundReservedCredits).toBe('function');
    });
  });
});
