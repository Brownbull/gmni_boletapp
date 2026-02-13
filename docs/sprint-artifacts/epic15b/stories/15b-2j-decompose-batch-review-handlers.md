# Story 15b-2j: Decompose useBatchReviewHandlers.ts

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Decompose `useBatchReviewHandlers.ts` (768 lines) inside `features/batch-review/`. This hook manages batch review event handlers. Target: <800 lines (currently in warning zone, technically under limit but 19 outgoing deps makes it a coupling hotspot).

## Acceptance Criteria

- [ ] **AC1:** useBatchReviewHandlers.ts reduced to <600 lines (target well below warning zone)
- [ ] **AC2:** Extracted files are focused and cohesive
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** Fan-out reduced (19 → lower)
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Identify handler groups by domain
  - [ ] Item-level handlers (approve, reject, edit)
  - [ ] Batch-level handlers (submit, cancel, navigation)
  - [ ] Utility/helper functions
- [ ] **Task 3:** Extract handler groups into focused hooks or helper files
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | MODIFY | Reduce from 768 to <600 |
| `src/features/batch-review/hooks/useBatchItemHandlers.ts` | CREATE | Item-level handlers |
| `src/features/batch-review/utils/batchReviewHelpers.ts` | CREATE | Extracted utility functions |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- At 768 lines this is technically under the 800-line limit but has 19 outgoing deps (fan-out)
- The high fan-out makes it a coupling hotspot worth decomposing
- Hooks that return many handlers can be split into sub-hooks that each return a subset
