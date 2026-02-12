# Story 15-TD-19: Sanitizer Defense-in-Depth Hardening

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** LOW
**Status:** ready-for-dev

## Description

Harden `sanitizeInput()` in `sanitize.ts` with three defense-in-depth improvements: multi-pass pattern removal to prevent reconstruction bypass, URL-decode before pattern matching, and pre-truncation to limit regex processing on oversized inputs.

## Source

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-8
> **Priority:** LOW
> **Estimated Effort:** 2 points

- **Finding #2 (HIGH):** Single-pass sanitization allows pattern reconstruction. Input like `javasjavascript:cript:` sanitizes to `javascript:alert(1)`. Mitigated by React's default escaping but defense-in-depth gap.
- **Finding #4 (MEDIUM):** URL-encoded data: URI `data:text%2Fhtml,payload` bypasses the pattern. Low practical impact (React escapes, no user input in href/src).
- **Finding #10 (LOW):** Length truncation happens after regex processing. Huge inputs processed through 5 regexes before truncation. No ReDoS risk (linear-time regexes) but wasteful.

## Acceptance Criteria

- [ ] **AC1:** Sanitizer loops until no patterns are found (multi-pass), preventing reconstruction bypass
- [ ] **AC2:** Input is URL-decoded before pattern matching (catches `%2F`-encoded slashes in data URIs)
- [ ] **AC3:** Pre-truncation applied before regex processing (e.g., `maxLength * 10` cap)
- [ ] **AC4:** Tests for reconstruction bypass vectors: `javasjavascript:cript:alert(1)`, `<scrip<script>t>alert(1)</scrip</script>t>`
- [ ] **AC5:** Tests for URL-encoded bypass: `data:text%2Fhtml,payload`
- [ ] **AC6:** All existing sanitize tests still pass

## Tasks

- [ ] **Task 1:** Implement multi-pass sanitization loop
  - [ ] Loop `DANGEROUS_PATTERNS` removal until output stabilizes (no change between passes)
  - [ ] Add safety limit (max 10 passes) to prevent infinite loops
- [ ] **Task 2:** Add URL-decode pre-processing
  - [ ] `try { result = decodeURIComponent(result) } catch { /* ignore */ }` before pattern matching
  - [ ] Consider double-decode (`%2525` → `%25` → `%`)
- [ ] **Task 3:** Add pre-truncation before regex processing
  - [ ] Cap at `maxLength * 10` before entering pattern loop (generous buffer for pattern removal)
- [ ] **Task 4:** Add tests for all bypass vectors

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/utils/sanitize.ts` | MODIFY | Multi-pass loop + URL decode + pre-truncation |
| `tests/unit/utils/sanitize.test.ts` | MODIFY | Add bypass vector tests |

## Dev Notes

- Source story: [15-TD-8](./15-TD-8-input-validation-hardening.md)
- Review findings: #2, #4, #10
- React's default escaping prevents most XSS in rendered content
- The `innerHTML` usage in `ReportDetailOverlay.tsx` uses app-generated strings, not user input (covered by 15-TD-17)
- Multi-pass loop must have a safety limit to prevent theoretical infinite loops if patterns interact cyclically
