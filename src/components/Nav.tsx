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
 * Story 14d.3: Hybrid Navigation Blocking
 * - Navigation blocked when in scan view AND dialog is active
 * - Uses useScanOptional() to access scan state without throwing if outside provider
 *
 * Story 14d.7: Mode Selector Popup
 * - Long-press on FAB shows mode selector popup
 * - Request precedence: if active request, navigate to scan view instead of showing popup
 * - Single tap triggers single scan (unchanged behavior when IDLE)
 *
 * Story 14d.8: FAB Visual States
 * - FAB color changes based on scan mode (single=green, batch=amber, statement=violet)
 * - Icon changes based on mode (Camera, Layers, CreditCard, AlertTriangle)
 * - Shine animation during processing, pulse animation during batch review
 * - All animations respect prefers-reduced-motion
 *
 * @see docs/uxui/mockups/01_views/navigation-alternatives.html
 * @see docs/sprint-artifacts/epic14d/stories/story-14d.7-mode-selector-popup.md
 * @see docs/sprint-artifacts/epic14d/stories/story-14d.8-fab-visual-states.md
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { Camera, Home, Lightbulb, BarChart3, Bell, Layers, CreditCard, AlertTriangle } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATION, EASING } from './animation/constants';
import { formatCreditsDisplay, formatSuperCreditsDisplay } from '../services/userCreditsService';
// Story 14d.3: Import useScanOptional to access scan state for navigation blocking
import { useScanOptional } from '../contexts/ScanContext';
// Story 14d.7: Mode Selector Popup
import { ScanModeSelector } from './scan/ScanModeSelector';
import type { ScanModeId } from './scan/ScanModeSelector';
// Story 14d.8: FAB Visual States
import { getFABColorScheme, shouldShowShineAnimation, shouldShowPulseAnimation } from '../config/fabColors';
import type { ScanMode, ScanPhase } from '../types/scanStateMachine';

// Story 12.3: Scan status for nav icon indicator
export type ScanStatus = 'idle' | 'processing' | 'ready';

interface NavProps {
    view: string;
    setView: (view: string) => void;
    onScanClick: () => void;
    // Story 12.1: Long-press or batch button triggers batch mode
    onBatchClick?: () => void;
    // Story 14d.7: Statement scan callback (placeholder for future)
    onStatementClick?: () => void;
    onTrendsClick?: () => void;
    theme: string;
    t: (key: string, params?: Record<string, string | number>) => string;
    // Story 12.3: Scan status for icon color indicator
    scanStatus?: ScanStatus;
    /** Available normal scan credits to display on camera button (bottom right) */
    scanCredits?: number;
    /** Available super credits (tier 2) to display on camera button (bottom left) */
    superCredits?: number;
    /** Callback when user taps on credit badges to show credit info */
    onCreditInfoClick?: () => void;
    /** When true, FAB displays batch mode styling (amber gradient, stack icon) */
    isBatchMode?: boolean;
    /** Story 14d.7: Toast message callback for "scan in progress" */
    onShowToast?: (message: string) => void;
    /** Story 14c.2: Badge count for alerts tab (pending invitations, etc.) */
    alertsBadgeCount?: number;
    /** Story 14c.4: Active group color for top border accent when in group mode */
    activeGroupColor?: string;
}

