/**
 * Story 14e-22: AppProviders - App-level provider composition
 * Story 14e-25d: Removed ViewHandlersProvider (views use direct hooks)
 * Story 14e-45: Removed NavigationProvider (navigation via useNavigationStore Zustand store)
 *
 * Composes all app-level React context providers in the correct order.
 * This component handles the "provider pyramid" pattern cleanly.
 *
 * Provider Hierarchy (outer to inner):
 * 1. main.tsx level (external - already wrapped):
 *    - QueryClientProvider (React Query)
 *    - AuthProvider (Firebase auth state)
 *
 * State managed by Zustand stores (no providers needed):
 *    - Scan state: useScanStore (Story 14e-11)
 *    - Navigation: useNavigationStore (Story 14e-45)
 *
 * 2. AppProviders level (this component):
 *    - NotificationProvider (in-app notifications)
 *    Note: ThemeProvider removed (Story 15-7c, theme via useSettingsStore)
 *    Note: AppStateProvider removed (Story 15-7b, toasts via useToast)
 *
 * Note: Navigation state is now managed by useNavigationStore (Zustand).
 * AnalyticsProvider and HistoryFiltersProvider are view-scoped
 * and should remain in the components that use them (TrendsView, HistoryView).
 *
 * Architecture Reference: Epic 14e - Feature-Based Architecture
 *
 * @example
 * ```tsx
 * // In App.tsx
 * function App() {
 *   return (
 *     <AppProviders
 *       fontFamily={userPreferences.fontFamily}
 *       db={services?.db ?? null}
 *       userId={user?.uid ?? null}
 *       appId={services?.appId ?? null}
 *     >
 *       <AppOverlays {...overlayProps} />
 *       <main>{views}</main>
 *     </AppProviders>
 *   );
 * }
 * ```
 *
 * @see docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md
 */

import { useEffect } from 'react';
import type { AppProvidersProps } from './types';
import {
    NotificationProvider,
} from '../contexts';
import { settingsActions } from '../shared/stores';

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
 * - AppStateProvider: No dependencies on above, provides toast/operation state
 * - NotificationProvider: May show toasts via AppStateProvider
 *
 * Story 14e-45: NavigationProvider removed - navigation now uses Zustand store:
 * - Navigation state: useNavigationStore from @/shared/stores
 * - Navigation actions: useNavigationActions() from @/shared/stores
 *
 * Story 14e-25d: ViewHandlersProvider removed - views now use direct hooks:
 * - Navigation: useNavigationActions() from @/shared/stores
 * - Toast: useToast() from @/shared/hooks
 * - Modals: useModalActions() from @/managers/ModalManager
 * - History navigation: useHistoryNavigation() from @/shared/hooks
 */
export function AppProviders({
    children,
    fontFamily = 'outfit',
    db,
    userId,
    appId,
}: AppProvidersProps): JSX.Element {
    // Story 15-7c: Sync fontFamily from Firestore to Zustand store (ThemeProvider removed)
    useEffect(() => {
        settingsActions.setFontFamily(fontFamily);
    }, [fontFamily]);

    // Story 15-7b: AppStateProvider removed (zero consumers, useToast is the toast mechanism)
    return (
        <NotificationProvider
            db={db ?? null}
            userId={userId ?? null}
            appId={appId ?? null}
        >
            {children}
        </NotificationProvider>
    );
}

export default AppProviders;
