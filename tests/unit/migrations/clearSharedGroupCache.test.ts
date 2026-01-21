/**
 * Tests for clearLegacySharedGroupCache migration
 *
 * Story 14c-refactor.4: Clean IndexedDB Cache
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearLegacySharedGroupCache } from '../../../src/migrations/clearSharedGroupCache';

describe('clearLegacySharedGroupCache', () => {
    let mockStorage: Record<string, string>;
    let mockLocalStorage: Storage;
    let originalIndexedDB: typeof indexedDB | undefined;
    let mockDeleteDatabase: ReturnType<typeof vi.fn>;
    let mockDeleteDatabaseRequest: {
        result: null;
        error: null;
        onsuccess: ((event: Event) => void) | null;
        onerror: ((event: Event) => void) | null;
        onblocked: ((event: Event) => void) | null;
    };

    beforeEach(() => {
        // Mock localStorage
        mockStorage = {};
        mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                mockStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStorage[key];
            }),
            clear: vi.fn(() => {
                mockStorage = {};
            }),
            length: 0,
            key: vi.fn(() => null),
        };
        vi.stubGlobal('localStorage', mockLocalStorage);

        // Save original indexedDB
        originalIndexedDB = globalThis.indexedDB;

        // Mock indexedDB
        mockDeleteDatabaseRequest = {
            result: null,
            error: null,
            onsuccess: null,
            onerror: null,
            onblocked: null,
        };
        mockDeleteDatabase = vi.fn(() => mockDeleteDatabaseRequest);

        vi.stubGlobal('indexedDB', {
            deleteDatabase: mockDeleteDatabase,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        if (originalIndexedDB !== undefined) {
            globalThis.indexedDB = originalIndexedDB;
        }
    });

    it('should skip migration if already completed', async () => {
        // Set up migration as already completed
        mockStorage['boletapp_migrations_v1'] = JSON.stringify({
            shared_group_cache_cleared: Date.now(),
        });

        await clearLegacySharedGroupCache();

        // Should not have called deleteDatabase
        expect(mockDeleteDatabase).not.toHaveBeenCalled();
    });

    it('should delete IndexedDB database on first run', async () => {
        // Simulate successful deletion
        setTimeout(() => {
            mockDeleteDatabaseRequest.onsuccess?.(new Event('success'));
        }, 0);

        await clearLegacySharedGroupCache();

        // Should have called deleteDatabase with correct name
        expect(mockDeleteDatabase).toHaveBeenCalledWith('boletapp_shared_groups');

        // Should have marked migration as complete
        const migrations = JSON.parse(mockStorage['boletapp_migrations_v1'] || '{}');
        expect(migrations.shared_group_cache_cleared).toBeDefined();
    });

    it('should handle deleteDatabase error gracefully', async () => {
        // Simulate error
        setTimeout(() => {
            mockDeleteDatabaseRequest.onerror?.(new Event('error'));
        }, 0);

        // Should not throw
        await expect(clearLegacySharedGroupCache()).resolves.toBeUndefined();

        // Should still mark migration as complete to avoid retry loops
        const migrations = JSON.parse(mockStorage['boletapp_migrations_v1'] || '{}');
        expect(migrations.shared_group_cache_cleared).toBeDefined();
    });

    it('should handle blocked database gracefully', async () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Simulate blocked
        setTimeout(() => {
            mockDeleteDatabaseRequest.onblocked?.(new Event('blocked'));
        }, 0);

        // Should not throw
        await expect(clearLegacySharedGroupCache()).resolves.toBeUndefined();

        // Should log correct message (not "will retry" since we mark complete anyway)
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '[migration] Database deletion blocked - continuing without deletion'
        );

        // Should still mark migration as complete
        const migrations = JSON.parse(mockStorage['boletapp_migrations_v1'] || '{}');
        expect(migrations.shared_group_cache_cleared).toBeDefined();

        consoleWarnSpy.mockRestore();
    });

    it('should handle missing IndexedDB', async () => {
        // Remove indexedDB
        vi.stubGlobal('indexedDB', undefined);

        await clearLegacySharedGroupCache();

        // Should mark migration as complete
        const migrations = JSON.parse(mockStorage['boletapp_migrations_v1'] || '{}');
        expect(migrations.shared_group_cache_cleared).toBeDefined();
    });

    it('should handle localStorage errors gracefully', async () => {
        // Make localStorage throw
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(() => {
                throw new Error('localStorage unavailable');
            }),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(() => null),
        });

        // Should not throw (catches internally)
        await expect(clearLegacySharedGroupCache()).resolves.toBeUndefined();
    });

    it('should not run migration twice in same session', async () => {
        // First run - successful
        setTimeout(() => {
            mockDeleteDatabaseRequest.onsuccess?.(new Event('success'));
        }, 0);

        await clearLegacySharedGroupCache();
        expect(mockDeleteDatabase).toHaveBeenCalledTimes(1);

        // Second run - should skip
        await clearLegacySharedGroupCache();
        expect(mockDeleteDatabase).toHaveBeenCalledTimes(1);
    });
});
