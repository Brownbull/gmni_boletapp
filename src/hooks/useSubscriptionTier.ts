import { useMemo } from 'react'

/**
 * Subscription tier levels available in the system.
 *
 * - 'free': No paid features, basic functionality
 * - 'basic': Entry-level paid tier
 * - 'pro': Professional tier with most features
 * - 'max': Maximum tier with all premium features
 *
 * TODO: Epic 7 - These tiers align with planned Mercado Pago subscription integration.
 * Actual tier values will come from Firestore: users/{uid}/subscription
 */
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max'

/**
 * Information about the user's current subscription status.
 *
 * TODO: Epic 7 - Add loading and error states when implementing real subscription check:
 * - loading: boolean (true while fetching subscription from Firestore)
 * - error: Error | null (subscription fetch error if any)
 */
export interface SubscriptionInfo {
  /** Current subscription tier */
  tier: SubscriptionTier
  /** Whether user can access premium export features (pro and max tiers) */
  canAccessPremiumExport: boolean
}

/**
 * Check if current user can access premium export features.
 *
 * This is a pure utility function for non-React contexts.
 * For React components, prefer using the `useSubscriptionTier()` hook.
 *
 * TODO: Epic 7 - Replace mock implementation with actual Firestore lookup:
 * - Path: users/{uid}/subscription or users/{uid} with subscription field
 * - Check: tier === 'pro' || tier === 'max'
 * - Handle: loading state, error state, no subscription (default to 'free')
 * - Consider: Caching subscription data to avoid repeated Firestore queries
 *
 * @returns true if user can access premium export features, false otherwise
 */
export function canAccessPremiumExport(): boolean {
  // TODO: Epic 7 - Replace with actual subscription check
  // Current mock: All users have premium access during testing phase
  return true
}

/**
 * React hook for accessing subscription tier information.
 *
 * This is the primary way React components should check subscription status.
 * The hook returns a stable object reference via useMemo to prevent
 * unnecessary re-renders in consuming components.
 *
 * @example
 * ```typescript
 * const { tier, canAccessPremiumExport } = useSubscriptionTier()
 *
 * if (!canAccessPremiumExport) {
 *   // Show upgrade prompt or disable premium features
 *   return <UpgradePrompt />
 * }
 *
 * // Render premium content
 * return <PremiumExportButton />
 * ```
 *
 * TODO: Epic 7 - Implement real subscription fetching:
 * - Use useAuth() to get current user UID
 * - Fetch subscription document from Firestore: users/{uid}/subscription
 * - Return loading/error states for proper UX handling
 * - Cache subscription data to avoid repeated queries (consider useEffect + onSnapshot)
 * - Handle edge cases: no user logged in, no subscription doc, subscription expired
 *
 * Expected Epic 7 data structure:
 * ```typescript
 * // Firestore document: users/{uid}/subscription
 * {
 *   tier: 'free' | 'basic' | 'pro' | 'max',
 *   startDate: Timestamp,
 *   endDate: Timestamp | null,
 *   paymentProvider: 'mercado_pago' | null,
 *   subscriptionId: string | null
 * }
 * ```
 *
 * @returns SubscriptionInfo object with tier and access flags
 */
export function useSubscriptionTier(): SubscriptionInfo {
  // TODO: Epic 7 - Replace with actual Firestore subscription lookup
  // Current mock: All users are treated as 'max' tier with full access during testing
  return useMemo(
    () => ({
      tier: 'max' as SubscriptionTier,
      canAccessPremiumExport: true,
    }),
    []
  )
}
