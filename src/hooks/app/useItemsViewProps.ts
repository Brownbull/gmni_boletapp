/**
 * Story 14c-refactor.34c: useItemsViewProps Hook
 *
 * Composes all data props needed for ItemsView from App.tsx state.
 * This hook receives ALL data as options and does NOT call other hooks internally.
 *
 * Architecture:
 * - Handlers come from ViewHandlersContext (story 14c-refactor.25)
 * - Data props are composed by this hook
 * - ItemsView receives both: spread props + useViewHandlers()
 *
 * Note: ItemsView is wrapped in HistoryFiltersProvider by App.tsx.
 * This hook only composes props.
 *
 * @example
 * ```tsx
 * function App() {
 *   const itemsProps = useItemsViewProps({
 *     transactions: activeTransactions,
 *     theme,
 *     currency,
 *     // ... all other data
 *   });
 *
 *   return (
 *     <HistoryFiltersProvider>
 *       <ItemsView {...itemsProps} />
 *     </HistoryFiltersProvider>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import type { Language } from '../../utils/translations';
import type { ThemeName } from '../../config/categoryColors';

// =============================================================================
// Types
// =============================================================================

/**
 * Transaction interface for ItemsView
 * Matches what ItemsView expects for extracting items
 */
export interface ItemsTransaction {
    id: string;
    merchant: string;
    date: string;
    total: number;
    category: string;
    items?: Array<{
        name: string;
        price: number;
        category?: string;
        subcategory?: string;
    }>;
    city?: string;
    country?: string;
    currency?: string;
}

/**
 * Props passed to useItemsViewProps hook.
 * All data comes from App.tsx state - no internal hook calls.
 */
export interface UseItemsViewPropsOptions {
    // Core data
    /** Transactions to extract items from */
    transactions: ItemsTransaction[];

    // User info
    /** User ID for group operations */
    userId: string | null;
    /** App ID for Firestore path */
    appId: string;
    /** User display name for profile avatar */
    userName: string;
    /** User email for profile dropdown */
    userEmail: string;

    // UI settings
    /** Theme for styling */
    theme: string;
    /** Color theme for unified category colors (Story 14.21) */
    colorTheme: ThemeName;
    /** Default currency */
    currency: string;
    /** Date format string */
    dateFormat: string;
    /** Language */
    lang: Language;
    /** Translation function */
    t: (key: string) => string;
    /** Currency formatting function */
    formatCurrency: (amount: number, currency: string) => string;
    /** Date formatting function */
    formatDate: (date: string, format: string) => string;
    /** Font color mode for category text colors (Story 14.13) */
    fontColorMode: 'colorful' | 'plain';

    // Location defaults
    /** User's default country for foreign location detection (Story 14.35b) */
    defaultCountry: string;

    // Callbacks
    /**
     * Navigate to edit a transaction.
     * Story 14.13 Session 6: Optional second param for multi-transaction navigation from ItemsView
     */
    onEditTransaction: (transactionId: string, allTransactionIds?: string[]) => void;
}

/**
 * Data props returned by useItemsViewProps.
 * Matches ItemsViewProps interface from ItemsView.tsx (minus deprecated handlers)
 */
export interface ItemsViewDataProps {
    // Core data
    transactions: ItemsTransaction[];

    // UI settings
    theme: string;
    colorTheme: ThemeName;
    currency: string;
    dateFormat: string;
    lang: Language;
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    fontColorMode: 'colorful' | 'plain';

    // User info
    userId: string | null;
    appId: string;
    userName: string;
    userEmail: string;

    // Location defaults
    defaultCountry: string;

    // Callbacks
    /** @deprecated Story 14c-refactor.27: Use useViewHandlers().navigation.navigateBack instead */
    onBack: () => void;
    onEditTransaction: (transactionId: string, allTransactionIds?: string[]) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useItemsViewProps - Composes data props for ItemsView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data comes from the options parameter.
 *
 * @param options - All data needed to compose props
 * @returns ItemsViewDataProps - Data props for the view
 */
export function useItemsViewProps(
    options: UseItemsViewPropsOptions
): ItemsViewDataProps {
    const {
        transactions,
        userId,
        appId,
        userName,
        userEmail,
        theme,
        colorTheme,
        currency,
        dateFormat,
        lang,
        t,
        formatCurrency,
        formatDate,
        fontColorMode,
        defaultCountry,
        onEditTransaction,
    } = options;

    return useMemo<ItemsViewDataProps>(
        () => ({
            // Core data
            transactions,

            // UI settings
            theme,
            colorTheme,
            currency,
            dateFormat,
            lang,
            t,
            formatCurrency,
            formatDate,
            fontColorMode,

            // User info
            userId,
            appId,
            userName,
            userEmail,

            // Location defaults
            defaultCountry,

            // Callbacks
            // onBack is deprecated - view uses useViewHandlers().navigation.navigateBack
            // Provide empty function for backward compatibility
            onBack: () => {},
            onEditTransaction,
        }),
        [
            // Core data
            transactions,

            // UI settings
            theme,
            colorTheme,
            currency,
            dateFormat,
            lang,
            t,
            formatCurrency,
            formatDate,
            fontColorMode,

            // User info
            userId,
            appId,
            userName,
            userEmail,

            // Location defaults
            defaultCountry,

            // Callbacks
            onEditTransaction,
        ]
    );
}
