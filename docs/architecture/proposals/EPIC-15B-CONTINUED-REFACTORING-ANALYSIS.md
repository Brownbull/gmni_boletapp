# Epic 15b: Continued Codebase Refactoring — Analysis

> **Date:** 2026-02-13
> **Predecessor:** Epic 15 Codebase Refactoring (COMPLETED — 68 stories, ~158 pts)
> **Source Analysis:** `docs/architecture/proposals/CODEBASE-REFACTOR-ANALYSIS.md`
> **Dependency Analysis:** `dependency-diagrams/ANALYSIS-REPORT.md` (510 modules, 1,768 edges)
> **Status:** DRAFT — Pending epic definition

---

## 1. Epic 15 Closure Summary

Epic 15 completed all 8 planned phases (40 stories, ~90 pts) plus 28 emergent tech debt stories (~68 pts) from ECC code review loops. Total: **68 stories, ~158 points delivered**.

### What Was Fully Delivered

| Area | Result |
|------|--------|
| Dead code removal | 1,193 lines deleted (fcmToken, pushNotifications, transactionQuery) |
| Service deduplication | 4 mapping services → 1 `mappingServiceBase.ts` (~828 → ~327 lines) |
| Normalization | 5 copies of `normalizeItemName` → 1 `normalizeForMapping` with NFD |
| Component deduplication | 4 mapping lists → 1 `MappingsList<T>` (~2,238 → ~536 lines) |
| Business logic centralization | 9 shared utilities: currency, date, timestamp, comparators, storage, numberFormat, errorHandler, transactionValidation, validation |
| Collection paths | 35+ inline → 1 `firestorePaths.ts` |
| Batch safety | `firestoreBatch.ts` with auto-chunking at 500 ops, all services compliant |
| Feature modules created | 6 new: analytics, history, insights, reports, dashboard, settings |
| DAL foundation | 8 repository interfaces + 8 implementations in `src/repositories/` |
| Mega-view decomposition | TrendsView 5,901→1,981, DashboardView 3,412→1,485, TransactionEditor 2,721→1,421, IconFilterBar 1,797→1,106 |
| State migration | HistoryFilters→Zustand, AppState deprecated, Theme→useSettingsStore |
| Security hardening | TOCTOU wrapping in 6 services, input validation, innerHTML→DOM API, multi-pass sanitization |
| i18n | Report overlay and print helpers fully migrated to translations.ts |

### What Was NOT Achieved (Carried Forward)

| Metric | Epic 15 Target | Actual (Feb 13) | Gap |
|--------|---------------|-----------------|-----|
| Files >800 lines | 0 | **19** | 19 files remain |
| Files 500-800 (warning) | <10 | **34** | 24 excess |
| Feature modules | 12+ | **11** | 1 short (items not a feature) |
| Firebase SDK imports | 7-10 files | **49 files** | DAL partially adopted |
| Max file size | ~800 lines | **2,401** (reportUtils) | 3x target |
| Context providers | 1 (Auth) | **4** (Auth, Analytics, Notification, HistoryFilters) | 3 extra |
| Zustand stores | 12+ | **8** | 4 short |
| Files inside features | "majority" | **184** (50%) | 185 still outside |

---

## 2. Current Codebase Snapshot (Feb 13, 2026)

### 2.1 Scale

- **Total source lines:** ~128K (src/)
- **Files in `src/features/`:** 184 files
- **Files outside features:** 185 files (flat `views/`, `hooks/`, `components/`, `services/`, `utils/`)
- **Feature adoption:** ~50% of code lives in feature modules

### 2.2 Files Over 800 Lines (19 files)

| File | Lines | Status |
|------|-------|--------|
| `features/reports/utils/reportUtils.ts` | **2,401** | Never decomposed — moved to feature but unchanged |
| `App.tsx` | **2,081** | Phase 5f: assessed as "irreducible orchestration" |
| `views/TrendsView/TrendsView.tsx` | **1,981** | Phase 5b reduced from 5,901 but plateau |
| `views/EditView.tsx` | **1,811** | Never scoped for decomposition |
| `utils/translations.ts` | **1,779** | Data file — not actionable via decomposition |
| `views/ScanResultView.tsx` | **1,554** | Never scoped for decomposition |
| `views/DashboardView/DashboardView.tsx` | **1,485** | Phase 5c reduced from 3,412 but plateau |
| `views/TransactionEditorViewInternal.tsx` | **1,421** | Phase 5d reduced from 2,721 but plateau |
| `config/categoryColors.ts` | **1,374** | Data file — not actionable via decomposition |
| `features/scan/store/__tests__/useScanStore.test.ts` | **1,338** | Test file — excluded from source limit |
| `views/HistoryView.tsx` | **1,168** | Never scoped for decomposition |
| `features/history/components/IconCategoryFilter.tsx` | **1,106** | Phase 5e partial (was IconFilterBar 1,797) |
| `shared/utils/historyFilterUtils.ts` | **1,075** | Never scoped for decomposition |
| `features/analytics/utils/sankeyDataBuilder.ts` | **1,037** | Moved to feature but unchanged |
| `views/ItemsView/ItemsView.tsx` | **1,003** | Never scoped for decomposition |
| `hooks/app/useScanHandlers.ts` | **956** | Never scoped |
| `features/scan/store/useScanStore.ts` | **946** | Already in feature — needs decomposition |
| `features/analytics/components/SankeyChart.tsx` | **890** | Already in feature — needs decomposition |
| `features/analytics/components/DrillDownGrid.tsx` | **808** | Already in feature — needs decomposition |

