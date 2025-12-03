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
    query,
    where,
    increment
} from 'firebase/firestore';
import { CategoryMapping, NewCategoryMapping } from '../types/categoryMapping';

/**
 * Get the collection path for a user's category mappings
 */
function getMappingsCollectionPath(appId: string, userId: string): string {
    return `artifacts/${appId}/users/${userId}/category_mappings`;
}

/**
 * Normalize an item name for fuzzy matching
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters except alphanumeric and spaces
 */
export function normalizeItemName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ');
}

/**
 * Create or update a category mapping
 * If a mapping with the same normalizedItem already exists, it will be updated
 */
export async function saveCategoryMapping(
    db: Firestore,
    userId: string,
    appId: string,
    mapping: NewCategoryMapping
): Promise<string> {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const mappingsRef = collection(db, collectionPath);

    // Check if mapping with same normalizedItem already exists
    const q = query(mappingsRef, where('normalizedItem', '==', mapping.normalizedItem));
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
        // Update existing mapping
        const existingDoc = existingDocs.docs[0];
        await updateDoc(existingDoc.ref, {
            ...mapping,
            updatedAt: serverTimestamp()
        });
        return existingDoc.id;
    }

    // Create new mapping
    const docRef = await addDoc(mappingsRef, {
        ...mapping,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}

/**
 * Get all category mappings for a user
 */
export async function getCategoryMappings(
    db: Firestore,
    userId: string,
    appId: string
): Promise<CategoryMapping[]> {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const mappingsRef = collection(db, collectionPath);
    const snapshot = await getDocs(mappingsRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CategoryMapping));
}

/**
 * Subscribe to category mappings (real-time updates)
 */
export function subscribeToCategoryMappings(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (mappings: CategoryMapping[]) => void
): Unsubscribe {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const mappingsRef = collection(db, collectionPath);

    return onSnapshot(mappingsRef, (snapshot) => {
        const mappings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CategoryMapping));
        callback(mappings);
    });
}

/**
 * Delete a category mapping
 */
export async function deleteCategoryMapping(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, mappingId);
    return deleteDoc(docRef);
}

/**
 * Increment the usage count for a mapping (when auto-applied)
 */
export async function incrementMappingUsage(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, mappingId);
    return updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: serverTimestamp()
    });
}
