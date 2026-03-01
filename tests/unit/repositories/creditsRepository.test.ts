/**
 * Unit tests for creditsRepository input validation
 *
 * Story TD-15b-28: Validates that deduct/deductSuper/add/addSuper
 * reject invalid amounts (negative, zero, NaN, Infinity) before
 * delegating to the service layer.
 */

import { describe, it, expect, vi } from 'vitest';
import { createCreditsRepository } from '../../../src/repositories/creditsRepository';
import type { RepositoryContext } from '../../../src/repositories/types';

// Mock the service layer — we only test that validation fires before delegation
vi.mock('../../../src/services/userCreditsService', () => ({
  getUserCredits: vi.fn(),
  saveUserCredits: vi.fn(),
  deductAndSaveCredits: vi.fn(),
  deductAndSaveSuperCredits: vi.fn(),
  addAndSaveCredits: vi.fn(),
  addAndSaveSuperCredits: vi.fn(),
}));

const mockCtx: RepositoryContext = {
  db: {} as any,
  userId: 'test-user',
  appId: 'test-app',
};

describe('creditsRepository input validation', () => {
  const invalidAmounts = [
    { value: -5, label: 'negative number' },
    { value: 0, label: 'zero' },
    { value: NaN, label: 'NaN' },
    { value: Infinity, label: 'Infinity' },
    { value: -Infinity, label: '-Infinity' },
    { value: 0.5, label: 'fractional number' },
  ];

  const methods = ['deduct', 'deductSuper', 'add', 'addSuper'] as const;

  for (const method of methods) {
    describe(method, () => {
      for (const { value, label } of invalidAmounts) {
        it(`rejects ${label} (${value})`, () => {
          const repo = createCreditsRepository(mockCtx);
          expect(() => repo[method](value)).toThrow('Amount must be a positive integer');
        });
      }
    });
  }
});
