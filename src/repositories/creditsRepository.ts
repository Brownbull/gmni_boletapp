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
  save(credits: UserCredits): Promise<void>;
  deduct(currentCredits: UserCredits, amount: number): Promise<UserCredits>;
  deductSuper(currentCredits: UserCredits, amount: number): Promise<UserCredits>;
}

// =============================================================================
// Firestore Implementation
// =============================================================================

export function createCreditsRepository(ctx: RepositoryContext): ICreditsRepository {
  const { db, userId, appId } = ctx;
  return {
    get: () => getUserCredits(db, userId, appId),
    save: (credits) => saveUserCredits(db, userId, appId, credits),
    deduct: (current, amount) => deductAndSaveCredits(db, userId, appId, current, amount),
    deductSuper: (current, amount) => deductAndSaveSuperCredits(db, userId, appId, current, amount),
  };
}
