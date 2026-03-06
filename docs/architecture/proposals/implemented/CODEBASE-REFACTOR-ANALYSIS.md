# Codebase Refactor Analysis

> **Original Date:** 2026-02-07
> **Updated:** 2026-02-09 (post shared-groups removal)
> **Scope:** Full codebase — `src/features/shared-groups/` has been deleted
> **Status:** APPROVED — This document defines **Epic 15: Codebase Refactoring**

---

## Executive Summary

The codebase has **14 files exceeding the 800-line ECC limit** (max 800, warning at 500+). The top 3 files alone total **12,034 lines** (TrendsView 5,901, DashboardView 3,412, TransactionEditorViewInternal 2,721). Feature-Sliced Design is declared but only ~30% adopted — most domain logic lives in flat `src/services/`, `src/hooks/`, `src/utils/`, and `src/components/` directories rather than feature modules.

### Post Shared-Groups Removal (2026-02-09)

The shared-groups feature (Epic 14d) was fully removed, deleting ~43,700 lines across ~225 files. This resolved several findings from the original analysis:

- **Dead services:** `changelogService.ts`, `invitationService.ts`, `sharedGroupService.ts` deleted
- **Dead stores:** `useViewModeStore.ts` deleted
- **Dead utils:** `sharingCooldown.ts`, `userSharingCooldown.ts`, `cooldownCore.ts`, `viewModeFilterUtils.ts` deleted
- **Dead types:** `sharedGroup.ts`, `changelog.ts` deleted
- **Dead hooks:** 6 group-related hooks deleted
- **State cleanup:** `GroupFilterState` removed from `HistoryFiltersContext`
- **Translations:** 560+ orphaned keys removed (`translations.ts` 2,201 → 1,707 lines)
- **Firebase:** sharedGroups/pendingInvitations rules and indexes removed; 2 Cloud Functions deleted

### Current Key Numbers

| Metric | Original (Feb 7) | Current (Feb 9) | Change |
|--------|-------------------|------------------|--------|
| Files over 800 lines | 23 | **14** | -9 |
| Files over 500 lines | ~35 | **35** | ~same |
| Feature modules | 5 | **5** (shared-groups deleted) | -1 |
| Firebase SDK imports | 72 files | **46 files** | -26 |
| Dead services | 4 | **3** (fcmToken, pushNotifications, transactionQuery) | -1 |
| React Contexts (client state) | 6 | **5** (GroupFilter removed) | -1 |
| Duplicated mapping services | 4 (828 lines) | **4 (828 lines)** | same |
| Duplicated mapping components | 4 (~1,600 lines) | **4 (2,238 lines)** | same |
| Normalization functions | 5 variants | **15 functions, 5 copies of `normalizeItemName`** | worse than estimated |
| Batch chunking bugs | 2 services | **2 services** | same |
| Hardcoded 'CLP' | 13+ files | **56 occurrences** | worse than estimated |
| localStorage direct access | 19 files | **22 files** | +3 |
| Inline `.sort()` calls | 15+ patterns | **132 calls across 43 files** | worse than estimated |
| Total codebase | ~140K lines | **~130K lines** | -10K |

---

## Finding 1: Mega-Views (P0 - Critical)

### The Problem
View files are monolithic — each combines data fetching, aggregation, state management, event handlers, and JSX rendering in a single file.

### Files Over 800 Lines (Current)

| File | Lines | Hooks | Priority |
|------|-------|-------|----------|
| `views/TrendsView.tsx` | **5,901** | 114 | P0 |
| `views/DashboardView.tsx` | **3,412** | 72 | P0 |
| `views/TransactionEditorViewInternal.tsx` | **2,721** | 60 | P0 |
| `utils/reportUtils.ts` | **2,401** | - | P0 |
| `App.tsx` | **2,069** | 30+ | P1 |
| `views/EditView.tsx` | **1,810** | 19 | P1 |
| `components/history/IconFilterBar.tsx` | **1,797** | 15+ | P0 |
| `utils/translations.ts` | **1,707** | - | P2 (data) |
| `views/ScanResultView.tsx` | **1,554** | 20+ | P1 |
| `config/categoryColors.ts` | **1,379** | - | P2 (data) |
| `views/HistoryView.tsx` | **1,168** | 15+ | P2 |
| `utils/historyFilterUtils.ts` | **1,075** | - | P1 |
| `utils/sankeyDataBuilder.ts` | **1,036** | - | P1 |
| `views/ItemsView/ItemsView.tsx` | **1,003** | 18 | P2 |

