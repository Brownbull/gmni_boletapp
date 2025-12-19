/**
 * Insight Engine Service
 *
 * Story 10.1: InsightEngine Service Interface
 * Architecture: architecture-epic10-insight-engine.md
 * Pattern: Functional module (not class-based) matching existing *Service.ts pattern
 *
 * Key ADRs:
 * - ADR-015: Client-Side Engine (no Cloud Functions dependency)
 * - ADR-016: Hybrid Storage (Firestore + localStorage)
 * - ADR-017: Phase-Based Priority System
 */

import { Transaction } from '../types/transaction';
import {
  Insight,
  InsightRecord,
  UserInsightProfile,
  LocalInsightCache,
  UserPhase,
  PrecomputedAggregates,
  INSIGHT_CACHE_KEY,
  INSIGHT_COOLDOWN_MS,
  PHASE_THRESHOLDS,
} from '../types/insight';
import { generateAllCandidates } from '../utils/insightGenerators';

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main entry point - generates an insight for a transaction.
 * MUST NOT block transaction save (async side-effect pattern).
 *
 * Architecture requirement: This function is called AFTER transaction save,
 * as a fire-and-forget side effect. Failures should never affect the save flow.
 *
 * @param transaction - The transaction that was just saved
 * @param allTransactions - All user transactions for pattern detection
 * @param profile - User's insight profile from Firestore
 * @param cache - Local insight cache from localStorage
 * @returns The selected insight, or fallback if no candidates available
 */
