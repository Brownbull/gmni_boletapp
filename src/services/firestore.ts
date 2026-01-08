import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    Firestore,
    Unsubscribe,
    getDocs,
    writeBatch,
    query,
    orderBy,
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData,
} from 'firebase/firestore';
import { Transaction } from '../types/transaction';

/**
 * Removes undefined values from an object (Firestore doesn't accept undefined).
 * Recursively cleans nested objects and arrays.
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
            continue; // Skip undefined values
        }
        if (Array.isArray(value)) {
            // Recursively clean array items if they're objects
            cleaned[key] = value.map(item =>
                item && typeof item === 'object' && !Array.isArray(item)
                    ? removeUndefined(item as Record<string, unknown>)
                    : item
            );
        } else if (value && typeof value === 'object' && !(value instanceof Date)) {
            // Recursively clean nested objects (but not Date or Timestamp)
            cleaned[key] = removeUndefined(value as Record<string, unknown>);
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned as Partial<T>;
}

export async function addTransaction(
    db: Firestore,
    userId: string,
    appId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
    // Clean undefined values before sending to Firestore
    const cleanedTransaction = removeUndefined(transaction as Record<string, unknown>);
    const docRef = await addDoc(
        collection(db, 'artifacts', appId, 'users', userId, 'transactions'),
        { ...cleanedTransaction, createdAt: serverTimestamp() }
    );
    return docRef.id;
}

export async function updateTransaction(
    db: Firestore,
    userId: string,
    appId: string,
    transactionId: string,
    updates: Partial<Transaction>
): Promise<void> {
    // Clean undefined values before sending to Firestore
    const cleanedUpdates = removeUndefined(updates as Record<string, unknown>);
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', transactionId);
    return updateDoc(docRef, { ...cleanedUpdates, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(
    db: Firestore,
    userId: string,
    appId: string,
    transactionId: string
): Promise<void> {
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', transactionId);
    return deleteDoc(docRef);
}

/**
 * Listener limit constants for Firestore cost optimization.
 * Story 14.25: Reduce read costs by limiting real-time listener snapshots.
 *
 * Expected cost savings:
 * - User with 500 txns: 5,000 reads/day → 100 reads/day (98% reduction)
 */
export const LISTENER_LIMITS = {
    /** Transaction listener: 100 most recent transactions */
    TRANSACTIONS: 100,
    /** Groups listener: 50 groups (most users have <20) */
    GROUPS: 50,
    /** Trusted merchants listener: 200 merchants */
    TRUSTED_MERCHANTS: 200,
    /** Mapping listeners: 500 mappings each */
    MAPPINGS: 500,
} as const;

/**
 * Subscribe to user's transactions with real-time updates.
 *
 * Story 14.25: LIMITED to most recent 100 transactions by date (desc).
 * For full history, use pagination via History View (Story 14.27).
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param callback Callback receiving limited transaction list
 * @returns Unsubscribe function
 */
export function subscribeToTransactions(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (transactions: Transaction[]) => void
): Unsubscribe {
    const collectionRef = collection(db, 'artifacts', appId, 'users', userId, 'transactions');

    // Story 14.25: Add orderBy + limit to reduce Firestore reads
    const q = query(
        collectionRef,
        orderBy('date', 'desc'),
        limit(LISTENER_LIMITS.TRANSACTIONS)
    );

    return onSnapshot(q, (snapshot) => {
        const txs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));

        // Dev-mode logging for snapshot size monitoring (AC #6)
        if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.TRANSACTIONS) {
            console.warn(
                `[firestore] subscribeToTransactions: ${snapshot.size} docs at limit ` +
                    '- pagination needed for full history (see Story 14.27)'
            );
        }

        callback(txs);
    });
}

/**
 * Wipe all transactions for a user.
 * Story 14.26: Uses writeBatch with chunking for atomic, cost-efficient deletion.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 */
export async function wipeAllTransactions(
    db: Firestore,
    userId: string,
    appId: string
): Promise<void> {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'transactions');
    const snap = await getDocs(q);

    if (snap.empty) return;

    // Story 14.26: Use writeBatch with chunking (500 ops per batch)
    const BATCH_SIZE = 500;
    const docs = snap.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

