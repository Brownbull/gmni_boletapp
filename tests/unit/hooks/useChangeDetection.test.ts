/**
 * useChangeDetection Hook Tests
 *
 * Story 10.0: Foundation Sprint - Unit tests for change detection hook
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useChangeDetection,
  useFieldChanges,
  useIsDirty,
} from '../../../src/hooks/useChangeDetection';

// ============================================================================
// Test Data
// ============================================================================

interface TestForm {
  name: string;
  email: string;
  age: number;
  address: {
    city: string;
    country: string;
  };
  tags: string[];
}

const createTestForm = (overrides: Partial<TestForm> = {}): TestForm => ({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  address: {
    city: 'New York',
    country: 'USA',
  },
  tags: ['developer', 'designer'],
  ...overrides,
});

// ============================================================================
// useChangeDetection Tests
// ============================================================================

describe('useChangeDetection', () => {
  describe('basic change detection', () => {
    it('should return hasChanges=false when no changes made', () => {
      const form = createTestForm();
      const { result } = renderHook(() => useChangeDetection(form));

      expect(result.current.hasChanges).toBe(false);
      expect(result.current.changedFields).toEqual([]);
    });

    it('should detect simple field changes', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      expect(result.current.hasChanges).toBe(false);

      // Change a field
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });

      expect(result.current.hasChanges).toBe(true);
      expect(result.current.changedFields).toContain('name');
    });

    it('should detect nested object changes', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      expect(result.current.hasChanges).toBe(false);

      // Change nested field
      rerender({
        form: createTestForm({
          address: { city: 'Los Angeles', country: 'USA' },
        }),
      });

      expect(result.current.hasChanges).toBe(true);
      expect(result.current.changedFields).toContain('address');
    });

    it('should detect array changes', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      expect(result.current.hasChanges).toBe(false);

      // Change array
      rerender({ form: createTestForm({ tags: ['developer', 'manager'] }) });

      expect(result.current.hasChanges).toBe(true);
      expect(result.current.changedFields).toContain('tags');
    });

    it('should return hasChanges=false when value returns to initial', () => {
      const initial = createTestForm();
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: initial } }
      );

      // Change value
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });
      expect(result.current.hasChanges).toBe(true);

      // Return to initial
      rerender({ form: createTestForm() });
      expect(result.current.hasChanges).toBe(false);
    });
  });

  describe('field-specific tracking', () => {
    it('should only track specified fields', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form, { fields: ['name', 'email'] }),
        { initialProps: { form: createTestForm() } }
      );

      // Change untracked field
      rerender({ form: createTestForm({ age: 40 }) });
      expect(result.current.hasChanges).toBe(false);

      // Change tracked field
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });
      expect(result.current.hasChanges).toBe(true);
      expect(result.current.changedFields).toEqual(['name']);
    });

    it('should not include untracked changed fields in changedFields', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form, { fields: ['name'] }),
        { initialProps: { form: createTestForm() } }
      );

      // Change both tracked and untracked fields
      rerender({
        form: createTestForm({
          name: 'Jane Doe',
          age: 40,
        }),
      });

      expect(result.current.changedFields).toEqual(['name']);
      expect(result.current.changedFields).not.toContain('age');
    });
  });

  describe('instance key handling', () => {
    it('should re-capture initial state when instanceKey changes', () => {
      const { result, rerender } = renderHook(
        ({ form, key }) => useChangeDetection(form, { instanceKey: key }),
        { initialProps: { form: createTestForm(), key: 'id-1' } }
      );

      // Make a change
      rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-1' });
      expect(result.current.hasChanges).toBe(true);

      // Change instanceKey (simulating loading a new record)
      rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-2' });
      expect(result.current.hasChanges).toBe(false);
    });

    it('should not re-capture when instanceKey stays the same', () => {
      const { result, rerender } = renderHook(
        ({ form, key }) => useChangeDetection(form, { instanceKey: key }),
        { initialProps: { form: createTestForm(), key: 'id-1' } }
      );

      // Make a change
      rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-1' });
      expect(result.current.hasChanges).toBe(true);

      // Rerender with same key
      rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-1' });
      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('resetChanges', () => {
    it('should reset initial state to current value', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      // Make changes
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });
      expect(result.current.hasChanges).toBe(true);

      // Reset changes
      act(() => {
        result.current.resetChanges();
      });

      expect(result.current.hasChanges).toBe(false);
    });

    it('should detect new changes after reset', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      // Make changes
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });

      // Reset
      act(() => {
        result.current.resetChanges();
      });
      expect(result.current.hasChanges).toBe(false);

      // Make new changes
      rerender({ form: createTestForm({ name: 'Bob Smith' }) });
      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('captureInitialState', () => {
    it('should force capture current state as initial', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      // Make changes
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });
      expect(result.current.hasChanges).toBe(true);

      // Force capture
      act(() => {
        result.current.captureInitialState();
      });

      expect(result.current.hasChanges).toBe(false);
      expect(result.current.initialState?.name).toBe('Jane Doe');
    });
  });

  describe('custom compare function', () => {
    it('should use custom compare function when provided', () => {
      const customCompare = (initial: TestForm, current: TestForm) =>
        initial.name === current.name;

      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form, { compare: customCompare }),
        { initialProps: { form: createTestForm() } }
      );

      // Change non-name field - should not detect change
      rerender({ form: createTestForm({ email: 'new@example.com' }) });
      expect(result.current.hasChanges).toBe(false);

      // Change name field - should detect change
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });
      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('initialState access', () => {
    it('should expose initial state', () => {
      const form = createTestForm();
      const { result } = renderHook(() => useChangeDetection(form));

      expect(result.current.initialState).toEqual(form);
    });

    it('should not mutate initial state when current changes', () => {
      const { result, rerender } = renderHook(
        ({ form }) => useChangeDetection(form),
        { initialProps: { form: createTestForm() } }
      );

      const initialName = result.current.initialState?.name;

      // Change current
      rerender({ form: createTestForm({ name: 'Jane Doe' }) });

      expect(result.current.initialState?.name).toBe(initialName);
    });
  });
});

// ============================================================================
// useFieldChanges Tests
// ============================================================================

describe('useFieldChanges', () => {
  it('should track only specified fields', () => {
    const { result, rerender } = renderHook(
      ({ form }) => useFieldChanges(form, ['name', 'email']),
      { initialProps: { form: createTestForm() } }
    );

    // Change untracked field
    rerender({ form: createTestForm({ age: 40 }) });
    expect(result.current.hasChanges).toBe(false);

    // Change tracked field
    rerender({ form: createTestForm({ name: 'Jane Doe' }) });
    expect(result.current.hasChanges).toBe(true);
  });

  it('should support instanceKey', () => {
    const { result, rerender } = renderHook(
      ({ form, key }) => useFieldChanges(form, ['name'], key),
      { initialProps: { form: createTestForm(), key: 'id-1' } }
    );

    // Make change
    rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-1' });
    expect(result.current.hasChanges).toBe(true);

    // Change key (reset)
    rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-2' });
    expect(result.current.hasChanges).toBe(false);
  });
});

// ============================================================================
// useIsDirty Tests
// ============================================================================

describe('useIsDirty', () => {
  it('should return false when no changes', () => {
    const { result } = renderHook(() => useIsDirty(createTestForm()));

    expect(result.current).toBe(false);
  });

  it('should return true when changes exist', () => {
    const { result, rerender } = renderHook(
      ({ form }) => useIsDirty(form),
      { initialProps: { form: createTestForm() } }
    );

    rerender({ form: createTestForm({ name: 'Jane Doe' }) });

    expect(result.current).toBe(true);
  });

  it('should support instanceKey for resetting', () => {
    const { result, rerender } = renderHook(
      ({ form, key }) => useIsDirty(form, key),
      { initialProps: { form: createTestForm(), key: 'id-1' } }
    );

    // Make change
    rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-1' });
    expect(result.current).toBe(true);

    // Change key (reset)
    rerender({ form: createTestForm({ name: 'Jane Doe' }), key: 'id-2' });
    expect(result.current).toBe(false);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('should handle null values', () => {
    const { result, rerender } = renderHook(
      ({ form }) => useChangeDetection(form),
      { initialProps: { form: { value: null as string | null } } }
    );

    rerender({ form: { value: 'not null' } });
    expect(result.current.hasChanges).toBe(true);

    rerender({ form: { value: null } });
    expect(result.current.hasChanges).toBe(false);
  });

  it('should handle undefined values', () => {
    const { result, rerender } = renderHook(
      ({ form }) => useChangeDetection(form),
      { initialProps: { form: { value: undefined as string | undefined } } }
    );

    rerender({ form: { value: 'defined' } });
    expect(result.current.hasChanges).toBe(true);
  });

  it('should handle empty arrays', () => {
    const { result, rerender } = renderHook(
      ({ form }) => useChangeDetection(form),
      { initialProps: { form: { items: [] as string[] } } }
    );

    expect(result.current.hasChanges).toBe(false);

    rerender({ form: { items: ['item'] } });
    expect(result.current.hasChanges).toBe(true);

    rerender({ form: { items: [] } });
    expect(result.current.hasChanges).toBe(false);
  });

  it('should handle deeply nested objects', () => {
    const deepForm = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };

    const { result, rerender } = renderHook(
      ({ form }) => useChangeDetection(form),
      { initialProps: { form: deepForm } }
    );

    rerender({
      form: {
        level1: {
          level2: {
            level3: {
              value: 'changed',
            },
          },
        },
      },
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changedFields).toContain('level1');
  });
});
