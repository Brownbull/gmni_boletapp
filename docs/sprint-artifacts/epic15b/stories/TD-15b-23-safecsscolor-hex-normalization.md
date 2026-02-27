# Tech Debt Story TD-15b-23: safeCSSColor Hex Normalization

**Status:** done

> **Source:** ECC Code Review (2026-02-27) on story TD-15b-22
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **safeCSSColor to normalize 3-digit hex colors to 6-digit before returning**, so that **downstream alpha suffix concatenation (e.g. `+ '20'`) produces valid CSS values**.

## Acceptance Criteria

- [x] AC1: `safeCSSColor('#abc')` returns `'#aabbcc'` (normalized 6-digit)
- [x] AC2: `safeCSSColor('#abcdef')` returns `'#abcdef'` unchanged
- [x] AC3: SankeySlide `backgroundColor` with 3-digit hex input produces valid 8-digit hex (e.g. `#aabbcc20`)
- [x] AC4: Existing validation.test.ts tests updated for normalization behavior
- [x] AC5: All existing tests pass after changes

## Tasks / Subtasks

### Task 1: Normalize 3-digit hex in safeCSSColor
- [x] 1.1 Add hex normalization logic in `safeCSSColor()`: expand `#abc` to `#aabbcc`
- [x] 1.2 Update `safeCSSColor` return type documentation
- [x] 1.3 Update validation.test.ts: `safeCSSColor('#abc')` now returns `'#aabbcc'`

## Dev Notes

- Source story: [TD-15b-22](./TD-15b-22-trends-view-minor-hardening.md)
- Review findings: #1
- Files affected: src/utils/validation.ts, tests/unit/utils/validation.test.ts
- Context: `SankeySlide.tsx:75` does `safeCSSColor(color) + '20'` for alpha. If color is 3-digit hex like `#abc`, result is `#abc20` (5 chars after #) which is invalid CSS. Normalizing to 6-digit ensures `#aabbcc20` (valid 8-digit hex with alpha).
- In practice, category colors are always 6-digit hex from the config, so this is a defensive hardening — no known production bug.

## Deferred Items

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-24 | Validate fallback parameter in safeCSSColor against hex pattern | LOW | CREATED |

## Senior Developer Review (ECC)

- **Date:** 2026-02-27
- **Classification:** TRIVIAL
- **Agents:** code-reviewer
- **Score:** 9/10 — APPROVE
- **Findings:** 4 (0 critical, 0 high, 2 warn, 2 suggestion)
- **Fixed:** 0 | **Deferred:** 1 (TD-15b-24)
