/**
 * Story 12.4: Credit Warning System - Credit Service Tests
 * Story 14.15 Session 10: Updated for dual credit types (normal + super)
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

// Helper to create UserCredits with defaults
const createCredits = (
  remaining: number,
  used: number,
  superRemaining = 100,
  superUsed = 0
): UserCredits => ({
  remaining,
  used,
  superRemaining,
  superUsed,
});

describe('creditService', () => {
  describe('checkCreditSufficiency', () => {
    describe('normal credits (single scan)', () => {
      it('should return sufficient when user has enough credits', () => {
        const userCredits = createCredits(10, 5);
        const result = checkCreditSufficiency(userCredits, 5);

        expect(result.sufficient).toBe(true);
        expect(result.available).toBe(10);
        expect(result.required).toBe(5);
        expect(result.remaining).toBe(5);
        expect(result.shortage).toBe(0);
        expect(result.maxProcessable).toBe(5);
        expect(result.creditType).toBe('normal');
      });

      it('should return sufficient when user has exactly enough credits', () => {
        const userCredits = createCredits(5, 10);
        const result = checkCreditSufficiency(userCredits, 5);

        expect(result.sufficient).toBe(true);
        expect(result.available).toBe(5);
        expect(result.required).toBe(5);
        expect(result.remaining).toBe(0);
        expect(result.shortage).toBe(0);
        expect(result.maxProcessable).toBe(5);
        expect(result.creditType).toBe('normal');
      });

      it('should return insufficient when user does not have enough credits', () => {
        const userCredits = createCredits(3, 12);
        const result = checkCreditSufficiency(userCredits, 5);

        expect(result.sufficient).toBe(false);
        expect(result.available).toBe(3);
        expect(result.required).toBe(5);
        expect(result.remaining).toBe(0);
        expect(result.shortage).toBe(2);
        expect(result.maxProcessable).toBe(3);
        expect(result.creditType).toBe('normal');
      });

      it('should handle zero available credits', () => {
        const userCredits = createCredits(0, 15);
        const result = checkCreditSufficiency(userCredits, 3);

        expect(result.sufficient).toBe(false);
        expect(result.available).toBe(0);
        expect(result.required).toBe(3);
        expect(result.remaining).toBe(0);
        expect(result.shortage).toBe(3);
        expect(result.maxProcessable).toBe(0);
        expect(result.creditType).toBe('normal');
      });

      it('should handle zero required credits', () => {
        const userCredits = createCredits(10, 5);
        const result = checkCreditSufficiency(userCredits, 0);

        expect(result.sufficient).toBe(true);
        expect(result.available).toBe(10);
        expect(result.required).toBe(0);
        expect(result.remaining).toBe(10);
        expect(result.shortage).toBe(0);
        expect(result.maxProcessable).toBe(0);
        expect(result.creditType).toBe('normal');
      });

      it('should handle large batch requests correctly', () => {
        const userCredits = createCredits(100, 0);
        const result = checkCreditSufficiency(userCredits, 50);

        expect(result.sufficient).toBe(true);
        expect(result.remaining).toBe(50);
        expect(result.maxProcessable).toBe(50);
        expect(result.creditType).toBe('normal');
      });
    });

    // Story 14.15 Session 10: Tests for super credits (batch mode)
    describe('super credits (batch scan)', () => {
      it('should use super credits when isBatch is true', () => {
        const userCredits = createCredits(100, 0, 50, 0);
        const result = checkCreditSufficiency(userCredits, 10, true);

        expect(result.sufficient).toBe(true);
        expect(result.available).toBe(50); // Uses superRemaining
        expect(result.required).toBe(10);
        expect(result.remaining).toBe(40);
        expect(result.creditType).toBe('super');
      });

      it('should return insufficient when super credits are not enough', () => {
        const userCredits = createCredits(100, 0, 5, 10);
        const result = checkCreditSufficiency(userCredits, 10, true);

        expect(result.sufficient).toBe(false);
        expect(result.available).toBe(5); // superRemaining
        expect(result.required).toBe(10);
        expect(result.shortage).toBe(5);
        expect(result.maxProcessable).toBe(5);
        expect(result.creditType).toBe('super');
      });

      it('should use normal credits for normal mode even when less than super', () => {
        const userCredits = createCredits(10, 5, 100, 0);
        const result = checkCreditSufficiency(userCredits, 5, false);

        expect(result.available).toBe(10); // Uses remaining, not superRemaining
        expect(result.creditType).toBe('normal');
      });
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
    describe('normal credits', () => {
      it('should deduct credits correctly when sufficient', () => {
        const currentCredits = createCredits(10, 5, 50, 0);
        const result = deductCredits(currentCredits, 3);

        expect(result.remaining).toBe(7);
        expect(result.used).toBe(8);
        // Super credits unchanged
        expect(result.superRemaining).toBe(50);
        expect(result.superUsed).toBe(0);
      });

      it('should deduct all credits when amount equals remaining', () => {
        const currentCredits = createCredits(5, 10, 50, 0);
        const result = deductCredits(currentCredits, 5);

        expect(result.remaining).toBe(0);
        expect(result.used).toBe(15);
      });

      it('should throw error when insufficient credits', () => {
        const currentCredits = createCredits(3, 10, 50, 0);

        expect(() => deductCredits(currentCredits, 5)).toThrow('Insufficient credits');
      });

      it('should not mutate original credits object', () => {
        const currentCredits = createCredits(10, 5, 50, 0);
        const result = deductCredits(currentCredits, 3);

        expect(currentCredits.remaining).toBe(10);
        expect(currentCredits.used).toBe(5);
        expect(result).not.toBe(currentCredits);
      });

      it('should handle deducting 1 credit', () => {
        const currentCredits = createCredits(100, 0);
        const result = deductCredits(currentCredits, 1);

        expect(result.remaining).toBe(99);
        expect(result.used).toBe(1);
      });
    });

    // Story 14.15 Session 10: Tests for super credit deduction
    describe('super credits', () => {
      it('should deduct super credits when creditType is super', () => {
        const currentCredits = createCredits(100, 0, 50, 10);
        const result = deductCredits(currentCredits, 5, 'super');

        expect(result.superRemaining).toBe(45);
        expect(result.superUsed).toBe(15);
        // Normal credits unchanged
        expect(result.remaining).toBe(100);
        expect(result.used).toBe(0);
      });

      it('should throw error when insufficient super credits', () => {
        const currentCredits = createCredits(100, 0, 3, 10);

        expect(() => deductCredits(currentCredits, 5, 'super')).toThrow('Insufficient super credits');
      });

      it('should deduct all super credits when amount equals remaining', () => {
        const currentCredits = createCredits(100, 0, 10, 5);
        const result = deductCredits(currentCredits, 10, 'super');

        expect(result.superRemaining).toBe(0);
        expect(result.superUsed).toBe(15);
      });
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