**Classification:**
- **Data files** (not decomposable): translations.ts (1,779), categoryColors.ts (1,374) = 2 files
- **Test files** (excluded from limit): useScanStore.test.ts (1,338) = 1 file
- **Already-decomposed plateau** (need further extraction): TrendsView (1,981), DashboardView (1,485), TransactionEditor (1,421), IconCategoryFilter (1,106) = 4 files
- **Never-scoped views** (NEW work): EditView (1,811), ScanResultView (1,554), HistoryView (1,168), ItemsView (1,003) = 4 files
- **Feature-internal large files** (NEW work): reportUtils (2,401), sankeyDataBuilder (1,037), SankeyChart (890), DrillDownGrid (808), useScanStore (946) = 5 files
- **App-level** (assessed as irreducible): App.tsx (2,081) = 1 file
- **Cross-cutting** (NEW work): useScanHandlers (956), historyFilterUtils (1,075) = 2 files

### 2.3 Files in Warning Zone (500-800 Lines, 34 files)

| Range | Count | Key examples |
|-------|-------|-------------|
| 700-800 | 8 | BatchCaptureView (798), locationService (795), useBatchReviewHandlers (768), InsightsView (755), EditorItemsSection (734), DonutChart (724), insightGenerators (720), csvExport (708) |
| 600-700 | 10 | ReportDetailOverlay (681), ScanFeature (684), BatchReviewFeature (682), recordsService (661), QuickSaveCard (642), BatchReviewView (631), pendingScanStorage (628), Nav (623), insightEngineService (622), useSettingsViewData (610) |
| 500-600 | 16 | processScan/types (602), categoryTranslations (598), LearnedDataView (590), useTransactionEditorHandlers (581), ReportsView (575), useItems (573), TransactionCard (568+544), useTransactionHandlers (545), MappingsList (536), useScanInitiation (536), useActiveTransaction (537), LearnMerchantDialog (532), scanStateMachine (527), TemporalBreadcrumb (510), TemporalFilterDropdown (501) |

### 2.4 Feature Module Current State

| Feature | Files Inside | Lines Inside | Est. Files to Move In | Consolidation Effort |
|---------|-------------|-------------|----------------------|---------------------|
| `analytics` | 26 | 7,565 | ~20 (TrendsView/ + hooks + utils) | Large |
| `batch-review` | 27 | 4,498 | ~15 (BatchCapture/Review views + hooks + components) | Large |
| `categories` | 7 | 676 | ~2 (thin, mostly complete) | Small |
| `credit` | 6 | 682 | ~3 (hooks only) | Small |
| `dashboard` | 1 | 11 | ~15 (DashboardView/ + hooks — currently empty placeholder) | Large |
| `history` | 18 | 5,545 | ~8 (HistoryView + hooks + historyFilterUtils) | Medium |
| `insights` | 30 | 7,485 | ~3 (InsightsView + remaining hooks) | Small |
| `reports` | 14 | 5,297 | ~3 (ReportsView + remaining components) | Small |
| `scan` | 32 | 7,453 | ~5 (ScanView + ScanResultView + remaining hooks) | Medium |
| `settings` | 17 | 3,376 | ~5 (SettingsView/ + remaining components) | Medium |
| `transaction-editor` | 5 | 541 | ~12 (TransactionEditorView/ + EditView + hooks) | Large |
| `items` (NEW) | 0 | 0 | ~8 (ItemsView/ + components/items/ + useItems) | Medium |

**Missing feature modules** (code lives in flat directories):
- `items` — ItemsView (1,003) + components/items/ (5 files) + hooks/useItems (573)
- `notifications` — NotificationContext + NotificationsView + hooks/useInAppNotifications + components/NotificationSettings
- `batch-capture` — BatchCaptureView (798) + useBatchCapture + useBatchSession (currently split between batch-review and flat)

### 2.5 Flat Directory Inventory (Not Yet in Features)

| Directory | Files | Total Lines | Feature Candidates |
|-----------|-------|-------------|-------------------|
| `src/views/` | 60 | ~22,400 | Most should migrate into features |
| `src/hooks/` | 49 | ~11,300 | ~20 are cross-feature (shared), ~29 are feature-specific |
| `src/components/` | 90 | ~18,500 | ~60 belong in features, ~30 are truly shared |
| `src/services/` | 19 | ~5,360 | ~8 belong in features, ~11 are shared/infrastructure |
| `src/utils/` | 36 | ~6,600 | ~12 belong in features, ~24 are shared |
| **Total outside features** | **254** | **~64,160** | |
| **Inside features** | **184** | **~43,100** | |

**Feature-Sliced Adoption: ~40% of code by lines, ~42% by files.**

### 2.6 Firebase SDK Import Map (49 files)

| Category | Files | Notes |
|----------|-------|-------|
| Type imports only | ~10 | `Timestamp` in type files — low coupling |
| Repository implementations | 8 | Expected — DAL boundary |
| Service files | 10 | Should migrate to use repositories |
| Hook files | 8 | Should migrate to use repositories |
| View/component files | 6 | Should not import Firebase directly |
| Infrastructure | 7 | Config, contexts, migration utils — OK |

