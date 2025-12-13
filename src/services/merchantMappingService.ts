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
} from 'firebase/firestore'
import { MerchantMapping, NewMerchantMapping } from '../types/merchantMapping'

/**
 * Get the collection path for a user's merchant mappings
 */
function getMappingsCollectionPath(appId: string, userId: string): string {
    return `artifacts/${appId}/users/${userId}/merchant_mappings`
}

/**
 * Normalize a merchant name for fuzzy matching
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters except alphanumeric and spaces
 * - Collapse multiple spaces
 */
export function normalizeMerchantName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
}

/**
 * Create or update a merchant mapping
 * If a mapping with the same normalizedMerchant already exists, it will be updated (upsert)
 */
export async function saveMerchantMapping(
    db: Firestore,
    userId: string,
    appId: string,
    mapping: NewMerchantMapping
): Promise<string> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)

    // Check if mapping with same normalizedMerchant already exists
    const q = query(mappingsRef, where('normalizedMerchant', '==', mapping.normalizedMerchant))
    const existingDocs = await getDocs(q)

    if (!existingDocs.empty) {
        // Update existing mapping
        const existingDoc = existingDocs.docs[0]
        await updateDoc(existingDoc.ref, {
            ...mapping,
            updatedAt: serverTimestamp()
        })
        return existingDoc.id
    }

    // Create new mapping
    const docRef = await addDoc(mappingsRef, {
        ...mapping,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    })
    return docRef.id
}

/**
 * Get all merchant mappings for a user
 */
export async function getMerchantMappings(
    db: Firestore,
    userId: string,
    appId: string
): Promise<MerchantMapping[]> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)
    const snapshot = await getDocs(mappingsRef)

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MerchantMapping))
}

/**
 * Subscribe to merchant mappings (real-time updates)
 */
export function subscribeToMerchantMappings(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (mappings: MerchantMapping[]) => void
): Unsubscribe {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const mappingsRef = collection(db, collectionPath)

    return onSnapshot(mappingsRef, (snapshot) => {
        const mappings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MerchantMapping))
        callback(mappings)
    })
}

/**
 * Delete a merchant mapping
 */
export async function deleteMerchantMapping(
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
export async function incrementMerchantMappingUsage(
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
 * Update a merchant mapping's target merchant name
 * Story 9.7: AC#5 - Edit functionality for Settings UI
 */
export async function updateMerchantMappingTarget(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string,
    newTargetMerchant: string
): Promise<void> {
    const collectionPath = getMappingsCollectionPath(appId, userId)
    const docRef = doc(db, collectionPath, mappingId)
    return updateDoc(docRef, {
        targetMerchant: newTargetMerchant,
        updatedAt: serverTimestamp()
    })
}
