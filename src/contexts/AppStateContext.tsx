/**
 * Story 14c-refactor.9: AppStateContext - App-wide state for UI feedback
 *
 * Provides global app state for toast messages and operation status indicators.
 * Manages transient UI state that needs to be accessible across components.
 *
 * Features:
 * - Toast message display with auto-dismiss
 * - Data wipe operation status
 * - Export operation status
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 *
 * @example
 * ```tsx
 * // In any component
 * const { toastMessage, setToastMessage, wiping, exporting } = useAppState();
 *
 * // Show a success toast
 * setToastMessage({ text: 'Transaction saved!', type: 'success' });
 *
 * // Show operation progress
 * if (wiping) return <LoadingSpinner message="Deleting data..." />;
 * ```
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';

import type { ToastMessage } from '@/shared/hooks/useToast';

// =============================================================================
// Types — ToastMessage re-exported from @/shared/hooks/useToast (Story 15-2h)
// =============================================================================

export type { ToastMessage };

/**
 * Context value provided to consumers
 */
export interface AppStateContextValue {
    /** Current toast message (null if none) */
    toastMessage: ToastMessage | null;
    /** Set toast message (auto-dismisses after 3 seconds) */
    setToastMessage: (message: ToastMessage | null) => void;
    /** Whether data wipe operation is in progress */
    wiping: boolean;
    /** Set wiping status */
    setWiping: (wiping: boolean) => void;
    /** Whether data export operation is in progress */
    exporting: boolean;
    /** Set exporting status */
    setExporting: (exporting: boolean) => void;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * AppState Context - provides global app state and UI feedback.
 *
 * IMPORTANT: Do not use useContext(AppStateContext) directly.
 * Use the useAppState() hook instead for proper error handling.
 */
const AppStateContext = createContext<AppStateContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

interface AppStateProviderProps {
    children: ReactNode;
    /** Toast auto-dismiss duration in milliseconds (default: 3000) */
    toastDuration?: number;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * AppState Context Provider.
 *
 * Wrap your app with this provider to enable global app state management.
 *
 * @example
 * ```tsx
 * <AppStateProvider>
 *   <App />
 * </AppStateProvider>
 * ```
 */
export function AppStateProvider({
    children,
    toastDuration = 3000,
}: AppStateProviderProps) {
    const [toastMessage, setToastMessageState] = useState<ToastMessage | null>(null);
    const [wiping, setWipingState] = useState(false);
    const [exporting, setExportingState] = useState(false);

    // ===========================================================================
    // Auto-dismiss Toast Effect
    // ===========================================================================

    // Auto-dismiss toast — errors stay longer for readability (Story 15-2h)
    useEffect(() => {
        if (toastMessage) {
            const duration = toastMessage.type === 'error' ? toastDuration * 2 : toastDuration;
            const timer = setTimeout(() => setToastMessageState(null), duration);
            return () => clearTimeout(timer);
        }
    }, [toastMessage, toastDuration]);

    // ===========================================================================
    // Action Functions
    // ===========================================================================

    const setToastMessage = useCallback((message: ToastMessage | null) => {
        setToastMessageState(message);
    }, []);

    const setWiping = useCallback((value: boolean) => {
        setWipingState(value);
    }, []);

    const setExporting = useCallback((value: boolean) => {
        setExportingState(value);
    }, []);

    // ===========================================================================
    // Memoized Context Value
    // ===========================================================================

    const value = useMemo<AppStateContextValue>(
        () => ({
            toastMessage,
            setToastMessage,
            wiping,
            setWiping,
            exporting,
            setExporting,
        }),
        [toastMessage, setToastMessage, wiping, setWiping, exporting, setExporting]
    );

    return (
        <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
    );
}

// =============================================================================
// Consumer Hooks
// =============================================================================

/**
 * Access app state context - throws if outside provider.
 *
 * Use this hook in components that REQUIRE app state functionality.
 *
 * @throws Error if used outside AppStateProvider
 *
 * @example
 * ```tsx
 * function TransactionSaver() {
 *   const { setToastMessage } = useAppState();
 *
 *   const handleSave = async () => {
 *     await saveTransaction(data);
 *     setToastMessage({ text: 'Transaction saved!', type: 'success' });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useAppState(): AppStateContextValue {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}

/**
 * Access app state context - returns null if outside provider.
 *
 * Use this hook in components that OPTIONALLY use app state,
 * such as layout components rendered before full app initialization.
 *
 * @example
 * ```tsx
 * function ToastDisplay() {
 *   const appState = useAppStateOptional();
 *
 *   if (!appState?.toastMessage) return null;
 *
 *   return (
 *     <div className={`toast toast-${appState.toastMessage.type}`}>
 *       {appState.toastMessage.text}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAppStateOptional(): AppStateContextValue | null {
    return useContext(AppStateContext);
}
