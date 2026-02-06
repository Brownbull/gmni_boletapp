# Tech Debt Story TD-14d-24: ViewModeSwitcher Code Quality Improvements

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-10b
> **Priority:** Medium (code quality improvements)
> **Estimated Effort:** ~1-2 hours
> **Risk:** Low (non-breaking improvements)

## Story

As a **developer**,
I want **ViewModeSwitcher to have cleaner code patterns and better documentation**,
So that **the component is easier to maintain and performs optimally**.

## Problem Statement

The ECC Code Review identified several code quality improvements that were deferred to avoid scope creep in story 14d-v2-1-10b. These are non-blocking but would improve maintainability and performance.

## Acceptance Criteria

1. **Given** the ViewModeSwitcher component
   **When** it renders
   **Then** inline style objects are defined as constants (not recreated each render)

2. **Given** the ViewModeSwitcher component
   **When** it re-opens after being closed
   **Then** the focus effect guards against refs not being ready

3. **Given** the ViewModeOption sub-component
   **When** a developer reads the code
   **Then** JSDoc documentation explains its purpose and props

4. **Given** icon sizes in the component
   **When** reviewing the code
   **Then** magic numbers are replaced with named constants

## Tasks / Subtasks

- [ ] Task 1: Extract inline styles to constants
  - [ ] Create `STYLES` object at module level for reusable style definitions
  - [ ] Replace inline `style={{}}` objects with references to constants
  - [ ] Affected lines: ~206-208, 213-215, 271, 275, 277, 281-282, 329, 335, 344, 351, 364

- [ ] Task 2: Fix focus effect timing
  - [ ] Add guard in focus effect to check refs are ready before focusing
  - [ ] Consider combining with reset effect or adding explicit ready check
  - [ ] File: `ViewModeSwitcher.tsx:166-170`

- [ ] Task 3: Add JSDoc for ViewModeOption
  - [ ] Document the component purpose
  - [ ] Document each prop with `@param` tags
  - [ ] File: `ViewModeSwitcher.tsx:299-308`

- [ ] Task 4: Define icon size constants
  - [ ] Add `const ICON_SIZE = 24` at module level
  - [ ] Add `const CHECK_ICON_SIZE = 20` at module level
  - [ ] Replace magic numbers in icon `size` props
  - [ ] Affected lines: ~232, 249, 277, 363

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low - isolated changes | Low - file stable |
| **Context window fit** | Would bloat 14d-v2-1-10b | Clean separation |
| **Sprint capacity** | Uses current sprint time | Scheduled for later |
| **Accumulation risk** | Resolved immediately | May compound |
| **Dependency risk** | None | None |

**Recommendation:** Defer - These are non-breaking improvements that don't affect functionality.

### Code Examples

```tsx
// Before (inline styles)
style={{ backgroundColor: 'var(--bg-card, #ffffff)' }}

// After (constants)
const STYLES = {
  card: { backgroundColor: 'var(--bg-card, #ffffff)' },
  // ...
} as const;

// Usage
style={STYLES.card}
```

```tsx
// Icon size constants
const ICON_SIZE = 24;
const CHECK_ICON_SIZE = 20;

// Usage
<Users size={ICON_SIZE} />
<Check size={CHECK_ICON_SIZE} />
```

### Dependencies

- None

### References

- [Story 14d-v2-1-10b](./14d-v2-1-10b-viewmodeswitcher-ui.md) - Source of this tech debt item
- [ViewModeSwitcher Component](../../../../src/features/shared-groups/components/ViewModeSwitcher.tsx)
