/**
 * GruposView - Custom Groups Settings Sub-View
 * Story 14.22: Custom groups management with sharing placeholder
 *
 * Displays user-created custom groups and provides a placeholder
 * for the future "Share Custom Groups" feature (account sharing).
 */

import React from 'react';
import { Users, Share2, Plus, FolderOpen } from 'lucide-react';

export interface GruposViewProps {
    t: (key: string) => string;
    theme: string;
    // Future: groups data will come from useGroups hook
    // groups?: Group[];
    // groupsLoading?: boolean;
    // onCreateGroup?: () => void;
    // onEditGroup?: (groupId: string) => void;
    // onDeleteGroup?: (groupId: string) => void;
}

export const GruposView: React.FC<GruposViewProps> = ({ t, theme }) => {
    const isDark = theme === 'dark';

    return (
        <div className="space-y-4 pb-4">
            {/* Custom Groups Section */}
            <div
                className="rounded-xl p-4"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#dbeafe' }}
                    >
                        <FolderOpen className="w-5 h-5" style={{ color: '#3b82f6' }} />
                    </div>
                    <div>
                        <h3
                            className="font-medium"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {t('settingsGruposTitle')}
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('settingsGruposSubtitle')}
                        </p>
                    </div>
                </div>

                {/* Empty State - No groups yet */}
                <div
                    className="rounded-lg p-6 text-center"
                    style={{
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                        border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}
                >
                    <Users
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: 'var(--text-tertiary)' }}
                    />
                    <p
                        className="text-sm mb-3"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('settingsGruposEmpty')}
                    </p>
                    <button
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                        }}
                        disabled
                        title={t('comingSoon')}
                    >
                        <Plus className="w-4 h-4" />
                        {t('settingsGruposCreate')}
                    </button>
                    <p
                        className="text-xs mt-2"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        {t('comingSoon')}
                    </p>
                </div>
            </div>

            {/* Share Custom Groups - Placeholder Section */}
            <div
                className="rounded-xl p-4"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#f3e8ff' }}
                    >
                        <Share2 className="w-5 h-5" style={{ color: '#a855f7' }} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {t('settingsGruposShare')}
                            </h3>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                    backgroundColor: isDark
                                        ? 'rgba(168, 85, 247, 0.2)'
                                        : 'rgba(168, 85, 247, 0.1)',
                                    color: '#a855f7',
                                }}
                            >
                                {t('soonBadge')}
                            </span>
                        </div>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('settingsGruposShareDesc')}
                        </p>
                    </div>
                </div>

                {/* Feature Preview Card */}
                <div
                    className="rounded-lg p-4"
                    style={{
                        backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                >
                    <p
                        className="text-sm mb-3"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('settingsGruposSharePreview')}
                    </p>
                    <ul className="space-y-2">
                        {['settingsGruposShareFeature1', 'settingsGruposShareFeature2', 'settingsGruposShareFeature3'].map((key) => (
                            <li
                                key={key}
                                className="flex items-center gap-2 text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: '#a855f7' }}
                                />
                                {t(key)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GruposView;
