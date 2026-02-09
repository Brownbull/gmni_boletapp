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
} from 'firebase/firestore'
import { ItemNameMapping, NewItemNameMapping } from '../types/itemNameMapping'
import { LISTENER_LIMITS } from './firestore'
import { sanitizeItemName } from '@/utils/sanitize'

/**
 * Get the collection path for a user's item name mappings
 */
function getMappingsCollectionPath(appId: string, userId: string): string {
    return `artifacts/${appId}/users/${userId}/item_name_mappings`
}

/**
 * Normalize an item name for fuzzy matching
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters except alphanumeric and spaces
 * - Collapse multiple spaces
 *
 * Same logic as normalizeMerchantName for consistency.
 */
export function normalizeItemName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
}

/**
 * Create or update an item name mapping
 * If a mapping with the same normalizedMerchant + normalizedItemName already exists, it will be updated (upsert)
 */
export async function saveItemNameMapping(
    db: Firestore,
    userId: string,
    appId: string,
    mapping: NewItemNameMapping
): Promise<string> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)
    const sanitizedMapping = {
        ...mapping,
        targetItemName: sanitizeItemName(mapping.targetItemName),
    }

    // Check if mapping with same normalizedMerchant + normalizedItemName already exists
    // Compound query for upsert by merchant scope + item name
    const q = query(
        mappingsRef,
        where('normalizedMerchant', '==', mapping.normalizedMerchant),
        where('normalizedItemName', '==', mapping.normalizedItemName),
        limit(1)
    )
    const existingDocs = await getDocs(q)

    if (!existingDocs.empty) {
        // Update existing mapping
        const existingDoc = existingDocs.docs[0]
        await updateDoc(existingDoc.ref, {
            ...sanitizedMapping,
            updatedAt: serverTimestamp()
        })
        return existingDoc.id
    }

    // Create new mapping
    const docRef = await addDoc(mappingsRef, {
        ...sanitizedMapping,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    })
    return docRef.id
}

/**
 * Get all item name mappings for a user
 */
export async function getItemNameMappings(
    db: Firestore,
    userId: string,
    appId: string
): Promise<ItemNameMapping[]> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)

    // Add limit to reduce reads for one-time fetches
    const q = query(mappingsRef, limit(LISTENER_LIMITS.MAPPINGS))
    const snapshot = await getDocs(q)

    // Warn if user has reached the limit
    if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.MAPPINGS) {
        console.warn(
            `[itemNameMappingService] getItemNameMappings: ${snapshot.size} docs at limit ` +
                '- user has reached mapping limit'
        )
    }

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ItemNameMapping))
}

/**
 * Get item name mappings for a specific merchant (used during scan processing)
 * Returns mappings scoped to the given normalized merchant name
 */
export async function getItemNameMappingsForMerchant(
    db: Firestore,
    userId: string,
    appId: string,
    normalizedMerchant: string
): Promise<ItemNameMapping[]> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)

    // Query by normalizedMerchant, order by usageCount to prioritize most-used
    const q = query(
        mappingsRef,
        where('normalizedMerchant', '==', normalizedMerchant),
        orderBy('usageCount', 'desc'),
        limit(LISTENER_LIMITS.MAPPINGS)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ItemNameMapping))
}

/**
 * Subscribe to item name mappings (real-time updates)
 * LIMITED to 500 mappings to reduce Firestore reads
 */
export function subscribeToItemNameMappings(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (mappings: ItemNameMapping[]) => void
): Unsubscribe {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)

    // Add limit to reduce Firestore reads
    // Order by usageCount desc to prioritize most-used mappings
    const q = query(
        mappingsRef,
        orderBy('usageCount', 'desc'),
        limit(LISTENER_LIMITS.MAPPINGS)
    )

    return onSnapshot(q, (snapshot) => {
        const mappings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ItemNameMapping))

        // Dev-mode logging for snapshot size monitoring
        if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.MAPPINGS) {
            console.warn(
                `[itemNameMappingService] subscribeToItemNameMappings: ${snapshot.size} docs at limit ` +
                    '- user has exceeded typical mapping count'
            )
        }

        callback(mappings)
    })
}

/**
 * Delete an item name mapping
 */
export async function deleteItemNameMapping(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const docRef = doc(db, collectionPath, mappingId)
    return deleteDoc(docRef)
}

/**
 * Increment the usage count for a mapping (when auto-applied)
 */
export async function incrementItemNameMappingUsage(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const docRef = doc(db, collectionPath, mappingId)
    return updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: serverTimestamp()
    })
}

/**
 * Update an item name mapping's target item name
 * v9.7.0: Edit functionality for Settings UI
 */
export async function updateItemNameMappingTarget(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string,
    newTargetItemName: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const docRef = doc(db, collectionPath, mappingId)
    return updateDoc(docRef, {
        targetItemName: sanitizeItemName(newTargetItemName),
        updatedAt: serverTimestamp()
    })
}
