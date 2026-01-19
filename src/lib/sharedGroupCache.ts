/**
 * Shared Group Cache - IndexedDB Storage Layer
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * IndexedDB-based caching layer for shared group transactions.
 * Provides offline support and fast loading from persistent cache.
 *
 * Three-Layer Caching Strategy:
 * - Layer 1: React Query in-memory cache (5min stale, 30min gc)
 * - Layer 2: IndexedDB persistent cache (this module)
 * - Layer 3: Firestore (source of truth)
 *
 * AC3: IndexedDB Caching Layer
 * - Cache survives app close/refresh
 * - Hydrates from IndexedDB first
 *
 * AC9: LRU Cache Eviction
 * - Evicts oldest 5,000 records when exceeding 50,000 limit
 *
 * @example
 * ```typescript
 * // Open the database
 * const db = await openSharedGroupDB();
 *
 * // Write transactions to cache
 * await writeToCache(db, 'group123', transactions);
 *
 * // Read from cache
 * const cached = await readFromCache(db, 'group123', {
 *   startDate: new Date('2026-01-01'),
 *   endDate: new Date('2026-01-31'),
 * });
 * ```
 */

import type { Transaction } from '../types/transaction';
import type { SharedGroupTransaction } from '../services/sharedGroupTransactionService';

// ============================================================================
// Constants
// ============================================================================

/** IndexedDB database name */
const DB_NAME = 'boletapp_shared_groups';

/** Database version - increment when schema changes */
const DB_VERSION = 1;

/** Object store names */
const STORES = {
    TRANSACTIONS: 'transactions',
    METADATA: 'metadata',
} as const;

/** Cache configuration */
export const CACHE_CONFIG = {
    /** Maximum number of cached records */
    MAX_RECORDS: 50_000,
    /** Number of records to evict when limit exceeded */
    EVICTION_BATCH: 5_000,
} as const;

// ============================================================================
// Types
// ============================================================================

/**
 * Cached transaction entry in IndexedDB.
 */
export interface CachedTransaction {
    /** Composite key: {groupId}_{transactionId} */
    key: string;
    /** Original transaction ID */
    id: string;
    /** Shared group ID this transaction belongs to */
    groupId: string;
    /** Owner user ID */
    ownerId: string;
    /** Transaction date as timestamp (for indexing) */
    dateTs: number;
    /** When this was cached (for LRU eviction) */
    cachedAt: number;
    /** Full transaction data */
    data: Transaction;
}

/**
 * Sync metadata for a shared group.
 */
export interface SyncMetadata {
    /** Shared group ID */
    groupId: string;
    /** Last successful sync timestamp */
    lastSyncTimestamp: number;
    /** Per-member sync timestamps */
    memberSyncTimestamps: Record<string, number>;
}

/**
 * Date range filter for cache reads.
 */
export interface DateRangeFilter {
    startDate: Date;
    endDate: Date;
}

// ============================================================================
// Database Management
// ============================================================================

/** Cached database instance */
let dbInstance: IDBDatabase | null = null;

/**
 * Open (or create) the IndexedDB database.
 *
 * AC3: Implement openSharedGroupDB() - open/create database
 *
 * @returns Promise resolving to IDBDatabase instance
 */
export async function openSharedGroupDB(): Promise<IDBDatabase> {
    // Return cached instance if available
    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[sharedGroupCache] Failed to open database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;

            // Handle database close/delete events
            dbInstance.onclose = () => {
                dbInstance = null;
            };

            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create transactions store with indexes
            if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
                const txnStore = db.createObjectStore(STORES.TRANSACTIONS, {
                    keyPath: 'key',
                });

                // Indexes for efficient queries
                txnStore.createIndex('by-group-id', 'groupId', { unique: false });
                txnStore.createIndex('by-date', 'dateTs', { unique: false });
                txnStore.createIndex('by-cached-at', 'cachedAt', { unique: false });
                // Compound index for group + date queries
                txnStore.createIndex('by-group-date', ['groupId', 'dateTs'], { unique: false });
            }

            // Create metadata store
            if (!db.objectStoreNames.contains(STORES.METADATA)) {
                db.createObjectStore(STORES.METADATA, {
                    keyPath: 'groupId',
                });
            }
        };
    });
}

/**
 * Close the database connection.
 */
