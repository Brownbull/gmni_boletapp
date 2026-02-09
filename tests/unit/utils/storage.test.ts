/**
 * Tests for storage utilities
 *
 * Story 15-2f: Typed localStorage wrapper
 *
 * Test coverage:
 * - getStorageString / setStorageString
 * - getStorageJSON / setStorageJSON
 * - removeStorageItem
 * - hasStorageItem
 * - Error handling (SSR/test safety)
 * - QuotaExceededError handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    getStorageString,
    setStorageString,
    getStorageJSON,
    setStorageJSON,
    removeStorageItem,
    hasStorageItem,
} from '../../../src/utils/storage';

describe('storage utilities', () => {
    let mockStorage: Record<string, string>;

    function stubWorkingStorage() {
        mockStorage = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => mockStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => {
                mockStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStorage[key];
            }),
            clear: vi.fn(() => {
                mockStorage = {};
            }),
            length: 0,
            key: vi.fn(() => null),
        });
    }

    function stubBrokenStorage(method: 'getItem' | 'setItem' | 'removeItem') {
        const working = {
            getItem: vi.fn((key: string) => mockStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
            removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(() => null),
        };
        working[method] = vi.fn(() => { throw new Error('localStorage disabled'); });
        vi.stubGlobal('localStorage', working);
    }

    beforeEach(() => {
        stubWorkingStorage();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    // =========================================================================
    // getStorageString
    // =========================================================================

    describe('getStorageString', () => {
        it('should return stored string value', () => {
            mockStorage['test-key'] = 'hello';
            expect(getStorageString('test-key', 'default')).toBe('hello');
        });

        it('should return fallback when key does not exist', () => {
            expect(getStorageString('missing-key', 'fallback')).toBe('fallback');
        });

        it('should return empty string if stored value is empty string', () => {
            mockStorage['empty'] = '';
            expect(getStorageString('empty', 'fallback')).toBe('');
        });

        it('should return fallback on localStorage error', () => {
            stubBrokenStorage('getItem');
            expect(getStorageString('key', 'safe')).toBe('safe');
        });
    });

    // =========================================================================
    // setStorageString
    // =========================================================================

    describe('setStorageString', () => {
        it('should store a string value', () => {
            setStorageString('key', 'value');
            expect(mockStorage['key']).toBe('value');
        });

        it('should overwrite existing value', () => {
            mockStorage['key'] = 'old';
            setStorageString('key', 'new');
            expect(mockStorage['key']).toBe('new');
        });

        it('should silently fail on localStorage error', () => {
            stubBrokenStorage('setItem');
            expect(() => setStorageString('key', 'value')).not.toThrow();
        });
    });

    // =========================================================================
    // getStorageJSON
    // =========================================================================

    describe('getStorageJSON', () => {
        it('should return parsed JSON object', () => {
            mockStorage['obj'] = JSON.stringify({ a: 1, b: 'two' });
            expect(getStorageJSON('obj', {})).toEqual({ a: 1, b: 'two' });
        });

        it('should return parsed JSON array', () => {
            mockStorage['arr'] = JSON.stringify([1, 2, 3]);
            expect(getStorageJSON('arr', [])).toEqual([1, 2, 3]);
        });

        it('should return fallback when key does not exist', () => {
            expect(getStorageJSON('missing', { default: true })).toEqual({ default: true });
        });

        it('should return fallback on invalid JSON', () => {
            mockStorage['bad'] = 'not-json{';
            expect(getStorageJSON('bad', 'fallback')).toBe('fallback');
        });

        it('should return fallback on localStorage error', () => {
            stubBrokenStorage('getItem');
            expect(getStorageJSON('key', [])).toEqual([]);
        });
    });

    // =========================================================================
    // setStorageJSON
    // =========================================================================

    describe('setStorageJSON', () => {
        it('should store JSON-serialized object', () => {
            setStorageJSON('obj', { x: 42 });
            expect(mockStorage['obj']).toBe('{"x":42}');
        });

        it('should store JSON-serialized array', () => {
            setStorageJSON('arr', [1, 'two', true]);
            expect(mockStorage['arr']).toBe('[1,"two",true]');
        });

        it('should store JSON null', () => {
            setStorageJSON('nil', null);
            expect(mockStorage['nil']).toBe('null');
        });

        it('should silently fail on localStorage error', () => {
            stubBrokenStorage('setItem');
            expect(() => setStorageJSON('key', { data: true })).not.toThrow();
        });
    });

    // =========================================================================
    // removeStorageItem
    // =========================================================================

    describe('removeStorageItem', () => {
        it('should remove an existing key', () => {
            mockStorage['to-remove'] = 'value';
            removeStorageItem('to-remove');
            expect(mockStorage['to-remove']).toBeUndefined();
        });

        it('should not throw for non-existent key', () => {
            expect(() => removeStorageItem('does-not-exist')).not.toThrow();
        });

        it('should silently fail on localStorage error', () => {
            stubBrokenStorage('removeItem');
            expect(() => removeStorageItem('key')).not.toThrow();
        });
    });

    // =========================================================================
    // hasStorageItem
    // =========================================================================

    describe('hasStorageItem', () => {
        it('should return true when key exists', () => {
            mockStorage['exists'] = 'yes';
            expect(hasStorageItem('exists')).toBe(true);
        });

        it('should return true for key with empty string value', () => {
            mockStorage['empty'] = '';
            expect(hasStorageItem('empty')).toBe(true);
        });

        it('should return false when key does not exist', () => {
            expect(hasStorageItem('nope')).toBe(false);
        });

        it('should return false on localStorage error', () => {
            stubBrokenStorage('getItem');
            expect(hasStorageItem('key')).toBe(false);
        });
    });
});
