# Story 15-TD-19: Sanitizer Defense-in-Depth Hardening

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** LOW
**Status:** done

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

- [x] **AC1:** Sanitizer loops until no patterns are found (multi-pass), preventing reconstruction bypass
- [x] **AC2:** Input is URL-decoded before pattern matching (catches `%2F`-encoded slashes in data URIs)
- [x] **AC3:** Pre-truncation applied before regex processing (e.g., `maxLength * 10` cap)
- [x] **AC4:** Tests for reconstruction bypass vectors: `javasjavascript:cript:alert(1)`, `<scrip<script>t>alert(1)</scrip</script>t>`
- [x] **AC5:** Tests for URL-encoded bypass: `data:text%2Fhtml,payload`
- [x] **AC6:** All existing sanitize tests still pass

## Tasks

- [x] **Task 1:** Implement multi-pass sanitization loop
  - [x] Loop `DANGEROUS_PATTERNS` removal until output stabilizes (no change between passes)
  - [x] Add safety limit (max 100 passes) to prevent infinite loops
- [x] **Task 2:** Add URL-decode pre-processing
  - [x] `try { result = decodeURIComponent(result) } catch { /* ignore */ }` before pattern matching
  - [x] Consider double-decode (`%2525` → `%25` → `%`)
- [x] **Task 3:** Add pre-truncation before regex processing
  - [x] Cap at `maxLength * 10` before entering pattern loop (generous buffer for pattern removal)
- [x] **Task 4:** Add tests for all bypass vectors

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
- Multi-pass loop safety limit increased from 10 to 100 per security review (deep nesting vectors)
- Control char removal moved BEFORE pattern matching per security review (prevents \x00 splitting attacks)
- Added orphaned `<script>` tag pattern to DANGEROUS_PATTERNS (reconstruction defense)
- URL-decode is unconditional — transforms `%2F` → `/` etc. in all inputs (acceptable for display text)
- 55 total tests (29 existing + 26 new: 6 multi-pass + 6 URL-encode + 4 pre-truncation + 4 control-char + 1 triple-encode + 1 loop-limit + 3 NaN-maxLength + 5 legacy-patterns)

### Code Review Quick Fixes Applied (2026-02-12)

- **#1 (HIGH):** URL-decode loop until stable (replaces fixed double-decode, handles arbitrary encoding depth)
- **#2 (MED):** `safeMaxLength` guard against NaN/Infinity/negative values
- **#3 (MED):** `MAX_SANITIZE_PASSES` moved to module scope alongside other constants
- **#6 (LOW):** Test for pathological deeply nested input (loop safety limit)
- **#7 (LOW):** Added `livescript:` and `mocha:` legacy protocol patterns
- **#8 (LOW):** Added `expression()` and `-moz-binding:` CSS patterns
- **#9 (LOW):** Restored `@example` JSDoc blocks
- **#10 (LOW):** Fixed task text ("max 10" → "max 100")

### Senior Developer Review (ECC)

- **Review date:** 2026-02-12
- **Classification:** STANDARD
- **ECC agents:** code-reviewer, security-reviewer
- **Outcome:** APPROVE (8.5/10) — 8 quick fixes applied, 3 design decisions documented
- **Tests:** 55/55 passing (all suites green)

### Accepted Design Decisions (not deferred — no TD stories needed)

- **HTML tag stripping:** Sanitizer uses known-dangerous-pattern removal, not full HTML stripping. Accepted — React auto-escaping handles `<iframe>`, `<object>`, etc.
- **URL decode side effects:** Blanket decode transforms `%xx` in all input. Accepted — users don't type percent-encoded text in form fields.
- **HTML entity bypass:** `&#115;` not decoded. Accepted — HTML entities are browser-parser concern; React escapes output.
