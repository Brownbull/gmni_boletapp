import React from 'react';
import { Camera, Home, ListIcon, BarChart3, Settings } from 'lucide-react';

interface NavProps {
    view: string;
    setView: (view: string) => void;
    onScanClick: () => void;
    onTrendsClick?: () => void;
    theme: string;
    t: (key: string) => string;
}

export const Nav: React.FC<NavProps> = ({ view, setView, onScanClick, onTrendsClick, theme, t }) => {
    // Story 7.12: Theme-aware styling using CSS variables (AC #8)
    const isDark = theme === 'dark';

    // Nav item color based on active state - uses CSS variables
    const getNavItemStyle = (v: string): React.CSSProperties => ({
        color: view === v ? 'var(--accent)' : 'var(--secondary)',
    });

    // Nav bar background styling
    const navStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-between items-center z-50"
            style={navStyle}
        >
            <button
                onClick={() => setView('dashboard')}
                className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
                style={getNavItemStyle('dashboard')}
            >
                <Home size={24} strokeWidth={2} />
                <span className="text-[10px] font-medium">{t('home')}</span>
            </button>
            <button
                onClick={() => {
                    if (onTrendsClick) onTrendsClick();
                    setView('trends');
                }}
                className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
                style={getNavItemStyle('trends')}
            >
                <BarChart3 size={24} strokeWidth={2} />
                {/* Story 7.10 AC #9: UX spec label is "Analytics" */}
                <span className="text-[10px] font-medium">{t('analytics')}</span>
            </button>
            {/* Center FAB - Story 7.10 AC #10: Prominent styling with gradient and elevation */}
            <div className="relative -top-6">
                <button
                    onClick={onScanClick}
                    className="text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform hover:shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
                    aria-label={t('scan')}
                >
                    <Camera size={24} strokeWidth={2} />
                </button>
            </div>
            <button
                onClick={() => setView('list')}
                className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
                style={getNavItemStyle('list')}
            >
                <ListIcon size={24} strokeWidth={2} />
                {/* Story 7.10 AC #9: UX spec label is "Receipts" */}
                <span className="text-[10px] font-medium">{t('receipts')}</span>
            </button>
            <button
                onClick={() => setView('settings')}
                className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
                style={getNavItemStyle('settings')}
            >
                <Settings size={24} strokeWidth={2} />
                <span className="text-[10px] font-medium">{t('settings')}</span>
            </button>
        </div>
    );
};
