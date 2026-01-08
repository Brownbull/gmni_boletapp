/**
 * useSubcategoryMappings Hook
 *
 * Story 14.29: React Query Migration
 * Epic 14: Core Implementation
 *
 * Real-time subscription to user's subcategory mappings with React Query caching.
 * Provides CRUD operations for subcategory learning.
 *
 * Migration benefits:
 * - Settings navigation shows instantly (cached data)
 * - No loading spinner on return visits
 * - Shared cache across components
 */

import { useState, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Services } from './useAuth';
import { useFirestoreSubscription } from './useFirestoreSubscription';
import { QUERY_KEYS } from '../lib/queryKeys';
import {
    subscribeToSubcategoryMappings,
    saveSubcategoryMapping,
    deleteSubcategoryMapping,
    updateSubcategoryMappingTarget,
    normalizeItemName
} from '../services/subcategoryMappingService';
import { SubcategoryMapping, SubcategoryMatchResult, NewSubcategoryMapping } from '../types/subcategoryMapping';

export interface UseSubcategoryMappingsReturn {
    /** List of all user's subcategory mappings */
    mappings: SubcategoryMapping[];
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
    /** Save a new subcategory mapping (or update existing) */
    saveMapping: (item: string, subcategory: string, source?: 'user' | 'ai') => Promise<string>;
    /** Delete a subcategory mapping */
    deleteMapping: (mappingId: string) => Promise<void>;
    /** Update the target subcategory for an existing mapping */
    updateMappingTarget: (mappingId: string, newSubcategory: string) => Promise<void>;
    /** Find best match for an item name */
    findMatch: (itemName: string) => SubcategoryMatchResult | null;
}

/**
 * React hook for managing subcategory mappings
 * Provides real-time subscription to user's mappings with CRUD operations
 */
export function useSubcategoryMappings(
    user: User | null,
    services: Services | null
): UseSubcategoryMappingsReturn {
    const [error, setError] = useState<Error | null>(null);
    const enabled = !!user && !!services;

    // Create the query key
    const queryKey = useMemo(
        () => enabled
            ? QUERY_KEYS.mappings.subcategory(user!.uid, services!.appId)
            : ['mappings', 'subcategory', '', ''],
        [enabled, user?.uid, services?.appId]
    );

    // Subscribe to mappings with React Query caching
    const { data: mappings = [], isLoading } = useFirestoreSubscription<SubcategoryMapping[]>(
        queryKey,
        (callback) => subscribeToSubcategoryMappings(
            services!.db,
            user!.uid,
            services!.appId,
            callback
        ),
        { enabled }
    );

    // Save a new mapping or update existing
    const saveMapping = useCallback(
        async (item: string, subcategory: string, source: 'user' | 'ai' = 'user'): Promise<string> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to save mappings');
            }

            const newMapping: NewSubcategoryMapping = {
                originalItem: item,
                normalizedItem: normalizeItemName(item),
                targetSubcategory: subcategory,
                confidence: source === 'user' ? 1.0 : 0.8,
                source,
                usageCount: 0
            };

            try {
                const id = await saveSubcategoryMapping(
                    services.db,
                    user.uid,
                    services.appId,
                    newMapping
                );
                return id;
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to save mapping');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Delete a mapping
    const deleteMapping = useCallback(
        async (mappingId: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to delete mappings');
            }

            try {
                await deleteSubcategoryMapping(
                    services.db,
                    user.uid,
                    services.appId,
                    mappingId
                );
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to delete mapping');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Update the target subcategory for an existing mapping
    const updateMappingTarget = useCallback(
        async (mappingId: string, newSubcategory: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to update mappings');
            }

            try {
                await updateSubcategoryMappingTarget(
                    services.db,
                    user.uid,
                    services.appId,
                    mappingId,
                    newSubcategory
                );
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to update mapping');
                setError(err);
                throw err;
            }
        },
        [user, services]
    );

    // Find best match for an item name
    // Basic exact-match implementation (can be extended with Fuse.js for fuzzy matching)
    const findMatch = useCallback(
        (itemName: string): SubcategoryMatchResult | null => {
            if (mappings.length === 0) return null;

            const normalizedName = normalizeItemName(itemName);

            // Basic exact match
            const exactMatch = mappings.find(
                m => m.normalizedItem === normalizedName
            );

            if (exactMatch) {
                return {
                    mapping: exactMatch,
                    score: 0, // Perfect match
                    confidence: exactMatch.confidence
                };
            }

            return null;
        },
        [mappings]
    );

    return useMemo(
        () => ({
            mappings,
            loading: isLoading,
            error,
            saveMapping,
            deleteMapping,
            updateMappingTarget,
            findMatch
        }),
        [mappings, isLoading, error, saveMapping, deleteMapping, updateMappingTarget, findMatch]
    );
}