**Files at 500-800 lines (warning zone):** 21 more files including `useScanHandlers.ts` (962), `useScanStore.ts` (946), `SankeyChart.tsx` (890), `ReportDetailOverlay.tsx` (812), `locationService.ts` (810), `pendingScanStorage.ts` (803), `BatchCaptureView.tsx` (798), `InsightsView.tsx` (772), `useBatchReviewHandlers.ts` (768).

### Decomposition Strategies

These remain unchanged from the original analysis — the mega-views were not affected by the shared-groups removal:

**TrendsView (5,901 → ~6 files):** Extract into `features/analytics/` with hooks (`useTrendsAggregation`, `useTrendsFilters`, `useTrendsAnimation`), utils (`categoryAggregation`, `trendsPeriod`, `sankeyDataBuilder`), and components (`TrendsCarousel`, `TrendsTreemap`, `TrendsDonut`, `TrendsSankey`).

**DashboardView (3,412 → ~5 files):** Extract into `features/dashboard/` with components (`DashboardTreemap`, `DashboardRecents`, `DashboardMonthNav`), hooks (`useDashboardSelection`), sharing `categoryAggregation.ts` with analytics.

**TransactionEditorViewInternal (2,721 → ~5 files):** Expand `features/transaction-editor/` with hooks (`useItemOperations`, `useLearningPromptChain`, `useItemNameSuggestions`), components (`ItemEditor`, `LearningPrompts`, `ScanStateSection`).

**IconFilterBar (1,797 → ~5 files):** Extract 3 inline dropdowns into separate components: `TemporalFilterDropdown`, `CategoryFilterDropdown`, `LocationFilterDropdown`.

---

## Finding 2: Feature-Sliced Design Violation (P0 - Critical)

### The Problem

The architecture doc says "Feature-Sliced Design" but only **5 features** exist for **21 views** (15 root-level view files + 6 view subdirectories):

| Existing Feature | Has Services | Has Hooks | Has Components | Has Store |
|-----------------|-------------|-----------|----------------|-----------|
| `batch-review` | No | Yes (27 files) | No | Yes |
| `categories` | No | No | Yes (7 files) | No |
| `credit` | No | No | Yes (6 files) | No |
| `scan` | No | Yes | Yes (33 files) | Yes |
| `transaction-editor` | No | No | No (5 files) | Yes |

**Missing feature modules** (currently scattered across flat directories):

| Should Be Feature | Current Location | Estimated Lines |
|-------------------|-----------------|-----------------|
| `analytics` / `trends` | `views/TrendsView` + `components/analytics/*` + `utils/sankey*,chart*,period*` | ~9,000 |
| `dashboard` | `views/DashboardView` + `components/DashboardView/*` | ~4,000 |
| `history` | `views/HistoryView` + `components/history/*` + `utils/historyFilter*` | ~5,000 |
| `insights` | `views/InsightsView` + `components/insights/*` + `services/insight*` | ~3,000 |
| `reports` | `views/ReportsView` + `components/reports/*` + `utils/reportUtils` | ~4,000 |
| `settings` | `views/SettingsView/*` + `components/settings/*` | ~2,500 |
| `items` | `views/ItemsView/*` | ~1,500 |

### Components That Belong in Features

| Component Dir | Should Be In | Files |
|--------------|-------------|-------|
| `components/analytics/` | `features/analytics/components/` | SankeyChart, DrillDownGrid, etc. |
| `components/history/` | `features/history/components/` | IconFilterBar, FilterChips, etc. |
| `components/scan/` | `features/scan/components/` (split!) | QuickSaveCard, etc. |
| `components/batch/` | `features/batch-review/components/` | BatchCaptureUI, ConfirmationDialog, etc. |
| `components/reports/` | `features/reports/components/` | ReportDetailOverlay, etc. |
| `components/insights/` | `features/insights/components/` | InsightsViewSwitcher, etc. |
| `components/settings/` | `features/settings/components/` | Subviews, etc. |

### Services That Belong in Features

| Service (src/services/) | Used By | Move To |
|------------------------|---------|---------|
| `airlockService.ts` | hooks only | `features/insights/services/` |
| `insightProfileService.ts` | hooks only | `features/insights/services/` |
| `insightEngineService.ts` (643 lines) | hooks only | `features/insights/services/` |
| `recordsService.ts` (712 lines) | hooks only | `features/insights/services/` |
| `itemDuplicateDetectionService.ts` | views only | `features/history/services/` or shared |
| `merchantMatcherService.ts` | hooks only | shared service (OK) |
| `merchantTrustService.ts` | hooks only | shared service (OK) |
| `subcategoryMappingService.ts` | hooks only | shared (mapping pattern) |

