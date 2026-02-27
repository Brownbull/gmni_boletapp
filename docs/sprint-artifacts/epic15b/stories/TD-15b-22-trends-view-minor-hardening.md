# Tech Debt Story TD-15b-22: TrendsView Minor Hardening

**Status:** done

> **Source:** ECC Code Review (2026-02-27) on story TD-15b-21
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **to harden TrendsView extracted components with color validation, shared locale guard, and cleaner sync patterns**, so that **the code is resilient against edge cases and DRY across modules**.

## Acceptance Criteria

- [x] AC1: CSS color values passed to inline styles validated via `safeCSSColor()` from `@/utils/validation.ts` in SankeySlide.tsx
- [x] AC2: Locale guard extracted to shared util (`sanitizeLocale`) in `@/utils/validation.ts`, imported in SankeySlide.tsx + useCategoryStatsPopup.ts
- [x] AC3: setTimeout(0) ref reset in useTrendsViewSync.ts replaced with `queueMicrotask`
- [x] AC4: All existing tests pass after changes (7,040 passed, 0 failed)

## Tasks / Subtasks

### Task 1: CSS color validation
- [x] 1.1 Reused existing `safeCSSColor()` from `@/utils/validation.ts` (hex regex guard already present)
- [x] 1.2 Applied `safeCSSColor()` to 3 inline style injection points in SankeySlide.tsx
- [x] 1.3 Added 2 tests for color validation (valid hex + invalid injection fallback)

### Task 2: Shared locale guard
- [x] 2.1 Created `sanitizeLocale(locale: string): 'es' | 'en'` in `@/utils/validation.ts`
- [x] 2.2 Replaced inline guards in SankeySlide.tsx and useCategoryStatsPopup.ts
- [x] 2.3 Added 4 unit tests for `sanitizeLocale` in validation.test.ts

### Task 3: Sync pattern cleanup
- [x] 3.1 Replaced `setTimeout(() => { ... }, 0)` with `queueMicrotask(() => { ... })` in useTrendsViewSync.ts line 139
- [x] 3.2 All 16 useTrendsViewSync tests pass (bidirectional sync verified)

## Dev Notes

- Source story: [TD-15b-21](./TD-15b-21-trends-view-polish.md)
- Review findings: #5, #6, #7
- Files changed: SankeySlide.tsx, useCategoryStatsPopup.ts, useTrendsViewSync.ts, validation.ts
- Task 1 note: Reused existing `safeCSSColor`/`validateCSSColor` (hex-only). Story originally proposed `isValidCssColor` with rgb support, but the codebase exclusively uses hex colors. No new function needed.
- Task 3 note: Only the ref-reset `setTimeout(fn, 0)` was replaced. The deferred dispatch `setTimeout` at line 280 serves a different purpose and is out of scope.

## Deferred Items

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-23 | safeCSSColor 3-digit hex normalization for alpha suffix concatenation | LOW | CREATED |

## Senior Developer Review (ECC)

- **Date:** 2026-02-27
- **Classification:** STANDARD
- **Agents:** code-reviewer, security-reviewer
- **Overall Score:** 8.75/10
- **Outcome:** APPROVE — all ACs met, CSS injection prevention solid, locale whitelist correct
- **Findings:** 4 (0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 2 INFO)
- **Fixed:** 0 | **Deferred:** 1 (TD-15b-23)
