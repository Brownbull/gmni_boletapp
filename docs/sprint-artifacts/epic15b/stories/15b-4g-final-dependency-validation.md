# Story 15b-4g: Final Dependency Graph Validation + Epic Metrics

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 1
**Priority:** LOW
**Status:** ready-for-dev

## Overview

This is the **epic completion gate** story. Run after all Phase 4 stories (15b-4a through 15b-4f) are complete. Generate final dependency metrics and compare them against the Phase 0 baseline from story 15b-0e (`docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md`). Verify all 7 target metrics are met. Run the full test suite (`npm run test:sprint` including E2E) to confirm no regressions across the entire codebase.

## Functional Acceptance Criteria

- [ ] **AC1:** Final dependency graph regenerated using depcruise after all Phase 4 changes are merged
- [ ] **AC2:** All target metrics verified:
  - Circular dependencies: 0
  - Layer violations: 0
  - App.tsx fan-out: <30 (down from 62+ at Phase 0)
  - `transaction.ts` dependents: <88 (down from 101 at Phase 0)
  - Feature adoption: >85% of files in `src/features/`
  - Service-layer Firebase imports: <8 files
  - Non-Auth React Contexts: 0 (only AuthContext remains)
- [ ] **AC3:** `npm run test:sprint` passes (full suite including E2E — epic completion gate)
- [ ] **AC4:** Epic completion document created: `docs/sprint-artifacts/epic15b/EPIC-COMPLETION-METRICS.md`
- [ ] **AC5:** No code changes — verification and documentation only

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Epic completion document at `docs/sprint-artifacts/epic15b/EPIC-COMPLETION-METRICS.md`
- [ ] **AC-ARCH-LOC-2:** Raw depcruise JSON at `dependency-diagrams/dependency-graph.json` (not committed — gitignored)

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** Document follows same table formatting as `docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md`
- [ ] **AC-ARCH-PAT-2:** All depcruise commands are portable Node.js one-liners (no jq, no custom scripts)
- [ ] **AC-ARCH-PAT-3:** Metrics use exact column names from Phase 0 baseline for side-by-side comparison

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Must NOT hardcode metrics — must be generated from fresh depcruise run AFTER all Phase 4 changes
- [ ] **AC-ARCH-NO-2:** Must NOT make source code changes (verification only)
- [ ] **AC-ARCH-NO-3:** Must NOT skip `npm run test:sprint` — it's the mandatory epic completion gate

## File Specification

### New Files (documentation only)

| File | Exact Path | Purpose |
|------|------------|---------|
| Epic Completion Metrics | `docs/sprint-artifacts/epic15b/EPIC-COMPLETION-METRICS.md` | Final comparison of Phase 0 baseline vs Phase 4 actual, target achievement table, test suite health |

### Reference Files (pre-existing)

| File | Path | Role |
|------|------|------|
| Phase 0 Baseline | `docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md` | Frozen baseline from story 15b-0e for comparison |
| Dependency Graph JSON | `dependency-diagrams/dependency-graph.json` | Generated, gitignored; data source for metrics |

## Tasks / Subtasks

### Task 1: Verify Phase 4 completion status

- [ ] 1.1 Confirm all Phase 4 stories (15b-4a through 15b-4f) are merged and working code is on-disk
- [ ] 1.2 Run `npm run test:quick` as sanity check — must pass before proceeding
- [ ] 1.3 Verify `src/App.tsx` has been refactored (fan-out from 15b-4f)
- [ ] 1.4 Verify `src/types/transaction.ts` consumer count reduced (from 15b-4a through 15b-4e)

### Task 2: Regenerate dependency graph

- [ ] 2.1 Run exact Phase 0 command:
  ```bash
  npx depcruise src --include-only "^src" --output-type json --ts-config tsconfig.json > dependency-diagrams/dependency-graph.json
  ```
- [ ] 2.2 Verify `dependency-diagrams/dependency-graph.json` is valid JSON and contains `modules` array
- [ ] 2.3 Extract total module count and edge count as sanity check (compare to Phase 0 baselines)

### Task 3: Calculate all Phase 4 metrics

- [ ] 3.1 Circular dependencies (target: 0):
  ```bash
  node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const c=d.modules.flatMap(m => m.dependencies.filter(dep => dep.circular)); console.log('Circular:', c.length)"
  ```
- [ ] 3.2 Layer violations (target: 0): `grep -rn "from.*components/\|from.*views/" src/hooks/app/ | grep -v "@app/" | wc -l`
- [ ] 3.3 App.tsx fan-out (target: <30):
  ```bash
  node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const app=d.modules.find(m=>m.source.endsWith('App.tsx')); console.log('App.tsx fan-out:', app?.dependencies.length)"
  ```
- [ ] 3.4 transaction.ts fan-in (target: <88):
  ```bash
  node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const fi={}; d.modules.forEach(m=>m.dependencies.forEach(dep=>{fi[dep.resolved]=(fi[dep.resolved]||0)+1})); const tx=Object.entries(fi).find(([f])=>f.includes('types/transaction')); console.log('transaction.ts fan-in:', tx?.[1])"
  ```
- [ ] 3.5 Feature adoption % (target: >85%):
  ```bash
  node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const total=d.modules.length; const inFeatures=d.modules.filter(m=>m.source.startsWith('src/features')).length; console.log('Feature adoption:', (inFeatures/total*100).toFixed(1)+'%')"
  ```
