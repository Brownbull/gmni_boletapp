# Tech Debt Story TD-15b-24: safeCSSColor Fallback Validation

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-27) on story TD-15b-23
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **safeCSSColor's fallback parameter to be validated against the same hex pattern**, so that **the CSS injection prevention guarantee documented in the JSDoc is not undermined by an unsafe fallback**.

## Acceptance Criteria

- [ ] AC1: `safeCSSColor('invalid', 'var(--evil)')` returns `DEFAULT_CSS_COLOR_FALLBACK` instead of the unsafe fallback
- [ ] AC2: `safeCSSColor('invalid', '#ff0000')` returns `'#ff0000'` (valid fallback passes through)
- [ ] AC3: Existing callers using custom fallback are audited — any relying on non-hex fallbacks are updated
- [ ] AC4: Tests updated for new fallback validation behavior

## Tasks / Subtasks

### Task 1: Validate fallback parameter
- [ ] 1.1 Add `validateCSSColor(fallback)` guard, fall back to `DEFAULT_CSS_COLOR_FALLBACK` if invalid
- [ ] 1.2 Audit all callers of `safeCSSColor` with custom fallback — update any non-hex usages
- [ ] 1.3 Update tests: invalid fallback now returns default, valid fallback still passes through

## Dev Notes

- Source story: [TD-15b-23](./TD-15b-23-safecsscolor-hex-normalization.md)
- Review findings: #1
- Files affected: src/utils/validation.ts, tests/unit/utils/validation.test.ts
- Context: The current `safeCSSColor` validates the `color` parameter but returns the `fallback` parameter verbatim. A caller can pass `'var(--evil)'` as fallback, which bypasses the injection prevention the function is designed to enforce. This is a pre-existing design choice, not introduced by TD-15b-23.
- Breaking change: Test at validation.test.ts:130 asserts `safeCSSColor('invalid', 'var(--primary, #2563eb)')` returns the var() string. This behavior would change.
