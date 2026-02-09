# Codebase Refactor Analysis

> **Date:** 2026-02-07
> **Scope:** Full codebase excluding `src/features/shared-groups/`
> **Status:** ANALYSIS ONLY - No code changes

---

## Executive Summary

The codebase has **23 files exceeding the 800-line ECC limit** (max should be 800, strictest at 500+ warning). The top 3 files alone total **12,184 lines** (TrendsView 5960, DashboardView 3473, TransactionEditorViewInternal 2751). Feature-Sliced Design is declared but only ~30% adopted — most domain logic lives in flat `src/services/`, `src/hooks/`, `src/utils/`, and `src/components/` directories rather than feature modules.

**Key numbers:**
- **23 files over 800 lines** (ECC max)
- **~1,500 lines of duplicated service code** (mapping services, duplicate detection)
- **15+ views with no feature module** (only 5 features exist for 20+ views)
- **6 contexts** where Zustand stores should handle client state
- **4 dead/unused services** (changelogService, fcmTokenService, pushNotifications, transactionQuery)
- **5 normalization functions** with inconsistent Unicode handling (accent bug in Spanish)

---

## Finding 1: Mega-Views (P0 - Critical)

### The Problem
View files are monolithic — each combines data fetching, aggregation, state management, event handlers, and JSX rendering in a single file. This violates both ECC file-size conventions and the single-responsibility principle.

### Files Over 800 Lines (Excluding shared-groups)

| File | Lines | Hooks | Priority |
|------|-------|-------|----------|
| `views/TrendsView.tsx` | **5,960** | 114 | P0 |
| `views/DashboardView.tsx` | **3,473** | 72 | P0 |
| `views/TransactionEditorViewInternal.tsx` | **2,751** | 60 | P0 |
| `utils/reportUtils.ts` | **2,401** | - | P0 |
| `utils/translations.ts` | **2,201** | - | P2 (data) |
| `App.tsx` | **2,176** | 30+ | P1 |
| `components/history/IconFilterBar.tsx` | **2,032** | 15+ | P0 |
| `views/EditView.tsx` | **1,810** | 19 | P1 |
| `views/ScanResultView.tsx` | **1,554** | 20+ | P1 |
| `config/categoryColors.ts` | **1,379** | - | P2 (data) |
| `views/HistoryView.tsx` | **1,215** | 15+ | P2 |
| `utils/historyFilterUtils.ts` | **1,106** | - | P1 |
| `utils/sankeyDataBuilder.ts` | **1,036** | - | P1 |
| `views/ItemsView/ItemsView.tsx` | **1,006** | 18 | P2 |
| `hooks/app/useScanHandlers.ts` | **962** | - | P1 |
| `features/scan/store/useScanStore.ts` | **946** | - | P1 |
| `components/analytics/SankeyChart.tsx` | **890** | 10+ | P1 |
| `components/reports/ReportDetailOverlay.tsx` | **812** | 5+ | P2 |
| `services/locationService.ts` | **810** | - | P2 |
| `components/analytics/DrillDownGrid.tsx` | **807** | 5+ | P2 |
| `services/pendingScanStorage.ts` | **803** | - | P2 |
| `views/BatchCaptureView.tsx` | **798** | 12 | P2 |
| `services/invitationService.ts` | **782** | - | P1 |

### Decomposition Strategy: TrendsView (5,960 lines → ~6 files)

TrendsView has **114 hook calls** and **15+ inline sub-components**. Recommended split:

```
src/features/analytics/          ← NEW feature module
├── views/TrendsView.tsx         (800 lines - orchestration only)
├── hooks/
│   ├── useTrendsAggregation.ts  (extract all useMemo aggregation blocks)
│   ├── useTrendsFilters.ts      (drill-down state + filter application)
│   └── useTrendsAnimation.ts    (carousel, swipe, animation keys)
├── utils/
│   ├── categoryAggregation.ts   (SHARED: "Más" grouping, threshold logic)
│   ├── trendsPeriod.ts          (period navigation, comparison)
│   └── sankeyDataBuilder.ts     (move from src/utils/)
└── components/
    ├── TrendsCarousel.tsx       (slide navigation + period selector)
    ├── TrendsTreemap.tsx        (treemap grid with responsive cells)
    ├── TrendsDonut.tsx          (donut chart section)
    └── TrendsSankey.tsx         (Sankey wrapper with mode toggles)
```

**Critical shared code**: `categoryAggregation.ts` — identical "Más" aggregation logic (>10% threshold, Set-based unique counting, overflow grouping) is **duplicated between TrendsView and DashboardView**. Extract once, share.

### Decomposition Strategy: DashboardView (3,473 lines → ~5 files)

```
src/features/dashboard/          ← NEW feature module
├── views/DashboardView.tsx      (800 lines - orchestration)
├── components/
│   ├── DashboardTreemap.tsx     (treemap rendering + view mode toggle)
│   ├── DashboardRecents.tsx     (transaction list + date grouping)
│   └── DashboardMonthNav.tsx    (month/year navigation)
├── hooks/
│   └── useDashboardSelection.ts (selection mode, batch operations)
└── utils/                       (imports from analytics/utils/categoryAggregation.ts)
```

### Decomposition Strategy: TransactionEditorViewInternal (2,751 lines → ~5 files)

```
src/features/transaction-editor/  ← EXISTS but needs expansion
├── hooks/
│   ├── useItemOperations.ts     (add/update/delete items - SHARED with EditView)
│   ├── useLearningPromptChain.ts (category/subcategory/merchant learning sequence)
│   └── useItemNameSuggestions.ts (approval handler)
├── components/
│   ├── ItemEditor.tsx           (item list rendering + inline editing)
│   ├── LearningPrompts.tsx      (learning prompt rendering)
│   └── ScanStateSection.tsx     (processing overlay)
└── views/
    └── TransactionEditorViewInternal.tsx (800 lines - orchestration)
```

