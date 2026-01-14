/**
 * Unit tests for useIsForeignLocation hook
 *
 * Story 14.35b: Foreign location detection for transaction display
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsForeignLocation } from '../../../src/hooks/useIsForeignLocation';

describe('useIsForeignLocation', () => {
    describe('foreign location detection', () => {
        it('should detect foreign location when countries differ', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('United States', 'Chile')
            );

            expect(result.current.isForeign).toBe(true);
            expect(result.current.flagEmoji).toBe('🇺🇸');
        });

        it('should not flag as foreign when countries match', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('Chile', 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
            expect(result.current.flagEmoji).toBe('🇨🇱');
        });

        it('should handle case-insensitive comparison', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('CHILE', 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
        });

        it('should handle countries with whitespace', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('  Chile  ', 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
        });
    });

    describe('user with no default country configured (AC 2)', () => {
        it('should treat all as local when user country is empty string', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('United States', '')
            );

            expect(result.current.isForeign).toBe(false);
            expect(result.current.flagEmoji).toBe('🇺🇸');
        });

        it('should treat all as local when user country is null', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('United States', null)
            );

            expect(result.current.isForeign).toBe(false);
        });

        it('should treat all as local when user country is undefined', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('United States', undefined)
            );

            expect(result.current.isForeign).toBe(false);
        });

        it('should treat all as local when user country is whitespace only', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('United States', '   ')
            );

            expect(result.current.isForeign).toBe(false);
        });
    });

    describe('transaction with no country', () => {
        it('should not flag as foreign when transaction country is empty', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('', 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
            expect(result.current.flagEmoji).toBe('🏳️');
        });

        it('should not flag as foreign when transaction country is null', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation(null, 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
            expect(result.current.flagEmoji).toBe('🏳️');
        });

        it('should not flag as foreign when transaction country is undefined', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation(undefined, 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
            expect(result.current.flagEmoji).toBe('🏳️');
        });
    });

    describe('flag emoji generation', () => {
        it('should return correct flag for known countries', () => {
            const testCases: Array<[string, string]> = [
                ['Chile', '🇨🇱'],
                ['United States', '🇺🇸'],
                ['Argentina', '🇦🇷'],
                ['Brazil', '🇧🇷'],
                ['Japan', '🇯🇵'],
                ['Germany', '🇩🇪'],
                ['United Kingdom', '🇬🇧'],
            ];

            testCases.forEach(([country, expectedFlag]) => {
                const { result } = renderHook(() =>
                    useIsForeignLocation(country, 'France')
                );
                expect(result.current.flagEmoji).toBe(expectedFlag);
            });
        });

        it('should return white flag for unknown countries', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('Atlantis', 'Chile')
            );

            expect(result.current.flagEmoji).toBe('🏳️');
        });
    });

    describe('various real-world scenarios', () => {
        it('should handle user in Chile with US transaction', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('United States', 'Chile')
            );

            expect(result.current.isForeign).toBe(true);
            expect(result.current.flagEmoji).toBe('🇺🇸');
        });

        it('should handle user in Chile with local transaction', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('Chile', 'Chile')
            );

            expect(result.current.isForeign).toBe(false);
            expect(result.current.flagEmoji).toBe('🇨🇱');
        });

        it('should handle user in US with European transaction', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('France', 'United States')
            );

            expect(result.current.isForeign).toBe(true);
            expect(result.current.flagEmoji).toBe('🇫🇷');
        });

        it('should handle neighboring countries (Chile/Argentina)', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('Argentina', 'Chile')
            );

            expect(result.current.isForeign).toBe(true);
            expect(result.current.flagEmoji).toBe('🇦🇷');
        });
    });

    describe('countryCode return value', () => {
        it('should return correct ISO code for known countries', () => {
            const testCases: Array<[string, string]> = [
                ['Chile', 'CL'],
                ['United States', 'US'],
                ['Argentina', 'AR'],
                ['Brazil', 'BR'],
                ['Japan', 'JP'],
                ['Germany', 'DE'],
                ['United Kingdom', 'GB'],
                ['France', 'FR'],
            ];

            testCases.forEach(([country, expectedCode]) => {
                const { result } = renderHook(() =>
                    useIsForeignLocation(country, 'Chile')
                );
                expect(result.current.countryCode).toBe(expectedCode);
            });
        });

        it('should return empty string for unknown country', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('Atlantis', 'Chile')
            );

            expect(result.current.countryCode).toBe('');
        });

        it('should return empty string for null country', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation(null, 'Chile')
            );

            expect(result.current.countryCode).toBe('');
        });

        it('should return empty string for empty country', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('', 'Chile')
            );

            expect(result.current.countryCode).toBe('');
        });

        it('should handle ISO code input', () => {
            const { result } = renderHook(() =>
                useIsForeignLocation('US', 'Chile')
            );

            expect(result.current.countryCode).toBe('US');
            expect(result.current.isForeign).toBe(true);
        });
    });

    describe('memoization', () => {
        it('should return stable reference when inputs unchanged', () => {
            const { result, rerender } = renderHook(
                ({ txCountry, userCountry }) =>
                    useIsForeignLocation(txCountry, userCountry),
                { initialProps: { txCountry: 'Chile', userCountry: 'Chile' } }
            );

            const firstResult = result.current;

            // Rerender with same values
            rerender({ txCountry: 'Chile', userCountry: 'Chile' });

            // Result object should be the same due to useMemo
            expect(result.current).toBe(firstResult);
        });

        it('should return new reference when inputs change', () => {
            const { result, rerender } = renderHook(
                ({ txCountry, userCountry }) =>
                    useIsForeignLocation(txCountry, userCountry),
                { initialProps: { txCountry: 'Chile', userCountry: 'Chile' } }
            );

            const firstResult = result.current;

            // Rerender with different values
            rerender({ txCountry: 'United States', userCountry: 'Chile' });

            // Result object should be different
            expect(result.current).not.toBe(firstResult);
            expect(result.current.isForeign).toBe(true);
        });
    });
});
