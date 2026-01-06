/**
 * CuentaView Sub-View
 * Story 14.22 AC #10: Data export, factory reset, and sign out
 *
 * Danger zone actions grouped together with appropriate warning styling
 */

import React from 'react';
import { Download, Trash2, ArrowRightLeft, Loader2 } from 'lucide-react';

interface CuentaViewProps {
    t: (key: string) => string;
    theme: string;
    wiping: boolean;
    exporting: boolean;
    onExportAll: () => void;
    onWipeDB: () => Promise<void>;
    onSignOut: () => void;
}

export const CuentaView: React.FC<CuentaViewProps> = ({
    t,
    theme,
    wiping,
    exporting,
    onExportAll,
    onWipeDB,
    onSignOut,
}) => {
    const isDark = theme === 'dark';

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    return (
        <div className="space-y-4">
            {/* Download data action button */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                    <Download size={24} strokeWidth={2} /> {t('downloadAllData')}
                </div>
                <button
                    onClick={onExportAll}
                    disabled={exporting}
                    aria-label={t('downloadAllData') + ' as CSV'}
                    aria-busy={exporting}
                    className="min-h-11 flex items-center justify-center gap-2 px-4 rounded-lg font-bold text-sm transition-colors"
                    style={{
                        backgroundColor: exporting
                            ? (isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                            : (isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)'),
                        color: exporting ? 'var(--text-secondary)' : 'var(--accent)',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('exportingData')}
                        </>
                    ) : (
                        'CSV'
                    )}
                </button>
            </div>

            {/* Wipe data action button */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--error)' }}>
                    <Trash2 size={24} strokeWidth={2} /> {t('wipe')}
                </div>
                <button
                    onClick={onWipeDB}
                    className="min-h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                    style={{
                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--error)',
                    }}
                >
                    {wiping ? '...' : t('wipe')}
                </button>
            </div>

            {/* Sign out action button */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--text-secondary)' }}>
                    <ArrowRightLeft size={24} strokeWidth={2} /> {t('signout')}
                </div>
                <button
                    onClick={onSignOut}
                    className="min-h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                    style={{
                        backgroundColor: isDark ? '#334155' : '#e2e8f0',
                        color: 'var(--text-primary)',
                    }}
                >
                    {t('signout')}
                </button>
            </div>
        </div>
    );
};
