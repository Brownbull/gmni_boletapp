# Tech Debt Story TD-15-TD-17: ReportDetailOverlay innerHTML Sanitization

Status: done

> **Source:** ECC Code Review (2026-02-11) on story 15-TD-7
> **Priority:** LOW
> **Estimated Effort:** 1 point

## Story

As a **developer**,
I want **the ReportDetailOverlay print function to use DOM APIs instead of innerHTML with template literals**,
So that **the print-to-PDF feature is resistant to XSS even if Firestore report data were compromised**.

## Background

`ReportDetailOverlay.tsx` (~line 145) constructs HTML via template literal interpolation with `reportData.fullTitle` and injects it via `innerHTML`. While `reportData.fullTitle` comes from the app's own report generation pipeline (not direct user input), defense-in-depth recommends using `createElement` + `textContent` to prevent potential XSS if upstream data were ever compromised.

## Acceptance Criteria

- [x] **AC1:** `printContainer.innerHTML = ...` in `handlePrintReport()` replaced with DOM API calls (`createElement`, `textContent`, `appendChild`)
- [x] **AC2:** No `dangerouslySetInnerHTML` or `innerHTML` usage in the component after fix
- [ ] **AC3:** Print-to-PDF output visually identical before and after change (requires manual verification)
- [x] **AC4:** All tests pass (6,579 tests, 11 for this story)

## Tasks

- [x] **Task 1:** Refactor `handlePrintReport()` to use DOM APIs
  - [x] Replace template literal HTML with `document.createElement()` + `textContent` for text content
  - [x] Use `element.className` for CSS classes instead of inline HTML class attributes
  - [x] Preserve all print-specific CSS classes and branding elements
- [ ] **Task 2:** Verify visual parity (manual — requires user validation)
  - [ ] Manual print-to-PDF test comparing before/after output

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/reports/components/ReportDetailOverlay.tsx` | MODIFY | Replace innerHTML with DOM APIs |

## Dev Notes

- Source story: [15-TD-7](./15-TD-7-context-cleanup-dead-code.md)
- Review finding: #6 (MEDIUM severity, Security agent)
- Pre-existing issue — not introduced by 15-TD-7
- Risk is LOW in practice (data from app pipeline, not user input)
- The `brandingHtml` and `headerHtml` template literals both need refactoring

## Senior Developer Review (ECC)

- **Review date:** 2026-02-12
- **Classification:** STANDARD
- **ECC agents used:** code-reviewer, security-reviewer
- **Outcome:** APPROVE (9.5/10)
- **Quick fixes applied:** 2 (afterprint cleanup test, document.title restoration assertion)
- **Total test count after review:** 11 tests (10 original + 1 added)

### Code Review Quick Fixes (2026-02-12)

- Added `afterprint` event cleanup test (finding #6)
- Added `document.title` restoration assertion to timeout cleanup test (finding #7)

### Tech Debt Stories Created

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-22](./15-TD-22-report-print-extract-i18n.md) | Extract print helpers to printUtils.ts + i18n migration (file size, hardcoded locale, hardcoded strings) | LOW | CREATED |
