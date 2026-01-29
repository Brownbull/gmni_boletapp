/**
 * Story 14e-20b: Settings Zustand Store
 *
 * Zustand-based state management for app settings.
 * Persists theme, colorTheme, fontColorMode, and fontSize to localStorage.
 *
 * Migrates from legacy localStorage keys:
 * - 'colorTheme': 'ghibli' -> 'normal', 'default' -> 'professional'
 * - 'fontColorMode': validates 'colorful' | 'plain'
 * - 'fontSize': validates 'small' | 'normal'
 *
 * Architecture Reference:
 * - docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md (ADR-018)
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, ColorTheme, FontColorMode, FontSize } from '@/types/settings';

// =============================================================================
// Types
// =============================================================================

interface SettingsState {
  theme: Theme;
  colorTheme: ColorTheme;
  fontColorMode: FontColorMode;
  fontSize: FontSize;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setFontColorMode: (fontColorMode: FontColorMode) => void;
  setFontSize: (fontSize: FontSize) => void;
}

// =============================================================================
// Default State
// =============================================================================

export const defaultSettingsState: SettingsState = {
  theme: 'light',
  colorTheme: 'mono',
  fontColorMode: 'colorful',
  fontSize: 'small',
};

// =============================================================================
// Migration from Legacy localStorage Keys
// =============================================================================

/**
 * Read legacy localStorage keys and migrate values to current format.
 * This function is called during store hydration to preserve user preferences.
 *
 * Migrations:
 * - colorTheme: 'ghibli' -> 'normal', 'default' -> 'professional'
 * - fontColorMode: validates 'colorful' | 'plain'
 * - fontSize: validates 'small' | 'normal'
 *
 * Note: 'theme' (light/dark) is not persisted in legacy format, uses default.
 */
const migrateFromLegacyKeys = (): Partial<SettingsState> => {
  // Guard for SSR/test environments
  if (typeof localStorage === 'undefined') {
    return {};
  }

  const result: Partial<SettingsState> = {};

  // Migrate colorTheme (handles ghibli->normal, default->professional)
  const savedColorTheme = localStorage.getItem('colorTheme');
  if (savedColorTheme === 'ghibli') {
    result.colorTheme = 'normal';
  } else if (savedColorTheme === 'default') {
    result.colorTheme = 'professional';
  } else if (
    savedColorTheme === 'normal' ||
    savedColorTheme === 'professional' ||
    savedColorTheme === 'mono'
  ) {
    result.colorTheme = savedColorTheme;
  }

  // Migrate fontColorMode
  const savedFontColorMode = localStorage.getItem('fontColorMode');
  if (savedFontColorMode === 'colorful' || savedFontColorMode === 'plain') {
    result.fontColorMode = savedFontColorMode;
  }

  // Migrate fontSize
  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize === 'small' || savedFontSize === 'normal') {
    result.fontSize = savedFontSize;
  }

  return result;
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools(
    persist(
      (set) => ({
        // Initial state with legacy migration
        ...defaultSettingsState,

        // Actions
        // Note: We also write to plain localStorage keys for backward compatibility
        // with code that reads directly (e.g., categoryColors.ts getFontColorMode())
        setTheme: (theme) => {
          try { localStorage.setItem('theme', theme); } catch { /* SSR/test safety */ }
          set({ theme }, false, 'settings/setTheme');
        },

        setColorTheme: (colorTheme) => {
          try { localStorage.setItem('colorTheme', colorTheme); } catch { /* SSR/test safety */ }
          set({ colorTheme }, false, 'settings/setColorTheme');
        },

        setFontColorMode: (fontColorMode) => {
          try { localStorage.setItem('fontColorMode', fontColorMode); } catch { /* SSR/test safety */ }
          set({ fontColorMode }, false, 'settings/setFontColorMode');
        },

        setFontSize: (fontSize) => {
          try { localStorage.setItem('fontSize', fontSize); } catch { /* SSR/test safety */ }
          set({ fontSize }, false, 'settings/setFontSize');
        },
      }),
      {
        name: 'boletapp-settings',
        storage: createJSONStorage(() => localStorage),
        // Merge function to apply legacy migration on first load
        merge: (persistedState, currentState) => {
          // If no persisted state, apply legacy migration
          if (!persistedState || typeof persistedState !== 'object') {
            const legacyValues = migrateFromLegacyKeys();
            return {
              ...currentState,
              ...legacyValues,
            };
          }
          // Otherwise, merge persisted state with current (persisted takes precedence)
          return {
            ...currentState,
            ...(persistedState as Partial<SettingsState>),
          };
        },
      }
    ),
    {
      name: 'settings-store',
      enabled: import.meta.env.DEV,
    }
  )
);

// =============================================================================
// Convenience Selectors (prevent unnecessary re-renders)
// =============================================================================

export const useTheme = () => useSettingsStore((state) => state.theme);
export const useColorTheme = () => useSettingsStore((state) => state.colorTheme);
export const useFontColorMode = () => useSettingsStore((state) => state.fontColorMode);
export const useFontSize = () => useSettingsStore((state) => state.fontSize);

// =============================================================================
// Direct Access (for non-React code)
// =============================================================================

/**
 * Get current settings state directly (non-reactive).
 * Use this in services or non-React code where hooks can't be used.
 */
export const getSettingsState = () => useSettingsStore.getState();

/**
 * Settings actions for non-React code.
 * Example: settingsActions.setTheme('dark')
 */
export const settingsActions = {
  setTheme: (theme: Theme) => useSettingsStore.getState().setTheme(theme),
  setColorTheme: (colorTheme: ColorTheme) =>
    useSettingsStore.getState().setColorTheme(colorTheme),
  setFontColorMode: (fontColorMode: FontColorMode) =>
    useSettingsStore.getState().setFontColorMode(fontColorMode),
  setFontSize: (fontSize: FontSize) =>
    useSettingsStore.getState().setFontSize(fontSize),
};
