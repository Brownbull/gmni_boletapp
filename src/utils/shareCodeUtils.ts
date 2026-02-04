/**
 * Share Code Utility Functions
 *
 * Story 14d-v2-1-5a: Invitation Foundation (Types & Utils)
 *
 * Provides cryptographically secure share code generation for
 * shared group invitations. Share codes are:
 * - 16+ characters long
 * - URL-safe (alphanumeric with _ and -)
 * - Cryptographically random via nanoid
 *
 * @example
 * ```typescript
 * const code = generateShareCode();
 * // Returns something like: "V1StGXR8_Z5jdHi6B-myT"
 * ```
 */

import { nanoid } from 'nanoid';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';

/**
 * Generate a cryptographically random, URL-safe share code.
 *
 * Uses nanoid which provides:
 * - Cryptographically strong random values
 * - URL-safe alphabet (A-Za-z0-9_-)
 * - Collision resistance: 1% probability of collision after ~2.2M IDs
 *
 * @returns 16-character URL-safe string
 *
 * @example
 * ```typescript
 * const shareCode = generateShareCode();
 * console.log(shareCode); // "V1StGXR8_Z5jdHi6"
 * console.log(shareCode.length); // 16
 * ```
 */
export function generateShareCode(): string {
    return nanoid(SHARED_GROUP_LIMITS.SHARE_CODE_LENGTH);
}

/**
 * Validate that a share code has the correct format.
 *
 * Valid share codes are:
 * - Exactly SHARE_CODE_LENGTH (16) characters
 * - Only URL-safe characters (A-Za-z0-9_-)
 *
 * @param code - The share code to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidShareCode("V1StGXR8_Z5jdHi6"); // true (16 chars, valid chars)
 * isValidShareCode("abc"); // false (too short)
 * isValidShareCode("invalid!@#$%^&*()"); // false (invalid chars)
 * ```
 */
export function isValidShareCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
        return false;
    }

    // Check length
    if (code.length !== SHARED_GROUP_LIMITS.SHARE_CODE_LENGTH) {
        return false;
    }

    // Check URL-safe alphanumeric (nanoid default alphabet: A-Za-z0-9_-)
    const validPattern = /^[A-Za-z0-9_-]+$/;
    return validPattern.test(code);
}
