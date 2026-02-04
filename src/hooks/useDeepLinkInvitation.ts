/**
 * useDeepLinkInvitation Hook
 *
 * Story 14d-v2-1-6a: Deep Link & Pending Invitations Service
 * Epic 14d-v2: Shared Groups v2
 *
 * Handles deep link invitation flow:
 * 1. Detects `/join/{shareCode}` URL pattern on app open
 * 2. If authenticated: fetches invitation by share code immediately
 * 3. If not authenticated: stores share code in localStorage, waits for login
 * 4. After login: checks localStorage for pending share code and resumes flow
 * 5. Clears stored share code after processing (success or failure)
 *
 * Data Flow:
 * ```
 * User clicks link: /join/aB3dEfGhIjKlMnOp
 *       │
 *       ├── Authenticated?
 *       │   ├── YES → Fetch invitation by shareCode → Return invitation
 *       │   └── NO → Store shareCode in localStorage → Wait for auth
 *       │                                              └── After login → Resume flow
 * ```
 *
 * @example
 * ```tsx
 * const {
 *   invitation,
 *   loading,
 *   error,
 *   shareCode,
 *   clearPendingInvitation,
 * } = useDeepLinkInvitation({
 *   db,
 *   userId,
 *   isAuthenticated: !!user,
 * });
 *
 * if (invitation) {
 *   // Show accept/decline dialog
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { PendingInvitation } from '../types/sharedGroup';
import { getInvitationByShareCode } from '../services/invitationService';
import {
    parseShareCodeFromUrl,
    clearJoinUrlPath,
} from '../utils/deepLinkHandler';

// =============================================================================
// Constants
// =============================================================================

/**
 * localStorage key for storing pending invitation share code.
 * Different from sessionStorage key used by useJoinLinkHandler.
 * Story 14d-v2-1-6a: Dev Notes decision.
 */
export const PENDING_INVITE_SHARE_CODE_KEY = 'pendingInviteShareCode';

// =============================================================================
// Types
// =============================================================================

/**
 * Error types for deep link invitation processing.
 */
export type DeepLinkInvitationError =
    | 'NOT_FOUND'       // Share code doesn't match any pending invitation
    | 'EXPIRED'         // Invitation has expired
    | 'INVALID_CODE'    // Share code format is invalid
    | 'NETWORK_ERROR'   // Network/Firestore error
    | 'UNKNOWN_ERROR';  // Unexpected error

/**
 * Hook configuration options.
 */
export interface UseDeepLinkInvitationOptions {
    /** Firestore instance */
    db: Firestore;
    /** Current user ID (null if not authenticated) */
    userId: string | null;
    /** Whether the user is currently authenticated */
    isAuthenticated: boolean;
}

/**
 * Hook return value.
 */
export interface UseDeepLinkInvitationReturn {
    /** The fetched invitation (null if none found or not yet loaded) */
    invitation: PendingInvitation | null;
    /** Loading state */
    loading: boolean;
    /** Error that occurred during fetch */
    error: DeepLinkInvitationError | null;
    /** The detected share code (for display/debugging) */
    shareCode: string | null;
    /** Whether user needs to authenticate to continue */
    pendingAuth: boolean;
    /** Clear the pending invitation state and localStorage */
    clearPendingInvitation: () => void;
}

// =============================================================================
// localStorage Utilities
// =============================================================================

/**
 * Get pending invite share code from localStorage.
 * Used to resume invitation flow after authentication.
 *
 * @returns The stored share code, or null if none exists
 */
export function getPendingInviteShareCode(): string | null {
    try {
        const code = localStorage.getItem(PENDING_INVITE_SHARE_CODE_KEY);
        return code || null;
    } catch {
        // localStorage may not be available
        return null;
    }
}

/**
 * Store share code in localStorage for later use.
 * Used when unauthenticated user clicks invitation link.
 *
 * @param code - The share code to store
 */
export function setPendingInviteShareCode(code: string): void {
    try {
        if (code) {
            localStorage.setItem(PENDING_INVITE_SHARE_CODE_KEY, code);
        }
    } catch {
        // localStorage may not be available
        console.warn('[useDeepLinkInvitation] Could not store pending invite share code');
    }
}

/**
 * Clear pending invite share code from localStorage.
 * Called after processing is complete (success or failure).
 */
