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
} from '../../../src/lib/firestorePaths';

const APP_ID = 'test-app';
const USER_ID = 'user-123';

describe('firestorePaths', () => {
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