export async function generateInsightForTransaction(
  transaction: Transaction,
  allTransactions: Transaction[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Promise<Insight | null> {
  // Log for debugging (can be enabled with ?insightDebug=true)
  if (isDebugMode()) {
    console.debug('[InsightEngine] generateInsightForTransaction called', {
      transactionId: transaction.id,
      transactionCount: allTransactions.length,
      phase: calculateUserPhase(profile),
    });
  }

  // Story 10.3: Generate all candidates using transaction-intrinsic generators
  // Story 10.4 will add pattern detection generators
  const candidates = generateAllCandidates(transaction, allTransactions);

  if (isDebugMode()) {
    console.debug('[InsightEngine] Candidates generated', {
      count: candidates.length,
      ids: candidates.map((c) => c.id),
    });
  }

  // Story 10.5 will implement full selection algorithm with sprinkle logic
  // For now, use basic priority-based selection with cooldown filtering
  const selected = selectInsight(candidates, profile, cache);

  return selected || getFallbackInsight();
}

// ============================================================================
// Phase Calculation
// ============================================================================

/**
 * Calculates user phase based on profile data.
 * ADR-017: Phase-Based Priority System
 *
 * - WEEK_1: First 7 days - prioritize quirky/fun insights
 * - WEEKS_2_3: Days 8-21 - transition phase
 * - MATURE: Day 22+ - full insight variety
 *
 * @param profile - User's insight profile
 * @returns The current user phase
 */
export function calculateUserPhase(profile: UserInsightProfile): UserPhase {
  if (!profile.firstTransactionDate) {
    return 'WEEK_1';
  }

  const firstDate = profile.firstTransactionDate.toDate();
  const now = new Date();
  const daysSinceFirst = Math.floor(
    (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceFirst <= PHASE_THRESHOLDS.WEEK_1_END) {
    return 'WEEK_1';
  }

  if (daysSinceFirst <= PHASE_THRESHOLDS.WEEKS_2_3_END) {
    return 'WEEKS_2_3';
  }

  return 'MATURE';
}

// ============================================================================
// Selection Algorithm
// ============================================================================

/**
 * Selects the best insight from candidates using phase-based priority.
 * Story 10.5 will implement the full selection algorithm with sprinkle logic.
 *
 * @param candidates - Available insight candidates
 * @param profile - User's insight profile
 * @param cache - Local insight cache
 * @returns Selected insight, or null if no valid candidates
 */
export function selectInsight(
  candidates: Insight[],
  profile: UserInsightProfile,
  _cache: LocalInsightCache
): Insight | null {
  // Stub implementation - returns first candidate
  // Story 10.5 will implement full selection with:
  // - Phase-based priority ordering
  // - Cooldown filtering
  // - Sprinkle distribution (33/66 variety)

  if (candidates.length === 0) {
    return null;
  }

  // Filter out insights on cooldown
  const validCandidates = candidates.filter(
    (candidate) => !checkCooldown(candidate.id, profile.recentInsights)
  );

  if (validCandidates.length === 0) {
    return null;
  }

  // For now, just return highest priority
  return validCandidates.sort((a, b) => b.priority - a.priority)[0];
}

// ============================================================================
// Cooldown Management
// ============================================================================

/**
 * Checks if an insight is on cooldown (shown recently).
 * Default cooldown is 1 week to prevent repetitive insights.
 *
 * @param insightId - The insight identifier to check
 * @param recentInsights - Recent insight records from profile
 * @returns true if insight is on cooldown (should not be shown)
 */
export function checkCooldown(
  insightId: string,
  recentInsights: InsightRecord[]
): boolean {
  const now = Date.now();

  const lastShown = recentInsights.find((record) => record.insightId === insightId);
  if (!lastShown) {
    return false;
  }

  // Defensive: handle corrupted Timestamp from Firestore
  // If toDate() throws or returns invalid data, treat as not on cooldown
  try {
    const shownAt = lastShown.shownAt?.toDate?.()?.getTime?.();
    if (typeof shownAt !== 'number' || isNaN(shownAt)) {
      return false;
    }
    return now - shownAt < INSIGHT_COOLDOWN_MS;
  } catch {
    // Corrupted Timestamp - treat as not on cooldown (allow insight to show)
    return false;
  }
}

// ============================================================================
// Fallback Insight
// ============================================================================

/**
 * Fallback insight when no candidates available.
 * Always returns a valid insight - never show nothing to the user.
 *
 * @returns The "building profile" fallback insight
 */
export function getFallbackInsight(): Insight {
  return {
    id: 'building_profile',
    category: 'QUIRKY_FIRST',
    title: 'Construyendo tu perfil',
    message: 'Con más datos, te mostraremos insights personalizados.',
    icon: 'Sparkles',
    priority: 0,
  };
}

// ============================================================================
// Local Cache Management
// ============================================================================

/**
 * Retrieves the local insight cache from localStorage.
 * Returns default cache if not found or corrupted.
 *
 * @returns The local insight cache
 */
export function getLocalCache(): LocalInsightCache {
  try {
    const cached = localStorage.getItem(INSIGHT_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as LocalInsightCache;

      // Validate required fields
      if (
        typeof parsed.weekdayScanCount === 'number' &&
        typeof parsed.weekendScanCount === 'number' &&
        typeof parsed.lastCounterReset === 'string'
      ) {
        // Check if counters need weekly reset
        return maybeResetCounters(parsed);
      }
    }
  } catch (error) {
    // Corrupted cache - will return default
    if (isDebugMode()) {
      console.warn('[InsightEngine] Cache corrupted, resetting', error);
    }
  }

  return getDefaultCache();
}

/**
 * Saves the local insight cache to localStorage.
 *
 * @param cache - The cache to save
 */
export function setLocalCache(cache: LocalInsightCache): void {
  try {
    localStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // localStorage might be full or disabled
    if (isDebugMode()) {
      console.warn('[InsightEngine] Failed to save cache', error);
    }
  }
}

/**
 * Returns a fresh default cache with reset counters.
 *
 * @returns Default local insight cache
 */
export function getDefaultCache(): LocalInsightCache {
  return {
    weekdayScanCount: 0,
    weekendScanCount: 0,
    lastCounterReset: getTodayISODate(),
    silencedUntil: null,
  };
}

/**
 * Resets scan counters if the last reset was more than a week ago.
 *
 * @param cache - Current cache
 * @returns Cache with potentially reset counters
 */
function maybeResetCounters(cache: LocalInsightCache): LocalInsightCache {
  const lastReset = new Date(cache.lastCounterReset);
  const now = new Date();
  const daysSinceReset = Math.floor(
    (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReset >= 7) {
    return {
      ...cache,
      weekdayScanCount: 0,
      weekendScanCount: 0,
      lastCounterReset: getTodayISODate(),
    };
  }

  return cache;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Returns today's date as an ISO string (YYYY-MM-DD).
 */
function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Checks if debug mode is enabled via URL parameter.
 * Add ?insightDebug=true to enable verbose logging.
 */
function isDebugMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('insightDebug') === 'true';
}

/**
 * Increments the appropriate scan counter based on current day.
 *
 * @param cache - Current local cache
 * @returns Updated cache with incremented counter
 */
export function incrementScanCounter(cache: LocalInsightCache): LocalInsightCache {
  const isWeekend = isCurrentDayWeekend();

  return {
    ...cache,
    weekdayScanCount: isWeekend ? cache.weekdayScanCount : cache.weekdayScanCount + 1,
    weekendScanCount: isWeekend ? cache.weekendScanCount + 1 : cache.weekendScanCount,
  };
}

/**
 * Checks if the current day is a weekend (Saturday or Sunday).
 */
function isCurrentDayWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Checks if insights are currently silenced.
 *
 * @param cache - Local cache with silencedUntil timestamp
 * @returns true if insights should not be shown
 */
export function isInsightsSilenced(cache: LocalInsightCache): boolean {
  if (!cache.silencedUntil) {
    return false;
  }

  const silencedUntil = new Date(cache.silencedUntil);
  return new Date() < silencedUntil;
}

/**
 * Silences insights for the specified number of hours.
 *
 * @param cache - Current cache
 * @param hours - Number of hours to silence (e.g., 4)
 * @returns Updated cache with silencedUntil set
 */
export function silenceInsights(cache: LocalInsightCache, hours: number): LocalInsightCache {
  const silencedUntil = new Date();
  silencedUntil.setHours(silencedUntil.getHours() + hours);

  return {
    ...cache,
    silencedUntil: silencedUntil.toISOString(),
  };
}

/**
 * Clears the silence period.
 *
 * @param cache - Current cache
 * @returns Updated cache with silencedUntil cleared
 */
export function clearSilence(cache: LocalInsightCache): LocalInsightCache {
  return {
    ...cache,
    silencedUntil: null,
  };
}

// ============================================================================
// Precomputed Aggregates (Story 10.4)
// ============================================================================

/**
 * Precomputes aggregates for faster pattern detection.
 * Called on app load and after each transaction save.
 * Performance target: <100ms for 500 transactions.
 *
 * Story 10.4, AC #8: Precomputed aggregates optimize performance.
 *
 * @param transactions - All user transactions
 * @returns Precomputed aggregates for pattern detection
 */
export function computeAggregates(
  transactions: Transaction[]
): PrecomputedAggregates {
  const merchantVisits: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    // Count merchant visits
    if (tx.merchant) {
      merchantVisits[tx.merchant] = (merchantVisits[tx.merchant] || 0) + 1;
    }

    // Sum category totals
    if (tx.category) {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.total;
    }
  }

  return {
    merchantVisits,
    categoryTotals,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Updates cache with fresh aggregates.
 * Called after transaction save to keep aggregates up-to-date.
 *
 * @param cache - Current local cache
 * @param transactions - All user transactions
 * @returns Updated cache with fresh aggregates
 */
export function updateCacheAggregates(
  cache: LocalInsightCache,
  transactions: Transaction[]
): LocalInsightCache {
  return {
    ...cache,
    precomputedAggregates: computeAggregates(transactions),
  };
}

/**
 * Gets merchant visit count from aggregates.
 * Falls back to manual count if aggregates not available.
 *
 * @param merchant - Merchant name to look up
 * @param aggregates - Precomputed aggregates (optional)
 * @param transactions - All transactions (fallback)
 * @returns Number of visits to the merchant
 */
export function getMerchantVisitCount(
  merchant: string,
  aggregates: PrecomputedAggregates | undefined,
  transactions: Transaction[]
): number {
  if (aggregates?.merchantVisits) {
    return aggregates.merchantVisits[merchant] || 0;
  }

  // Fallback to manual count
  return transactions.filter((tx) => tx.merchant === merchant).length;
}

/**
 * Gets category total from aggregates.
 * Falls back to manual sum if aggregates not available.
 *
 * @param category - Category to look up
 * @param aggregates - Precomputed aggregates (optional)
 * @param transactions - All transactions (fallback)
 * @returns Total spending in the category
 */
export function getCategoryTotal(
  category: string,
  aggregates: PrecomputedAggregates | undefined,
  transactions: Transaction[]
): number {
  if (aggregates?.categoryTotals) {
    return aggregates.categoryTotals[category] || 0;
  }

  // Fallback to manual sum
  return transactions
    .filter((tx) => tx.category === category)
    .reduce((sum, tx) => sum + tx.total, 0);
}
