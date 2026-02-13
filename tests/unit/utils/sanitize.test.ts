/**
 * sanitize.ts Tests
 *
 * Story 15-TD-8: Input Validation Hardening — data: URI pattern tightening.
 * Story 15-TD-19: Sanitizer Defense-in-Depth Hardening — multi-pass, URL-decode, pre-truncation.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../../../src/utils/sanitize';

describe('sanitizeInput', () => {
    describe('data: URI pattern (15-TD-8, source: TD-23)', () => {
        it('strips data:text/html URIs', () => {
            const result = sanitizeInput('data:text/html,payload');
            expect(result).not.toContain('data:text/html');
        });

        it('strips data:text/html with script payload', () => {
            const result = sanitizeInput('data:text/html,<script>alert(1)</script>');
            expect(result).not.toContain('data:text/html');
            expect(result).not.toContain('<script>');
        });

        it('strips data:application/javascript URIs', () => {
            const result = sanitizeInput('prefix data:application/javascript suffix');
            expect(result).not.toContain('data:application/javascript');
            expect(result).toContain('prefix');
            expect(result).toContain('suffix');
        });

        it('strips data:image/png URIs', () => {
            const result = sanitizeInput('data:image/png;base64,abc123');
            expect(result).not.toContain('data:image/png');
        });

        it('strips data:application/json;base64 URIs', () => {
            const result = sanitizeInput('data:application/json;base64,eyJ0ZXN0Ijp0cnVlfQ==');
            expect(result).not.toContain('data:application/json');
        });

        it('strips data: with whitespace before MIME type', () => {
            const result = sanitizeInput('data: text/html,payload');
            expect(result).not.toContain('data:');
            expect(result).not.toContain('text/html');
        });

        it('strips data:;base64 URIs (MIME-less, base64 encoded)', () => {
            const result = sanitizeInput('data:;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==');
            expect(result).not.toContain('data:;base64');
        });

        it('strips data:,payload (MIME-less comma-separated)', () => {
            const result = sanitizeInput('data:,<script>alert(1)</script>');
            expect(result).not.toContain('data:,');
        });

        it('strips DATA:TEXT/HTML (uppercase)', () => {
            const result = sanitizeInput('DATA:TEXT/HTML,payload');
            expect(result).not.toContain('DATA:TEXT/HTML');
        });

        it('strips DaTa:text/html (mixed case)', () => {
            const result = sanitizeInput('DaTa:text/html,payload');
            expect(result).not.toContain('DaTa:text/html');
        });

        it('strips data: with tab before MIME type', () => {
            const result = sanitizeInput('data:\ttext/html,payload');
            expect(result).not.toContain('data:');
        });

        it('strips bare data:; (semicolon only)', () => {
            const result = sanitizeInput('data:;something');
            expect(result).not.toContain('data:;');
        });

        it('preserves "Big Data: Solutions"', () => {
            expect(sanitizeInput('Big Data: Solutions')).toBe('Big Data: Solutions');
        });

        it('preserves "Updated data: 2026"', () => {
            expect(sanitizeInput('Updated data: 2026')).toBe('Updated data: 2026');
        });

        it('preserves "data: summary"', () => {
            expect(sanitizeInput('data: summary')).toBe('data: summary');
        });

        it('preserves bare "data:" at end of sentence', () => {
            expect(sanitizeInput('No data:')).toBe('No data:');
        });

        it('preserves "data:" followed by numbers', () => {
            expect(sanitizeInput('data: 123')).toBe('data: 123');
        });
    });

    describe('multi-pass reconstruction bypass (15-TD-19, AC1, AC4)', () => {
        it('prevents javascript: reconstruction via nested injection', () => {
            const result = sanitizeInput('javasjavascript:cript:alert(1)');
            expect(result).not.toContain('javascript:');
            expect(result).toBe('alert(1)');
        });

        it('prevents script tag reconstruction via nested injection', () => {
            const result = sanitizeInput('<scrip<script>t>alert(1)</scrip</script>t>');
            expect(result).not.toContain('<script');
            expect(result).not.toContain('</script');
        });

        it('prevents vbscript: reconstruction via nested injection', () => {
            const result = sanitizeInput('vbscvbscript:ript:MsgBox');
            expect(result).not.toContain('vbscript:');
        });

        it('prevents data: URI reconstruction via nested injection', () => {
            const result = sanitizeInput('dadata:text/html,ta:text/html,payload');
            expect(result).not.toContain('data:text/html');
        });

        it('stabilizes within safety limit on deeply nested input', () => {
            const result = sanitizeInput(
                'javasjavasjavascript:cript:cript:alert(1)'
            );
            expect(result).not.toContain('javascript:');
        });

        it('handles multi-pass with event handlers', () => {
            const result = sanitizeInput('<img on<img onerror=x>error=alert(1)>');
            expect(result).not.toMatch(/on\w+\s*=/i);
        });
    });

    describe('control character bypass vectors (15-TD-19, security review)', () => {
        it('strips javascript: reconstructed via null byte', () => {
            const result = sanitizeInput('java\x00script:alert(1)');
            expect(result).not.toContain('javascript:');
        });

        it('strips event handler reconstructed via control char', () => {
            const result = sanitizeInput('<img on\x01error=alert(1)>');
            expect(result).not.toMatch(/on\w+\s*=/i);
        });

        it('strips URL-encoded null byte bypass', () => {
            const result = sanitizeInput('java%00script:alert(1)');
            expect(result).not.toContain('javascript:');
        });

        it('strips data: URI with embedded control char', () => {
            const result = sanitizeInput('da\x02ta:text/html,payload');
            expect(result).not.toContain('data:text/html');
        });
    });

    describe('URL-encoded bypass vectors (15-TD-19, AC2, AC5)', () => {
        it('strips URL-encoded data: URI with %2F slash', () => {
            const result = sanitizeInput('data:text%2Fhtml,payload');
            expect(result).not.toContain('data:text/html');
            expect(result).not.toContain('data:text%2Fhtml');
        });

        it('strips URL-encoded javascript: protocol', () => {
            const result = sanitizeInput('javascript%3Aalert(1)');
            expect(result).not.toContain('javascript:');
            expect(result).not.toContain('javascript%3A');
        });

        it('strips double-encoded data: URI', () => {
            const result = sanitizeInput('data:text%252Fhtml,payload');
            expect(result).not.toContain('data:text/html');
        });

        it('handles malformed percent encoding gracefully', () => {
            const result = sanitizeInput('test%ZZvalue');
            expect(result).toBe('test%ZZvalue');
        });

        it('preserves normal text with percent signs', () => {
            const result = sanitizeInput('Discount 50% off');
            expect(result).toBe('Discount 50% off');
        });

        it('preserves URL-like text that is not a dangerous pattern', () => {
            const result = sanitizeInput('Visit example%2Ecom today');
            expect(result).toBe('Visit example.com today');
        });

        it('strips triple-encoded javascript: protocol', () => {
            const result = sanitizeInput('javascript%25253Aalert(1)');
            expect(result).not.toContain('javascript:');
            expect(result).not.toContain('javascript%3A');
            expect(result).not.toContain('javascript%253A');
        });
    });

    describe('pre-truncation before regex processing (15-TD-19, AC3)', () => {
        it('pre-truncates oversized input before pattern matching', () => {
            const longInput = 'a'.repeat(5000);
            const result = sanitizeInput(longInput, { maxLength: 100 });
            expect(result.length).toBe(100);
        });

        it('preserves input shorter than pre-truncation cap', () => {
            const input = 'b'.repeat(500);
            const result = sanitizeInput(input, { maxLength: 100 });
            expect(result.length).toBe(100);
        });

        it('applies pattern removal before final truncation', () => {
            const padding = 'x'.repeat(900);
            const input = padding + '<script>alert(1)</script>';
            const result = sanitizeInput(input, { maxLength: 100 });
            expect(result).not.toContain('<script>');
            expect(result.length).toBe(100);
        });

        it('uses default maxLength for pre-truncation when not specified', () => {
            const input = 'c'.repeat(15000);
            const result = sanitizeInput(input);
            expect(result.length).toBe(1000);
        });
    });

    describe('multi-pass loop safety limit (15-TD-19, security review)', () => {
        it('terminates safely on pathological deeply nested input', () => {
            let input = 'alert(1)';
            for (let i = 0; i < 50; i++) {
                input = 'javas' + input + 'cript:';
            }
            const result = sanitizeInput(input);
            expect(result).not.toContain('javascript:');
        });
    });

    describe('maxLength edge cases (15-TD-19, security review)', () => {
        it('handles NaN maxLength by using default 1000', () => {
            const result = sanitizeInput('hello world', { maxLength: NaN });
            expect(result).toBe('hello world');
        });

        it('handles Infinity maxLength by using default 1000', () => {
            const longInput = 'a'.repeat(2000);
            const result = sanitizeInput(longInput, { maxLength: Infinity });
            expect(result.length).toBe(1000);
        });

        it('handles negative maxLength by using default 1000', () => {
            const result = sanitizeInput('hello world', { maxLength: -5 });
            expect(result).toBe('hello world');
        });
    });

    describe('legacy protocol and CSS patterns (15-TD-19, security review)', () => {
        it('strips livescript: protocol', () => {
            expect(sanitizeInput('livescript:alert(1)')).toBe('alert(1)');
        });

        it('strips mocha: protocol', () => {
            expect(sanitizeInput('mocha:alert(1)')).toBe('alert(1)');
        });

        it('strips CSS expression()', () => {
            const result = sanitizeInput('expression(alert(1))');
            expect(result).not.toContain('expression(');
        });

        it('strips CSS expression with whitespace', () => {
            const result = sanitizeInput('expression (alert(1))');
            expect(result).not.toContain('expression');
        });

        it('strips -moz-binding:', () => {
            const result = sanitizeInput('-moz-binding:url(evil)');
            expect(result).not.toContain('-moz-binding:');
        });
    });

    describe('other dangerous patterns (regression)', () => {
        it('strips script tags', () => {
            expect(sanitizeInput('<script>alert("xss")</script>Test')).toBe('Test');
        });

        it('strips javascript: protocol', () => {
            expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
        });

        it('strips vbscript: protocol', () => {
            expect(sanitizeInput('vbscript:MsgBox')).toBe('MsgBox');
        });

        it('strips event handler attributes', () => {
            const result = sanitizeInput('<img onerror=alert(1)>');
            expect(result).not.toContain('onerror');
        });
    });

    describe('basic functionality (regression)', () => {
        it('trims whitespace', () => {
            expect(sanitizeInput('  hello  ')).toBe('hello');
        });

        it('handles null/undefined', () => {
            expect(sanitizeInput(null)).toBe('');
            expect(sanitizeInput(undefined)).toBe('');
        });

        it('respects maxLength', () => {
            expect(sanitizeInput('a'.repeat(2000), { maxLength: 100 })).toBe('a'.repeat(100));
        });

        it('removes control characters', () => {
            expect(sanitizeInput('hello\x00world')).toBe('helloworld');
        });
    });
});
