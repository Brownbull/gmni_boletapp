/**
 * ViewModeContext - Simple In-Memory View Mode State
 *
 * Story 14c-refactor.13: Simplified to single source of truth
 *
 * App-wide context provider that manages switching between personal and
 * shared group view modes. All data-fetching hooks and views check this
 * context to filter data appropriately.
 *
 * After Epic 14c-refactor, this context is simplified to:
 * - Personal mode only (shared groups feature disabled)
 * - No localStorage persistence
 * - No Firestore persistence
 * - Default to 'personal' on every app load
 *
 * Epic 14d will implement proper persistence when Shared Groups v2 is ready.
 *
 * @example
 * ```tsx
 * // In any component
 * const { mode, isGroupMode, setPersonalMode } = useViewMode();
 *
 * // Currently always personal mode (shared groups disabled)
 * console.log(mode); // 'personal'
 * console.log(isGroupMode); // false
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { SharedGroup } from '../types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * View mode type - either personal or group
 * Note: 'group' mode is currently disabled (Epic 14c-refactor)
 */
export type ViewMode = 'personal' | 'group';

/**
 * Internal state for the view mode context
 */
interface ViewModeState {
  /** Current view mode - always 'personal' until Epic 14d */
  mode: ViewMode;
  /** Group ID when in group mode (currently never used) */
  groupId?: string;
  /** Cached group data for display (currently never used) */
  group?: SharedGroup;
}

/**
 * Context value provided to consumers
 */
export interface ViewModeContextValue extends ViewModeState {
  /** Computed: true if mode is 'group' (currently always false) */
  isGroupMode: boolean;
  /** Switch to personal mode */
  setPersonalMode: () => void;
  /** Switch to group mode - STUB: Feature disabled, does nothing */
  setGroupMode: (groupId: string, group?: SharedGroup) => void;
  /** Update cached group data - STUB: Feature disabled, does nothing */
  updateGroupData: (group: SharedGroup) => void;
}

/**
 * Provider props - simplified, no persistence options needed
 */
interface ViewModeProviderProps {
  children: React.ReactNode;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * View Mode Context - provides view mode state and actions.
 *
 * IMPORTANT: Do not use useContext(ViewModeContext) directly.
 * Use the useViewMode() hook instead for proper error handling.
 */
const ViewModeContext = createContext<ViewModeContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

/**
 * View Mode Context Provider.
 *
 * Wrap your app with this provider to enable view mode switching.
 * Currently always initializes to personal mode (shared groups disabled).
 *
 * @example
 * ```tsx
 * <QueryClientProvider>
 *   <ViewModeProvider>
 *     <App />
 *   </ViewModeProvider>
 * </QueryClientProvider>
 * ```
 */
export function ViewModeProvider({ children }: ViewModeProviderProps) {
  // Story 14c-refactor.13: Always start in personal mode, no persistence
  const [state, setState] = useState<ViewModeState>({
    mode: 'personal',
    groupId: undefined,
    group: undefined,
  });

  // ===========================================================================
  // Action Functions
  // ===========================================================================

  /**
   * Switch to personal mode.
   * Clears any group selection.
   */
  const setPersonalMode = useCallback(() => {
    setState({
      mode: 'personal',
      groupId: undefined,
      group: undefined,
    });

    if (import.meta.env.DEV) {
      console.log('[ViewModeContext] Switched to personal mode');
    }
  }, []);

  /**
   * Switch to group mode - STUB.
   * Feature disabled in Epic 14c-refactor. Does nothing but log a warning.
   * Will be re-enabled in Epic 14d.
   *
   * @param _groupId - The shared group ID (ignored)
   * @param _group - Group data (ignored)
   */
  const setGroupMode = useCallback((_groupId: string, _group?: SharedGroup) => {
    if (import.meta.env.DEV) {
      console.warn(
        '[ViewModeContext] setGroupMode called but shared groups are disabled. ' +
          'This feature will be re-enabled in Epic 14d.'
      );
    }
    // Do nothing - feature disabled
  }, []);

  /**
   * Update cached group data - STUB.
   * Feature disabled in Epic 14c-refactor. Does nothing.
   */
  const updateGroupData = useCallback((_group: SharedGroup) => {
    // Do nothing - feature disabled
  }, []);

  // ===========================================================================
  // Computed Values
  // ===========================================================================

  const isGroupMode = state.mode === 'group';

  // ===========================================================================
  // Memoized Context Value
  // ===========================================================================

  const value = useMemo<ViewModeContextValue>(
    () => ({
      // State
      mode: state.mode,
      groupId: state.groupId,
      group: state.group,

      // Computed
      isGroupMode,

      // Actions
      setPersonalMode,
      setGroupMode,
      updateGroupData,
    }),
    [
      state.mode,
      state.groupId,
      state.group,
      isGroupMode,
      setPersonalMode,
      setGroupMode,
      updateGroupData,
    ]
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

// =============================================================================
// Consumer Hooks
// =============================================================================

/**
 * Access view mode context - throws if outside provider.
 *
 * Use this hook in components that REQUIRE view mode functionality.
 *
 * @throws Error if used outside ViewModeProvider
 *
 * @example
 * ```tsx
 * function TransactionList() {
 *   const { mode, isGroupMode } = useViewMode();
 *
 *   // Currently always personal mode
 *   const query = getPersonalTransactions();
 *
 *   return <List data={query.data} />;
 * }
 * ```
 */
export function useViewMode(): ViewModeContextValue {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

/**
 * Access view mode context - returns null if outside provider.
 *
 * Use this hook in components that OPTIONALLY use view mode,
 * such as layout components rendered before full app initialization.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const viewMode = useViewModeOptional();
 *
 *   // Currently always personal mode when available
 *   return <DefaultHeader />;
 * }
 * ```
 */
export function useViewModeOptional(): ViewModeContextValue | null {
  return useContext(ViewModeContext);
}

// =============================================================================
// Re-exports for backwards compatibility
// =============================================================================

export type { SharedGroup } from '../types/sharedGroup';