### Dead Services (0 external importers — verified 2026-02-09)

| Service | Lines | Status |
|---------|-------|--------|
| `fcmTokenService.ts` | 410 | **DEAD** — 0 imports in `src/` |
| `pushNotifications.ts` | 182 | **DEAD** — 0 imports in `src/` |
| `transactionQuery.ts` | 601 | **DEAD** — 0 imports in `src/` |

**Total dead code: 1,193 lines.** Note: `changelogService.ts` and `invitationService.ts` were already deleted during shared-groups removal.

**`userPreferencesService.ts`** (167 lines) — NOT dead. Still imported by 11 files for scan preferences and user settings.

---

## Finding 3: Duplicated Service Patterns (P0 - Critical)

### 3a. Four Mapping Services — Copy-Paste Pattern

| Service | Lines | Collection |
|---------|-------|-----------|
| `categoryMappingService.ts` | 199 | `category_mappings` |
| `merchantMappingService.ts` | 200 | `merchant_mappings` |
| `subcategoryMappingService.ts` | 198 | `subcategory_mappings` |
| `itemNameMappingService.ts` | 231 | `item_name_mappings` |

**Total: 828 lines** of near-identical code. Each has the same `save*Mapping()`, `subscribeTo*Mappings()`, `increment*MappingUsage()`, and `normalize*Name()` functions. Only the collection name differs.

**Fix:** Create `genericMappingService.ts` parameterized by config. Reduces **~828 lines to ~250**.

### 3b. Two Duplicate Detection Services

| Service | Lines |
|---------|-------|
| `duplicateDetectionService.ts` | 368 |
| `itemDuplicateDetectionService.ts` | 374 |

**Total: 742 lines.** Both implement identical group-by-key, pairwise comparison, and Union-Find algorithms. Only matching criteria differ.

**Fix:** Extract `baseDuplicateDetection.ts` with configurable comparator. Saves **~300 lines**.

### 3c. Normalization Inconsistency (Bug — Confirmed Worse Than Estimated)

**15 normalize functions** across the codebase. The worst case: `normalizeItemName` is **copied verbatim into 5 separate files**:
1. `utils/categoryMatcher.ts`
2. `services/categoryMappingService.ts`
3. `services/itemNameMappingService.ts`
4. `services/subcategoryMappingService.ts`
5. `services/itemDuplicateDetectionService.ts`

Plus `normalizeItemNameForGrouping` (6th variant) in `hooks/useItems.ts`.

Unicode handling remains inconsistent — only `merchantTrustService.ts` correctly uses NFD normalization for Spanish accents.

**Fix:** Single `normalizeForMapping()` in a shared util with proper Unicode support.

---

## Finding 4: State Management Inconsistencies (P1 - High)

### 4a. Context vs Zustand Overlap

**5 React Contexts** managing pure client state (Zustand candidates):

| Context | State Type | Should Be |
|---------|-----------|-----------|
| `AuthContext` | Auth + Firebase refs | Context OK (provider pattern) |
| `ThemeContext` | Theme + mode | **Zustand** |
| `HistoryFiltersContext` | Filter state + dispatch | **Zustand** |
| `AppStateContext` | View navigation + scan state | **Zustand** |
| `NotificationContext` | In-app notifications | **Zustand** |
| `AnalyticsContext` | Temporal/category position | **Zustand** |

Note: `GroupFilterState` was removed from `HistoryFiltersContext` during shared-groups removal, but the Context itself remains. Additional feature-local contexts (`AnimationContext`, `CategoriesFeature`, `CreditFeature`) are appropriate where they are.

**Current Zustand stores (8):** `useModalStore`, `useScanStore` (946 lines!), `useBatchReviewStore`, `useTransactionEditorStore`, `useNavigationStore`, `useInsightStore`, `useSettingsStore`, plus their selectors.

### 4b-4c. Mixed Hooks and Misplaced Hooks

Unchanged from original analysis. Key examples:
- `useHistoryFilters.ts` (496 lines) — client UI state mixed with Firestore queries
- `useLearningPhases.ts` (507 lines) — UI phase state mixed with Firestore reads/writes
- 11+ feature-specific hooks in `src/hooks/` that should be in their feature modules

---

## Finding 5: Utils Sprawl (P1 - High)

### 5a. Feature-Specific Utils in Global Directory

