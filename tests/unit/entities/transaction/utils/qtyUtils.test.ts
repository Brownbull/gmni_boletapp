/**
 * Tests for qty display and input utilities.
 * Story TD-18-14: Decimal quantity support (weight-based items)
 */

import { describe, it, expect } from 'vitest';
import { formatQty, shouldShowQty, sanitizeQtyInput, clampQtyOnBlur } from '@entities/transaction/utils/qtyUtils';

describe('formatQty', () => {
  it('returns "1" for undefined', () => {
    expect(formatQty(undefined)).toBe('1');
  });

  it('returns integer string for whole numbers', () => {
    expect(formatQty(1)).toBe('1');
    expect(formatQty(2)).toBe('2');
    expect(formatQty(10)).toBe('10');
  });

  it('returns up to 3 decimal places', () => {
    expect(formatQty(0.633)).toBe('0.633');
    expect(formatQty(1.5)).toBe('1.5');
    expect(formatQty(0.001)).toBe('0.001');
  });

  it('trims trailing zeros', () => {
    expect(formatQty(2.250)).toBe('2.25');
    expect(formatQty(1.500)).toBe('1.5');
    expect(formatQty(3.100)).toBe('3.1');
  });

  it('rounds to 3 decimal places', () => {
    expect(formatQty(0.6337)).toBe('0.634');
    expect(formatQty(1.9999)).toBe('2');
  });

  it('handles zero', () => {
    expect(formatQty(0)).toBe('0');
  });

  it('returns "1" for Infinity and negative values', () => {
    expect(formatQty(Infinity)).toBe('1');
    expect(formatQty(-Infinity)).toBe('1');
    expect(formatQty(-5)).toBe('1');
  });
});

describe('shouldShowQty', () => {
  it('returns false for undefined', () => {
    expect(shouldShowQty(undefined)).toBe(false);
  });

  it('returns false for qty = 1 (default)', () => {
    expect(shouldShowQty(1)).toBe(false);
  });

  it('returns true for qty > 1', () => {
    expect(shouldShowQty(2)).toBe(true);
    expect(shouldShowQty(10)).toBe(true);
  });

  it('returns true for fractional qty < 1', () => {
    expect(shouldShowQty(0.633)).toBe(true);
    expect(shouldShowQty(0.001)).toBe(true);
    expect(shouldShowQty(0.5)).toBe(true);
  });

  it('returns false for zero (no "x0" badge)', () => {
    expect(shouldShowQty(0)).toBe(false);
  });
});

describe('sanitizeQtyInput', () => {
  it('allows plain digits', () => {
    expect(sanitizeQtyInput('123')).toBe('123');
  });

  it('allows a single decimal point', () => {
    expect(sanitizeQtyInput('0.633')).toBe('0.633');
    expect(sanitizeQtyInput('1.5')).toBe('1.5');
  });

  it('strips non-numeric characters', () => {
    expect(sanitizeQtyInput('abc')).toBe('');
    expect(sanitizeQtyInput('1a2b3')).toBe('123');
    expect(sanitizeQtyInput('$1.5')).toBe('1.5');
  });

  it('allows only one decimal point', () => {
    expect(sanitizeQtyInput('1.2.3')).toBe('1.23');
    expect(sanitizeQtyInput('..5')).toBe('.5');
  });

  it('limits to 3 decimal places during typing', () => {
    expect(sanitizeQtyInput('0.6333')).toBe('0.633');
    expect(sanitizeQtyInput('1.12345')).toBe('1.123');
  });

  it('allows empty string (valid during typing)', () => {
    expect(sanitizeQtyInput('')).toBe('');
  });

  it('allows leading dot (valid during typing)', () => {
    expect(sanitizeQtyInput('.')).toBe('.');
    expect(sanitizeQtyInput('.5')).toBe('.5');
  });

  it('strips minus and plus signs', () => {
    expect(sanitizeQtyInput('-1.5')).toBe('1.5');
    expect(sanitizeQtyInput('+3')).toBe('3');
  });
});

describe('clampQtyOnBlur', () => {
  it('parses normal decimal values', () => {
    expect(clampQtyOnBlur('0.633')).toBe(0.633);
    expect(clampQtyOnBlur('1.5')).toBe(1.5);
    expect(clampQtyOnBlur('3')).toBe(3);
  });

  it('returns 1 for empty or invalid input', () => {
    expect(clampQtyOnBlur('')).toBe(1);
    expect(clampQtyOnBlur('abc')).toBe(1);
    expect(clampQtyOnBlur('.')).toBe(1);
  });

  it('returns 1 for zero or negative', () => {
    expect(clampQtyOnBlur('0')).toBe(1);
    expect(clampQtyOnBlur('-5')).toBe(1);
  });

  it('enforces minimum of 0.001 after rounding', () => {
    expect(clampQtyOnBlur('0.001')).toBe(0.001);
    expect(clampQtyOnBlur('0.0001')).toBe(1); // rounds to 0, below min → fallback to 1
  });

  it('clamps to max 99999', () => {
    expect(clampQtyOnBlur('100000')).toBe(99999);
    expect(clampQtyOnBlur('999999')).toBe(99999);
  });

  it('rounds to 3 decimal places', () => {
    expect(clampQtyOnBlur('0.6337')).toBe(0.634);
    expect(clampQtyOnBlur('1.1111')).toBe(1.111);
  });

  it('handles exact minimum boundary', () => {
    expect(clampQtyOnBlur('0.001')).toBe(0.001);
  });
});
