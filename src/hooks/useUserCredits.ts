/**
 * useUserCredits Hook
 *
 * React hook for managing user scan credits with Firestore persistence.
 * Credits persist across logins and are only modified by scanning receipts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserCredits, DEFAULT_CREDITS } from '../types/scan';
import {
  getUserCredits,
  saveUserCredits,
  deductAndSaveCredits,
  deductAndSaveSuperCredits,
} from '../services/userCreditsService';

interface UseUserCreditsResult {
  /** Current user credits (both normal and super) */
  credits: UserCredits;
  /** Loading state */
  loading: boolean;
  /** Error from loading credits (null if no error) */
  error: Error | null;
  /** Whether credits are currently reserved (pending confirmation) */
  hasReservedCredits: boolean;
  /** Deduct normal credits (for scanning) */
  deductCredits: (amount: number) => Promise<boolean>;
  /** Deduct super credits (tier 2) */
  deductSuperCredits: (amount: number) => Promise<boolean>;
  /** Add normal credits (for purchases, promotions) */
  addCredits: (amount: number) => Promise<void>;
  /** Add super credits (tier 2) */
  addSuperCredits: (amount: number) => Promise<void>;
  /** Force refresh credits from Firestore (e.g., after admin changes) */
  refreshCredits: () => Promise<void>;
  /**
   * Story 14.24: Reserve credits locally without persisting to Firestore.
   * Used when scan starts - UI shows deducted but not saved to server.
   * Must call confirmReservedCredits on success or refundReservedCredits on failure.
   */
  reserveCredits: (amount: number, type?: 'normal' | 'super') => boolean;
  /**
   * Story 14.24: Confirm reserved credits by persisting to Firestore.
   * Called after successful scan completion.
   */
  confirmReservedCredits: () => Promise<boolean>;
  /**
   * Story 14.24: Refund reserved credits (restore UI state).
   * Called when scan fails - credit is not charged.
   */
  refundReservedCredits: () => void;
}

interface FirebaseServices {
  db: any; // TODO: TD story — change to Firestore type (requires updating all callers)
  appId: string;
}

/**
 * Hook for managing user scan credits with Firestore persistence
 *
 * @param user - Firebase Auth user
 * @param services - Firebase services (db, appId)
 * @returns User credits and update functions
 */
/**
 * State for tracking reserved credits during scan operations.
 * Story 14.24: Credits are reserved (UI deducted) but not persisted until scan succeeds.
 */
interface ReservedCreditsState {
  /** Amount of credits reserved */
  amount: number;
  /** Type of credits reserved */
  type: 'normal' | 'super';
  /** Credits before reservation (for rollback) */
  originalCredits: UserCredits;
}

