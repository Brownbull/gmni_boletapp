/**
 * Story 14c-refactor.9: NavigationContext - App-wide navigation context
 *
 * Provides view navigation state and methods to the entire app via React Context.
 * Manages current view, previous view for back navigation, and settings subview state.
 *
 * Features:
 * - View state management (dashboard, scan, trends, settings, etc.)
 * - Previous view tracking for back navigation
 * - Settings subview state for hierarchical navigation
 * - Scroll position restoration (managed separately in App.tsx)
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 *
 * @example
 * ```tsx
 * // In any component
 * const { view, setView, goBack, settingsSubview, setSettingsSubview } = useNavigation();
 *
 * // Navigate to a view
 * setView('trends');
 *
 * // Go back to previous view
 * goBack();
 * ```
 */

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Available view types in the app
 * Story 10a.3: Changed 'list' to 'insights' (InsightsView)
 * Story 12.1: Added 'batch-capture' view for batch mode scanning
 * Story 12.3: Added 'batch-review' view for reviewing processed receipts
 * Story 14.11: Added 'alerts' view for nav bar redesign
 * Story 14.14: Added 'history' view for transaction list
 * Story 14.16: Added 'reports' view for weekly report cards
 * Story 14.23: Added 'transaction-editor' view for unified transaction editor
 * Story 14.31: Added 'items' view for item history
 * Story 14d.9: Added 'statement-scan' view for statement scanning placeholder
 * Story 14.31: Added 'recent-scans' view for recent scans sorted by scan date
 */
export type View =
    | 'dashboard'
    | 'scan'
    | 'scan-result'
    | 'edit'
    | 'transaction-editor'
    | 'trends'
    | 'insights'
    | 'settings'
    | 'alerts'
    | 'batch-capture'
    | 'batch-review'
    | 'history'
    | 'reports'
    | 'items'
    | 'statement-scan'
    | 'recent-scans';

/**
 * Settings subview types for hierarchical navigation
 * Story 14.22: Settings subview state for breadcrumb navigation
 */
export type SettingsSubview =
    | 'main'
    | 'limites'
    | 'perfil'
    | 'preferencias'
    | 'escaneo'
    | 'suscripcion'
    | 'datos'
    | 'grupos'
    | 'app'
    | 'cuenta';

/**
 * Context value provided to consumers
 */
export interface NavigationContextValue {
    /** Current view */
    view: View;
    /** Previous view (for back navigation) */
    previousView: View;
    /** Current settings subview (for hierarchical settings navigation) */
    settingsSubview: SettingsSubview;
    /** Navigate to a specific view */
    setView: (view: View) => void;
    /** Navigate to previous view or dashboard */
    goBack: () => void;
    /** Set settings subview */
    setSettingsSubview: (subview: SettingsSubview) => void;
    /** Navigate with tracking (records current view as previous) */
    navigateWithHistory: (targetView: View) => void;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Navigation Context - provides navigation state and actions.
 *
 * IMPORTANT: Do not use useContext(NavigationContext) directly.
 * Use the useNavigation() hook instead for proper error handling.
 */
const NavigationContext = createContext<NavigationContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

interface NavigationProviderProps {
    children: ReactNode;
    /** Optional initial view (defaults to 'dashboard') */
    initialView?: View;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Navigation Context Provider.
 *
 * Wrap your app with this provider to enable navigation state management.
 *
 * @example
 * ```tsx
 * <NavigationProvider>
 *   <App />
 * </NavigationProvider>
 * ```
 */
export function NavigationProvider({
    children,
    initialView = 'dashboard',
}: NavigationProviderProps) {
    const [view, setViewState] = useState<View>(initialView);
    const [previousView, setPreviousView] = useState<View>('dashboard');
    const [settingsSubview, setSettingsSubview] = useState<SettingsSubview>('main');

    // ===========================================================================
    // Action Functions
    // ===========================================================================

    /**
     * Navigate to a view while tracking the current view as previous.
     * Use this for standard navigation where back button should work.
     */
    const navigateWithHistory = useCallback((targetView: View) => {
        setViewState((currentView) => {
            // Track current view as previous before changing
            setPreviousView(currentView);
            return targetView;
        });
    }, []);

    /**
     * Direct view setter (does not update previousView).
     * Use this for programmatic navigation where history tracking is not needed.
     */
    const setView = useCallback((targetView: View) => {
        setViewState(targetView);
    }, []);

    /**
     * Navigate back to previous view or dashboard.
     * Story 14.16b: If previousView is same as current or invalid, fallback to dashboard.
     */
    const goBack = useCallback(() => {
        setViewState((currentView) => {
            // Fallback conditions:
            // 1. previousView is the same as current view (would be a no-op)
            // 2. previousView is undefined/falsy
            // 3. previousView is 'dashboard' (already the home screen)
            const targetView =
                previousView && previousView !== currentView && previousView !== 'dashboard'
                    ? previousView
                    : 'dashboard';
            return targetView;
        });
    }, [previousView]);

    // ===========================================================================
    // Memoized Context Value
    // ===========================================================================

    const value = useMemo<NavigationContextValue>(
        () => ({
            view,
            previousView,
            settingsSubview,
            setView,
            goBack,
            setSettingsSubview,
            navigateWithHistory,
        }),
        [view, previousView, settingsSubview, setView, goBack, navigateWithHistory]
    );

    return (
        <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
    );
}

// =============================================================================
// Consumer Hooks
// =============================================================================

/**
 * Access navigation context - throws if outside provider.
 *
 * Use this hook in components that REQUIRE navigation functionality.
 *
 * @throws Error if used outside NavigationProvider
 *
 * @example
 * ```tsx
 * function HistoryView() {
 *   const { setView, goBack } = useNavigation();
 *
 *   return (
 *     <div>
 *       <button onClick={goBack}>Back</button>
 *       <button onClick={() => setView('trends')}>View Trends</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNavigation(): NavigationContextValue {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}

/**
 * Access navigation context - returns null if outside provider.
 *
 * Use this hook in components that OPTIONALLY use navigation,
 * such as layout components rendered before full app initialization.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const nav = useNavigationOptional();
 *
 *   // Only show back button if navigation is available
 *   if (nav?.view !== 'dashboard') {
 *     return <button onClick={nav.goBack}>Back</button>;
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useNavigationOptional(): NavigationContextValue | null {
    return useContext(NavigationContext);
}
