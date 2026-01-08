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
    limit,
    orderBy,
    increment
} from 'firebase/firestore';
import { CategoryMapping, NewCategoryMapping } from '../types/categoryMapping';
import { LISTENER_LIMITS } from './firestore';

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
    // Story 14.26: Add limit(1) to reduce reads - we only need one match
    const q = query(
        mappingsRef,
        where('normalizedItem', '==', mapping.normalizedItem),
        limit(1)
    );
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

    // Story 14.26: Add limit to reduce reads for one-time fetches
    const q = query(mappingsRef, limit(LISTENER_LIMITS.MAPPINGS));
    const snapshot = await getDocs(q);

    // Warn if user has reached the limit
    if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.MAPPINGS) {
        console.warn(
            `[categoryMappingService] getCategoryMappings: ${snapshot.size} docs at limit ` +
                '- user has reached mapping limit'
        );
    }

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CategoryMapping));
}

/**
 * Subscribe to category mappings (real-time updates)
 * Story 14.25: LIMITED to 500 mappings to reduce Firestore reads
 */
export function subscribeToCategoryMappings(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (mappings: CategoryMapping[]) => void
): Unsubscribe {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const mappingsRef = collection(db, collectionPath);

    // Story 14.25: Add limit to reduce Firestore reads
    // Order by usageCount desc to prioritize most-used mappings
    const q = query(
        mappingsRef,
        orderBy('usageCount', 'desc'),
        limit(LISTENER_LIMITS.MAPPINGS)
    );

    return onSnapshot(q, (snapshot) => {
        const mappings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CategoryMapping));

        // Dev-mode logging for snapshot size monitoring (AC #6)
        if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.MAPPINGS) {
            console.warn(
                `[categoryMappingService] subscribeToCategoryMappings: ${snapshot.size} docs at limit ` +
                    '- user has exceeded typical mapping count'
            );
        }

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

/**
 * Update a category mapping's target category
 * Story 9.7 enhancement: Edit functionality for Settings UI
 */
export async function updateCategoryMappingTarget(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string,
    newTargetCategory: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, mappingId);
    return updateDoc(docRef, {
        targetCategory: newTargetCategory,
        updatedAt: serverTimestamp()
    });
}
