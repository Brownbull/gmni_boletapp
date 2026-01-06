/**
 * Transaction Group Service
 *
 * Story 14.15: Transaction Selection Mode & Groups
 * Epic 14: Core Implementation
 *
 * Firestore CRUD operations for user-defined transaction groups.
 * Groups are stored in: artifacts/{appId}/users/{userId}/transaction_groups
 *
 * @example
 * ```typescript
 * // Create a new group
 * const groupId = await createGroup(db, userId, appId, { name: '🎄 Navidad 2024' });
 *
 * // Subscribe to groups
 * const unsubscribe = subscribeToGroups(db, userId, appId, (groups) => {
 *   console.log('Groups updated:', groups);
 * });
 * ```
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    Firestore,
    Unsubscribe,
    increment,
    writeBatch,
} from 'firebase/firestore';
import type {
    TransactionGroup,
    CreateTransactionGroupInput,
    UpdateTransactionGroupInput,
} from '../types/transactionGroup';

/**
 * Get the collection path for a user's transaction groups
 */
function getGroupsCollectionPath(appId: string, userId: string): string {
    return `artifacts/${appId}/users/${userId}/transaction_groups`;
}

/**
 * Create a new transaction group.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param input Group creation data (name, optional currency)
 * @returns The created group's document ID
 */
export async function createGroup(
    db: Firestore,
    userId: string,
    appId: string,
    input: CreateTransactionGroupInput
): Promise<string> {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const collectionRef = collection(db, collectionPath);

    const groupData = {
        name: input.name.trim(),
        color: input.color || '#10b981', // Default emerald color
        transactionCount: 0,
        totalAmount: 0,
        currency: input.currency || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, groupData);
    return docRef.id;
}

/**
 * Get a single group by ID.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group document ID
 * @returns The group data or null if not found
 */
export async function getGroup(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string
): Promise<TransactionGroup | null> {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, groupId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    } as TransactionGroup;
}

/**
 * Get all groups for a user.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @returns Array of all user's groups, ordered by creation date (newest first)
 */
export async function getGroups(
    db: Firestore,
    userId: string,
    appId: string
): Promise<TransactionGroup[]> {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as TransactionGroup[];
}

/**
 * Subscribe to real-time updates of user's groups.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param onUpdate Callback when groups change
 * @param onError Optional error callback
 * @returns Unsubscribe function
 */
export function subscribeToGroups(
    db: Firestore,
    userId: string,
    appId: string,
    onUpdate: (groups: TransactionGroup[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
        q,
        (snapshot) => {
            const groups = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as TransactionGroup[];
            onUpdate(groups);
        },
        (error) => {
            console.error('[groupService] Subscription error:', error);
            onError?.(error);
        }
    );
}

/**
 * Update a group's metadata (name, currency).
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group document ID
 * @param updates Fields to update
 */
export async function updateGroup(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string,
    updates: UpdateTransactionGroupInput
): Promise<void> {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, groupId);

    const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
    }
    if (updates.currency !== undefined) {
        updateData.currency = updates.currency;
    }
    if (updates.color !== undefined) {
        updateData.color = updates.color;
    }

    await updateDoc(docRef, updateData);
}

/**
 * Delete a group.
 *
 * Note: This does NOT remove the groupId from transactions.
 * Caller should use clearGroupFromTransactions() first or after.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group document ID
 */
export async function deleteGroup(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string
): Promise<void> {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, groupId);
    await deleteDoc(docRef);
}

/**
 * Increment the transaction count and total for a group.
 * Used when assigning transactions to a group.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group document ID
 * @param countDelta Amount to add/subtract from transaction count
 * @param amountDelta Amount to add/subtract from total
 */
