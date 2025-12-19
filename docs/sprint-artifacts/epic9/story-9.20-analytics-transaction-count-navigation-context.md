# Story 9.20 Context: Analytics Transaction Count & History Navigation

## Overview
Add transaction count badges to DrillDownCards with tap-to-navigate functionality to filtered History view.

---

## Reference Files

### Core Components to Modify
- `src/components/analytics/DrillDownCard.tsx` - Add badge display and onBadgeClick prop
- `src/components/analytics/DrillDownGrid.tsx` - Pass transactionCount and create badge click handlers
- `src/views/TrendsView.tsx` - Pass onNavigateToHistory callback
- `src/App.tsx` - Handle navigation and filter initialization

### Filter Context (from Story 9.19)
- `src/contexts/HistoryFiltersContext.tsx` - Filter state types and actions
- `src/hooks/useHistoryFilters.ts` - Hook for accessing filter context
- `src/utils/historyFilterUtils.ts` - Filter utilities

### Type Definitions
- `src/types/analytics.ts` - TemporalPosition, CategoryPosition types

---

## Key Data Structures

### TemporalChildData (already in DrillDownGrid)
```typescript
interface TemporalChildData {
  label: string;
  position: TemporalPosition;
  total: number;
  percentage: number;
  transactionCount: number;  // ← Already computed, just not displayed
  isEmpty: boolean;
  colorKey: string;
}
```

### CategoryChildData (already in DrillDownGrid)
```typescript
interface CategoryChildData {
  label: string;
  position: CategoryPosition;
  total: number;
  percentage: number;
  transactionCount: number;  // ← Already computed, just not displayed
  isEmpty: boolean;
  colorKey: string;
}
```

### HistoryFilterState (from Story 9.19)
```typescript
interface TemporalFilterState {
  level: 'all' | 'year' | 'month' | 'week' | 'day';
  year?: string;
  month?: string;
  week?: number;
  day?: string;
}

interface CategoryFilterState {
  level: 'all' | 'category' | 'group' | 'subcategory';
  category?: string;
  group?: string;
  subcategory?: string;
}
```

---

## Implementation Tasks

### Task 1: Extend DrillDownCard Props
```typescript
// Add to DrillDownCardProps
transactionCount?: number;
onBadgeClick?: () => void;
```

### Task 2: Create Badge Component Inside DrillDownCard
Position: Left side of card, before label section
```tsx
{/* Transaction count badge */}
{transactionCount && transactionCount > 0 && onBadgeClick && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onBadgeClick();
    }}
    className="..." // circular badge styles
    aria-label={`View ${transactionCount} transactions`}
  >
    {transactionCount >= 100 ? '99+' : transactionCount}
  </button>
)}
```

### Task 3: Position-to-Filter Mapping Utilities
Create in `src/utils/analyticsToHistoryFilters.ts`:

```typescript
// Convert TemporalPosition to TemporalFilterState
function temporalPositionToFilter(position: TemporalPosition): TemporalFilterState {
  switch (position.level) {
    case 'year':
      return { level: 'year', year: position.year };
    case 'quarter':
      // Map to first month of quarter - History will filter all 3 months
      const quarterNum = parseInt(position.quarter!.replace('Q', ''), 10);
      const firstMonth = ((quarterNum - 1) * 3 + 1).toString().padStart(2, '0');
      return {
        level: 'month',
        year: position.year,
        month: `${position.year}-${firstMonth}`
      };
    case 'month':
      return { level: 'month', year: position.year, month: position.month! };
    case 'week':
      return {
        level: 'week',
        year: position.year,
        month: position.month!,
        week: position.week!
      };
    case 'day':
      return {
        level: 'day',
        year: position.year,
        month: position.month!,
        week: position.week!,
        day: position.day!
      };
    default:
      return { level: 'all' };
  }
}

// Convert CategoryPosition to CategoryFilterState
function categoryPositionToFilter(position: CategoryPosition): CategoryFilterState {
  switch (position.level) {
    case 'all':
      return { level: 'all' };
    case 'category':
      return { level: 'category', category: position.category };
    case 'group':
      return {
        level: 'group',
        category: position.category,
        group: position.group
      };
    case 'subcategory':
      return {
        level: 'subcategory',
        category: position.category,
        group: position.group,
        subcategory: position.subcategory
      };
    default:
      return { level: 'all' };
  }
}
```

