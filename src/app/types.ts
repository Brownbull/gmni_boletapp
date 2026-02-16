/**
 * Story 14e-22: App Shell Types
 * Story 14e-25a.1: Added View type and navigation utilities
 * Story 14e-25d: Removed ViewHandlerBundles (ViewHandlersContext deleted)
 *
 * Type definitions for the app shell layer (src/app/).
 * These types support the provider composition and app-level architecture.
 *
 * Architecture Reference: Epic 14e - Feature-Based Architecture
 */

import type { ReactNode } from 'react';
import type { FontFamily } from '../types/settings';
import type { Firestore } from 'firebase/firestore';

// =============================================================================
// View Types
// =============================================================================

/**
 * All possible view types in the application.
 *
 * Story 10a.3: Changed 'list' to 'insights' (InsightsView)
 * Story 12.1: Added 'batch-capture' for batch mode scanning
 * Story 12.3: Added 'batch-review' for reviewing processed receipts
 * Story 14.11: Added 'alerts' for nav bar redesign
 * Story 14.14: Added 'history' for transaction list
 * Story 14.16: Added 'reports' for weekly report cards
 * Story 14.15: Added 'scan-result' for new scan flow UI
 * Story 14.23: Added 'transaction-editor' for unified transaction editor
 * Story 14.31: Added 'items' for item history view
 * Story 14d.9: Added 'statement-scan' for statement scanning placeholder
 * Story 14.31: Added 'recent-scans' for viewing all recent scans
 * Story 14e-25a.1: Moved to src/app/types.ts for navigation store
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

/** Runtime set of all valid View values — used for type guards */
export const VALID_VIEWS: ReadonlySet<string> = new Set<View>([
    'dashboard', 'scan', 'scan-result', 'edit', 'transaction-editor',
    'trends', 'insights', 'settings', 'alerts', 'batch-capture',
    'batch-review', 'history', 'reports', 'items', 'statement-scan', 'recent-scans',
]);

/** Type guard for View union */
export function isValidView(value: string): value is View {
    return VALID_VIEWS.has(value);
}

// =============================================================================
// View Classification Utilities
// =============================================================================

/**
 * Views that have their own full-screen headers and need no top padding.
 * Used to determine main content area styling.
 */
export const FULL_SCREEN_VIEWS: readonly View[] = [
    'trends',
    'history',
    'items',
    'reports',
    'scan-result',
    'edit',
    'transaction-editor',
    'batch-capture',
    'batch-review',
    'statement-scan',
    'recent-scans',
    'insights',
    'alerts',
] as const;

/**
 * Views that should hide the top header bar.
 * These views manage their own headers internally.
 */
export const VIEWS_WITHOUT_TOP_HEADER: readonly View[] = [
    'trends',
    'history',
    'reports',
    'items',
    'scan-result',
    'edit',
    'transaction-editor',
    'batch-capture',
    'batch-review',
    'statement-scan',
    'recent-scans',
    'insights',
    'alerts',
] as const;

/**
 * Check if a view should show the top header bar.
 */
export function shouldShowTopHeader(view: View): boolean {
    return !(VIEWS_WITHOUT_TOP_HEADER as readonly string[]).includes(view);
}

/**
 * Check if a view is a full-screen view (manages its own padding/header).
 */
export function isFullScreenView(view: View): boolean {
    return (FULL_SCREEN_VIEWS as readonly string[]).includes(view);
}

// =============================================================================
// Provider Props Types
// =============================================================================

/**
 * Props for AppProviders component.
 *
 * AppProviders wraps children with app-level context providers:
 * - NotificationProvider (in-app notifications)
 * Note: ThemeProvider removed (15-7c, theme via useSettingsStore)
 * Note: AppStateProvider removed (15-7b, toasts via useToast)
 *
 * External providers (Auth, Query, Scan) remain in main.tsx.
 * View-scoped providers (Analytics, HistoryFilters) remain per-view.
 *
 * Story 14e-45: NavigationProvider removed - navigation now uses Zustand:
 * - Navigation state: useNavigationStore from @/shared/stores
 * - Navigation actions: useNavigationActions() from @/shared/stores
 *
 * Story 14e-25d: ViewHandlersProvider removed - views now use direct hooks:
 * - Toast: useToast() from @/shared/hooks
 * - Modals: useModalActions() from @/managers/ModalManager
 * - History navigation: useHistoryNavigation() from @/shared/hooks
 *
 * @see docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md
 */
export interface AppProvidersProps {
    /** Children to render inside all providers */
    children: ReactNode;

    /** Font family from Firestore preferences (defaults to 'outfit') */
    fontFamily?: FontFamily;

    /** Firestore database instance (null if not initialized) */
    db?: Firestore | null;

    /** Current user ID (null if not authenticated) */
    userId?: string | null;

    /** Firebase app ID (null if not initialized) */
    appId?: string | null;
}