export function useUserCredits(
  user: User | null,
  services: FirebaseServices | null
): UseUserCreditsResult {
  const [credits, setCredits] = useState<UserCredits>(DEFAULT_CREDITS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track if we've loaded credits for this user to avoid resetting
  const loadedForUserRef = useRef<string | null>(null);

  // Story 14.24: Track reserved credits (pending confirmation)
  const [reservedCredits, setReservedCredits] = useState<ReservedCreditsState | null>(null);

  // Load credits on mount or when user/services change
  useEffect(() => {
    if (!user || !services) {
      setLoading(false);
      return;
    }

    // Skip if already loaded for this user
    if (loadedForUserRef.current === user.uid) {
      return;
    }

    const loadCredits = async () => {
      setLoading(true);
      setError(null);
      try {
        const userCredits = await getUserCredits(services.db, user.uid, services.appId);
        setCredits(userCredits);
        loadedForUserRef.current = user.uid;
      } catch (err) {
        console.error('Failed to load user credits:', err);
        setError(err instanceof Error ? err : new Error('Failed to load credits'));
      } finally {
        setLoading(false);
      }
    };

    loadCredits();
  }, [user, services]);

  // Refresh credits when app becomes visible (catches admin changes made while in background)
  useEffect(() => {
    if (!user || !services) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh credits when user returns to app
        getUserCredits(services.db, user.uid, services.appId)
          .then((refreshed) => {
            setCredits(refreshed);
            setError(null);
          })
          .catch((err) => {
            console.error('Failed to refresh credits on visibility change:', err);
            setError(err instanceof Error ? err : new Error('Failed to refresh credits'));
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, services]);

  // Deduct normal credits (for scanning receipts)
  // Uses transactional deductAndSaveCredits to prevent TOCTOU overdrafts (TD-10)
  const deductCredits = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!user || !services) return false;

      try {
        const updatedCredits = await deductAndSaveCredits(
          services.db, user.uid, services.appId, credits, amount
        );
        setCredits(updatedCredits);
        return true;
      } catch (error) {
        // 'Insufficient credits' or 'Amount must be a positive integer' are expected
        if (error instanceof Error && error.message === 'Insufficient credits') {
          return false;
        }
        console.error('Failed to deduct credits:', error);
        return false;
      }
    },
    [user, services, credits]
  );

  // Deduct super credits (tier 2)
  // Uses transactional deductAndSaveSuperCredits to prevent TOCTOU overdrafts (TD-10)
  const deductSuperCredits = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!user || !services) return false;

      try {
        const updatedCredits = await deductAndSaveSuperCredits(
          services.db, user.uid, services.appId, credits, amount
        );
        setCredits(updatedCredits);
        return true;
      } catch (error) {
        if (error instanceof Error && error.message === 'Insufficient super credits') {
          return false;
        }
        console.error('Failed to deduct super credits:', error);
        return false;
      }
    },
    [user, services, credits]
  );

  // Add normal credits (for purchases, promotions, etc.)
  const addCredits = useCallback(
    async (amount: number): Promise<void> => {
      if (!user || !services) return;
      if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
        throw new Error('Amount must be a positive integer');
      }

      // Optimistic update
      const newCredits: UserCredits = {
        remaining: credits.remaining + amount,
        used: credits.used,
        superRemaining: credits.superRemaining,
        superUsed: credits.superUsed,
      };
      setCredits(newCredits);

      try {
        await saveUserCredits(services.db, user.uid, services.appId, newCredits);
      } catch (error) {
        console.error('Failed to save credits after addition:', error);
        // Revert on error — getUserCredits now throws, so catch the recovery too
        try {
          const savedCredits = await getUserCredits(services.db, user.uid, services.appId);
          setCredits(savedCredits);
        } catch {
          // Network fully down — revert to pre-optimistic state
          setCredits(credits);
        }
      }
    },
    [user, services, credits]
  );

  // Add super credits (for purchases, promotions, etc.)
  const addSuperCredits = useCallback(
    async (amount: number): Promise<void> => {
      if (!user || !services) return;
      if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
        throw new Error('Amount must be a positive integer');
      }

      // Optimistic update
      const newCredits: UserCredits = {
        remaining: credits.remaining,
        used: credits.used,
        superRemaining: credits.superRemaining + amount,
        superUsed: credits.superUsed,
      };
      setCredits(newCredits);

      try {
        await saveUserCredits(services.db, user.uid, services.appId, newCredits);
      } catch (error) {
        console.error('Failed to save super credits after addition:', error);
        // Revert on error — getUserCredits now throws, so catch the recovery too
        try {
          const savedCredits = await getUserCredits(services.db, user.uid, services.appId);
          setCredits(savedCredits);
        } catch {
          // Network fully down — revert to pre-optimistic state
          setCredits(credits);
        }
      }
    },
    [user, services, credits]
  );

  // Force refresh credits from Firestore (e.g., after admin changes or app resume)
  const refreshCredits = useCallback(async (): Promise<void> => {
    if (!user || !services) return;

    setLoading(true);
    try {
      const userCredits = await getUserCredits(services.db, user.uid, services.appId);
      setCredits(userCredits);
    } catch (error) {
      console.error('Failed to refresh user credits:', error);
    } finally {
      setLoading(false);
    }
  }, [user, services]);

  /**
   * Story 14.24: Reserve credits locally without persisting to Firestore.
   * UI will show the deducted amount, but Firestore is not updated until confirmReservedCredits.
   * Returns true if reservation succeeded, false if insufficient credits.
   */
  const reserveCredits = useCallback(
    (amount: number, type: 'normal' | 'super' = 'normal'): boolean => {
      // Check if sufficient credits
      const available = type === 'super' ? credits.superRemaining : credits.remaining;
      if (available < amount) {
        return false;
      }

      // If there's already a reservation, refund it first (shouldn't happen normally)
      if (reservedCredits) {
        console.warn('reserveCredits called with existing reservation - refunding first');
        setCredits(reservedCredits.originalCredits);
      }

      // Store original credits for potential rollback
      const originalCredits = { ...credits };

      // Optimistically deduct from local state (UI shows deducted amount)
      const newCredits: UserCredits =
        type === 'super'
          ? {
              remaining: credits.remaining,
              used: credits.used,
              superRemaining: credits.superRemaining - amount,
              superUsed: credits.superUsed + amount,
            }
          : {
              remaining: credits.remaining - amount,
              used: credits.used + amount,
              superRemaining: credits.superRemaining,
              superUsed: credits.superUsed,
            };

      setCredits(newCredits);
      setReservedCredits({ amount, type, originalCredits });

      return true;
    },
    [credits, reservedCredits]
  );

  /**
   * Story 14.24: Confirm reserved credits by persisting to Firestore.
   * Called after successful scan completion.
   * TD-10: Uses transactional deduction to prevent TOCTOU overdrafts.
   */
  const confirmReservedCredits = useCallback(async (): Promise<boolean> => {
    if (!user || !services) {
      console.error('confirmReservedCredits: no user or services');
      return false;
    }

    if (!reservedCredits) {
      console.warn('confirmReservedCredits called without reservation');
      return false;
    }

    try {
      // Use transactional deduction — reads fresh balance inside transaction
      const deductFn = reservedCredits.type === 'super'
        ? deductAndSaveSuperCredits
        : deductAndSaveCredits;
      const updatedCredits = await deductFn(
        services.db, user.uid, services.appId, credits, reservedCredits.amount
      );
      setCredits(updatedCredits);
      setReservedCredits(null);
      return true;
    } catch (error) {
      console.error('Failed to confirm reserved credits:', error);
      // Refund: restore pre-reservation state
      setCredits(reservedCredits.originalCredits);
      setReservedCredits(null);
      return false;
    }
  }, [user, services, credits, reservedCredits]);

  /**
   * Story 14.24: Refund reserved credits (restore UI state).
   * Called when scan fails - credit is not charged.
   */
  const refundReservedCredits = useCallback((): void => {
    if (!reservedCredits) {
      console.warn('refundReservedCredits called without reservation');
      return;
    }

    // Restore original credits (before reservation)
    setCredits(reservedCredits.originalCredits);
    setReservedCredits(null);
  }, [reservedCredits]);

  return {
    credits,
    loading,
    error,
    hasReservedCredits: reservedCredits !== null,
    deductCredits,
    deductSuperCredits,
    addCredits,
    addSuperCredits,
    refreshCredits,
    reserveCredits,
    confirmReservedCredits,
    refundReservedCredits,
  };
}
