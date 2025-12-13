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
    getDocs
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

export function subscribeToTransactions(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (transactions: Transaction[]) => void
): Unsubscribe {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'transactions');
    return onSnapshot(q, (snapshot) => {
        const txs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
        callback(txs);
    });
}

export async function wipeAllTransactions(
    db: Firestore,
    userId: string,
    appId: string
): Promise<void> {
    const q = collection(db, 'artifacts', appId, 'users', userId, 'transactions');
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}
