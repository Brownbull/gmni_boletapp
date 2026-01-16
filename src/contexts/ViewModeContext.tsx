/**
 * Story 14c.4: View Mode Switcher - ViewModeContext
 *
 * App-wide context provider that manages switching between personal and
 * shared group view modes. All data-fetching hooks and views check this
 * context to filter data appropriately.
 *
 * Features:
 * - Personal mode (default): Shows user's own transactions
 * - Group mode: Shows combined transactions for a shared group
 * - localStorage persistence for mode across sessions (AC6)
 * - Cached group data for display purposes
 *
 * Architecture Reference: Epic 14c - Household Sharing
 *
 * @example
 * ```tsx
 * // In any component
 * const { mode, groupId, isGroupMode, setGroupMode, setPersonalMode } = useViewMode();
 *
 * // Switch to a shared group
 * setGroupMode('group-123', groupData);
 *
 * // Switch back to personal
 * setPersonalMode();
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { SharedGroup } from '../types/sharedGroup';

// =============================================================================
// Constants
// =============================================================================

/** localStorage key for persisting view mode */
export const VIEW_MODE_STORAGE_KEY = 'boletapp_view_mode';

// =============================================================================
// Types
// =============================================================================

/**
 * View mode type - either personal or group
 */
export type ViewMode = 'personal' | 'group';

/**
 * Internal state for the view mode context
 */
interface ViewModeState {
  /** Current view mode */
  mode: ViewMode;
  /** Group ID when in group mode */
  groupId?: string;
  /** Cached group data for display (icon, name, color) */
  group?: SharedGroup;
}

/**
 * Context value provided to consumers
 */
export interface ViewModeContextValue extends ViewModeState {
  /** Computed: true if mode is 'group' */
  isGroupMode: boolean;
  /** Switch to personal mode (clears group selection) */
  setPersonalMode: () => void;
  /** Switch to group mode with specified group */
  setGroupMode: (groupId: string, group?: SharedGroup) => void;
  /** Update cached group data (for real-time updates) */
  updateGroupData: (group: SharedGroup) => void;
}

/**
 * Persisted state structure (minimal for localStorage)
 */
interface PersistedViewMode {
  mode: ViewMode;
  groupId?: string;
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
// Helper Functions
// =============================================================================

/**
 * Load persisted view mode from localStorage.
 * Returns default personal mode if not found or invalid.
 */
function loadPersistedMode(): PersistedViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PersistedViewMode;
      // Validate the structure
      if (parsed.mode === 'personal' || parsed.mode === 'group') {
        return parsed;
      }
    }
  } catch {
    // Invalid JSON or other error - fall back to default
    if (import.meta.env.DEV) {
      console.warn('[ViewModeContext] Failed to load persisted mode, using default');
    }
  }
  return { mode: 'personal' };
}

/**
 * Save view mode to localStorage.
 */
function persistMode(state: PersistedViewMode): void {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // localStorage might be full or disabled
    if (import.meta.env.DEV) {
      console.warn('[ViewModeContext] Failed to persist mode:', error);
    }
  }
}

// =============================================================================
// Provider Component
// =============================================================================

interface ViewModeProviderProps {
  children: React.ReactNode;
}

/**
 * View Mode Context Provider.
 *
 * Wrap your app with this provider to enable view mode switching.
 * Should be placed inside QueryClientProvider for React Query support.
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
  // Initialize state from localStorage
  const [state, setState] = useState<ViewModeState>(() => {
    const persisted = loadPersistedMode();
    return {
      mode: persisted.mode,
      groupId: persisted.groupId,
      // Note: group object is NOT persisted (will be loaded from Firestore)
    };
  });

  // Persist state changes to localStorage
  useEffect(() => {
    const toPersist: PersistedViewMode = {
      mode: state.mode,
      groupId: state.groupId,
    };
    persistMode(toPersist);
  }, [state.mode, state.groupId]);

  // ===========================================================================
  // Action Functions
  // ===========================================================================

  /**
   * Switch to personal mode.
   * Clears group selection and persists change.
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
   * Switch to group mode.
   * Sets the groupId and optionally caches group data.
   *
   * @param groupId - The shared group ID to switch to
   * @param group - Optional group data to cache for display
   */
  const setGroupMode = useCallback((groupId: string, group?: SharedGroup) => {
    setState({
      mode: 'group',
      groupId,
      group,
    });

    if (import.meta.env.DEV) {
      console.log('[ViewModeContext] Switched to group mode:', {
        groupId,
        groupName: group?.name,
      });
    }
  }, []);

  /**
   * Update cached group data (for real-time updates from subscription).
   */
  const updateGroupData = useCallback((group: SharedGroup) => {
    setState((prev) => {
      // Only update if we're in group mode for this group
      if (prev.mode === 'group' && prev.groupId === group.id) {
        return { ...prev, group };
      }
      return prev;
    });
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
    [state.mode, state.groupId, state.group, isGroupMode, setPersonalMode, setGroupMode, updateGroupData]
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
 *   const { mode, groupId, isGroupMode } = useViewMode();
 *
 *   // Filter data based on mode
 *   const query = isGroupMode
 *     ? getGroupTransactions(groupId)
 *     : getPersonalTransactions();
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
 *   // Only show group indicator if context is available
 *   if (viewMode?.isGroupMode) {
 *     return <GroupHeader group={viewMode.group} />;
 *   }
 *
 *   return <DefaultHeader />;
 * }
 * ```
 */
export function useViewModeOptional(): ViewModeContextValue | null {
  return useContext(ViewModeContext);
}

// =============================================================================
// Re-exports
// =============================================================================

export type { SharedGroup } from '../types/sharedGroup';
