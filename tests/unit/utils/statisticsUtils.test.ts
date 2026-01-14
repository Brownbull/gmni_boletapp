/**
 * Tests for statisticsUtils
 *
 * Story 14.40: Category Statistics Popup
 * Tests for calculateMedian, calculateBasicStats, and findMostFrequent utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMedian,
  calculateBasicStats,
  findMostFrequent,
} from '../../../src/utils/statisticsUtils';

describe('calculateMedian', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0);
  });

  it('returns the single value for single-element array', () => {
    expect(calculateMedian([42])).toBe(42);
  });

  it('returns the middle value for odd-length array', () => {
    expect(calculateMedian([1, 3, 5])).toBe(3);
    expect(calculateMedian([5, 1, 3])).toBe(3); // Unsorted input
    expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
  });

  it('returns average of two middle values for even-length array', () => {
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    expect(calculateMedian([4, 1, 3, 2])).toBe(2.5); // Unsorted input
    expect(calculateMedian([1, 2])).toBe(1.5);
  });

  it('handles negative numbers', () => {
    expect(calculateMedian([-5, -1, 0, 2, 5])).toBe(0);
    expect(calculateMedian([-10, -5])).toBe(-7.5);
  });

  it('handles floating point numbers', () => {
    expect(calculateMedian([1.5, 2.5, 3.5])).toBe(2.5);
    expect(calculateMedian([1.1, 2.2, 3.3, 4.4])).toBe(2.75);
  });
});

describe('calculateBasicStats', () => {
  it('returns zeros for empty array', () => {
    const stats = calculateBasicStats([]);
    expect(stats).toEqual({
      count: 0,
      sum: 0,
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
    });
  });

  it('calculates correct stats for single value', () => {
    const stats = calculateBasicStats([100]);
    expect(stats.count).toBe(1);
    expect(stats.sum).toBe(100);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(100);
    expect(stats.avg).toBe(100);
    expect(stats.median).toBe(100);
  });

  it('calculates correct stats for multiple values', () => {
    const stats = calculateBasicStats([10, 20, 30, 40, 50]);
    expect(stats.count).toBe(5);
    expect(stats.sum).toBe(150);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.avg).toBe(30);
    expect(stats.median).toBe(30);
  });

  it('handles realistic transaction amounts', () => {
    // Example: store amounts in cents (e.g., $15.99 = 1599)
    const amounts = [1599, 4250, 8999, 2150, 3500];
    const stats = calculateBasicStats(amounts);
    expect(stats.count).toBe(5);
    expect(stats.sum).toBe(20498);
    expect(stats.min).toBe(1599);
    expect(stats.max).toBe(8999);
    expect(stats.avg).toBe(4099.6);
    expect(stats.median).toBe(3500);
  });
});

describe('findMostFrequent', () => {
  it('returns null for empty array', () => {
    expect(findMostFrequent([])).toBeNull();
  });

  it('returns the single value for single-element array', () => {
    const result = findMostFrequent(['Walmart']);
    expect(result).toEqual(['Walmart', 1]);
  });

  it('returns most frequent value', () => {
    const result = findMostFrequent([
      'Walmart', 'Target', 'Walmart', 'Costco', 'Walmart', 'Target'
    ]);
    expect(result).toEqual(['Walmart', 3]);
  });

  it('handles tie by returning first encountered most frequent', () => {
    const result = findMostFrequent(['A', 'B', 'A', 'B']);
    // Both A and B have count 2, should return one of them
    expect(result?.[1]).toBe(2);
    expect(['A', 'B']).toContain(result?.[0]);
  });

  it('handles all unique values', () => {
    const result = findMostFrequent(['Apple', 'Banana', 'Cherry']);
    // All have count 1
    expect(result?.[1]).toBe(1);
  });

  it('handles merchant names with special characters', () => {
    const result = findMostFrequent([
      "McDonald's", "McDonald's", 'Burger King', "McDonald's"
    ]);
    expect(result).toEqual(["McDonald's", 3]);
  });
});
