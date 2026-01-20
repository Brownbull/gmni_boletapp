/**
 * useJoinLinkHandler Hook
 *
 * Story 14c.17: Share Link Deep Linking
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Handles the complete join link flow:
 * 1. Detects join URLs on app load (/join/{shareCode})
 * 2. Shows group preview for confirmation (authenticated users)
 * 3. Stores share code for later (unauthenticated users)
 * 4. Resumes join flow after authentication
 * 5. Handles errors and cleanup
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   shareCode,
 *   groupPreview,
 *   error,
 *   confirmJoin,
 *   cancelJoin,
 *   dismissError,
 *   joinedGroupId,
 * } = useJoinLinkHandler({
 *   db,
 *   userId: user?.uid ?? null,
 *   isAuthenticated: !!user,
 *   userProfile: user ? { displayName: user.displayName, email: user.email } : null,
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { SharedGroupPreview } from '../types/sharedGroup';
import {
    parseShareCodeFromUrl,
    getPendingJoinCode,
    setPendingJoinCode,
    clearPendingJoinCode,
    clearJoinUrlPath,
} from '../utils/deepLinkHandler';
import {
    getSharedGroupPreview,
    joinByShareCode,
} from '../services/sharedGroupService';

/**
 * Join error types that can occur during the join flow.
 */
export type JoinError =
    | 'CODE_NOT_FOUND'
    | 'CODE_EXPIRED'
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';

/**
 * State of the join link handler.
 */
export type JoinLinkState =
    | 'idle'           // No join link detected
    | 'loading'        // Fetching group preview
    | 'pending_auth'   // Waiting for user to authenticate
    | 'confirming'     // Showing join confirmation dialog
    | 'joining'        // Join in progress
    | 'success'        // Successfully joined
    | 'error';         // Error occurred

/**
 * Hook configuration options.
 */
export interface UseJoinLinkHandlerOptions {
    /** Firestore instance */
    db: Firestore;
    /** Current user ID (null if not authenticated) */
    userId: string | null;
    /** Whether the user is authenticated */
    isAuthenticated: boolean;
    /** User profile for join operation */
    userProfile: { displayName?: string; email?: string; photoURL?: string } | null;
    /** App ID (defaults to 'boletapp') */
    appId?: string;
}

/**
 * Hook return value.
 */
export interface UseJoinLinkHandlerReturn {
    /** Current state of the join flow */
    state: JoinLinkState;
    /** Detected share code (if any) */
    shareCode: string | null;
    /** Group preview data (when confirming) */
    groupPreview: SharedGroupPreview | null;
    /** Error that occurred (when in error state) */
    error: JoinError | null;
    /** ID of the joined group (when successful) */
    joinedGroupId: string | null;
    /** Confirm joining the group */
    confirmJoin: () => Promise<void>;
    /** Cancel the join flow */
    cancelJoin: () => void;
    /** Dismiss error and reset to idle */
    dismissError: () => void;
}

/**
 * Parse error message to JoinError type.
 */
function parseJoinError(error: unknown): JoinError {
    if (error instanceof Error) {
        const message = error.message.toUpperCase();
        if (message.includes('CODE_NOT_FOUND') || message.includes('NOT_FOUND')) {
            return 'CODE_NOT_FOUND';
        }
        if (message.includes('CODE_EXPIRED') || message.includes('EXPIRED')) {
            return 'CODE_EXPIRED';
        }
        if (message.includes('GROUP_FULL') || message.includes('FULL')) {
            return 'GROUP_FULL';
        }
        if (message.includes('ALREADY_MEMBER') || message.includes('ALREADY')) {
            return 'ALREADY_MEMBER';
        }
        if (message.includes('NETWORK') || message.includes('OFFLINE')) {
            return 'NETWORK_ERROR';
        }
    }
    return 'UNKNOWN_ERROR';
}

/**
 * Hook to handle share link deep linking for joining shared groups.
 */
