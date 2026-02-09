/**
 * Category Mapping Service
 *
 * Story 15-1c: Thin wrapper over mappingServiceBase.
 */

import { Firestore, Unsubscribe } from 'firebase/firestore';
import { CategoryMapping, NewCategoryMapping } from '../types/categoryMapping';
import { categoryMappingsPath } from '@/lib/firestorePaths';
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
    collectionPath: categoryMappingsPath,
    serviceName: 'categoryMappingService',
    primaryKeyField: 'normalizedItem',
    targetField: 'targetCategory',
};

/** Normalize an item name for fuzzy matching */
export const normalizeItemName = normalizeForMapping;

export async function saveCategoryMapping(
    db: Firestore, userId: string, appId: string, mapping: NewCategoryMapping
): Promise<string> {
    return saveMapping(db, userId, appId, mapping, config);
}

export async function getCategoryMappings(
    db: Firestore, userId: string, appId: string
): Promise<CategoryMapping[]> {
    return getMappings<CategoryMapping>(db, userId, appId, config);
}

export function subscribeToCategoryMappings(
    db: Firestore, userId: string, appId: string, callback: (mappings: CategoryMapping[]) => void
): Unsubscribe {
    return subscribeToMappings<CategoryMapping>(db, userId, appId, callback, config);
}

export async function deleteCategoryMapping(
    db: Firestore, userId: string, appId: string, mappingId: string
): Promise<void> {
    return deleteMapping(db, userId, appId, mappingId, config);
}

/** Note: historically named without domain prefix (incrementMappingUsage) */
export async function incrementMappingUsage(
    db: Firestore, userId: string, appId: string, mappingId: string
): Promise<void> {
    return incrementMappingUsageBase(db, userId, appId, mappingId, config);
}

export async function updateCategoryMappingTarget(
    db: Firestore, userId: string, appId: string, mappingId: string, newTargetCategory: string
): Promise<void> {
    return updateMappingTarget(db, userId, appId, mappingId, newTargetCategory, config);
}
