/**
 * Story 14c-refactor.11: AppProviders - Provider composition for App
 *
 * Composes all app-level React context providers in the correct order.
 * This component handles the "provider pyramid" pattern cleanly.
 *
 * Provider Hierarchy (outer to inner):
 * 1. main.tsx level (external - already wrapped):
 *    - QueryClientProvider (React Query)
 *    - AuthProvider (Firebase auth state)
 *    - ViewModeProvider (personal vs shared group)
 *    - ScanProvider (scan state machine - Epic 14d)
 *
 * 2. AppProviders level (this component):
 *    - ThemeProvider (theme + locale preferences)
 *    - NavigationProvider (view navigation state)
 *    - AppStateProvider (toasts, operation status)
 *    - NotificationProvider (in-app notifications)
 *
 * Note: AnalyticsProvider and HistoryFiltersProvider are view-scoped
 * and should remain in the components that use them (TrendsView, HistoryView).
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 *
 * @example
 * ```tsx
 * // In App.tsx
 * function App() {
 *   return (
 *     <AppProviders
 *       fontFamily={userPreferences.fontFamily}
 *       db={services?.db}
 *       userId={user?.uid}
 *       appId={services?.appId}
 *     >
 *       <AppLayout />
 *     </AppProviders>
 *   );
 * }
 * ```
 */

import type { AppProvidersProps } from './types';
import {
    ThemeProvider,
    NavigationProvider,
    AppStateProvider,
    NotificationProvider,
} from '../../contexts';

// =============================================================================
// Component
// =============================================================================

/**
 * App-level provider composition.
 *
 * Wraps children with all necessary context providers in the correct order.
 * Providers are ordered from outermost (least dependencies) to innermost
 * (may depend on outer providers).
 *
 * Order rationale:
 * - ThemeProvider: No dependencies, provides theme to all children
 * - NavigationProvider: May use theme for styling
 * - AppStateProvider: No dependencies on above, provides toast/operation state
 * - NotificationProvider: May show toasts via AppStateProvider
 */
export function AppProviders({
    children,
    fontFamily = 'outfit',
    db,
    userId,
    appId,
}: AppProvidersProps): JSX.Element {
    return (
        <ThemeProvider fontFamily={fontFamily}>
            <NavigationProvider>
                <AppStateProvider>
                    <NotificationProvider
                        db={db ?? null}
                        userId={userId ?? null}
                        appId={appId ?? null}
                    >
                        {children}
                    </NotificationProvider>
                </AppStateProvider>
            </NavigationProvider>
        </ThemeProvider>
    );
}

export default AppProviders;
