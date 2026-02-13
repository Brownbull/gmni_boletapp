# Story 15b-2e: Decompose reportUtils.ts

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** drafted

## Description

Decompose `reportUtils.ts` (2,401 lines) — the largest non-data file in the codebase. This utility file inside `features/reports/` contains mixed report generation, formatting, and data processing logic. Target: <800 lines per resulting file.

## Acceptance Criteria

- [ ] **AC1:** `reportUtils.ts` reduced to <800 lines (main file)
- [ ] **AC2:** Extracted files are each <800 lines
- [ ] **AC3:** Behavior snapshot: all existing tests pass before AND after
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze reportUtils.ts — categorize functions by domain
  - [ ] Report generation functions
  - [ ] Data aggregation/processing functions
  - [ ] Formatting/display functions
  - [ ] Chart data preparation functions
- [ ] **Task 3:** Extract by domain into separate files
  - [ ] `reportGeneration.ts` — report building logic
  - [ ] `reportAggregation.ts` — data processing
  - [ ] `reportFormatting.ts` — display helpers
- [ ] **Task 4:** Update imports across all consumers
- [ ] **Task 5:** Add re-export from `reportUtils.ts` for backward compat if >5 consumers
- [ ] **Task 6:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/reports/utils/reportUtils.ts` | MODIFY | Reduce from 2,401 to <800 lines |
| `src/features/reports/utils/reportGeneration.ts` | CREATE | Report building logic |
| `src/features/reports/utils/reportAggregation.ts` | CREATE | Data processing functions |
| `src/features/reports/utils/reportFormatting.ts` | CREATE | Display/formatting helpers |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- At 2,401 lines this needs to split into at least 3-4 files
- Pure functions (no side effects, no imports of React/hooks) should be extracted first
- This is the highest-value decomposition — 3x over the 800-line limit
- Check for function clusters that always call each other — keep those together
