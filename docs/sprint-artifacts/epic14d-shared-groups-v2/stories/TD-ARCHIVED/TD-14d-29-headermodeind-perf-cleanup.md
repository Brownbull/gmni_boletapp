# Tech Debt Story TD-14d-29: HeaderModeIndicator Performance & Code Cleanup

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10c
> **Priority:** Low (LOW severity findings, code quality)
> **Estimated Effort:** 1 hour
> **Risk:** Very Low (minor optimizations)

## Story

As a **developer**,
I want **optimized and DRY code in HeaderModeIndicator**,
So that **the component performs well and is maintainable**.

## Problem Statement

The ECC Code Review identified minor code quality issues:

1. **LOW**: Inline style objects at lines 119-121 and 125-129 create new object references on each render, which could cause unnecessary re-renders of child components.

2. **LOW**: Font-family string for emoji rendering is duplicated at lines 127-128 and 171:
   ```tsx
   fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif'
   ```

3. **LOW**: Test file at 472 lines is approaching the upper limit of maintainability. Edge case tests (lines 404-471) could potentially be consolidated.

## Acceptance Criteria

1. **Given** the HeaderModeIndicator component
   **When** it re-renders with the same props/state
   **Then** inline style objects maintain referential equality (memoized)

2. **Given** the emoji font-family
   **When** I search for its definition
   **Then** it is defined in ONE place as a constant

3. **Given** the test file
   **When** I review the edge case tests
   **Then** similar tests are consolidated where appropriate without losing coverage

## Tasks / Subtasks

- [ ] Task 1: Extract emoji font-family constant
  - [ ] Create `EMOJI_FONT_FAMILY` constant at top of file
  - [ ] Replace both occurrences (lines 127, 171)
  - [ ] Consider moving to shared constants if used elsewhere

- [ ] Task 2: Memoize inline style objects
  - [ ] Use `useMemo` for dynamic style objects that depend on `group.color`
  - [ ] Keep static styles in `STYLES` constant (already done)
  - [ ] Only memoize where benefit outweighs complexity

- [ ] Task 3: Consolidate edge case tests (optional)
  - [ ] Review if parameterized tests (`it.each`) can consolidate similar cases
  - [ ] Maintain 100% coverage - don't remove any test scenarios
  - [ ] Only consolidate if readability improves

## Dev Notes

### Font-Family Constant

```typescript
// At top of HeaderModeIndicator.tsx
const EMOJI_FONT_FAMILY = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif';

// Usage
<span style={{ fontFamily: EMOJI_FONT_FAMILY, fontSize: '24px' }}>
```

### Memoized Style

```typescript
// Only if group.color changes frequently
const groupIconStyle = useMemo(() => ({
  ...STYLES.groupIcon,
  background: group?.color || 'var(--primary, #2563eb)',
}), [group?.color]);
```

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/features/shared-groups/components/HeaderModeIndicator.tsx` | Modify | Extract constant, consider memoization |
| `tests/unit/features/shared-groups/components/HeaderModeIndicator.test.tsx` | Modify | Optional test consolidation |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Performance impact** | Minimal | Minimal - React optimizes well |
| **Merge conflict risk** | Low | Low |
| **Readability benefit** | Moderate | - |
| **Complexity added** | useMemo adds complexity | None |

**Recommendation:** Defer - performance impact is minimal and current code is readable. Address during larger refactoring efforts.

### References

- [14d-v2-1-10c-header-mode-indicator.md](./14d-v2-1-10c-header-mode-indicator.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Code Reviewer agent
