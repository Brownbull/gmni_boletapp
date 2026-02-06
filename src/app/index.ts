/**
 * App shell components
 *
 * Story 14e-21: FeatureOrchestrator
 * Story 14e-22: AppProviders
 *
 * This module contains the app-level composition components that provide
 * the structural foundation for the application:
 * - AppProviders: Context provider composition (theme, navigation, handlers)
 * - FeatureOrchestrator: Feature module composition (scan, batch, credit)
 *
 * @example
 * ```tsx
 * import { AppProviders, FeatureOrchestrator } from '@app';
 *
 * function App() {
 *   return (
 *     <AppProviders {...providerProps}>
 *       <FeatureOrchestrator {...featureProps} />
 *       {views}
 *     </AppProviders>
 *   );
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

// Story 14e-25d: ViewHandlerBundles removed - views use direct hooks
export type { AppProvidersProps } from './types';

// Story 14e-25a.1: View type and utilities for navigation
export {
    type View,
    FULL_SCREEN_VIEWS,
    VIEWS_WITHOUT_TOP_HEADER,
    shouldShowTopHeader,
    isFullScreenView,
} from './types';

// =============================================================================
// AppProviders - Context provider composition
// =============================================================================

export { AppProviders } from './AppProviders';

// =============================================================================
// FeatureOrchestrator - Feature module composition
// =============================================================================

export { FeatureOrchestrator, type FeatureOrchestratorProps } from './FeatureOrchestrator';
