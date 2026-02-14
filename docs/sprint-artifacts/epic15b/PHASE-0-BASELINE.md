# Epic 15b — Phase 0 Dependency Graph Baseline

**Generated:** 2026-02-13 | **Branch:** `feature/epic15b-continued-refactoring` | **Story:** 15b-0e

**Tool:** dependency-cruiser@16.10.4 | **Command:**
```bash
npx depcruise src --include-only "^src" --output-type json \
  --ts-config tsconfig.json --no-config --ts-pre-compilation-deps \
  > dependency-diagrams/dependency-graph.json
```

> **Note:** `dependency-cruiser` must be installed locally (`npm install --save-dev dependency-cruiser@16`) so it can resolve TypeScript imports via the project's `typescript` package. Using `npx dependency-cruiser@16` without local install will produce 0 modules because the temporary npx install cannot find the TypeScript transpiler.

---

## Summary

| Metric | Pre-Phase 0 | Phase 0 Baseline | Delta |
|--------|-------------|-------------------|-------|
| Total Modules | **510** | **524** | +14 |
| Dependency Edges | **1,768** | **1,888** | +120 |
| Circular Dependencies | **6** | **0** | **-6** |
| Layer Violations (hooks/app/) | **8** | **0** | **-8** |
| Orphaned Modules (dead code) | **0** | **0** | 0 |
| Feature Adoption | ~42% | **35.1%** | -6.9%* |
| Firebase SDK Direct Importers | — | **66** | — |
| Feature Cross-Coupling Edges | **8** | **8** | 0 |

> **\* Feature adoption note:** The decrease from ~42% to 35.1% reflects a measurement methodology change. Pre-Phase 0 used manual file counting; this baseline uses depcruise's module graph which includes type files, configs, and barrel exports in the denominator. The 85%+ target for Phase 1 end uses this new baseline methodology consistently.

> **Module/Edge increase note:** The +14 modules and +120 edges vs the pre-Phase 0 analysis reflect (1) dependency-cruiser version and config differences (16.10.4 with `--ts-pre-compilation-deps` vs prior analysis), and (2) new type export files created during Phase 0 stories (e.g., `src/types/conflict.ts`, `src/types/session.ts`). No source code regression occurred.

---

## Phase 0 Exit Gate Verification

| Criterion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Circular dependencies | **0** | **0** | **PASS** |
| Layer violations (hooks/app/ → components/views) | **0** | **0** | **PASS** |
| Dead orphaned modules | **0** | **0** | **PASS** |

**Details:**

- **Circular dependencies:** All 6 cycles from the pre-Phase 0 analysis have been eliminated:
  - 3 App barrel cycles fixed by 15b-0b (re-export removal)
  - 3 store/modal/editor cycles fixed by 15b-0c (type extraction, lazy imports, store decoupling)
- **Layer violations:** All 8 hooks/app/ → components/views violations fixed by 15b-0d (type extraction to `src/types/conflict.ts` and `src/types/session.ts`)
- **Dead orphaned modules:** 5 dead modules + 3 orphan tests removed by 15b-0a (2,478 lines deleted)

**Additional structural observations (not part of exit gate):**
- 2 minor cross-layer imports exist outside hooks/app/: `useCountUp.ts → components/animation/constants.ts` and `usePolygonMode.ts → components/polygon/DynamicPolygon.tsx`. These are pre-existing and acceptable (constant imports, not architectural violations).
- 15 modules show no incoming dependencies in depcruise but are actively used via dynamic imports, JSX element usage, or lazy loading patterns not tracked by static analysis (e.g., `ErrorBoundary.tsx`, view files loaded via `viewRenderers.tsx`).

---

## Fan-Out Top 10 (Outgoing Dependencies)

