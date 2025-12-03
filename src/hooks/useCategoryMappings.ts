import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Services } from './useAuth';
import {
    subscribeToCategoryMappings,
    saveCategoryMapping,
    deleteCategoryMapping,
    normalizeItemName
} from '../services/categoryMappingService';
import { CategoryMapping, MatchResult, NewCategoryMapping } from '../types/categoryMapping';
import { StoreCategory } from '../types/transaction';

export interface UseCategoryMappingsReturn {
    /** List of all user's category mappings */
    mappings: CategoryMapping[];
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
    /** Save a new category mapping (or update existing) */
    saveMapping: (item: string, category: StoreCategory, source?: 'user' | 'ai') => Promise<string>;
    /** Delete a category mapping */
    deleteMapping: (mappingId: string) => Promise<void>;
    /** Find best match for an item name (stub - full implementation in Story 6.2) */
    findMatch: (itemName: string, merchant?: string) => MatchResult | null;
}

/**
 * React hook for managing category mappings
 * Provides real-time subscription to user's mappings with CRUD operations
 */
export function useCategoryMappings(
    user: User | null,
    services: Services | null
): UseCategoryMappingsReturn {
    const [mappings, setMappings] = useState<CategoryMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Subscribe to mappings on mount
    useEffect(() => {
        if (!user || !services) {
            setMappings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToCategoryMappings(
            services.db,
            user.uid,
            services.appId,
            (docs) => {
                setMappings(docs);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [user, services]);

    // Save a new mapping or update existing
    const saveMapping = useCallback(
        async (item: string, category: StoreCategory, source: 'user' | 'ai' = 'user'): Promise<string> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to save mappings');
            }

            const newMapping: NewCategoryMapping = {
                originalItem: item,
                normalizedItem: normalizeItemName(item),
                targetCategory: category,
                confidence: source === 'user' ? 1.0 : 0.8,
                source,
                usageCount: 0
            };

            try {
                const id = await saveCategoryMapping(
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
                await deleteCategoryMapping(
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

    // Find best match for an item name
    // Note: Full fuzzy matching implementation will be added in Story 6.2
    // This is a basic exact-match implementation for now
    const findMatch = useCallback(
        (itemName: string, _merchant?: string): MatchResult | null => {
            if (mappings.length === 0) return null;

            const normalizedName = normalizeItemName(itemName);

            // Basic exact match (fuzzy matching in Story 6.2)
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
            loading,
            error,
            saveMapping,
            deleteMapping,
            findMatch
        }),
        [mappings, loading, error, saveMapping, deleteMapping, findMatch]
    );
}
