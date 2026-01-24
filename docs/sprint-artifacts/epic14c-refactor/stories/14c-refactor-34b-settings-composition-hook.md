# Story 14c-refactor.34b: SettingsView Composition Hook

Status: complete

## Story

As a **developer maintaining App.tsx**,
I want **a composition hook for SettingsView**,
So that **SettingsView can use spread syntax and reduce App.tsx inline props by ~80 lines**.

## Background

**Part of split from 14c-refactor.34** - Original story exceeded sizing guidelines (5 tasks, 31 subtasks, 8 files).

SettingsView has the most props of any view due to its complex settings management. This story creates the hook to encapsulate all ~80 lines of inline props.

### SettingsView Complexity

SettingsView manages:
- User preferences (theme, language, currency, date format)
- Category mappings CRUD (add, edit, delete)
- Merchant mappings CRUD
- Subcategory mappings CRUD
- Item name mappings CRUD
- Trusted merchants management
- Export functionality
- Profile settings
- Notification settings
- Data management (sign out, delete account)

This results in 15+ callback props that need to be passed.

### Target Reduction

- SettingsView: ~80 lines → 1 line = **-79 lines**

## Acceptance Criteria

1. **Given** SettingsView has ~80 lines of inline props
   **When** this story is completed
   **Then:**
   - `useSettingsViewProps` hook created in `src/hooks/app/`
   - Hook includes all props required by SettingsView
   - App.tsx uses spread: `<SettingsView {...settingsViewProps} />`

2. **Given** SettingsView has many callback props
   **When** the hook is created
   **Then:**
   - All callback props are properly typed
   - Callbacks are memoized with useCallback where appropriate
   - No performance regressions

3. **Given** the hook is created
   **When** integrated into App.tsx
   **Then:**
   - All SettingsView functionality works as before
   - All sub-views (mappings, profile, etc.) work correctly
   - No TypeScript errors

## Tasks / Subtasks

### Task 1: Create useSettingsViewProps

- [x] 1.1 Audit SettingsView props interface in `src/views/SettingsView.tsx`
- [x] 1.2 Document all callback props (expect 15+)
- [x] 1.3 Create `src/hooks/app/useSettingsViewProps.ts`
- [x] 1.4 Define `UseSettingsViewPropsOptions` interface
- [x] 1.5 Define `SettingsViewDataProps` return type
- [x] 1.6 Implement hook with useMemo for data props
- [x] 1.7 Export from `src/hooks/app/index.ts`

### Task 2: Integrate into App.tsx

- [x] 2.1 Import useSettingsViewProps hook
- [x] 2.2 Call hook in App component body with required options
- [x] 2.3 Replace SettingsView inline props with spread syntax
- [x] 2.4 Verify all settings sub-views still work
- [x] 2.5 Run test suite to verify no regressions

## Dev Notes

### Estimation

- **Points:** 3 pts
- **Risk:** MEDIUM - Most complex hook due to callback count

### Dependencies

- **Requires:** Story 34a (Dashboard hook) - OPTIONAL parallelization
- **Blocks:** Story 35 (final line count target)

### Callback Props Strategy

Given the high number of callbacks, consider:
1. Group related callbacks (e.g., all mapping CRUD into objects)
2. Use ViewHandlersContext for shared handlers
3. Ensure proper memoization to prevent unnecessary re-renders

### Hook Pattern

```tsx
export interface UseSettingsViewPropsOptions {
    // User preferences state
    theme: string;
    language: string;
    currency: string;
    // Mapping data
    categoryMappings: CategoryMapping[];
    merchantMappings: MerchantMapping[];
    // Callbacks from App.tsx
    onThemeChange: (theme: string) => void;
    onSignOut: () => void;
    // ... many more
}

export interface SettingsViewDataProps {
    // All props for SettingsView
}

export function useSettingsViewProps(
    options: UseSettingsViewPropsOptions
): SettingsViewDataProps {
    return useMemo(() => ({
        // Transform options to props
    }), [/* dependencies */]);
}
```

## References

- [Story 26: View Prop Composition Hooks](14c-refactor-26-view-prop-composition-hooks.md) - Pattern reference
- [Story 34: Original story (SPLIT)](14c-refactor-34-remaining-view-composition-hooks.md)
- [Source: src/views/SettingsView.tsx]

## File List

**Created:**
- `src/hooks/app/useSettingsViewProps.ts` (659 lines)
- `tests/unit/hooks/app/useSettingsViewProps.test.ts` (67 tests)

**Modified:**
- `src/hooks/app/index.ts` - Export new hook
- `src/App.tsx` - Integrate hook, use spread syntax

## Code Review Fixes (2026-01-23)

**Atlas-Enhanced Code Review** identified and fixed:

1. **[MEDIUM] Underscore prefix on used functions** - Renamed `_setDisplayNamePref`, `_setPhoneNumberPref`, `_setBirthDatePref` to remove underscore (misleading naming convention)
2. **[MEDIUM] Missing error handling tests** - Added 4 tests for callback error propagation and loading state combinations
3. **[LOW] Stale JSDoc comment** - Updated comment at App.tsx:275 to reflect current usage