### 2.7 State Management (Current)

**Zustand stores (8):**
1. `useModalStore` (managers/)
2. `useScanStore` (features/scan/) — 946 lines, oversized
3. `useBatchReviewStore` (features/batch-review/)
4. `useTransactionEditorStore` (features/transaction-editor/)
5. `useNavigationStore` (shared/stores/)
6. `useInsightStore` (shared/stores/)
7. `useHistoryFiltersStore` (shared/stores/)
8. `useSettingsStore` (shared/stores/)

**React Contexts (4):**
1. `AuthContext` — correct (provider pattern for Firebase auth)
2. `AnalyticsContext` — candidate for Zustand migration
3. `NotificationContext` — candidate for Zustand migration
4. `HistoryFiltersContext` — **legacy wrapper**, Zustand store exists (15-7a), context may be dead

**AnimationContext** — feature-local, appropriate where it is

---

## 3. Gap Analysis: What Epic 15b Should Address

### 3.1 Unfinished Decomposition (from Epic 15 targets)

These views were decomposed in Phase 5 but plateaued above 800 lines:

| View | Current | Decomposed To | Remaining Work |
|------|---------|--------------|----------------|
| TrendsView | 1,981 | 17 sub-files | Further extraction of inline render logic, state handlers |
| DashboardView | 1,485 | 10 sub-files | Further extraction of sections, event handlers |
| TransactionEditorViewInternal | 1,421 | 5 sub-files | Extract item operations, learning prompt chains |
| IconCategoryFilter | 1,106 | 2 dropdown files | Extract remaining filter logic |

### 3.2 Never-Scoped Views (Not in Epic 15 plan)

| View | Lines | Complexity | Feature Home |
|------|-------|-----------|-------------|
| EditView | 1,811 | 19 hooks | transaction-editor |
| ScanResultView | 1,554 | 20+ hooks | scan |
| HistoryView | 1,168 | 15+ hooks | history |
| ItemsView | 1,003 | 18 hooks | items (new feature) |
| BatchCaptureView | 798 | Medium | batch-review |
| InsightsView | 755 | Medium | insights |
| BatchReviewView | 631 | Medium | batch-review |
| ReportsView | 575 | Medium | reports |

### 3.3 Feature-Internal Large Files

Files already inside features but still oversized:

| File | Lines | Feature |
|------|-------|---------|
| reportUtils.ts | 2,401 | reports |
| sankeyDataBuilder.ts | 1,037 | analytics |
| SankeyChart.tsx | 890 | analytics |
| DrillDownGrid.tsx | 808 | analytics |
| useScanStore.ts | 946 | scan |
| useBatchReviewHandlers.ts | 768 | batch-review |

### 3.4 Feature Consolidation Gap

~185 source files remain in flat `src/` directories that belong in feature modules. Major migrations needed:

| From | To Feature | Estimated Files |
|------|-----------|----------------|
| `views/TrendsView/` (17 files) | `features/analytics/` | 17 |
| `views/DashboardView/` (13 files) | `features/dashboard/` | 13 |
| `views/TransactionEditorView/` (8 files) | `features/transaction-editor/` | 8 |
| `views/HistoryView*` | `features/history/` | 2 |
| `views/ItemsView/` | `features/items/` (new) | 3 |
| `views/BatchCaptureView.tsx` etc. | `features/batch-review/` | 3 |
| `views/InsightsView.tsx` | `features/insights/` | 1 |
| `views/ReportsView.tsx` | `features/reports/` | 1 |
| `views/SettingsView/` (3 files) | `features/settings/` | 3 |
| `views/EditView.tsx` | `features/transaction-editor/` | 1 |
| `views/ScanResultView.tsx` | `features/scan/` | 1 |
| `views/ScanView.tsx` | `features/scan/` | 1 |
| `hooks/` (feature-specific) | Various features | ~15-20 |
| `components/` (feature-specific) | Various features | ~30-40 |
| `services/` (feature-specific) | Various features | ~5 |
| `utils/` (feature-specific) | Various features | ~8 |

### 3.5 DAL Consumer Migration

The repository pattern exists but is underutilized:

| Repository | Impl Exists | Consumers Migrated | Total Consumers | Gap |
|-----------|-------------|-------------------|----------------|-----|
| TransactionRepository | Yes | 0 | ~8 hooks/views | 8 |
| MappingRepository | Yes | 4 hooks | 4 | 0 (done) |
| TrustRepository | Yes | 2 hooks | ~4 | 2 |
| PreferencesRepository | Yes | 0 | ~11 | 11 |
| RecordsRepository | Yes | 0 | ~3 | 3 |
| AirlockRepository | Yes | 0 | ~3 | 3 |
| InsightProfileRepository | Yes | 0 | ~2 | 2 |
| CreditsRepository | Yes | 0 | ~4 | 4 |

### 3.6 State Management Remaining

| Context | Action | Risk |
|---------|--------|------|
| HistoryFiltersContext | Audit if still needed — Zustand store exists | Low |
| AnalyticsContext | Migrate to Zustand (temporal/category position) | Medium |
| NotificationContext | Migrate to Zustand (in-app notifications) | Medium |

### 3.7 Cross-Cutting Large Hooks

