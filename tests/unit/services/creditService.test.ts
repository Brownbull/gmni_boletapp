/**
 * Story 12.4: Credit Warning System - Credit Service Tests
 *
 * Tests for credit sufficiency checking and deduction logic.
 *
 * @see docs/sprint-artifacts/epic12/story-12.4-credit-warning-system.md
 */
import { describe, it, expect } from 'vitest';
import {
  checkCreditSufficiency,
  calculateCreditsRequired,
  deductCredits,
  isLowCreditsWarning,
} from '../../../src/services/creditService';
import type { UserCredits } from '../../../src/types/scan';

describe('creditService', () => {
  describe('checkCreditSufficiency', () => {
    it('should return sufficient when user has enough credits', () => {
      const userCredits: UserCredits = { remaining: 10, used: 5 };
      const result = checkCreditSufficiency(userCredits, 5);

      expect(result.sufficient).toBe(true);
      expect(result.available).toBe(10);
      expect(result.required).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.shortage).toBe(0);
      expect(result.maxProcessable).toBe(5);
    });

    it('should return sufficient when user has exactly enough credits', () => {
      const userCredits: UserCredits = { remaining: 5, used: 10 };
      const result = checkCreditSufficiency(userCredits, 5);

      expect(result.sufficient).toBe(true);
      expect(result.available).toBe(5);
      expect(result.required).toBe(5);
      expect(result.remaining).toBe(0);
      expect(result.shortage).toBe(0);
      expect(result.maxProcessable).toBe(5);
    });

    it('should return insufficient when user does not have enough credits', () => {
      const userCredits: UserCredits = { remaining: 3, used: 12 };
      const result = checkCreditSufficiency(userCredits, 5);

      expect(result.sufficient).toBe(false);
      expect(result.available).toBe(3);
      expect(result.required).toBe(5);
      expect(result.remaining).toBe(0);
      expect(result.shortage).toBe(2);
      expect(result.maxProcessable).toBe(3);
    });

    it('should handle zero available credits', () => {
      const userCredits: UserCredits = { remaining: 0, used: 15 };
      const result = checkCreditSufficiency(userCredits, 3);

      expect(result.sufficient).toBe(false);
      expect(result.available).toBe(0);
      expect(result.required).toBe(3);
      expect(result.remaining).toBe(0);
      expect(result.shortage).toBe(3);
      expect(result.maxProcessable).toBe(0);
    });

    it('should handle zero required credits', () => {
      const userCredits: UserCredits = { remaining: 10, used: 5 };
      const result = checkCreditSufficiency(userCredits, 0);

      expect(result.sufficient).toBe(true);
      expect(result.available).toBe(10);
      expect(result.required).toBe(0);
      expect(result.remaining).toBe(10);
      expect(result.shortage).toBe(0);
      expect(result.maxProcessable).toBe(0);
    });

    it('should handle large batch requests correctly', () => {
      const userCredits: UserCredits = { remaining: 100, used: 0 };
      const result = checkCreditSufficiency(userCredits, 50);

      expect(result.sufficient).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.maxProcessable).toBe(50);
    });
  });

  describe('calculateCreditsRequired', () => {
    it('should return 1 credit per image', () => {
      expect(calculateCreditsRequired(1)).toBe(1);
      expect(calculateCreditsRequired(5)).toBe(5);
      expect(calculateCreditsRequired(10)).toBe(10);
    });

    it('should handle zero images', () => {
      expect(calculateCreditsRequired(0)).toBe(0);
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits correctly when sufficient', () => {
      const currentCredits: UserCredits = { remaining: 10, used: 5 };
      const result = deductCredits(currentCredits, 3);

      expect(result.remaining).toBe(7);
      expect(result.used).toBe(8);
    });

    it('should deduct all credits when amount equals remaining', () => {
      const currentCredits: UserCredits = { remaining: 5, used: 10 };
      const result = deductCredits(currentCredits, 5);

      expect(result.remaining).toBe(0);
      expect(result.used).toBe(15);
    });

    it('should throw error when insufficient credits', () => {
      const currentCredits: UserCredits = { remaining: 3, used: 10 };

      expect(() => deductCredits(currentCredits, 5)).toThrow('Insufficient credits');
    });

    it('should not mutate original credits object', () => {
      const currentCredits: UserCredits = { remaining: 10, used: 5 };
      const result = deductCredits(currentCredits, 3);

      expect(currentCredits.remaining).toBe(10);
      expect(currentCredits.used).toBe(5);
      expect(result).not.toBe(currentCredits);
    });

    it('should handle deducting 1 credit', () => {
      const currentCredits: UserCredits = { remaining: 100, used: 0 };
      const result = deductCredits(currentCredits, 1);

      expect(result.remaining).toBe(99);
      expect(result.used).toBe(1);
    });
  });

  describe('isLowCreditsWarning', () => {
    it('should return true when batch will exhaust all credits', () => {
      expect(isLowCreditsWarning(5, 5)).toBe(true);
    });

    it('should return true when remaining credits are less than 10%', () => {
      // 100 credits, using 95 = 5 remaining = 5% of original
      expect(isLowCreditsWarning(100, 95)).toBe(true);
    });

    it('should return false when remaining credits are more than 10%', () => {
      // 100 credits, using 80 = 20 remaining = 20% of original
      expect(isLowCreditsWarning(100, 80)).toBe(false);
    });

    it('should return true when required exceeds available', () => {
      expect(isLowCreditsWarning(3, 5)).toBe(true);
    });

    it('should return false for small batches with plenty of credits', () => {
      expect(isLowCreditsWarning(50, 3)).toBe(false);
    });

    it('should handle edge case of 0 available credits', () => {
      expect(isLowCreditsWarning(0, 5)).toBe(true);
    });
  });
});