Unchanged from original analysis. Key offenders: `sankeyDataBuilder.ts` (1,036 lines), `reportUtils.ts` (2,401 lines), `historyFilterUtils.ts` (1,075 lines).

### 5b. Naming Confusion — Updated

| File Pair | Issue | Status |
|-----------|-------|--------|
| `validation.ts` + `validationUtils.ts` | Two validation files | Still exists |
| `date.ts` + `dateHelpers.ts` | Two date util files | Still exists |
| ~~`sharingCooldown.ts` + `userSharingCooldown.ts`~~ | ~~Overlapping cooldown~~ | **RESOLVED** — deleted |
| `analyticsHelpers.ts` + `analyticsToHistoryFilters.ts` | Both analytics util files | Still exists |

### 5c. Data Files

- `translations.ts` — now 1,707 lines (was 2,201, 560+ group keys removed)
- `categoryColors.ts` — 1,379 lines (unchanged)
- `categoryTranslations.ts` — ~598 lines (unchanged)

---

## Finding 6: Component Organization (P1 - High)

### Large Components

| Component | Lines | Issue |
|-----------|-------|-------|
| `history/IconFilterBar.tsx` | 1,797 | 3 inline dropdowns — extract each |
| `analytics/SankeyChart.tsx` | 890 | Inline option building — extract to hook |
| `analytics/DrillDownGrid.tsx` | 807 | Data computation inline — extract to hook |
| `reports/ReportDetailOverlay.tsx` | 812 | Print logic inline — extract utility |
| `scan/QuickSaveCard.tsx` | 642 | Form logic inline — extract to hook |

### Mapping List Components — 4 Near-Identical UI Components (2,238 Lines)

| Component | Lines |
|-----------|-------|
| `CategoryMappingsList.tsx` | 632 |
| `SubcategoryMappingsList.tsx` | 581 |
| `ItemNameMappingsList.tsx` | 551 |
| `MerchantMappingsList.tsx` | 474 |

Each embeds DeleteConfirmModal (~160 lines) and EditModal (~180 lines) with identical ref management, focus trapping, escape handlers, scroll lock, and theme-aware styling.

**Fix:** Extract generic `MappingsList<T>` + `ConfirmDialog` + `EditDialog`. **~2,238 lines → ~400 lines.**

Note: A `ConfirmationDialog` component already exists in `src/components/batch/ConfirmationDialog.tsx` but is only used by `BatchCaptureUI`. It should be promoted to shared and reused.

### Confirmation Dialogs — Still Fragmented

- `ConfirmationDialog.tsx` exists in `components/batch/` (well-designed, supports destructive variant)
- `window.confirm()` still used in `useTransactionHandlers.ts` and `TrustedMerchantsList.tsx`
- Mapping list components each have their own inline modals

**Fix:** Promote `ConfirmationDialog` to `shared/components/`, replace `window.confirm()` and inline modals.

---

## Finding 7: Architecture Opportunities (P2)

Unchanged from original analysis:
- Missing feature barrel exports
- Query key fragmentation (inline key strings instead of `queryKeys.ts`)
- App.tsx at 2,069 lines is still a god component

---

## Finding 8: Data Access Layer — Repository Pattern (P0 - Strategic)

### The Problem

**46 files** import directly from `firebase/firestore` (was 72 before shared-groups removal). Still a significant coupling surface:
- 12 service files, 11 hook files, 8 type files, 6 view files, 4 component files, 3 app-level files, 2 context files

### Repositories Needed (Updated)

| Repository | Wraps | Current Files |
|-----------|-------|---------------|
| `TransactionRepository` | `firestore.ts` (all transaction CRUD + subscriptions) | 1 file, ~470 lines |
| `MappingRepository<T>` | All 4 mapping services (generic, parameterized) | 4 files → 1 generic |
| `MerchantTrustRepository` | `merchantTrustService.ts` | 1 file |
| `UserPreferencesRepository` | `userPreferencesService.ts` | 1 file (167 lines, 11 consumers) |
| `RecordsRepository` | `recordsService.ts` | 1 file (712 lines) |
| `AirlockRepository` | `airlockService.ts` | 1 file |
| `InsightProfileRepository` | `insightProfileService.ts` | 1 file |

**Total: ~7 interfaces + 7 Firestore implementations.** Same as original estimate.

### Impact Summary

| Aspect | Current (46 files) | With DAL (7-10 files) |
|--------|--------------------|-----------------------|
| Firebase SDK coupling | 46 files | 7-10 files (repository impls only) |
| Test mocking | Mock 15+ Firebase functions per test | Mock 1 repository interface |
| Collection path management | 10+ files with hardcoded paths | Centralized in repository impls |
| Backend migration | Touch 46+ files | Implement new repository class |

