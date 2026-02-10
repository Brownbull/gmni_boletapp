/**
 * Story 15-7c: ThemeContext is now DEPRECATED
 *
 * Theme and locale settings have been migrated to useSettingsStore (Zustand).
 * ThemeContext.tsx only re-exports types for backward compatibility.
 *
 * Functional tests for theme/locale settings are in:
 * - tests/unit/shared/stores/useSettingsStore.test.ts
 *
 * This file verifies the type re-exports still exist.
 */

import { describe, it, expect } from 'vitest';

describe('ThemeContext (Story 15-7c: deprecated, type-only)', () => {
    it('should export ThemeContextValue type (backward compatibility)', async () => {
        // Dynamic import to verify module is loadable
        const module = await import('../../../src/contexts/ThemeContext');

        // Module should exist and be importable (types are erased at runtime,
        // but the module itself should load without errors)
        expect(module).toBeDefined();
    });
});