export function useJoinLinkHandler({
    db,
    userId,
    isAuthenticated,
    userProfile,
    appId = 'boletapp',
}: UseJoinLinkHandlerOptions): UseJoinLinkHandlerReturn {
    const [state, setState] = useState<JoinLinkState>('idle');
    const [shareCode, setShareCode] = useState<string | null>(null);
    const [groupPreview, setGroupPreview] = useState<SharedGroupPreview | null>(null);
    const [error, setError] = useState<JoinError | null>(null);
    const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

    // Track if we've already processed the URL on mount
    const hasProcessedUrl = useRef(false);
    // Track if we're currently processing to prevent double-processing
    const isProcessing = useRef(false);

    // Debug: Log hook initialization
    console.log('[useJoinLinkHandler] Hook init:', {
        isAuthenticated,
        userId: userId ? 'present' : 'null',
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
        pendingCode: typeof window !== 'undefined' ? getPendingJoinCode() : 'N/A',
        hasProcessedUrl: hasProcessedUrl.current,
    });

    /**
     * Fetch group preview and update state accordingly.
     */
    const fetchGroupPreview = useCallback(async (code: string) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        setState('loading');
        setShareCode(code);

        // Clear pending code early - we've captured the code in state now
        // This prevents duplicate processing if the app reloads during the flow
        clearPendingJoinCode();

        try {
            const preview = await getSharedGroupPreview(db, code);

            if (!preview) {
                setState('error');
                setError('CODE_NOT_FOUND');
                return;
            }

            if (preview.isExpired) {
                setState('error');
                setError('CODE_EXPIRED');
                setGroupPreview(preview);
                return;
            }

            setGroupPreview(preview);
            setState('confirming');
        } catch (err) {
            console.error('[useJoinLinkHandler] Error fetching preview:', err);
            setState('error');
            setError(parseJoinError(err));
        } finally {
            isProcessing.current = false;
        }
    }, [db]);

    /**
     * Check for join URL on mount and handle accordingly.
     */
    useEffect(() => {
        // Only process once on mount
        if (hasProcessedUrl.current) return;

        const urlCode = parseShareCodeFromUrl(window.location.pathname);
        const pendingCode = getPendingJoinCode();
        const codeToProcess = urlCode || pendingCode;

        if (!codeToProcess) {
            return;
        }

        hasProcessedUrl.current = true;

        // Clear URL path immediately to prevent double-processing on page reload
        if (urlCode) {
            clearJoinUrlPath();
        }

        if (!isAuthenticated) {
            // Store code for after auth if we have a URL code
            if (urlCode) {
                setPendingJoinCode(urlCode);
            }
            setShareCode(codeToProcess);
            setState('pending_auth');
            return;
        }

        // User is authenticated, proceed with join flow
        fetchGroupPreview(codeToProcess);
    }, [isAuthenticated, fetchGroupPreview]);

    /**
     * Resume join flow when authentication state changes.
     */
    useEffect(() => {
        if (state !== 'pending_auth') return;
        if (!isAuthenticated || !userId) return;

        const pendingCode = getPendingJoinCode() || shareCode;
        if (!pendingCode) {
            setState('idle');
            return;
        }

        fetchGroupPreview(pendingCode);
    }, [isAuthenticated, userId, state, shareCode, fetchGroupPreview]);

    /**
     * Confirm joining the group.
     */
    const confirmJoin = useCallback(async () => {
        console.log('[useJoinLinkHandler] confirmJoin called:', {
            shareCode,
            userId: userId ? 'present' : 'null',
            isAuthenticated,
        });

        if (!shareCode || !userId || !isAuthenticated) {
            console.warn('[useJoinLinkHandler] confirmJoin aborted - missing data');
            return;
        }

        setState('joining');

        try {
            const result = await joinByShareCode(
                db,
                userId,
                appId,
                shareCode,
                userProfile ?? undefined
            );

            setJoinedGroupId(result.groupId);
            setState('success');
            // Note: clearPendingJoinCode() is called early in fetchGroupPreview
            clearJoinUrlPath();
        } catch (err) {
            console.error('[useJoinLinkHandler] Error joining group:', err);
            setState('error');
            setError(parseJoinError(err));
        }
    }, [db, userId, appId, shareCode, userProfile, isAuthenticated]);

    /**
     * Cancel the join flow.
     */
    const cancelJoin = useCallback(() => {
        setState('idle');
        setShareCode(null);
        setGroupPreview(null);
        setError(null);
        clearPendingJoinCode();
        clearJoinUrlPath();
    }, []);

    /**
     * Dismiss error and reset to idle.
     */
    const dismissError = useCallback(() => {
        setState('idle');
        setShareCode(null);
        setGroupPreview(null);
        setError(null);
        clearPendingJoinCode();
        clearJoinUrlPath();
    }, []);

    return {
        state,
        shareCode,
        groupPreview,
        error,
        joinedGroupId,
        confirmJoin,
        cancelJoin,
        dismissError,
    };
}

export default useJoinLinkHandler;
