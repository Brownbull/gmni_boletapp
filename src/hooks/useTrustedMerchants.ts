import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Services } from './useAuth';
import {
    subscribeToTrustedMerchants,
    recordScan,
    isMerchantTrusted,
    trustMerchant,
    declineTrust,
    revokeTrust,
    deleteTrustedMerchant,
    getMerchantTrustRecord,
} from '../services/merchantTrustService';
import { TrustedMerchant, TrustPromptEligibility } from '../types/trust';

export interface UseTrustedMerchantsReturn {
    /** List of all user's trusted merchant records */
    merchants: TrustedMerchant[];
    /** Only merchants that are actually trusted (trusted=true) */
    trustedMerchants: TrustedMerchant[];
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
    /**
     * Record a scan from a merchant and check if trust prompt should show
     * Story 11.4: AC #1, #2
     */
    recordMerchantScan: (merchantName: string, wasEdited: boolean) => Promise<TrustPromptEligibility>;
    /**
     * Check if a merchant is trusted (for auto-save decision)
     * Story 11.4: AC #5
     */
    checkTrusted: (merchantName: string) => Promise<boolean>;
    /**
     * Accept trust for a merchant (user accepted the prompt)
     * Story 11.4: AC #4
     */
    acceptTrust: (merchantName: string) => Promise<void>;
    /**
     * Decline trust for a merchant (user declined the prompt)
     * Story 11.4: AC #4
     */
    declinePrompt: (merchantName: string) => Promise<void>;
    /**
     * Revoke trust for a merchant (from Settings)
     * Story 11.4: AC #7
     */
    removeTrust: (merchantName: string) => Promise<void>;
    /**
     * Delete a trusted merchant record entirely (from Settings)
     * Story 11.4: AC #6
     */
    deleteMerchant: (merchantId: string) => Promise<void>;
    /**
     * Get trust record for a specific merchant
     */
    getTrustRecord: (merchantName: string) => Promise<TrustedMerchant | null>;
}

/**
 * React hook for managing trusted merchants
 * Provides real-time subscription to user's trusted merchants with trust lifecycle operations
 *
 * Story 11.4: Trust Merchant System
 */
export function useTrustedMerchants(
    user: User | null,
    services: Services | null
): UseTrustedMerchantsReturn {
    const [merchants, setMerchants] = useState<TrustedMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Subscribe to trusted merchants on mount
    useEffect(() => {
        if (!user || !services) {
            setMerchants([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToTrustedMerchants(
            services.db,
            user.uid,
            services.appId,
            (docs) => {
                setMerchants(docs);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [user, services]);

    // Computed: only trusted merchants
    const trustedMerchants = useMemo(
        () => merchants.filter(m => m.trusted === true),
        [merchants]
    );

    // Record a scan and check trust eligibility
    const recordMerchantScan = useCallback(
        async (merchantName: string, wasEdited: boolean): Promise<TrustPromptEligibility> => {
            if (!user || !services) {
                return {
                    shouldShowPrompt: false,
                    reason: 'insufficient_scans',
                };
            }

            try {
                const eligibility = await recordScan(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantName,
                    wasEdited
                );
                return eligibility;
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to record scan');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Check if merchant is trusted (for auto-save decision)
    const checkTrusted = useCallback(
        async (merchantName: string): Promise<boolean> => {
            if (!user || !services) {
                return false;
            }

            try {
                return await isMerchantTrusted(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantName
                );
            } catch (e) {
                console.warn('Failed to check merchant trust:', e);
                return false;
            }
        },
        [user, services]
    );

    // Accept trust (user clicked "Yes, trust")
    const acceptTrust = useCallback(
        async (merchantName: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to trust merchants');
            }

            try {
                await trustMerchant(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantName
                );
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to trust merchant');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Decline trust (user clicked "Not now")
    const declinePrompt = useCallback(
        async (merchantName: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to decline trust');
            }

            try {
                await declineTrust(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantName
                );
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to decline trust');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Revoke trust (from Settings)
    const removeTrust = useCallback(
        async (merchantName: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to revoke trust');
            }

            try {
                await revokeTrust(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantName
                );
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to revoke trust');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Delete trusted merchant record entirely
    const deleteMerchant = useCallback(
        async (merchantId: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to delete merchant');
            }

            try {
                await deleteTrustedMerchant(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantId
                );
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to delete merchant');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Get trust record for a specific merchant
    const getTrustRecord = useCallback(
        async (merchantName: string): Promise<TrustedMerchant | null> => {
            if (!user || !services) {
                return null;
            }

            try {
                return await getMerchantTrustRecord(
                    services.db,
                    user.uid,
                    services.appId,
                    merchantName
                );
            } catch (e) {
                console.warn('Failed to get trust record:', e);
                return null;
            }
        },
        [user, services]
    );

    return useMemo(
        () => ({
            merchants,
            trustedMerchants,
            loading,
            error,
            recordMerchantScan,
            checkTrusted,
            acceptTrust,
            declinePrompt,
            removeTrust,
            deleteMerchant,
            getTrustRecord,
        }),
        [
            merchants,
            trustedMerchants,
            loading,
            error,
            recordMerchantScan,
            checkTrusted,
            acceptTrust,
            declinePrompt,
            removeTrust,
            deleteMerchant,
            getTrustRecord,
        ]
    );
}
