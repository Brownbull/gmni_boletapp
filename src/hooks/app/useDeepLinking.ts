/**
 * Story 14c-refactor.10: useDeepLinking Hook
 *
 * Coordinates deep link handling by wrapping useJoinLinkHandler
 * and providing a simplified interface for App.tsx. This hook
 * abstracts the join link flow state machine.
 *
 * Features:
 * - Wraps useJoinLinkHandler for shared group join links
 * - Provides simplified state for UI rendering
 * - Handles auth-gated deep link flows
 * - Future: Can be extended for other deep link types
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 * Dependency: Requires AuthContext services and user
 *
 * @example
 * ```tsx
 * function App() {
 *   const { services, user } = useAuthContext();
 *
 *   const {
 *     hasActiveJoinLink,
 *     joinLinkState,
 *     groupPreview,
 *     confirmJoin,
 *     cancelJoin,
 *   } = useDeepLinking({
 *     db: services?.db ?? null,
 *     userId: user?.uid ?? null,
 *     isAuthenticated: !!user,
 *     userProfile: user ? { displayName: user.displayName } : null,
 *   });
 *
 *   if (hasActiveJoinLink) {
 *     return <JoinLinkDialog {...joinLinkState} />;
 *   }
 *
 *   return <MainApp />;
 * }
 * ```
 */

import { useMemo } from 'react';
import type { Firestore } from 'firebase/firestore';
import {
    useJoinLinkHandler,
    type JoinLinkState,
    type JoinError,
} from '../useJoinLinkHandler';
import type { SharedGroupPreview } from '../../types/sharedGroup';

// Re-export types for consumers
export type { JoinLinkState, JoinError } from '../useJoinLinkHandler';

// =============================================================================
// Types
// =============================================================================

/**
 * User profile for join operation
 */
interface UserProfile {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
}

/**
 * Configuration options for useDeepLinking
 */
export interface UseDeepLinkingOptions {
    /** Firestore instance (null during initialization) */
    db: Firestore | null;
    /** Current user ID (null if not authenticated) */
    userId: string | null;
    /** Whether the user is authenticated */
    isAuthenticated: boolean;
    /** User profile for join operation */
    userProfile: UserProfile | null;
    /** App ID (defaults to 'boletapp') */
    appId?: string;
}

/**
 * Result returned by useDeepLinking hook
 */
export interface UseDeepLinkingResult {
    /** Whether there's an active deep link being processed */
    hasActiveDeepLink: boolean;
    /** Whether there's an active join link specifically */
    hasActiveJoinLink: boolean;
    /** Current join link state */
    joinLinkState: JoinLinkState;
    /** Share code being processed */
    shareCode: string | null;
    /** Group preview data (when confirming join) */
    groupPreview: SharedGroupPreview | null;
    /** Join error (when in error state) */
    joinError: JoinError | null;
    /** ID of successfully joined group */
    joinedGroupId: string | null;
    /** Confirm joining the group */
    confirmJoin: () => Promise<void>;
    /** Cancel the join flow */
    cancelJoin: () => void;
    /** Dismiss error and reset */
    dismissJoinError: () => void;
    /** Whether join is in progress (loading or joining) */
    isJoining: boolean;
    /** Whether waiting for authentication */
    isPendingAuth: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to coordinate deep link handling.
 *
 * Currently wraps useJoinLinkHandler for shared group join links.
 * Can be extended to handle other deep link types in the future.
 *
 * @param options - Deep linking configuration
 * @returns Deep link state and handlers
 */
export function useDeepLinking({
    db,
    userId,
    isAuthenticated,
    userProfile,
    appId = 'boletapp',
}: UseDeepLinkingOptions): UseDeepLinkingResult {
    // Wrap useJoinLinkHandler
    // Note: db may be null during initialization, useJoinLinkHandler handles this gracefully
    const joinLink = useJoinLinkHandler({
        db: db as any, // Safe: useJoinLinkHandler guards against null db internally
        userId,
        isAuthenticated,
        userProfile: userProfile
            ? {
                displayName: userProfile.displayName ?? undefined,
                email: userProfile.email ?? undefined,
                photoURL: userProfile.photoURL ?? undefined,
            }
            : null,
        appId,
    });

    // Derive states for convenience
    const hasActiveJoinLink = useMemo(() => {
        return joinLink.state !== 'idle' && joinLink.state !== 'success';
    }, [joinLink.state]);

    const isJoining = useMemo(() => {
        return joinLink.state === 'loading' || joinLink.state === 'joining';
    }, [joinLink.state]);

    const isPendingAuth = useMemo(() => {
        return joinLink.state === 'pending_auth';
    }, [joinLink.state]);

    // Return combined result
    return useMemo<UseDeepLinkingResult>(
        () => ({
            hasActiveDeepLink: hasActiveJoinLink,
            hasActiveJoinLink,
            joinLinkState: joinLink.state,
            shareCode: joinLink.shareCode,
            groupPreview: joinLink.groupPreview,
            joinError: joinLink.error,
            joinedGroupId: joinLink.joinedGroupId,
            confirmJoin: joinLink.confirmJoin,
            cancelJoin: joinLink.cancelJoin,
            dismissJoinError: joinLink.dismissError,
            isJoining,
            isPendingAuth,
        }),
        [
            hasActiveJoinLink,
            joinLink.state,
            joinLink.shareCode,
            joinLink.groupPreview,
            joinLink.error,
            joinLink.joinedGroupId,
            joinLink.confirmJoin,
            joinLink.cancelJoin,
            joinLink.dismissError,
            isJoining,
            isPendingAuth,
        ]
    );
}

export default useDeepLinking;