export function clearPendingInviteShareCode(): void {
    try {
        localStorage.removeItem(PENDING_INVITE_SHARE_CODE_KEY);
    } catch {
        // localStorage may not be available
    }
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to handle deep link invitations for shared groups.
 *
 * Detects `/join/{shareCode}` URL pattern, handles auth states,
 * and fetches the corresponding PendingInvitation.
 *
 * @param options - Hook configuration
 * @returns Deep link invitation state and actions
 */
export function useDeepLinkInvitation({
    db,
    userId,
    isAuthenticated,
}: UseDeepLinkInvitationOptions): UseDeepLinkInvitationReturn {
    const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<DeepLinkInvitationError | null>(null);
    const [shareCode, setShareCode] = useState<string | null>(null);
    const [pendingAuth, setPendingAuth] = useState(false);

    // Track if we've processed the URL to prevent double-processing
    const hasProcessedUrl = useRef(false);
    // Track if currently fetching to prevent race conditions
    const isFetching = useRef(false);

    /**
     * Fetch invitation by share code from Firestore.
     */
    const fetchInvitation = useCallback(async (code: string) => {
        if (isFetching.current) return;
        isFetching.current = true;

        setLoading(true);
        setError(null);
        setShareCode(code);

        try {
            const result = await getInvitationByShareCode(db, code);

            if (!result) {
                setError('NOT_FOUND');
                setInvitation(null);
            } else {
                // Check if invitation is expired (by checking expiresAt)
                const now = new Date();
                const expiresAt = result.expiresAt?.toDate?.();
                if (expiresAt && now > expiresAt) {
                    setError('EXPIRED');
                    setInvitation(result); // Still set invitation for UI to show expired message
                } else {
                    setInvitation(result);
                }
            }
        } catch (err) {
            console.error('[useDeepLinkInvitation] Error fetching invitation:', err);

            if (err instanceof Error) {
                if (err.message.includes('network') || err.message.includes('offline')) {
                    setError('NETWORK_ERROR');
                } else {
                    setError('UNKNOWN_ERROR');
                }
            } else {
                setError('UNKNOWN_ERROR');
            }
            setInvitation(null);
        } finally {
            setLoading(false);
            isFetching.current = false;

            // Clear the stored code after processing (success or failure)
            // Story 1.6: Clear stored share code after processing
            clearPendingInviteShareCode();

            // Clear URL path to prevent re-processing on refresh
            clearJoinUrlPath();
        }
    }, [db]);

    /**
     * Clear pending invitation state and localStorage.
     */
    const clearPendingInvitation = useCallback(() => {
        setInvitation(null);
        setLoading(false);
        setError(null);
        setShareCode(null);
        setPendingAuth(false);
        clearPendingInviteShareCode();
        clearJoinUrlPath();
    }, []);

    /**
     * Effect: Check for deep link URL on mount.
     * Task 1.2: Detect /join/{shareCode} URL pattern on app open
     */
    useEffect(() => {
        // Only process once on mount
        if (hasProcessedUrl.current) return;

        // Check URL for share code
        const urlCode = parseShareCodeFromUrl(window.location.pathname);

        // Also check localStorage for pending code (from previous unauthenticated visit)
        const storedCode = getPendingInviteShareCode();

        // Prioritize URL code over stored code
        const codeToProcess = urlCode || storedCode;

        if (!codeToProcess) {
            return;
        }

        hasProcessedUrl.current = true;
        setShareCode(codeToProcess);

        if (!isAuthenticated) {
            // Task 1.4: If not authenticated - store share code in localStorage
            if (urlCode) {
                setPendingInviteShareCode(urlCode);
            }
            setPendingAuth(true);
            // Don't fetch - wait for auth
            // Clear URL to prevent issues on refresh
            clearJoinUrlPath();
            return;
        }

        // Task 1.3: If authenticated - fetch invitation by share code immediately
        fetchInvitation(codeToProcess);
    }, [isAuthenticated, fetchInvitation]);

    /**
     * Effect: Resume fetch after user authenticates.
     * Task 1.5: After login - check localStorage for pending share code
     */
    useEffect(() => {
        // Only trigger when auth state changes to authenticated
        if (!pendingAuth) return;
        if (!isAuthenticated || !userId) return;

        // Check for pending code
        const pendingCode = getPendingInviteShareCode() || shareCode;

        if (!pendingCode) {
            setPendingAuth(false);
            return;
        }

        setPendingAuth(false);
        fetchInvitation(pendingCode);
    }, [isAuthenticated, userId, pendingAuth, shareCode, fetchInvitation]);

    return {
        invitation,
        loading,
        error,
        shareCode,
        pendingAuth,
        clearPendingInvitation,
    };
}

export default useDeepLinkInvitation;
