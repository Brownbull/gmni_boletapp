# Tech Debt Story TD-14d-28: CSS Color Injection Validation

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10c
> **Priority:** Medium (MEDIUM severity security finding)
> **Estimated Effort:** 2-3 hours
> **Risk:** Low (defensive enhancement)

## Story

As a **security-conscious developer**,
I want **validation for user-provided color values before using in CSS**,
So that **CSS injection attacks via malicious color values are prevented**.

## Problem Statement

The ECC Security Review identified a potential CSS injection vulnerability:

- **MEDIUM**: `group.color` is user-provided content that is used directly in inline styles:
  ```tsx
  style={{ background: group.color || 'var(--primary, #2563eb)' }}
  ```

If `group.color` contains malicious values like `url(javascript:...)` or CSS injection payloads, this could potentially be exploited. While modern browsers largely mitigate CSS-based JavaScript execution, defense-in-depth recommends validation.

Additionally, `updateGroupData` in useViewModeStore doesn't validate the group object before updating state.

## Acceptance Criteria

1. **Given** a group with a valid hex color (e.g., `#FF5733`)
   **When** HeaderModeIndicator renders
   **Then** the color is used as background

2. **Given** a group with an invalid color (e.g., `url(evil)`, `expression()`, empty string)
   **When** HeaderModeIndicator renders
   **Then** the fallback CSS variable is used instead

3. **Given** a call to `updateGroupData` with invalid group data
   **When** the validation runs
   **Then** a warning is logged (DEV only) and state is not updated

## Tasks / Subtasks

- [ ] Task 1: Create color validation utility
  - [ ] Create `src/utils/validateColor.ts`
  - [ ] Implement `isValidHexColor(color: string): boolean`
  - [ ] Pattern: `/^#[0-9A-Fa-f]{6}$/` or `/^#[0-9A-Fa-f]{3}$/`
  - [ ] Add unit tests

- [ ] Task 2: Apply validation in HeaderModeIndicator
  - [ ] Import validation utility
  - [ ] Use: `const safeColor = group.color && isValidHexColor(group.color) ? group.color : undefined`
  - [ ] Fallback handles undefined via `|| 'var(--primary, #2563eb)'`

- [ ] Task 3: Add validation to updateGroupData
  - [ ] Validate group object has required fields (`id`, `name`)
  - [ ] Validate `color` field if present
  - [ ] Log warning in DEV mode for invalid data
  - [ ] Update tests

- [ ] Task 4: Apply validation to other components using group.color
  - [ ] Search for `group.color` usage across codebase
  - [ ] Apply same validation pattern where needed

## Dev Notes

### Color Validation Helper

```typescript
// src/utils/validateColor.ts
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(color: string | undefined | null): boolean {
  if (!color) return false;
  return HEX_COLOR_REGEX.test(color);
}

export function getSafeColor(color: string | undefined | null, fallback: string): string {
  return isValidHexColor(color) ? color! : fallback;
}
```

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/validateColor.ts` | Create | Color validation utility |
| `tests/unit/utils/validateColor.test.ts` | Create | Unit tests |
| `src/features/shared-groups/components/HeaderModeIndicator.tsx` | Modify | Apply validation |
| `src/shared/stores/useViewModeStore.ts` | Modify | Add group validation |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Security impact** | Proactive defense | Reactive if exploited |
| **Merge conflict risk** | Low | Low |
| **Context window fit** | Easy | Easy |
| **Browser mitigation** | Modern browsers block most CSS JS | Older browsers may be vulnerable |

**Recommendation:** Defer with low priority - modern browsers mitigate CSS injection, but implement before production release.

### References

- [14d-v2-1-10c-header-mode-indicator.md](./14d-v2-1-10c-header-mode-indicator.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Security Reviewer agent
- OWASP CSS Injection: https://owasp.org/www-community/attacks/CSS_Injection
