/**
 * Story 14c.18: View Mode Preference Persistence Hook
 * Story 14c.18 bugfix: Simplified to work like other settings (font, currency, etc.)
 *
 * Connects ViewModeContext to Firestore persistence via useUserPreferences.
 * Works exactly like other user preferences - no dependency on async subscriptions.
 *
 * Key insight: Don't wait for groups to load before applying the preference.
 * Apply the Firestore preference immediately, validate lazily when groups arrive.
 *
 * Usage: Call this hook once in App.tsx after useUserPreferences is initialized.
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
 * This hook follows the same pattern as other settings (currency, font, etc.):
 * 1. Apply Firestore preference IMMEDIATELY when preferences load (AC3)
 * 2. Validate group membership LAZILY when groups arrive (AC4, AC5)
 * 3. Persist mode changes to Firestore (AC6)
 *
 * This avoids the race condition by NOT waiting for groups before applying preference.
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

  // Track if we've applied the initial Firestore preference
  const hasAppliedFirestoreRef = useRef(false);
  // Track if we've validated after groups loaded
  const hasValidatedGroupsRef = useRef(false);
  // Track if we've done initial sync (for persistence)
  const hasInitialSyncRef = useRef(false);
  // Track previous mode/groupId to detect changes
  const prevModeRef = useRef<{ mode: typeof mode; groupId?: string } | null>(null);

  // Step 1: Apply Firestore preference IMMEDIATELY when preferences load (AC3)
  // Don't wait for groups - apply the preference right away, just like currency/font settings
  useEffect(() => {
    if (preferencesLoading || hasAppliedFirestoreRef.current) {
      return;
    }

    hasAppliedFirestoreRef.current = true;

    // If Firestore has a preference, apply it immediately
    if (firestorePreference) {
      if (import.meta.env.DEV) {
        console.log('[useViewModePreferencePersistence] Applying Firestore preference immediately:', {
          mode: firestorePreference.mode,
          groupId: firestorePreference.groupId,
        });
      }

      if (firestorePreference.mode === 'group' && firestorePreference.groupId) {
        // Set group mode - group data will be populated when groups load
        setGroupMode(firestorePreference.groupId);
      } else if (firestorePreference.mode === 'personal') {
        setPersonalMode();
      }
    }
    // If no Firestore preference, ViewModeProvider already loaded from localStorage
  }, [preferencesLoading, firestorePreference, setGroupMode, setPersonalMode]);

  // Step 2: Validate group membership LAZILY when groups arrive (AC4, AC5)
  // This runs AFTER groups have loaded - validates the persisted groupId is still valid
  useEffect(() => {
    // Wait for groups to load and for initial preference to be applied
    if (groupsLoading || !hasAppliedFirestoreRef.current || hasValidatedGroupsRef.current) {
      return;
    }

    // Only validate if groups array has actual content
    // (avoid validating when subscription just started but no data yet)
    if (groups.length === 0 && mode === 'group' && groupId) {
      // We're in group mode but groups array is empty - wait for real data
      if (import.meta.env.DEV) {
        console.log('[useViewModePreferencePersistence] Waiting for groups data before validating');
      }
      return;
    }

    hasValidatedGroupsRef.current = true;

    if (import.meta.env.DEV) {
      console.log('[useViewModePreferencePersistence] Validating with groups:', {
        currentMode: mode,
        currentGroupId: groupId,
        groupCount: groups.length,
        groupIds: groups.map(g => g.id),
      });
    }

    // Call validateAndRestoreMode to:
    // 1. Populate group data if in valid group mode
    // 2. Fall back to personal mode if group is invalid (AC5)
    // 3. Mark context as validated
    validateAndRestoreMode(groups);
  }, [groupsLoading, groups, mode, groupId, validateAndRestoreMode]);

  // Step 3: Persist mode changes to Firestore after initial sync (AC6)
  useEffect(() => {
    // Don't persist until validation is done
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
