/**
 * Validation & Parsing Utils Tests
 *
 * Story 15-1g: Consolidated from validationUtils.test.ts
 * Tests for validateCSSColor, safeCSSColor.
 * (validateAppId removed in 15-TD-18: dead code, replaced by assertValidAppId in firestorePaths.ts)
 * (validateEmail, normalizeEmail, validateGroupId removed with shared groups)
 */

import { describe, it, expect } from 'vitest';
import { validateCSSColor, safeCSSColor } from '../../../src/utils/validation';

// =========================================================================
// validateCSSColor Tests (TD-CONSOLIDATED-7: CSS Color Injection Prevention)
// =========================================================================
describe('validateCSSColor', () => {
    describe('valid hex colors', () => {
        it('accepts 6-digit hex colors (lowercase)', () => {
            expect(validateCSSColor('#10b981')).toBe(true);
            expect(validateCSSColor('#abcdef')).toBe(true);
            expect(validateCSSColor('#000000')).toBe(true);
            expect(validateCSSColor('#ffffff')).toBe(true);
        });

        it('accepts 6-digit hex colors (uppercase)', () => {
            expect(validateCSSColor('#ABCDEF')).toBe(true);
            expect(validateCSSColor('#10B981')).toBe(true);
            expect(validateCSSColor('#FF0000')).toBe(true);
        });

        it('accepts 3-digit hex colors', () => {
            expect(validateCSSColor('#abc')).toBe(true);
            expect(validateCSSColor('#ABC')).toBe(true);
            expect(validateCSSColor('#123')).toBe(true);
            expect(validateCSSColor('#fff')).toBe(true);
            expect(validateCSSColor('#000')).toBe(true);
        });
    });

    describe('invalid - empty/null/undefined', () => {
        it('rejects empty string', () => {
            expect(validateCSSColor('')).toBe(false);
        });

        it('rejects null and undefined', () => {
            expect(validateCSSColor(null as unknown as string)).toBe(false);
            expect(validateCSSColor(undefined as unknown as string)).toBe(false);
        });
    });

    describe('invalid - CSS injection attempts', () => {
        it('rejects CSS property injection via semicolon', () => {
            expect(validateCSSColor('red; position: fixed')).toBe(false);
        });

        it('rejects url() function', () => {
            expect(validateCSSColor('url(evil.css)')).toBe(false);
        });

        it('rejects var() function', () => {
            expect(validateCSSColor('var(--evil)')).toBe(false);
        });

        it('rejects rgba/rgb/hsl functions', () => {
            expect(validateCSSColor('rgba(255,0,0,1)')).toBe(false);
            expect(validateCSSColor('rgb(255,0,0)')).toBe(false);
            expect(validateCSSColor('hsl(0,100%,50%)')).toBe(false);
        });
    });

    describe('invalid - near-miss formats', () => {
        it('rejects hex without # prefix', () => {
            expect(validateCSSColor('10b981')).toBe(false);
        });

        it('rejects 4-digit and 5-digit hex', () => {
            expect(validateCSSColor('#abcd')).toBe(false);
            expect(validateCSSColor('#abcde')).toBe(false);
        });

        it('rejects 8-digit hex (with alpha)', () => {
            expect(validateCSSColor('#abcdef12')).toBe(false);
        });

        it('rejects named CSS colors', () => {
            expect(validateCSSColor('red')).toBe(false);
            expect(validateCSSColor('transparent')).toBe(false);
        });
    });
});

// =========================================================================
// safeCSSColor Tests (TD-CONSOLIDATED-7: CSS Color Injection Prevention)
// =========================================================================
describe('safeCSSColor', () => {
    it('returns valid hex color unchanged', () => {
        expect(safeCSSColor('#10b981')).toBe('#10b981');
        expect(safeCSSColor('#abc')).toBe('#abc');
        expect(safeCSSColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('returns default fallback for invalid input', () => {
        expect(safeCSSColor('red; position: fixed')).toBe('#10b981');
        expect(safeCSSColor('url(evil.css)')).toBe('#10b981');
        expect(safeCSSColor('not-a-color')).toBe('#10b981');
    });

    it('returns default fallback for empty/null/undefined', () => {
        expect(safeCSSColor('')).toBe('#10b981');
        expect(safeCSSColor(null)).toBe('#10b981');
        expect(safeCSSColor(undefined)).toBe('#10b981');
    });

    it('returns custom fallback when provided', () => {
        expect(safeCSSColor('invalid', 'var(--primary, #2563eb)')).toBe('var(--primary, #2563eb)');
        expect(safeCSSColor('', '#ff0000')).toBe('#ff0000');
    });

    it('ignores custom fallback when color is valid', () => {
        expect(safeCSSColor('#abcdef', '#000')).toBe('#abcdef');
    });
});
