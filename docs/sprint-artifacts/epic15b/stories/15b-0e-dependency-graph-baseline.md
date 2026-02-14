# Story 15b-0e: Dependency Graph Baseline

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Generate and commit the Phase 0 baseline dependency graph metrics. This baseline is used for regression checking throughout the rest of Epic 15b — every phase gate compares current metrics against this baseline. It confirms the Phase 0 exit gate (0 cycles, 0 violations, 0 orphans) and provides the "before" snapshot for the epic-level metrics comparison in 15b-4g.

## Functional Acceptance Criteria

- [x] **AC1:** Baseline metrics committed to `docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md`
- [x] **AC2:** Metrics confirm Phase 0 exit gate: 0 cycles, 0 violations, 0 orphans
- [x] **AC3:** Document includes fan-out top 10, fan-in top 10, feature cross-coupling summary
- [x] **AC4:** Document includes instructions for regenerating metrics for future phase gates
- [x] **AC5:** `npm run test:quick` passes (281 files, 6,884 tests)

> **Note on AC1 path change:** Original epic specified `dependency-diagrams/PHASE-0-BASELINE.md`, but that directory is gitignored (`.gitignore` line 126). Relocated to `docs/sprint-artifacts/epic15b/` — this is curated documentation, not a generated artifact. Sprint artifacts are the natural home for project-tracking documents and co-locates with 15b-4g's final metrics comparison.

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements
- [x] **AC-ARCH-LOC-1:** Baseline document located at `docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md`

### Pattern Requirements
- [x] **AC-ARCH-PATTERN-1:** Document follows same table formatting conventions as existing `dependency-diagrams/ANALYSIS-REPORT.md` (Markdown tables, backtick-quoted paths, bold numbers)
- [x] **AC-ARCH-PATTERN-2:** Regeneration instructions use exact CLI commands reproducible by any developer with Node.js and npx — no custom scripts or external tools (except dependency-cruiser itself)
- [x] **AC-ARCH-PATTERN-3:** Comparison template uses same metric names as summary table for consistent tracking across phases

### Anti-Pattern Requirements (Must NOT Happen)
- [x] **AC-ARCH-NO-1:** Must NOT hardcode metrics — must be generated from actual fresh depcruise run AFTER 0b/0c/0d are completed
- [x] **AC-ARCH-NO-2:** Must NOT modify any source code files
- [x] **AC-ARCH-NO-3:** Must NOT include stale metrics from pre-Phase-0 state (existing `dependency-graph.json` shows 6 cycles, 8 violations — those are STALE)

## File Specification

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| Phase 0 Baseline | `docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md` | Documentation | AC1, AC2, AC3, AC4 |
| dependency-graph.json | `dependency-diagrams/dependency-graph.json` | Generated (not committed) | Data source |

Only 1 file committed. No source code changes.

## Tasks / Subtasks

- [x] **Task 1:** Run depcruise and capture all metrics
  - [x] Run `npx depcruise src --include-only "^src" --output-type json --ts-config tsconfig.json > dependency-diagrams/dependency-graph.json`
  - [x] Extract total modules and dependency edges
  - [x] Verify circular dependencies = 0 (expected after 15b-0b + 15b-0c)
  - [x] Verify layer violations = 0 (expected after 15b-0d)
  - [x] Verify orphaned modules = 0 (expected after 15b-0a)
  - [x] Capture fan-out top 10 (outgoing dependencies)
  - [x] Capture fan-in top 10 (most depended upon)
  - [x] Capture feature cross-coupling summary (cross-feature import edges)
  - [x] Compute feature adoption percentage (files in `src/features/` / total files in `src/`)
- [x] **Task 2:** Write baseline document
  - [x] Create `docs/sprint-artifacts/epic15b/PHASE-0-BASELINE.md` with all required sections:
    - Header with generation date, branch, story reference
    - "Pre-Phase 0 vs Phase 0 Baseline" comparison (delta from ANALYSIS-REPORT.md)
    - Phase 0 exit gate verification (PASS/FAIL for each criterion)
    - Fan-out top 10 table
    - Fan-in top 10 table
    - Feature cross-coupling table
    - Phase Comparison Template (empty columns for Phases 1-4)
    - Regeneration instructions (exact commands)
- [x] **Task 3:** Commit and verify
  - [x] Run `npm run test:quick` (AC5)
  - [x] Update story status to `review`
  - [x] Update `sprint-status.yaml` to `review`
  - [ ] Commit with descriptive message