### Decomposition Strategy: IconFilterBar (2,032 lines)

This component has **4 complete dropdown implementations** inline (time, category, location, custom groups). Each dropdown should be its own component:

```
src/components/history/
├── IconFilterBar.tsx            (200 lines - toolbar shell)
├── TemporalFilterDropdown.tsx   (time navigation)
├── CategoryFilterDropdown.tsx   (EXISTS - but IconFilterBar has its own version!)
├── LocationFilterDropdown.tsx   (country/region filters)
└── GroupFilterDropdown.tsx      (custom group filters)
```

---

## Finding 2: Feature-Sliced Design Violation (P0 - Critical)

### The Problem

The architecture doc says "Feature-Sliced Design" but only **5 features** exist for **20+ views**:

| Existing Feature | Has Services | Has Hooks | Has Components | Has Store |
|-----------------|-------------|-----------|----------------|-----------|
| `batch-review` | No | Yes | No | No |
| `categories` | No | No | Yes | No |
| `credit` | No | No | Yes | No |
| `scan` | No | Yes | Yes | Yes |
| `transaction-editor` | No | No | No | No |

**Missing feature modules** (currently scattered across flat directories):

| Should Be Feature | Current Location | Lines Scattered |
|-------------------|-----------------|-----------------|
| `analytics` / `trends` | `views/TrendsView` + `components/analytics/*` + `utils/sankey*,chart*,period*` | ~9,000 |
| `dashboard` | `views/DashboardView` + `components/DashboardView/*` | ~4,000 |
| `history` | `views/HistoryView` + `components/history/*` + `utils/historyFilter*` | ~5,000 |
| `insights` | `views/InsightsView` + `components/insights/*` + `services/insight*` | ~3,000 |
| `reports` | `views/ReportsView` + `components/reports/*` + `utils/reportUtils` | ~4,000 |
| `settings` | `views/SettingsView/*` + `components/settings/*` | ~2,500 |
| `items` | `views/ItemsView/*` | ~1,500 |

### Components That Belong in Features

These `src/components/` subdirectories should be feature-internal:

| Component Dir | Should Be In | Files |
|--------------|-------------|-------|
| `components/analytics/` (13 files) | `features/analytics/components/` | SankeyChart, DrillDownGrid, etc. |
| `components/history/` (15 files) | `features/history/components/` | IconFilterBar, FilterChips, etc. |
| `components/scan/` (9 files) | `features/scan/components/` (already exists but scan components are split!) |
| `components/batch/` (8 files) | `features/batch-review/components/` |
| `components/reports/` (10 files) | `features/reports/components/` |
| `components/insights/` (19 files) | `features/insights/components/` |
| `components/settings/` (5+ files) | `features/settings/components/` |

### Services That Belong in Features

Cross-import analysis shows these services are used by only **1 domain**:

| Service (src/services/) | Used By | Move To |
|------------------------|---------|---------|
| `airlockService.ts` | hooks only | `features/insights/services/` |
| `analyticsService.ts` | components only | `features/analytics/services/` |
| `insightProfileService.ts` | hooks only | `features/insights/services/` |
| `invitationService.ts` | hooks only | `features/shared-groups/services/` |
| `itemDuplicateDetectionService.ts` | views only | `features/history/services/` or shared |
| `merchantMatcherService.ts` | hooks only | shared service (OK) |
| `merchantTrustService.ts` | hooks only | shared service (OK) |
| `recordsService.ts` | hooks only | `features/insights/services/` |
| `subcategoryMappingService.ts` | hooks only | shared (mapping pattern) |

### Dead Services (0 external importers)

- `changelogService.ts` — **unused**, candidate for deletion
- `fcmTokenService.ts` — **unused**, candidate for deletion
- `pushNotifications.ts` — **unused**, candidate for deletion
- `transactionQuery.ts` — **unused**, candidate for deletion

---

## Finding 3: Duplicated Service Patterns (P0 - Critical)

### 3a. Four Mapping Services — Copy-Paste Pattern

These four services implement **identical CRUD logic** with only the collection name varying:

| Service | Lines | Collection |
|---------|-------|-----------|
| `categoryMappingService.ts` | 200 | `category_mappings` |
| `merchantMappingService.ts` | 200 | `merchant_mappings` |
| `subcategoryMappingService.ts` | 199 | `subcategory_mappings` |
| `itemNameMappingService.ts` | 232 | `item_name_mappings` |

**Identical in all four:**
- `getMappingsCollectionPath()` — only collection name differs
- `save<X>Mapping()` — query for existing + upsert pattern
- `subscribeTo<X>Mappings()` — onSnapshot with orderBy/limit
- `increment<X>MappingUsage()` — updateDoc with increment(1)
- `normalize<X>Name()` — same regex chain

**Fix:** Create `genericMappingService.ts` parameterized by config. Reduces **~800 lines to ~200**.

### 3b. Two Duplicate Detection Services — Duplicated Algorithm

| Service | Lines | Domain |
|---------|-------|--------|
| `duplicateDetectionService.ts` | 369 | Transactions |
| `itemDuplicateDetectionService.ts` | 375 | Items |

Both implement the same:
- Group-by-key algorithm
- Pairwise comparison within groups
- Union-Find grouping for transitive duplicates
- Identical filtering/counting utilities

Only the **matching criteria** differs. **Fix:** Extract `baseDuplicateDetection.ts` with configurable comparator. Saves **~250 lines**.

### 3c. Normalization Inconsistency (Bug)

Five normalization functions across the codebase, but only one handles Unicode correctly:

```typescript
// merchantTrustService.ts - CORRECT (handles Spanish accents):
name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// categoryMappingService.ts - INCOMPLETE (no Unicode normalization):
name.toLowerCase().trim().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ')
```

**Impact:** In Spanish (primary language), "Café" and "Cafe" are treated as different merchants in mapping services but correctly deduplicated in trust service. This is a **data consistency bug**.

