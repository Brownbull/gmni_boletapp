/**
 * Validation Utility Functions
 *
 * Story 14d-v2-1-5a: Invitation Foundation (Types & Utils)
 *
 * Provides common validation utilities for the application.
 * Currently includes email validation for shared group invitations.
 */

/**
 * Standard email validation regex pattern.
 *
 * This pattern validates:
 * - Local part: alphanumeric with ._+- allowed
 * - @ symbol required
 * - Domain part: alphanumeric with .- allowed
 * - TLD: 2+ letters required
 *
 * Based on RFC 5322 simplified pattern suitable for most use cases.
 * Note: Does not cover all edge cases in RFC 5322 but handles 99%+ of real emails.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate an email address format.
 *
 * Uses a standard email regex pattern that handles most common email formats.
 * Does not verify that the email actually exists, only that the format is valid.
 *
 * @param email - The email address to validate
 * @returns true if the email format is valid, false otherwise
 *
 * @example
 * ```typescript
 * validateEmail('user@example.com');    // true
 * validateEmail('user.name@sub.domain.com'); // true
 * validateEmail('invalid');              // false
 * validateEmail('missing@domain');       // false
 * validateEmail('');                     // false
 * ```
 */
export function validateEmail(email: string): boolean {
    // Handle null, undefined, or non-string inputs
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Trim whitespace for more forgiving validation
    const trimmedEmail = email.trim();

    // Check if empty after trimming
    if (trimmedEmail.length === 0) {
        return false;
    }

    // Test against email regex
    return EMAIL_REGEX.test(trimmedEmail);
}

/**
 * Normalize an email address for comparison and storage.
 *
 * Emails are case-insensitive in the local part per RFC 5321,
 * but many providers (Gmail, Outlook) treat them as case-insensitive.
 * For consistency, we normalize to lowercase.
 *
 * @param email - The email address to normalize
 * @returns Lowercase, trimmed email or empty string if invalid
 *
 * @example
 * ```typescript
 * normalizeEmail('User@Example.COM');  // 'user@example.com'
 * normalizeEmail('  user@test.com  '); // 'user@test.com'
 * normalizeEmail('invalid');            // ''
 * ```
 */
export function normalizeEmail(email: string): string {
    if (!validateEmail(email)) {
        return '';
    }

    return email.trim().toLowerCase();
}

// =============================================================================
// Application ID Validation (Story 14d-v2-1-7b: ECC Security Review)
// =============================================================================

/**
 * Allowed application IDs for Firestore path construction.
 *
 * Story 14d-v2-1-7b: ECC Security Review fix
 * Prevents path traversal attacks in collection paths like `artifacts/{appId}/users/...`
 */
const ALLOWED_APP_IDS = ['boletapp'] as const;

/**
 * Validate an application ID against the allowlist.
 *
 * Prevents path traversal attacks in Firestore collection paths.
 * Only known application IDs are permitted.
 *
 * @param appId - The application ID to validate
 * @returns true if the appId is in the allowlist, false otherwise
 *
 * @example
 * ```typescript
 * validateAppId('boletapp');  // true
 * validateAppId('../hack');   // false
 * validateAppId('unknown');   // false
 * ```
 */
export function validateAppId(appId: string): boolean {
    if (!appId || typeof appId !== 'string') {
        return false;
    }
    return (ALLOWED_APP_IDS as readonly string[]).includes(appId);
}

// =============================================================================
// Group ID Validation (TD-CONSOLIDATED-6: GroupId Validation)
// =============================================================================

/**
 * Regex pattern for validating groupId.
 *
 * Rules:
 * - Only alphanumeric characters, hyphens, and underscores allowed
 * - Length must be between 1 and 128 characters
 * - Prevents Firestore path injection (/) and field path injection (.)
 */
const VALID_GROUP_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Validates a groupId against security and format constraints.
 *
 * Prevents path injection attacks by ensuring groupId contains only
 * safe characters before use in Firestore document paths or field paths.
 *
 * @param groupId - The group ID to validate
 * @throws Error if groupId is invalid
 */
export function validateGroupId(groupId: string): void {
    if (!groupId || typeof groupId !== 'string' || !VALID_GROUP_ID_REGEX.test(groupId)) {
        throw new Error(
            'Invalid groupId: must be 1-128 characters containing only letters, numbers, hyphens, or underscores'
        );
    }
}

// =============================================================================
// CSS Color Validation (TD-CONSOLIDATED-7: CSS Color Injection Prevention)
// =============================================================================

/** Default fallback color for CSS color validation (emerald green, matches DEFAULT_GROUP_COLOR) */
const DEFAULT_CSS_COLOR_FALLBACK = '#10b981';

/**
 * Regex pattern for valid CSS hex colors.
 * Accepts 3-digit (#RGB) and 6-digit (#RRGGBB) hex colors only.
 * Does NOT accept named colors, rgba(), var(), or any other CSS value.
 */
const VALID_HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Validates a CSS color value against a strict hex pattern.
 *
 * Only accepts 3-digit and 6-digit hex colors (e.g., #abc, #10b981).
 * Rejects all other CSS values including named colors, rgba(), var(),
 * url(), expression(), and any string that could enable CSS injection.
 *
 * @param color - The color value to validate
 * @returns true if the color is a valid hex color, false otherwise
 */
export function validateCSSColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
        return false;
    }
    return VALID_HEX_COLOR_REGEX.test(color);
}

/**
 * Returns a safe CSS color, falling back to a default if invalid.
 *
 * Use this at rendering boundaries to prevent CSS injection from
 * Firestore-sourced group.color values.
 *
 * @param color - The color value to validate and return
 * @param fallback - Fallback color if invalid (defaults to DEFAULT_GROUP_COLOR #10b981).
 *   WARNING: The fallback is NOT validated. Only pass hardcoded string
 *   literals (e.g., '#10b981', 'var(--primary)'), never user-controlled values.
 * @returns The validated color or the fallback
 */
export function safeCSSColor(color: string | undefined | null, fallback: string = DEFAULT_CSS_COLOR_FALLBACK): string {
    if (color && validateCSSColor(color)) {
        return color;
    }
    return fallback;
}
