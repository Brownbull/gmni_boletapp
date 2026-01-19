/**
 * Deep Link Handler Utilities
 *
 * Story 14c.17: Share Link Deep Linking
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Handles parsing of share code URLs for the shared groups feature.
 * URLs follow the pattern: https://boletapp-d609f.web.app/join/{shareCode}
 *
 * Features:
 * - Parse share codes from URL paths
 * - Validate share code format (16-char alphanumeric)
 * - SessionStorage key for pending join codes (unauthenticated flow)
 */

// SHARED_GROUP_LIMITS import removed - will be used when group limit checks are added

/**
 * SessionStorage key for storing pending join codes.
 * Used when an unauthenticated user clicks a join link.
 */
export const PENDING_JOIN_CODE_KEY = 'boletapp_pending_join_code';

/**
 * Regular expression pattern for validating share codes.
 * Share codes are exactly 16 alphanumeric characters.
 */
export const SHARE_CODE_PATTERN = /^[a-zA-Z0-9]{16}$/;

/**
 * Validate if a string is a valid share code format.
 *
 * @param code - The string to validate
 * @returns true if the code is exactly 16 alphanumeric characters
 */
export function isValidShareCode(code: string | null | undefined): boolean {
    if (!code || typeof code !== 'string') {
        return false;
    }
    return SHARE_CODE_PATTERN.test(code);
}

/**
 * Parse a share code from a URL pathname.
 *
 * Handles these URL patterns:
 * - /join/{code}
 * - /join/{code}/
 * - /join/{code}?query=string
 * - /join/{code}/?query=string
 * - /join/{code}#hash
 *
 * @param pathname - The URL pathname to parse (e.g., "/join/Ab3dEf7hIj9kLm0p")
 * @returns The share code if valid, or null if not a join URL or invalid code
 *
 * @example
 * parseShareCodeFromUrl('/join/Ab3dEf7hIj9kLm0p') // => 'Ab3dEf7hIj9kLm0p'
 * parseShareCodeFromUrl('/dashboard') // => null
 * parseShareCodeFromUrl('/join/short') // => null (invalid code)
 */
export function parseShareCodeFromUrl(pathname: string | null | undefined): string | null {
    if (!pathname || typeof pathname !== 'string') {
        return null;
    }

    // Trim whitespace
    const trimmedPath = pathname.trim();

    // Remove hash if present
    const pathWithoutHash = trimmedPath.split('#')[0];

    // Remove query string if present
    const pathWithoutQuery = pathWithoutHash.split('?')[0];

    // Remove trailing slash
    const cleanPath = pathWithoutQuery.replace(/\/$/, '');

    // Check if path starts with /join/ (case-insensitive)
    const joinMatch = cleanPath.match(/^\/join\/([^/]+)$/i);

    if (!joinMatch) {
        return null;
    }

    const potentialCode = joinMatch[1];

    // Validate the share code format
    if (!isValidShareCode(potentialCode)) {
        return null;
    }

    return potentialCode;
}

/**
 * Get any pending join code from sessionStorage.
 * Used to resume join flow after authentication.
 *
 * @returns The pending share code, or null if none exists
 */
export function getPendingJoinCode(): string | null {
    try {
        const code = sessionStorage.getItem(PENDING_JOIN_CODE_KEY);
        if (code && isValidShareCode(code)) {
            return code;
        }
        return null;
    } catch {
        // sessionStorage may not be available
        return null;
    }
}

/**
 * Store a share code in sessionStorage for later use.
 * Used when an unauthenticated user clicks a join link.
 *
 * @param code - The share code to store
 */
export function setPendingJoinCode(code: string): void {
    try {
        if (isValidShareCode(code)) {
            sessionStorage.setItem(PENDING_JOIN_CODE_KEY, code);
        }
    } catch {
        // sessionStorage may not be available
        console.warn('[deepLinkHandler] Could not store pending join code');
    }
}

/**
 * Clear any pending join code from sessionStorage.
 * Called after successfully processing a join link.
 */
export function clearPendingJoinCode(): void {
    try {
        sessionStorage.removeItem(PENDING_JOIN_CODE_KEY);
    } catch {
        // sessionStorage may not be available
    }
}

/**
 * Clear the join path from the browser URL.
 * Uses history.replaceState to avoid adding to browser history.
 */
export function clearJoinUrlPath(): void {
    try {
        if (window.location.pathname.toLowerCase().startsWith('/join/')) {
            window.history.replaceState({}, '', '/');
        }
    } catch {
        // May fail in some environments
        console.warn('[deepLinkHandler] Could not clear URL path');
    }
}
