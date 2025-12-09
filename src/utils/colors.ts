/**
 * Color utilities for Boletapp charts and categories.
 *
 * Uses CSS custom properties (--chart-1 through --chart-6) for theme support.
 * Colors change automatically when theme changes (Slate Professional vs Ghibli).
 *
 * @see docs/ux-design-specification.md Section 3.1 - Color System
 */

/**
 * Generate a deterministic color from a string (fallback for unknown categories).
 */
const stringToColor = (str: string): string => {
    if (!str) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

/**
 * Default chart colors (Slate Professional theme).
 * Used as fallback when CSS variables are not available (SSR, tests).
 */
const DEFAULT_CHART_COLORS: Record<string, string> = {
    '--chart-1': '#3b82f6',
    '--chart-2': '#22c55e',
    '--chart-3': '#f59e0b',
    '--chart-4': '#ef4444',
    '--chart-5': '#8b5cf6',
    '--chart-6': '#ec4899',
};

/**
 * Get the value of a CSS custom property.
 * Returns the computed value from the document root, with fallback for SSR/tests.
 */
const getCssVariable = (varName: string): string => {
    // SSR fallback - return default slate theme colors
    if (typeof window === 'undefined') {
        return DEFAULT_CHART_COLORS[varName] || '#94a3b8';
    }

    // Try to get the CSS variable value
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

    // If empty (CSS variable not defined in jsdom tests), use fallback
    if (!value) {
        return DEFAULT_CHART_COLORS[varName] || '#94a3b8';
    }

    return value;
};

/**
 * Get chart color by index (1-6) using CSS custom properties.
 * These colors change automatically based on theme (Slate vs Ghibli).
 *
 * Slate Professional:
 *   1: #3b82f6 (blue)    2: #22c55e (green)   3: #f59e0b (amber)
 *   4: #ef4444 (red)     5: #8b5cf6 (violet)  6: #ec4899 (pink)
 *
 * Ghibli:
 *   1: #5b8fa8 (ocean)   2: #7d9b5f (sage)    3: #e8a87c (sunset)
 *   4: #f0a3b0 (rose)    5: #a3c5e0 (sky)     6: #e3bba1 (peach)
 */
export const getChartColor = (index: number): string => {
    const colorIndex = ((index - 1) % 6) + 1; // Ensure index is 1-6
    return getCssVariable(`--chart-${colorIndex}`);
};

/**
 * Category to chart color index mapping.
 * Maps well-known categories to specific chart color slots for consistency.
 * Uses the 6-color palette from CSS variables.
 */
const CATEGORY_COLOR_INDEX: Record<string, number> = {
    // Store categories - primary use case
    Supermarket: 1,
    Restaurant: 3,
    Bakery: 3,
    Butcher: 4,
    Bazaar: 5,
    Veterinary: 2,
    PetShop: 2,
    Medical: 5,
    Pharmacy: 5,
    Technology: 1,
    StreetVendor: 4,
    Transport: 2,
    Services: 1,
    Other: 6,
    // Item categories
    'Fresh Food': 2,
    'Pantry': 3,
    'Drinks': 1,
    'Household': 5,
    'Personal Care': 4,
    'Pets': 2,
    // Common labels (for pie chart / legend)
    Food: 1,
    Housing: 3,
    Entertainment: 4,
};

/**
 * Get color for a category or label.
 * Uses CSS custom properties for theme-aware colors.
 *
 * @param key - Category name, label, or special key (e.g., "temporal-0")
 * @returns Hex color string from current theme
 */
export const getColor = (key: string): string => {
    // Handle temporal keys (e.g., "temporal-0", "temporal-1", etc.)
    // Uses chart colors 1-4 in sequence
    if (key.startsWith('temporal-')) {
        const index = parseInt(key.replace('temporal-', ''), 10);
        return getChartColor((index % 4) + 1);
    }

    // Check if we have a predefined color index for this category
    const colorIndex = CATEGORY_COLOR_INDEX[key];
    if (colorIndex) {
        return getChartColor(colorIndex);
    }

    // Fallback: generate deterministic color from string
    return stringToColor(key || 'default');
};
