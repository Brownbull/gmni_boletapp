/**
 * firestorePaths Tests
 *
 * Story 15-TD-3: Tests for centralized Firestore collection path builders.
 */

import { describe, it, expect } from 'vitest';
import {
    transactionsPath,
    merchantMappingsPath,
    categoryMappingsPath,
    subcategoryMappingsPath,
    itemNameMappingsPath,
    trustedMerchantsPath,
    airlocksPath,
    personalRecordsPath,
    notificationsPath,
    preferencesDocSegments,
    creditsDocSegments,
    insightProfileDocSegments,
    transactionDocSegments,
    notificationDocSegments,
    assertValidSegment,
    assertValidDocumentId,
} from '../../../src/lib/firestorePaths';

const APP_ID = 'test-app';
const USER_ID = 'user-123';
const TX_ID = 'tx-456';
const NOTIF_ID = 'notif-789';

describe('firestorePaths', () => {
    // =========================================================================
    // userId / transactionId / notificationId segment validation (Story 15-TD-18)
    // =========================================================================

    describe('userId segment validation', () => {
        const collectionFns = [
            ['transactionsPath', transactionsPath],
            ['merchantMappingsPath', merchantMappingsPath],
            ['categoryMappingsPath', categoryMappingsPath],
            ['subcategoryMappingsPath', subcategoryMappingsPath],
            ['itemNameMappingsPath', itemNameMappingsPath],
            ['trustedMerchantsPath', trustedMerchantsPath],
            ['airlocksPath', airlocksPath],
            ['personalRecordsPath', personalRecordsPath],
            ['notificationsPath', notificationsPath],
        ] as const;

        const docFns2Arg = [
            ['preferencesDocSegments', preferencesDocSegments],
            ['creditsDocSegments', creditsDocSegments],
            ['insightProfileDocSegments', insightProfileDocSegments],
        ] as const;

        const invalidUserIds = [
            ['path traversal (../hack)', '../hack'],
            ['slash in userId', 'user/id'],
            ['empty string', ''],
            ['double dot', '..'],
            ['control char (tab)', 'user\tid'],
            ['control char (newline)', 'user\nid'],
            ['spaces', 'user id'],
            ['special chars', 'user@id!'],
            ['null at runtime', null as unknown as string],
            ['undefined at runtime', undefined as unknown as string],
            ['exceeds max length (257 chars)', 'a'.repeat(257)],
        ] as const;

        it.each(invalidUserIds)(
            'collection path functions reject invalid userId: %s',
            (_desc, invalidUserId) => {
                for (const [name, fn] of collectionFns) {
                    expect(() => fn(APP_ID, invalidUserId), `${name} should reject "${invalidUserId}"`).toThrow(
                        'Invalid userId format'
                    );
                }
            }
        );

        it.each(invalidUserIds)(
            'doc segment functions (2-arg) reject invalid userId: %s',
            (_desc, invalidUserId) => {
                for (const [name, fn] of docFns2Arg) {
                    expect(() => fn(APP_ID, invalidUserId), `${name} should reject "${invalidUserId}"`).toThrow(
                        'Invalid userId format'
                    );
                }
            }
        );

        it.each(invalidUserIds)(
            'transactionDocSegments rejects invalid userId: %s',
            (_desc, invalidUserId) => {
                expect(() => transactionDocSegments(APP_ID, invalidUserId, TX_ID)).toThrow(
                    'Invalid userId format'
                );
            }
        );

        it.each(invalidUserIds)(
            'notificationDocSegments rejects invalid userId: %s',
            (_desc, invalidUserId) => {
                expect(() => notificationDocSegments(APP_ID, invalidUserId, NOTIF_ID)).toThrow(
                    'Invalid userId format'
                );
            }
        );

        it('accepts valid userId formats', () => {
            const validIds = ['abc123', 'user-1', 'user_1', 'AbC123xYz', 'a'.repeat(128)];
            for (const uid of validIds) {
                expect(() => transactionsPath(APP_ID, uid)).not.toThrow();
            }
        });

        it('accepts userId at exactly MAX_SEGMENT_LENGTH (256 chars)', () => {
            expect(() => transactionsPath(APP_ID, 'a'.repeat(256))).not.toThrow();
        });
    });

    describe('transactionId segment validation', () => {
        it.each([
            ['path traversal', '../hack'],
            ['slash', 'tx/id'],
            ['empty string', ''],
            ['double dot', '..'],
            ['spaces', 'tx id'],
        ])('rejects invalid transactionId: %s', (_desc, invalidTxId) => {
            expect(() => transactionDocSegments(APP_ID, USER_ID, invalidTxId)).toThrow(
                'Invalid transactionId format'
            );
        });

        it('accepts valid transactionId', () => {
            expect(() => transactionDocSegments(APP_ID, USER_ID, 'tx-456')).not.toThrow();
            expect(() => transactionDocSegments(APP_ID, USER_ID, 'abc123_def')).not.toThrow();
        });
    });

    describe('notificationId segment validation', () => {
        it.each([
            ['path traversal', '../hack'],
            ['slash', 'notif/id'],
            ['empty string', ''],
            ['double dot', '..'],
            ['spaces', 'notif id'],
        ])('rejects invalid notificationId: %s', (_desc, invalidNotifId) => {
            expect(() => notificationDocSegments(APP_ID, USER_ID, invalidNotifId)).toThrow(
                'Invalid notificationId format'
            );
        });

        it('accepts valid notificationId', () => {
            expect(() => notificationDocSegments(APP_ID, USER_ID, 'notif-789')).not.toThrow();
            expect(() => notificationDocSegments(APP_ID, USER_ID, 'abc123_def')).not.toThrow();
        });
    });

    describe('appId validation', () => {
        it.each([
            ['empty string', ''],
            ['path traversal', '../hack'],
            ['nested traversal', '../../etc/passwd'],
            ['slash in appId', 'app/id'],
            ['spaces', 'app id'],
            ['special chars', 'app@id!'],
            ['dot only', '.'],
            ['double dot', '..'],
            ['exceeds max length (65 chars)', 'a'.repeat(65)],
        ])('throws on invalid appId: %s', (_desc, invalidAppId) => {
            expect(() => transactionsPath(invalidAppId, USER_ID)).toThrow(
                'Invalid appId format'
            );
        });

        it.each([
            ['simple alpha', 'boletapp'],
            ['with hyphens', 'test-app'],
            ['with underscores', 'my_app'],
            ['alphanumeric', 'app123'],
        ])('accepts valid appId: %s', (_desc, validAppId) => {
            expect(() => transactionsPath(validAppId, USER_ID)).not.toThrow();
        });

        it('validates in collection path functions', () => {
            const fns = [
                transactionsPath, merchantMappingsPath, categoryMappingsPath,
                subcategoryMappingsPath, itemNameMappingsPath, trustedMerchantsPath,
                airlocksPath, personalRecordsPath, notificationsPath,
            ];
            for (const fn of fns) {
                expect(() => fn('../hack', USER_ID)).toThrow('Invalid appId');
            }
        });

        it('validates in document segment functions', () => {
            expect(() => preferencesDocSegments('../hack', USER_ID)).toThrow('Invalid appId');
            expect(() => creditsDocSegments('../hack', USER_ID)).toThrow('Invalid appId');
            expect(() => insightProfileDocSegments('../hack', USER_ID)).toThrow('Invalid appId');
            expect(() => transactionDocSegments('../hack', USER_ID, 'tx-1')).toThrow('Invalid appId');
            expect(() => notificationDocSegments('../hack', USER_ID, 'n-1')).toThrow('Invalid appId');
        });
    });

    // =========================================================================
    // assertValidSegment (Story 15-TD-23: exported for service-level validation)
    // =========================================================================

    describe('assertValidSegment (exported)', () => {
        it('accepts alphanumeric, hyphens, underscores', () => {
            expect(() => assertValidSegment('abc-123_DEF', 'test')).not.toThrow();
        });

        it.each([
            ['path traversal', '../hack'],
            ['slash', 'id/path'],
            ['empty string', ''],
            ['spaces', 'has space'],
            ['special chars', 'id@!'],
            ['null', null as unknown as string],
            ['undefined', undefined as unknown as string],
        ])('rejects invalid segment: %s', (_desc, value) => {
            expect(() => assertValidSegment(value, 'test')).toThrow('Invalid test format');
        });

        it('rejects values exceeding maxLength', () => {
            expect(() => assertValidSegment('a'.repeat(257), 'test')).toThrow('Invalid test format');
        });

        it('accepts value at exactly 256 chars', () => {
            expect(() => assertValidSegment('a'.repeat(256), 'test')).not.toThrow();
        });
    });

    // =========================================================================
    // assertValidDocumentId (Story 15-TD-23: space-permitting doc ID validator)
    // =========================================================================

    describe('assertValidDocumentId', () => {
        it('accepts alphanumeric with spaces (normalized merchant names)', () => {
            expect(() => assertValidDocumentId('jumbo mall 123', 'merchantDocId')).not.toThrow();
        });

        it('accepts hyphens and underscores', () => {
            expect(() => assertValidDocumentId('abc-123_DEF', 'test')).not.toThrow();
        });

        it('accepts single word', () => {
            expect(() => assertValidDocumentId('jumbo', 'test')).not.toThrow();
        });

        it.each([
            ['path traversal', '../hack'],
            ['slash', 'id/path'],
            ['empty string', ''],
            ['whitespace only', '   '],
            ['single space', ' '],
            ['special chars (@)', 'id@test'],
            ['special chars (!)', 'id!test'],
            ['tab', 'id\tid'],
            ['newline', 'id\nid'],
            ['null', null as unknown as string],
            ['undefined', undefined as unknown as string],
        ])('rejects invalid document ID: %s', (_desc, value) => {
            expect(() => assertValidDocumentId(value, 'test')).toThrow('Invalid test format');
        });

        it('rejects values exceeding maxLength', () => {
            expect(() => assertValidDocumentId('a'.repeat(257), 'test')).toThrow('Invalid test format');
        });

        it('accepts value at exactly 256 chars', () => {
            expect(() => assertValidDocumentId('a'.repeat(256), 'test')).not.toThrow();
        });
    });

    describe('collection paths', () => {
        it.each([
            ['transactionsPath', transactionsPath, 'transactions'],
            ['merchantMappingsPath', merchantMappingsPath, 'merchant_mappings'],
            ['categoryMappingsPath', categoryMappingsPath, 'category_mappings'],
            ['subcategoryMappingsPath', subcategoryMappingsPath, 'subcategory_mappings'],
            ['itemNameMappingsPath', itemNameMappingsPath, 'item_name_mappings'],
            ['trustedMerchantsPath', trustedMerchantsPath, 'trusted_merchants'],
            ['airlocksPath', airlocksPath, 'airlocks'],
            ['personalRecordsPath', personalRecordsPath, 'personalRecords'],
            ['notificationsPath', notificationsPath, 'notifications'],
        ] as const)('%s returns correct path', (_name, fn, collectionName) => {
            expect(fn(APP_ID, USER_ID)).toBe(
                `artifacts/${APP_ID}/users/${USER_ID}/${collectionName}`
            );
        });

        it('uses different paths for different appId/userId', () => {
            expect(transactionsPath('app-a', 'user-a')).not.toBe(
                transactionsPath('app-b', 'user-b')
            );
        });
    });

    describe('document segments', () => {
        it('preferencesDocSegments returns correct segments', () => {
            const segments = preferencesDocSegments(APP_ID, USER_ID);
            expect(segments).toEqual(['artifacts', APP_ID, 'users', USER_ID, 'preferences', 'settings']);
        });

        it('creditsDocSegments returns correct segments', () => {
            const segments = creditsDocSegments(APP_ID, USER_ID);
            expect(segments).toEqual(['artifacts', APP_ID, 'users', USER_ID, 'credits', 'balance']);
        });

        it('insightProfileDocSegments returns correct segments', () => {
            const segments = insightProfileDocSegments(APP_ID, USER_ID);
            expect(segments).toEqual(['artifacts', APP_ID, 'users', USER_ID, 'insightProfile', 'profile']);
        });

        it('transactionDocSegments includes transaction ID', () => {
            const segments = transactionDocSegments(APP_ID, USER_ID, 'tx-456');
            expect(segments).toEqual(['artifacts', APP_ID, 'users', USER_ID, 'transactions', 'tx-456']);
        });

        it('notificationDocSegments includes notification ID', () => {
            const segments = notificationDocSegments(APP_ID, USER_ID, 'notif-789');
            expect(segments).toEqual(['artifacts', APP_ID, 'users', USER_ID, 'notifications', 'notif-789']);
        });

        it('segments are readonly tuples', () => {
            const segments = preferencesDocSegments(APP_ID, USER_ID);
            // Verify tuple length (const assertion)
            expect(segments).toHaveLength(6);
        });
    });
});
