/**
 * Shared Group Errors Utility Tests
 *
 * Story 14c.11: Error Handling
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for error classification and utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    SharedGroupErrorType,
    classifyError,
    getErrorConfig,
    isNetworkRelated,
    isStorageRelated,
    shouldShowAsToast,
    ERROR_CONFIGS,
} from '../../../src/lib/sharedGroupErrors';

describe('sharedGroupErrors', () => {
    describe('classifyError', () => {
        describe('Known Error Codes', () => {
            it('classifies CODE_NOT_FOUND error', () => {
                const result = classifyError(new Error('CODE_NOT_FOUND'));

                expect(result.type).toBe(SharedGroupErrorType.CODE_NOT_FOUND);
                expect(result.recoverable).toBe(true);
            });

            it('classifies CODE_EXPIRED error', () => {
                const result = classifyError(new Error('CODE_EXPIRED'));

                expect(result.type).toBe(SharedGroupErrorType.CODE_EXPIRED);
                expect(result.recoverable).toBe(false);
            });

            it('classifies INVITATION_EXPIRED error', () => {
                const result = classifyError(new Error('INVITATION_EXPIRED'));

                expect(result.type).toBe(SharedGroupErrorType.INVITATION_EXPIRED);
                expect(result.recoverable).toBe(false);
            });

            it('classifies INVITATION_NOT_FOUND error', () => {
                const result = classifyError(new Error('INVITATION_NOT_FOUND'));

                expect(result.type).toBe(SharedGroupErrorType.INVITATION_NOT_FOUND);
                expect(result.recoverable).toBe(false);
            });

            it('classifies GROUP_FULL error', () => {
                const result = classifyError(new Error('GROUP_FULL'));

                expect(result.type).toBe(SharedGroupErrorType.GROUP_FULL);
                expect(result.recoverable).toBe(false);
            });

            it('classifies GROUP_NOT_FOUND error', () => {
                const result = classifyError(new Error('GROUP_NOT_FOUND'));

                expect(result.type).toBe(SharedGroupErrorType.GROUP_NOT_FOUND);
                expect(result.recoverable).toBe(false);
            });

            it('classifies ALREADY_MEMBER error', () => {
                const result = classifyError(new Error('ALREADY_MEMBER'));

                expect(result.type).toBe(SharedGroupErrorType.ALREADY_MEMBER);
                expect(result.recoverable).toBe(false);
            });

            it('classifies NOT_A_MEMBER error', () => {
                const result = classifyError(new Error('NOT_A_MEMBER'));

                expect(result.type).toBe(SharedGroupErrorType.NOT_A_MEMBER);
                expect(result.recoverable).toBe(false);
            });

            it('classifies OWNER_CANNOT_LEAVE error', () => {
                const result = classifyError(new Error('OWNER_CANNOT_LEAVE'));

                expect(result.type).toBe(SharedGroupErrorType.OWNER_CANNOT_LEAVE);
                expect(result.recoverable).toBe(true);
            });

            it('classifies NOT_OWNER error', () => {
                const result = classifyError(new Error('NOT_OWNER'));

                expect(result.type).toBe(SharedGroupErrorType.NOT_OWNER);
                expect(result.recoverable).toBe(false);
            });

            it('classifies CANNOT_TRANSFER_TO_SELF error', () => {
                const result = classifyError(new Error('CANNOT_TRANSFER_TO_SELF'));

                expect(result.type).toBe(SharedGroupErrorType.CANNOT_TRANSFER_TO_SELF);
                expect(result.recoverable).toBe(true);
            });

            it('classifies TARGET_NOT_MEMBER error', () => {
                const result = classifyError(new Error('TARGET_NOT_MEMBER'));

                expect(result.type).toBe(SharedGroupErrorType.TARGET_NOT_MEMBER);
                expect(result.recoverable).toBe(true);
            });
        });

        describe('Network Errors', () => {
            it('classifies Firebase unavailable error', () => {
                const error = { code: 'unavailable', message: 'Service unavailable' };
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.NETWORK_ERROR);
                expect(result.recoverable).toBe(true);
            });

            it('classifies network-request-failed error', () => {
                const error = { code: 'network-request-failed', message: 'Network failed' };
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.NETWORK_ERROR);
                expect(result.recoverable).toBe(true);
            });

            it('classifies error with network in message', () => {
                const error = new Error('A network error occurred');
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.NETWORK_ERROR);
                expect(result.recoverable).toBe(true);
            });

            it('classifies error with offline in message', () => {
                const error = new Error('The device is offline');
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.NETWORK_ERROR);
                expect(result.recoverable).toBe(true);
            });

            it('classifies error with connection in message', () => {
                const error = new Error('Connection refused');
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.NETWORK_ERROR);
                expect(result.recoverable).toBe(true);
            });
        });

        describe('Storage Quota Errors', () => {
            it('classifies DOMException QuotaExceededError', () => {
                const error = new DOMException('Quota exceeded', 'QuotaExceededError');
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.STORAGE_QUOTA);
                expect(result.recoverable).toBe(true);
            });

            it('classifies object with QuotaExceededError name', () => {
                const error = { name: 'QuotaExceededError', message: 'Storage full' };
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.STORAGE_QUOTA);
                expect(result.recoverable).toBe(true);
            });

            it('classifies error with QuotaExceeded in message', () => {
                const error = new Error('QuotaExceeded: Storage limit reached');
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.STORAGE_QUOTA);
                expect(result.recoverable).toBe(true);
            });
        });

        describe('Permission Errors', () => {
            it('classifies Firebase permission-denied error', () => {
                const error = { code: 'permission-denied', message: 'Access denied' };
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.PERMISSION_DENIED);
                expect(result.recoverable).toBe(false);
            });

            it('classifies error with permission in message', () => {
                const error = new Error('Permission denied for this operation');
                const result = classifyError(error);

                expect(result.type).toBe(SharedGroupErrorType.PERMISSION_DENIED);
                expect(result.recoverable).toBe(false);
            });
        });

        describe('Unknown Errors', () => {
            it('classifies unknown Error objects', () => {
                const result = classifyError(new Error('Something unexpected happened'));

                expect(result.type).toBe(SharedGroupErrorType.UNKNOWN);
                expect(result.recoverable).toBe(false);
            });

            it('classifies string errors', () => {
                const result = classifyError('Some error string');

                expect(result.type).toBe(SharedGroupErrorType.UNKNOWN);
                expect(result.recoverable).toBe(false);
            });

            it('handles null error', () => {
                const result = classifyError(null);

                expect(result.type).toBe(SharedGroupErrorType.UNKNOWN);
                expect(result.recoverable).toBe(false);
            });

            it('handles undefined error', () => {
                const result = classifyError(undefined);

                expect(result.type).toBe(SharedGroupErrorType.UNKNOWN);
                expect(result.recoverable).toBe(false);
            });

            it('uses custom default message for unknown errors', () => {
                const result = classifyError(null, 'Custom default message');

                expect(result.message).toBe('Custom default message');
            });
        });

        describe('Original Error Preservation', () => {
            it('preserves original error reference', () => {
                const originalError = new Error('Test error');
                const result = classifyError(originalError);

                expect(result.originalError).toBe(originalError);
            });
        });
    });

    describe('getErrorConfig', () => {
        it('returns config for USER_NOT_FOUND', () => {
            const config = getErrorConfig(SharedGroupErrorType.USER_NOT_FOUND);

            expect(config.icon).toBe('❓');
            expect(config.recoverable).toBe(true);
            expect(config.titleKey).toBe('errorUserNotFoundTitle');
            expect(config.messageKey).toBe('errorUserNotFoundMessage');
        });

        it('returns config for NETWORK_ERROR', () => {
            const config = getErrorConfig(SharedGroupErrorType.NETWORK_ERROR);

            expect(config.icon).toBe('📡');
            expect(config.recoverable).toBe(true);
            expect(config.titleKey).toBe('errorNetworkTitle');
        });

        it('returns config for GROUP_FULL', () => {
            const config = getErrorConfig(SharedGroupErrorType.GROUP_FULL);

            expect(config.icon).toBe('👥');
            expect(config.recoverable).toBe(false);
        });

        it('returns config for all error types', () => {
            // Verify all error types have configs
            Object.values(SharedGroupErrorType).forEach(type => {
                const config = getErrorConfig(type);
                expect(config).toBeDefined();
                expect(config.icon).toBeDefined();
                expect(config.colorClass).toBeDefined();
                expect(typeof config.recoverable).toBe('boolean');
                expect(config.titleKey).toBeDefined();
                expect(config.messageKey).toBeDefined();
            });
        });
    });

    describe('isNetworkRelated', () => {
        it('returns true for NETWORK_ERROR', () => {
            expect(isNetworkRelated(SharedGroupErrorType.NETWORK_ERROR)).toBe(true);
        });

        it('returns false for other error types', () => {
            expect(isNetworkRelated(SharedGroupErrorType.GROUP_FULL)).toBe(false);
            expect(isNetworkRelated(SharedGroupErrorType.STORAGE_QUOTA)).toBe(false);
            expect(isNetworkRelated(SharedGroupErrorType.UNKNOWN)).toBe(false);
        });
    });

    describe('isStorageRelated', () => {
        it('returns true for STORAGE_QUOTA', () => {
            expect(isStorageRelated(SharedGroupErrorType.STORAGE_QUOTA)).toBe(true);
        });

        it('returns false for other error types', () => {
            expect(isStorageRelated(SharedGroupErrorType.NETWORK_ERROR)).toBe(false);
            expect(isStorageRelated(SharedGroupErrorType.GROUP_FULL)).toBe(false);
        });
    });

    describe('shouldShowAsToast', () => {
        it('returns true for STORAGE_QUOTA (non-blocking warning)', () => {
            expect(shouldShowAsToast(SharedGroupErrorType.STORAGE_QUOTA)).toBe(true);
        });

        it('returns false for blocking errors', () => {
            expect(shouldShowAsToast(SharedGroupErrorType.NETWORK_ERROR)).toBe(false);
            expect(shouldShowAsToast(SharedGroupErrorType.GROUP_FULL)).toBe(false);
            expect(shouldShowAsToast(SharedGroupErrorType.INVITATION_EXPIRED)).toBe(false);
        });
    });

    describe('ERROR_CONFIGS', () => {
        it('has configurations for all error types', () => {
            const errorTypes = Object.values(SharedGroupErrorType);
            const configuredTypes = Object.keys(ERROR_CONFIGS);

            expect(configuredTypes.length).toBe(errorTypes.length);

            errorTypes.forEach(type => {
                expect(ERROR_CONFIGS[type]).toBeDefined();
            });
        });

        it('all configs have required fields', () => {
            Object.values(ERROR_CONFIGS).forEach(config => {
                expect(typeof config.icon).toBe('string');
                expect(config.icon.length).toBeGreaterThan(0);
                expect(typeof config.colorClass).toBe('string');
                expect(typeof config.recoverable).toBe('boolean');
                expect(typeof config.titleKey).toBe('string');
                expect(typeof config.messageKey).toBe('string');
            });
        });

        it('colorClass values contain valid CSS classes', () => {
            Object.values(ERROR_CONFIGS).forEach(config => {
                // Should contain background and border classes
                expect(config.colorClass).toMatch(/bg-/);
                expect(config.colorClass).toMatch(/border-/);
            });
        });
    });
});