---

## Finding 9: Scattered Business Logic (P0 - Critical)

### 9a. Firestore Collection Paths — Magic Strings (Updated)

**~35 inline path constructions** across 10+ files (was 45+ before shared-groups removal). Shared-groups paths deleted, but all personal-data paths remain hardcoded.

### 9b. Currency Formatting — Worse Than Estimated

**56 occurrences** of hardcoded `'CLP'` across source files (original estimate was 13+). The constant is defined in at least 4 places: `types/settings.ts`, `userPreferencesService.ts`, `useSettingsStore.ts`, `useUserPreferences.ts`.

**Fix:** Single `DEFAULT_CURRENCY` constant + centralized `formatCurrency()`. Audit all 56 occurrences.

### 9c. Date/Period Calculations

Unchanged — 7+ files with overlapping logic, two different ISO week implementations.

### 9d. Batch Operation Chunking — BUG Still Present

Neither `recordsService.ts` (712 lines) nor `airlockService.ts` implement batch chunking. Both use `writeBatch()` + loop + single `batch.commit()`. No `BATCH_SIZE` constant, no chunking at 500 ops.

**This is a security/reliability violation per `.claude/rules/security.md`.**

### 9e. Transaction Validation — 11+ Files with Scattered Checks

Unchanged from original analysis.

### 9f. Error Handling — 37 Files with No Standard Pattern

Unchanged from original analysis.

### 9g. Input Sanitization

`sanitizeInput()` exists but is still underused. The shared-groups feature was actually the primary consumer — now even fewer files use it.

---

## Finding 10: Additional Repeated Patterns (P1 - High)

### 10a. Sorting Comparators — Worse Than Estimated

**132 inline `.sort()` calls across 43 files** (original estimate was 15+ patterns across 40+ files). Top offenders: `reportUtils.ts` (15), `DashboardView.tsx` (11), `TrendsView.tsx` (10), `transactionQuery.ts` (9), `useItems.ts` (9).

### 10b. Timestamp Conversion — 3 Approaches

Unchanged from original analysis.

### 10c. LocalStorage Access — 22 Files

**22 files** directly access `localStorage` (was 19 estimate). No centralized wrapper. Each reimplements try/catch + JSON.parse. None handle `QuotaExceededError`.

### 10d. Number Formatting

Unchanged — 22+ files with ad-hoc rounding.

### 10e. Copy-to-Clipboard — Resolved

The 2 shared-groups clipboard implementations (`ShareCodeDisplay`, `InviteMembersDialog`) were deleted. **No `navigator.clipboard` calls remain in `src/`.** This finding is resolved.

### 10f. Already Centralized (No Action Needed)

| Pattern | Centralized In | Status |
|---------|---------------|--------|
| Swipe/gestures | `useSwipeNavigation.ts` | OK |
| Animation tokens | `components/animation/constants.ts` | OK |
| Color/theming | CSS variables + ThemeContext | OK |
| Data export (CSV) | `csvExport.ts` (715 lines, RFC 4180) | OK |
| Loading states | TanStack Query `isLoading` | OK |
| Subscriptions | `useFirestoreSubscription.ts` hook | OK |
| Analytics tracking | `analyticsService.ts` (intentional stub) | OK |

---

## Recommended Refactor Roadmap — Epic 15

> This roadmap replaces the previous Epic 15 (Advanced Features) definition.
> Previous Epic 15 stories are deferred to Epic 19 (renumbered).

### Phase 0: Critical Bugs (Immediate — 2 stories, ~3 pts)

| Story | What | Risk | Impact |
|-------|------|------|--------|
| **15-0a** | Fix batch chunking in `recordsService.ts` and `airlockService.ts` | Low | Prevents silent data loss |
| **15-0b** | Audit `sanitizeInput()` coverage — add to all user input write paths | Low | Security hardening |

### Phase 1: Foundation — Dead Code + Shared Utilities (Low Risk — 7 stories, ~15 pts)

