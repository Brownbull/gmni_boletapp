/**
 * Generic Mapping Service Base
 *
 * Story 15-1c: Eliminates ~600 lines of duplicated CRUD logic across
 * 4 mapping services (merchant, category, subcategory, itemName).
 *
 * Each service provides a MappingConfig, and this module provides
 * the 6 standard operations: save (upsert), get, subscribe, delete,
 * incrementUsage, updateTarget.
 */

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
    increment,
} from 'firebase/firestore';
import { LISTENER_LIMITS } from './firestore';

// =============================================================================
// Configuration Interface
// =============================================================================

export interface MappingConfig {
    /** Collection path builder */
    collectionPath: (appId: string, userId: string) => string;
    /** Service name for dev-mode warnings */
    serviceName: string;
    /** Primary key field for upsert lookups (e.g. 'normalizedMerchant') */
    primaryKeyField: string;
    /** Secondary key field for compound upsert (e.g. 'normalizedItemName') */
    secondaryKeyField?: string;
    /** Target field name (e.g. 'targetMerchant') */
    targetField: string;
    /** Optional sanitizer for the target value on save/update */
    sanitizeTarget?: (value: string) => string;
}

// =============================================================================
// Generic Normalize (Story 15-1d: shared by all 4 services)
// =============================================================================

/**
 * Normalize a name for fuzzy matching.
 * Identical logic used by merchant, category, subcategory, and itemName services.
 */
export function normalizeForMapping(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ');
}

// =============================================================================
// Generic CRUD Operations
// =============================================================================

/**
 * Save (upsert) a mapping document.
 * If a document with the same primary key (and optional secondary key) exists,
 * it will be updated. Otherwise, a new document is created.
 */
export async function saveMapping<T extends Record<string, unknown>>(
    db: Firestore,
    userId: string,
    appId: string,
    mapping: T,
    config: MappingConfig
): Promise<string> {
    const collRef = collection(db, config.collectionPath(appId, userId));

    // Sanitize target field if configured
    const data = config.sanitizeTarget
        ? { ...mapping, [config.targetField]: config.sanitizeTarget(mapping[config.targetField] as string) }
        : { ...mapping };

    // Build upsert query
    const filters = [
        where(config.primaryKeyField, '==', mapping[config.primaryKeyField]),
    ];
    if (config.secondaryKeyField) {
        filters.push(where(config.secondaryKeyField, '==', mapping[config.secondaryKeyField]));
    }

    const existingDocs = await getDocs(query(collRef, ...filters, limit(1)));

    if (!existingDocs.empty) {
        const existingDoc = existingDocs.docs[0];
        await updateDoc(existingDoc.ref, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return existingDoc.id;
    }

    const docRef = await addDoc(collRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Get all mappings for a user (one-time fetch).
 */
export async function getMappings<T>(
    db: Firestore,
    userId: string,
    appId: string,
    config: MappingConfig
): Promise<T[]> {
    const collRef = collection(db, config.collectionPath(appId, userId));
    const q = query(collRef, limit(LISTENER_LIMITS.MAPPINGS));
    const snapshot = await getDocs(q);

    if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.MAPPINGS) {
        console.warn(
            `[${config.serviceName}] getMappings: ${snapshot.size} docs at limit - user has reached mapping limit`
        );
    }

    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as T[];
}

/**
 * Get mappings filtered by a specific field value (one-time fetch).
 */
export async function getMappingsFiltered<T>(
    db: Firestore,
    userId: string,
    appId: string,
    filterField: string,
    filterValue: string,
    config: MappingConfig
): Promise<T[]> {
    const collRef = collection(db, config.collectionPath(appId, userId));
    const q = query(
        collRef,
        where(filterField, '==', filterValue),
        orderBy('usageCount', 'desc'),
        limit(LISTENER_LIMITS.MAPPINGS)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as T[];
}

/**
 * Subscribe to mappings (real-time updates), ordered by usageCount desc.
 */
export function subscribeToMappings<T>(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (mappings: T[]) => void,
    config: MappingConfig
): Unsubscribe {
    const collRef = collection(db, config.collectionPath(appId, userId));
    const q = query(
        collRef,
        orderBy('usageCount', 'desc'),
        limit(LISTENER_LIMITS.MAPPINGS)
    );

    return onSnapshot(q, (snapshot) => {
        const mappings = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
        })) as T[];

        if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.MAPPINGS) {
            console.warn(
                `[${config.serviceName}] subscribeToMappings: ${snapshot.size} docs at limit - user has exceeded typical mapping count`
            );
        }

        callback(mappings);
    });
}

/**
 * Delete a mapping document.
 */
export async function deleteMapping(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string,
    config: MappingConfig
): Promise<void> {
    const docRef = doc(db, config.collectionPath(appId, userId), mappingId);
    return deleteDoc(docRef);
}

/**
 * Increment the usage count for a mapping.
 */
export async function incrementMappingUsageBase(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string,
    config: MappingConfig
): Promise<void> {
    const docRef = doc(db, config.collectionPath(appId, userId), mappingId);
    return updateDoc(docRef, {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Update a mapping's target field value.
 */
export async function updateMappingTarget(
    db: Firestore,
    userId: string,
    appId: string,
    mappingId: string,
    newTarget: string,
    config: MappingConfig
): Promise<void> {
    const docRef = doc(db, config.collectionPath(appId, userId), mappingId);
    const value = config.sanitizeTarget ? config.sanitizeTarget(newTarget) : newTarget;
    return updateDoc(docRef, {
        [config.targetField]: value,
        updatedAt: serverTimestamp(),
    });
}
