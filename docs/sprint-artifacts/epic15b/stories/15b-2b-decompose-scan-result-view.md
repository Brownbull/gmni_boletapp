# Story 15b-2b: Decompose ScanResultView

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** drafted

## Description

Decompose ScanResultView.tsx (1,554 lines, 20+ hooks) into smaller sub-files. Never-scoped view moved into `features/scan/` in Phase 1. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** ScanResultView.tsx reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Behavior snapshot: all existing tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** Fan-out decreased (depcruise verification)
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests to establish behavior baseline
- [ ] **Task 2:** Analyze ScanResultView structure — identify extractable sections
  - [ ] Scan result display logic → `scanResultHelpers.ts`
  - [ ] Result sections (items list, summary, actions) → individual components
- [ ] **Task 3:** Extract pure functions first
- [ ] **Task 4:** Extract UI sub-sections as components
- [ ] **Task 5:** Run tests after each extraction, fix atomically

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/scan/views/ScanResultView.tsx` | MODIFY | Reduce from 1,554 to <800 lines |
| `src/features/scan/views/scanResultHelpers.ts` | CREATE | Extracted pure functions |
| `src/features/scan/components/ScanResult*.tsx` | CREATE | Extracted UI sub-sections |
| Tests for extracted files | CREATE | Unit tests for new files |

## Dev Notes

- ScanResultView has 20+ hooks — very high state complexity
- This view processes AI scan results — extracting the result formatting logic is a good starting point
- Check for inline render functions that can become named components