| Hook | Lines | Feature? |
|------|-------|---------|
| useScanHandlers | 956 | scan (app-level orchestrator) |
| useItems | 573 | items or shared |
| useTransactionHandlers | 545 | transaction-editor (app-level orchestrator) |
| useActiveTransaction | 537 | transaction-editor |
| useBatchReview | 429 | batch-review |
| useNavigationHandlers | 377 | shared/app |
| useUserCredits | 360 | credit |
| useBatchProcessing | 344 | batch-review |
| useDialogHandlers | 334 | shared/app |
| useBatchCapture | 330 | batch-review |

---

## 4. Recommended Focus Areas for Epic 15b

> These work areas are addressed in the proposed roadmap (Section 9).

### Area A: Feature Consolidation (Moving Code Into Features)

Move views, hooks, components, and services into their feature modules. This is primarily file moves + import rewiring — low behavioral risk, high structural impact.

**Impact:** Feature adoption ~42% → ~85%+

### Area B: View Decomposition Round 2

Decompose the 8 never-scoped views and push the 4 plateaued views further down.

**Target:** No source file over 800 lines (excluding data files and App.tsx)

### Area C: DAL Consumer Rollout

Migrate remaining ~33 consumers from direct Firebase imports to repository pattern.

**Impact:** Firebase SDK imports 49 → ~15 files

### Area D: Feature-Internal File Decomposition

Break up large files that are already inside features: reportUtils (2,401), sankeyDataBuilder (1,037), useScanStore (946), SankeyChart (890), DrillDownGrid (808).

### Area E: State Management Completion

Migrate remaining 2-3 Contexts to Zustand, audit/remove HistoryFiltersContext wrapper.

### Area F: App.tsx & Dependency Architecture

App.tsx at 2,081 lines with **74 outgoing dependencies** (highest fan-out in codebase) was declared "irreducible orchestration" in Phase 5f. With feature modules now holding more logic, re-evaluate whether further extraction is possible. The dependency analysis confirms it as the single worst coupling hotspot.

### Area G: Circular Dependency Resolution

6 circular dependencies remain. 3 center on `components/App/index.ts` barrel — the barrel re-exports `viewRenderers.tsx` which imports views that import back from the barrel. Remaining cycles involve `shared/stores/index.ts`, `managers/ModalManager/`, and `TransactionEditorViewInternal ↔ EditorScanThumbnail`.

### Area H: Layer Violation Cleanup

8 layer violations remain (down from 144), all concentrated in `src/hooks/app/`:
- 7 hooks → components imports (useDialogHandlers, useNavigationHandlers importing from components/App/)
- 1 hooks → views import (useNavigationHandlers importing from TrendsView)

These hooks need to abstract through interfaces rather than importing concrete components/views.

### Area I: High-Coupling Type Decomposition

`types/transaction.ts` has **109 dependents** (~21% of codebase). Any change cascades widely. Consider splitting into domain-specific sub-types (base, display, mutation) to reduce blast radius.

### Area J: Dead Module Audit

Dependency analysis identified entry points with no incoming dependencies that need usage verification:
- `hooks/useAirlocks.ts`, `hooks/useDialogResolution.ts`
- `utils/semanticColors.ts`
- `components/charts/*.tsx` (2 files)
- `features/settings/components/subviews/DatosAprendidosView.tsx`

Note: `views/EditView.tsx` and `views/ScanResultView.tsx` also appear as entry points but are loaded via dynamic import in `viewRenderers.tsx` — they are NOT dead.

---

## 5. Dependency Analysis Findings

> Source: `dependency-diagrams/ANALYSIS-REPORT.md` (2026-02-13)

### 5.1 Summary Metrics

| Metric | Value |
|--------|-------|
| Total modules | 510 |
| Dependency edges | 1,768 |
| Circular dependencies | 6 |
| Orphaned modules | 0 |
| Layer violations | 8 (down from 144) |
| Entry points | 23 |

### 5.2 Fan-Out Hotspots (Outgoing Dependencies)

These files pull in the most dependencies — prime candidates for decomposition:

| File | Outgoing Deps | Notes |
|------|--------------|-------|
| `App.tsx` | **74** | God file — orchestration hub |
| `TrendsView.tsx` | **36** | Already decomposed once (5,901→1,981) |
| `DashboardView.tsx` | **31** | Already decomposed once (3,412→1,485) |
| `TransactionEditorViewInternal.tsx` | **30** | Already decomposed once (2,721→1,421) |
| `HistoryView.tsx` | **27** | Never scoped for decomposition |
| `EditView.tsx` | **26** | Never scoped for decomposition |
| `ItemsView.tsx` | **23** | Never scoped for decomposition |
| `useSettingsViewData.ts` | **20** | Data hook with many imports |
| `useBatchReviewHandlers.ts` | **19** | Complex handler hub |

**Observation:** The fan-out ranking perfectly correlates with file size, confirming that decomposition should target these files in this priority order.

### 5.3 Fan-In Hotspots (Most Depended Upon)

These are the most-imported modules — changes here cascade widely:

