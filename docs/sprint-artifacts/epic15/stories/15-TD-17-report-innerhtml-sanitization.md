# Tech Debt Story TD-15-TD-17: ReportDetailOverlay innerHTML Sanitization

Status: ready-for-dev

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

- [ ] **AC1:** `printContainer.innerHTML = ...` in `handlePrintReport()` replaced with DOM API calls (`createElement`, `textContent`, `appendChild`)
- [ ] **AC2:** No `dangerouslySetInnerHTML` or `innerHTML` usage in the component after fix
- [ ] **AC3:** Print-to-PDF output visually identical before and after change
- [ ] **AC4:** All tests pass

## Tasks

- [ ] **Task 1:** Refactor `handlePrintReport()` to use DOM APIs
  - [ ] Replace template literal HTML with `document.createElement()` + `textContent` for text content
  - [ ] Use `element.style.*` for styling instead of inline HTML style attributes
  - [ ] Preserve all print-specific CSS classes and branding elements
- [ ] **Task 2:** Verify visual parity
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
