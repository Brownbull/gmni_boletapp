import React, { useRef, useCallback } from 'react';
import { Camera, Home, Lightbulb, BarChart3, Settings } from 'lucide-react';

// Story 12.3: Scan status for nav icon indicator
export type ScanStatus = 'idle' | 'processing' | 'ready';

interface NavProps {
    view: string;
    setView: (view: string) => void;
    onScanClick: () => void;
    // Story 12.1: Long-press or batch button triggers batch mode
    onBatchClick?: () => void;
    onTrendsClick?: () => void;
    theme: string;
    t: (key: string) => string;
    // Story 12.3: Scan status for icon color indicator
    scanStatus?: ScanStatus;
}

export const Nav: React.FC<NavProps> = ({ view, setView, onScanClick, onBatchClick, onTrendsClick, theme, t, scanStatus = 'idle' }) => {
    // Story 7.12: Theme-aware styling using CSS variables (AC #8)
    const isDark = theme === 'dark';

    // Story 12.1: Long-press detection for batch mode (AC #1)
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);
    const LONG_PRESS_DURATION = 500; // 500ms for long press

    const handlePointerDown = useCallback(() => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            // Trigger batch mode on long press
            if (onBatchClick) {
                onBatchClick();
            }
        }, LONG_PRESS_DURATION);
    }, [onBatchClick]);

    const handlePointerUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // Only trigger regular scan if it wasn't a long press
        if (!isLongPress.current) {
            onScanClick();
        }
    }, [onScanClick]);

    const handlePointerLeave = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Nav item color based on active state - uses CSS variables
    const getNavItemStyle = (v: string): React.CSSProperties => ({
        color: view === v ? 'var(--accent)' : 'var(--secondary)',
    });

    // Nav bar background styling
    const navStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    // Story 12.3: FAB button gradient based on scan status (AC #3)
    const getFabGradient = (): string => {
        switch (scanStatus) {
            case 'processing':
                // Amber gradient for processing state
                return 'linear-gradient(135deg, #f59e0b, #d97706)';
            case 'ready':
                // Green gradient for ready-to-review state
                return 'linear-gradient(135deg, #10b981, #059669)';
            default:
                // Default accent gradient
                return 'linear-gradient(135deg, var(--accent), #6366f1)';
        }
    };

    return (
        // Story 11.6: Fixed nav with safe area bottom padding (AC #3, #6)
        <div
            className="fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-between items-center z-50 flex-shrink-0"
            style={{
                ...navStyle,
                paddingBottom: 'calc(0.75rem + var(--safe-bottom, 0px))',
            }}
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
            {/* Story 12.1: Long-press opens batch mode (AC #1) */}
            <div className="relative -top-6">
                <button
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerLeave}
                    onPointerCancel={handlePointerLeave}
                    className={`text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all hover:shadow-2xl select-none ${
                        scanStatus === 'processing' ? 'animate-pulse' : ''
                    }`}
                    style={{ background: getFabGradient() }}
                    aria-label={scanStatus === 'processing' ? t('batchProcessing') : scanStatus === 'ready' ? t('batchReviewReady') : t('scan')}
                >
                    <Camera size={24} strokeWidth={2} />
                </button>
            </div>
            {/* Story 10a.3: Renamed from Receipts to Insights (AC #1, #2, #3) */}
            <button
                onClick={() => setView('insights')}
                className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
                style={getNavItemStyle('insights')}
            >
                <Lightbulb size={24} strokeWidth={2} />
                <span className="text-[10px] font-medium">{t('insights')}</span>
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
