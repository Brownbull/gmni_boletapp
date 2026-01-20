/**
 * Story 14c.18: View Mode Preference Persistence Hook
 *
 * Connects ViewModeContext to Firestore persistence via useUserPreferences.
 * Handles:
 * - Group validation after groups are loaded (AC4, AC5)
 * - Syncing preference changes to Firestore (AC6, AC8)
 * - Initial preference loading from Firestore (AC3)
 *
 * Usage: Call this hook once in App.tsx after useUserPreferences and
 * useUserSharedGroups are initialized.
 */

import { useEffect, useRef } from 'react';
import { useViewMode } from '../contexts/ViewModeContext';
import type { SharedGroup } from '../types/sharedGroup';
import type { ViewModePreference } from '../services/userPreferencesService';

interface UseViewModePreferencePersistenceOptions {
  /** User's shared groups (from useUserSharedGroups) */
  groups: SharedGroup[];
  /** Whether groups are still loading */
  groupsLoading: boolean;
  /** View mode preference from Firestore (from useUserPreferences) */
  firestorePreference?: ViewModePreference;
  /** Whether preferences are still loading */
  preferencesLoading: boolean;
  /** Callback to save preference to Firestore (from useUserPreferences) */
  savePreference: (preference: Omit<ViewModePreference, 'updatedAt'>) => void;
}

/**
 * Hook to connect ViewModeContext with Firestore persistence.
 *
 * This hook:
 * 1. Validates group mode on startup after groups load (AC4, AC5)
 * 2. Persists mode changes to Firestore (AC6)
 * 3. Handles initial Firestore preference sync (AC3)
 */
export function useViewModePreferencePersistence({
  groups,
  groupsLoading,
  firestorePreference,
  preferencesLoading,
  savePreference,
}: UseViewModePreferencePersistenceOptions): void {
  const {
    mode,
    groupId,
    isValidated,
    validateAndRestoreMode,
    setPersonalMode,
    setGroupMode,
  } = useViewMode();

  // Track if we've done initial Firestore sync
  const hasInitialSyncRef = useRef(false);
  // Track previous mode/groupId to detect changes
  const prevModeRef = useRef<{ mode: typeof mode; groupId?: string } | null>(null);
  // Track if we've applied Firestore preference
  const hasAppliedFirestoreRef = useRef(false);

  // Step 1: Apply Firestore preference on first load (AC3)
  // This runs once when preferences finish loading
  useEffect(() => {
    if (preferencesLoading || hasAppliedFirestoreRef.current) {
      return;
    }

    hasAppliedFirestoreRef.current = true;

    // If Firestore has a preference and it differs from current state, apply it
    if (firestorePreference) {
      const currentMode = mode;
      const currentGroupId = groupId;

      const needsUpdate =
        firestorePreference.mode !== currentMode ||
        (firestorePreference.mode === 'group' &&
          firestorePreference.groupId !== currentGroupId);

      if (needsUpdate) {
        if (firestorePreference.mode === 'group' && firestorePreference.groupId) {
          // Story 14c.19 fix: Set group mode so validateAndRestoreMode can validate it
          // The group data will be populated by validateAndRestoreMode once groups load
          if (import.meta.env.DEV) {
            console.log(
              '[useViewModePreferencePersistence] Firestore preference: group mode',
              firestorePreference.groupId
            );
          }
          setGroupMode(firestorePreference.groupId);
        } else if (firestorePreference.mode === 'personal') {
          if (import.meta.env.DEV) {
            console.log(
              '[useViewModePreferencePersistence] Firestore preference: personal mode'
            );
          }
          setPersonalMode();
        }
      }
    }
  }, [preferencesLoading, firestorePreference, mode, groupId, setPersonalMode, setGroupMode]);

  // Step 2: Validate group mode after groups finish loading (AC4, AC5)
  useEffect(() => {
    // Wait for groups to load
    if (groupsLoading || isValidated) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[useViewModePreferencePersistence] Validating mode with groups:', {
        groupCount: groups.length,
        currentMode: mode,
        currentGroupId: groupId,
      });
    }

    // Validate and restore mode - this will fall back to personal if group invalid
    validateAndRestoreMode(groups);
  }, [groupsLoading, isValidated, groups, mode, groupId, validateAndRestoreMode]);

  // Step 3: Persist mode changes to Firestore after initial sync (AC6)
  useEffect(() => {
    // Don't persist until initial validation is done
    if (!isValidated || preferencesLoading) {
      return;
    }

    // Mark initial sync complete on first run
    if (!hasInitialSyncRef.current) {
      hasInitialSyncRef.current = true;
      prevModeRef.current = { mode, groupId };
      return;
    }

    // Check if mode actually changed
    if (
      prevModeRef.current &&
      prevModeRef.current.mode === mode &&
      prevModeRef.current.groupId === groupId
    ) {
      return;
    }

    // Mode changed - persist to Firestore
    prevModeRef.current = { mode, groupId };

    if (import.meta.env.DEV) {
      console.log('[useViewModePreferencePersistence] Saving preference:', {
        mode,
        groupId,
      });
    }

    savePreference({
      mode,
      groupId: mode === 'group' ? groupId : undefined,
    });
  }, [mode, groupId, isValidated, preferencesLoading, savePreference]);
}
