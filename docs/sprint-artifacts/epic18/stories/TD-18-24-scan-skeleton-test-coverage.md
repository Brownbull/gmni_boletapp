# Tech Debt Story TD-18-24: ScanSkeleton Component Test Coverage

Status: review

> **Source:** ECC Code Review (2026-04-06) on story TD-18-19-scan-ux-immediate-overlay
> **Priority:** MEDIUM | **Estimated Effort:** 1 point
> **Stage:** MVP

## Story
As a **developer**, I want **dedicated unit tests for the ScanSkeleton component**, so that **shimmer rendering, ETA display, accessibility, and theme support are verified**.

## Background

TD-18-19 introduced `ScanSkeleton.tsx` (175 lines) as a new component replacing circular progress indicators during scan upload/processing. The component has zero dedicated tests — it's only exercised indirectly through ScanOverlay tests that check for processing text.

## Acceptance Criteria

### Task 1: Create ScanSkeleton test file
- [x] AC-1: Test file `tests/unit/features/scan/components/ScanSkeleton.test.tsx` exists
- [x] AC-2: Tests verify skeleton renders with processing text
- [x] AC-3: Tests verify ETA display when `estimatedTime` is provided vs null
- [x] AC-4: Tests verify light and dark theme rendering
- [x] AC-5: Tests verify accessibility: `aria-label` attribute present
- [x] AC-6: Tests verify cancel button renders when `onCancel` is provided and does not render when omitted

## Dev Notes
- Source story: [TD-18-19-scan-ux-immediate-overlay](./TD-18-19-scan-ux-immediate-overlay.md)
- Review findings: #3
- Files affected: `tests/unit/features/scan/components/ScanSkeleton.test.tsx` (new), `src/features/scan/components/ScanSkeleton.tsx`