| Story | What | Lines Saved | Unblocks |
|-------|------|------------|----------|
| **15-1a** | Delete dead services (fcmToken 410, pushNotifications 182, transactionQuery 601) | ~1,193 | Clarity |
| **15-1b** | Centralize `PATHS` constant (collection path builder) | 35+ inline paths → 1 file | Path safety |
| **15-1c** | Extract `genericMappingService.ts` (parameterized by config) | ~580 | Service consistency |
| **15-1d** | Centralize `normalizeForMapping()` with Unicode NFD support | ~100 + bug fix | Data consistency |
| **15-1e** | Extract `baseDuplicateDetection.ts` with configurable comparator | ~300 | Algorithm consistency |
| **15-1f** | Extract `batchOperations.ts` with auto-chunking at 500 ops | ~50 + bug fix | Batch safety |
| **15-1g** | Consolidate `validation.ts` + `validationUtils.ts` | ~100 | Naming clarity |

### Phase 2: Business Logic Centralization (Low Risk — 8 stories, ~16 pts)

| Story | What | Files Affected |
|-------|------|---------------|
| **15-2a** | Consolidate currency formatting → `formatCurrency()` + `DEFAULT_CURRENCY` | 56 occurrences |
| **15-2b** | Consolidate date utilities → merge `date.ts` + `dateHelpers.ts` + `periodUtils.ts` | 7+ files |
| **15-2c** | Create `timestampUtils.ts` — unified `TimestampLike → Date/millis` | 12 files |
| **15-2d** | Create `transactionValidation.ts` with shared validation predicates | 11+ files |
| **15-2e** | Create `comparators.ts` — reusable typed sort comparators | 43 files, 132 calls |
| **15-2f** | Create `storage.ts` — typed localStorage wrapper with error handling | 22 files |
| **15-2g** | Create `numberFormat.ts` — `formatDecimal()`, `formatPercent()` | 22 files |
| **15-2h** | Standardize error handling → error code mapping + toast service | 37 files |

| **15-2i** | Integrate `errorHandler` into production catch blocks + tighten `classifyError` | 37 files |

#### Phase 2 Code Review Dev Notes (2026-02-09)

The following items were identified during Phase 2 code review and deferred to later phases:

- **15-2e (comparators):** Add `NumericKeys<T>` type constraint for compile-time safety when `byNumberDesc<T>()` is used. Apply when comparators are adopted in mega-views (Phase 5).
- **15-2g (numberFormat):** `roundTo(1.005, 2)` returns `1` not `1.01` due to IEEE 754 binary representation. Fix with multiply-before-round trick if needed — preserves current behavior, low priority. Apply during Phase 5 decomposition where heavy numeric logic is extracted.
- **15-2h (errorHandler):** `classifyError()` string matching is too broad for `'storage'` and `'disk'` keywords (false positives possible). Tighten patterns when integrating into production flows (story 15-2i).
- **Top-5 file migration not done:** TrendsView (10 sorts), DashboardView (11 sorts), reportUtils (14 sorts) were intentionally left unmigrated — these files are scheduled for decomposition in Phase 5 (15-5b, 15-5c) and feature extraction in Phase 4 (15-4d). Migrating now would mean touching files twice.

### Phase 3: Component Deduplication (Low Risk — 2 stories, ~5 pts)

| Story | What | Lines Saved |
|-------|------|------------|
| **15-3a** | Promote `ConfirmationDialog` to shared, replace `window.confirm()` + inline modals | ~500 |
| **15-3b** | Extract generic `MappingsList<T>` component (replaces 4 near-identical lists) | ~1,800 |

### Phase 4: Feature Modules (Medium Risk — 7 stories, ~14 pts)

| Story | What | Files Moved |
|-------|------|------------|
| **15-4a** | Create `features/analytics/` module | ~15 files |
| **15-4b** | Create `features/history/` module | ~10 files |
| **15-4c** | Create `features/insights/` module | ~12 files |
| **15-4d** | Create `features/reports/` module | ~8 files |
| **15-4e** | Create `features/dashboard/` module | ~5 files |
| **15-4f** | Create `features/settings/` module | ~5 files |
| **15-4g** | Move feature-specific hooks to their feature modules + barrel exports | ~15 hooks |

> **Dev Note (15-4d):** When creating `features/reports/`, migrate `reportUtils.ts` 14 inline sorts to use `comparators.ts` imports.

### Phase 5: Mega-View Decomposition (Higher Risk — 6 stories, ~18 pts)

| Story | What | Lines Before → After |
|-------|------|---------------------|
| **15-5a** | Extract shared `categoryAggregation.ts` (TrendsView + DashboardView) | ~400 duplicated → 200 shared |
| **15-5b** | Decompose TrendsView.tsx | 5,901 → 800 + sub-files |
| **15-5c** | Decompose DashboardView.tsx | 3,412 → 800 + sub-files |
| **15-5d** | Decompose TransactionEditorViewInternal.tsx | 2,721 → 800 + sub-files |
| **15-5e** | Decompose IconFilterBar.tsx | 1,797 → 200 + dropdown files |
| **15-5f** | Decompose App.tsx | 2,069 → 800 + feature roots |

