/**
 * Tests for centralized error handler
 *
 * Story 15-2h: Error code mapping + toast service
 */

import { describe, it, expect } from 'vitest';
import {
    classifyError,
    getErrorInfo,
    classifyAndGetErrorInfo,
    extractErrorMessage,
} from '../../../src/utils/errorHandler';

describe('classifyError', () => {
    it('should return NETWORK_ERROR for network-related errors', () => {
        expect(classifyError(new Error('Failed to fetch'))).toBe('NETWORK_ERROR');
        expect(classifyError(new Error('Network request failed'))).toBe('NETWORK_ERROR');
        expect(classifyError(new Error('net::ERR_CONNECTION_REFUSED'))).toBe('NETWORK_ERROR');
        expect(classifyError(new Error('ECONNREFUSED'))).toBe('NETWORK_ERROR');
    });

    it('should return NETWORK_ERROR for Firebase unavailable code', () => {
        expect(classifyError({ code: 'unavailable', message: 'Service unavailable' })).toBe('NETWORK_ERROR');
    });

    it('should return TIMEOUT_ERROR for timeout-related errors', () => {
        expect(classifyError(new Error('Request timed out'))).toBe('TIMEOUT_ERROR');
        expect(classifyError(new Error('Timeout exceeded'))).toBe('TIMEOUT_ERROR');
        expect(classifyError(new Error('Deadline reached'))).toBe('TIMEOUT_ERROR');
    });

    it('should return TIMEOUT_ERROR for Firebase deadline-exceeded code', () => {
        expect(classifyError({ code: 'deadline-exceeded', message: '' })).toBe('TIMEOUT_ERROR');
    });

    it('should return PERMISSION_DENIED for permission errors', () => {
        expect(classifyError(new Error('Permission denied'))).toBe('PERMISSION_DENIED');
        expect(classifyError(new Error('Unauthorized access'))).toBe('PERMISSION_DENIED');
        expect(classifyError(new Error('User is unauthenticated'))).toBe('PERMISSION_DENIED');
    });

    it('should return PERMISSION_DENIED for Firebase permission codes', () => {
        expect(classifyError({ code: 'permission-denied', message: '' })).toBe('PERMISSION_DENIED');
        expect(classifyError({ code: 'unauthenticated', message: '' })).toBe('PERMISSION_DENIED');
    });

    it('should return STORAGE_QUOTA for storage errors', () => {
        expect(classifyError(new Error('Quota exceeded'))).toBe('STORAGE_QUOTA');
        expect(classifyError(new Error('Storage quota reached'))).toBe('STORAGE_QUOTA');
        expect(classifyError(new Error('Disk quota exceeded'))).toBe('STORAGE_QUOTA');
        expect(classifyError(new Error('Disk full'))).toBe('STORAGE_QUOTA');
    });

    it('should return STORAGE_QUOTA for Firebase resource-exhausted code', () => {
        expect(classifyError({ code: 'resource-exhausted', message: '' })).toBe('STORAGE_QUOTA');
    });

    it('should NOT false-positive on ambiguous keywords', () => {
        // 'storage' alone (e.g. "storage key updated") should NOT match
        expect(classifyError(new Error('storage key updated'))).toBe('UNKNOWN_ERROR');
        // 'disk' alone should NOT match
        expect(classifyError(new Error('disk cache cleared'))).toBe('UNKNOWN_ERROR');
        // 'fetch' alone (e.g. "fetch user preferences") should NOT match
        expect(classifyError(new Error('fetch user preferences'))).toBe('UNKNOWN_ERROR');
    });

    it('should return NOT_FOUND for not-found errors', () => {
        expect(classifyError(new Error('Document not found'))).toBe('NOT_FOUND');
        expect(classifyError(new Error('No document to read'))).toBe('NOT_FOUND');
    });

    it('should return NOT_FOUND for Firebase not-found code', () => {
        expect(classifyError({ code: 'not-found', message: '' })).toBe('NOT_FOUND');
    });

    it('should return VALIDATION_ERROR for validation errors', () => {
        expect(classifyError(new Error('Invalid input data'))).toBe('VALIDATION_ERROR');
        expect(classifyError(new Error('Validation failed'))).toBe('VALIDATION_ERROR');
    });

    it('should return VALIDATION_ERROR for Firebase invalid-argument code', () => {
        expect(classifyError({ code: 'invalid-argument', message: '' })).toBe('VALIDATION_ERROR');
    });

    it('should return UNKNOWN_ERROR for unrecognized errors', () => {
        expect(classifyError(new Error('Something unexpected'))).toBe('UNKNOWN_ERROR');
        expect(classifyError(new Error('Oops'))).toBe('UNKNOWN_ERROR');
    });

    it('should return UNKNOWN_ERROR for null/undefined', () => {
        expect(classifyError(null)).toBe('UNKNOWN_ERROR');
        expect(classifyError(undefined)).toBe('UNKNOWN_ERROR');
    });

    it('should return UNKNOWN_ERROR for non-Error values', () => {
        expect(classifyError(42)).toBe('UNKNOWN_ERROR');
        expect(classifyError(true)).toBe('UNKNOWN_ERROR');
    });

    it('should handle string errors', () => {
        expect(classifyError('Network failure')).toBe('NETWORK_ERROR');
        expect(classifyError('Something random')).toBe('UNKNOWN_ERROR');
    });
});