export const Nav: React.FC<NavProps> = ({ view, setView, onScanClick, onBatchClick, onStatementClick, onTrendsClick, theme, t, scanStatus = 'idle', scanCredits, superCredits, onCreditInfoClick, isBatchMode = false, onShowToast, alertsBadgeCount = 0, activeGroupColor }) => {
    // Story 14.11: Reduced motion preference for AC #5
    const prefersReducedMotion = useReducedMotion();

    // Story 14d.3 AC #1: Access scan state for navigation blocking
    // Uses optional hook since Nav may render before ScanProvider is mounted
    const scanContext = useScanOptional();

    // Story 14d.3 AC #2-4: Navigation blocking state and feedback
    const [showBlockedFeedback, setShowBlockedFeedback] = useState(false);

    // Story 14d.7: Mode selector popup state
    const [showModeSelector, setShowModeSelector] = useState(false);

    // Story 14d.7 AC-RP1: Check if there's an active request (request precedence)
    const hasActiveRequest = scanContext ? scanContext.hasActiveRequest : false;

    // Story 14d.3: Determine if navigation should be blocked
    // Only block when: 1) in scan view AND 2) dialog is active
    const isScanView = view === 'transaction-editor' ||
                       view === 'batch-capture' ||
                       view === 'batch-review' ||
                       view === 'scan-result';

    // hasDialog is true when any dialog is showing
    const hasDialog = scanContext ? scanContext.hasDialog : false;

    // Block navigation only when in scan view AND dialog is active
    const shouldBlockNavigation = isScanView && hasDialog;

    // Story 14d.3 AC #4: Clear blocked feedback after brief display
    useEffect(() => {
        if (showBlockedFeedback) {
            const timer = setTimeout(() => {
                setShowBlockedFeedback(false);
            }, 1500); // Show feedback for 1.5 seconds
            return () => clearTimeout(timer);
        }
    }, [showBlockedFeedback]);

    // Story 7.12: Theme-aware styling using CSS variables (AC #8)
    // Theme awareness handled via CSS variables, dark/light mode set by parent
    void theme; // Theme applied via CSS variables

    // Story 12.1 + 14d.7: Long-press detection for mode selector popup (AC #1)
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);
    const LONG_PRESS_DURATION = 500; // 500ms for long press

    // Story 14d.7: Navigate to scan view when request is active
    const navigateToActiveRequest = useCallback(() => {
        // AC-RP3: Show toast "Tienes un escaneo en progreso"
        onShowToast?.(t('scanInProgress'));
        // AC-RP1, AC-RP2: Navigate to current request view
        setView('transaction-editor');
    }, [onShowToast, setView, t]);

    const handlePointerDown = useCallback(() => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;

            // Story 14d.7 AC-RP1: If request in progress, navigate instead of showing mode selector
            if (hasActiveRequest) {
                navigateToActiveRequest();
                return;
            }

            // AC #5: Haptic feedback on long press trigger
            if (!prefersReducedMotion && navigator.vibrate) {
                navigator.vibrate(50);
            }

            // Show mode selector popup (AC #1)
            setShowModeSelector(true);
        }, LONG_PRESS_DURATION);
    }, [hasActiveRequest, navigateToActiveRequest, prefersReducedMotion]);

    const handlePointerUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // Only trigger regular scan if it wasn't a long press and mode selector isn't showing
        if (!isLongPress.current && !showModeSelector) {
            // Story 14d.7 AC-RP2: If request in progress, navigate instead of starting new scan
            if (hasActiveRequest) {
                navigateToActiveRequest();
                return;
            }
            // AC #2: Single tap triggers single scan when IDLE
            onScanClick();
        }
    }, [onScanClick, showModeSelector, hasActiveRequest, navigateToActiveRequest]);

    const handlePointerLeave = useCallback(() => {
        // AC #3: Pointer leave cancels long press
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Story 14d.7: Handle mode selection from popup
    const handleModeSelect = useCallback((mode: ScanModeId) => {
        switch (mode) {
            case 'single':
                // AC #19: Single mode triggers startSingleScan
                onScanClick();
                break;
            case 'batch':
                // AC #20: Batch mode triggers startBatchScan
                onBatchClick?.();
                break;
            case 'statement':
                // AC #21: Statement mode triggers startStatementScan (placeholder)
                onStatementClick?.();
                break;
        }
    }, [onScanClick, onBatchClick, onStatementClick]);

    // Story 14.11 AC #6: Haptic feedback on nav selection
    const triggerHaptic = useCallback(() => {
        if (!prefersReducedMotion && navigator.vibrate) {
            navigator.vibrate(10); // Brief 10ms haptic
        }
    }, [prefersReducedMotion]);

    // Story 14.11 AC #5: Handle nav click with animation and haptic
    // Story 14d.3 AC #2-3: Check for navigation blocking before allowing navigation
    const handleNavClick = useCallback((targetView: string, additionalCallback?: () => void) => {
        // Story 14d.3 AC #2: Block navigation if in scan view AND dialog is active
        if (shouldBlockNavigation) {
            // Story 14d.3 AC #4: Show visual feedback when navigation is blocked
            setShowBlockedFeedback(true);
            // Provide haptic feedback for blocked navigation (longer vibration)
            if (!prefersReducedMotion && navigator.vibrate) {
                navigator.vibrate([50, 30, 50]); // Double pulse to indicate blocked
            }
            if (import.meta.env.DEV) {
                console.warn('Navigation blocked: dialog requires response');
            }
            return;
        }

        triggerHaptic();
        if (additionalCallback) {
            additionalCallback();
        }
        setView(targetView);
    }, [setView, triggerHaptic, shouldBlockNavigation, prefersReducedMotion]);

    // Story 14.11 AC #2: Nav item styling with CSS variables
    // Story 14c.13: Removed labels - icons only, reduced padding for smaller bar
    const getNavItemClasses = (_v: string): string => {
        // Note: v is available if view-specific classes are needed
        const baseClasses = 'flex items-center justify-center py-2 px-4 cursor-pointer select-none';

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
    // Story 14c.4: Subtle gradient from bottom (theme bg) to top (group color) when in group mode
    const navStyle: React.CSSProperties = {
        // When in group mode, use gradient background from bottom to top
        // 70% from bottom is normal bg color, then gradient to group color at top
        background: activeGroupColor
            ? `linear-gradient(to top, var(--bg) 0%, var(--bg) 70%, ${activeGroupColor}20 100%)`
            : 'var(--bg)',
        borderTop: '1px solid var(--border-medium)',
    };

    // =========================================================================
    // Story 14d.8: FAB Visual States - Derive visual state from ScanContext
    // =========================================================================

    // Extract mode and phase from scan context (with fallbacks for when context not available)
    const scanMode: ScanMode = scanContext?.state.mode ?? 'single';
    const scanPhase: ScanPhase = scanContext?.state.phase ?? 'idle';
    const contextIsProcessing = scanContext?.isProcessing ?? false;

    // Story 14d.8 AC1-4: Get color scheme based on mode and phase
    const fabColorScheme = useMemo(() => {
        return getFABColorScheme(scanMode, scanPhase);
    }, [scanMode, scanPhase]);

    // Story 14d.8 AC11-14: Determine if shine animation should show
    const showShine = useMemo(() => {
        if (prefersReducedMotion) return false; // AC15: Respect reduced motion
        return shouldShowShineAnimation(scanPhase, contextIsProcessing);
    }, [scanPhase, contextIsProcessing, prefersReducedMotion]);

    // Story 14d.8 AC18: Determine if pulse animation should show (batch reviewing)
    const showPulse = useMemo(() => {
        if (prefersReducedMotion) return false; // AC15: Respect reduced motion
        return shouldShowPulseAnimation(scanMode, scanPhase);
    }, [scanMode, scanPhase, prefersReducedMotion]);

    // Story 14d.8 AC6-9: Icon selection based on mode and error state
    const FabIcon = useMemo(() => {
        // AC9: Error state shows alert icon
        if (scanPhase === 'error') {
            return AlertTriangle;
        }
        // AC6-8: Mode-specific icons
        switch (scanMode) {
            case 'batch':
                return Layers; // AC7
            case 'statement':
                return CreditCard; // AC8
            case 'single':
            default:
                return Camera; // AC6
        }
    }, [scanMode, scanPhase]);

    // Story 14d.8: Compute FAB gradient - use color scheme from state machine
    // Fallback to legacy logic for backward compatibility when context isn't available
    const getFabGradient = (): string => {
        // When context is available, use the color scheme from state machine
        if (scanContext) {
            return fabColorScheme.gradient;
        }

        // Legacy fallback: Use props-based logic
        // Batch mode (in batch-capture view): Use amber/gold gradient (super credit colors)
        if (isBatchMode) {
            return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
        }

        // 'ready' state means batch results available - use green
        if (scanStatus === 'ready') {
            return 'linear-gradient(135deg, var(--success, #10b981), #059669)';
        }

        // Default gradient uses theme primary color for idle AND single scan processing
        return 'linear-gradient(135deg, var(--primary), var(--primary-hover, var(--primary)))';
    };

    // Story 14.11 AC #3: FAB styling classes
    // Story 14d.8: Updated to use state machine for animations
    const getFabClasses = (): string => {
        const baseClasses = 'text-white rounded-full select-none';
        const sizeClasses = 'w-[52px] h-[52px] flex items-center justify-center';
        const shadowClasses = 'shadow-lg';

        // Story 14.11 AC #5: Animation classes based on reduced motion preference
        const animationClasses = prefersReducedMotion
            ? ''
            : 'transition-all hover:scale-105 active:scale-95';

        // Story 14d.8 AC18: Pulse animation for batch reviewing state
        // Story 12.3: Also support legacy scanStatus prop
        const pulseClass = (showPulse || (scanStatus === 'processing' && !prefersReducedMotion)) ? 'animate-pulse' : '';

        // Story 14d.8 AC11-14: Shine animation class
        const shineClass = showShine ? 'fab-shine' : '';

        return `${baseClasses} ${sizeClasses} ${shadowClasses} ${animationClasses} ${pulseClass} ${shineClass}`;
    };

    return (
        // Story 14.11 AC #1, #4: Fixed nav with mockup styling and safe area handling
        // Story 14.12: Orange/peach top border accent line per mockup
        <>
        {/* Story 14d.3 AC #4: Shake animation for blocked navigation feedback */}
        {/* Story 14d.8 AC11-14: Shine animation for processing state */}
        <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(-50%); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-50% - 4px)); }
                20%, 40%, 60%, 80% { transform: translateX(calc(-50% + 4px)); }
            }

            /* Story 14d.8 AC11-14: FAB shine animation for processing state */
            @keyframes fab-shine {
                0% {
                    background-position: -100% 0;
                }
                100% {
                    background-position: 200% 0;
                }
            }

            .fab-shine {
                position: relative;
                overflow: hidden;
            }

            .fab-shine::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.3) 50%,
                    transparent 100%
                );
                background-size: 200% 100%;
                animation: fab-shine 1.5s infinite;
                border-radius: inherit;
                pointer-events: none;
            }

            /* Story 14d.8 AC15: Respect prefers-reduced-motion */
            @media (prefers-reduced-motion: reduce) {
                .fab-shine::after {
                    animation: none;
                    opacity: 0;
                }
            }
        `}</style>
        <nav
            className="fixed bottom-0 left-0 right-0 flex items-end z-50 flex-shrink-0"
            style={{
                ...navStyle,
                // Story 14.11 AC #1: Padding from mockup CSS - explicit to allow paddingBottom override
                // Story 14c.13: Reduced padding for smaller icon-only nav bar
                paddingTop: '4px',
                paddingLeft: '8px',
                paddingRight: '8px',
                // Story 14.11 AC #4: Safe area bottom padding for iOS home indicator
                paddingBottom: 'calc(8px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))',
            }}
            role="navigation"
            aria-label={t('mainNavigation') || 'Main navigation'}
        >
            {/* Left side icons - takes equal space */}
            <div className="flex-1 flex justify-around items-center">
                {/* Home */}
                <button
                    onClick={() => handleNavClick('dashboard')}
                    className={getNavItemClasses('dashboard')}
                    style={getNavItemStyle('dashboard')}
                    aria-current={view === 'dashboard' ? 'page' : undefined}
                    aria-label={t('home')}
                >
                    <Home size={24} strokeWidth={1.8} />
                </button>

                {/* Analytics */}
                <button
                    onClick={() => handleNavClick('trends', onTrendsClick)}
                    className={getNavItemClasses('trends')}
                    style={getNavItemStyle('trends')}
                    aria-current={view === 'trends' ? 'page' : undefined}
                    aria-label={t('analytics')}
                >
                    <BarChart3 size={24} strokeWidth={1.8} />
                </button>
            </div>

            {/* Center FAB - Story 14.11 AC #3: Elevated scan button */}
            {/* Story 12.1 + 14d.7: Long-press opens mode selector popup */}
            <div
                className="relative flex-shrink-0"
                style={{
                    // Story 14.11 AC #3: FAB elevation matching mockup
                    // Story 14c.13: Adjusted for smaller nav bar, extra horizontal margin
                    marginTop: '-36px',
                    marginLeft: '16px',
                    marginRight: '16px',
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
                        // Story 14d.8: Use mode-specific aria-labels when context available
                        scanContext
                            ? scanMode === 'batch'
                                ? t('batchModeBatch') || 'Batch Mode'
                                : scanMode === 'statement'
                                    ? t('batchModeStatement') || 'Statement Mode'
                                    : scanPhase === 'scanning'
                                        ? t('batchProcessing')
                                        : t('scan')
                            // Legacy fallback
                            : isBatchMode
                                ? t('batchModeBatch') || 'Batch Mode'
                                : scanStatus === 'processing'
                                    ? t('batchProcessing')
                                    : scanStatus === 'ready'
                                        ? t('batchReviewReady')
                                        : t('scan')
                    }
                    // Story 14d.7 AC #28: ARIA attributes for popup menu
                    aria-haspopup="menu"
                    aria-expanded={showModeSelector}
                    data-testid="scan-fab"
                >
                    {/* Story 14d.8 AC6-9: Dynamic icon based on mode and error state
                      * AC6: Single mode shows camera icon
                      * AC7: Batch mode shows layers icon
                      * AC8: Statement mode shows credit card icon
                      * AC9: Error state shows alert icon
                      * AC10: Icons transition smoothly on mode change (via CSS transition)
                      */}
                    <FabIcon size={24} strokeWidth={2} />
                </button>
                {/* Super credits badge - upper-LEFT of FAB (gold/amber color) - tappable */}
                {superCredits !== undefined && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering FAB
                            onCreditInfoClick?.();
                        }}
                        className="absolute px-1 py-px rounded-full text-xs font-semibold min-w-[18px] text-center transition-transform active:scale-95"
                        style={{
                            bottom: '-2px',
                            left: '-10px',
                            backgroundColor: '#fbbf24', // amber-400
                            color: '#78350f', // amber-900
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            border: '1px solid #f59e0b', // amber-500
                        }}
                        aria-label={`${superCredits} ${t('superCreditsAvailable') || 'super credits available'}`}
                    >
                        {formatSuperCreditsDisplay(superCredits)}
                    </button>
                )}
                {/* Normal credits badge - upper-RIGHT of FAB (default theme color) - tappable */}
                {scanCredits !== undefined && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering FAB
                            onCreditInfoClick?.();
                        }}
                        className="absolute px-1 py-px rounded-full text-xs font-semibold min-w-[18px] text-center transition-transform active:scale-95"
                        style={{
                            bottom: '-2px',
                            right: '-10px',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            border: '1px solid var(--border-light)',
                        }}
                        aria-label={`${scanCredits} ${t('creditsAvailable') || 'credits available'}`}
                    >
                        {formatCreditsDisplay(scanCredits)}
                    </button>
                )}
            </div>

            {/* Right side icons - takes equal space */}
            <div className="flex-1 flex justify-around items-center">
                {/* Insights - Story 10a.3: Renamed from Receipts to Insights */}
                <button
                    onClick={() => handleNavClick('insights')}
                    className={getNavItemClasses('insights')}
                    style={getNavItemStyle('insights')}
                    aria-current={view === 'insights' ? 'page' : undefined}
                    aria-label={t('insights')}
                >
                    <Lightbulb size={24} strokeWidth={1.8} />
                </button>

                {/* Alerts - Story 14.11: Per mockup, 5th nav item is Alerts not Settings */}
                {/* Story 14c.2: Added badge count for pending invitations */}
                <button
                    onClick={() => handleNavClick('alerts')}
                    className={getNavItemClasses('alerts')}
                    style={getNavItemStyle('alerts')}
                    aria-current={view === 'alerts' ? 'page' : undefined}
                    aria-label={t('alerts')}
                >
                    <div className="relative">
                        <Bell size={24} strokeWidth={1.8} />
                        {/* Story 14c.2 AC2: Notification badge for pending invitations */}
                        {alertsBadgeCount > 0 && (
                            <span
                                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full"
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                }}
                            >
                                {alertsBadgeCount > 9 ? '9+' : alertsBadgeCount}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            {/* Story 14d.3 AC #4: Visual feedback when navigation is blocked */}
            {showBlockedFeedback && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50"
                    style={{
                        bottom: '100%',
                        marginBottom: '8px',
                        backgroundColor: 'var(--error, #ef4444)',
                        color: 'white',
                        animation: prefersReducedMotion ? 'none' : 'shake 0.3s ease-in-out',
                        whiteSpace: 'nowrap',
                    }}
                    role="alert"
                    aria-live="polite"
                >
                    {t('resolveDialogFirst') || 'Resolve dialog first'}
                </div>
            )}
        </nav>

        {/* Story 14d.7: Mode Selector Popup - AC #4: NEVER appears when there is active request */}
        <ScanModeSelector
            isOpen={showModeSelector && !hasActiveRequest}
            onClose={() => setShowModeSelector(false)}
            onSelectMode={handleModeSelect}
            normalCredits={scanCredits ?? 0}
            superCredits={superCredits ?? 0}
            t={t}
        />
        </>
    );
};
