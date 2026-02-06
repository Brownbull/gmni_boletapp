/**
 * Story 14c-refactor.9: ThemeContext - App-wide theme and appearance context
 * Story 14e-35: Locale settings migrated to Zustand store
 *
 * Provides theme preferences and locale settings to the entire app via React Context.
 * Manages visual appearance (light/dark, color themes) and localization (language, date format).
 *
 * Features:
 * - Light/dark mode (theme)
 * - Color theme (normal, professional, mono)
 * - Font color mode (colorful, plain)
 * - Font size scaling (small, normal)
 * - Language setting (es, en) - from useSettingsStore
 * - Date format preference (LatAm, US) - from useSettingsStore
 * - Currency display preference - from useSettingsStore
 * - localStorage persistence for visual settings (locale via Zustand)
 *
 * Note: fontFamily is persisted via Firestore (useUserPreferences) and passed through props
 * Note: Locale settings (lang, currency, dateFormat) now use useSettingsStore (Zustand)
 *       to eliminate dual-sync race condition with App.tsx
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition, Epic 14e - Feature Architecture
 *
 * @example
 * ```tsx
 * // In any component
 * const { theme, colorTheme, lang, setTheme, setColorTheme } = useTheme();
 *
 * // Apply dark mode
 * setTheme('dark');
 *
 * // Change color palette
 * setColorTheme('professional');
 * ```
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import type {
    Language,
    Currency,
    Theme,
    ColorTheme,
    FontColorMode,
    FontSize,
    FontFamily,
} from '../types/settings';
// Story 14e-35: Use Zustand store for locale settings (eliminates dual-sync race condition)
import {
    useLang,
    useCurrency,
    useDateFormat,
    settingsActions,
} from '../shared/stores/useSettingsStore';

// =============================================================================
// Types
// =============================================================================

/**
 * Context value provided to consumers
 */
export interface ThemeContextValue {
    // Visual theme settings
    /** Light or dark mode */
    theme: Theme;
    /** Color theme (normal, professional, mono) */
    colorTheme: ColorTheme;
    /** Font color mode (colorful, plain) */
    fontColorMode: FontColorMode;
    /** Font size scaling (small, normal) */
    fontSize: FontSize;
    /** Font family (outfit, space) - passed through from Firestore preferences */
    fontFamily: FontFamily;

    // Locale settings
    /** Language (es, en) */
    lang: Language;
    /** Currency display preference (CLP, USD, EUR) */
    currency: Currency;
    /** Date format preference (LatAm, US) */
    dateFormat: 'LatAm' | 'US';

