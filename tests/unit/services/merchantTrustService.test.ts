import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    normalizeMerchantNameForTrust,
    shouldShowTrustPrompt,
    calculateEditRate,
} from '../../../src/services/merchantTrustService';
import { TrustedMerchant, TRUST_THRESHOLDS } from '../../../src/types/trust';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp helper
function createMockTimestamp(hoursAgo: number = 0): Timestamp {
    const date = new Date();
    date.setHours(date.getHours() - hoursAgo);
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
        toMillis: () => date.getTime(),
        isEqual: () => false,
        valueOf: () => '',
        toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
    } as unknown as Timestamp;
}

describe('merchantTrustService', () => {
    describe('normalizeMerchantNameForTrust', () => {
        it('should lowercase the merchant name', () => {
            expect(normalizeMerchantNameForTrust('JUMBO')).toBe('jumbo');
        });

        it('should trim whitespace', () => {
            expect(normalizeMerchantNameForTrust('  Jumbo  ')).toBe('jumbo');
        });

        it('should remove special characters', () => {
            expect(normalizeMerchantNameForTrust('Jumbo #123')).toBe('jumbo 123');
        });

        it('should collapse multiple spaces', () => {
            expect(normalizeMerchantNameForTrust('Jumbo   Mall   123')).toBe('jumbo mall 123');
        });

        it('should handle empty string', () => {
            expect(normalizeMerchantNameForTrust('')).toBe('');
        });

        it('should handle Unicode characters (remove accents)', () => {
            // Accents are removed: é → e, í → i
            expect(normalizeMerchantNameForTrust('Café Líder')).toBe('cafe lider');
        });
    });

    describe('calculateEditRate', () => {
        it('should return 0 when no scans', () => {
            expect(calculateEditRate(0, 0)).toBe(0);
        });

        it('should return 0 when no edits', () => {
            expect(calculateEditRate(5, 0)).toBe(0);
        });

        it('should return 1 when all scans edited', () => {
            expect(calculateEditRate(5, 5)).toBe(1);
        });

        it('should calculate correct rate', () => {
            expect(calculateEditRate(10, 1)).toBe(0.1);
            expect(calculateEditRate(10, 2)).toBe(0.2);
            expect(calculateEditRate(3, 0)).toBe(0);
        });
    });

    describe('shouldShowTrustPrompt', () => {
        it('should return eligible for merchant meeting all criteria (AC #2)', () => {
            const merchant: TrustedMerchant = {
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 3,
                editCount: 0,
                editRate: 0,
                trusted: false,
                lastScanAt: createMockTimestamp(),
                createdAt: createMockTimestamp(24),
                updatedAt: createMockTimestamp(),
            };

            const result = shouldShowTrustPrompt(merchant);
            expect(result.shouldShowPrompt).toBe(true);
            expect(result.reason).toBe('eligible');
        });

        it('should return already_trusted for trusted merchant', () => {
            const merchant: TrustedMerchant = {
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 5,
                editCount: 0,
                editRate: 0,
                trusted: true,
                trustedAt: createMockTimestamp(24),
                lastScanAt: createMockTimestamp(),
                createdAt: createMockTimestamp(48),
                updatedAt: createMockTimestamp(),
            };

            const result = shouldShowTrustPrompt(merchant);
            expect(result.shouldShowPrompt).toBe(false);
            expect(result.reason).toBe('already_trusted');
        });

        it('should return already_declined for declined merchant (AC #4)', () => {
            const merchant: TrustedMerchant = {
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 3,
                editCount: 0,
                editRate: 0,
                trusted: false,
                declined: true,
                promptShownAt: createMockTimestamp(24),
                lastScanAt: createMockTimestamp(),
                createdAt: createMockTimestamp(48),
                updatedAt: createMockTimestamp(),
            };

            const result = shouldShowTrustPrompt(merchant);
            expect(result.shouldShowPrompt).toBe(false);
            expect(result.reason).toBe('already_declined');
        });

        it('should return insufficient_scans for < 3 scans (AC #2)', () => {
            const merchant: TrustedMerchant = {
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 2,
                editCount: 0,
                editRate: 0,
                trusted: false,
                lastScanAt: createMockTimestamp(),
                createdAt: createMockTimestamp(24),
                updatedAt: createMockTimestamp(),
            };

            const result = shouldShowTrustPrompt(merchant);
            expect(result.shouldShowPrompt).toBe(false);
            expect(result.reason).toBe('insufficient_scans');
        });

        it('should return high_edit_rate for >= 10% edit rate (AC #2)', () => {
            const merchant: TrustedMerchant = {
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 10,
                editCount: 1,
                editRate: 0.1, // exactly 10%
                trusted: false,
                lastScanAt: createMockTimestamp(),
                createdAt: createMockTimestamp(24),
                updatedAt: createMockTimestamp(),
            };

            const result = shouldShowTrustPrompt(merchant);
            expect(result.shouldShowPrompt).toBe(false);
            expect(result.reason).toBe('high_edit_rate');
        });

        it('should return eligible for edit rate just under 10%', () => {
            const merchant: TrustedMerchant = {
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 11,
                editCount: 1,
                editRate: 1/11, // ~9.09%
                trusted: false,
                lastScanAt: createMockTimestamp(),
                createdAt: createMockTimestamp(24),
                updatedAt: createMockTimestamp(),
            };

            const result = shouldShowTrustPrompt(merchant);
            expect(result.shouldShowPrompt).toBe(true);
            expect(result.reason).toBe('eligible');
        });

        it('should use TRUST_THRESHOLDS constants', () => {
            expect(TRUST_THRESHOLDS.MIN_SCANS).toBe(3);
            expect(TRUST_THRESHOLDS.MAX_EDIT_RATE).toBe(0.10);
        });
    });
});
