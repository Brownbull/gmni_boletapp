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

// Story 14e-22: AppProvidersProps moved to src/app/types.ts
export type {
    View,
    Theme,
    ColorTheme,
    FontFamily,
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
// Story 14e-22: AppProviders moved to src/app/AppProviders.tsx
// Use: import { AppProviders } from '@app/AppProviders';

// =============================================================================
// Layout Components
// =============================================================================

export { AppLayout, AppMainContent } from './AppLayout';

// =============================================================================
// Routing
// =============================================================================

export { AppRoutes } from './AppRoutes';

// =============================================================================
// View Renderers (Story 14c-refactor.22, TypeScript: 14c-refactor.22b, renderViewSwitch: 14c-refactor.22c)
// =============================================================================

export {
    // Existing render functions
    renderDashboardView,
    renderTrendsView,
    renderInsightsView,
    renderHistoryView,
    renderItemsView,
    renderRecentScansView,
    renderReportsView,
    renderStatementScanView,
    // Story 14c-refactor.22c: New render functions
    renderAlertsView,
    renderSettingsView,
    renderTransactionEditorView,
    renderBatchCaptureView,
    renderBatchReviewView,
    // Story 14c-refactor.22c: Unified switch function
    renderViewSwitch,
} from './viewRenderers';

// =============================================================================
// Overlays (Story 14c-refactor.22d)
// =============================================================================

export { AppOverlays } from './AppOverlays';
export type { AppOverlaysProps } from './AppOverlays';

// View Renderer Props Types (Story 14c-refactor.22b, 14c-refactor.22c)
export type {
    // Existing props types
    RenderDashboardViewProps,
    RenderTrendsViewProps,
    RenderInsightsViewProps,
    RenderHistoryViewProps,
    RenderItemsViewProps,
    RenderRecentScansViewProps,
    RenderReportsViewProps,
    RenderStatementScanViewProps,
    // Story 14c-refactor.22c: New props types
    RenderAlertsViewProps,
    RenderSettingsViewProps,
    RenderTransactionEditorViewProps,
    RenderBatchCaptureViewProps,
    RenderBatchReviewViewProps,
    // Story 14c-refactor.22c: Unified types
    ViewRenderProps,
    ViewRenderPropsMap,
} from './viewRenderers';