    // Setters
    setTheme: (theme: Theme) => void;
    setColorTheme: (colorTheme: ColorTheme) => void;
    setFontColorMode: (mode: FontColorMode) => void;
    setFontSize: (size: FontSize) => void;
    setLang: (lang: Language) => void;
    setCurrency: (currency: Currency) => void;
    setDateFormat: (format: 'LatAm' | 'US') => void;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Theme Context - provides theme and locale state and actions.
 *
 * IMPORTANT: Do not use useContext(ThemeContext) directly.
 * Use the useTheme() hook instead for proper error handling.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Load color theme from localStorage with migration for old values.
 * Story 7.12: Added color theme selector
 * Story 14.12: Added 'mono' as new default, migrated from 'normal' default
 */
function loadColorTheme(): ColorTheme {
    const saved = localStorage.getItem('colorTheme');
    // Migration: treat old 'ghibli' as 'normal', old 'default' as 'professional'
    if (saved === 'ghibli') return 'normal';
    if (saved === 'default') return 'professional';
    // Keep explicit preferences
    if (saved === 'normal' || saved === 'professional' || saved === 'mono') return saved;
    return 'mono'; // Default to 'mono' (monochrome minimal)
}

/**
 * Load font color mode from localStorage.
 * Story 14.21: Font color mode for category text
 */
function loadFontColorMode(): FontColorMode {
    const saved = localStorage.getItem('fontColorMode');
    if (saved === 'colorful' || saved === 'plain') return saved;
    return 'colorful'; // Default to colorful
}

/**
 * Load font size from localStorage.
 * Story 14.37: Font size scaling
 */
function loadFontSize(): FontSize {
    const saved = localStorage.getItem('fontSize');
    if (saved === 'small' || saved === 'normal') return saved;
    return 'small'; // Default to small (current sizes) for backwards compatibility
}

/**
 * Load theme (light/dark) from localStorage.
 * Story 14c-refactor.9: Theme persistence
 */
function loadTheme(): Theme {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light'; // Default to light mode
}

/**
 * Load language from localStorage.
 * Story 14c-refactor.9: Language persistence
 * Exported for use in App.tsx (before ThemeProvider is available)
 */
export function loadLanguage(): Language {
    const saved = localStorage.getItem('lang');
    if (saved === 'es' || saved === 'en') return saved as Language;
    return 'es'; // Default to Spanish (target market: Chile)
}

/**
 * Load currency from localStorage.
 * Story 14c-refactor.9: Currency persistence
 * Exported for use in App.tsx (before ThemeProvider is available)
 */
export function loadCurrency(): Currency {
    const saved = localStorage.getItem('currency');
    if (saved === 'CLP' || saved === 'USD' || saved === 'EUR') return saved as Currency;
    return 'CLP'; // Default to Chilean Pesos (target market)
}

/**
 * Load date format from localStorage.
 * Story 14c-refactor.9: Date format persistence
 * Exported for use in App.tsx (before ThemeProvider is available)
 */
export function loadDateFormat(): 'LatAm' | 'US' {
    const saved = localStorage.getItem('dateFormat');
    if (saved === 'LatAm' || saved === 'US') return saved;
    return 'LatAm'; // Default to Latin American format (target market)
}

// =============================================================================
// Provider Props
// =============================================================================

interface ThemeProviderProps {
    children: ReactNode;
    /** Font family from Firestore preferences (defaults to 'outfit') */
    fontFamily?: FontFamily;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Theme Context Provider.
 *
 * Wrap your app with this provider to enable theme and locale settings.
 *
 * @example
 * ```tsx
 * <ThemeProvider fontFamily={userPreferences.fontFamily}>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
    children,
    fontFamily = 'outfit',
}: ThemeProviderProps) {
    // Visual theme settings with localStorage initialization
    const [theme, setThemeState] = useState<Theme>(loadTheme);
    const [colorTheme, setColorThemeState] = useState<ColorTheme>(loadColorTheme);
    const [fontColorMode, setFontColorModeState] = useState<FontColorMode>(loadFontColorMode);
    const [fontSize, setFontSizeState] = useState<FontSize>(loadFontSize);

    // Story 14e-35: Locale settings from Zustand store (single source of truth)
    // Eliminates dual-sync race condition between App.tsx useState and ThemeContext
    const lang = useLang();
    const currency = useCurrency();
    const dateFormat = useDateFormat();

    // ===========================================================================
    // localStorage Persistence Effects
    // ===========================================================================

    // Story 14c-refactor.9: Persist theme (light/dark) to localStorage
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Story 7.12: Persist color theme to localStorage
    useEffect(() => {
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    // Story 14.21: Persist font color mode to localStorage
    useEffect(() => {
        localStorage.setItem('fontColorMode', fontColorMode);
    }, [fontColorMode]);

    // Story 14.37: Persist font size to localStorage
    useEffect(() => {
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    // Story 14e-35: Locale settings persistence removed
    // Now handled by useSettingsStore (Zustand persist middleware)

    // ===========================================================================
    // Action Functions
    // ===========================================================================

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    const setColorTheme = useCallback((newColorTheme: ColorTheme) => {
        setColorThemeState(newColorTheme);
    }, []);

    const setFontColorMode = useCallback((mode: FontColorMode) => {
        setFontColorModeState(mode);
    }, []);

    const setFontSize = useCallback((size: FontSize) => {
        setFontSizeState(size);
    }, []);

    // Story 14e-35: Locale setters use Zustand store actions (eliminates custom events)
    // Store actions handle localStorage persistence automatically
    const setLang = useCallback((newLang: Language) => {
        settingsActions.setLang(newLang);
    }, []);

    const setCurrency = useCallback((newCurrency: Currency) => {
        settingsActions.setCurrency(newCurrency);
    }, []);

    const setDateFormat = useCallback((format: 'LatAm' | 'US') => {
        settingsActions.setDateFormat(format);
    }, []);

    // ===========================================================================
    // Memoized Context Value
    // ===========================================================================

    const value = useMemo<ThemeContextValue>(
        () => ({
            // Visual settings
            theme,
            colorTheme,
            fontColorMode,
            fontSize,
            fontFamily,

            // Locale settings
            lang,
            currency,
            dateFormat,

            // Setters
            setTheme,
            setColorTheme,
            setFontColorMode,
            setFontSize,
            setLang,
            setCurrency,
            setDateFormat,
        }),
        [
            theme,
            colorTheme,
            fontColorMode,
            fontSize,
            fontFamily,
            lang,
            currency,
            dateFormat,
            setTheme,
            setColorTheme,
            setFontColorMode,
            setFontSize,
            setLang,
            setCurrency,
            setDateFormat,
        ]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// =============================================================================
// Consumer Hooks
// =============================================================================

/**
 * Access theme context - throws if outside provider.
 *
 * Use this hook in components that REQUIRE theme functionality.
 *
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const { theme, colorTheme, setTheme, setColorTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <select value={theme} onChange={e => setTheme(e.target.value as Theme)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *       </select>
 *       <select value={colorTheme} onChange={e => setColorTheme(e.target.value as ColorTheme)}>
 *         <option value="mono">Mono</option>
 *         <option value="normal">Normal</option>
 *         <option value="professional">Professional</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

/**
 * Access theme context - returns null if outside provider.
 *
 * Use this hook in components that OPTIONALLY use theme,
 * such as layout components rendered before full app initialization.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const theme = useThemeOptional();
 *
 *   // Use default if context not available
 *   const isDark = theme?.theme === 'dark';
 *
 *   return <div className={isDark ? 'dark' : 'light'}>...</div>;
 * }
 * ```
 */
export function useThemeOptional(): ThemeContextValue | null {
    return useContext(ThemeContext);
}

// =============================================================================
// Re-exports
// =============================================================================

export type {
    Language,
    Currency,
    Theme,
    ColorTheme,
    FontColorMode,
    FontSize,
    FontFamily,
} from '../types/settings';
