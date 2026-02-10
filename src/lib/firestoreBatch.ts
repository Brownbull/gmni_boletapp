/**
 * Firestore Batch Operations Utility
 *
 * Story 15-1f: Centralized auto-chunking for writeBatch operations.
 * Story 15-TD-2: Added retry with exponential backoff on commit failures.
 *
 * Firestore silently fails above 500 operations per batch. This utility
 * auto-chunks operations and retries failed commits once with a 1s delay.
 *
 * **Partial-commit behavior:** When processing >500 documents, operations
 * are split into chunks. If chunk 1 succeeds but chunk 2 fails, chunk 1's
 * writes are already committed. Callers should design for idempotent retries.
 *
 * @example
 * ```typescript
 * await batchDelete(db, refs);
 * await batchWrite(db, items, (batch, item) => batch.set(ref, item));
 * ```
 */

import { writeBatch, Firestore, DocumentReference } from 'firebase/firestore';

export const FIRESTORE_BATCH_LIMIT = 500;

/** Base delay for exponential backoff (milliseconds) */
const RETRY_BASE_DELAY_MS = 1000;

/** Maximum number of retry attempts per chunk */
const MAX_RETRIES = 1;

/** Firestore error codes that are transient and worth retrying */
const RETRYABLE_CODES = ['unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted'];

/**
 * Commit a batch with retry and exponential backoff.
 * Only retries on transient Firestore errors (unavailable, deadline-exceeded, etc.).
 * Permanent errors (permission-denied, not-found) are thrown immediately.
 */
async function commitWithRetry(batch: ReturnType<typeof writeBatch>): Promise<void> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await batch.commit();
            return;
        } catch (error: unknown) {
            const code = (error as { code?: string })?.code;
            const isRetryable = code && RETRYABLE_CODES.includes(code);
            if (attempt < MAX_RETRIES && isRetryable) {
                const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}

/**
 * Delete documents in auto-chunked batches of 500.
 * Each chunk is committed with retry/backoff on failure.
 *
 * **Partial-commit warning:** If deleting 1500 docs across 3 chunks,
 * chunks 1-2 may succeed while chunk 3 fails. Already-committed deletes
 * are not rolled back.
 */
export async function batchDelete(
    db: Firestore,
    refs: DocumentReference[]
): Promise<void> {
    for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
        const chunk = refs.slice(i, i + FIRESTORE_BATCH_LIMIT);
        const batch = writeBatch(db);
        for (const ref of chunk) {
            batch.delete(ref);
        }
        await commitWithRetry(batch);
    }
}

/**
 * Write documents in auto-chunked batches of 500.
 * The callback receives the batch and each item, so you can call
 * batch.set(), batch.update(), or batch.delete() as needed.
 * Each chunk is committed with retry/backoff on failure.
 *
 * **Partial-commit warning:** If writing 1500 docs across 3 chunks,
 * chunks 1-2 may succeed while chunk 3 fails. Already-committed writes
 * are not rolled back.
 */
export async function batchWrite<T>(
    db: Firestore,
    items: T[],
    operation: (batch: ReturnType<typeof writeBatch>, item: T) => void
): Promise<void> {
    for (let i = 0; i < items.length; i += FIRESTORE_BATCH_LIMIT) {
        const chunk = items.slice(i, i + FIRESTORE_BATCH_LIMIT);
        const batch = writeBatch(db);
        for (const item of chunk) {
            operation(batch, item);
        }
        await commitWithRetry(batch);
    }
}
