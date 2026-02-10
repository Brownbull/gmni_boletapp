/**
 * ThemeContext — DEPRECATED (Story 15-7c)
 *
 * Theme and locale settings are now managed by useSettingsStore (Zustand).
 * This file exists only for backward-compatible type re-exports.
 *
 * Migration guide:
 * - useTheme() → useThemeSettings() from '@/shared/stores'
 * - Individual selectors: useThemeMode(), useColorTheme(), useFontColorMode(),
 *   useFontSize(), useFontFamily(), useLang(), useCurrency(), useDateFormat()
 * - Non-React: settingsActions.setTheme(), getSettingsState()
 */

import type {
    Language,
    Currency,
    Theme,
    ColorTheme,
    FontColorMode,
    FontSize,
    FontFamily,
} from '../types/settings';

// Re-export types for backward compatibility
export type {
    Language,
    Currency,
    Theme,
    ColorTheme,
    FontColorMode,
    FontSize,
    FontFamily,
};

/**
 * @deprecated Use useThemeSettings() from '@/shared/stores' instead.
 * Kept for type-level backward compatibility only.
 */
export interface ThemeContextValue {
    theme: Theme;
    colorTheme: ColorTheme;
    fontColorMode: FontColorMode;
    fontSize: FontSize;
    fontFamily: FontFamily;
    lang: Language;
    currency: Currency;
    dateFormat: 'LatAm' | 'US';
    setTheme: (theme: Theme) => void;
    setColorTheme: (colorTheme: ColorTheme) => void;
    setFontColorMode: (mode: FontColorMode) => void;
    setFontSize: (size: FontSize) => void;
    setLang: (lang: Language) => void;
    setCurrency: (currency: Currency) => void;
    setDateFormat: (format: 'LatAm' | 'US') => void;
}
