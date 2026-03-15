/**
 * Shared test utilities for useScanFlowRouter tests.
 *
 * Extracted per TD-15b-19 to keep split test files DRY.
 * NOTE: vi.mock() calls must remain in each test file (hoisted by Vitest).
 */

import { vi } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '@/types/transaction';
import type { UseScanFlowRouterProps } from '@features/scan/hooks/useScanFlowRouter';

export const mockDb = {} as Firestore;
export const mockServices = { db: mockDb, appId: 'test-app-id' };

export const createDefaultFlowRouterProps = (
    overrides: Partial<UseScanFlowRouterProps> = {}
): UseScanFlowRouterProps => ({
    user: { uid: 'test-user-123' },
    services: mockServices,
    userPreferences: { defaultCurrency: 'CLP' },
    categoryMappings: [],
    findMerchantMatch: vi.fn(() => null),
    applyCategoryMappings: vi.fn((tx) => ({ transaction: tx, appliedMappingIds: [] })),
    applyItemNameMappings: vi.fn((tx) => ({ transaction: tx, appliedIds: [] })),
    incrementMappingUsage: vi.fn(() => Promise.resolve()),
    incrementMerchantMappingUsage: vi.fn(() => Promise.resolve()),
    incrementItemNameMappingUsage: vi.fn(() => Promise.resolve()),
    checkTrusted: vi.fn(() => Promise.resolve(false)),
    dispatchProcessSuccess: vi.fn(),
    showScanDialog: vi.fn(),
    setCurrentTransaction: vi.fn(),
    setToastMessage: vi.fn(),
    setView: vi.fn(),
    setSkipScanCompleteModal: vi.fn(),
    setAnimateEditViewItems: vi.fn(),
    t: vi.fn((key) => key),
    ...overrides,
});

export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'tx-123',
    merchant: 'Test Store',
    total: 5000,
    currency: 'CLP',
    date: '2026-02-25',
    items: [{ name: 'Item 1', totalPrice: 5000, qty: 1, category: 'Food' }],
    ...overrides,
} as Transaction);
