# Tech Debt Story TD-18-25: SkeletonLine Render Coverage

Status: ready-for-dev

> **Source:** ECC Code Review (2026-04-06) on story TD-18-24
> **Priority:** MEDIUM | **Estimated Effort:** 1 point
> **Stage:** MVP

## Story
As a **developer**, I want **tests verifying SkeletonLine shimmer elements render in ScanSkeleton**, so that **skeleton placeholder DOM nodes (merchant, total, items) are confirmed present and not silently removed by refactoring**.

## Acceptance Criteria

### Task 1: Add SkeletonLine render assertions
- [ ] AC-1: Test verifies shimmer placeholder elements render in the DOM (merchant, total, items sections)
- [ ] AC-2: Test verifies shimmer elements use theme-appropriate background gradients

## Dev Notes
- Source story: [TD-18-24](./TD-18-24-scan-skeleton-test-coverage.md)
- Review findings: #2
- Files affected: `tests/unit/features/scan/components/ScanSkeleton.test.tsx`
- SkeletonLine is an internal sub-component — test via rendered output, not direct import