> **Dev Notes (15-5b, 15-5c):**
> - Migrate inline sorts to `comparators.ts` during decomposition (TrendsView: 10 sorts, DashboardView: 11 sorts).
> - Add `NumericKeys<T>` type constraint to comparator generics if type inference is insufficient for extracted sub-components.
> - Consider `roundTo` IEEE 754 fix (multiply-before-round) if numeric precision surfaces during testing of extracted calculation modules.

### Phase 6: Data Access Layer (Medium Risk — 3 stories, ~8 pts)

| Story | What | Impact |
|-------|------|--------|
| **15-6a** | Define repository interfaces (7 interfaces: Transaction, Mapping, Trust, Preferences, Records, Airlock, InsightProfile) | Contract definition |
| **15-6b** | Implement Firestore repository classes (wrap existing services, no behavior change) | 46 → 7-10 Firebase imports |
| **15-6c** | Migrate consumers to repository pattern (hooks, views) | Test simplification |

### Phase 7: State Management Alignment (Medium Risk — 4 stories, ~8 pts)

| Story | What | Impact |
|-------|------|--------|
| **15-7a** | Migrate `HistoryFiltersContext` → Zustand store | Enable selectors |
| **15-7b** | Migrate `AppStateContext` → Zustand store | Centralize app state |
| **15-7c** | Migrate `ThemeContext` → Zustand store | Reduce provider nesting |
| **15-7d** | Separate client/server state in mixed hooks | ECC compliance |

> **Dev Notes (15-7b):**
> - **Toast convergence:** Two independent toast providers exist — `useToast` hook (used by views) and `AppStateContext.toastMessage` (legacy). When migrating `AppStateContext` → Zustand, unify into a single toast store. Both now support `error`/`warning` types with 2x auto-dismiss.
> - **CSS variable alignment:** Toast error/warning colors are hardcoded hex (`#ef4444`, `#f59e0b`) while success/info use CSS vars (`--primary`, `--accent`). Define `--error` and `--warning` CSS variables in the design system and use them in `Toast.tsx` for theme consistency.

---

## Epic 15 Summary

| Phase | Stories | Est. Points | Risk | Dependency |
|-------|---------|-------------|------|------------|
| **Phase 0: Bugs** | 2 | 3 | Low | None |
| **Phase 1: Foundation** | 7 | 15 | Low | None |
| **Phase 2: Business Logic** | 9 | 19 | Low | Phase 1 |
| **Phase 3: Components** | 2 | 5 | Low | Phase 1c (generic mapping) |
| **Phase 4: Feature Modules** | 7 | 14 | Medium | Phase 2 |
| **Phase 5: Mega-Views** | 6 | 18 | Higher | Phase 4 |
| **Phase 6: DAL** | 3 | 8 | Medium | Phase 1b (PATHS) |
| **Phase 7: State Mgmt** | 4 | 8 | Medium | Phase 4 |
| **Total** | **40** | **~90** | — | — |

### Phase Dependencies (Execution Order)

```
Phase 0 (bugs) ──────────────────────────────────────────────→ anytime
Phase 1 (foundation) ──→ Phase 2 (business logic) ──→ Phase 4 (features) ──→ Phase 5 (mega-views)
Phase 1b (PATHS) ───────────────────────────────────────────→ Phase 6 (DAL)
Phase 1c (mapping svc) ─→ Phase 3 (components)
Phase 4 (features) ─────────────────────────────────────────→ Phase 7 (state)
```

Phases 0, 1, 2, 3 can proceed largely in parallel. Phases 4-7 depend on earlier phases but can overlap where dependencies allow.

### Suggested Sprint Breakdown

| Sprint | Phases | Duration | Focus |
|--------|--------|----------|-------|
| Sprint 15.1 | Phase 0 + Phase 1 | 1 week | Bug fixes + dead code + shared utilities |
| Sprint 15.2 | Phase 2 + Phase 3 | 1 week | Business logic centralization + component dedup |
| Sprint 15.3 | Phase 4 + Phase 6 | 1-2 weeks | Feature modules + DAL |
| Sprint 15.4 | Phase 5 + Phase 7 | 2 weeks | Mega-view decomposition + state migration |

---

## Impact Assessment (Current → Target)