- [ ] 3.6 Service-layer Firebase imports (target: <8):
  ```bash
  grep -rn "from.*['\"]firebase" src/ --include="*.ts" --include="*.tsx" | grep -v "import type" | grep -v "repositories/" | grep -v "config/" | grep -v "types/" | grep -v "contexts/Auth" | wc -l
  ```
- [ ] 3.7 Non-Auth React Contexts (target: 0):
  ```bash
  grep -rn "createContext" src/ --include="*.ts" --include="*.tsx" | grep -v "AuthContext" | wc -l
  ```
- [ ] 3.8 Fan-out top 15 and fan-in top 15 for the comparison document

### Task 4: Compile epic completion document

- [ ] 4.1 Create `docs/sprint-artifacts/epic15b/EPIC-COMPLETION-METRICS.md` with sections:
  - Header with generation date, branch, Phase 0 and Phase 4 snapshot labels
  - "Target Achievement" summary table (7 metrics × Phase 0 / Phase 4 / Delta / Target / Status columns)
  - "Fan-Out Top 15" before/after comparison
  - "Fan-In Top 15" before/after comparison
  - "Feature Cross-Coupling" edge count before/after
  - Narrative: transaction.ts target rationale (why <88, not <50)
  - Narrative: feature adoption per-feature breakdown
  - Narrative: architecture health assessment
- [ ] 4.2 Include exact depcruise commands and Node.js one-liners for future use
- [ ] 4.3 Include test suite health summary from Task 5

### Task 5: Run full test suite

- [ ] 5.1 Run `npm run test:sprint` (~5 minutes — full suite including E2E)
- [ ] 5.2 Capture pass/fail summary: test file count, test case count, E2E suite count
- [ ] 5.3 Verify no regressions vs Phase 0 test count (6,884 tests from 15b-0e AC5)
- [ ] 5.4 Document any new test failures (if any, investigate before marking done)

### Task 6: Final review and metrics spot-check

- [ ] 6.1 Manually verify top 3 fan-out files by reading their imports (spot-check depcruise output)
- [ ] 6.2 Verify document is internally consistent (summary table matches detail sections)
- [ ] 6.3 Verify narrative sections cite specific story numbers (e.g., "transaction.ts target revised in 15b-4a")
- [ ] 6.4 Mark story status as `review`

## Dev Notes

### Target Metrics Reference

| Metric | Phase 0 Baseline | Phase 4 Target | Notes |
|--------|-----------------|----------------|-------|
| Circular deps | 0 (after 0b/0c/0d) | 0 | Must not regress |
| Layer violations | 0 (after 0d) | 0 | Must not regress |
| App.tsx fan-out | ~62 unique sources | <30 | 15b-4f |
| transaction.ts fan-in | 101 consumers | <88 | 15b-4a through 4e |
| Feature adoption | ~42% | >85% | 15b-1a through 1l |
| Firebase service imports | ~24 files | <8 | 15b-3a through 3e |
| Non-Auth Contexts | 3 | 0 | 15b-3f, 15b-3g |

### transaction.ts Target Rationale (for narrative)

Original target was <50 dependents (down from 109). Revised to <88 after 15b-4a design research found:
- Transaction is a flat, 15-field interface with no natural sub-type boundaries
- 67/101 consumers only import `{ Transaction }` as prop/return types — unchanged by sub-typing
- The pragmatic approach (redirect category-only consumers + `import type` fixes) yields ~88 dependents
- The <50 target required complex sub-type redesign with 100+ file migrations — high risk, low benefit

### Metrics Document Template

```markdown
# Epic 15b — Phase 4 Final Metrics

Generated: [DATE]
Branch: feature/epic15b-continued-refactoring
Compared against: PHASE-0-BASELINE.md (generated 2026-02-14)

## Target Achievement Summary

| Metric | Phase 0 | Phase 4 | Delta | Target | ✓/✗ |
|--------|---------|---------|-------|--------|-----|
| Circular deps | 0 | 0 | 0 | 0 | ✓ |
| Layer violations | 0 | 0 | 0 | 0 | ✓ |
| App.tsx fan-out | 62 | ? | ? | <30 | ? |
| transaction.ts fan-in | 101 | ? | ? | <88 | ? |
| Feature adoption | 42% | ? | ? | >85% | ? |
| Firebase service imports | 24 | ? | ? | <8 | ? |
| Non-Auth Contexts | 3 | ? | ? | 0 | ? |
```

### If a Metric Fails

If any metric is not met:
1. Investigate root cause — which story failed to achieve its target?
2. Document the gap with a specific follow-up story proposal (don't block epic close indefinitely)
3. If gap is small (<5 units), accept with documented rationale
4. If gap is large, escalate to create an Epic 15c or TD story

## ECC Analysis Summary

- **Risk Level:** LOW (verification only, no code changes)
- **Complexity:** Simple — run commands, document results
- **Sizing:** 6 tasks / 21 subtasks / 1 new committed file
- **Blocking Dependencies:** ALL Phase 4 stories (15b-4a through 15b-4f) must be complete
- **Test command:** `npm run test:sprint` (5 min full suite — mandatory gate)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial stub |
| 2026-02-23 | Full rewrite with codebase research. Established 7 target metrics. Corrected transaction.ts baseline from 109 to 101 (actual count). Revised transaction.ts target from <50 to <88 with rationale. Added Node.js one-liners for metrics extraction. |
| 2026-02-27 | ECC re-creation validation: Baseline reconciliation — App.tsx 78 (not 62), transaction.ts 110 (not 101). Layer violation check must cover `src/app/hooks/`. `depcruise` must be locally installed. Status: ready-for-dev. |
