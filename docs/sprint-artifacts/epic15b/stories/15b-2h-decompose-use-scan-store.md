# Story 15b-2h: Decompose useScanStore.ts

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose `useScanStore.ts` (946 lines) inside `features/scan/store/`. This Zustand store manages the complex scan state machine. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** useScanStore.ts reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction (including the 1,338-line test file)
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline (useScanStore.test.ts is 1,338 lines)
- [ ] **Task 2:** Identify extractable action groups
  - [ ] Scan initialization actions
  - [ ] Scan processing actions
  - [ ] Result handling actions
  - [ ] State selectors
- [ ] **Task 3:** Extract action groups into slice files
- [ ] **Task 4:** Update store to compose slices
- [ ] **Task 5:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/scan/store/useScanStore.ts` | MODIFY | Reduce from 946 to <800 |
| `src/features/scan/store/scanActions.ts` | CREATE | Extracted action groups |
| `src/features/scan/store/scanSelectors.ts` | CREATE | Extracted selectors |
| Tests for extracted files | CREATE/MODIFY | May need to split test file too |

## Dev Notes

- Zustand stores can be decomposed by extracting action creators and selectors into separate files
- The test file (1,338 lines) is already over source limits — may need splitting as follow-up
- The scan state machine is complex — be conservative, extract only clearly separable groups
- Pattern: `const scanActions = (set, get) => ({...})` can be a separate file imported by the store
