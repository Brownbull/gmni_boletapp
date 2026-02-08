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
import { validateEmail, normalizeEmail, validateAppId, validateGroupId, validateCSSColor, safeCSSColor } from '../../../src/utils/validationUtils';

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

    // =========================================================================
    // validateGroupId Tests (TD-CONSOLIDATED-6: GroupId Validation)
    // =========================================================================
    describe('validateGroupId', () => {
        describe('valid groupIds', () => {
            it('accepts standard alphanumeric IDs', () => {
                expect(() => validateGroupId('abc123')).not.toThrow();
                expect(() => validateGroupId('GroupABC123')).not.toThrow();
            });

            it('accepts IDs with hyphens', () => {
                expect(() => validateGroupId('group-abc-123')).not.toThrow();
            });

            it('accepts IDs with underscores', () => {
                expect(() => validateGroupId('group_abc_123')).not.toThrow();
            });

            it('accepts Firestore auto-generated IDs (20-char alphanumeric)', () => {
                expect(() => validateGroupId('AbCdEf1234567890AbCd')).not.toThrow();
            });

            it('accepts single character (boundary)', () => {
                expect(() => validateGroupId('a')).not.toThrow();
            });

            it('accepts 128 characters (max boundary)', () => {
                expect(() => validateGroupId('a'.repeat(128))).not.toThrow();
            });

            it('accepts mixed case', () => {
                expect(() => validateGroupId('GroupABC123')).not.toThrow();
                expect(() => validateGroupId('ALLCAPS')).not.toThrow();
                expect(() => validateGroupId('alllower')).not.toThrow();
            });
        });

        describe('invalid groupIds - path injection prevention', () => {
            it('rejects forward slash (path traversal)', () => {
                expect(() => validateGroupId('group/hack')).toThrow('Invalid groupId');
                expect(() => validateGroupId('../hack')).toThrow('Invalid groupId');
                expect(() => validateGroupId('a/b/c')).toThrow('Invalid groupId');
            });

            it('rejects dot (field path injection)', () => {
                expect(() => validateGroupId('group.subpath')).toThrow('Invalid groupId');
                expect(() => validateGroupId('a.b.c')).toThrow('Invalid groupId');
            });

            it('rejects backtick', () => {
                expect(() => validateGroupId('group`test')).toThrow('Invalid groupId');
            });

            it('rejects square brackets', () => {
                expect(() => validateGroupId('group[0]')).toThrow('Invalid groupId');
            });

            it('rejects asterisk', () => {
                expect(() => validateGroupId('group*')).toThrow('Invalid groupId');
            });

            it('rejects backslash', () => {
                expect(() => validateGroupId('group\\hack')).toThrow('Invalid groupId');
            });
        });

        describe('invalid groupIds - format violations', () => {
            it('rejects empty string', () => {
                expect(() => validateGroupId('')).toThrow('Invalid groupId');
            });

            it('rejects null and undefined', () => {
                expect(() => validateGroupId(null as unknown as string)).toThrow('Invalid groupId');
                expect(() => validateGroupId(undefined as unknown as string)).toThrow('Invalid groupId');
            });

            it('rejects non-string types', () => {
                expect(() => validateGroupId(123 as unknown as string)).toThrow('Invalid groupId');
                expect(() => validateGroupId({} as unknown as string)).toThrow('Invalid groupId');
                expect(() => validateGroupId([] as unknown as string)).toThrow('Invalid groupId');
                expect(() => validateGroupId(true as unknown as string)).toThrow('Invalid groupId');
            });

            it('rejects spaces', () => {
                expect(() => validateGroupId('group id')).toThrow('Invalid groupId');
                expect(() => validateGroupId('   ')).toThrow('Invalid groupId');
            });

            it('rejects special characters', () => {
                expect(() => validateGroupId('group@id')).toThrow('Invalid groupId');
                expect(() => validateGroupId('group#id')).toThrow('Invalid groupId');
                expect(() => validateGroupId('group$id')).toThrow('Invalid groupId');
                expect(() => validateGroupId('group!id')).toThrow('Invalid groupId');
            });

            it('rejects IDs exceeding 128 characters', () => {
                expect(() => validateGroupId('a'.repeat(129))).toThrow('Invalid groupId');
                expect(() => validateGroupId('a'.repeat(256))).toThrow('Invalid groupId');
            });
        });

        describe('error message', () => {
            it('includes descriptive format requirements', () => {
                expect(() => validateGroupId('')).toThrow(
                    'must be 1-128 characters containing only letters, numbers, hyphens, or underscores'
                );
            });
        });
    });

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

            it('accepts 6-digit hex colors (mixed case)', () => {
                expect(validateCSSColor('#aAbBcC')).toBe(true);
                expect(validateCSSColor('#10B981')).toBe(true);
            });

            it('accepts 3-digit hex colors', () => {
                expect(validateCSSColor('#abc')).toBe(true);
                expect(validateCSSColor('#ABC')).toBe(true);
                expect(validateCSSColor('#123')).toBe(true);
                expect(validateCSSColor('#fff')).toBe(true);
                expect(validateCSSColor('#000')).toBe(true);
            });

            it('accepts all GROUP_COLORS from allowlist', () => {
                const GROUP_COLORS = [
                    '#10b981', '#22c55e', '#84cc16', '#14b8a6',
                    '#3b82f6', '#0ea5e9', '#06b6d4', '#6366f1',
                    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
                    '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
                    '#eab308', '#78716c', '#64748b', '#71717a',
                ];
                for (const color of GROUP_COLORS) {
                    expect(validateCSSColor(color)).toBe(true);
                }
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

            it('rejects non-string types', () => {
                expect(validateCSSColor(123 as unknown as string)).toBe(false);
                expect(validateCSSColor({} as unknown as string)).toBe(false);
                expect(validateCSSColor([] as unknown as string)).toBe(false);
                expect(validateCSSColor(true as unknown as string)).toBe(false);
            });
        });

        describe('invalid - CSS injection attempts', () => {
            it('rejects CSS property injection via semicolon', () => {
                expect(validateCSSColor('red; position: fixed')).toBe(false);
                expect(validateCSSColor('#fff; z-index: 9999')).toBe(false);
            });

            it('rejects url() function', () => {
                expect(validateCSSColor('url(evil.css)')).toBe(false);
                expect(validateCSSColor('url(https://evil.com/track)')).toBe(false);
            });

            it('rejects expression() function (IE legacy)', () => {
                expect(validateCSSColor('expression(alert(1))')).toBe(false);
            });

            it('rejects var() function', () => {
                expect(validateCSSColor('var(--evil)')).toBe(false);
                expect(validateCSSColor('var(--primary, #2563eb)')).toBe(false);
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
                expect(validateCSSColor('abcdef')).toBe(false);
            });

            it('rejects 4-digit hex', () => {
                expect(validateCSSColor('#abcd')).toBe(false);
            });

            it('rejects 5-digit hex', () => {
                expect(validateCSSColor('#abcde')).toBe(false);
            });

            it('rejects 8-digit hex (with alpha)', () => {
                expect(validateCSSColor('#abcdef12')).toBe(false);
            });

            it('rejects hex with spaces', () => {
                expect(validateCSSColor('# abcdef')).toBe(false);
                expect(validateCSSColor('#abc def')).toBe(false);
                expect(validateCSSColor(' #abcdef')).toBe(false);
            });

            it('rejects hex with invalid characters', () => {
                expect(validateCSSColor('#abcghi')).toBe(false);
                expect(validateCSSColor('#xyz123')).toBe(false);
            });
        });

        describe('invalid - named CSS colors', () => {
            it('rejects named colors (not in allowlist)', () => {
                expect(validateCSSColor('red')).toBe(false);
                expect(validateCSSColor('blue')).toBe(false);
                expect(validateCSSColor('green')).toBe(false);
                expect(validateCSSColor('transparent')).toBe(false);
                expect(validateCSSColor('inherit')).toBe(false);
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

        it('returns default fallback for empty string', () => {
            expect(safeCSSColor('')).toBe('#10b981');
        });

        it('returns default fallback for null/undefined', () => {
            expect(safeCSSColor(null)).toBe('#10b981');
            expect(safeCSSColor(undefined)).toBe('#10b981');
        });

        it('returns custom fallback when provided', () => {
            expect(safeCSSColor('invalid', 'var(--primary, #2563eb)')).toBe('var(--primary, #2563eb)');
            expect(safeCSSColor('', '#ff0000')).toBe('#ff0000');
            expect(safeCSSColor(null, '#333')).toBe('#333');
        });

        it('ignores custom fallback when color is valid', () => {
            expect(safeCSSColor('#abcdef', '#000')).toBe('#abcdef');
        });

        it('handles all GROUP_COLORS correctly', () => {
            const GROUP_COLORS = [
                '#10b981', '#22c55e', '#84cc16', '#14b8a6',
                '#3b82f6', '#0ea5e9', '#06b6d4', '#6366f1',
                '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
                '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
                '#eab308', '#78716c', '#64748b', '#71717a',
            ];
            for (const color of GROUP_COLORS) {
                expect(safeCSSColor(color)).toBe(color);
            }
        });
    });
});
