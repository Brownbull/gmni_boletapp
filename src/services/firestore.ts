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

export async function addTransaction(
    db: Firestore,
    userId: string,
    appId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
    const docRef = await addDoc(
        collection(db, 'artifacts', appId, 'users', userId, 'transactions'),
        { ...transaction, createdAt: serverTimestamp() }
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
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', transactionId);
    return updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
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