export function closeSharedGroupDB(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

/**
 * Check if IndexedDB is available in this environment.
 *
 * AC3: Survives app close/refresh (when available)
 */
export function isIndexedDBAvailable(): boolean {
    try {
        return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
        return false;
    }
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Write result type indicating success or degraded mode.
 * Story 14c.11: Error Handling - AC5 IndexedDB Quota Exceeded
 */
export interface WriteCacheResult {
    success: boolean;
    /** If quota was exceeded, cleanup was attempted */
    quotaExceeded?: boolean;
    /** Number of records written */
    writtenCount?: number;
}

/**
 * Write transactions to the IndexedDB cache.
 *
 * AC3: Implement writeToCache(groupId, transactions[])
 * Story 14c.11 AC5: Handle IndexedDB quota exceeded gracefully
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 * @param transactions Array of transactions to cache
 * @returns Result indicating success or if quota was exceeded
 */
export async function writeToCache(
    db: IDBDatabase,
    groupId: string,
    transactions: SharedGroupTransaction[]
): Promise<WriteCacheResult> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = transaction.objectStore(STORES.TRANSACTIONS);
        const now = Date.now();
        let writtenCount = 0;

        transaction.oncomplete = () => {
            // After writing, check if we need to evict
            enforceCacheLimit(db).catch(console.error);
            resolve({ success: true, writtenCount });
        };

        transaction.onerror = () => {
            const error = transaction.error;
            console.error('[sharedGroupCache] writeToCache error:', error);

            // Story 14c.11 AC5: Handle quota exceeded
            if (isQuotaExceededError(error)) {
                console.warn('[sharedGroupCache] Quota exceeded, attempting cleanup...');
                // Resolve with partial success - caller should show non-blocking warning
                resolve({ success: false, quotaExceeded: true, writtenCount });
            } else {
                reject(error);
            }
        };

        // Handle per-record errors (some browsers throw on individual put)
        transaction.onabort = () => {
            const error = transaction.error;
            if (isQuotaExceededError(error)) {
                console.warn('[sharedGroupCache] Quota exceeded during write, partial cache');
                resolve({ success: false, quotaExceeded: true, writtenCount });
            } else {
                reject(error);
            }
        };

        // Write each transaction
        for (const txn of transactions) {
            if (!txn.id) continue;

            const cached: CachedTransaction = {
                key: `${groupId}_${txn.id}`,
                id: txn.id,
                groupId,
                ownerId: txn._ownerId,
                dateTs: extractDateMillis(txn.date),
                cachedAt: now,
                data: { ...txn, id: txn.id },
            };

            try {
                store.put(cached);
                writtenCount++;
            } catch (err) {
                // Individual put failed
                if (isQuotaExceededError(err)) {
                    console.warn(`[sharedGroupCache] Quota exceeded at record ${writtenCount}`);
                    break; // Stop writing, transaction will complete with what we have
                }
                throw err;
            }
        }
    });
}

/**
 * Check if an error is a quota exceeded error.
 * Story 14c.11 AC5: Detect IndexedDB quota errors
 */
function isQuotaExceededError(error: unknown): boolean {
    if (!error) return false;

    // DOMException with QuotaExceededError name
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return true;
    }

    // Check error message as fallback
    if (error && typeof error === 'object') {
        const err = error as { name?: string; message?: string };
        if (err.name === 'QuotaExceededError') return true;
        if (err.message?.includes('QuotaExceeded')) return true;
        if (err.message?.includes('quota')) return true;
    }

    return false;
}

/**
 * Remove transactions from cache (for soft-delete sync).
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 * @param transactionIds Transaction IDs to remove
 */
export async function removeFromCache(
    db: IDBDatabase,
    groupId: string,
    transactionIds: string[]
): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = transaction.objectStore(STORES.TRANSACTIONS);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        for (const id of transactionIds) {
            store.delete(`${groupId}_${id}`);
        }
    });
}

/**
 * Clear all cached transactions for a group.
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 */
export async function clearGroupCache(
    db: IDBDatabase,
    groupId: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = transaction.objectStore(STORES.TRANSACTIONS);
        const index = store.index('by-group-id');

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        const request = index.openKeyCursor(IDBKeyRange.only(groupId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursor | null>).result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            }
        };
    });
}

/**
 * Clear cached transactions for a group (convenience function).
 * Opens the database internally and clears the cache.
 *
 * Story 14c.5 Bug Fix: Call this when group assignments change to prevent
 * stale cache from showing transactions that were untagged from groups.
 *
 * @param groupId Shared group ID to clear cache for
 */