**Fix:** Single `normalizeForMapping()` in a shared util.

---

## Finding 4: State Management Inconsistencies (P1 - High)

### 4a. Context vs Zustand Overlap

The project declares "Zustand for client state" but has **6 React Contexts** managing client state:

| Context | State Type | Should Be |
|---------|-----------|-----------|
| `AuthContext` | Auth + Firebase refs | Context OK (provider pattern) |
| `ThemeContext` | Theme + mode | **Zustand** (pure client state) |
| `HistoryFiltersContext` | Filter state + dispatch | **Zustand** (pure client state) |
| `AppStateContext` | View navigation + scan state | **Zustand** (pure client state) |
| `NotificationContext` | In-app notifications | **Zustand** (pure client state) |
| `AnalyticsContext` | Temporal/category position | **Zustand** (pure client state) |

`AuthContext` is correctly a Context (provides Firebase instances down the tree). The other 5 could be Zustand stores, reducing provider nesting and enabling selectors for performance.

### 4b. Hooks Mixing Client and Server State

Several hooks in `src/hooks/` combine client-side UI state with Firestore data fetching in a single hook. ECC convention: separate client state (Zustand) from server state (TanStack Query).

Examples:
- `useHistoryFilters.ts` (496 lines) — manages filter UI state AND triggers Firestore queries
- `useLearningPhases.ts` (507 lines) — tracks UI phase state AND reads/writes Firestore
- `useActiveTransaction.ts` (480 lines) — manages form state AND persists to Firestore

### 4c. Misplaced Hooks

Hooks in `src/hooks/` that are feature-specific:

| Hook | Feature | Lines |
|------|---------|-------|
| `useBatchCapture.ts` | batch-review | 356 |
| `useBatchProcessing.ts` | batch-review | 365 |
| `useBatchReview.ts` | batch-review | 478 |
| `useBatchSession.ts` | batch-review | 82 |
| `useScanState.ts` | scan | 211 |
| `useScanOverlayState.ts` | scan | 175 |
| `useCategoryStatistics.ts` | analytics | 378 |
| `useAnalyticsTransactions.ts` | analytics | 350 |
| `useInsightProfile.ts` | insights | 220 |
| `useInAppNotifications.ts` | insights | 205 |
| `usePaginatedTransactions.ts` | history | 395 |

These should move into their respective `features/*/hooks/` directories.

---

## Finding 5: Utils Sprawl (P1 - High)

### 5a. Feature-Specific Utils in Global Directory

| Util | Only Used By | Lines |
|------|-------------|-------|
| `sankeyDataBuilder.ts` | TrendsView/SankeyChart | 1,036 |
| `chartDataComputation.ts` | TrendsView | ~400 |
| `chartModeRegistry.ts` | TrendsView | ~300 |
| `periodComparison.ts` | TrendsView | ~400 |
| `reportUtils.ts` | ReportsView | 2,401 |
| `historyFilterUtils.ts` | HistoryView/IconFilterBar | 1,106 |
| `insightGenerators.ts` | InsightsView | 720 |
| `csvExport.ts` | Multiple (OK to stay) | 714 |

### 5b. Naming Confusion — Duplicate-Named Files

| File Pair | Issue |
|-----------|-------|
| `validation.ts` + `validationUtils.ts` | Two validation files — consolidate |
| `date.ts` + `dateHelpers.ts` | Two date util files — consolidate |
| `sharingCooldown.ts` + `userSharingCooldown.ts` | Overlapping cooldown logic |
| `analyticsHelpers.ts` + `analyticsToHistoryFilters.ts` | Both analytics util files |

### 5c. Data Files Bloating Utils

These are **data/config files**, not utilities:
- `translations.ts` (2,201 lines) — string dictionary, OK but consider splitting by feature
- `categoryColors.ts` (1,379 lines) — color constants
- `categoryTranslations.ts` (598 lines) — category name translations

---

## Finding 6: Component Organization (P1 - High)

### Large Components

| Component | Lines | Issue |
|-----------|-------|-------|
| `history/IconFilterBar.tsx` | 2,032 | 4 inline dropdowns — extract each |
| `analytics/SankeyChart.tsx` | 890 | Inline option building — extract to hook |
| `analytics/DrillDownGrid.tsx` | 807 | Data computation inline — extract to hook |
| `reports/ReportDetailOverlay.tsx` | 812 | Print logic inline — extract utility |
| `scan/QuickSaveCard.tsx` | 674 | Form logic inline — extract to hook |

### Shared Components That Aren't Shared

`CategoryMappingsList.tsx`, `MerchantMappingsList.tsx`, `SubcategoryMappingsList.tsx`, `ItemNameMappingsList.tsx` — four **nearly identical list components** (same pattern as the services). These should use a `GenericMappingsList` component.

---

## Finding 7: Architecture Opportunities (P2)

### 7a. Missing Feature Barrel Exports

Features that exist don't consistently export through barrel files:
- `features/batch-review/` — has hooks barrel but no top-level barrel
- `features/scan/` — has component and hook barrels
- `features/categories/` — minimal
- `features/credit/` — minimal
- `features/transaction-editor/` — has views but no hooks/services

### 7b. Query Key Fragmentation

`src/lib/queryKeys.ts` defines keys, but some hooks use inline key strings instead:
- Inconsistent cache invalidation
- Harder to trace data dependencies

### 7c. App.tsx God Component

At 2,176 lines, `App.tsx` is the orchestration hub. It's partially decomposed (`useTransactionHandlers`, `useScanHandlers`, etc.) but still does too much:
- View routing
- Handler delegation
- Feature orchestration
- Provider nesting
- Service initialization

---

## Finding 8: Data Access Layer — Repository Pattern (P0 - Strategic)

### The Problem

**72 files** import directly from `firebase/firestore`. The Firebase SDK is not just the database driver — it's woven into business logic, hooks, and views. This creates:

- **Tight coupling**: Every service, hook, and view that touches data knows Firestore internals (collection paths, `serverTimestamp()`, `increment()`, query builders)
- **Test complexity**: Tests must mock 15+ Firebase SDK functions per test file instead of one repository interface
- **Migration lock-in**: Moving to any other backend (API layer, Supabase, etc.) requires rewriting all 72 files

### Current Pattern (Direct SDK Coupling)

```typescript
// firestore.ts — business logic mixed with Firestore SDK
import { collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';

export async function addTransaction(db: Firestore, userId: string, appId: string, tx) {
    const periods = tx.date ? computePeriods(tx.date) : undefined;
    const docRef = await addDoc(
        collection(db, 'artifacts', appId, 'users', userId, 'transactions'),  // SDK call
        { ...cleanedTx, createdAt: serverTimestamp(), version: 1, ...periods } // SDK types
    );
    return docRef.id;
}
```

Every consumer must import Firebase types and pass the `db` instance. The collection path `artifacts/{appId}/users/{userId}/transactions` is hardcoded in 12+ service files (see Finding 9a).

### Proposed Pattern (Repository Interface)

```typescript
// src/repositories/TransactionRepository.ts — THE CONTRACT (no Firebase imports)
interface TransactionRepository {
    add(userId: string, appId: string, tx: CreateTransactionInput): Promise<string>;
    update(userId: string, appId: string, id: string, data: Partial<Transaction>): Promise<void>;
    delete(userId: string, appId: string, id: string): Promise<void>;
    subscribe(userId: string, appId: string, cb: (txs: Transaction[]) => void): Unsubscribe;
    subscribeRecentScans(userId: string, appId: string, cb: (txs: Transaction[]) => void): Unsubscribe;
    getPage(userId: string, appId: string, cursor?: string, limit?: number): Promise<TransactionPage>;
    batchDelete(userId: string, appId: string, ids: string[]): Promise<void>;
    wipeAll(userId: string, appId: string): Promise<void>;
}
```

```typescript
// src/repositories/firestore/FirestoreTransactionRepository.ts — THE IMPLEMENTATION
class FirestoreTransactionRepository implements TransactionRepository {
    constructor(private db: Firestore, private appId: string) {}

    async add(userId, appId, tx) {
        // Exact same logic from firestore.ts:addTransaction() — just wrapped
        const cleaned = removeUndefined(tx);
        const periods = tx.date ? computePeriods(tx.date) : undefined;
        return (await addDoc(
            collection(this.db, ...PATHS.transactions(appId, userId)),
            { ...cleaned, createdAt: serverTimestamp(), version: 1, ...(periods && { periods }) }
        )).id;
    }
}
```

### What Changes for Consumers

```typescript
// BEFORE: Hook imports Firebase + service function
import { subscribeToTransactions } from '@/services/firestore';
import { Firestore } from 'firebase/firestore';

function useTransactions(db: Firestore, userId: string, appId: string) {
    // Must know about Firestore type, pass db instance
    return useFirestoreSubscription(['transactions'], (cb) => subscribeToTransactions(db, userId, appId, cb));
}

// AFTER: Hook imports repository interface only
import { useTransactionRepo } from '@/repositories';

function useTransactions(userId: string, appId: string) {
    const repo = useTransactionRepo(); // Injected via context/factory
    return useFirestoreSubscription(['transactions'], (cb) => repo.subscribe(userId, appId, cb));
}
```

### Repositories Needed

| Repository | Wraps | Current Files |
|-----------|-------|---------------|
| `TransactionRepository` | `firestore.ts` (all transaction CRUD + subscriptions) | 1 file, ~470 lines |
| `MappingRepository<T>` | All 4 mapping services (generic, parameterized) | 4 files → 1 generic |
| `MerchantTrustRepository` | `merchantTrustService.ts` | 1 file |
| `UserPreferencesRepository` | `userPreferencesService.ts` | 1 file |
| `RecordsRepository` | `recordsService.ts` | 1 file |
| `AirlockRepository` | `airlockService.ts` | 1 file |
| `InsightProfileRepository` | `insightProfileService.ts` | 1 file |

**Total: ~7 interfaces + 7 Firestore implementations.** The generic `MappingRepository<T>` replaces 4 nearly identical services (see Finding 3a).

### Impact Summary

| Aspect | Without DAL | With DAL |
|--------|-------------|----------|
| Firebase SDK imports | 72 files | 7-10 files (repository impls only) |
| Test mocking | Mock 15+ Firebase functions per test | Mock 1 repository interface |
| Collection path management | 12 files with hardcoded paths | Centralized in repository impls |
| Backend migration effort | Touch 72+ files | Implement new repository class |
| Cost to implement | — | ~1-2 days during Phase 1 refactor |
| Behavior change | — | None — same code, reorganized |

### Analogy

This is the same pattern as mainframe access methods (VSAM, QSAM, BDAM): one layer owns the I/O contract, consumers just call the interface. The physical storage mechanism (Firestore today, API tomorrow) is an implementation detail hidden behind the contract.

---

## Finding 9: Scattered Business Logic (P0 - Critical)

### 9a. Firestore Collection Paths — Magic Strings in 12+ Files

Every service builds its own collection path with hardcoded template literals:

| Service | Path Pattern |
|---------|-------------|
| `firestore.ts` (6 locations) | `artifacts/${appId}/users/${userId}/transactions` |
| `categoryMappingService.ts` | `artifacts/${appId}/users/${userId}/category_mappings` |
| `merchantMappingService.ts` | `artifacts/${appId}/users/${userId}/merchant_mappings` |
| `subcategoryMappingService.ts` | `artifacts/${appId}/users/${userId}/subcategory_mappings` |
| `itemNameMappingService.ts` | `artifacts/${appId}/users/${userId}/item_name_mappings` |
| `merchantTrustService.ts` | `artifacts/${appId}/users/${userId}/trusted_merchants` |
| `airlockService.ts` | `artifacts/${appId}/users/${userId}/airlocks` |
| `recordsService.ts` | `artifacts/${appId}/users/${userId}/personalRecords` |
| `userPreferencesService.ts` | `artifacts/${appId}/users/${userId}/preferences/settings` |
| `fcmTokenService.ts` | `artifacts/${appId}/users/${userId}/fcmTokens` |
| `migrateCreatedAt.ts` | `artifacts/${appId}/users/${userId}/transactions` |