| File | Dependents | Risk |
|------|-----------|------|
| `types/transaction.ts` | **109** | HIGH — 21% of codebase depends on this |
| `config/categoryColors.ts` | **49** | LOW — data file, rarely changes |
| `utils/currency.ts` | **44** | LOW — stable utility (centralized in Epic 15) |
| `hooks/useReducedMotion.ts` | **38** | MEDIUM — imported individually everywhere |
| `utils/translations.ts` | **35** | LOW — data file, append-only |
| `utils/categoryTranslations.ts` | **30** | LOW — data file |
| `features/scan/store/index.ts` | **27** | MEDIUM — scan feature coupling point |
| `types/scanStateMachine.ts` | **24** | MEDIUM — complex state machine type |

**Actionable:** `transaction.ts` (109 deps) should be split to reduce blast radius. `useReducedMotion` (38 deps) should be provided via context or shared wrapper instead of direct import in every component.

### 5.4 Circular Dependencies (6 cycles)

| Cycle | Nodes | Root Cause | Fix Strategy |
|-------|-------|-----------|-------------|
| App→viewRenderers→TransactionEditor→batch-review→App | 10 | `components/App/index.ts` barrel | Break barrel, lazy imports in viewRenderers |
| App→viewRenderers→ItemsView→App | 4 | Same barrel pattern | Same fix |
| App→viewRenderers→HistoryView→App | 3 | Same barrel pattern | Same fix |
| shared/stores→useInsightStore→SessionComplete→shared/stores | 4 | Barrel re-export creates loop | Direct imports instead of barrel |
| ModalManager→registry→CreditInfoModal→ModalManager | 4 | Registry pattern | Lazy modal registration |
| TransactionEditorViewInternal ↔ EditorScanThumbnail | 2 | Bidirectional component dep | Extract shared types/props |

**Key insight:** Fixing `components/App/index.ts` barrel resolves 3 of 6 cycles in one shot.

### 5.5 Layer Violations (8 edges)

All in `src/hooks/app/`:

| Hook | Violates | Imports From |
|------|----------|-------------|
| `useDialogHandlers.ts` | hooks→components | `components/App/` (5 edges) |
| `useNavigationHandlers.ts` | hooks→components | `components/App/` (2 edges) |
| `useNavigationHandlers.ts` | hooks→views | `views/TrendsView/` (1 edge) |

**Fix:** Extract interface types from these components/views into `types/` or `shared/types/`, then import the interfaces instead of concrete implementations.

### 5.6 Feature Cross-Coupling

Only 4 cross-feature pairs (8 edges total) — feature isolation is strong:

| From | To | Edges | Assessment |
|------|----|-------|-----------|
| `batch-review` → `categories` | 3 | Acceptable — batch needs category data |
| `batch-review` → `scan` | 2 | Acceptable — batch extends scan |
| `scan` → `categories` | 2 | Acceptable — scan categorizes |
| `scan` → `transaction-editor` | 1 | Acceptable — scan creates transactions |

No cross-feature cycles. All dependencies flow in one direction.

### 5.7 Cross-Layer Dependency Matrix Summary

The expected flow is: `views → components → features → hooks/services → shared → utils/types`

**Clean layers:** services, utils, types, shared, entities — no upward violations.
**Violation layer:** `hooks/app/` — 8 upward imports into components and views.
**High coupling:** `views` layer has 383 outgoing edges (heaviest consumer of everything).

---

## 6. Key Metrics to Track

| Metric | Current (Feb 13) | Target | Notes |
|--------|-----------------|--------|-------|
| Files >800 lines (excl. data/test) | 16 | ≤3 | Plateaued views may settle ~1,000-1,200 |
| Files 500-800 | 34 | <15 | |
| Feature adoption (% files in features) | 42% | 85%+ | Includes migrated test files |
| Feature adoption (% lines in features) | 40% | 80%+ | |
| Service-layer Firebase imports | ~24 files | <8 | Excludes type-only imports (~10) and infrastructure (~7) which are structurally correct |
| Files in flat `src/views/` | 60 | <10 (shells/routing only) | |
| Files in flat `src/hooks/` | 49 | <20 (cross-feature only) | |
| Files in flat `src/components/` | 90 | <30 (shared only) | |
| Context providers (client state) | 3 non-Auth | 0 | |
| Max non-data file size | 2,401 | <800 (never-scoped), <1,200 (plateaued) | Honest per-file targets |
| Circular dependencies | 6 | 0 | |
| Layer violations | 8 | 0 | |
| App.tsx fan-out | 74 | <30 | Tracked separately — line count secondary to coupling |
| Max fan-in non-type file | 49 (categoryColors) | <40 | |
| `transaction.ts` dependents | 109 | <50 (after split) | |

---

## 7. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Import rewiring breakage | Medium | ast-grep for bulk updates + `npx vitest run` after each move |
| Feature boundary decisions | Low | Follow existing patterns from Epic 15 Phase 4 |
| DAL migration regressions | Medium | Repository implementations wrap existing services — no behavior change |
| View decomposition regressions | High | TDD: write tests for extracted logic BEFORE extracting |
| Test mock staleness | High | Grep for old paths in tests after every move |
| Context → Zustand migration | Medium | Consumer-by-consumer migration with tests |
| Circular dependency breakage | Medium | Fix barrel exports first (resolves 3/6 cycles), then lazy imports |
| Type splitting cascade | High | `transaction.ts` has 109 dependents — split requires careful sub-type design + bulk import updates |
| Layer violation fixes | Low | Extract interfaces — no behavior change |

---

## 8. Testing & Safeguard Requirements

