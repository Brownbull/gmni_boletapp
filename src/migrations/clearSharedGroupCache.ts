/**
 * One-Time Migration: Clear Legacy Shared Group Cache
 *
 * Story 14c-refactor.4: Clean IndexedDB Cache
 * Epic 14c-refactor: Codebase Cleanup Before Shared Groups V2
 *
 * This migration deletes the `boletapp_shared_groups` IndexedDB database
 * that was used for caching shared group transactions. The feature is being
 * reset, and any cached data would be stale or invalid.
 *
 * Behavior:
 * - Runs once per device (tracked via localStorage)
 * - Deletes the entire IndexedDB database
 * - Handles blocked/error states gracefully
 * - Logs progress in development mode only
 *
 * @example
 * ```typescript
 * // Run on app startup (non-blocking)
 * clearLegacySharedGroupCache().catch(console.error);
 * ```
 */

/** localStorage key for tracking migrations */
const MIGRATION_KEY = 'boletapp_migrations_v1';

/** Migration flag name */
const SHARED_GROUP_CACHE_CLEARED = 'shared_group_cache_cleared';

/** Database name to delete */
const DB_NAME = 'boletapp_shared_groups';

/**
 * One-time migration to clear legacy shared group cache from IndexedDB.
 * This runs on app startup and only executes once per device.
 *
 * Story 14c-refactor.4: Clean IndexedDB Cache
 */
export async function clearLegacySharedGroupCache(): Promise<void> {
    // Check if migration already ran
    const migrations = JSON.parse(localStorage.getItem(MIGRATION_KEY) || '{}');
    if (migrations[SHARED_GROUP_CACHE_CLEARED]) {
        return; // Already migrated
    }

    try {
        // Check if IndexedDB is available
        if (typeof indexedDB === 'undefined') {
            migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
            localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
            return;
        }

        // Delete the database
        await new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(DB_NAME);

            request.onsuccess = () => {
                if (import.meta.env.DEV) {
                    console.log('[migration] Cleared legacy shared group cache');
                }
                resolve();
            };

            request.onerror = () => {
                console.warn('[migration] Failed to clear shared group cache:', request.error);
                // Still mark as migrated to avoid retry loops
                resolve();
            };

            request.onblocked = () => {
                console.warn('[migration] Database deletion blocked - continuing without deletion');
                resolve();
            };
        });

        // Mark migration as complete
        migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
        localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));

    } catch (err) {
        console.warn('[migration] Error clearing shared group cache:', err);
        // Mark as migrated to avoid infinite retries
        migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
        localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
    }
}