**45+ inline path constructions** across 12 files. A typo in any of these causes a runtime error with no compile-time safety.

**Fix:** Centralize in `src/repositories/paths.ts` (or as part of the DAL):
```typescript
export const PATHS = {
    transactions: (appId: string, userId: string) => ['artifacts', appId, 'users', userId, 'transactions'],
    mappings: (appId: string, userId: string, type: string) => ['artifacts', appId, 'users', userId, type],
    // ...
};
```

### 9b. Currency Formatting — 5 Implementations, 13+ Hardcoded Defaults

| Location | Implementation | Default |
|----------|---------------|---------|
| `utils/currency.ts:16-33` | `Intl.NumberFormat` with cents conversion | `'CLP'` |
| `types/report.ts:194-196` | `toLocaleString('es-CL')` hardcoded | `'CLP'` |
| `components/analytics/DrillDownCard.tsx:71` | Local `formatCurrency()` | `'CLP'` |
| `features/shared-groups/.../SharedGroupTotalCard.tsx:58` | `formatAmount()` | `'CLP'` |
| `features/shared-groups/.../MemberContributionChart.tsx:77` | `formatAmount()` | `'CLP'` |

The string `'CLP'` appears as a hardcoded default in **13+ files** instead of coming from a centralized constant or user preference.

**Fix:** Single `formatCurrency()` in `utils/currency.ts` (already exists but underused). Add `DEFAULT_CURRENCY` constant. Audit all 13+ files to use the centralized version.

### 9c. Date/Period Calculations — 7+ Files with Overlapping Logic

| File | What It Contains |
|------|-----------------|
| `utils/date.ts` | `formatDate()` for LatAm/US, quarter/week utilities |
| `utils/periodUtils.ts` | `computePeriods()`, ISO week calc, date parsing (194 lines) |
| `utils/dateHelpers.ts` | `getISOWeekNumber()` — **different implementation** from `periodUtils.ts` |
| `utils/historyFilterUtils.ts:158-200` | `getQuarterFromMonth()`, `getMonthsInQuarter()`, `getWeekOfMonth()` |
| `types/report.ts:204` | `formatDateRange()` |
| `utils/csvExport.ts:136` | `formatDateForCSV()` |
| `utils/reportUtils.ts:1467` | `formatWeekDateRange()` |

ISO week calculation is implemented **twice** with different algorithms (`periodUtils.ts` vs `dateHelpers.ts`). **97+ scattered calls** to `toLocaleDateString` across views with inconsistent locale handling.

**Fix:** Consolidate into `utils/date.ts` (keep one) + `utils/periodUtils.ts` (keep one). Delete `dateHelpers.ts`. Move feature-specific formatters to their feature modules.

### 9d. Batch Operation Chunking — 2 Services Missing Required Safety (BUG)

Per CLAUDE.md security rules: _"Firestore batch operations MUST chunk at 500 ops (silent failure otherwise)."_

| Service | Chunking? | Status |
|---------|-----------|--------|
| `firestore.ts` (3 batch operations) | Yes (`BATCH_SIZE = 500`) | OK |
| `fcmTokenService.ts` | Yes | OK |
| `migrateCreatedAt.ts` | Yes | OK |
| **`recordsService.ts:deletePersonalRecords()`** | **No** | **BUG** |
| **`airlockService.ts:deleteAirlocks()`** | **No** | **BUG** |

Both `recordsService` and `airlockService` call `batch.commit()` without chunking. If a user has >500 records/airlocks, the batch **silently fails** — data appears deleted in the UI but persists in Firestore.

**Fix:** Extract `batchDelete(db, docRefs[])` utility with automatic 500-op chunking. All batch operations use it.

### 9e. Transaction Validation — 11+ Files with Scattered Checks

Transaction field validation (`!tx.merchant`, `!tx.category`, `!tx.date`, `!tx.total`) is performed inline in:

- `TransactionEditorViewInternal.tsx` — required field checks
- `EditView.tsx` — edit validation
- `historyFilterUtils.ts` — filter null checks
- `CreditFeature.tsx` — credit calculation guards
- `BatchReviewCard.tsx` — batch review validation
- `useCategoryStatistics.ts` — stats aggregation guards
- `recordsService.ts` — record computation guards
- `useItems.ts` — item list guards
- `reportUtils.ts` — report generation guards
- `chartDataComputation.ts` — chart data guards
- `insightGenerators.ts` — insight generation guards

No centralized `isValidTransaction()` or schema validator. Each file implements its own subset of checks.

**Fix:** Create `utils/transactionValidation.ts` with `isCompleteTransaction()`, `hasRequiredFields()`, etc. Consider Zod schema for compile-time + runtime validation.

### 9f. Error Handling — 37 Files with No Standard Pattern

Toast notifications via `useToast()` hook scattered across **37 files**. No centralized error-to-toast mapping:
- Some errors show raw exception messages to users
- Some show hardcoded Spanish strings
- Some show translation keys
- Some silently fail (catch block with only `console.error`)

**Fix:** Create `shared/errors/errorHandler.ts` with error code → user-facing message mapping. Wrap service calls with consistent error boundary.

### 9g. Input Sanitization — Centralized but Underused

`sanitizeInput()` exists in `utils/sanitize.ts` (165 lines) with specialized wrappers (`sanitizeMerchantName`, `sanitizeItemName`, `sanitizeLocation`, `sanitizeSubcategory`). However, **only 6 files** use it — mostly in the `shared-groups` feature. The rest of the codebase writes user input directly to Firestore without sanitization.

