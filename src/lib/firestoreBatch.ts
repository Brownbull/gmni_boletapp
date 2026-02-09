/**
 * Firestore Batch Operations Utility
 *
 * Story 15-1f: Centralized auto-chunking for writeBatch operations.
 * Firestore silently fails above 500 operations per batch.
 *
 * @example
 * ```typescript
 * await batchDelete(db, refs);
 * await batchWrite(db, items, (batch, item) => batch.set(ref, item));
 * ```
 */

import { writeBatch, Firestore, DocumentReference } from 'firebase/firestore';

export const FIRESTORE_BATCH_LIMIT = 500;

/**
 * Delete documents in auto-chunked batches of 500.
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
        await batch.commit();
    }
}

/**
 * Write documents in auto-chunked batches of 500.
 * The callback receives the batch and each item, so you can call
 * batch.set(), batch.update(), or batch.delete() as needed.
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
        await batch.commit();
    }
}