export async function updateGroupCounts(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string,
    countDelta: number,
    amountDelta: number
): Promise<void> {
    const collectionPath = getGroupsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, groupId);

    await updateDoc(docRef, {
        transactionCount: increment(countDelta),
        totalAmount: increment(amountDelta),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get the transactions collection path for batch operations.
 * Used by assignTransactionsToGroup and related functions.
 */
export function getTransactionsCollectionPath(appId: string, userId: string): string {
    return `artifacts/${appId}/users/${userId}/transactions`;
}

/**
 * Assign multiple transactions to a group.
 * Updates both the transactions and the group's counts.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param transactionIds Array of transaction IDs to assign
 * @param groupId Target group ID
 * @param groupName Group name (denormalized on transactions)
 * @param groupColor Group color (denormalized on transactions for display)
 * @param transactionTotals Map of transactionId -> total amount (for updating group totals)
 */
export async function assignTransactionsToGroup(
    db: Firestore,
    userId: string,
    appId: string,
    transactionIds: string[],
    groupId: string,
    groupName: string,
    groupColor: string,
    transactionTotals: Map<string, number>
): Promise<void> {
    const transactionsPath = getTransactionsCollectionPath(appId, userId);
    const batch = writeBatch(db);

    // Update each transaction
    for (const txId of transactionIds) {
        const txRef = doc(db, transactionsPath, txId);
        batch.update(txRef, {
            groupId,
            groupName,
            groupColor,
            updatedAt: serverTimestamp(),
        });
    }

    // Calculate total amount for group update
    let totalAmount = 0;
    for (const txId of transactionIds) {
        totalAmount += transactionTotals.get(txId) || 0;
    }

    // Update group counts
    const groupPath = getGroupsCollectionPath(appId, userId);
    const groupRef = doc(db, groupPath, groupId);
    batch.update(groupRef, {
        transactionCount: increment(transactionIds.length),
        totalAmount: increment(totalAmount),
        updatedAt: serverTimestamp(),
    });

    await batch.commit();
}

/**
 * Remove transactions from their current group (set groupId/groupName to null).
 * Also decrements the group's counts.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param transactionIds Array of transaction IDs to unassign
 * @param groupId Current group ID to decrement counts from
 * @param transactionTotals Map of transactionId -> total amount (for updating group totals)
 */
export async function removeTransactionsFromGroup(
    db: Firestore,
    userId: string,
    appId: string,
    transactionIds: string[],
    groupId: string,
    transactionTotals: Map<string, number>
): Promise<void> {
    const transactionsPath = getTransactionsCollectionPath(appId, userId);
    const batch = writeBatch(db);

    // Update each transaction
    for (const txId of transactionIds) {
        const txRef = doc(db, transactionsPath, txId);
        batch.update(txRef, {
            groupId: null,
            groupName: null,
            groupColor: null,
            updatedAt: serverTimestamp(),
        });
    }

    // Calculate total amount for group update
    let totalAmount = 0;
    for (const txId of transactionIds) {
        totalAmount += transactionTotals.get(txId) || 0;
    }

    // Decrement group counts
    const groupPath = getGroupsCollectionPath(appId, userId);
    const groupRef = doc(db, groupPath, groupId);
    batch.update(groupRef, {
        transactionCount: increment(-transactionIds.length),
        totalAmount: increment(-totalAmount),
        updatedAt: serverTimestamp(),
    });

    await batch.commit();
}

/**
 * Clear groupId from all transactions when a group is deleted.
 * This is called before or after deleteGroup() based on design decision.
 *
 * Note: This uses sequential updates since transactions may be many.
 * For large numbers of transactions, consider a Cloud Function.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group ID being deleted
 * @param transactionIds Array of transaction IDs to clear (should be pre-filtered)
 */
export async function clearGroupFromTransactions(
    db: Firestore,
    userId: string,
    appId: string,
    transactionIds: string[]
): Promise<void> {
    const transactionsPath = getTransactionsCollectionPath(appId, userId);

    // Use batch for efficiency (max 500 per batch in Firestore)
    const BATCH_SIZE = 500;
    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
        const chunk = transactionIds.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const txId of chunk) {
            const txRef = doc(db, transactionsPath, txId);
            batch.update(txRef, {
                groupId: null,
                groupName: null,
                groupColor: null,
                updatedAt: serverTimestamp(),
            });
        }

        await batch.commit();
    }
}

/**
 * Update the denormalized group name and color on all transactions in a group.
 * Call this after updating a group's name or color.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group ID
 * @param groupName New group name
 * @param groupColor New group color
 * @param transactionIds Array of transaction IDs in this group
 */
export async function updateGroupOnTransactions(
    db: Firestore,
    userId: string,
    appId: string,
    _groupId: string,
    groupName: string,
    groupColor: string,
    transactionIds: string[]
): Promise<void> {
    const transactionsPath = getTransactionsCollectionPath(appId, userId);

    // Use batch for efficiency (max 500 per batch in Firestore)
    const BATCH_SIZE = 500;
    for (let i = 0; i < transactionIds.length; i += BATCH_SIZE) {
        const chunk = transactionIds.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const txId of chunk) {
            const txRef = doc(db, transactionsPath, txId);
            batch.update(txRef, {
                groupName,
                groupColor,
                updatedAt: serverTimestamp(),
            });
        }

        await batch.commit();
    }
}

/**
 * Recalculate and fix a group's transactionCount and totalAmount
 * by counting actual transactions with that groupId.
 *
 * Use this to fix corrupted counts (e.g., from double-counting bugs).
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group ID to recalculate
 * @param transactions All user transactions to scan
 * @returns The corrected counts
 */
export async function recalculateGroupCounts(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string,
    transactions: Array<{ id: string; groupId?: string | null; total: number }>
): Promise<{ transactionCount: number; totalAmount: number }> {
    // Count actual transactions belonging to this group
    const groupTransactions = transactions.filter(tx => tx.groupId === groupId);
    const transactionCount = groupTransactions.length;
    const totalAmount = groupTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

    // Update the group document with correct counts
    const groupPath = getGroupsCollectionPath(appId, userId);
    const groupRef = doc(db, groupPath, groupId);

    await updateDoc(groupRef, {
        transactionCount,
        totalAmount,
        updatedAt: serverTimestamp(),
    });

    return { transactionCount, totalAmount };
}

/**
 * Recalculate counts for ALL groups.
 * Useful after data migration or to fix multiple corrupted groups.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groups All user groups
 * @param transactions All user transactions
 */
export async function recalculateAllGroupCounts(
    db: Firestore,
    userId: string,
    appId: string,
    groups: TransactionGroup[],
    transactions: Array<{ id: string; groupId?: string | null; total: number }>
): Promise<void> {
    const groupPath = getGroupsCollectionPath(appId, userId);
    const batch = writeBatch(db);

    for (const group of groups) {
        if (!group.id) continue;

        // Count actual transactions belonging to this group
        const groupTransactions = transactions.filter(tx => tx.groupId === group.id);
        const transactionCount = groupTransactions.length;
        const totalAmount = groupTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

        const groupRef = doc(db, groupPath, group.id);
        batch.update(groupRef, {
            transactionCount,
            totalAmount,
            updatedAt: serverTimestamp(),
        });
    }

    await batch.commit();
}
