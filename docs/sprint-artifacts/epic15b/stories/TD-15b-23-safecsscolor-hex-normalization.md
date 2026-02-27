# Tech Debt Story TD-15b-23: safeCSSColor Hex Normalization

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-27) on story TD-15b-22
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **safeCSSColor to normalize 3-digit hex colors to 6-digit before returning**, so that **downstream alpha suffix concatenation (e.g. `+ '20'`) produces valid CSS values**.

## Acceptance Criteria

- [ ] AC1: `safeCSSColor('#abc')` returns `'#aabbcc'` (normalized 6-digit)
- [ ] AC2: `safeCSSColor('#abcdef')` returns `'#abcdef'` unchanged
- [ ] AC3: SankeySlide `backgroundColor` with 3-digit hex input produces valid 8-digit hex (e.g. `#aabbcc20`)
- [ ] AC4: Existing validation.test.ts tests updated for normalization behavior
- [ ] AC5: All existing tests pass after changes

## Tasks / Subtasks

### Task 1: Normalize 3-digit hex in safeCSSColor
- [ ] 1.1 Add hex normalization logic in `safeCSSColor()`: expand `#abc` to `#aabbcc`
- [ ] 1.2 Update `safeCSSColor` return type documentation
- [ ] 1.3 Update validation.test.ts: `safeCSSColor('#abc')` now returns `'#aabbcc'`

## Dev Notes

- Source story: [TD-15b-22](./TD-15b-22-trends-view-minor-hardening.md)
- Review findings: #1
- Files affected: src/utils/validation.ts, tests/unit/utils/validation.test.ts
- Context: `SankeySlide.tsx:75` does `safeCSSColor(color) + '20'` for alpha. If color is 3-digit hex like `#abc`, result is `#abc20` (5 chars after #) which is invalid CSS. Normalizing to 6-digit ensures `#aabbcc20` (valid 8-digit hex with alpha).
- In practice, category colors are always 6-digit hex from the config, so this is a defensive hardening — no known production bug.