**Fix:** Audit all user input write paths. Integrate sanitization into the DAL repository layer so it's automatic.

---

## Finding 10: Additional Repeated Patterns (P1 - High)

### 10a. Mapping List Components — 4 Near-Identical UI Components (~1,600 Lines Duplicated)

The same UI duplication pattern from Finding 3a (services) repeats at the component layer:

| Component | Lines | Identical Elements |
|-----------|-------|-------------------|
| `CategoryMappingsList.tsx` | 633 | DeleteModal, EditModal, list rendering, focus mgmt, scroll lock |
| `MerchantMappingsList.tsx` | 475 | DeleteModal, EditModal, list rendering, focus mgmt, scroll lock |
| `SubcategoryMappingsList.tsx` | 582 | DeleteModal, EditModal, list rendering, focus mgmt, scroll lock |
| `ItemNameMappingsList.tsx` | 552 | DeleteModal, EditModal, list rendering, focus mgmt, scroll lock |

Each component embeds a `DeleteConfirmModal` (~160 lines) and `EditModal` (~180 lines) with **identical**:
- Ref management (`modalRef`, `confirmButtonRef`, `previousActiveElement`)
- Focus trapping (Tab/Shift+Tab wrapping)
- Escape key handlers
- Body scroll lock (`document.body.style.overflow = 'hidden'`)
- Theme-aware modal styling
- Backdrop + close button + icon + title + confirm/cancel layout

**Only variation:** `CategoryMappingsList` uses `<select>` for editing; the other three use `<input>`.

**Fix:** Extract generic `MappingsList<T>` component + `ConfirmDialog` + `EditDialog`. **~1,600 lines → ~300 lines** (companion to the generic `MappingRepository<T>` from Finding 8).

### 10b. Sorting Comparators — 15+ Patterns Across 40+ Files

Inline `.sort()` calls with duplicated comparator logic across the codebase:

| Pattern | Occurrences | Example |
|---------|------------|---------|
| Alphabetical ascending | 9 files | `.sort((a,b) => a.localeCompare(b))` |
| Reverse chronological | 7 files | `.sort((a,b) => b.localeCompare(a))` for dates |
| Numeric total descending | 8 files | `.sort((a,b) => b.total - a.total)` |
| Localized name sort | 5 files | `.sort((a,b) => a.names[lang].localeCompare(b.names[lang], lang))` |
| Complex multi-field | 6 files | Priority + date + merchant |

Files include `transactionQuery.ts`, `historyFilterUtils.ts`, `sankeyDataBuilder.ts`, `csvExport.ts`, `chartDataComputation.ts`, `periodComparison.ts`, `duplicateDetectionService.ts`, `locationService.ts`, `IconFilterBar.tsx`, and 30+ more.

**Fix:** Create `utils/comparators.ts` with reusable typed comparators:
```typescript
export const byTotalDesc = <T extends { total: number }>(a: T, b: T) => b.total - a.total;
export const byDateDesc = (a: string, b: string) => b.localeCompare(a);
export const byLocalized = (lang: string) => (a: string, b: string) => a.localeCompare(b, lang);
```

### 10c. Timestamp Conversion — 3 Approaches Across 12 Files

Firestore Timestamps are converted to JavaScript Dates using three different methods:

| Approach | Files | Pattern |
|----------|-------|---------|
| `Timestamp.toDate()` | `firestore.ts`, `recordsService.ts` | `ts.toDate()` |
| Manual `seconds * 1000` | `firestore.ts:246-260`, `migrateCreatedAt.ts` | `ts.seconds * 1000 + ts.nanoseconds / 1e6` |
| String ISO parsing | `recordsService.ts`, `pendingScanStorage.ts` | `new Date(dateStr)` |

