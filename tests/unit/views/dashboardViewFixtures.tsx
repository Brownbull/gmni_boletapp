/**
 * DashboardView Test Fixtures
 *
 * TD-15b-32: Shared test data factories and helpers for DashboardView test files.
 * Extracted during test file split (827 → 3 files under 300 lines each).
 */

import { vi } from 'vitest';
import { render } from '../../setup/test-utils';
import { DashboardView } from '../../../src/views/DashboardView';
import { useHistoryFiltersStore, getDefaultFilterState } from '@/shared/stores/useHistoryFiltersStore';
import type { UseDashboardViewDataReturn } from '../../../src/views/DashboardView/useDashboardViewData';

// Helper to format month in short format (e.g., "Jan '26")
export const formatShortMonth = (month: number, year: number) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const shortYear = year.toString().slice(-2);
  return `${monthNames[month]} '${shortYear}`;
};

/** Sync allTransactions ↔ transactions when only one is provided */
export const normalizeTransactionOverrides = (
  overrides: Partial<UseDashboardViewDataReturn>
): Partial<UseDashboardViewDataReturn> => {
  const normalized = { ...overrides };
  if (normalized.allTransactions && !normalized.transactions) {
    normalized.transactions = normalized.allTransactions;
  }
  if (normalized.transactions && !normalized.allTransactions) {
    normalized.allTransactions = normalized.transactions;
  }
  return normalized;
};

/**
 * Factory that creates a renderDashboardView helper bound to a specific mockHookData instance.
 * Each test file passes its own mockHookData to maintain vi.mock() hoisting isolation.
 *
 * NOTE: Object.assign mutates mockHookData intentionally — vi.mock() returns it by reference,
 * so mutation is required for the mock to reflect overrides. beforeEach resets via
 * Object.assign(mockHookData, createDefaultMockHookData()).
 */
export const createRenderDashboardView = (mockHookData: UseDashboardViewDataReturn) =>
  (overrides: Partial<UseDashboardViewDataReturn> = {}) => {
    const normalizedOverrides = normalizeTransactionOverrides(overrides);
    Object.assign(mockHookData, normalizedOverrides);
    useHistoryFiltersStore.getState().initializeFilters(getDefaultFilterState());
    return render(<DashboardView _testOverrides={normalizedOverrides} />);
  };

/** Create fresh mock hook data with vi.fn() instances. Call per-file, not shared. */
export const createDefaultMockHookData = (): UseDashboardViewDataReturn => ({
  transactions: [],
  allTransactions: [],
  recentScans: [],
  userId: 'test-user-123',
  appId: 'test-app-id',
  theme: 'light',
  colorTheme: 'mono',
  fontColorMode: 'colorful',
  lang: 'en',
  currency: 'USD',
  dateFormat: 'US',
  defaultCountry: 'US',
  foreignLocationFormat: 'code',
  t: (key: string) => key,
  formatCurrency: (amount: number, _currency: string) => `$${amount.toFixed(2)}`,
  formatDate: (date: string, _format: string) => date,
  getSafeDate: (val: unknown) => (val as string) || new Date().toISOString().split('T')[0],
  onCreateNew: vi.fn(),
  onViewTrends: vi.fn(),
  onEditTransaction: vi.fn(),
  onTriggerScan: vi.fn(),
  onViewRecentScans: vi.fn(),
});

/** Create a single transaction for the current month */
export const createTransaction = (overrides: Record<string, unknown> = {}) => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return {
    id: '1',
    merchant: 'Test Supermarket',
    alias: 'Grocery Store',
    date: `${currentMonth}-15`,
    total: 45.99,
    category: 'Supermercado',
    ...overrides,
  };
};

export const createTransactionWithImages = (overrides: Record<string, unknown> = {}) => ({
  ...createTransaction(overrides),
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: ['https://example.com/full.jpg'],
});

/** Generate transactions across multiple categories */
export const createCategoryTransactions = () => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return [
    { id: 'tx-1', merchant: 'Supermarket A', alias: 'Super A', date: `${currentMonth}-15`, total: 200, category: 'Supermercado' },
    { id: 'tx-2', merchant: 'Restaurant B', alias: 'Rest B', date: `${currentMonth}-14`, total: 150, category: 'Restaurante' },
    { id: 'tx-3', merchant: 'Gas Station', alias: 'Gas', date: `${currentMonth}-13`, total: 100, category: 'Transporte' },
    { id: 'tx-4', merchant: 'Other Store', alias: 'Other', date: `${currentMonth}-12`, total: 50, category: 'Otro' },
    { id: 'tx-5', merchant: 'Supermarket C', alias: 'Super C', date: `${currentMonth}-11`, total: 100, category: 'Supermercado' },
    { id: 'tx-6', merchant: 'Restaurant D', alias: 'Rest D', date: `${currentMonth}-10`, total: 75, category: 'Restaurante' },
  ];
};

/** Generate N transactions for pagination tests */
export const createManyTransactions = (count: number) => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    merchant: `Store ${i + 1}`,
    alias: `Alias ${i + 1}`,
    date: `${currentMonth}-${String(15 - Math.floor(i / 3)).padStart(2, '0')}`,
    total: 10 + i,
    category: 'Supermercado',
  }));
};

/** Create duplicate transactions (same date, merchant, total) */
export const createDuplicateTransactions = () => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return [
    { id: 'dup-1', merchant: 'Duplicate Store', alias: 'Dup Store', date: `${currentMonth}-15`, total: 50.00, category: 'Supermercado' },
    { id: 'dup-2', merchant: 'Duplicate Store', alias: 'Dup Store', date: `${currentMonth}-15`, total: 50.00, category: 'Supermercado' },
  ];
};
