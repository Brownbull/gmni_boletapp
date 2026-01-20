/**
 * Unit tests for deep link URL parsing utility
 *
 * Story 14c.17: Share Link Deep Linking
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests URL parsing for share code deep links:
 * - Valid URL patterns (/join/{code}, /join/{code}/, /join/{code}?...)
 * - Invalid URLs (wrong path, invalid code format)
 * - Share code format validation (16-char URL-safe: A-Za-z0-9_-)
 *
 * NOTE: nanoid uses URL-safe alphabet including underscore and hyphen
 */

import { describe, it, expect } from 'vitest';
import {
    parseShareCodeFromUrl,
    isValidShareCode,
    SHARE_CODE_PATTERN,
    PENDING_JOIN_CODE_KEY,
} from '../../../src/utils/deepLinkHandler';

describe('deepLinkHandler', () => {
    describe('SHARE_CODE_PATTERN', () => {
        it('should match valid 16-char alphanumeric codes', () => {
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7hIj9kLm0p')).toBe(true);
            expect(SHARE_CODE_PATTERN.test('1234567890123456')).toBe(true);
            expect(SHARE_CODE_PATTERN.test('ABCDEFGHIJKLMNOP')).toBe(true);
            expect(SHARE_CODE_PATTERN.test('abcdefghijklmnop')).toBe(true);
        });

        it('should match codes with underscore and hyphen (nanoid URL-safe)', () => {
            // nanoid uses URL-safe alphabet: A-Za-z0-9_-
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7h_j9kLm0p')).toBe(true);
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7h-j9kLm0p')).toBe(true);
            expect(SHARE_CODE_PATTERN.test('Nxc5iS0_UVIOlt_3')).toBe(true); // Real production code
            expect(SHARE_CODE_PATTERN.test('8MJ_xt9U7b5GHtXw')).toBe(true); // nanoid sample
        });

        it('should reject codes shorter than 16 chars', () => {
            expect(SHARE_CODE_PATTERN.test('abc123')).toBe(false);
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7hIj9kLm0')).toBe(false); // 15 chars
        });

        it('should reject codes longer than 16 chars', () => {
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7hIj9kLm0pX')).toBe(false); // 17 chars
        });

        it('should reject codes with non-URL-safe special characters', () => {
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7hIj9kLm0!')).toBe(false);
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7h@j9kLm0p')).toBe(false);
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7h#j9kLm0p')).toBe(false);
            expect(SHARE_CODE_PATTERN.test('Ab3dEf7h$j9kLm0p')).toBe(false);
        });
    });

    describe('isValidShareCode', () => {
        it('should return true for valid share codes', () => {
            expect(isValidShareCode('Ab3dEf7hIj9kLm0p')).toBe(true);
            expect(isValidShareCode('0123456789abcdef')).toBe(true);
            // nanoid URL-safe codes with underscore and hyphen
            expect(isValidShareCode('Nxc5iS0_UVIOlt_3')).toBe(true);
            expect(isValidShareCode('Ab3dEf7h-j9kLm0p')).toBe(true);
        });

        it('should return false for invalid share codes', () => {
            expect(isValidShareCode('')).toBe(false);
            expect(isValidShareCode('short')).toBe(false);
            expect(isValidShareCode('too-long-code-here!')).toBe(false);
            expect(isValidShareCode(null as unknown as string)).toBe(false);
            expect(isValidShareCode(undefined as unknown as string)).toBe(false);
        });
    });

    describe('parseShareCodeFromUrl', () => {
        describe('valid URLs', () => {
            it('should parse /join/{code} pattern', () => {
                const result = parseShareCodeFromUrl('/join/Ab3dEf7hIj9kLm0p');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });

            it('should parse /join/{code}/ pattern with trailing slash', () => {
                const result = parseShareCodeFromUrl('/join/Ab3dEf7hIj9kLm0p/');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });

            it('should parse /join/{code}?... pattern with query string', () => {
                const result = parseShareCodeFromUrl('/join/Ab3dEf7hIj9kLm0p?ref=email');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });

            it('should parse /join/{code}/?... pattern with trailing slash and query', () => {
                const result = parseShareCodeFromUrl('/join/Ab3dEf7hIj9kLm0p/?utm=test');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });

            it('should handle lowercase path', () => {
                const result = parseShareCodeFromUrl('/Join/Ab3dEf7hIj9kLm0p');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });

            it('should parse codes with underscore (nanoid URL-safe)', () => {
                const result = parseShareCodeFromUrl('/join/Nxc5iS0_UVIOlt_3');
                expect(result).toBe('Nxc5iS0_UVIOlt_3');
            });

            it('should parse codes with hyphen (nanoid URL-safe)', () => {
                const result = parseShareCodeFromUrl('/join/Ab3dEf7h-j9kLm0p');
                expect(result).toBe('Ab3dEf7h-j9kLm0p');
            });
        });

        describe('invalid URLs', () => {
            it('should return null for non-join paths', () => {
                expect(parseShareCodeFromUrl('/')).toBeNull();
                expect(parseShareCodeFromUrl('/dashboard')).toBeNull();
                expect(parseShareCodeFromUrl('/settings')).toBeNull();
                expect(parseShareCodeFromUrl('/join')).toBeNull();
                expect(parseShareCodeFromUrl('/join/')).toBeNull();
            });

            it('should return null for invalid share codes in URL', () => {
                expect(parseShareCodeFromUrl('/join/short')).toBeNull();
                expect(parseShareCodeFromUrl('/join/too-long-code-here!')).toBeNull();
                expect(parseShareCodeFromUrl('/join/Ab3dEf7h@j9kLm0p')).toBeNull(); // @ not in nanoid
            });

            it('should return null for empty or invalid input', () => {
                expect(parseShareCodeFromUrl('')).toBeNull();
                expect(parseShareCodeFromUrl(null as unknown as string)).toBeNull();
                expect(parseShareCodeFromUrl(undefined as unknown as string)).toBeNull();
            });

            it('should return null for deeply nested join paths', () => {
                expect(parseShareCodeFromUrl('/foo/join/Ab3dEf7hIj9kLm0p')).toBeNull();
                expect(parseShareCodeFromUrl('/api/join/Ab3dEf7hIj9kLm0p')).toBeNull();
            });
        });

        describe('edge cases', () => {
            it('should handle URL with hash', () => {
                const result = parseShareCodeFromUrl('/join/Ab3dEf7hIj9kLm0p#section');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });

            it('should handle extra whitespace', () => {
                const result = parseShareCodeFromUrl('  /join/Ab3dEf7hIj9kLm0p  ');
                expect(result).toBe('Ab3dEf7hIj9kLm0p');
            });
        });
    });

    describe('PENDING_JOIN_CODE_KEY', () => {
        it('should be a valid sessionStorage key', () => {
            expect(typeof PENDING_JOIN_CODE_KEY).toBe('string');
            expect(PENDING_JOIN_CODE_KEY.length).toBeGreaterThan(0);
            expect(PENDING_JOIN_CODE_KEY).toBe('boletapp_pending_join_code');
        });
    });
});
