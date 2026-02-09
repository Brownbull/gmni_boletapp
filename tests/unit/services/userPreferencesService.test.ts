/**
 * User Preferences Service Tests
 *
 * Tests for user preferences functions:
 * - getUserPreferences
 * - saveUserPreferences
 * - CURRENCY_INFO
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
    return {
        ...actual,
        doc: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
    };
});

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import {
    getUserPreferences,
    saveUserPreferences,
    CURRENCY_INFO,
} from '../../../src/services/userPreferencesService';
import type { UserPreferences } from '../../../src/services/userPreferencesService';

const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);
const mockServerTimestamp = vi.mocked(serverTimestamp);

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Helper to create a mock Firestore instance
 */
function createMockDb() {
    return {} as any;
}

/**
 * Helper to create a mock document snapshot (exists)
 */
function createMockDocSnapshot(data: Record<string, any>) {
    return {
        exists: () => true,
        data: () => data,
    };
}

/**
 * Helper to create a mock document snapshot (does not exist)
 */
function createMockDocSnapshotNotExists() {
    return {
        exists: () => false,
        data: () => null,
    };
}

// =============================================================================
// Tests: getUserPreferences
// =============================================================================

describe('getUserPreferences', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'settings' } as any);
    });

    it('should return default preferences if document does not exist', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshotNotExists() as any);

        const result = await getUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result.defaultCurrency).toBe('CLP');
        expect(result.fontFamily).toBe('outfit');
        expect(result.foreignLocationFormat).toBe('code');
        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts',
            TEST_APP_ID,
            'users',
            TEST_USER_ID,
            'preferences',
            'settings'
        );
    });

    it('should return existing preferences if document exists', async () => {
        const existingPrefs: UserPreferences = {
            defaultCurrency: 'USD',
            defaultCountry: 'US',
            defaultCity: 'New York',
            displayName: 'Test User',
            fontFamily: 'space',
            foreignLocationFormat: 'flag',
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(existingPrefs) as any);

        const result = await getUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result.defaultCurrency).toBe('USD');
        expect(result.defaultCountry).toBe('US');
        expect(result.defaultCity).toBe('New York');
        expect(result.displayName).toBe('Test User');
        expect(result.fontFamily).toBe('space');
        expect(result.foreignLocationFormat).toBe('flag');
    });

    it('should return default preferences on error', async () => {
        mockGetDoc.mockRejectedValue(new Error('Network error'));

        const result = await getUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result.defaultCurrency).toBe('CLP');
    });

    it('should handle partial preferences', async () => {
        const partialPrefs = {
            defaultCurrency: 'EUR',
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(partialPrefs) as any);

        const result = await getUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result.defaultCurrency).toBe('EUR');
        expect(result.fontFamily).toBe('outfit'); // default
        expect(result.foreignLocationFormat).toBe('code'); // default
    });
});

// =============================================================================
// Tests: saveUserPreferences
// =============================================================================

describe('saveUserPreferences', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'settings' } as any);
        mockSetDoc.mockResolvedValue(undefined);
    });

    it('should save preferences with merge option', async () => {
        const preferences: UserPreferences = {
            defaultCurrency: 'USD',
            defaultCountry: 'US',
            defaultCity: 'New York',
        };

        await saveUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID, preferences);

        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                defaultCurrency: 'USD',
                defaultCountry: 'US',
                defaultCity: 'New York',
                updatedAt: { _serverTimestamp: true },
            }),
            { merge: true }
        );
    });

    it('should include serverTimestamp in saved preferences', async () => {
        const preferences: UserPreferences = {
            defaultCurrency: 'EUR',
        };

        await saveUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID, preferences);

        const calledWith = mockSetDoc.mock.calls[0][1] as Record<string, any>;
        expect(calledWith.updatedAt).toEqual({ _serverTimestamp: true });
    });

    it('should throw error on Firestore failure', async () => {
        mockSetDoc.mockRejectedValue(new Error('Permission denied'));

        const preferences: UserPreferences = {
            defaultCurrency: 'CLP',
        };

        await expect(
            saveUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID, preferences)
        ).rejects.toThrow('Permission denied');
    });

    it('should use correct document path', async () => {
        const preferences: UserPreferences = {
            defaultCurrency: 'CLP',
        };

        await saveUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID, preferences);

        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts',
            TEST_APP_ID,
            'users',
            TEST_USER_ID,
            'preferences',
            'settings'
        );
    });

    it('should handle all preference fields', async () => {
        const preferences: UserPreferences = {
            defaultCurrency: 'EUR',
            defaultCountry: 'FR',
            defaultCity: 'Paris',
            displayName: 'Jean Dupont',
            phoneNumber: '+33123456789',
            birthDate: '1990-01-01',
            fontFamily: 'space',
            foreignLocationFormat: 'flag',
        };

        await saveUserPreferences(mockDb, TEST_USER_ID, TEST_APP_ID, preferences);

        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                defaultCurrency: 'EUR',
                defaultCountry: 'FR',
                defaultCity: 'Paris',
                displayName: 'Jean Dupont',
                phoneNumber: '+33123456789',
                birthDate: '1990-01-01',
                fontFamily: 'space',
                foreignLocationFormat: 'flag',
            }),
            { merge: true }
        );
    });
});

// =============================================================================
// Tests: CURRENCY_INFO
// =============================================================================

describe('CURRENCY_INFO', () => {
    it('should contain CLP currency info', () => {
        expect(CURRENCY_INFO.CLP).toBeDefined();
        expect(CURRENCY_INFO.CLP.symbol).toBe('$');
        expect(CURRENCY_INFO.CLP.name).toBe('Chilean Peso');
        expect(CURRENCY_INFO.CLP.nameEs).toBe('Peso Chileno');
    });

    it('should contain USD currency info', () => {
        expect(CURRENCY_INFO.USD).toBeDefined();
        expect(CURRENCY_INFO.USD.symbol).toBe('$');
        expect(CURRENCY_INFO.USD.name).toBe('US Dollar');
        expect(CURRENCY_INFO.USD.nameEs).toBe('Dólar Estadounidense');
    });

    it('should contain EUR currency info', () => {
        expect(CURRENCY_INFO.EUR).toBeDefined();
        expect(CURRENCY_INFO.EUR.symbol).toBe('€');
        expect(CURRENCY_INFO.EUR.name).toBe('Euro');
        expect(CURRENCY_INFO.EUR.nameEs).toBe('Euro');
    });

    it('should have all three supported currencies', () => {
        const currencies = Object.keys(CURRENCY_INFO);
        expect(currencies).toContain('CLP');
        expect(currencies).toContain('USD');
        expect(currencies).toContain('EUR');
        expect(currencies).toHaveLength(3);
    });
});
