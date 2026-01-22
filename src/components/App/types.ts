/**
 * Story 14c-refactor.11: App Components Shared Types
 *
 * Type definitions shared across App-level components:
 * - AppErrorBoundary
 * - AppProviders
 * - AppLayout
 * - AppRoutes
 *
 * These types ensure consistency across the App architecture.
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 */

import type { ReactNode } from 'react';
import type { Theme, ColorTheme, FontFamily } from '../../types/settings';
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

// =============================================================================
// Theme Types (re-exported for convenience)
// =============================================================================

export type { Theme, ColorTheme, FontFamily };

// =============================================================================
// Provider Props Types
// =============================================================================

/**
 * Props for AppProviders component.
 *
 * AppProviders wraps children with app-level context providers.
 * Some providers require Firebase/user state that must be passed down.
 */
export interface AppProvidersProps {
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

// =============================================================================
// Layout Props Types
// =============================================================================

/**
 * Props for AppLayout component.
 *
 * AppLayout handles the outer container structure with theme classes.
 */
export interface AppLayoutProps {
    children: ReactNode;

    /** Light or dark theme */
    theme: Theme;

    /** Color theme (normal, professional, mono) */
    colorTheme: ColorTheme;
}

/**
 * Props for AppMainContent sub-component.
 *
 * AppMainContent handles the scrollable main content area with proper padding
 * based on whether the current view is full-screen or not.
 */
export interface AppMainContentProps {
    children: ReactNode;

    /** Whether the view is full-screen (manages its own padding) */
    isFullScreenView: boolean;

    /** Ref for scroll position management */
    mainRef?: React.RefObject<HTMLElement>;
}

// =============================================================================
// Routes Props Types
// =============================================================================

/**
 * Props for AppRoutes component.
 *
 * AppRoutes provides a clean interface for view rendering while delegating
 * the actual view component creation to the parent via render prop.
 */
export interface AppRoutesProps {
    /** Current view to render */
    view: View;

    /** Render function that returns the view component */
    renderView: (view: View) => ReactNode;
}

// =============================================================================
// Error Boundary Types
// =============================================================================

/**
 * Props for AppErrorBoundary component.
 */
export interface AppErrorBoundaryProps {
    children: ReactNode;
}

/**
 * State for AppErrorBoundary component.
 */
export interface AppErrorBoundaryState {
    hasError: boolean;
    error: string;
    errorInfo: string;
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
