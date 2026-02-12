/**
 * Credits Repository
 *
 * Story 15-6a: Interface definition.
 * Story 15-6b: Firestore implementation wrapping userCreditsService.ts.
 */

import type { UserCredits } from '@/types/scan';
import type { RepositoryContext } from './types';
import {
  getUserCredits,
  saveUserCredits,
  deductAndSaveCredits,
  deductAndSaveSuperCredits,
} from '@/services/userCreditsService';

// =============================================================================
// Interface
// =============================================================================

export interface ICreditsRepository {
  get(): Promise<UserCredits>;
  /** @deprecated Use transactional methods (deduct, deductSuper) instead. Non-transactional setDoc bypasses TOCTOU safety. */
  save(credits: UserCredits): Promise<void>;
  deduct(amount: number): Promise<UserCredits>;
  deductSuper(amount: number): Promise<UserCredits>;
}

// =============================================================================
// Firestore Implementation
// =============================================================================

export function createCreditsRepository(ctx: RepositoryContext): ICreditsRepository {
  const { db, userId, appId } = ctx;
  return {
    get: () => getUserCredits(db, userId, appId),
    save: (credits) => saveUserCredits(db, userId, appId, credits),
    deduct: (amount) => deductAndSaveCredits(db, userId, appId, amount),
    deductSuper: (amount) => deductAndSaveSuperCredits(db, userId, appId, amount),
  };
}
