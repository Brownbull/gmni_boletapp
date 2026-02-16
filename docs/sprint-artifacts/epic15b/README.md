# Epic 15b: Continued Codebase Refactoring

**Epic Status:** Drafted
**Total Stories:** ~47
**Total Story Points:** ~91 points
**Estimated Duration:** 4 sprints (~5-6 weeks)
**Predecessor:** Epic 15 Codebase Refactoring (COMPLETED - 68 stories, ~158 pts)
**Analysis Document:** `docs/architecture/proposals/EPIC-15B-CONTINUED-REFACTORING-ANALYSIS.md`
**Dependency Analysis:** `dependency-diagrams/ANALYSIS-REPORT.md`

---

## Epic Summary

Epic 15b continues the codebase refactoring started in Epic 15, addressing the gaps between Epic 15's aspirational targets and actual outcomes. The focus is on completing Feature-Sliced Design adoption (currently 42% -> 85%+), decomposing remaining oversized files, rolling out the DAL repository pattern to all consumers, and resolving structural issues identified by dependency analysis (circular dependencies, layer violations, high-coupling types).

**Key outcomes:**
- Feature-Sliced Design adoption from 42% to 85%+ of codebase
- No source file over 800 lines (never-scoped) or 1,200 lines (plateaued)
- Firebase SDK service-layer imports from ~24 to <8 files
- 0 circular dependencies (currently 6)
- 0 layer violations (currently 8)
- App.tsx fan-out from 74 to <30 dependencies
- `transaction.ts` dependents from 109 to <50

---

## Phase Overview

```
Epic 15b: Continued Codebase Refactoring (~91 points)
|
|-- Phase 0: Structural Cleanup (~7 pts, Low risk)
|   5 stories: dead module audit, circular deps, layer violations, baseline
|
|-- Phase 1: Feature Consolidation (~21 pts, Low-Medium risk)
|   12 stories: move ~100+ files into features (source + tests)
|
|-- Phase 2: Decomposition (~34 pts, High risk)
|   16 stories: 16 files >800 lines -> target sizes
|
|-- Phase 3: Infrastructure Hardening (~15 pts, Medium risk)
|   7 stories: DAL consumer rollout + state management
|
|-- Phase 4: High-Coupling Architecture (~14 pts, High risk)
|   7 stories: transaction.ts split + App.tsx + final validation
```

---

## Sprint Breakdown

| Sprint | Phases | Focus |
|--------|--------|-------|
| Sprint 15b.1 | Phase 0 + Phase 1 (start) | Cleanup + begin consolidation |
| Sprint 15b.2 | Phase 1 (finish) + Phase 2 (start) | Finish consolidation + begin decomposition |
| Sprint 15b.3 | Phase 2 (finish) + Phase 3 | Finish decomposition + infrastructure |
| Sprint 15b.4 | Phase 4 | Architecture + final validation |

---

## Phase 0: Structural Cleanup (5 stories, ~7 pts)

| Story | Title | Pts |
|-------|-------|-----|
| 15b-0a | Dead module audit | 1 |
| 15b-0b | Fix App barrel cycles (3/6 circular deps) | 2 |
| 15b-0c | Fix stores/ModalManager/EditorScanThumbnail cycles (3/6) | 2 |
| 15b-0d | Layer violation cleanup (8 violations in hooks/app/) | 1 |
| 15b-0e | Dependency graph baseline | 1 |

**Exit gate:** 0 circular dependencies, 0 layer violations, 0 orphans, depcruise baseline committed.

---

## Phase 1: Feature Consolidation (12 stories, ~21 pts)

| Story | Title | Pts |
|-------|-------|-----|
| 15b-1a | Consolidate features/analytics/ (TrendsView + hooks + utils) | 3 |
| 15b-1b | Consolidate features/dashboard/ (DashboardView + hooks) | 2 |
| 15b-1c | Consolidate features/transaction-editor/ (EditorView + hooks) | 2 |
| 15b-1d | Consolidate features/history/ (HistoryView + hooks) | 2 |
| 15b-1e | Create & consolidate features/items/ | 2 |
| 15b-1f | Consolidate features/batch-review/ (views + hooks + components) | 2 |
| 15b-1g | Consolidate features/insights/ (InsightsView + hooks) | 2 |
| 15b-1h | Consolidate features/reports/ (ReportsView + components) | 1 |
| 15b-1i | Consolidate features/scan/ (views + hooks + components) | 2 |
| 15b-1j | Consolidate features/settings/ (SettingsView + components) | 1 |
| 15b-1k | Shared audit (verify remaining flat files are truly cross-feature) | 1 |
| 15b-1l | Feature barrel exports + depcruise cycle check | 1 |

**Exit gate:** Feature adoption >80%, src/views/ <10 files, src/hooks/ <20, src/components/ <30, test:story green, depcruise stable.

---