export async function clearGroupCacheById(groupId: string): Promise<void> {
    if (!isIndexedDBAvailable()) {
        return; // No-op if IndexedDB not available
    }

    try {
        const db = await openSharedGroupDB();
        await clearGroupCache(db, groupId);
        // Also clear sync metadata so next fetch does a full sync
        await deleteSyncMetadata(db, groupId);

        if (import.meta.env.DEV) {
            console.log(`[sharedGroupCache] Cleared cache for group: ${groupId}`);
        }
    } catch (err) {
        console.warn('[sharedGroupCache] Failed to clear group cache:', err);
    }
}

/**
 * Clear ALL cached transactions and metadata (nuclear option).
 * Use this to reset stale caches after bug fixes or data corruption.
 *
 * @returns Promise that resolves when cache is cleared
 */
export async function clearAllGroupCaches(): Promise<void> {
    if (!isIndexedDBAvailable()) {
        return;
    }

    try {
        // Delete the entire database - cleanest way to clear all data
        closeSharedGroupDB(); // Close any open connections

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = () => {
                if (import.meta.env.DEV) {
                    console.log('[sharedGroupCache] Cleared ALL group caches (deleted database)');
                }
                resolve();
            };
            request.onerror = () => {
                console.error('[sharedGroupCache] Failed to delete database:', request.error);
                reject(request.error);
            };
            request.onblocked = () => {
                console.warn('[sharedGroupCache] Database delete blocked - close other tabs');
                // Still resolve after a delay
                setTimeout(resolve, 1000);
            };
        });
    } catch (err) {
        console.warn('[sharedGroupCache] Failed to clear all caches:', err);
    }
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Read transactions from cache for a group with optional date filter.
 *
 * AC3: Implement readFromCache(groupId, dateRange)
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 * @param filter Optional date range filter
 * @returns Array of cached transactions
 */
export async function readFromCache(
    db: IDBDatabase,
    groupId: string,
    filter?: DateRangeFilter
): Promise<SharedGroupTransaction[]> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readonly');
        const store = transaction.objectStore(STORES.TRANSACTIONS);
        const index = store.index('by-group-date');

        const results: SharedGroupTransaction[] = [];

        // Build key range based on filter
        let range: IDBKeyRange;
        if (filter) {
            const startTs = filter.startDate.getTime();
            const endTs = filter.endDate.getTime();
            range = IDBKeyRange.bound([groupId, startTs], [groupId, endTs]);
        } else {
            range = IDBKeyRange.bound([groupId, 0], [groupId, Infinity]);
        }

        const request = index.openCursor(range, 'prev'); // Descending by date

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor) {
                const cached = cursor.value as CachedTransaction;
                results.push({
                    ...cached.data,
                    _ownerId: cached.ownerId,
                } as SharedGroupTransaction);
                cursor.continue();
            } else {
                resolve(results);
            }
        };

        request.onerror = () => {
            console.error('[sharedGroupCache] readFromCache error:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get the count of cached transactions.
 *
 * @param db IndexedDB instance
 * @returns Total count of cached transactions
 */
export async function getCacheCount(db: IDBDatabase): Promise<number> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readonly');
        const store = transaction.objectStore(STORES.TRANSACTIONS);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ============================================================================
// Metadata Operations
// ============================================================================

/**
 * Get sync metadata for a group.
 *
 * AC4: Store lastSyncTimestamp per group in IndexedDB metadata
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 * @returns Sync metadata or null if not found
 */
export async function getSyncMetadata(
    db: IDBDatabase,
    groupId: string
): Promise<SyncMetadata | null> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.METADATA, 'readonly');
        const store = transaction.objectStore(STORES.METADATA);
        const request = store.get(groupId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update sync metadata for a group.
 *
 * AC4: Update lastSyncTimestamp after successful sync
 *
 * @param db IndexedDB instance
 * @param metadata Sync metadata to store
 */
export async function updateSyncMetadata(
    db: IDBDatabase,
    metadata: SyncMetadata
): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.METADATA, 'readwrite');
        const store = transaction.objectStore(STORES.METADATA);
        const request = store.put(metadata);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete sync metadata for a group.
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 */
export async function deleteSyncMetadata(
    db: IDBDatabase,
    groupId: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.METADATA, 'readwrite');
        const store = transaction.objectStore(STORES.METADATA);
        const request = store.delete(groupId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============================================================================
// LRU Cache Eviction
// ============================================================================

/**
 * Enforce cache size limit using LRU eviction.
 *
 * AC9: LRU Cache Eviction
 * - When exceeds 50,000 records, evict oldest 5,000 (by cachedAt)
 * - Cache size is monitored on each write
 *
 * @param db IndexedDB instance
 */
export async function enforceCacheLimit(db: IDBDatabase): Promise<void> {
    const count = await getCacheCount(db);

    if (count <= CACHE_CONFIG.MAX_RECORDS) {
        return; // Under limit, nothing to do
    }

    // Log eviction in dev mode
    if (import.meta.env.DEV) {
        console.log(`[sharedGroupCache] Cache limit exceeded (${count}), evicting ${CACHE_CONFIG.EVICTION_BATCH} records`);
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = transaction.objectStore(STORES.TRANSACTIONS);
        const index = store.index('by-cached-at');

        let deleted = 0;

        transaction.oncomplete = () => {
            if (import.meta.env.DEV) {
                console.log(`[sharedGroupCache] Evicted ${deleted} records`);
            }
            resolve();
        };

        transaction.onerror = () => reject(transaction.error);

        // Iterate from oldest (lowest cachedAt) to newest
        const request = index.openCursor(null, 'next');

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor && deleted < CACHE_CONFIG.EVICTION_BATCH) {
                store.delete(cursor.primaryKey);
                deleted++;
                cursor.continue();
            }
        };
    });
}

