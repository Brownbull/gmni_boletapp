# Story 10.0 Context: Foundation Sprint

**Purpose:** This document aggregates all relevant codebase context for implementing Story 10.0.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `src/services/transactionQuery.ts` | Unified transaction filtering/aggregation |
| `src/hooks/useLearningPhases.ts` | Learning prompt orchestration |
| `src/hooks/useChangeDetection.ts` | Generalized change detection |

---

## Files to Modify

### 1. App.tsx - State Consolidation

**Current State (Lines 44-146):**
```
Location: /home/khujta/projects/bmad/boletapp/src/App.tsx

Current state variables (~21 in UI/Settings sections):

UI State (lines 75-87):
- view, scanImages, isAnalyzing, scanError
- scanStoreType, scanCurrency, currentTransaction
- editingItemIndex, pendingScan, userCredits

Settings State (lines 90-104):
- lang, currency, theme, dateFormat, colorTheme
- defaultCountry, defaultCity, wiping, exporting
- toastMessage, historyPage, distinctAliases
```

**Target Architecture:**
Group related state into contexts:
- `ScanContext` - scan state, processing, results
- `TransactionContext` - transactions, filters, selected
- `UIContext` - view mode, modals, toasts
- `SettingsContext` - user preferences (partially exists)

---

### 2. TrendsView.tsx - computeBarData() Refactoring

**Current Function (Lines 220-380):**
```
Location: /home/khujta/projects/bmad/boletapp/src/views/TrendsView.tsx

computeBarData() is ~160 lines doing:
1. Temporal grouping (year→quarters, quarter→months, etc.)
2. Category filtering
3. Aggregation by period
4. Chart formatting

Should split into:
- groupTransactionsByPeriod()
- calculatePeriodTotals()
- calculateCategoryBreakdown()
- formatChartData()
```

**Related Helper Functions:**
```
Location: /home/khujta/projects/bmad/boletapp/src/utils/analyticsHelpers.ts

Key functions to reference:
- getQuarterFromMonth() (line 21)
- getDefaultNavigationState() (line 36)
- validateNavigationState() (line 60)
```

---

### 3. Filtering Logic - Current Locations

**filterTransactionsByNavState() (Lines 91-119):**
```typescript
// Location: src/views/TrendsView.tsx
// Filters by temporal position and category

function filterTransactionsByNavState(
  transactions: Transaction[],
  navState: AnalyticsNavigationState
): Transaction[]
```

**Pattern to Extract:**
```typescript
// Target: src/services/transactionQuery.ts

export interface TransactionQueryService {
  filterByDateRange(txns: Transaction[], start: Date, end: Date): Transaction[];
  filterByCategory(txns: Transaction[], category: string): Transaction[];
  filterByMerchant(txns: Transaction[], merchant: string): Transaction[];
  aggregateByCategory(txns: Transaction[]): CategoryAggregate[];
  aggregateByMerchant(txns: Transaction[]): MerchantAggregate[];
  getThisWeek(txns: Transaction[]): Transaction[];
  getThisMonth(txns: Transaction[]): Transaction[];
  getLastNDays(txns: Transaction[], n: number): Transaction[];
}
```

---

## Existing Service Patterns to Follow

**Service File Pattern:**
```
Location: /home/khujta/projects/bmad/boletapp/src/services/

Reference: categoryMappingService.ts (162 lines)
- Import Firestore types at top
- Export async functions for CRUD
- Export subscribe function for real-time
- Pattern: async function(db, userId, appId, ...args)
```

**Hook Pattern:**
```
Location: /home/khujta/projects/bmad/boletapp/src/hooks/

Reference: useTransactions.ts (45 lines)
- useState for data/loading
- useEffect for subscriptions
- Return state + mutation functions
```

---

## Type Definitions to Reference

**Transaction Type:**
```
Location: /home/khujta/projects/bmad/boletapp/src/types/transaction.ts (125 lines)

Key interfaces:
- Transaction (lines 80-110)
- TransactionItem (lines 62-78)
- StoreCategory (lines 5-21)
- ItemCategory (lines 28-44)
```

**Analytics Types:**
```
Location: /home/khujta/projects/bmad/boletapp/src/types/analytics.ts (167 lines)

Key types:
- TemporalLevel, TemporalPosition (lines 10-31)
- CategoryLevel, CategoryPosition (lines 33-52)
- AnalyticsNavigationState (lines 55-95)
```

---

## Contexts to Reference

**AnalyticsContext Pattern:**
```
Location: /home/khujta/projects/bmad/boletapp/src/contexts/AnalyticsContext.tsx (240 lines)

Pattern to follow for new contexts:
- Define state interface
- Define action types
- Create reducer
- Create provider component
- Export useX hook (not direct useContext)
```

---

## Test Files to Update

```
Location: /home/khujta/projects/bmad/boletapp/tests/

Relevant test patterns:
- tests/unit/utils/*.test.ts
- tests/unit/services/*.test.ts
- tests/unit/hooks/*.test.ts

Run tests: npm run test
Current count: 977+ tests
```

---

## Key Dependencies

```json
// From package.json - relevant for this story
{
  "react": "^18.x",
  "typescript": "^5.3.3",
  "firebase": "^10.x",
  "vitest": "^1.x"
}
```

---

## Summary: What to Extract

| Current Location | Target Location | Purpose |
|------------------|-----------------|---------|
| TrendsView.tsx:91-119 | transactionQuery.ts | Filtering logic |
| TrendsView.tsx:220-380 | transactionQuery.ts | Aggregation logic |
| App.tsx:75-104 | ScanContext, UIContext | State consolidation |
| EditView change detection | useChangeDetection.ts | Reusable hook |
| App.tsx learning logic | useLearningPhases.ts | Learning orchestration |
