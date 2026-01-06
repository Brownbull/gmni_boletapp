/**
 * Transaction Group Type Tests
 *
 * Story 14.15b: Transaction Selection Mode & Groups
 * Tests for type utilities and helper functions.
 */

import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  groupHasTransactions,
  extractGroupEmoji,
  extractGroupLabel,
} from '../../../src/types/transactionGroup';
import type { TransactionGroup } from '../../../src/types/transactionGroup';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockTimestamp(): Timestamp {
  return {
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    toMillis: () => Date.now(),
    isEqual: () => false,
    valueOf: () => '',
    toJSON: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  } as unknown as Timestamp;
}

function createGroup(overrides: Partial<TransactionGroup> = {}): TransactionGroup {
  return {
    id: 'group-1',
    name: 'Test Group',
    transactionCount: 0,
    totalAmount: 0,
    createdAt: createMockTimestamp(),
    updatedAt: createMockTimestamp(),
    ...overrides,
  };
}

// ============================================================================
// groupHasTransactions Tests
// ============================================================================

describe('groupHasTransactions', () => {
  it('returns true when group has transactions', () => {
    const group = createGroup({ transactionCount: 5 });

    expect(groupHasTransactions(group)).toBe(true);
  });

  it('returns false when group has no transactions', () => {
    const group = createGroup({ transactionCount: 0 });

    expect(groupHasTransactions(group)).toBe(false);
  });

  it('returns true for large transaction counts', () => {
    const group = createGroup({ transactionCount: 1000 });

    expect(groupHasTransactions(group)).toBe(true);
  });
});

// ============================================================================
// extractGroupEmoji Tests
// ============================================================================

describe('extractGroupEmoji', () => {
  it('extracts emoji from start of group name', () => {
    expect(extractGroupEmoji('🎄 Navidad 2024')).toBe('🎄');
    expect(extractGroupEmoji('🏠 Gastos del Hogar')).toBe('🏠');
    expect(extractGroupEmoji('💼 Proyecto Trabajo')).toBe('💼');
    expect(extractGroupEmoji('🏖️ Viaje Valpo')).toBe('🏖️');
  });

  it('returns empty string when no emoji at start', () => {
    expect(extractGroupEmoji('Gastos del Hogar')).toBe('');
    expect(extractGroupEmoji('No Emoji Group')).toBe('');
    expect(extractGroupEmoji('123 Numbers')).toBe('');
  });

  it('only extracts emoji at the beginning', () => {
    // Emoji in the middle should not be extracted
    expect(extractGroupEmoji('Gastos 🏠 Hogar')).toBe('');
  });

  it('handles emoji with variation selectors', () => {
    // Some emojis have \uFE0F variation selector
    expect(extractGroupEmoji('❤️ Love')).toBe('❤️');
  });

  it('handles empty string', () => {
    expect(extractGroupEmoji('')).toBe('');
  });

  it('handles whitespace-only string', () => {
    expect(extractGroupEmoji('   ')).toBe('');
  });
});

// ============================================================================
// extractGroupLabel Tests
// ============================================================================

describe('extractGroupLabel', () => {
  it('removes emoji and returns label', () => {
    expect(extractGroupLabel('🎄 Navidad 2024')).toBe('Navidad 2024');
    expect(extractGroupLabel('🏠 Gastos del Hogar')).toBe('Gastos del Hogar');
    expect(extractGroupLabel('💼 Proyecto Trabajo')).toBe('Proyecto Trabajo');
  });

  it('returns original string when no emoji', () => {
    expect(extractGroupLabel('Gastos del Hogar')).toBe('Gastos del Hogar');
    expect(extractGroupLabel('No Emoji Group')).toBe('No Emoji Group');
  });

  it('trims leading whitespace after emoji removal', () => {
    expect(extractGroupLabel('🎄  Extra Spaces')).toBe('Extra Spaces');
    expect(extractGroupLabel('🏠    Many Spaces')).toBe('Many Spaces');
  });

  it('handles emoji without space after it', () => {
    expect(extractGroupLabel('🎄Navidad')).toBe('Navidad');
  });

  it('handles empty string', () => {
    expect(extractGroupLabel('')).toBe('');
  });

  it('handles emoji-only string', () => {
    expect(extractGroupLabel('🎄')).toBe('');
  });

  it('handles emoji with trailing whitespace', () => {
    expect(extractGroupLabel('🎄 ')).toBe('');
  });
});