The `subscribeToRecentScans` function in [firestore.ts:246-260](src/services/firestore.ts#L246-L260) has a 15-line inline function just to handle the three timestamp formats:

```typescript
const getTime = (tx: Transaction): number => {
    const ca = tx.createdAt;
    if (!ca) return 0;
    if (typeof ca === 'object' && 'seconds' in ca) return ca.seconds * 1000 + (ca.nanoseconds || 0) / 1e6;
    return new Date(ca).getTime();
};
```

This same polymorphic timestamp handling is needed wherever timestamps appear.

**Fix:** Create `utils/timestampUtils.ts` with `toMillis(value: TimestampLike): number` and `toDate(value: TimestampLike): Date` that handle all three formats.

### 10d. LocalStorage Access — 19 Files with Manual JSON Parse/Stringify

Every file that uses `localStorage` reimplements the same try/catch + `JSON.parse()` pattern:

```typescript
// Pattern repeated 19 times:
try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
} catch { return defaultValue; }
```

Files include `pendingScanStorage.ts` (3 locations), `locationService.ts` (2), `recordsService.ts` (2), `useSettingsStore.ts`, `useDeepLinkInvitation.ts`, `AuthContext.tsx`, and 10+ more.

Some locations include validation after parsing, others don't. None handle `QuotaExceededError` on writes.

**Fix:** Create `utils/storage.ts` with `getStorageItem<T>(key, defaultValue, validator?)` and `setStorageItem<T>(key, value)` with consistent error handling.

### 10e. Number Formatting (Non-Currency) — 22 Files with Ad-Hoc Rounding

Beyond currency (Finding 9b), percentage and decimal formatting is scattered:

| Pattern | Files | Example |
|---------|-------|---------|
| `Math.round(x * 100) / 100` | `csvExport.ts` (4 locations), chart components | Decimal rounding |
| `.toFixed(1)` then parse | `TrendsView`, chart components | Percentage display |
| No rounding (raw float) | `reportUtils.ts`, `insightGenerators.ts` | Shows `12.333333%` |

**Fix:** Add `formatDecimal(n, precision)`, `formatPercent(n, decimals)` to `utils/numberFormat.ts`.

### 10f. Confirmation Dialog — No Shared Component

Delete confirmations are implemented **inline** in every component that needs them. Beyond the 4 mapping list components (10a), there are:
- `window.confirm()` calls in `useTransactionHandlers.ts` and `TrustedMerchantsList.tsx`
- Custom modal dialogs in group management components
- Each with its own focus management, escape handler, and backdrop

**Fix:** Extract `shared/components/ConfirmDialog.tsx` with variants (destructive red, warning yellow). Replace all inline implementations.

### 10g. Copy-to-Clipboard — 3 Independent Implementations

Three separate clipboard implementations with different fallback strategies:

| File | Has Fallback | Has Toast | Has Timeout Reset |
|------|-------------|-----------|-------------------|
| `ShareCodeDisplay.tsx:67-103` | Yes (textarea) | No | Yes (2s) |
| `InviteMembersDialog.tsx:116-132` | Yes (textarea, position:fixed) | No | No |
| `GruposView.tsx` (via analyticsService) | Unknown | Yes | Unknown |

**Fix:** Create `utils/clipboard.ts` with `copyToClipboard(text): Promise<boolean>` including fallback, then use from all locations.

### Already Centralized (No Action Needed)

These patterns were investigated and found to be **already properly centralized**:

| Pattern | Centralized In | Status |
|---------|---------------|--------|
| Swipe/gestures | `useSwipeNavigation.ts` (263 lines) | OK |
| Animation tokens | `components/animation/constants.ts` | OK |
| Color/theming | CSS variables + ThemeContext | OK |
| Data export (CSV) | `csvExport.ts` (715 lines, RFC 4180) | OK |
| Loading states | TanStack Query `isLoading` | OK |
| Subscriptions | `useFirestoreSubscription.ts` hook | OK |
| Analytics tracking | `analyticsService.ts` (intentional stub) | OK |

---

## Recommended Refactor Roadmap

### Phase 0: Critical Bugs (Immediate)

| Story | What | Risk | Impact |
|-------|------|------|--------|
| **R-0a** | Fix batch chunking in `recordsService.ts` and `airlockService.ts` | Low | Prevents silent data loss |
| **R-0b** | Audit `sanitizeInput()` coverage — add to all user input write paths | Low | Security hardening |

### Phase 1: Foundation + DAL (Low Risk, High Impact)

| Story | What | Lines Saved | Unblocks |
|-------|------|------------|----------|
| **R-1** | Define repository interfaces (Transaction, Mapping, Trust, Preferences, Records, Airlock, InsightProfile) | — | All subsequent phases |
| **R-2** | Implement Firestore repository classes (wrap existing service code, no behavior change) | — | Test simplification |
| **R-3** | Centralize `PATHS` constant (collection path builder) | 45+ inline paths → 1 file | Path safety |
| **R-4** | Extract `genericMappingService.ts` → generic `MappingRepository<T>` | ~600 | Service consistency |
| **R-5** | Centralize `normalizeForMapping()` with Unicode NFD support | ~100 + bug fix | Data consistency |
| **R-6** | Delete dead services (changelog, fcmToken, pushNotifications, transactionQuery) | ~400 | Clarity |
| **R-7** | Extract `baseDuplicateDetection.ts` | ~250 | Algorithm consistency |
| **R-8** | Extract `batchOperations.ts` with auto-chunking at 500 ops | ~50 + bug fix | Batch safety |

### Phase 2: Business Logic Centralization (Low Risk, High Impact)

| Story | What | Files Affected | Unblocks |
|-------|------|---------------|----------|
| **R-9** | Consolidate currency formatting → single `formatCurrency()` + `DEFAULT_CURRENCY` | 13+ files | Consistency |
| **R-10** | Consolidate date utilities → merge `date.ts` + `dateHelpers.ts` + `periodUtils.ts` | 7+ files | Remove duplicate ISO week |
| **R-11** | Create `timestampUtils.ts` — unified `TimestampLike → Date/millis` conversion | 12 files | Timestamp consistency |
| **R-12** | Create `transactionValidation.ts` with shared validation predicates | 11+ files | Validation consistency |
| **R-13** | Create `comparators.ts` — reusable typed sort comparators | 40+ files | Sorting consistency |
| **R-14** | Create `storage.ts` — typed localStorage wrapper with error handling | 19 files | Storage safety |
| **R-15** | Create `clipboard.ts` — unified copy-to-clipboard with fallback | 4 files | Browser compatibility |
| **R-16** | Create `numberFormat.ts` — `formatDecimal()`, `formatPercent()` | 22 files | Number consistency |
| **R-17** | Standardize error handling → error code mapping + toast service | 37 files | UX consistency |
| **R-18** | Extract `ConfirmDialog` shared component (destructive/warning variants) | 10+ files | Dialog consistency |

### Phase 3: Component Deduplication (Low Risk, High Impact)

| Story | What | Lines Saved | Unblocks |
|-------|------|------------|----------|
| **R-19** | Extract generic `MappingsList<T>` component (replaces 4 near-identical list components) | ~1,300 | UI consistency |

### Phase 4: Feature Modules (Medium Risk, High Impact)

| Story | What | Files Moved | Unblocks |
|-------|------|------------|----------|
| **R-20** | Create `features/analytics/` module | ~15 files | TrendsView refactor |
| **R-21** | Create `features/history/` module | ~10 files | HistoryView cleanup |
| **R-22** | Create `features/insights/` module | ~12 files | InsightsView cleanup |
| **R-23** | Create `features/reports/` module | ~8 files | ReportsView cleanup |
| **R-24** | Create `features/dashboard/` module | ~5 files | DashboardView refactor |
| **R-25** | Create `features/settings/` module | ~5 files | SettingsView cleanup |

### Phase 5: Mega-View Decomposition (Higher Risk, Critical Impact)

| Story | What | Lines Before → After |
|-------|------|---------------------|
| **R-26** | Extract shared `categoryAggregation.ts` | ~400 duplicated → 200 shared |
| **R-27** | Decompose TrendsView.tsx | 5,960 → 800 + sub-files |
| **R-28** | Decompose DashboardView.tsx | 3,473 → 800 + sub-files |
| **R-29** | Decompose TransactionEditorViewInternal.tsx | 2,751 → 800 + sub-files |
| **R-30** | Decompose IconFilterBar.tsx | 2,032 → 200 + dropdown files |
| **R-31** | Decompose App.tsx (continue pattern) | 2,176 → 800 + feature roots |

### Phase 6: State Management Alignment (Medium Risk)

| Story | What | Impact |
|-------|------|--------|
| **R-32** | Migrate ThemeContext → Zustand store | Reduce provider nesting |
| **R-33** | Migrate HistoryFiltersContext → Zustand store | Enable selectors |
| **R-34** | Migrate AppStateContext → Zustand store | Centralize app state |
| **R-35** | Separate client/server state in mixed hooks | ECC compliance |

### Phase 7: Cleanup (Low Risk)

| Story | What |
|-------|------|
| **R-36** | Consolidate `validation.ts` + `validationUtils.ts` |
| **R-37** | Move feature-specific hooks to feature modules |
| **R-38** | Add barrel exports to all features |
| **R-39** | Audit and consolidate query key usage |

---

## Impact Assessment

| Metric | Current | After Refactor |
|--------|---------|----------------|
| Files over 800 lines | 23 | 0 (target) |
| Feature modules | 5 | 12+ |
| Firebase SDK imports | 72 files | 7-10 files (DAL only) |
| Duplicated service code | ~1,500 lines | ~200 lines |
| Duplicated UI components | ~1,600 lines (4 mapping lists) | ~300 lines (1 generic) |
| Dead code | ~400 lines | 0 |
| Max file size | 5,960 lines | ~800 lines |
| Normalization consistency | 5 variants (1 correct) | 1 shared function |
| Currency formatters | 5 implementations | 1 centralized |
| Date/period implementations | 7+ files (2 ISO week) | 2 consolidated files |
| Timestamp conversion | 3 approaches, 12 files | 1 `timestampUtils.ts` |
| Sorting comparators | 15+ inline patterns, 40+ files | 1 `comparators.ts` |
| Batch chunking compliance | 5/7 services | 7/7 (all via utility) |
| Collection path management | 12 files, 45+ inline | 1 centralized `PATHS` |
| Input sanitization coverage | 6 files | All write paths (via DAL) |
| LocalStorage access | 19 files, manual JSON parse | 1 `storage.ts` wrapper |
| Clipboard implementations | 3 independent | 1 `clipboard.ts` utility |
| Confirmation dialogs | Inline in every component | 1 shared `ConfirmDialog` |
| Number formatting | 22 files, ad-hoc rounding | 1 `numberFormat.ts` |
| Context providers (client state) | 6 | 1 (AuthContext) |
| Zustand stores | 3 | 8+ |
| Test mock complexity | 15+ Firebase fns/test | 1 repository interface |

**Total estimated lines saved/consolidated: ~5,000-6,000 lines**

---

## Tooling Notes

### ast-grep (Integrated 2026-02-08)

ast-grep MCP server is configured for this project (`.mcp.json`). It provides AST-based structural code search — critical for Phases 1-4 where we need to find all instances of duplicated patterns before extracting shared utilities.

**Key refactoring queries pre-built in `.claude/skills/ast-grep/SKILL.md`:**
- Firebase direct imports (72 files) — Phase 1 DAL migration
- Inline sort comparators (40+ files) — Phase 2 R-13
- Manual localStorage JSON.parse (19 files) — Phase 2 R-14
- Batch.commit() without chunking (bug detection) — Phase 0 R-0a
- Hardcoded 'CLP' currency (13+ files) — Phase 2 R-9
- Firestore collection path magic strings (45+ locations) — Phase 1 R-3

### code-structure-plugin (Deferred — Install for Phase 5)

[eran-broder/code-structure-plugin](https://github.com/eran-broder/code-structure-plugin) extracts structural skeletons from TypeScript files (function signatures, class hierarchies, interfaces) without reading full implementations. Token-efficient: a 5,960-line file skeleton uses ~200 tokens instead of ~15,000.

**Install when starting Phase 5** (Mega-View Decomposition): Add as Claude Code skill to `.claude/skills/`. Useful for:
- R-27: TrendsView decomposition planning (114 hooks, 15+ inline components)
- R-28: DashboardView decomposition (72 hooks)
- R-29: TransactionEditorViewInternal decomposition (60 hooks)
- R-30: IconFilterBar decomposition (4 inline dropdowns)

No value in Phases 0-4 where files are smaller and pattern extraction is the primary activity.

---

## Risk Notes

1. **TrendsView/DashboardView refactor** is the highest-risk change — they're the most-used views. Requires comprehensive test coverage before touching.
2. **DAL introduction** (Phase 1) is low risk — wrapping existing code, no behavior change. Can be done incrementally (one repository at a time).
3. **Business logic centralization** (Phase 2) is low risk — creating shared utilities and migrating callers incrementally. Each story is independent.
4. **Mapping list component extraction** (Phase 3) is medium risk — 4 components have slight UI variations that need parameterization.
5. **Feature module creation** (Phase 4) is mostly file moves with import rewiring — lower risk but tedious. Use ast-grep to find all import references before moving, then validate with `npx vitest run` after each move.
6. **State management migration** (Phase 6) requires careful testing since contexts propagate differently than stores.
7. **Dead service deletion** should verify via `git log` that these services aren't referenced in Cloud Functions or other non-src code.
8. **Batch chunking fix** (Phase 0) is critical and should be done immediately — it's a silent data loss bug.
