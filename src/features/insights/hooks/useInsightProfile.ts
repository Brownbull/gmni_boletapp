/**
 * useInsightProfile Hook
 *
 * Story 10.6: Scan Complete Insight Card
 * Architecture: architecture-epic10-insight-engine.md
 *
 * Manages the user's insight profile from Firestore and local cache.
 * Provides profile data for insight generation and recording.
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { UserInsightProfile, LocalInsightCache, FullInsightContent } from '@/types/insight';
import {
  getOrCreateInsightProfile,
  recordInsightShown,
  trackTransactionForProfile,
  deleteInsight,
  deleteInsights,
} from '../services/insightProfileService';
import {
  getLocalCache,
  setLocalCache,
  incrementScanCounter,
} from '../services/insightEngineService';

interface UseInsightProfileResult {
  profile: UserInsightProfile | null;
  cache: LocalInsightCache;
  loading: boolean;
  /** Record that an insight was shown with full content for history */
  recordShown: (insightId: string, transactionId?: string, fullInsight?: FullInsightContent) => Promise<void>;
  /** Track a new transaction for profile stats */
  trackTransaction: (transactionDate: Date) => Promise<void>;
  /** Increment scan counter and update cache */
  incrementCounter: () => void;
  /** Delete a single insight */
  removeInsight: (insightId: string, shownAtSeconds: number) => Promise<void>;
  /** Delete multiple insights */
  removeInsights: (insights: Array<{ insightId: string; shownAtSeconds: number }>) => Promise<void>;
}

export function useInsightProfile(
  user: User | null,
  services: { db: Firestore; appId: string } | null
): UseInsightProfileResult {
  const [profile, setProfile] = useState<UserInsightProfile | null>(null);
  const [cache, setCache] = useState<LocalInsightCache>(() => getLocalCache());
  const [loading, setLoading] = useState(true);

  // Load profile on mount / user change
  useEffect(() => {
    if (!user || !services) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getOrCreateInsightProfile(services.db, user.uid, services.appId)
      .then((p) => {
        setProfile(p);
      })
      .catch((err) => {
        console.error('Failed to load insight profile:', err);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, services]);

  // Record that an insight was shown with full content for history
  const recordShown = useCallback(
    async (insightId: string, transactionId?: string, fullInsight?: FullInsightContent) => {
      if (!user || !services) return;
      try {
        await recordInsightShown(
          services.db,
          user.uid,
          services.appId,
          insightId,
          transactionId,
          fullInsight
        );
        // Refresh profile to get updated recentInsights
        const updated = await getOrCreateInsightProfile(
          services.db,
          user.uid,
          services.appId
        );
        setProfile(updated);
      } catch (err) {
        console.error('Failed to record insight shown:', err);
      }
    },
    [user, services]
  );

  // Track a transaction for profile stats
  const trackTransaction = useCallback(
    async (transactionDate: Date) => {
      if (!user || !services) return;
      try {
        await trackTransactionForProfile(
          services.db,
          user.uid,
          services.appId,
          transactionDate
        );
        // Refresh profile
        const updated = await getOrCreateInsightProfile(
          services.db,
          user.uid,
          services.appId
        );
        setProfile(updated);
      } catch (err) {
        console.error('Failed to track transaction:', err);
      }
    },
    [user, services]
  );

  // Increment scan counter
  const incrementCounter = useCallback(() => {
    const newCache = incrementScanCounter(cache);
    setCache(newCache);
    setLocalCache(newCache);
  }, [cache]);

  // Delete a single insight
  const removeInsight = useCallback(
    async (insightId: string, shownAtSeconds: number) => {
      if (!user || !services) return;
      try {
        await deleteInsight(
          services.db,
          user.uid,
          services.appId,
          insightId,
          shownAtSeconds
        );
        // Refresh profile to get updated recentInsights
        const updated = await getOrCreateInsightProfile(
          services.db,
          user.uid,
          services.appId
        );
        setProfile(updated);
      } catch (err) {
        console.error('Failed to delete insight:', err);
      }
    },
    [user, services]
  );

  // Delete multiple insights
  const removeInsights = useCallback(
    async (insights: Array<{ insightId: string; shownAtSeconds: number }>) => {
      if (!user || !services) return;
      try {
        await deleteInsights(
          services.db,
          user.uid,
          services.appId,
          insights
        );
        // Refresh profile to get updated recentInsights
        const updated = await getOrCreateInsightProfile(
          services.db,
          user.uid,
          services.appId
        );
        setProfile(updated);
      } catch (err) {
        console.error('Failed to delete insights:', err);
      }
    },
    [user, services]
  );

  return {
    profile,
    cache,
    loading,
    recordShown,
    trackTransaction,
    incrementCounter,
    removeInsight,
    removeInsights,
  };
}
