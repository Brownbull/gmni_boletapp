/**
 * Validation Utils Tests
 *
 * Story 14d-v2-1-5a: Invitation Foundation (Types & Utils)
 *
 * Tests for email validation:
 * - validateEmail() - AC #3
 * - normalizeEmail() - Helper utility
 */

import { describe, it, expect } from 'vitest';
import { validateEmail, normalizeEmail, validateAppId } from '../../../src/utils/validationUtils';

describe('validationUtils', () => {
    // =========================================================================
    // validateEmail Tests (AC #3)
    // =========================================================================
    describe('validateEmail', () => {
        describe('valid email formats', () => {
            it('accepts standard email format (AC #3)', () => {
                expect(validateEmail('user@example.com')).toBe(true);
            });

            it('accepts email with subdomain', () => {
                expect(validateEmail('user@mail.example.com')).toBe(true);
                expect(validateEmail('user@sub.domain.example.com')).toBe(true);
            });

            it('accepts email with dots in local part', () => {
                expect(validateEmail('first.last@example.com')).toBe(true);
                expect(validateEmail('a.b.c@example.com')).toBe(true);
            });

            it('accepts email with plus sign in local part', () => {
                expect(validateEmail('user+tag@example.com')).toBe(true);
                expect(validateEmail('user+tag+subtag@example.com')).toBe(true);
            });

            it('accepts email with underscore in local part', () => {
                expect(validateEmail('user_name@example.com')).toBe(true);
            });

            it('accepts email with hyphen in local part', () => {
                expect(validateEmail('user-name@example.com')).toBe(true);
            });

            it('accepts email with numbers in local part', () => {
                expect(validateEmail('user123@example.com')).toBe(true);
                expect(validateEmail('123user@example.com')).toBe(true);
            });

            it('accepts email with hyphen in domain', () => {
                expect(validateEmail('user@my-domain.com')).toBe(true);
            });

            it('accepts email with numbers in domain', () => {
                expect(validateEmail('user@example123.com')).toBe(true);
            });

            it('accepts email with various TLDs', () => {
                expect(validateEmail('user@example.co')).toBe(true);
                expect(validateEmail('user@example.io')).toBe(true);
                expect(validateEmail('user@example.org')).toBe(true);
                expect(validateEmail('user@example.net')).toBe(true);
                expect(validateEmail('user@example.edu')).toBe(true);
                expect(validateEmail('user@example.gov')).toBe(true);
            });

            it('accepts email with long TLDs', () => {
                expect(validateEmail('user@example.technology')).toBe(true);
                expect(validateEmail('user@example.international')).toBe(true);
            });

            it('accepts email with country code TLDs', () => {
                expect(validateEmail('user@example.cl')).toBe(true);
                expect(validateEmail('user@example.uk')).toBe(true);
                expect(validateEmail('user@example.de')).toBe(true);
            });

            it('accepts email with mixed case', () => {
                expect(validateEmail('User@Example.COM')).toBe(true);
                expect(validateEmail('USER@EXAMPLE.COM')).toBe(true);
            });

            it('accepts email with leading/trailing whitespace (trimmed)', () => {
                expect(validateEmail('  user@example.com  ')).toBe(true);
                expect(validateEmail('\tuser@example.com\n')).toBe(true);
            });
        });

        describe('invalid email formats', () => {
            it('rejects empty string (AC #3)', () => {
                expect(validateEmail('')).toBe(false);
            });

            it('rejects null and undefined', () => {
                expect(validateEmail(null as unknown as string)).toBe(false);
                expect(validateEmail(undefined as unknown as string)).toBe(false);
            });

            it('rejects whitespace only', () => {
                expect(validateEmail('   ')).toBe(false);
                expect(validateEmail('\t\n')).toBe(false);
            });

            it('rejects email without @ symbol', () => {
                expect(validateEmail('userexample.com')).toBe(false);
                expect(validateEmail('user.example.com')).toBe(false);
            });

            it('rejects email without domain', () => {
                expect(validateEmail('user@')).toBe(false);
            });

            it('rejects email without local part', () => {
                expect(validateEmail('@example.com')).toBe(false);
            });

            it('rejects email without TLD', () => {
                expect(validateEmail('user@example')).toBe(false);
                expect(validateEmail('user@example.')).toBe(false);
            });

            it('rejects email with single-letter TLD', () => {
                expect(validateEmail('user@example.c')).toBe(false);
            });

            it('rejects email with multiple @ symbols', () => {
                expect(validateEmail('user@@example.com')).toBe(false);
                expect(validateEmail('user@domain@example.com')).toBe(false);
            });

            it('rejects email with spaces in middle', () => {
                expect(validateEmail('user name@example.com')).toBe(false);
                expect(validateEmail('user@exam ple.com')).toBe(false);
            });

            it('rejects email with special characters in local part', () => {
                expect(validateEmail('user!name@example.com')).toBe(false);
                expect(validateEmail('user#name@example.com')).toBe(false);
                expect(validateEmail('user$name@example.com')).toBe(false);
                expect(validateEmail('user&name@example.com')).toBe(false);
                expect(validateEmail('user*name@example.com')).toBe(false);
                expect(validateEmail("user'name@example.com")).toBe(false);
                expect(validateEmail('user"name@example.com')).toBe(false);
            });

            it('rejects email with special characters in domain', () => {
                expect(validateEmail('user@exam!ple.com')).toBe(false);
                expect(validateEmail('user@exam_ple.com')).toBe(false);
            });

            it('rejects plain text', () => {
                expect(validateEmail('not an email')).toBe(false);
                expect(validateEmail('hello world')).toBe(false);
            });

            it('rejects URLs', () => {
                expect(validateEmail('http://example.com')).toBe(false);
                expect(validateEmail('https://example.com')).toBe(false);
            });

            it('rejects non-string types', () => {
                expect(validateEmail(123 as unknown as string)).toBe(false);
                expect(validateEmail({} as unknown as string)).toBe(false);
                expect(validateEmail([] as unknown as string)).toBe(false);
                expect(validateEmail(true as unknown as string)).toBe(false);
            });
        });
    });

    // =========================================================================
    // normalizeEmail Tests
    // =========================================================================
    describe('normalizeEmail', () => {
        it('converts to lowercase', () => {
            expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
            expect(normalizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
        });

        it('trims whitespace', () => {
            expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
            expect(normalizeEmail('\tuser@example.com\n')).toBe('user@example.com');
        });

        it('handles already normalized email', () => {
            expect(normalizeEmail('user@example.com')).toBe('user@example.com');
        });

        it('returns empty string for invalid email', () => {
            expect(normalizeEmail('')).toBe('');
            expect(normalizeEmail('invalid')).toBe('');
            expect(normalizeEmail('no@domain')).toBe('');
        });

        it('returns empty string for null/undefined', () => {
            expect(normalizeEmail(null as unknown as string)).toBe('');
            expect(normalizeEmail(undefined as unknown as string)).toBe('');
        });

        it('normalizes email with subdomain', () => {
            expect(normalizeEmail('User@Mail.Example.COM')).toBe('user@mail.example.com');
        });

        it('preserves plus addressing after normalization', () => {
            expect(normalizeEmail('User+Tag@Example.COM')).toBe('user+tag@example.com');
        });
    });

    // =========================================================================
    // validateAppId Tests (Story 14d-v2-1-7b: ECC Security Review)
    // =========================================================================
    describe('validateAppId', () => {
        describe('valid app IDs', () => {
            it('returns true for "boletapp"', () => {
                expect(validateAppId('boletapp')).toBe(true);
            });
        });

        describe('invalid app IDs', () => {
            it('returns false for unknown app IDs', () => {
                expect(validateAppId('unknown')).toBe(false);
                expect(validateAppId('otherapp')).toBe(false);
                expect(validateAppId('myapp')).toBe(false);
            });

            it('returns false for path traversal attempts', () => {
                expect(validateAppId('../hack')).toBe(false);
                expect(validateAppId('../../etc/passwd')).toBe(false);
                expect(validateAppId('boletapp/../../')).toBe(false);
                expect(validateAppId('../boletapp')).toBe(false);
            });

            it('returns false for empty string', () => {
                expect(validateAppId('')).toBe(false);
            });

            it('returns false for null/undefined', () => {
                expect(validateAppId(null as unknown as string)).toBe(false);
                expect(validateAppId(undefined as unknown as string)).toBe(false);
            });

            it('returns false for non-string types', () => {
                expect(validateAppId(123 as unknown as string)).toBe(false);
                expect(validateAppId({} as unknown as string)).toBe(false);
                expect(validateAppId([] as unknown as string)).toBe(false);
                expect(validateAppId(true as unknown as string)).toBe(false);
            });

            it('returns false for case variations', () => {
                expect(validateAppId('Boletapp')).toBe(false);
                expect(validateAppId('BOLETAPP')).toBe(false);
                expect(validateAppId('BoletApp')).toBe(false);
            });

            it('returns false for whitespace-padded valid app ID', () => {
                expect(validateAppId(' boletapp')).toBe(false);
                expect(validateAppId('boletapp ')).toBe(false);
                expect(validateAppId(' boletapp ')).toBe(false);
            });
        });
    });
});
