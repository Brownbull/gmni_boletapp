/**
 * sanitize.ts Tests
 *
 * Story 15-TD-8: Input Validation Hardening — data: URI pattern tightening.
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
