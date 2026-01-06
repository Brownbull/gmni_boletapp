/**
 * LimitesView Sub-View
 * Story 14.22 AC #3: Spending Limits placeholder for Epic 15
 *
 * Shows "Proximamente" card with description
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LimitesViewProps {
    t: (key: string) => string;
}

export const LimitesView: React.FC<LimitesViewProps> = ({ t }) => {
    return (
        <div className="space-y-4">
            {/* Coming Soon placeholder card */}
            <div
                className="p-6 rounded-xl border text-center"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                }}
            >
                <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--warning-light, #fef3c7)' }}
                >
                    <AlertTriangle
                        size={32}
                        style={{ color: 'var(--warning, #f59e0b)' }}
                    />
                </div>
                <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {t('settingsProximamente')}
                </h3>
                <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {t('settingsProximamenteDesc')}
                </p>
            </div>
        </div>
    );
};
