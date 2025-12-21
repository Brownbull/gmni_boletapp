# Story 10a.1 Context: Home Screen Consolidation

**Story:** 10a.1 - Home Screen Consolidation
**Points:** 5
**Status:** Ready for Development

---

## Implementation Summary

Transform DashboardView from showing 5 recent transactions to showing ALL transactions with filters, effectively merging the current Dashboard and History views into a unified Home screen.

---

## File Changes

### 1. `src/views/DashboardView.tsx`

#### A. Remove Scan AI CTA Section

**Delete this block (around lines 214-231):**
```tsx
{/* Scan CTA with gradient accent */}
<div
    className="p-6 rounded-xl relative overflow-hidden text-white"
    style={{ background: `linear-gradient(135deg, var(--accent), #6366f1)` }}
>
    <h3 className="font-bold z-10 relative">{t('scanTitle')}</h3>
    <button
        onClick={onTriggerScan}
        ...
    </button>
    <Receipt className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20 rotate-12" />
</div>
```

#### B. Add New Imports

```typescript
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
import { getDuplicateIds } from '../services/duplicateDetectionService';
import { normalizeTransaction } from '../utils/transactionNormalizer';
import {
    extractAvailableFilters,
    filterTransactionsByHistoryFilters,
} from '../utils/historyFilterUtils';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { AlertTriangle, Inbox } from 'lucide-react';
```

#### C. Add Filter and Pagination State

Inside component, add:
```typescript
const { state: filterState, hasActiveFilters } = useHistoryFilters();
const [historyPage, setHistoryPage] = useState(1);
const pageSize = 10;

// Use allTransactions instead of transactions
const transactionsToFilter = allTransactions;

// Extract available filters
const availableFilters = useMemo(() => {
    return extractAvailableFilters(transactionsToFilter as any);
}, [transactionsToFilter]);

// Apply filters
const filteredTransactions = useMemo(() => {
    return filterTransactionsByHistoryFilters(transactionsToFilter as any, filterState);
}, [transactionsToFilter, filterState]);

// Paginate
const totalPages = Math.ceil(filteredTransactions.length / pageSize);
const paginatedTransactions = useMemo(() => {
    const startIndex = (historyPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
}, [filteredTransactions, historyPage, pageSize]);

// Duplicate detection
const duplicateIds = useMemo(() => {
    return getDuplicateIds(transactionsToFilter as any);
}, [transactionsToFilter]);
```

#### D. Add Filter Bar After Summary Cards

```tsx
{/* Summary cards */}
<div className="grid grid-cols-2 gap-4">
    {/* ... existing cards ... */}
</div>

{/* Filter bar - NEW */}
<HistoryFilterBar
    availableFilters={availableFilters}
    theme={theme}
    locale={lang}
    t={t}
    totalCount={transactionsToFilter.length}
    filteredCount={filteredTransactions.length}
/>
```

#### E. Update Transaction List

Replace the transaction mapping to use `paginatedTransactions` and add duplicate detection:

```tsx
{paginatedTransactions.map(tx => {
    const isDuplicate = tx.id ? duplicateIds.has(tx.id) : false;
    // ... rest of card rendering with duplicate badge
})}
```

Add duplicate badge like in HistoryView:
```tsx
{isDuplicate && (
    <div className="flex items-center gap-1 text-xs mt-1.5 text-amber-600 dark:text-amber-400">
        <AlertTriangle size={12} className="flex-shrink-0" />
        <span className="font-medium">{t('potentialDuplicate')}</span>
    </div>
)}
```

#### F. Add Pagination Controls

```tsx
{/* Pagination */}
<div className="flex justify-center items-center gap-4 mt-6">
    <button
        disabled={historyPage === 1}
        onClick={() => setHistoryPage(p => p - 1)}
        className="px-4 py-2 border rounded-lg disabled:opacity-50"
    >
        {t('prev')}
    </button>
    <span>{t('page')} {historyPage} / {totalPages}</span>
    <button
        disabled={historyPage >= totalPages}
        onClick={() => setHistoryPage(p => p + 1)}
        className="px-4 py-2 border rounded-lg disabled:opacity-50"
    >
        {t('next')}
    </button>
</div>
```

#### G. Add Empty State

```tsx
{filteredTransactions.length === 0 && hasActiveFilters ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">{t('noMatchingTransactions')}</p>
        <p className="text-sm opacity-75">{t('tryDifferentFilters')}</p>
    </div>
) : (
    // ... transaction list and pagination
)}
```

---

### 2. `src/App.tsx`

Ensure DashboardView is wrapped with HistoryFiltersProvider:

```tsx
{view === 'dashboard' && (
    <HistoryFiltersProvider>
        <DashboardView
            // ... props
        />
    </HistoryFiltersProvider>
)}
```

---

## Props to Keep

- `allTransactions` - Already passed, now used for full list
- `onEditTransaction` - For clicking transactions
- `onViewTrends` - For summary card clicks
- `formatCurrency`, `formatDate`, etc. - Formatting utilities

## Props to Remove (or make optional)

- `transactions` - Was 5 recent, now using allTransactions
- `onTriggerScan` - Scan CTA removed

---

## Testing Checklist

- [ ] Scan AI CTA card is gone
- [ ] Filter bar appears below summary cards
- [ ] All transactions shown (not just 5)
- [ ] Pagination works
- [ ] Duplicate badges appear
- [ ] Filters work correctly
- [ ] Empty state shows when no matches

---

## Estimated Time

~2-3 hours