// ============================================================================
// Story 14c.11: Quota Exceeded Handling
// ============================================================================

/**
 * Attempt to free up storage space by evicting old records.
 * Story 14c.11 AC5: Handle quota exceeded with cleanup
 *
 * @param db IndexedDB instance
 * @param aggressiveEviction If true, evict more records
 * @returns Number of records evicted
 */
export async function cleanupOldCacheEntries(
    db: IDBDatabase,
    aggressiveEviction = false
): Promise<number> {
    const evictionCount = aggressiveEviction
        ? CACHE_CONFIG.EVICTION_BATCH * 2
        : CACHE_CONFIG.EVICTION_BATCH;

    if (import.meta.env.DEV) {
        console.log(`[sharedGroupCache] Cleaning up ${evictionCount} old cache entries`);
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.TRANSACTIONS, 'readwrite');
        const store = transaction.objectStore(STORES.TRANSACTIONS);
        const index = store.index('by-cached-at');

        let deleted = 0;

        transaction.oncomplete = () => {
            if (import.meta.env.DEV) {
                console.log(`[sharedGroupCache] Cleanup complete: ${deleted} records evicted`);
            }
            resolve(deleted);
        };

        transaction.onerror = () => reject(transaction.error);

        // Iterate from oldest to newest
        const request = index.openCursor(null, 'next');

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor && deleted < evictionCount) {
                store.delete(cursor.primaryKey);
                deleted++;
                cursor.continue();
            }
        };
    });
}

/**
 * Attempt to write with automatic cleanup on quota exceeded.
 * Story 14c.11 AC5: Graceful handling with retry after cleanup
 *
 * @param db IndexedDB instance
 * @param groupId Shared group ID
 * @param transactions Transactions to cache
 * @returns Result including whether quota was hit and handled
 */
export async function writeToCacheWithRetry(
    db: IDBDatabase,
    groupId: string,
    transactions: SharedGroupTransaction[]
): Promise<WriteCacheResult> {
    const result = await writeToCache(db, groupId, transactions);

    // If quota exceeded, try cleanup and retry once
    if (result.quotaExceeded) {
        try {
            await cleanupOldCacheEntries(db, true);
            // Retry the write
            const retryResult = await writeToCache(db, groupId, transactions);
            return {
                ...retryResult,
                quotaExceeded: true, // Keep flag so caller knows quota was hit
            };
        } catch (retryErr) {
            console.warn('[sharedGroupCache] Retry after cleanup failed:', retryErr);
            return { success: false, quotaExceeded: true, writtenCount: 0 };
        }
    }

    return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract milliseconds from various date formats.
 */
function extractDateMillis(date: unknown): number {
    if (!date) return 0;

    // String date (YYYY-MM-DD)
    if (typeof date === 'string') {
        return new Date(date).getTime();
    }

    // Firestore Timestamp
    if (typeof date === 'object' && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
        return (date as { toDate: () => Date }).toDate().getTime();
    }

    // Already a Date
    if (date instanceof Date) {
        return date.getTime();
    }

    return 0;
}
