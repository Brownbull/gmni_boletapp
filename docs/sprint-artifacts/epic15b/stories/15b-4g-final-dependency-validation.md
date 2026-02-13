# Story 15b-4g: Final Dependency Graph Validation + Epic Metrics

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Generate final dependency graph and compare all metrics against the Phase 0 baseline (15b-0e). This is the epic completion gate — validates that all target metrics are met.

## Acceptance Criteria

- [ ] **AC1:** Final depcruise report generated and committed
- [ ] **AC2:** All Phase 0 → Final metrics compared in a summary table
- [ ] **AC3:** 0 circular dependencies confirmed
- [ ] **AC4:** 0 layer violations confirmed
- [ ] **AC5:** App.tsx fan-out <30 confirmed
- [ ] **AC6:** transaction.ts dependents <50 confirmed
- [ ] **AC7:** Feature adoption >85% confirmed
- [ ] **AC8:** Service-layer Firebase imports <8 confirmed
- [ ] **AC9:** `npm run test:sprint` passes (full suite including E2E — epic completion gate)

## Tasks

- [ ] **Task 1:** Run depcruise — capture final metrics
- [ ] **Task 2:** Compare against Phase 0 baseline from 15b-0e
  - [ ] Module count
  - [ ] Edge count
  - [ ] Circular dependencies (target: 0)
  - [ ] Layer violations (target: 0)
  - [ ] Fan-out top 10 (App.tsx must be <30)
  - [ ] Fan-in top 10 (transaction.ts must be <50)
- [ ] **Task 3:** Calculate feature adoption
  - [ ] Files in features / total files (target: >85%)
  - [ ] Lines in features / total lines (target: >80%)
- [ ] **Task 4:** Count Firebase imports by category
  - [ ] Service-layer must be <8
- [ ] **Task 5:** Count remaining Contexts (target: 1 — AuthContext only)
- [ ] **Task 6:** Run `npm run test:sprint` (full suite + E2E)
- [ ] **Task 7:** Write epic metrics summary document

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `dependency-diagrams/EPIC-15B-FINAL-METRICS.md` | CREATE | Final metrics + comparison |
| `docs/sprint-artifacts/epic15b/METRICS-SUMMARY.md` | CREATE | Epic-level summary |

## Dev Notes

- This must be the LAST story completed in the epic
- Uses `test:sprint` (5 min full suite) because it's the epic completion gate
- If any metric fails, investigate and create follow-up stories — don't skip the gate
- The comparison document becomes the input for any future Epic 15c (if needed)
