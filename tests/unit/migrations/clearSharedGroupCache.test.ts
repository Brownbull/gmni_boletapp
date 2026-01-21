/**
 * Tests for clearLegacySharedGroupCache migration
 *
 * Story 14c-refactor.4: Clean IndexedDB Cache
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearLegacySharedGroupCache } from '../../../src/migrations/clearSharedGroupCache';

// Constants from the module
const MIGRATION_KEY = 'boletapp_migrations_v1';
const SHARED_GROUP_CACHE_CLEARED = 'shared_group_cache_cleared';
const DB_NAME = 'boletapp_shared_groups';

describe('clearLegacySharedGroupCache', () => {
    let mockStorage: Record<string, string>;
    let mockLocalStorage: Storage;
    let mockDeleteDatabase: ReturnType<typeof vi.fn>;
    let originalIndexedDB: typeof indexedDB;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Mock localStorage
        mockStorage = {};
        mockLocalStorage = {
            getItem: vi.fn((key) => mockStorage[key] || null),
            setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
            removeItem: vi.fn((key) => { delete mockStorage[key]; }),
            clear: vi.fn(() => { mockStorage = {}; }),
            length: 0,
            key: vi.fn(() => null),
        };
        vi.stubGlobal('localStorage', mockLocalStorage);

        // Mock indexedDB
        mockDeleteDatabase = vi.fn();
        originalIndexedDB = globalThis.indexedDB;
        vi.stubGlobal('indexedDB', {
            deleteDatabase: mockDeleteDatabase,
        });

        // Mock console
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Set DEV mode
        vi.stubGlobal('import', { meta: { env: { DEV: true } } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        vi.clearAllMocks();
        if (originalIndexedDB) {
            globalThis.indexedDB = originalIndexedDB;
        }
    });

    describe('when migration has not run', () => {
        it('should delete the IndexedDB database', async () => {
            // Mock successful database deletion
            mockDeleteDatabase.mockImplementation(() => {
                const request = {
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                    onblocked: null as (() => void) | null,
                    error: null,
                };
                // Trigger onsuccess asynchronously
                setTimeout(() => request.onsuccess?.(), 0);
                return request;
            });

            await clearLegacySharedGroupCache();

            expect(mockDeleteDatabase).toHaveBeenCalledWith(DB_NAME);
        });

        it('should mark migration as complete after success', async () => {
            mockDeleteDatabase.mockImplementation(() => {
                const request = {
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                    onblocked: null as (() => void) | null,
                    error: null,
                };
                setTimeout(() => request.onsuccess?.(), 0);
                return request;
            });

            await clearLegacySharedGroupCache();

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedMigrations = JSON.parse(mockStorage[MIGRATION_KEY] || '{}');
            expect(savedMigrations[SHARED_GROUP_CACHE_CLEARED]).toBeTypeOf('number');
        });

        it('should log success in dev mode', async () => {
            mockDeleteDatabase.mockImplementation(() => {
                const request = {
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                    onblocked: null as (() => void) | null,
                    error: null,
                };
                setTimeout(() => request.onsuccess?.(), 0);
                return request;
            });

            await clearLegacySharedGroupCache();

            expect(consoleLogSpy).toHaveBeenCalledWith('[migration] Cleared legacy shared group cache');
        });
    });

    describe('when migration has already run', () => {
        beforeEach(() => {
            mockStorage[MIGRATION_KEY] = JSON.stringify({
                [SHARED_GROUP_CACHE_CLEARED]: Date.now(),
            });
        });

        it('should not attempt to delete database', async () => {
            await clearLegacySharedGroupCache();

            expect(mockDeleteDatabase).not.toHaveBeenCalled();
        });
    });

    describe('when IndexedDB is not available', () => {
        beforeEach(() => {
            vi.stubGlobal('indexedDB', undefined);
        });

        it('should mark migration as complete without error', async () => {
            await clearLegacySharedGroupCache();

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedMigrations = JSON.parse(mockStorage[MIGRATION_KEY] || '{}');
            expect(savedMigrations[SHARED_GROUP_CACHE_CLEARED]).toBeTypeOf('number');
        });
    });

    describe('error handling', () => {
        it('should handle deletion error gracefully', async () => {
            mockDeleteDatabase.mockImplementation(() => {
                const request = {
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                    onblocked: null as (() => void) | null,
                    error: new Error('Deletion failed'),
                };
                setTimeout(() => request.onerror?.(), 0);
                return request;
            });

            await clearLegacySharedGroupCache();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[migration] Failed to clear shared group cache:',
                expect.any(Error)
            );
            // Should still mark as complete to avoid retry loops
            const savedMigrations = JSON.parse(mockStorage[MIGRATION_KEY] || '{}');
            expect(savedMigrations[SHARED_GROUP_CACHE_CLEARED]).toBeTypeOf('number');
        });

        it('should handle blocked deletion gracefully', async () => {
            mockDeleteDatabase.mockImplementation(() => {
                const request = {
                    onsuccess: null as (() => void) | null,
                    onerror: null as (() => void) | null,
                    onblocked: null as (() => void) | null,
                    error: null,
                };
                setTimeout(() => request.onblocked?.(), 0);
                return request;
            });

            await clearLegacySharedGroupCache();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[migration] Database deletion blocked - continuing without deletion'
            );
            // Should mark as complete anyway
            const savedMigrations = JSON.parse(mockStorage[MIGRATION_KEY] || '{}');
            expect(savedMigrations[SHARED_GROUP_CACHE_CLEARED]).toBeTypeOf('number');
        });

        it('should handle thrown exceptions', async () => {
            mockDeleteDatabase.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            // Should not throw
            await clearLegacySharedGroupCache();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[migration] Error clearing shared group cache:',
                expect.any(Error)
            );
            // Should mark as complete to avoid infinite retries
            const savedMigrations = JSON.parse(mockStorage[MIGRATION_KEY] || '{}');
            expect(savedMigrations[SHARED_GROUP_CACHE_CLEARED]).toBeTypeOf('number');
        });
    });
});
