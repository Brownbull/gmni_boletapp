/**
 * Tests for number formatting utilities
 *
 * Story 15-2g: Centralized number formatting
 */

import { describe, it, expect } from 'vitest';
import {
    roundTo,
    calcPercent,
    formatPercent,
    formatCompact,
    formatDecimal,
} from '../../../src/utils/numberFormat';

describe('roundTo', () => {
    it('should round to 2 decimal places by default', () => {
        expect(roundTo(3.14159)).toBe(3.14);
    });

    it('should round to 0 decimal places', () => {
        expect(roundTo(3.7, 0)).toBe(4);
    });

    it('should round to 1 decimal place', () => {
        expect(roundTo(3.14159, 1)).toBe(3.1);
    });

    it('should round .5 up', () => {
        expect(roundTo(2.555, 2)).toBe(2.56);
    });

    it('should handle negative numbers', () => {
        expect(roundTo(-3.14159, 2)).toBe(-3.14);
    });

    it('should handle zero', () => {
        expect(roundTo(0, 2)).toBe(0);
    });

    it('should handle whole numbers', () => {
        expect(roundTo(42, 2)).toBe(42);
    });
});

describe('calcPercent', () => {
    it('should calculate basic percentage', () => {
        expect(calcPercent(25, 100)).toBe(25);
    });

    it('should return 0 when total is 0', () => {
        expect(calcPercent(50, 0)).toBe(0);
    });

    it('should round to nearest integer by default', () => {
        expect(calcPercent(1, 3)).toBe(33);
    });

    it('should support decimal places', () => {
        expect(calcPercent(1, 3, 1)).toBe(33.3);
    });

    it('should handle 100%', () => {
        expect(calcPercent(100, 100)).toBe(100);
    });

    it('should handle values exceeding 100%', () => {
        expect(calcPercent(150, 100)).toBe(150);
    });
});

describe('formatPercent', () => {
    it('should format as integer percent by default', () => {
        expect(formatPercent(75)).toBe('75%');
    });

    it('should format with decimal places', () => {
        expect(formatPercent(33.333, 1)).toBe('33.3%');
    });

    it('should format zero', () => {
        expect(formatPercent(0)).toBe('0%');
    });

    it('should format 100', () => {
        expect(formatPercent(100)).toBe('100%');
    });
});

describe('formatCompact', () => {
    it('should return plain number below 1000', () => {
        expect(formatCompact(500)).toBe('500');
    });

    it('should format thousands as K', () => {
        expect(formatCompact(1500)).toBe('1.5K');
    });

    it('should format even thousands without decimal', () => {
        expect(formatCompact(2000)).toBe('2K');
    });

    it('should format millions as M', () => {
        expect(formatCompact(1500000)).toBe('1.5M');
    });

    it('should format even millions without decimal', () => {
        expect(formatCompact(3000000)).toBe('3M');
    });

    it('should support prefix', () => {
        expect(formatCompact(1500, '$')).toBe('$1.5K');
    });

    it('should handle zero', () => {
        expect(formatCompact(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
        expect(formatCompact(-2500)).toBe('-2.5K');
    });

    it('should handle negative with prefix', () => {
        expect(formatCompact(-1000000, '$')).toBe('-$1M');
    });

    it('should round sub-1000 values', () => {
        expect(formatCompact(999.7)).toBe('1000');
    });
});

describe('formatDecimal', () => {
    it('should format to 2 decimal places by default', () => {
        expect(formatDecimal(3.14159)).toBe(3.14);
    });

    it('should format to 0 decimal places', () => {
        expect(formatDecimal(3.7, 0)).toBe(4);
    });

    it('should return number type', () => {
        expect(typeof formatDecimal(3.14)).toBe('number');
    });
});
