/**
 * Unit tests for useMappingSystemOrchestrator
 *
 * Story TD-15b-35: Orchestrator Cleanup
 *
 * Verifies return shape and hook composition.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMappingSystemOrchestrator } from '../../../../src/app/hooks/useMappingSystemOrchestrator';

vi.mock('../../../../src/hooks/useCategoryMappings', () => ({
    useCategoryMappings: vi.fn(() => ({
        mappings: [],
    })),
}));

vi.mock('../../../../src/hooks/useMerchantMappings', () => ({
    useMerchantMappings: vi.fn(() => ({
        findMatch: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/useSubcategoryMappings', () => ({
    useSubcategoryMappings: vi.fn(),
}));

vi.mock('../../../../src/hooks/useItemNameMappings', () => ({
    useItemNameMappings: vi.fn(() => ({
        findMatch: vi.fn(),
    })),
}));

vi.mock('../../../../src/features/insights/hooks/useInsightProfile', () => ({
    useInsightProfile: vi.fn(() => ({
        profile: null,
        cache: null,
        recordShown: vi.fn(),
        trackTransaction: vi.fn(),
        incrementCounter: vi.fn(),
    })),
}));

describe('useMappingSystemOrchestrator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns all expected keys', () => {
        const { result } = renderHook(() =>
            useMappingSystemOrchestrator(null, null),
        );

        const expectedKeys = [
            'mappings',
            'findMerchantMatch',
            'findItemNameMatch',
            'insightProfile',
            'insightCache',
            'recordInsightShown',
            'trackTransactionForInsight',
            'incrementInsightCounter',
        ];

        for (const key of expectedKeys) {
            expect(result.current).toHaveProperty(key);
        }
    });

    it('provides function-type values for match finders', () => {
        const { result } = renderHook(() =>
            useMappingSystemOrchestrator(null, null),
        );

        expect(typeof result.current.findMerchantMatch).toBe('function');
        expect(typeof result.current.findItemNameMatch).toBe('function');
    });
});
