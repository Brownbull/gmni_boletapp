/**
 * Story 14c.4: View Mode Switcher - ViewModeContext
 * Story 14c.18: Firestore persistence + group validation
 *
 * App-wide context provider that manages switching between personal and
 * shared group view modes. All data-fetching hooks and views check this
 * context to filter data appropriately.
 *
 * Features:
 * - Personal mode (default): Shows user's own transactions
 * - Group mode: Shows combined transactions for a shared group
 * - localStorage persistence for mode across sessions (AC6)
 * - Firestore persistence via callback (Story 14c.18)
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
  useRef,
} from 'react';
import type { SharedGroup } from '../types/sharedGroup';
import type { ViewModePreference } from '../services/userPreferencesService';

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
  /**
   * Story 14c.18: Validate and restore mode after group data is loaded
   * Call this after groups are loaded to validate persisted group mode
   */
  validateAndRestoreMode: (groups: SharedGroup[]) => void;
  /** Story 14c.18: Whether initial validation has been performed */
  isValidated: boolean;
}

/**
 * Persisted state structure (minimal for localStorage)
 */
interface PersistedViewMode {
  mode: ViewMode;
  groupId?: string;
}

/**
 * Story 14c.18: Props for ViewModeProvider
 */
interface ViewModeProviderProps {
  children: React.ReactNode;
  /** Story 14c.18: Initial preference loaded from Firestore */
  initialPreference?: ViewModePreference;
  /** Story 14c.18: Callback to save preference changes (debounced by caller) */
  onPreferenceChange?: (preference: Omit<ViewModePreference, 'updatedAt'>) => void;
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

/**
 * Story 14c.18: Determine initial state from Firestore preference or localStorage
 * Priority: Firestore > localStorage > default (personal)
 */
function getInitialState(initialPreference?: ViewModePreference): ViewModeState {
  // If Firestore preference provided, use it
  if (initialPreference) {
    return {
      mode: initialPreference.mode,
      groupId: initialPreference.mode === 'group' ? initialPreference.groupId : undefined,
      // group object will be populated by validateAndRestoreMode()
    };
  }

  // Fall back to localStorage
  const persisted = loadPersistedMode();
  return {
    mode: persisted.mode,
    groupId: persisted.groupId,
    // group object will be populated by validateAndRestoreMode()
  };
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * View Mode Context Provider.
 *
 * Wrap your app with this provider to enable view mode switching.
 * Should be placed inside QueryClientProvider for React Query support.
 *
 * Story 14c.18: Now accepts initialPreference from Firestore and
 * onPreferenceChange callback for persistence.
 *
 * @example
 * ```tsx
 * <QueryClientProvider>
 *   <ViewModeProvider
 *     initialPreference={preferences.viewModePreference}
 *     onPreferenceChange={saveViewModePreference}
 *   >
 *     <App />
 *   </ViewModeProvider>
 * </QueryClientProvider>
 * ```
 */
export function ViewModeProvider({
  children,
  initialPreference,
  onPreferenceChange,
}: ViewModeProviderProps) {
  // Initialize state from Firestore preference or localStorage
  const [state, setState] = useState<ViewModeState>(() =>
    getInitialState(initialPreference)
  );

  // Story 14c.18: Track if validation has been performed
  const [isValidated, setIsValidated] = useState(false);

  // Track if this is the initial render to skip first persistence
  const isInitialRender = useRef(true);

  // Story 14c.18: Track the last persisted state to prevent unnecessary saves
  const lastPersistedRef = useRef<{ mode: ViewMode; groupId?: string } | null>(null);

  // Persist state changes to localStorage and call onPreferenceChange
  useEffect(() => {
    // Skip the initial render persistence (state comes from storage anyway)
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const toPersist: PersistedViewMode = {
      mode: state.mode,
      groupId: state.groupId,
    };

    // Always persist to localStorage
    persistMode(toPersist);

    // Story 14c.18: Call onPreferenceChange callback if provided
    // Only if the value actually changed
    if (
      onPreferenceChange &&
      (lastPersistedRef.current?.mode !== state.mode ||
        lastPersistedRef.current?.groupId !== state.groupId)
    ) {
      lastPersistedRef.current = { mode: state.mode, groupId: state.groupId };
      onPreferenceChange({
        mode: state.mode,
        groupId: state.mode === 'group' ? state.groupId : undefined,
      });
    }
  }, [state.mode, state.groupId, onPreferenceChange]);

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

  /**
   * Story 14c.18: Validate and restore group mode after groups are loaded.
   * If the persisted group is no longer accessible, fall back to personal mode.
   * This fixes the race condition where mode is restored before group data loads.
   * (AC4, AC5)
   *
   * @param groups - User's current shared groups
   */
  const validateAndRestoreMode = useCallback(
    (groups: SharedGroup[]) => {
      setState((prev) => {
        // Already in personal mode - nothing to validate
        if (prev.mode === 'personal') {
          setIsValidated(true);
          return prev;
        }

        // In group mode - validate the group still exists and user is a member
        const group = groups.find((g) => g.id === prev.groupId);

        if (group) {
          // Group is valid - update with full group data
          if (import.meta.env.DEV) {
            console.log('[ViewModeContext] Validated group mode:', {
              groupId: group.id,
              groupName: group.name,
            });
          }
          setIsValidated(true);
          return { ...prev, group };
        }

        // Group not found - fall back to personal mode (AC5)
        console.warn(
          '[ViewModeContext] Persisted group not found, falling back to personal:',
          prev.groupId
        );
        setIsValidated(true);
        return {
          mode: 'personal',
          groupId: undefined,
          group: undefined,
        };
      });
    },
    []
  );

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
      isValidated,

      // Actions
      setPersonalMode,
      setGroupMode,
      updateGroupData,
      validateAndRestoreMode,
    }),
    [
      state.mode,
      state.groupId,
      state.group,
      isGroupMode,
      isValidated,
      setPersonalMode,
      setGroupMode,
      updateGroupData,
      validateAndRestoreMode,
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
export type { ViewModePreference } from '../services/userPreferencesService';
