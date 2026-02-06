# Tech Debt Story TD-14d-51: Use CSS Variable for Error Color with Fallback

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11c
> **Priority:** LOW (design system consistency)
> **Estimated Effort:** XS (< 15 min)
> **Risk:** LOW (styling only)

## Story

As a **developer**,
I want **error colors to use CSS variables with fallbacks**,
So that **the design system is consistent and themes can override error colors if needed**.

## Problem Statement

The `TransactionSharingToggle` component uses a hardcoded error color instead of a CSS variable:

**Current Code (line 191):**
```typescript
style={{ color: '#ef4444' }}
```

While `#ef4444` is an approved exception per the UI conventions (Task 3.1), using a CSS variable with fallback would improve consistency and allow theme customization.

## Acceptance Criteria

- [ ] AC1: Error color uses CSS variable with fallback: `var(--error, #ef4444)`
- [ ] AC2: Visual appearance unchanged (fallback matches current color)
- [ ] AC3: Tests still pass

## Tasks / Subtasks

- [ ] 1.1 Update inline style to use CSS variable with fallback
- [ ] 1.2 Verify visual appearance in all themes
- [ ] 1.3 (Optional) Add `--error` variable to theme definitions if not present

## Dev Notes

### Proposed Change

```typescript
// TransactionSharingToggle.tsx:191
style={{ color: 'var(--error, #ef4444)' }}
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Functionality impact | None | None |
| Design system benefit | Improved consistency | Acceptable per conventions |

**Recommendation:** Low priority - current implementation is explicitly allowed per UI conventions

### Context

The UI conventions document (Task 3.1) states:
> "All colors use CSS custom properties (no hardcoded colors **except #ef4444**)"

This exception was granted for warning/error colors, but using a CSS variable with fallback is still a minor improvement.

### References

- [14d-v2-1-11c](./14d-v2-1-11c-ui-components-integration.md) - Source story
- [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md) - UI conventions
