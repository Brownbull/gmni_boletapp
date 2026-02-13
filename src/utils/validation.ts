/**
 * Validation & Parsing Utilities
 *
 * Consolidated from validation.ts + validationUtils.ts (Story 15-1g).
 * Contains data parsing helpers and security validation functions.
 */

import { toDateSafe } from '@/utils/timestamp';

// =============================================================================
// Data Parsing
// =============================================================================

export const parseStrictNumber = (val: unknown): number => {
    const clean = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
};

export const getSafeDate = (val: unknown): string => {
    const today = new Date().toISOString().split('T')[0];
    // Accept YYYY-MM-DD strings directly
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Accept Firestore Timestamps and Date objects (but not arbitrary string parsing)
    if (val != null && typeof val !== 'string') {
        const date = toDateSafe(val as Parameters<typeof toDateSafe>[0]);
        if (date) return date.toISOString().split('T')[0];
    }
    return today;
};

// =============================================================================
// CSS Color Validation (TD-CONSOLIDATED-7: CSS Color Injection Prevention)
// =============================================================================

const DEFAULT_CSS_COLOR_FALLBACK = '#10b981';
const VALID_HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Validates a CSS color value against a strict hex pattern.
 * Only accepts 3-digit and 6-digit hex colors.
 */
export function validateCSSColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
        return false;
    }
    return VALID_HEX_COLOR_REGEX.test(color);
}

/**
 * Returns a safe CSS color, falling back to a default if invalid.
 * Use at rendering boundaries to prevent CSS injection.
 */
export function safeCSSColor(color: string | undefined | null, fallback: string = DEFAULT_CSS_COLOR_FALLBACK): string {
    if (color && validateCSSColor(color)) {
        return color;
    }
    return fallback;
}
