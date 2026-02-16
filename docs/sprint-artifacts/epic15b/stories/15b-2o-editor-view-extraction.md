# Story 15b-2o: TransactionEditorViewInternal Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Description

Further decompose TransactionEditorViewInternal.tsx (1,421 lines) which was reduced from 2,721 in Epic 15 Phase 5d. Plateaued view — target <1,200 lines.

## Acceptance Criteria

- [ ] **AC1:** TransactionEditorViewInternal.tsx reduced to <1,200 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** Fan-out decreased from 30
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze remaining inline logic
  - [ ] Item operation handlers
  - [ ] Learning prompt chains
  - [ ] Inline render sections
- [ ] **Task 3:** Extract ~221+ lines into sub-files
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` | MODIFY | Reduce from 1,421 to <1,200 |
| `src/features/transaction-editor/views/*.ts(x)` | CREATE | Additional extracted sub-files |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- Already has 5 extracted sub-files from Epic 15 Phase 5d
- ~221 lines need extraction — smallest of the plateaued views
- 30 outgoing deps — third highest fan-out
- Item operations and learning prompts are likely the most extractable remaining logic
