/**
 * One-Time Migration: Clear Legacy Shared Group Cache
 *
 * Story 14c-refactor.4: Clean IndexedDB Cache
 * Epic 14c-refactor: Codebase Cleanup Before Shared Groups V2
 *
 * This migration deletes the `boletapp_shared_groups` IndexedDB database
 * that was used by the now-removed shared group caching system.
 *
 * Migration behavior:
 * - Runs once on app startup (tracked via localStorage)
 * - Deletes the entire IndexedDB database
 * - Logs success in dev mode only
 * - Handles blocked/error states gracefully (marks as complete to avoid retry loops)
 *
 * @example
 * ```typescript
 * // In main.tsx or App.tsx (early in startup)
 * import { clearLegacySharedGroupCache } from './migrations/clearSharedGroupCache';
 *
 * // Fire-and-forget on startup
 * clearLegacySharedGroupCache().catch(console.error);
 * ```
 */

/** localStorage key for tracking migrations */
const MIGRATION_KEY = 'boletapp_migrations_v1';

/** Migration flag name */
const SHARED_GROUP_CACHE_CLEARED = 'shared_group_cache_cleared';

/** IndexedDB database name to delete */
const DB_NAME = 'boletapp_shared_groups';

/**
 * One-time migration to clear legacy shared group cache from IndexedDB.
 * This runs on app startup and only executes once per device.
 *
 * @returns Promise that resolves when migration is complete or skipped
 */
export async function clearLegacySharedGroupCache(): Promise<void> {
    let migrations: Record<string, number> = {};

    try {
        // Check if migration already ran
        migrations = JSON.parse(localStorage.getItem(MIGRATION_KEY) || '{}');
        if (migrations[SHARED_GROUP_CACHE_CLEARED]) {
            return; // Already migrated
        }
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
        // Try to mark as migrated to avoid infinite retries
        try {
            migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
            localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
        } catch {
            // If localStorage is completely unavailable, just continue
            // The migration will be attempted again on next app load
        }
    }
}