/**
 * Story 14.15: Delete multiple transactions in a batch.
 * Uses Firestore writeBatch for atomic deletion.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param transactionIds Array of transaction IDs to delete
 */
export async function deleteTransactionsBatch(
    db: Firestore,
    userId: string,
    appId: string,
    transactionIds: string[]
): Promise<void> {
    if (transactionIds.length === 0) return;

    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 500;

    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
        const chunk = transactionIds.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const txId of chunk) {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', txId);
            batch.delete(docRef);
        }

        await batch.commit();
    }
}

/**
 * Story 14.15: Update multiple transactions in a batch.
 * Uses Firestore writeBatch for atomic updates.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param transactionIds Array of transaction IDs to update
 * @param updates Partial transaction data to apply to all
 */
export async function updateTransactionsBatch(
    db: Firestore,
    userId: string,
    appId: string,
    transactionIds: string[],
    updates: Partial<Transaction>
): Promise<void> {
    if (transactionIds.length === 0) return;

    // Clean undefined values
    const cleanedUpdates = removeUndefined(updates as Record<string, unknown>);

    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 500;

    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
        const chunk = transactionIds.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const txId of chunk) {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', txId);
            batch.update(docRef, { ...cleanedUpdates, updatedAt: serverTimestamp() });
        }

        await batch.commit();
    }
}

/**
 * Story 14.27: Pagination page size for transaction history.
 * Used by getTransactionPage for cursor-based pagination.
 */
export const PAGINATION_PAGE_SIZE = 50;

/**
 * Story 14.27: Result type for paginated transaction queries.
 * Includes transactions and cursor for next page.
 */
export interface TransactionPage {
    /** Transactions for this page */
    transactions: Transaction[];
    /** Last document snapshot for cursor-based pagination (null if no more pages) */
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    /** Whether more pages are available */
    hasMore: boolean;
}

/**
 * Story 14.27: Fetch a page of transactions with cursor-based pagination.
 *
 * This function is used to load older transactions beyond the
 * real-time listener limit (LISTENER_LIMITS.TRANSACTIONS = 100).
 *
 * Pagination uses Firestore's startAfter for efficient cursor-based navigation:
 * - First page: Pass undefined for cursor
 * - Subsequent pages: Pass lastDoc from previous page
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param cursor Last document snapshot from previous page (undefined for first page)
 * @param pageSize Number of transactions to fetch (default: PAGINATION_PAGE_SIZE)
 * @returns TransactionPage with transactions, lastDoc cursor, and hasMore flag
 *
 * @example
 * ```ts
 * // First page
 * const page1 = await getTransactionPage(db, userId, appId);
 *
 * // Next page using cursor
 * const page2 = await getTransactionPage(db, userId, appId, page1.lastDoc);
 * ```
 */
export async function getTransactionPage(
    db: Firestore,
    userId: string,
    appId: string,
    cursor?: QueryDocumentSnapshot<DocumentData> | null,
    pageSize: number = PAGINATION_PAGE_SIZE
): Promise<TransactionPage> {
    const collectionRef = collection(db, 'artifacts', appId, 'users', userId, 'transactions');

    // Build query with orderBy and limit
    // Request one extra document to check if more pages exist
    const baseConstraints = [
        orderBy('date', 'desc'),
        limit(pageSize + 1),
    ];

    // Add cursor constraint if provided (for pages beyond the first)
    const constraints = cursor
        ? [...baseConstraints.slice(0, 1), startAfter(cursor), baseConstraints[1]]
        : baseConstraints;

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    // Check if we got more than pageSize (indicates more pages available)
    const hasMore = snapshot.docs.length > pageSize;

    // Take only pageSize documents (exclude the extra one used for hasMore check)
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const transactions = docs.map(d => ({
        id: d.id,
        ...d.data()
    } as Transaction));

    // Last document for next page cursor (null if no more pages)
    const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

    // Dev-mode logging for pagination monitoring
    if (import.meta.env.DEV) {
        console.log(
            `[firestore] getTransactionPage: fetched ${transactions.length} docs, ` +
            `hasMore=${hasMore}, cursor=${cursor ? 'yes' : 'no'}`
        );
    }

    return {
        transactions,
        lastDoc,
        hasMore,
    };
}
