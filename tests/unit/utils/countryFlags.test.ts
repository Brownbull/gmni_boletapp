/**
 * Unit tests for countryFlags utility
 *
 * Story 14.35b: Country flag emoji lookup utilities
 */

import { describe, it, expect } from 'vitest';
import {
    getCountryFlag,
    isoCodeToFlag,
    isKnownCountry,
    COUNTRY_TO_ISO,
    ISO_TO_COUNTRY,
} from '../../../src/utils/countryFlags';

describe('countryFlags', () => {
    describe('COUNTRY_TO_ISO mapping', () => {
        it('should have Chile mapped correctly', () => {
            expect(COUNTRY_TO_ISO['Chile']).toBe('CL');
        });

        it('should have United States mapped correctly', () => {
            expect(COUNTRY_TO_ISO['United States']).toBe('US');
        });

        it('should have all South American countries', () => {
            const southAmerica = [
                'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia',
                'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname',
                'Uruguay', 'Venezuela',
            ];
            southAmerica.forEach((country) => {
                expect(COUNTRY_TO_ISO[country]).toBeDefined();
            });
        });

        it('should have all European countries', () => {
            const europe = [
                'France', 'Germany', 'Italy', 'Spain', 'United Kingdom',
                'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
            ];
            europe.forEach((country) => {
                expect(COUNTRY_TO_ISO[country]).toBeDefined();
            });
        });
    });

    describe('ISO_TO_COUNTRY reverse mapping', () => {
        it('should reverse CL to Chile', () => {
            expect(ISO_TO_COUNTRY['CL']).toBe('Chile');
        });

        it('should reverse US to United States', () => {
            expect(ISO_TO_COUNTRY['US']).toBe('United States');
        });

        it('should have same number of entries as COUNTRY_TO_ISO', () => {
            expect(Object.keys(ISO_TO_COUNTRY).length).toBe(
                Object.keys(COUNTRY_TO_ISO).length
            );
        });
    });

    describe('isoCodeToFlag', () => {
        it('should convert CL to Chilean flag emoji', () => {
            expect(isoCodeToFlag('CL')).toBe('🇨🇱');
        });

        it('should convert US to US flag emoji', () => {
            expect(isoCodeToFlag('US')).toBe('🇺🇸');
        });

        it('should convert AR to Argentine flag emoji', () => {
            expect(isoCodeToFlag('AR')).toBe('🇦🇷');
        });

        it('should convert GB to UK flag emoji', () => {
            expect(isoCodeToFlag('GB')).toBe('🇬🇧');
        });

        it('should convert JP to Japan flag emoji', () => {
            expect(isoCodeToFlag('JP')).toBe('🇯🇵');
        });

        it('should handle lowercase codes', () => {
            expect(isoCodeToFlag('cl')).toBe('🇨🇱');
            expect(isoCodeToFlag('us')).toBe('🇺🇸');
        });

        it('should return white flag for invalid code length', () => {
            expect(isoCodeToFlag('')).toBe('🏳️');
            expect(isoCodeToFlag('A')).toBe('🏳️');
            expect(isoCodeToFlag('ABC')).toBe('🏳️');
        });

        it('should return white flag for non-letter characters', () => {
            expect(isoCodeToFlag('12')).toBe('🏳️');
            expect(isoCodeToFlag('A1')).toBe('🏳️');
            expect(isoCodeToFlag('!@')).toBe('🏳️');
        });
    });

    describe('getCountryFlag', () => {
        describe('with country names', () => {
            it('should return flag for Chile', () => {
                expect(getCountryFlag('Chile')).toBe('🇨🇱');
            });

            it('should return flag for United States', () => {
                expect(getCountryFlag('United States')).toBe('🇺🇸');
            });

            it('should return flag for Germany', () => {
                expect(getCountryFlag('Germany')).toBe('🇩🇪');
            });

            it('should return flag for Japan', () => {
                expect(getCountryFlag('Japan')).toBe('🇯🇵');
            });

            it('should return flag for Australia', () => {
                expect(getCountryFlag('Australia')).toBe('🇦🇺');
            });
        });

        describe('with ISO codes', () => {
            it('should return flag for CL', () => {
                expect(getCountryFlag('CL')).toBe('🇨🇱');
            });

            it('should return flag for US', () => {
                expect(getCountryFlag('US')).toBe('🇺🇸');
            });

            it('should return flag for lowercase iso codes', () => {
                expect(getCountryFlag('cl')).toBe('🇨🇱');
            });
        });

        describe('case insensitivity', () => {
            it('should handle lowercase country names', () => {
                expect(getCountryFlag('chile')).toBe('🇨🇱');
                expect(getCountryFlag('united states')).toBe('🇺🇸');
            });

            it('should handle uppercase country names', () => {
                expect(getCountryFlag('CHILE')).toBe('🇨🇱');
                expect(getCountryFlag('JAPAN')).toBe('🇯🇵');
            });

            it('should handle mixed case', () => {
                expect(getCountryFlag('ChIlE')).toBe('🇨🇱');
                expect(getCountryFlag('UnItEd StAtEs')).toBe('🇺🇸');
            });
        });

        describe('whitespace handling', () => {
            it('should trim leading/trailing whitespace', () => {
                expect(getCountryFlag('  Chile  ')).toBe('🇨🇱');
                expect(getCountryFlag('\tUnited States\n')).toBe('🇺🇸');
            });
        });

        describe('fallback behavior', () => {
            it('should return white flag for null', () => {
                expect(getCountryFlag(null)).toBe('🏳️');
            });

            it('should return white flag for undefined', () => {
                expect(getCountryFlag(undefined)).toBe('🏳️');
            });

            it('should return white flag for empty string', () => {
                expect(getCountryFlag('')).toBe('🏳️');
            });

            it('should return white flag for whitespace-only string', () => {
                expect(getCountryFlag('   ')).toBe('🏳️');
            });

            it('should return white flag for unknown country', () => {
                expect(getCountryFlag('Atlantis')).toBe('🏳️');
                expect(getCountryFlag('Narnia')).toBe('🏳️');
                expect(getCountryFlag('XYZ')).toBe('🏳️');
            });

            it('should return white flag for unknown ISO code', () => {
                expect(getCountryFlag('XX')).toBe('🏳️');
                expect(getCountryFlag('ZZ')).toBe('🏳️');
            });
        });
    });

    describe('isKnownCountry', () => {
        describe('known countries', () => {
            it('should return true for Chile', () => {
                expect(isKnownCountry('Chile')).toBe(true);
            });

            it('should return true for United States', () => {
                expect(isKnownCountry('United States')).toBe(true);
            });

            it('should return true for ISO codes', () => {
                expect(isKnownCountry('CL')).toBe(true);
                expect(isKnownCountry('US')).toBe(true);
            });

            it('should be case insensitive', () => {
                expect(isKnownCountry('chile')).toBe(true);
                expect(isKnownCountry('CHILE')).toBe(true);
                expect(isKnownCountry('cl')).toBe(true);
            });
        });

        describe('unknown countries', () => {
            it('should return false for null', () => {
                expect(isKnownCountry(null)).toBe(false);
            });

            it('should return false for undefined', () => {
                expect(isKnownCountry(undefined)).toBe(false);
            });

            it('should return false for empty string', () => {
                expect(isKnownCountry('')).toBe(false);
            });

            it('should return false for unknown country', () => {
                expect(isKnownCountry('Atlantis')).toBe(false);
            });

            it('should return false for unknown ISO code', () => {
                expect(isKnownCountry('XX')).toBe(false);
            });
        });
    });

    describe('complete coverage for all mapped countries', () => {
        it('should return valid flags for all mapped countries', () => {
            Object.keys(COUNTRY_TO_ISO).forEach((country) => {
                const flag = getCountryFlag(country);
                // Flag should not be the fallback white flag
                expect(flag).not.toBe('🏳️');
                // Flag should be a 2-character emoji sequence (regional indicators)
                // Each regional indicator is represented by 2 code units in JavaScript
                expect(flag.length).toBe(4);
            });
        });
    });
});
