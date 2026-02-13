# Story 15b-0e: Dependency Graph Baseline

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Generate and commit the Phase 0 baseline dependency graph metrics. This baseline is used for regression checking throughout the rest of Epic 15b — every phase gate compares current metrics against this baseline.

## Acceptance Criteria

- [ ] **AC1:** Baseline metrics committed to `dependency-diagrams/PHASE-0-BASELINE.md`
- [ ] **AC2:** Metrics confirm Phase 0 exit gate: 0 cycles, 0 violations, 0 orphans
- [ ] **AC3:** Document includes fan-out top 10, fan-in top 10, feature cross-coupling summary
- [ ] **AC4:** Document includes instructions for regenerating metrics for future phase gates
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run depcruise and capture all metrics
  - [ ] Total modules and edges
  - [ ] Circular dependencies (expected: 0 after 15b-0b and 15b-0c)
  - [ ] Layer violations (expected: 0 after 15b-0d)
  - [ ] Orphaned modules (expected: 0 after 15b-0a)
- [ ] **Task 2:** Capture fan-out and fan-in rankings
  - [ ] Top 10 fan-out (outgoing dependencies)
  - [ ] Top 10 fan-in (most depended upon)
- [ ] **Task 3:** Document feature cross-coupling metrics
  - [ ] Feature-to-feature import edges
  - [ ] Feature adoption percentage (files in features vs flat)
- [ ] **Task 4:** Write baseline document with regeneration instructions
- [ ] **Task 5:** Commit baseline

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `dependency-diagrams/PHASE-0-BASELINE.md` | CREATE | Phase 0 baseline metrics document |

## Dev Notes

- This story should be the LAST Phase 0 story completed (depends on 15b-0a through 15b-0d)
- Regeneration command should be documented so any developer can re-run at phase gates
- Include a comparison table template that future phases can fill in
- The baseline serves as the "before" for the epic-level metrics comparison in 15b-4g