| # | File | Fan-Out |
|---|------|---------|
| 1 | `src/App.tsx` | **78** |
| 2 | `src/views/TrendsView/TrendsView.tsx` | **36** |
| 3 | `src/views/DashboardView/DashboardView.tsx` | **32** |
| 4 | `src/views/TransactionEditorViewInternal.tsx` | **31** |
| 5 | `src/views/HistoryView.tsx` | **28** |
| 6 | `src/views/EditView.tsx` | **26** |
| 7 | `src/components/scan/index.ts` | **25** |
| 8 | `src/views/ItemsView/ItemsView.tsx` | **24** |
| 9 | `src/views/SettingsView/useSettingsViewData.ts` | **20** |
| 10 | `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | **20** |

---

## Fan-In Top 10 (Most Depended Upon)

| # | File | Fan-In |
|---|------|--------|
| 1 | `src/types/transaction.ts` | **110** |
| 2 | `src/config/categoryColors.ts` | **53** |
| 3 | `src/utils/currency.ts` | **42** |
| 4 | `src/hooks/useReducedMotion.ts` | **36** |
| 5 | `src/utils/translations.ts` | **36** |
| 6 | `src/types/scanStateMachine.ts` | **34** |
| 7 | `src/utils/categoryTranslations.ts` | **30** |
| 8 | `src/features/scan/store/index.ts` | **26** |
| 9 | `src/types/insight.ts` | **23** |
| 10 | `src/types/settings.ts` | **21** |

---

## Feature Cross-Coupling Summary

Cross-feature coupling is minimal (4 pairs, 8 edges total):

| From Feature | To Feature | Edges |
|-------------|-----------|-------|
| `batch-review` | `categories` | **3** |
| `batch-review` | `scan` | **2** |
| `scan` | `categories` | **2** |
| `scan` | `transaction-editor` | **1** |

No feature-to-feature cycles exist. All cross-feature dependencies flow in one direction.

---

## Key Benchmarks for Phase Tracking

| Metric | Phase 0 Baseline | Target | Target Phase |
|--------|-----------------|--------|-------------|
| `App.tsx` fan-out | **78** | <30 | Phase 4 (15b-4f) |
| `types/transaction.ts` fan-in | **110** | <50 | Phase 4 (15b-4a–4e) |
| Feature adoption % | **35.1%** | 85%+ | Phase 1 end (15b-1l) |
| Firebase SDK direct importers | **66** | <8 | Phase 3 end |
| Circular dependencies | **0** | 0 | Maintained |
| Layer violations (hooks/app/) | **0** | 0 | Maintained |

---

## Phase Comparison Template

Copy and fill this table at each phase gate:

| Metric | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|---------|
| Total Modules | 524 | | | | |
| Dependency Edges | 1,888 | | | | |
| Circular Dependencies | 0 | | | | |
| Layer Violations (hooks/app/) | 0 | | | | |
| Feature Adoption % | 35.1% | | | | |
| Firebase SDK Importers | 66 | | | | |
| `App.tsx` Fan-Out | 78 | | | | |
| `transaction.ts` Fan-In | 110 | | | | |
| Cross-Feature Edges | 8 | | | | |

---

## Regeneration Instructions

To regenerate these metrics at any future phase gate:

### Prerequisites
```bash
# dependency-cruiser must be a local devDependency (for TypeScript resolution)
npm ls dependency-cruiser || npm install --save-dev dependency-cruiser@16 --legacy-peer-deps
```

### Step 1: Generate dependency graph JSON
```bash
npx depcruise src --include-only "^src" --output-type json \
  --ts-config tsconfig.json --no-config --ts-pre-compilation-deps \
  > dependency-diagrams/dependency-graph.json
```

### Step 2: Extract metrics (Node one-liners)

```bash
# Module count
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); console.log('Modules:', d.modules.length)"

# Edge count
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); console.log('Edges:', d.modules.reduce((s,m) => s + m.dependencies.length, 0))"

# Circular dependencies (should remain 0)
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const c=d.modules.flatMap(m => m.dependencies.filter(dep => dep.circular).map(dep => m.source + ' -> ' + dep.resolved)); console.log('Circular:', c.length); c.forEach(x => console.log(' ', x))"

# Fan-out top 10
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); d.modules.sort((a,b)=>b.dependencies.length-a.dependencies.length).slice(0,10).forEach((m,i)=>console.log(i+1, m.source, m.dependencies.length))"

# Fan-in top 10
node -e "const d=require('./dependency-diagrams/dependency-graph.json'); const fi={}; d.modules.forEach(m=>m.dependencies.forEach(dep=>{fi[dep.resolved]=(fi[dep.resolved]||0)+1})); Object.entries(fi).sort(([,a],[,b])=>b-a).slice(0,10).forEach(([f,c],i)=>console.log(i+1, f, c))"
```

### Step 3: Feature cross-coupling and adoption (use script to avoid shell escaping)
```bash
# Save as dependency-diagrams/_metrics.cjs and run with: node dependency-diagrams/_metrics.cjs
const d = require('./dependency-graph.json');

// Feature cross-coupling
const p = {};
d.modules.filter(m => m.source.startsWith('src/features/')).forEach(m => {
  const from = m.source.split('/')[2];
  m.dependencies
    .filter(dep => dep.resolved.startsWith('src/features/') && dep.resolved.split('/')[2] !== from)
    .forEach(dep => {
      const to = dep.resolved.split('/')[2];
      const k = from + ' -> ' + to;
      p[k] = (p[k] || 0) + 1;
    });
});
Object.entries(p).sort(([, a], [, b]) => b - a).forEach(([k, v]) => console.log(k, v));

// Feature adoption
const feat = d.modules.filter(m => m.source.startsWith('src/features/')).length;
const total = d.modules.filter(m => m.source.startsWith('src/')).length;
console.log('Feature adoption:', (feat / total * 100).toFixed(1) + '%');
```

### Step 4: Layer violations (hooks/app/ specific)
```bash
grep -rn "from.*\.\./.*components/\|from.*\.\./.*views/" src/hooks/app/ | grep -v "@app/"
```

### Step 5: Firebase SDK direct importers
```bash
grep -rln "from ['\"]firebase/" src/ | wc -l
```

### Step 6: Fill Phase Comparison Template
Copy the Phase Comparison Template table above and fill in the new phase column.
