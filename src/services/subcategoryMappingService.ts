/**
 * Subcategory Mapping Service
 *
 * Story 15-1c: Thin wrapper over mappingServiceBase.
 */

import { Firestore, Unsubscribe } from 'firebase/firestore';
import { SubcategoryMapping, NewSubcategoryMapping } from '../types/subcategoryMapping';
import { sanitizeSubcategory } from '@/utils/sanitize';
import { subcategoryMappingsPath } from '@/lib/firestorePaths';
import {
    type MappingConfig,
    normalizeForMapping,
    saveMapping,
    getMappings,
    subscribeToMappings,
    deleteMapping,
    incrementMappingUsageBase,
    updateMappingTarget,
} from './mappingServiceBase';

const config: MappingConfig = {
    collectionPath: subcategoryMappingsPath,
    serviceName: 'subcategoryMappingService',
    primaryKeyField: 'normalizedItem',
    targetField: 'targetSubcategory',
    sanitizeTarget: sanitizeSubcategory,
};

/** Normalize an item name for fuzzy matching */
export const normalizeItemName = normalizeForMapping;

export async function saveSubcategoryMapping(
    db: Firestore, userId: string, appId: string, mapping: NewSubcategoryMapping
): Promise<string> {
    return saveMapping(db, userId, appId, mapping, config);
}

export async function getSubcategoryMappings(
    db: Firestore, userId: string, appId: string
): Promise<SubcategoryMapping[]> {
    return getMappings<SubcategoryMapping>(db, userId, appId, config);
}

export function subscribeToSubcategoryMappings(
    db: Firestore, userId: string, appId: string, callback: (mappings: SubcategoryMapping[]) => void
): Unsubscribe {
    return subscribeToMappings<SubcategoryMapping>(db, userId, appId, callback, config);
}

export async function deleteSubcategoryMapping(
    db: Firestore, userId: string, appId: string, mappingId: string
): Promise<void> {
    return deleteMapping(db, userId, appId, mappingId, config);
}

export async function updateSubcategoryMappingTarget(
    db: Firestore, userId: string, appId: string, mappingId: string, newTargetSubcategory: string
): Promise<void> {
    return updateMappingTarget(db, userId, appId, mappingId, newTargetSubcategory, config);
}

export async function incrementSubcategoryMappingUsage(
    db: Firestore, userId: string, appId: string, mappingId: string
): Promise<void> {
    return incrementMappingUsageBase(db, userId, appId, mappingId, config);
}