## Phase 2: Decomposition (16 stories, ~34 pts)

### Never-scoped views (target <800)

| Story | Title | Lines | Pts |
|-------|-------|-------|-----|
| 15b-2a | Decompose EditView | 1,811 | 3 |
| 15b-2b | Decompose ScanResultView | 1,554 | 3 |
| 15b-2c | Decompose HistoryView | 1,168 | 2 |
| 15b-2d | Decompose ItemsView | 1,003 | 2 |

### Feature-internal large files (target <800)

| Story | Title | Lines | Pts |
|-------|-------|-------|-----|
| 15b-2e | Decompose reportUtils.ts | 2,401 | 3 |
| 15b-2f | Decompose sankeyDataBuilder.ts | 1,037 | 2 |
| 15b-2g | Decompose SankeyChart.tsx | 890 | 2 |
| 15b-2h | Decompose useScanStore.ts | 946 | 2 |
| 15b-2i | Decompose DrillDownGrid.tsx | 808 | 2 |
| 15b-2j | Decompose useBatchReviewHandlers.ts | 768 | 1 |
| 15b-2k | Decompose historyFilterUtils.ts | 1,075 | 2 |
| 15b-2l | Decompose useScanHandlers.ts | 956 | 2 |

### Plateaued views round 2 (target <1,200)

| Story | Title | Lines | Pts |
|-------|-------|-------|-----|
| 15b-2m | TrendsView further extraction | 1,981 | 3 |
| 15b-2n | DashboardView further extraction | 1,485 | 3 |
| 15b-2o | TransactionEditorViewInternal further extraction | 1,421 | 3 |
| 15b-2p | IconCategoryFilter further extraction | 1,106 | 2 |

**Exit gate:** Never-scoped <800, plateaued <1,200, feature-internal <800 (excl. data/test), test:story green, depcruise fan-out decreased.

---

## Phase 3: Infrastructure Hardening (7 stories, ~15 pts)

| Story | Title | Pts |
|-------|-------|-----|
| 15b-3a | DAL: Migrate transaction hooks to TransactionRepository | 2 |
| 15b-3b | DAL: Migrate trust + preferences hooks to repositories | 2 |
| 15b-3c | DAL: Migrate records + airlock + insight profile hooks | 3 |
| 15b-3d | DAL: Migrate credits hooks to CreditsRepository | 2 |
| 15b-3e | DAL: Migrate remaining view/component Firebase imports | 2 |
| 15b-3f | State: AnalyticsContext -> Zustand | 2 |
| 15b-3g | State: NotificationContext -> Zustand + HistoryFiltersContext removal | 2 |

**Exit gate:** Service-layer Firebase imports <8, 0 non-Auth Contexts, test:story green.

---

## Phase 4: High-Coupling Architecture (7 stories, ~14 pts)

| Story | Title | Pts |
|-------|-------|-----|
| 15b-4a | Design transaction.ts sub-type schema (analysis only) | 2 |
| 15b-4b | Split transaction.ts into domain sub-types + re-export shim | 2 |
| 15b-4c | Update transaction type consumers (batch 1: services + repos) | 2 |
| 15b-4d | Update transaction type consumers (batch 2: hooks + features) | 2 |
| 15b-4e | Update transaction type consumers (batch 3: views + components + cleanup) | 2 |
| 15b-4f | App.tsx fan-out reduction (extract feature orchestrators) | 3 |
| 15b-4g | Final dependency graph validation + epic metrics | 1 |

**Exit gate:** test:sprint (full suite + E2E), transaction.ts dependents <50, App.tsx fan-out <30.

---

## Testing & Safeguards

See full details in analysis document Section 8.

**Per-story:** `npx tsc --noEmit` + `npm run test:quick` after every change. `npm run test:story` before review.

**Refactoring:** Mock path audit after every move. Re-export backward compat for >5 consumers. Test file migration alongside source files.

**Decomposition:** Behavior snapshot before extracting. Extract pure logic first. No new functionality.

**End-of-phase:** Depcruise regression check. Metrics comparison against Phase 0 baseline.

**Story sizing:** Max 6 tasks / 25 subtasks / 10 files. Consolidation: max 20 source+test files. Decomposition: 1 source file per story.

---

## Key Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Files >800 (excl. data/test) | 16 | <=3 |
| Feature adoption (files) | 42% | 85%+ |
| Service-layer Firebase imports | ~24 | <8 |
| Circular dependencies | 6 | 0 |
| Layer violations | 8 | 0 |
| App.tsx fan-out | 74 | <30 |
| transaction.ts dependents | 109 | <50 |
| Non-Auth Contexts | 3 | 0 |

---

## Created

- **Date:** 2026-02-13
- **Source:** Epic 15 closure analysis + dependency analysis
- **Analysis:** `docs/architecture/proposals/EPIC-15B-CONTINUED-REFACTORING-ANALYSIS.md`