| Metric | Current | After Refactor |
|--------|---------|----------------|
| Files over 800 lines | 14 | 0 (target) |
| Files over 500 lines | 35 | <10 |
| Feature modules | 5 | 12+ |
| Firebase SDK imports | 46 files | 7-10 files (DAL only) |
| Duplicated service code | ~1,570 lines (mapping + detection) | ~250 lines |
| Duplicated UI components | ~2,238 lines (4 mapping lists) | ~400 lines (1 generic) |
| Dead code | ~1,193 lines | 0 |
| Max file size | 5,901 lines | ~800 lines |
| Normalization functions | 15 (5 copies of `normalizeItemName`) | 1 shared function |
| Currency formatters | 56 occurrences of hardcoded 'CLP' | 1 centralized constant |
| Date/period implementations | 7+ files (2 ISO week) | 2 consolidated files |
| Timestamp conversion | 3 approaches, 12 files | 1 `timestampUtils.ts` |
| Sorting comparators | 132 inline calls across 43 files | 1 `comparators.ts` |
| Batch chunking compliance | 5/7 services | 7/7 (all via utility) |
| Collection path management | 10+ files, ~35 inline | 1 centralized `PATHS` |
| Input sanitization coverage | <6 files | All write paths (via DAL) |
| LocalStorage access | 22 files, manual JSON parse | 1 `storage.ts` wrapper |
| Confirmation dialogs | 6+ implementations (inline + window.confirm) | 1 shared `ConfirmDialog` |
| Number formatting | 22 files, ad-hoc rounding | 1 `numberFormat.ts` |
| Context providers (client state) | 5 | 1 (AuthContext) |
| Zustand stores | 8 | 12+ |
| Test mock complexity | 15+ Firebase fns/test | 1 repository interface |

**Total estimated lines saved/consolidated: ~6,000-8,000 lines**

---

## Tooling Notes

### ast-grep (Integrated 2026-02-08)

ast-grep MCP server configured (`.mcp.json`). Key refactoring queries pre-built in `.claude/skills/ast-grep/SKILL.md`:
- Firebase direct imports (46 files) — Phase 6 DAL migration
- Inline sort comparators (43 files) — Phase 2 15-2e
- Manual localStorage JSON.parse (22 files) — Phase 2 15-2f
- Batch.commit() without chunking (bug detection) — Phase 0
- Hardcoded 'CLP' currency (56 occurrences) — Phase 2 15-2a
- Firestore collection path magic strings (~35 locations) — Phase 1 15-1b

### code-structure-plugin (Deferred — Install for Phase 5)

[eran-broder/code-structure-plugin](https://github.com/eran-broder/code-structure-plugin) — token-efficient structural skeletons. Install when starting Phase 5 (Mega-View Decomposition) for:
- 15-5b: TrendsView decomposition (114 hooks, 15+ inline components)
- 15-5c: DashboardView decomposition (72 hooks)
- 15-5d: TransactionEditorViewInternal decomposition (60 hooks)
- 15-5e: IconFilterBar decomposition (3 inline dropdowns)

---

## Risk Notes

1. **TrendsView/DashboardView refactor** (Phase 5) is highest risk — most-used views, require comprehensive test coverage first.
2. **DAL introduction** (Phase 6) is medium risk — wrapping existing code with no behavior change. Can be incremental.
3. **Business logic centralization** (Phase 2) is low risk — creating shared utilities, migrating callers incrementally. Each story independent.
4. **Mapping list extraction** (Phase 3) is low risk — 4 components with slight UI variations need parameterization.
5. **Feature module creation** (Phase 4) is mostly file moves with import rewiring — lower risk but tedious. Use ast-grep + `npx vitest run` after each move.
6. **State management migration** (Phase 7) requires careful testing — contexts propagate differently than stores.
7. **Dead service deletion** (Phase 1) — `fcmTokenService` and `pushNotifications` verified to have 0 imports in `src/`. Also verify no Cloud Function references before deleting.
8. **Batch chunking fix** (Phase 0) is critical and should be done immediately — it's a silent data loss bug.

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-07 | Initial analysis created |
| 2026-02-09 | Updated post shared-groups removal: revised all metrics, removed resolved findings (cooldown utils, dead services already deleted, clipboard, GroupFilterState), updated file counts, restructured roadmap as Epic 15 with story IDs and sprint breakdown, verified dead services with import analysis |
| 2026-02-09 | Phase 2 code review dev notes: added dev notes to stories 15-4d, 15-5b, 15-5c, 15-7b. Created story 15-2i (errorHandler integration + classifyError tightening). Total: 40 stories, ~90 pts |