### Task 4: Update DrillDownGrid
Pass transactionCount and create onBadgeClick handlers:

```tsx
<DrillDownCard
  key={`temporal-${child.label}`}
  label={child.label}
  value={child.total}
  percentage={child.percentage}
  transactionCount={child.transactionCount}  // ← Add this
  onClick={() => handleTemporalClick(child.position)}
  onBadgeClick={() => onNavigateToHistory?.({  // ← Add this
    temporal: temporalPositionToFilter(child.position),
    category: { level: 'all' }
  })}
  // ... other props
/>
```

### Task 5: Add Navigation Callback Prop
```typescript
// Add to DrillDownGridProps
onNavigateToHistory?: (filters: {
  temporal: TemporalFilterState;
  category: CategoryFilterState;
}) => void;
```

### Task 6: Wire Up in TrendsView/App.tsx
TrendsView passes callback to DrillDownGrid, App.tsx handles navigation:

```tsx
// In App.tsx - need to lift HistoryFiltersProvider higher
// OR pass filter dispatch as prop

const handleNavigateToHistory = (filters: {...}) => {
  // Set filters in context
  historyFiltersDispatch({ type: 'SET_TEMPORAL_FILTER', payload: filters.temporal });
  historyFiltersDispatch({ type: 'SET_CATEGORY_FILTER', payload: filters.category });
  // Navigate
  setView('list');
};
```

### Task 7: Add Translations
```typescript
// EN
viewNTransactions: "View {count} transactions",
// ES
viewNTransactions: "Ver {count} transacciones",
```

---

## Quarter Handling Strategy

Since HistoryFiltersContext doesn't have a 'quarter' level, we need special handling:

**Option A: Filter to quarter's date range (Recommended)**
Modify `filterTransactionsByHistoryFilters` in historyFilterUtils.ts to handle quarter ranges:
- When temporal.level === 'month' AND it's the first month of a quarter AND navigated from analytics
- Filter includes all 3 months of that quarter

**Option B: Add quarter support to HistoryFiltersContext**
- Add 'quarter' to TemporalFilterState.level
- Update filtering logic to handle quarter

**Option C: Simple month filter**
- Just filter to first month of quarter
- User sees partial data but can adjust manually

**Recommendation:** Option A with a `quarterRange` flag in navigation payload.

---

## Badge Styling Reference

```css
/* Badge base */
.badge {
  min-width: 28px;
  min-height: 28px;
  border-radius: 9999px; /* rounded-full */
  background-color: var(--accent);
  color: white;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Larger badge for 3-digit */
.badge-large {
  min-width: 32px;
  min-height: 32px;
}

/* Touch target wrapper */
.badge-touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tap feedback */
.badge:active {
  transform: scale(0.95);
}
```

---

## Test Scenarios

1. **Badge renders with correct count**
2. **Badge shows "99+" for counts >= 100**
3. **Badge click triggers navigation callback**
4. **Badge click doesn't trigger card drill-down**
5. **Card click (outside badge) still drills down**
6. **Correct temporal filter applied for each level**
7. **Correct category filter applied for each level**
8. **Quarter badge navigates with 3-month range**
9. **Empty cards have no badge**
10. **Badge is keyboard accessible**

---

## File Changes Summary

| File | Changes |
|------|---------|
| `DrillDownCard.tsx` | Add transactionCount prop, badge UI, onBadgeClick |
| `DrillDownGrid.tsx` | Pass transactionCount, create badge handlers, add onNavigateToHistory prop |
| `TrendsView.tsx` | Pass onNavigateToHistory to DrillDownGrid |
| `App.tsx` | Handle navigation, potentially lift HistoryFiltersProvider |
| `analyticsToHistoryFilters.ts` | NEW - position-to-filter mapping utilities |
| `historyFilterUtils.ts` | Add quarter range support (optional) |
| `translations.ts` | Add viewNTransactions key |
