/**
 * Story 14c-refactor.25: ViewHandlersContext
 *
 * Provides handler bundles to views via React Context, eliminating prop drilling.
 * Views can `useViewHandlers()` to access transaction, scan, navigation, and dialog handlers.
 *
 * Pattern:
 * - Single context with domain-grouped handler bundles
 * - Handler hooks return memoized result objects (useMemo) for stable references
 * - Context value is memoized to prevent unnecessary re-renders
 * - Views destructure only the bundles they need
 *
 * Re-render Mitigation:
 * - Current: Single context, memoized value. Monitor with React DevTools Profiler.
 * - Future: If re-renders become problematic, split into separate contexts per domain.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <ViewHandlersProvider
 *   transaction={transactionHandlers}
 *   scan={scanHandlers}
 *   navigation={navigationHandlers}
 *   dialog={dialogHandlers}
 * >
 *   {children}
 * </ViewHandlersProvider>
 *
 * // In a view
 * function TransactionEditorView() {
 *   const { transaction, navigation } = useViewHandlers();
 *   const handleSave = () => {
 *     transaction.saveTransaction(tx);
 *     navigation.navigateToView('dashboard');
 *   };
 * }
 * ```
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { UseTransactionHandlersResult } from '../hooks/app/useTransactionHandlers';
import type { UseScanHandlersResult } from '../hooks/app/useScanHandlers';
import type { UseNavigationHandlersResult } from '../hooks/app/useNavigationHandlers';
import type { UseDialogHandlersResult } from '../hooks/app/useDialogHandlers';

// =============================================================================
// Handler Bundle Types
// =============================================================================

/**
 * Transaction handlers bundle.
 * Provides CRUD operations for transactions.
 */
export type TransactionHandlers = UseTransactionHandlersResult;

/**
 * Scan handlers bundle.
 * Provides scan overlay, quick save, currency/total mismatch handlers.
 */
export type ScanHandlers = UseScanHandlersResult;

/**
 * Navigation handlers bundle.
 * Provides view switching, back navigation, and analytics drill-down.
 */
export type NavigationHandlers = UseNavigationHandlersResult;

/**
 * Dialog handlers bundle.
 * Provides toast, credit modal, and conflict dialog state/handlers.
 *
 * Story 14e-4: Credit info modal functions are provided by App.tsx
 * using Modal Manager, not by useDialogHandlers hook.
 */
export type DialogHandlers = UseDialogHandlersResult & {
    /** Open credit info modal (via Modal Manager) */
    openCreditInfoModal: () => void;
    /** Close credit info modal (via Modal Manager) */
    closeCreditInfoModal: () => void;
};

// =============================================================================
// Context Value Type
// =============================================================================

/**
 * ViewHandlersContext value containing all handler bundles.
 * Each bundle is the result of its corresponding hook.
 */
export interface ViewHandlersContextValue {
    /** Transaction CRUD handlers (save, delete, wipe, export, createDefault) */
    transaction: TransactionHandlers;
    /** Scan flow handlers (overlay, quick save, currency/total mismatch) */
    scan: ScanHandlers;
    /** Navigation handlers (navigateToView, navigateBack, handleNavigateToHistory) */
    navigation: NavigationHandlers;
    /** Dialog handlers (toast, credit modal, conflict dialog) */
    dialog: DialogHandlers;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * ViewHandlersContext - null when provider not present.
 * Views MUST be rendered within ViewHandlersProvider.
 */
const ViewHandlersContext = createContext<ViewHandlersContextValue | null>(null);

// Set display name for React DevTools
ViewHandlersContext.displayName = 'ViewHandlersContext';

// =============================================================================
// Provider Props
// =============================================================================

/**
 * Props for ViewHandlersProvider.
 * Each bundle should be memoized (they come from hooks that already memoize).
 */
export interface ViewHandlersProviderProps {
    /** Transaction handlers from useTransactionHandlers */
    transaction: TransactionHandlers;
    /** Scan handlers from useScanHandlers */
    scan: ScanHandlers;
    /** Navigation handlers from useNavigationHandlers */
    navigation: NavigationHandlers;
    /** Dialog handlers from useDialogHandlers */
    dialog: DialogHandlers;
    /** Children to render */
    children: ReactNode;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * ViewHandlersProvider - Makes handler bundles available to child components.
 *
 * CRITICAL: The value is memoized to prevent unnecessary re-renders.
 * Each handler bundle must maintain stable references (memoized in source hook).
 *
 * @example
 * ```tsx
 * // In App.tsx, wrap view rendering area
 * <ViewHandlersProvider
 *   transaction={transactionHandlers}
 *   scan={scanHandlers}
 *   navigation={navigationHandlers}
 *   dialog={dialogHandlers}
 * >
 *   {renderViewSwitch(view, viewProps)}
 * </ViewHandlersProvider>
 * ```
 */
export function ViewHandlersProvider({
    transaction,
    scan,
    navigation,
    dialog,
    children,
}: ViewHandlersProviderProps) {
    // Memoize the context value to prevent re-renders when parent re-renders
    // but handler bundles haven't changed (they're already memoized in source hooks)
    const value = useMemo<ViewHandlersContextValue>(
        () => ({
            transaction,
            scan,
            navigation,
            dialog,
        }),
        [transaction, scan, navigation, dialog]
    );

    return (
        <ViewHandlersContext.Provider value={value}>
            {children}
        </ViewHandlersContext.Provider>
    );
}

// =============================================================================
// Consumer Hook
// =============================================================================

/**
 * useViewHandlers - Access handler bundles from ViewHandlersContext.
 *
 * @throws Error if called outside ViewHandlersProvider
 * @returns ViewHandlersContextValue with all handler bundles
 *
 * @example
 * ```tsx
 * function TransactionEditorView() {
 *   const { transaction, navigation } = useViewHandlers();
 *
 *   const handleSave = async () => {
 *     await transaction.saveTransaction(currentTx);
 *     navigation.navigateToView('dashboard');
 *   };
 *
 *   return <Button onClick={handleSave}>Save</Button>;
 * }
 * ```
 */
export function useViewHandlers(): ViewHandlersContextValue {
    const context = useContext(ViewHandlersContext);

    if (!context) {
        throw new Error(
            'useViewHandlers must be used within a ViewHandlersProvider. ' +
            'Ensure the view is rendered inside ViewHandlersProvider in App.tsx.'
        );
    }

    return context;
}

/**
 * useViewHandlersOptional - Access handler bundles without throwing.
 *
 * Returns null if called outside ViewHandlersProvider.
 * Useful for components that may render in test environments without the provider.
 *
 * @returns ViewHandlersContextValue or null
 */
export function useViewHandlersOptional(): ViewHandlersContextValue | null {
    return useContext(ViewHandlersContext);
}

// =============================================================================
// Re-export for convenience
// =============================================================================

export { ViewHandlersContext };
