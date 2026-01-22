/**
 * Story 14c-refactor.11: App components barrel exports
 *
 * Central export point for App-level architectural components.
 * These components handle the app's structural concerns:
 * - Error boundaries
 * - Provider composition
 * - Layout shell
 * - View routing
 *
 * @example
 * ```tsx
 * import {
 *   AppErrorBoundary,
 *   AppProviders,
 *   AppLayout,
 *   AppRoutes,
 *   shouldShowTopHeader,
 *   isFullScreenView,
 * } from './components/App';
 * ```
 */

// =============================================================================
// Shared Types (re-export from types.ts)
// =============================================================================

export type {
    View,
    Theme,
    ColorTheme,
    FontFamily,
    AppProvidersProps,
    AppLayoutProps,
    AppMainContentProps,
    AppRoutesProps,
    AppErrorBoundaryProps,
    AppErrorBoundaryState,
} from './types';

export {
    FULL_SCREEN_VIEWS,
    VIEWS_WITHOUT_TOP_HEADER,
    shouldShowTopHeader,
    isFullScreenView,
} from './types';

// =============================================================================
// Error Handling
// =============================================================================

export { AppErrorBoundary } from './AppErrorBoundary';

// =============================================================================
// Provider Composition
// =============================================================================

export { AppProviders } from './AppProviders';

// =============================================================================
// Layout Components
// =============================================================================

export { AppLayout, AppMainContent } from './AppLayout';

// =============================================================================
// Routing
// =============================================================================

export { AppRoutes } from './AppRoutes';
