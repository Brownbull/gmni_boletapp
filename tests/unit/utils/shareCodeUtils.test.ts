/**
 * Share Code Utils Tests
 *
 * Story 14d-v2-1-5a: Invitation Foundation (Types & Utils)
 *
 * Tests for share code generation and validation:
 * - generateShareCode() - AC #2
 * - isValidShareCode() - Format validation
 */

import { describe, it, expect } from 'vitest';
import { generateShareCode, isValidShareCode } from '../../../src/utils/shareCodeUtils';
import { SHARED_GROUP_LIMITS } from '../../../src/types/sharedGroup';

describe('shareCodeUtils', () => {
    // =========================================================================
    // generateShareCode Tests (AC #2)
    // =========================================================================
    describe('generateShareCode', () => {
        it('returns a string of exactly 16 characters (AC #2)', () => {
            const code = generateShareCode();

            expect(typeof code).toBe('string');
            expect(code.length).toBe(SHARED_GROUP_LIMITS.SHARE_CODE_LENGTH);
            expect(code.length).toBe(16);
        });

        it('returns URL-safe characters only (AC #2)', () => {
            const code = generateShareCode();

            // nanoid uses A-Za-z0-9_- by default
            const urlSafePattern = /^[A-Za-z0-9_-]+$/;
            expect(urlSafePattern.test(code)).toBe(true);
        });

        it('generates unique codes on consecutive calls', () => {
            const codes = new Set<string>();
            const iterations = 100;

            for (let i = 0; i < iterations; i++) {
                codes.add(generateShareCode());
            }

            // All 100 codes should be unique
            expect(codes.size).toBe(iterations);
        });

        it('generates codes with high entropy', () => {
            const code = generateShareCode();

            // Check that it's not all the same character
            const uniqueChars = new Set(code.split(''));
            expect(uniqueChars.size).toBeGreaterThan(1);
        });

        it('does not contain special characters that need URL encoding', () => {
            const code = generateShareCode();

            // These characters would need URL encoding
            const unsafeChars = /[+/=?&%#@!$^*()[\]{}|\\<>,;:'"` ]/;
            expect(unsafeChars.test(code)).toBe(false);
        });

        it('returns consistent length across multiple calls', () => {
            const lengths = [];
            for (let i = 0; i < 50; i++) {
                lengths.push(generateShareCode().length);
            }

            const allSameLength = lengths.every((len) => len === SHARED_GROUP_LIMITS.SHARE_CODE_LENGTH);
            expect(allSameLength).toBe(true);
        });

        it('is cryptographically random (statistical test)', () => {
            // Generate many codes and check character distribution
            const codes: string[] = [];
            for (let i = 0; i < 100; i++) {
                codes.push(generateShareCode());
            }

            // Concatenate all codes and count character frequency
            const allChars = codes.join('');
            const charCounts: Record<string, number> = {};

            for (const char of allChars) {
                charCounts[char] = (charCounts[char] || 0) + 1;
            }

            // With 100 codes of 16 chars = 1600 chars total
            // With ~64 possible characters (A-Za-z0-9_-), average should be ~25 per char
            // We just check that no single character dominates (which would indicate poor randomness)
            const maxCount = Math.max(...Object.values(charCounts));
            const avgCount = 1600 / Object.keys(charCounts).length;

            // No character should appear more than 3x the average
            expect(maxCount).toBeLessThan(avgCount * 3);
        });
    });

    // =========================================================================
    // isValidShareCode Tests
    // =========================================================================
    describe('isValidShareCode', () => {
        it('returns true for valid 16-character URL-safe code', () => {
            const code = generateShareCode();
            expect(isValidShareCode(code)).toBe(true);
        });

        it('returns true for manually created valid code', () => {
            expect(isValidShareCode('AbCdEfGhIjKlMnOp')).toBe(true);
            expect(isValidShareCode('0123456789abcdef')).toBe(true);
            expect(isValidShareCode('ABCDEFGHIJKLMNOP')).toBe(true);
            expect(isValidShareCode('a-b_c-d_e-f_g-h_')).toBe(true);
        });

        it('returns false for empty string', () => {
            expect(isValidShareCode('')).toBe(false);
        });

        it('returns false for null or undefined', () => {
            expect(isValidShareCode(null as unknown as string)).toBe(false);
            expect(isValidShareCode(undefined as unknown as string)).toBe(false);
        });

        it('returns false for code that is too short', () => {
            expect(isValidShareCode('abc')).toBe(false);
            expect(isValidShareCode('AbCdEfGhIjKlMnO')).toBe(false); // 15 chars
        });

        it('returns false for code that is too long', () => {
            expect(isValidShareCode('AbCdEfGhIjKlMnOpQ')).toBe(false); // 17 chars
            expect(isValidShareCode('AbCdEfGhIjKlMnOpQrStUvWx')).toBe(false);
        });

        it('returns false for code with invalid characters', () => {
            expect(isValidShareCode('AbCdEfGh!jKlMnOp')).toBe(false); // !
            expect(isValidShareCode('AbCdEfGh@jKlMnOp')).toBe(false); // @
            expect(isValidShareCode('AbCdEfGh#jKlMnOp')).toBe(false); // #
            expect(isValidShareCode('AbCdEfGh$jKlMnOp')).toBe(false); // $
            expect(isValidShareCode('AbCdEfGh jKlMnOp')).toBe(false); // space
            expect(isValidShareCode('AbCdEfGh+jKlMnOp')).toBe(false); // + (base64)
            expect(isValidShareCode('AbCdEfGh/jKlMnOp')).toBe(false); // / (base64)
            expect(isValidShareCode('AbCdEfGh=jKlMnOp')).toBe(false); // = (base64)
        });

        it('returns false for non-string types', () => {
            expect(isValidShareCode(12345678901234567890 as unknown as string)).toBe(false);
            expect(isValidShareCode({} as unknown as string)).toBe(false);
            expect(isValidShareCode([] as unknown as string)).toBe(false);
        });
    });
});
