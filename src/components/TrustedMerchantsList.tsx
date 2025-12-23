/**
 * TrustedMerchantsList Component
 *
 * Story 11.4: Trust Merchant System
 * Epic 11: Quick Save & Scan Flow Optimization
 *
 * Displays and manages the list of trusted merchants in Settings.
 * Users can view trusted merchants and revoke trust.
 *
 * Features:
 * - Display list of trusted merchants (AC #6)
 * - Revoke trust functionality (AC #7)
 * - Empty state message
 * - Loading state
 * - Dark mode support
 *
 * @see docs/sprint-artifacts/epic11/story-11.4-trust-merchant-system.md
 */

import React, { useState } from 'react';
import { Handshake, X, Loader2 } from 'lucide-react';
import { TrustedMerchant } from '../types/trust';

export interface TrustedMerchantsListProps {
    /** List of trusted merchants */
    merchants: TrustedMerchant[];
    /** Whether the list is loading */
    loading: boolean;
    /** Callback to revoke trust for a merchant */
    onRevokeTrust: (merchantName: string) => Promise<void>;
    /** Translation function */
    t: (key: string) => string;
    /** Theme for styling */
    theme: 'light' | 'dark';
}

export const TrustedMerchantsList: React.FC<TrustedMerchantsListProps> = ({
    merchants,
    loading,
    onRevokeTrust,
    t,
    theme,
}) => {
    const isDark = theme === 'dark';
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const handleRevoke = async (merchant: TrustedMerchant) => {
        if (revokingId) return; // Already revoking

        // Confirmation dialog (AC #7)
        if (!window.confirm(t('removeTrustConfirm'))) {
            return;
        }

        setRevokingId(merchant.id || merchant.normalizedName);
        try {
            await onRevokeTrust(merchant.merchantName);
        } finally {
            setRevokingId(null);
        }
    };

    // Filter to only show trusted merchants
    const trustedOnly = merchants.filter(m => m.trusted);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8" style={{ color: 'var(--secondary)' }}>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">{t('loading')}</span>
            </div>
        );
    }

    if (trustedOnly.length === 0) {
        return (
            <div className="text-center py-6">
                <Handshake
                    className="w-10 h-10 mx-auto mb-2"
                    style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                />
                <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                    {t('trustedMerchantsEmpty')}
                </p>
                <p className="text-xs mt-1" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                    {t('trustedMerchantsHint')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {trustedOnly.map((merchant) => {
                const merchantId = merchant.id || merchant.normalizedName;
                const isRevoking = revokingId === merchantId;

                return (
                    <div
                        key={merchantId}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        }}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Handshake
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: 'var(--accent)' }}
                            />
                            <div className="min-w-0 flex-1">
                                <span
                                    className="font-medium text-sm block truncate"
                                    style={{ color: 'var(--primary)' }}
                                >
                                    {merchant.merchantName}
                                </span>
                                <span
                                    className="text-xs"
                                    style={{ color: 'var(--secondary)' }}
                                >
                                    {(t('scansFromMerchant') || '{count} scans').replace(
                                        '{count}',
                                        String(merchant.scanCount)
                                    )}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleRevoke(merchant)}
                            disabled={isRevoking}
                            className="ml-2 p-2 rounded-lg transition-colors"
                            style={{
                                backgroundColor: isRevoking
                                    ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
                                    : 'transparent',
                                color: 'var(--error)',
                            }}
                            aria-label={t('removeTrust')}
                        >
                            {isRevoking ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <X className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default TrustedMerchantsList;
