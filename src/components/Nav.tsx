/**
 * Nav Component - Bottom Navigation Bar
 *
 * Story 14.11: Bottom Navigation Redesign
 * Epic 14: Core Implementation
 *
 * Redesigned navigation bar matching mockup design system with:
 * - CSS variable theming (--primary, --text-tertiary, --bg-secondary)
 * - Center FAB elevated with gradient
 * - Active state animations with reduced motion support
 * - Haptic feedback on navigation
 * - Safe area handling for iOS home indicator
 *
 * @see docs/uxui/mockups/01_views/navigation-alternatives.html
 */

import React, { useRef, useCallback } from 'react';
import { Camera, Home, Lightbulb, BarChart3, Bell } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION, EASING } from './animation/constants';

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
    // Story 14.11: Reduced motion preference for AC #5
    const prefersReducedMotion = useReducedMotion();

    // Story 7.12: Theme-aware styling using CSS variables (AC #8)
    // Theme awareness handled via CSS variables, dark/light mode set by parent
    void theme; // Theme applied via CSS variables

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

    // Story 14.11 AC #6: Haptic feedback on nav selection
    const triggerHaptic = useCallback(() => {
        if (!prefersReducedMotion && navigator.vibrate) {
            navigator.vibrate(10); // Brief 10ms haptic
        }
    }, [prefersReducedMotion]);

    // Story 14.11 AC #5: Handle nav click with animation and haptic
    const handleNavClick = useCallback((targetView: string, additionalCallback?: () => void) => {
        triggerHaptic();
        if (additionalCallback) {
            additionalCallback();
        }
        setView(targetView);
    }, [setView, triggerHaptic]);

    // Story 14.11 AC #2: Nav item styling with CSS variables
    const getNavItemClasses = (_v: string): string => {
        // Note: v is available if view-specific classes are needed
        const baseClasses = 'flex flex-col items-center gap-1 py-1.5 px-2.5 cursor-pointer select-none';

        // Story 14.11 AC #5: Active state animation with scale
        const transitionClasses = prefersReducedMotion
            ? ''
            : 'transition-all active:scale-95';

        return `${baseClasses} ${transitionClasses}`;
    };

    // Story 14.11 AC #2: Icon and label color based on active state
    const getNavItemStyle = (v: string): React.CSSProperties => {
        const isActive = view === v;
        return {
            color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
            // Story 14.11 AC #5: Transition for color change
            transition: prefersReducedMotion ? 'none' : `color ${DURATION.FAST}ms ${EASING.OUT}`,
        };
    };

    // Story 14.11 AC #1: Nav bar styling from mockup
    // Story 14.12: Use --bg to match header, --border-medium for accent top border (1px to match button outlines)
    const navStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg)',
        borderTop: '1px solid var(--border-medium)',
    };

    // Story 12.3 + 14.11 AC #3: FAB button gradient based on scan status
    const getFabGradient = (): string => {
        switch (scanStatus) {
            case 'processing':
                // Amber gradient for processing state
                return 'linear-gradient(135deg, #f59e0b, #d97706)';
            case 'ready':
                // Green gradient for ready-to-review state
                return 'linear-gradient(135deg, #10b981, #059669)';
            default:
                // Story 14.11 AC #3: Default gradient from mockup
                return 'linear-gradient(135deg, var(--primary), var(--primary-hover, #6366f1))';
        }
    };

    // Story 14.11 AC #3: FAB styling classes
    const getFabClasses = (): string => {
        const baseClasses = 'text-white rounded-full select-none';
        const sizeClasses = 'w-[52px] h-[52px] flex items-center justify-center';
        const shadowClasses = 'shadow-lg';

        // Story 14.11 AC #5: Animation classes based on reduced motion preference
        const animationClasses = prefersReducedMotion
            ? ''
            : 'transition-all hover:scale-105 active:scale-95';

        // Story 12.3: Pulse animation for processing state
        const pulseClass = scanStatus === 'processing' && !prefersReducedMotion ? 'animate-pulse' : '';

        return `${baseClasses} ${sizeClasses} ${shadowClasses} ${animationClasses} ${pulseClass}`;
    };

    return (
        // Story 14.11 AC #1, #4: Fixed nav with mockup styling and safe area handling
        // Story 14.12: Orange/peach top border accent line per mockup
        <nav
            className="fixed bottom-0 left-0 right-0 flex items-end justify-around z-50 flex-shrink-0"
            style={{
                ...navStyle,
                // Story 14.11 AC #1: Padding from mockup CSS - explicit to allow paddingBottom override
                paddingTop: '8px',
                paddingLeft: '16px',
                paddingRight: '16px',
                // Story 14.11 AC #4: Safe area bottom padding for iOS home indicator
                paddingBottom: 'calc(12px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))',
            }}
            role="navigation"
            aria-label={t('mainNavigation') || 'Main navigation'}
        >
            {/* Home */}
            <button
                onClick={() => handleNavClick('dashboard')}
                className={getNavItemClasses('dashboard')}
                style={getNavItemStyle('dashboard')}
                aria-current={view === 'dashboard' ? 'page' : undefined}
            >
                <Home size={24} strokeWidth={1.8} />
                <span
                    className="text-[10px]"
                    style={{ fontWeight: view === 'dashboard' ? 600 : 500 }}
                >
                    {t('home')}
                </span>
            </button>

            {/* Analytics */}
            <button
                onClick={() => handleNavClick('trends', onTrendsClick)}
                className={getNavItemClasses('trends')}
                style={getNavItemStyle('trends')}
                aria-current={view === 'trends' ? 'page' : undefined}
            >
                <BarChart3 size={24} strokeWidth={1.8} />
                {/* Story 7.10 AC #9: UX spec label is "Analytics" */}
                <span
                    className="text-[10px]"
                    style={{ fontWeight: view === 'trends' ? 600 : 500 }}
                >
                    {t('analytics')}
                </span>
            </button>

            {/* Center FAB - Story 14.11 AC #3: Elevated scan button */}
            {/* Story 12.1: Long-press opens batch mode (AC #1) */}
            <div
                className="relative"
                style={{
                    // Story 14.11 AC #3: FAB elevation matching mockup (margin-top: -56px → -40px for 52px button)
                    marginTop: '-40px',
                    padding: 0,
                }}
            >
                <button
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerLeave}
                    onPointerCancel={handlePointerLeave}
                    className={getFabClasses()}
                    style={{
                        background: getFabGradient(),
                        // Story 14.11 AC #3: Shadow from mockup
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    aria-label={
                        scanStatus === 'processing'
                            ? t('batchProcessing')
                            : scanStatus === 'ready'
                                ? t('batchReviewReady')
                                : t('scan')
                    }
                >
                    <Camera size={24} strokeWidth={2} />
                </button>
            </div>

            {/* Insights - Story 10a.3: Renamed from Receipts to Insights */}
            <button
                onClick={() => handleNavClick('insights')}
                className={getNavItemClasses('insights')}
                style={getNavItemStyle('insights')}
                aria-current={view === 'insights' ? 'page' : undefined}
            >
                <Lightbulb size={24} strokeWidth={1.8} />
                <span
                    className="text-[10px]"
                    style={{ fontWeight: view === 'insights' ? 600 : 500 }}
                >
                    {t('insights')}
                </span>
            </button>

            {/* Alerts - Story 14.11: Per mockup, 5th nav item is Alerts not Settings */}
            <button
                onClick={() => handleNavClick('alerts')}
                className={getNavItemClasses('alerts')}
                style={getNavItemStyle('alerts')}
                aria-current={view === 'alerts' ? 'page' : undefined}
            >
                <Bell size={24} strokeWidth={1.8} />
                <span
                    className="text-[10px]"
                    style={{ fontWeight: view === 'alerts' ? 600 : 500 }}
                >
                    {t('alerts')}
                </span>
            </button>
        </nav>
    );
};
