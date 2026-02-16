# Story 15b-2l: Decompose useScanHandlers.ts

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose `useScanHandlers.ts` (956 lines) inside `features/scan/`. This hook is an app-level orchestrator for scan operations. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** useScanHandlers.ts reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Identify handler groups
  - [ ] Scan initiation handlers
  - [ ] Scan result handlers
  - [ ] Navigation/flow handlers
  - [ ] Helper functions
- [ ] **Task 3:** Extract handler groups into sub-hooks or helpers
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/scan/hooks/useScanHandlers.ts` | MODIFY | Reduce from 956 to <800 |
| `src/features/scan/hooks/useScanResultHandlers.ts` | CREATE | Result handling sub-hook |
| `src/features/scan/utils/scanHandlerHelpers.ts` | CREATE | Extracted utility functions |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- This was in `hooks/app/` before Phase 1 consolidation moved it to the scan feature
- As an orchestrator hook, it may have many cross-feature dependencies — that's acceptable
- Focus on extracting pure helper functions and clearly separable handler groups
