/**
 * SuscripcionView Sub-View
 * Story 14.22 AC #7: Subscription plan and credits display
 *
 * Shows current plan card and credits progress bar
 */

import React from 'react';
import { CreditCard, Zap } from 'lucide-react';

interface SuscripcionViewProps {
    t: (key: string) => string;
    theme: string;
    /** Current subscription plan */
    plan?: 'free' | 'pro' | 'max';
    /** Used scan credits */
    creditsUsed?: number;
    /** Total available credits */
    creditsTotal?: number;
}

export const SuscripcionView: React.FC<SuscripcionViewProps> = ({
    t,
    theme,
    plan = 'free',
    creditsUsed = 0,
    creditsTotal = 900,
}) => {
    const isDark = theme === 'dark';

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    // Calculate progress percentage
    const creditsRemaining = creditsTotal - creditsUsed;
    const progressPercent = Math.max(0, Math.min(100, (creditsRemaining / creditsTotal) * 100));

    // Get plan display info
    const planInfo = {
        free: { name: t('planFree'), color: 'var(--text-secondary)', gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
        pro: { name: t('planPro'), color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
        max: { name: t('planMax'), color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    };

    const currentPlan = planInfo[plan];

    return (
        <div className="space-y-4">
            {/* Plan Card */}
            <div
                className="p-6 rounded-xl text-white"
                style={{ background: currentPlan.gradient }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className="text-sm opacity-80">{t('settingsSuscripcion')}</div>
                        <div className="text-2xl font-bold">{currentPlan.name}</div>
                    </div>
                </div>
            </div>

            {/* Credits Card */}
            <div className="p-4 rounded-xl border" style={cardStyle}>
                <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                    <Zap size={20} strokeWidth={2} style={{ color: 'var(--warning, #f59e0b)' }} />
                    <span className="font-medium">Scan Credits</span>
                </div>

                {/* Progress bar */}
                <div
                    className="h-3 rounded-full overflow-hidden mb-2"
                    style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: progressPercent > 20 ? 'var(--success, #22c55e)' : 'var(--warning, #f59e0b)',
                        }}
                    />
                </div>

                {/* Credits text */}
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('creditsAvailableProfile')
                        .replace('{used}', String(creditsRemaining))
                        .replace('{total}', String(creditsTotal))}
                </div>
            </div>
        </div>
    );
};
