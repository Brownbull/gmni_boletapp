import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from 'firebase/auth'
import { Services } from './useAuth'
import {
    subscribeToMerchantMappings,
    saveMerchantMapping,
    deleteMerchantMapping,
    updateMerchantMappingTarget,
    normalizeMerchantName
} from '../services/merchantMappingService'
import { findMerchantMatch } from '../services/merchantMatcherService'
import { MerchantMapping, MerchantMatchResult, NewMerchantMapping } from '../types/merchantMapping'

/**
 * Capitalize each word in a string (Title Case)
 * Story 9.6: Ensures all saved aliases are consistently capitalized
 */
function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export interface UseMerchantMappingsReturn {
    /** List of all user's merchant mappings */
    mappings: MerchantMapping[]
    /** Loading state */
    loading: boolean
    /** Error state */
    error: Error | null
    /** Save a new merchant mapping (or update existing) */
    saveMapping: (originalMerchant: string, targetMerchant: string) => Promise<string>
    /** Delete a merchant mapping */
    deleteMapping: (mappingId: string) => Promise<void>
    /** Update an existing mapping's target merchant name (Story 9.7) */
    updateMapping: (mappingId: string, newTarget: string) => Promise<void>
    /** Find best match for a merchant name using fuzzy matching */
    findMatch: (merchantName: string, threshold?: number) => MerchantMatchResult | null
}

/**
 * React hook for managing merchant mappings
 * Provides real-time subscription to user's mappings with CRUD operations
 */
export function useMerchantMappings(
    user: User | null,
    services: Services | null
): UseMerchantMappingsReturn {
    const [mappings, setMappings] = useState<MerchantMapping[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Subscribe to mappings on mount
    useEffect(() => {
        if (!user || !services) {
            setMappings([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const unsubscribe = subscribeToMerchantMappings(
            services.db,
            user.uid,
            services.appId,
            (docs) => {
                setMappings(docs)
                setLoading(false)
            }
        )

        return unsubscribe
    }, [user, services])

    // Save a new mapping or update existing
    const saveMapping = useCallback(
        async (originalMerchant: string, targetMerchant: string): Promise<string> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to save mappings')
            }

            // Story 9.6: Always capitalize the target merchant (alias) for consistency
            const capitalizedTarget = toTitleCase(targetMerchant.trim())

            const newMapping: NewMerchantMapping = {
                originalMerchant,
                normalizedMerchant: normalizeMerchantName(originalMerchant),
                targetMerchant: capitalizedTarget,
                confidence: 1.0, // Always 1.0 for user-set mappings
                source: 'user', // Always 'user' for MVP
                usageCount: 0
            }

            try {
                const id = await saveMerchantMapping(
                    services.db,
                    user.uid,
                    services.appId,
                    newMapping
                )
                return id
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to save mapping')
                setError(err)
                throw err
            }
        },
        [user, services]
    )

    // Delete a mapping
    const deleteMapping = useCallback(
        async (mappingId: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to delete mappings')
            }

            try {
                await deleteMerchantMapping(
                    services.db,
                    user.uid,
                    services.appId,
                    mappingId
                )
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to delete mapping')
                setError(err)
                throw err
            }
        },
        [user, services]
    )

    // Update a mapping's target merchant name (Story 9.7)
    const updateMapping = useCallback(
        async (mappingId: string, newTarget: string): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to update mappings')
            }

            // Apply title case to the new target
            const capitalizedTarget = toTitleCase(newTarget.trim())

            try {
                await updateMerchantMappingTarget(
                    services.db,
                    user.uid,
                    services.appId,
                    mappingId,
                    capitalizedTarget
                )
            } catch (e) {
                const err = e instanceof Error ? e : new Error('Failed to update mapping')
                setError(err)
                throw err
            }
        },
        [user, services]
    )

    // Find best match for a merchant name using fuzzy matching
    // Story 9.5: Full Fuse.js fuzzy matching implementation
    const findMatch = useCallback(
        (merchantName: string, threshold?: number): MerchantMatchResult | null => {
            return findMerchantMatch(merchantName, mappings, threshold)
        },
        [mappings]
    )

    return useMemo(
        () => ({
            mappings,
            loading,
            error,
            saveMapping,
            deleteMapping,
            updateMapping,
            findMatch
        }),
        [mappings, loading, error, saveMapping, deleteMapping, updateMapping, findMatch]
    )
}
