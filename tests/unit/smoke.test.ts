/**
 * Vitest Smoke Test
 *
 * This test verifies that Vitest is configured correctly and can run tests.
 */

import { describe, it, expect } from 'vitest';

describe('Vitest Configuration Smoke Test', () => {
  it('should run basic assertions', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello').toContain('ello');
  });

  it('should handle numbers correctly', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(2, 3)).toBe(5);
    expect(sum(-1, 1)).toBe(0);
  });

  it('should handle objects correctly', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('test');
    expect(obj).toEqual({ name: 'test', value: 42 });
  });

  it('should handle arrays correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr[0]).toBe(1);
  });
});