## Dev Notes

### Architecture Guidance

**Sequencing is Critical:**
This story has a HARD dependency on 15b-0b, 15b-0c, and 15b-0d being COMPLETED (not just in review). The current branch state (as of 2026-02-13):
- 15b-0a: DONE
- 15b-0b: REVIEW (implemented on branch — fixes 3/6 App barrel cycles)
- 15b-0c: READY-FOR-DEV (NOT implemented — fixes remaining 3 cycles: stores/modal/editor)
- 15b-0d: READY-FOR-DEV (NOT implemented — fixes 8 layer violations in hooks/app/)

Do NOT attempt to generate the baseline until ALL three are merged/implemented on the working branch. A baseline with known violations would need immediate correction.

**Depcruise Installation:**
`dependency-cruiser` is NOT in `package.json`. Use `npx depcruise` (downloads temporarily) or `npx dependency-cruiser@16` for version pinning. The exact command:
```bash
npx depcruise src --include-only "^src" --output-type json --ts-config tsconfig.json > dependency-diagrams/dependency-graph.json
```

**Layer Violation Detection:**
Depcruise does not automatically detect layer violations without a forbidden-rules config. For the baseline, use grep:
```bash
grep -rn "from.*\.\./.*components/\|from.*\.\./.*views/" src/hooks/app/ | grep -v "@app/"
```
After 0d is complete, this should return 0 results.

**Orphan Detection Nuance:**
Depcruise "orphans" = modules with no incoming dependencies. Many are expected entry points (main.tsx, barrel index.ts files, feature entries). The baseline should distinguish expected entry points from unexpected orphans. After 15b-0a, there should be 0 unexpected orphans.

**Metric Extraction — Use Node one-liners (portable, no jq required):**

```bash
# Module count
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); console.log('Modules:', d.modules.length)"

# Edge count
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); console.log('Edges:', d.modules.reduce((s,m) => s + m.dependencies.length, 0))"

# Circular dependencies (should be 0)
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const c=d.modules.flatMap(m => m.dependencies.filter(dep => dep.circular).map(dep => m.source + ' -> ' + dep.resolved)); console.log('Circular:', c.length); c.forEach(x => console.log(' ', x))"

# Fan-out top 10
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); d.modules.sort((a,b)=>b.dependencies.length-a.dependencies.length).slice(0,10).forEach((m,i)=>console.log(i+1, m.source, m.dependencies.length))"

# Fan-in top 10
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const fi={}; d.modules.forEach(m=>m.dependencies.forEach(dep=>{fi[dep.resolved]=(fi[dep.resolved]||0)+1})); Object.entries(fi).sort(([,a],[,b])=>b-a).slice(0,10).forEach(([f,c],i)=>console.log(i+1, f, c))"

# Feature cross-coupling
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const p={}; d.modules.filter(m=>m.source.startsWith('src/features/')).forEach(m=>{const from=m.source.split('/')[2]; m.dependencies.filter(dep=>dep.resolved.startsWith('src/features/')&&dep.resolved.split('/')[2]!==from).forEach(dep=>{const to=dep.resolved.split('/')[2]; const k=from+'->'+to; p[k]=(p[k]||0)+1})}); Object.entries(p).sort(([,a],[,b])=>b-a).forEach(([k,v])=>console.log(k, v))"
```

### Technical Notes

No specialized technical review required (no database or auth changes).

**Key benchmarks to capture for future phase tracking:**
- `App.tsx` fan-out: target <30 by Phase 4 (story 15b-4f)
- `types/transaction.ts` fan-in: target <50 by Phase 4 (stories 15b-4a through 15b-4e)
- Feature adoption %: target 85%+ by Phase 1 end (story 15b-1l)
- Firebase SDK imports: target <8 files by Phase 3 end

### E2E Testing

Not applicable — documentation-only story. No E2E coverage needed.

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-14
- **Classification:** TRIVIAL (documentation-only)
- **ECC Agents:** code-reviewer
- **Outcome:** APPROVE 10/10
- **Action Items:** 0 (no findings)
- **TD Stories Created:** 0
- **Session Cost:** $4.44

## ECC Analysis Summary
- Risk Level: LOW
- Complexity: Simple
- Sizing: SMALL (3 tasks, 13 subtasks, 1 committed file)
- Agents consulted: Planner, Architect
- Blocking dependencies: 15b-0b (review), 15b-0c (ready-for-dev), 15b-0d (ready-for-dev)