Every story in this epic is a refactoring story — no new features, no behavior changes. The primary risk is regression. These safeguards are **mandatory** for every story.

### 8.1 Per-Story Testing Gate

Every story MUST pass these checks before marking as `review`:

| Check | Command | When |
|-------|---------|------|
| TypeScript compilation | `npx tsc --noEmit` | After every file move or edit |
| Unit tests (full) | `npm run test:quick` | After every file move or edit |
| Affected test files | `npx vitest run <changed-test-paths>` | After each atomic change |
| Integration tests | `npm run test:story` | Before marking story as `review` |

**Critical rule from Epic 15:** NEVER batch test fixes at the end. Fix each breakage atomically as it occurs. A story is not done if tests are red.

### 8.2 Refactoring-Specific Safeguards

These apply to file moves and import rewiring (Phases 0-1):

| Safeguard | How | Why |
|-----------|-----|-----|
| Mock path audit | `grep -r "old/module/path" tests/` after every move | Stale mocks are the #1 post-refactor failure (confirmed by Epic 15 experience) |
| Re-export backward compat | Add `export * from 'new/path'` in old location if >5 consumers | Reduces blast radius of moves |
| Import count verification | Count imports before and after move — must match | Catches missed consumers |
| Barrel export verification | Verify feature `index.ts` exports everything the old location did | Prevents runtime `undefined` imports |
| **Test file migration** | Move corresponding test files alongside source files (mirror structure) | Test directory must match source directory — divergence causes confusion |

**Test file migration rule:** When `src/views/FooView.tsx` moves to `src/features/foo/views/FooView.tsx`, the test at `tests/unit/views/FooView.test.tsx` moves to `tests/unit/features/foo/views/FooView.test.tsx`. Update test imports and mock paths in the same commit. Each consolidation story scope includes both source AND test file counts.

### 8.3 Decomposition-Specific Safeguards

These apply to file splitting (Phase 2):

| Safeguard | How | Why |
|-----------|-----|-----|
| Behavior snapshot tests | Run existing tests BEFORE extracting — save pass/fail baseline | Proves extraction didn't change behavior |
| Extract pure logic first | Move pure functions (helpers, aggregations, formatters) before stateful code | Pure functions are testable in isolation |
| No new functionality | Decomposition stories MUST NOT add features, fix bugs, or improve logic | Mixing refactor + behavior change makes regressions untraceable |
| Fan-out verification | Run `depcruise` after decomposition — fan-out of parent file must decrease | Proves decomposition reduced coupling |

### 8.4 DAL & State Migration Safeguards

These apply to Phases 3-4:

| Safeguard | How | Why |
|-----------|-----|-----|
| Consumer-by-consumer migration | Migrate ONE hook/view at a time, test, commit | Isolates regressions to one consumer |
| Repository behavior parity | Repository methods must have identical signatures to wrapped service functions | Zero behavior change guarantee |
| Context removal gate | Before deleting a Context, grep for ALL consumers — must be zero | Prevents runtime crashes from missing providers |
| State hydration test | After Zustand migration, verify initial state matches old Context default | Catches initialization differences |

### 8.5 Dependency Graph Regression Gate

Run after EVERY phase completion (not per-story):

```bash
# Regenerate dependency analysis
npm run depcruise  # or however the dependency-diagrams are generated

# Verify metrics improved or held steady
# Circular dependencies: must not increase
# Layer violations: must not increase
# Orphaned modules: must stay at 0
# Fan-out of modified files: must decrease or hold
```

Compare `dependency-diagrams/ANALYSIS-REPORT.md` metrics against the Phase 0 baseline. If any metric regresses, investigate before starting the next phase.

### 8.6 End-of-Phase Gates

| Phase | Gate | Command/Check |
|-------|------|---------------|
| Phase 0 (Cleanup) | `npm run test:story` + depcruise: 0 cycles, 0 violations | Must pass before Phase 1 |
| Phase 1 (Consolidation) | `npm run test:story` + feature adoption >80% + depcruise stable | Must pass before Phase 2 |
| Phase 2 (Decomposition) | `npm run test:story` + never-scoped views <800, plateaued views <1,200 (excl. data/test) | Must pass before Phase 3 |
| Phase 3 (Infrastructure) | `npm run test:story` + service-layer Firebase imports <8 + 0 non-Auth Contexts | Must pass before Phase 4 |
| Phase 4 (Architecture) | `npm run test:sprint` (full suite including E2E) + App.tsx fan-out <30 | Epic completion gate |

**Phase 4 uses `test:sprint`** (the full 5-minute suite with E2E) because it's the final gate and touches the highest-coupling files.

### 8.8 Rollback Strategy

Each story is one commit/PR to `develop` per existing git workflow. If a phase gate fails, investigate and fix forward on the current branch — do not revert entire phases. If an individual story PR causes regressions caught after merge, revert that specific PR. Phase 1 consolidation stories may introduce new circular dependencies from import rewiring; re-run depcruise after each consolidation story (not just at phase end) to catch new cycles early.

### 8.7 Story Sizing Constraints