describe('getErrorInfo', () => {
    it('should return correct info for NETWORK_ERROR', () => {
        const info = getErrorInfo('NETWORK_ERROR');
        expect(info.code).toBe('NETWORK_ERROR');
        expect(info.titleKey).toBe('errorNetworkTitle');
        expect(info.messageKey).toBe('errorNetworkMessage');
        expect(info.toastType).toBe('error');
    });

    it('should return correct info for TIMEOUT_ERROR', () => {
        const info = getErrorInfo('TIMEOUT_ERROR');
        expect(info.toastType).toBe('error');
        expect(info.messageKey).toBe('scanErrorTimeout');
    });

    it('should return correct info for PERMISSION_DENIED', () => {
        const info = getErrorInfo('PERMISSION_DENIED');
        expect(info.toastType).toBe('error');
        expect(info.titleKey).toBe('errorPermissionDeniedTitle');
    });

    it('should return correct info for STORAGE_QUOTA', () => {
        const info = getErrorInfo('STORAGE_QUOTA');
        expect(info.toastType).toBe('warning');
    });

    it('should return correct info for UNKNOWN_ERROR', () => {
        const info = getErrorInfo('UNKNOWN_ERROR');
        expect(info.toastType).toBe('error');
        expect(info.titleKey).toBe('errorUnknownTitle');
    });

    it('should return error info for all defined codes', () => {
        const codes = [
            'NETWORK_ERROR', 'TIMEOUT_ERROR', 'PERMISSION_DENIED',
            'STORAGE_QUOTA', 'NOT_FOUND', 'VALIDATION_ERROR', 'UNKNOWN_ERROR',
        ] as const;

        for (const code of codes) {
            const info = getErrorInfo(code);
            expect(info.code).toBe(code);
            expect(info.titleKey).toBeTruthy();
            expect(info.messageKey).toBeTruthy();
            expect(info.toastType).toBeTruthy();
        }
    });
});

describe('classifyAndGetErrorInfo', () => {
    it('should classify and return info in one step', () => {
        const info = classifyAndGetErrorInfo(new Error('Failed to fetch'));
        expect(info.code).toBe('NETWORK_ERROR');
        expect(info.toastType).toBe('error');
    });

    it('should handle Firebase errors', () => {
        const info = classifyAndGetErrorInfo({ code: 'permission-denied', message: 'Access denied' });
        expect(info.code).toBe('PERMISSION_DENIED');
    });

    it('should fallback to UNKNOWN_ERROR for unrecognized errors', () => {
        const info = classifyAndGetErrorInfo(new Error('Mysterious failure'));
        expect(info.code).toBe('UNKNOWN_ERROR');
    });
});

describe('extractErrorMessage', () => {
    it('should extract message from Error instance', () => {
        expect(extractErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('should return string errors as-is', () => {
        expect(extractErrorMessage('string error')).toBe('string error');
    });

    it('should extract message from object with message property', () => {
        expect(extractErrorMessage({ message: 'object error' })).toBe('object error');
    });

    it('should return "Unknown error" for null', () => {
        expect(extractErrorMessage(null)).toBe('Unknown error');
    });

    it('should return "Unknown error" for undefined', () => {
        expect(extractErrorMessage(undefined)).toBe('Unknown error');
    });

    it('should return "Unknown error" for numbers', () => {
        expect(extractErrorMessage(42)).toBe('Unknown error');
    });

    it('should return "Unknown error" for objects without message', () => {
        expect(extractErrorMessage({ code: 'err' })).toBe('Unknown error');
    });
});
