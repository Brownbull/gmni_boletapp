/**
 * generateDeterministicId Tests
 *
 * Story 15-TD-9: Deterministic document IDs for mapping duplicate-create race prevention
 */

import { describe, it, expect } from 'vitest';
import { generateDeterministicId, type MappingConfig } from '../../../src/services/mappingServiceBase';

describe('generateDeterministicId', () => {
    const singleKeyConfig: MappingConfig = {
        collectionPath: () => 'test/path',
        serviceName: 'testService',
        primaryKeyField: 'normalizedMerchant',
        targetField: 'targetMerchant',
    };

    const compoundKeyConfig: MappingConfig = {
        ...singleKeyConfig,
        primaryKeyField: 'normalizedMerchant',
        secondaryKeyField: 'normalizedItemName',
    };

    it('should produce deterministic output for the same input', () => {
        const mapping = { normalizedMerchant: 'jumbo' };
        const id1 = generateDeterministicId(singleKeyConfig, mapping);
        const id2 = generateDeterministicId(singleKeyConfig, mapping);
        expect(id1).toBe(id2);
    });

    it('should produce different IDs for different primary keys', () => {
        const id1 = generateDeterministicId(singleKeyConfig, { normalizedMerchant: 'jumbo' });
        const id2 = generateDeterministicId(singleKeyConfig, { normalizedMerchant: 'lider' });
        expect(id1).not.toBe(id2);
    });

    it('should produce only Firestore-safe characters (base64url)', () => {
        const id = generateDeterministicId(singleKeyConfig, { normalizedMerchant: 'test value with spaces' });
        expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should produce a non-empty ID for empty string input', () => {
        const id = generateDeterministicId(singleKeyConfig, { normalizedMerchant: '' });
        expect(id.length).toBeGreaterThan(0);
    });

    it('should include secondary key in compound key configs', () => {
        const mapping1 = { normalizedMerchant: 'jumbo', normalizedItemName: 'milk' };
        const mapping2 = { normalizedMerchant: 'jumbo', normalizedItemName: 'bread' };
        const id1 = generateDeterministicId(compoundKeyConfig, mapping1);
        const id2 = generateDeterministicId(compoundKeyConfig, mapping2);
        expect(id1).not.toBe(id2);
    });

    it('should produce different IDs for single vs compound keys with same primary', () => {
        const mapping = { normalizedMerchant: 'jumbo', normalizedItemName: 'milk' };
        const singleId = generateDeterministicId(singleKeyConfig, mapping);
        const compoundId = generateDeterministicId(compoundKeyConfig, mapping);
        expect(singleId).not.toBe(compoundId);
    });

    it('should handle missing primary key field gracefully', () => {
        const id = generateDeterministicId(singleKeyConfig, {});
        expect(id.length).toBeGreaterThan(0);
    });

    it('should handle missing secondary key field gracefully', () => {
        const id = generateDeterministicId(compoundKeyConfig, { normalizedMerchant: 'jumbo' });
        expect(id.length).toBeGreaterThan(0);
    });
});
