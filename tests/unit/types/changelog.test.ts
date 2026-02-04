import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
    CHANGELOG_TTL_MS,
    CHANGELOG_TTL_DAYS,
    createChangelogSummary,
    isChangelogRemoval,
    hasChangelogData,
} from '../../../src/types/changelog';
import type {
    ChangelogEntry,
    ChangelogEntryType,
    ChangelogSummary,
} from '../../../src/types/changelog';
import type { Transaction } from '../../../src/types/transaction';

/**
 * Story 14d-v2-1-3a: Changelog TypeScript Types Tests
 *
 * Tests for changelog type definitions and utility functions.
 * Verifies AC #1, #2, #3, #4, #5 requirements.
 */
describe('Changelog Types', () => {
    // =========================================================================
    // AC #3: TTL Constants (AD-9: 30-day TTL)
    // =========================================================================
    describe('CHANGELOG_TTL_DAYS constant', () => {
        it('should equal 30 days per AD-9 architecture decision', () => {
            expect(CHANGELOG_TTL_DAYS).toBe(30);
        });
    });

    describe('CHANGELOG_TTL_MS constant', () => {
        it('should equal 30 days in milliseconds', () => {
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            expect(CHANGELOG_TTL_MS).toBe(thirtyDaysMs);
        });

        it('should be consistent with CHANGELOG_TTL_DAYS', () => {
            const expectedMs = CHANGELOG_TTL_DAYS * 24 * 60 * 60 * 1000;
            expect(CHANGELOG_TTL_MS).toBe(expectedMs);
        });
    });

    // =========================================================================
    // AC #1: ChangelogEntryType union type
    // =========================================================================
    describe('ChangelogEntryType', () => {
        it('should accept TRANSACTION_ADDED', () => {
            const entryType: ChangelogEntryType = 'TRANSACTION_ADDED';
            expect(entryType).toBe('TRANSACTION_ADDED');
        });

        it('should accept TRANSACTION_MODIFIED', () => {
            const entryType: ChangelogEntryType = 'TRANSACTION_MODIFIED';
            expect(entryType).toBe('TRANSACTION_MODIFIED');
        });

        it('should accept TRANSACTION_REMOVED', () => {
            const entryType: ChangelogEntryType = 'TRANSACTION_REMOVED';
            expect(entryType).toBe('TRANSACTION_REMOVED');
        });
    });

    // =========================================================================
    // AC #1: ChangelogSummary interface
    // =========================================================================
    describe('ChangelogSummary', () => {
        it('should allow creation with all required fields', () => {
            const summary: ChangelogSummary = {
                amount: 15000,
                currency: 'CLP',
                description: 'Supermercado Jumbo',
                category: 'Supermarket',
            };

            expect(summary.amount).toBe(15000);
            expect(summary.currency).toBe('CLP');
            expect(summary.description).toBe('Supermercado Jumbo');
            expect(summary.category).toBe('Supermarket');
        });

        it('should allow null category (AC #5 edge case)', () => {
            const summary: ChangelogSummary = {
                amount: 5000,
                currency: 'USD',
                description: 'Unknown Store',
                category: null,
            };

            expect(summary.category).toBeNull();
        });
    });

    // =========================================================================
    // AC #1, #2, #3, #5: ChangelogEntry interface
    // =========================================================================
    describe('ChangelogEntry', () => {
        const mockTimestamp = {
            toDate: () => new Date(),
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0,
        } as unknown as Timestamp;

        const mockTransaction: Transaction = {
            id: 'tx-123',
            date: '2026-02-01',
            merchant: 'Supermercado Jumbo',
            category: 'Supermarket',
            total: 25000,
            items: [{ name: 'Milk', price: 2500 }],
            currency: 'CLP',
        };

        it('should allow creation with full transaction data (AD-3)', () => {
            const entry: ChangelogEntry = {
                id: 'entry-123',
                type: 'TRANSACTION_ADDED',
                transactionId: 'tx-123',
                timestamp: mockTimestamp,
                actorId: 'user-456',
                groupId: 'group-789',
                data: mockTransaction,
                summary: {
                    amount: 25000,
                    currency: 'CLP',
                    description: 'Supermercado Jumbo',
                    category: 'Supermarket',
                },
                _ttl: mockTimestamp,
            };

            expect(entry.id).toBe('entry-123');
            expect(entry.type).toBe('TRANSACTION_ADDED');
            expect(entry.transactionId).toBe('tx-123');
            expect(entry.actorId).toBe('user-456');
            expect(entry.groupId).toBe('group-789');
            expect(entry.data).toEqual(mockTransaction);
            expect(entry._ttl).toBe(mockTimestamp);
        });

        it('should require transactionId field (AC #5)', () => {
            const entry: ChangelogEntry = {
                id: 'entry-123',
                type: 'TRANSACTION_MODIFIED',
                transactionId: 'tx-required',
                timestamp: mockTimestamp,
                actorId: 'user-456',
                groupId: 'group-789',
                data: mockTransaction,
                summary: {
                    amount: 25000,
                    currency: 'CLP',
                    description: 'Test',
                    category: null,
                },
                _ttl: mockTimestamp,
            };

            expect(entry.transactionId).toBe('tx-required');
        });

        it('should require actorId field (AC #5)', () => {
            const entry: ChangelogEntry = {
                id: 'entry-123',
                type: 'TRANSACTION_ADDED',
                transactionId: 'tx-123',
                timestamp: mockTimestamp,
                actorId: 'required-actor',
                groupId: 'group-789',
                data: mockTransaction,
                summary: {
                    amount: 25000,
                    currency: 'CLP',
                    description: 'Test',
                    category: null,
                },
                _ttl: mockTimestamp,
            };

            expect(entry.actorId).toBe('required-actor');
        });

        it('should allow null data for TRANSACTION_REMOVED type (AC #5)', () => {
            const entry: ChangelogEntry = {
                id: 'entry-123',
                type: 'TRANSACTION_REMOVED',
                transactionId: 'tx-123',
                timestamp: mockTimestamp,
                actorId: 'user-456',
                groupId: 'group-789',
                data: null,
                summary: {
                    amount: 0,
                    currency: 'CLP',
                    description: 'Deleted Transaction',
                    category: null,
                },
                _ttl: mockTimestamp,
            };

            expect(entry.data).toBeNull();
            expect(entry.type).toBe('TRANSACTION_REMOVED');
        });

        it('should include _ttl field for Firestore TTL (AD-9)', () => {
            const ttlTimestamp = {
                toDate: () => new Date(Date.now() + CHANGELOG_TTL_MS),
                seconds: Math.floor((Date.now() + CHANGELOG_TTL_MS) / 1000),
                nanoseconds: 0,
            } as unknown as Timestamp;

            const entry: ChangelogEntry = {
                id: 'entry-123',
                type: 'TRANSACTION_ADDED',
                transactionId: 'tx-123',
                timestamp: mockTimestamp,
                actorId: 'user-456',
                groupId: 'group-789',
                data: mockTransaction,
                summary: {
                    amount: 25000,
                    currency: 'CLP',
                    description: 'Test',
                    category: null,
                },
                _ttl: ttlTimestamp,
            };

            expect(entry._ttl).toBe(ttlTimestamp);
        });
    });

    // =========================================================================
    // Utility Functions
    // =========================================================================
    describe('createChangelogSummary', () => {
        it('should create summary from transaction with all fields', () => {
            const transaction: Transaction = {
                id: 'tx-123',
                date: '2026-02-01',
                merchant: 'Jumbo Providencia',
                category: 'Supermarket',
                total: 45000,
                items: [{ name: 'Groceries', price: 45000 }],
                currency: 'USD',
            };

            const summary = createChangelogSummary(transaction);

            expect(summary.amount).toBe(45000);
            expect(summary.currency).toBe('USD');
            expect(summary.description).toBe('Jumbo Providencia');
            expect(summary.category).toBe('Supermarket');
        });

        it('should default currency to CLP when not specified', () => {
            const transaction: Transaction = {
                id: 'tx-123',
                date: '2026-02-01',
                merchant: 'Local Store',
                category: 'Other',
                total: 5000,
                items: [],
            };

            const summary = createChangelogSummary(transaction);

            expect(summary.currency).toBe('CLP');
        });

        it('should use first item name when merchant is empty', () => {
            const transaction: Transaction = {
                id: 'tx-123',
                date: '2026-02-01',
                merchant: '',
                category: 'Other',
                total: 3000,
                items: [{ name: 'Coffee', price: 3000 }],
            };

            const summary = createChangelogSummary(transaction);

            expect(summary.description).toBe('Coffee');
        });

        it('should fallback to "Transaction" when merchant and items are empty', () => {
            const transaction: Transaction = {
                id: 'tx-123',
                date: '2026-02-01',
                merchant: '',
                category: 'Other',
                total: 1000,
                items: [],
            };

            const summary = createChangelogSummary(transaction);

            expect(summary.description).toBe('Transaction');
        });

        it('should handle null category', () => {
            const transaction: Transaction = {
                id: 'tx-123',
                date: '2026-02-01',
                merchant: 'Unknown Store',
                category: undefined as unknown as Transaction['category'],
                total: 2000,
                items: [],
            };

            const summary = createChangelogSummary(transaction);

            expect(summary.category).toBeNull();
        });
    });

    describe('isChangelogRemoval', () => {
        const mockTimestamp = {
            toDate: () => new Date(),
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0,
        } as unknown as Timestamp;

        const baseEntry: Omit<ChangelogEntry, 'type' | 'data'> = {
            id: 'entry-123',
            transactionId: 'tx-123',
            timestamp: mockTimestamp,
            actorId: 'user-456',
            groupId: 'group-789',
            summary: {
                amount: 0,
                currency: 'CLP',
                description: 'Test',
                category: null,
            },
            _ttl: mockTimestamp,
        };

        it('should return true for TRANSACTION_REMOVED type', () => {
            const entry: ChangelogEntry = {
                ...baseEntry,
                type: 'TRANSACTION_REMOVED',
                data: null,
            };

            expect(isChangelogRemoval(entry)).toBe(true);
        });

        it('should return false for TRANSACTION_ADDED type', () => {
            const entry: ChangelogEntry = {
                ...baseEntry,
                type: 'TRANSACTION_ADDED',
                data: { id: 'tx-123', date: '2026-02-01', merchant: 'Test', category: 'Other', total: 100, items: [] },
            };

            expect(isChangelogRemoval(entry)).toBe(false);
        });

        it('should return false for TRANSACTION_MODIFIED type', () => {
            const entry: ChangelogEntry = {
                ...baseEntry,
                type: 'TRANSACTION_MODIFIED',
                data: { id: 'tx-123', date: '2026-02-01', merchant: 'Test', category: 'Other', total: 100, items: [] },
            };

            expect(isChangelogRemoval(entry)).toBe(false);
        });
    });

    describe('hasChangelogData', () => {
        const mockTimestamp = {
            toDate: () => new Date(),
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0,
        } as unknown as Timestamp;

        const baseEntry: Omit<ChangelogEntry, 'type' | 'data'> = {
            id: 'entry-123',
            transactionId: 'tx-123',
            timestamp: mockTimestamp,
            actorId: 'user-456',
            groupId: 'group-789',
            summary: {
                amount: 0,
                currency: 'CLP',
                description: 'Test',
                category: null,
            },
            _ttl: mockTimestamp,
        };

        it('should return true when data is present', () => {
            const entry: ChangelogEntry = {
                ...baseEntry,
                type: 'TRANSACTION_ADDED',
                data: {
                    id: 'tx-123',
                    date: '2026-02-01',
                    merchant: 'Test Store',
                    category: 'Supermarket',
                    total: 5000,
                    items: [],
                },
            };

            expect(hasChangelogData(entry)).toBe(true);
        });

        it('should return false when data is null', () => {
            const entry: ChangelogEntry = {
                ...baseEntry,
                type: 'TRANSACTION_REMOVED',
                data: null,
            };

            expect(hasChangelogData(entry)).toBe(false);
        });

        it('should act as type guard for data field', () => {
            const entry: ChangelogEntry = {
                ...baseEntry,
                type: 'TRANSACTION_MODIFIED',
                data: {
                    id: 'tx-123',
                    date: '2026-02-01',
                    merchant: 'Test',
                    category: 'Other',
                    total: 100,
                    items: [],
                },
            };

            if (hasChangelogData(entry)) {
                // TypeScript should allow accessing data.merchant without null check
                expect(entry.data.merchant).toBe('Test');
            }
        });
    });

    // =========================================================================
    // AC #4: Export verification from barrel file
    // =========================================================================
    describe('Barrel file exports (src/types/index.ts)', () => {
        it('should export changelog types from barrel', async () => {
            const barrelExports = await import('../../../src/types/index');

            // Type exports (verify they exist by checking functions)
            expect(barrelExports.createChangelogSummary).toBeDefined();
            expect(barrelExports.isChangelogRemoval).toBeDefined();
            expect(barrelExports.hasChangelogData).toBeDefined();
            expect(barrelExports.CHANGELOG_TTL_MS).toBeDefined();
            expect(barrelExports.CHANGELOG_TTL_DAYS).toBeDefined();
        });
    });
});