- **Max 6 tasks / 25 subtasks / 10 files per story** (smaller than Epic 15's 8/40/12 limit)
- Consolidation (file move) stories: max **20 source+test files** moved per story (one feature module per story). File moves are mechanical and low-risk — higher limit than decomposition is appropriate
- Decomposition stories: **one source file** per story (the file being split)
- DAL migration stories: max 4-5 consumers per story
- If a story exceeds limits during development, split immediately — do not push through

---

## 9. Proposed Roadmap

### Phase 0: Structural Cleanup (~5 stories, ~7 pts)

**Goal:** Clean dependency graph before moving files.

| # | Story | Area | Est. | Risk |
|---|-------|------|------|------|
| 1 | Dead module audit — verify 5 suspect entry points (useAirlocks, useDialogResolution, semanticColors, chart components, DatosAprendidosView), delete confirmed dead code | J | 1 pt | Low |
| 2 | Fix App barrel cycles — break `components/App/index.ts` barrel, lazy imports in viewRenderers (resolves 3/6 cycles) | G | 2 pts | Medium |
| 3 | Fix stores/ModalManager/EditorScanThumbnail cycles (remaining 3/6) | G | 2 pts | Medium |
| 4 | Layer violation cleanup — extract interface types from hooks/app/ (8 violations → 0) | H | 1 pt | Low |
| 5 | Dependency graph baseline — generate and commit Phase 0 baseline metrics | — | 1 pt | Low |

**Exit gate:** 0 circular dependencies, 0 layer violations, 0 orphans, depcruise baseline committed.

### Phase 1: Feature Consolidation (~12 stories, ~20 pts)

**Goal:** Move source files AND corresponding test files into feature modules. One feature per story. Story scope includes both `src/` and `tests/unit/` moves.

| # | Story | What Moves (source + tests) | Est. |
|---|-------|-----------|------|
| 6 | Consolidate `features/analytics/` | TrendsView/ (17 files) + analytics hooks + utils + test mirrors | 3 pts |
| 7 | Consolidate `features/dashboard/` | DashboardView/ (13 files) + dashboard hooks + test mirrors | 2 pts |
| 8 | Consolidate `features/transaction-editor/` | TransactionEditorView/ (8 files) + EditView + editor hooks + test mirrors | 2 pts |
| 9 | Consolidate `features/history/` | HistoryView + history hooks + historyFilterUtils + test mirrors | 2 pts |
| 10 | Create & consolidate `features/items/` | ItemsView/ (3 files) + components/items/ + useItems hook + test mirrors | 2 pts |
| 11 | Consolidate `features/batch-review/` | BatchCaptureView + BatchReviewView + batch hooks + batch components + test mirrors | 2 pts |
| 12 | Consolidate `features/insights/` | InsightsView + remaining insight hooks/components + test mirrors | 2 pts |
| 13 | Consolidate `features/reports/` | ReportsView + remaining report components + test mirrors | 1 pt |
| 14 | Consolidate `features/scan/` | ScanView + ScanResultView + remaining scan hooks/components + test mirrors | 2 pts |
| 15 | Consolidate `features/settings/` | SettingsView/ (3 files) + setting components + test mirrors | 1 pt |
| 16 | Shared audit — verify remaining `src/hooks/`, `src/components/`, `src/utils/` are truly cross-feature | 1 pt |
| 17 | Feature barrel exports — ensure all features have clean `index.ts` barrels + depcruise cycle check | 1 pt |

**Exit gate:** Feature adoption >80%, `src/views/` <10 files, `src/hooks/` <20, `src/components/` <30, `test:story` green, depcruise stable (no new cycles introduced).

### Phase 2: Decomposition (~16 stories, ~34 pts)

**Goal:** Never-scoped views to <800 lines. Plateaued views to <1,200 lines. Feature-internal files to <800 lines. One source file per story.

**Never-scoped views (4 stories) — target <800:**

| # | Story | File | Lines | Est. |
|---|-------|------|-------|------|
| 18 | Decompose EditView | 1,811 | 3 pts |
| 19 | Decompose ScanResultView | 1,554 | 3 pts |
| 20 | Decompose HistoryView | 1,168 | 2 pts |
| 21 | Decompose ItemsView | 1,003 | 2 pts |

**Feature-internal large files (8 stories) — target <800, one file per story:**

| # | Story | File | Lines | Est. |
|---|-------|------|-------|------|
| 22 | Decompose reportUtils.ts | 2,401 | 3 pts |
| 23 | Decompose sankeyDataBuilder.ts | 1,037 | 2 pts |
| 24 | Decompose SankeyChart.tsx | 890 | 2 pts |
| 25 | Decompose useScanStore.ts | 946 | 2 pts |
| 26 | Decompose DrillDownGrid.tsx | 808 | 2 pts |
| 27 | Decompose useBatchReviewHandlers.ts | 768 | 1 pt |
| 28 | Decompose historyFilterUtils.ts | 1,075 | 2 pts |
| 29 | Decompose useScanHandlers.ts | 956 | 2 pts |

**Plateaued views round 2 (4 stories) — target <1,200 (honest ceiling, these were already decomposed once):**

| # | Story | File | Lines | Est. |
|---|-------|------|-------|------|
| 30 | TrendsView further extraction | 1,981 | 3 pts |
| 31 | DashboardView further extraction | 1,485 | 3 pts |
| 32 | TransactionEditorViewInternal further extraction | 1,421 | 3 pts |
| 33 | IconCategoryFilter further extraction | 1,106 | 2 pts |

**Exit gate:** Never-scoped views <800, plateaued views <1,200, feature-internal files <800 (excl. data/test), `test:story` green, depcruise fan-out decreased for all decomposed files.

### Phase 3: Infrastructure Hardening (~7 stories, ~13 pts)

**Goal:** Reduce service-layer Firebase coupling and complete state management.

**IMPORTANT:** Consumer counts below are estimates. Before writing stories, run verified grep against codebase to confirm exact consumer counts per repository. Adjust story scope accordingly.

| # | Story | What | Est. |
|---|-------|------|------|
| 34 | DAL: Migrate transaction hooks to TransactionRepository | Verify: ~8 consumers | 2 pts |
| 35 | DAL: Migrate trust + preferences hooks to repositories | Verify: ~6 consumers | 2 pts |
| 36 | DAL: Migrate records + airlock + insight profile hooks | Verify: ~8 consumers | 3 pts |
| 37 | DAL: Migrate credits hooks to CreditsRepository | Verify: ~4 consumers | 2 pts |
| 38 | DAL: Migrate remaining view/component direct Firebase imports | Verify: remaining consumers | 2 pts |
| 39 | State: AnalyticsContext → Zustand | 1 context | 2 pts |
| 40 | State: NotificationContext → Zustand + HistoryFiltersContext removal | 2 contexts | 2 pts |

**Exit gate:** Service-layer Firebase imports <8 files, 0 non-Auth Contexts, `test:story` green.

### Phase 4: High-Coupling Architecture (~6 stories, ~13 pts)

**Goal:** Reduce blast radius of highest-coupling modules.

| # | Story | What | Est. |
|---|-------|------|------|
| 41 | Design `transaction.ts` sub-type schema — read all 109 consumers, classify usage patterns, produce split plan | Design only, no code changes | 2 pts |
| 42 | Split `transaction.ts` into domain sub-types per design from #41 + re-export from original for backward compat | Type split + re-export shim | 2 pts |
| 43 | Update transaction type consumers (batch 1: services + repositories) | Import rewiring | 2 pts |
| 44 | Update transaction type consumers (batch 2: hooks + features) | Import rewiring | 2 pts |
| 45 | Update transaction type consumers (batch 3: views + components) + remove re-export shim | Import rewiring + cleanup | 2 pts |
| 46 | App.tsx fan-out reduction — extract feature orchestrators | 74 deps → <30 | 3 pts |
| 47 | Final dependency graph validation + epic metrics comparison | Depcruise comparison vs Phase 0 baseline | 1 pt |

**Exit gate:** `npm run test:sprint` (full suite + E2E), `transaction.ts` dependents <50, App.tsx fan-out <30, all metrics in Section 6 met.

---

## 10. Epic 15b Summary

| Phase | Focus | Stories | Est. Points | Risk |
|-------|-------|---------|-------------|------|
| 0: Structural Cleanup | Cycles, violations, dead code | 5 | ~7 | Low |
| 1: Feature Consolidation | Move ~100+ source+test files into features | 12 | ~21 | Low-Medium |
| 2: Decomposition | 16 files >800 → target sizes | 16 | ~34 | High |
| 3: Infrastructure | DAL rollout + state mgmt | 7 | ~15 | Medium |
| 4: Architecture | transaction.ts split + App.tsx | 7 | ~14 | High |
| **Total** | | **~47** | **~91** | |

### Suggested Sprint Breakdown

| Sprint | Phases | Duration | Focus |
|--------|--------|----------|-------|
| Sprint 15b.1 | Phase 0 + Phase 1 (start) | 1 week | Cleanup + begin consolidation |
| Sprint 15b.2 | Phase 1 (finish) + Phase 2 (start) | 1-2 weeks | Finish consolidation + begin decomposition |
| Sprint 15b.3 | Phase 2 (finish) + Phase 3 | 1-2 weeks | Finish decomposition + infrastructure |
| Sprint 15b.4 | Phase 4 | 1 week | Architecture + final validation |

### Story Sizing Limits

| Constraint | Limit |
|-----------|-------|
| Tasks per story | 6 max |
| Subtasks per story | 25 max |
| Files touched per decomposition story | 10 max |
| Source+test files moved per consolidation story | 20 max |
| Files decomposed per story | 1 (one source file per story) |
| DAL consumers per migration story | 4-5 max |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial analysis created from Epic 15 closure findings |
| 2026-02-13 | Incorporated dependency analysis from `dependency-diagrams/ANALYSIS-REPORT.md`: added Section 5 (dependency findings), Areas G-J (cycles, violations, type coupling, dead modules), updated metrics and risks |
| 2026-02-13 | Added Sections 8-10: testing safeguards, proposed roadmap with 5 phases / ~43 stories / ~86 pts, sprint breakdown, story sizing limits |
| 2026-02-13 | Adversarial review fixes: cleaned Section 2.3 raw notes; removed stale hedge in Section 4; replaced maturity labels with consolidation effort data; removed EditView/ScanResultView from dead module audit; dropped useReducedMotion story (premature optimization); split Phase 2 to one-file-per-story (12→16 stories); relaxed plateaued view targets to <1,200; changed Firebase metric to service-layer only (<8); added test file migration rule + rollback strategy; raised consolidation file limit to 20; added transaction.ts design story; removed App.tsx from exit gate exclusions; flagged DAL consumer counts for verification. Total: ~47 stories, ~91 pts |
