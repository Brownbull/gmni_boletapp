/**
 * useChangeDetection Hook
 *
 * Story 10.0: Foundation Sprint - Generalized change detection for forms
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 *
 * This hook provides reusable change detection logic for tracking modifications
 * to objects compared against an initial state. Useful for:
 * - Edit forms with unsaved changes warnings
 * - Form dirty state tracking
 * - Change confirmation dialogs
 *
 * Supports deep object comparison and field-level change tracking.
 */

import { useRef, useMemo, useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ChangeDetectionResult<T> {
  /** Whether any changes have been made from the initial state */
  hasChanges: boolean;
  /** List of field paths that have changed */
  changedFields: string[];
  /** Reset the initial state to the current value */
  resetChanges: () => void;
  /** Get the initial captured state (read-only) */
  initialState: T | null;
  /** Force capture of current state as new initial state */
  captureInitialState: () => void;
}

export interface ChangeDetectionOptions<T> {
  /**
   * Fields to compare for changes. If not provided, compares all fields.
   * Use dot notation for nested fields: 'address.city'
   */
  fields?: (keyof T)[] | string[];

  /**
   * Custom comparison function. Defaults to deep equality check.
   */
  compare?: (initial: T, current: T) => boolean;

  /**
   * Unique key to identify the object instance (e.g., 'id' or 'new').
   * When this changes, the initial state is re-captured.
   */
  instanceKey?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Deep equality check for two values.
 * Handles primitives, arrays, and plain objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null) return a === b;

  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}

/**
 * Get a nested value from an object using dot notation.
 * Example: getNestedValue({ a: { b: 1 } }, 'a.b') => 1
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj as Record<string, unknown>;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part] as Record<string, unknown>;
  }

  return current;
}

/**
 * Deep clone an object to prevent mutation of initial state.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for detecting changes between initial and current object state.
 *
 * @param currentValue - The current value to track changes for
 * @param options - Configuration options for change detection
 * @returns Change detection result with hasChanges, changedFields, and resetChanges
 *
 * @example
 * ```tsx
 * const { hasChanges, changedFields, resetChanges } = useChangeDetection(
 *   formData,
 *   { fields: ['name', 'email', 'address'], instanceKey: formData.id }
 * );
 *
 * // Show unsaved changes warning
 * if (hasChanges) {
 *   return <ConfirmDialog message="You have unsaved changes" />;
 * }
 * ```
 */
export function useChangeDetection<T extends Record<string, unknown>>(
  currentValue: T,
  options: ChangeDetectionOptions<T> = {}
): ChangeDetectionResult<T> {
  const { fields, compare, instanceKey } = options;

  // Store initial state - use state to trigger re-renders when reset
  const [captureVersion, setCaptureVersion] = useState(0);
  const initialStateRef = useRef<T | null>(null);
  const capturedKeyRef = useRef<string | null>(null);

  // Capture initial state synchronously when instanceKey changes or on first render
  const effectiveKey = instanceKey ?? 'default';
  if (capturedKeyRef.current !== effectiveKey) {
    initialStateRef.current = deepClone(currentValue);
    capturedKeyRef.current = effectiveKey;
  }

  // Calculate whether changes exist
  // Include captureVersion to re-compute after reset
  const hasChanges = useMemo(() => {
    if (!initialStateRef.current) return false;

    // Use custom comparison if provided
    if (compare) {
      return !compare(initialStateRef.current, currentValue);
    }

    // Compare specific fields if provided
    if (fields && fields.length > 0) {
      return fields.some(field => {
        const fieldPath = String(field);
        const initialVal = getNestedValue(initialStateRef.current, fieldPath);
        const currentVal = getNestedValue(currentValue, fieldPath);
        return !deepEqual(initialVal, currentVal);
      });
    }

    // Default: deep compare entire object
    return !deepEqual(initialStateRef.current, currentValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, fields, compare, captureVersion]);

  // Calculate which fields have changed
  // Include captureVersion to re-compute after reset
  const changedFields = useMemo((): string[] => {
    if (!initialStateRef.current) return [];

    const fieldsToCheck = fields
      ? fields.map(String)
      : Object.keys(currentValue);

    return fieldsToCheck.filter(field => {
      const initialVal = getNestedValue(initialStateRef.current, field);
      const currentVal = getNestedValue(currentValue, field);
      return !deepEqual(initialVal, currentVal);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, fields, captureVersion]);

  // Reset changes (re-capture current state as initial)
  const resetChanges = useCallback(() => {
    initialStateRef.current = deepClone(currentValue);
    setCaptureVersion(v => v + 1); // Trigger re-render to update hasChanges
  }, [currentValue]);

  // Force capture of current state as new initial state
  const captureInitialState = useCallback(() => {
    initialStateRef.current = deepClone(currentValue);
    capturedKeyRef.current = instanceKey ?? 'default';
    setCaptureVersion(v => v + 1); // Trigger re-render to update hasChanges
  }, [currentValue, instanceKey]);

  return {
    hasChanges,
    changedFields,
    resetChanges,
    initialState: initialStateRef.current,
    captureInitialState,
  };
}

// ============================================================================
// Specialized Variants
// ============================================================================

/**
 * Simplified change detection for comparing against specific fields.
 * Useful when you only care about certain properties changing.
 *
 * @example
 * ```tsx
 * const { hasChanges } = useFieldChanges(transaction, ['merchant', 'total', 'items']);
 * ```
 */
export function useFieldChanges<T extends Record<string, unknown>>(
  currentValue: T,
  fields: (keyof T)[] | string[],
  instanceKey?: string
): Omit<ChangeDetectionResult<T>, 'initialState' | 'captureInitialState'> {
  const result = useChangeDetection(currentValue, { fields, instanceKey });
  return {
    hasChanges: result.hasChanges,
    changedFields: result.changedFields,
    resetChanges: result.resetChanges,
  };
}

/**
 * Simple dirty flag for tracking if any changes have been made.
 * Minimal API for basic form dirty state.
 *
 * @example
 * ```tsx
 * const isDirty = useIsDirty(formData, formData.id);
 * if (isDirty && navigatingAway) showWarning();
 * ```
 */
export function useIsDirty<T extends Record<string, unknown>>(
  currentValue: T,
  instanceKey?: string
): boolean {
  const { hasChanges } = useChangeDetection(currentValue, { instanceKey });
  return hasChanges;
}
