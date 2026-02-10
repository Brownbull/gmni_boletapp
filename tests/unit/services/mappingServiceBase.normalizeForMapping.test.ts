/**
 * normalizeForMapping Tests
 *
 * Story 15-TD-3: Tests for the shared normalization function.
 */

import { describe, it, expect } from 'vitest';
import { normalizeForMapping } from '../../../src/services/mappingServiceBase';

describe('normalizeForMapping', () => {
    it('lowercases input', () => {
        expect(normalizeForMapping('HELLO')).toBe('hello');
    });

    it('trims whitespace', () => {
        expect(normalizeForMapping('  hello  ')).toBe('hello');
    });

    it('removes special characters', () => {
        expect(normalizeForMapping('hello-world!')).toBe('helloworld');
    });

    it('collapses multiple spaces', () => {
        expect(normalizeForMapping('hello   world')).toBe('hello world');
    });

    it('preserves alphanumeric and single spaces', () => {
        expect(normalizeForMapping('Item 123')).toBe('item 123');
    });

    it('handles empty string', () => {
        expect(normalizeForMapping('')).toBe('');
    });

    it('handles string with only special characters', () => {
        expect(normalizeForMapping('!@#$%')).toBe('');
    });

    it('normalizes mixed input', () => {
        expect(normalizeForMapping('  Café  Latte!! ')).toBe('caf latte');
    });

    it('strips accented characters because they fall outside [a-z0-9]', () => {
        // normalizeForMapping does NOT use NFD normalization (unlike normalizeMerchantNameForTrust).
        // Accented chars like 'é' don't match [a-z0-9\s], so the regex removes them entirely.
        // This means 'résumé' becomes 'rsum', not 'resume'.
        const result = normalizeForMapping('résumé');
        expect(result).toBe('rsum');
    });
});
