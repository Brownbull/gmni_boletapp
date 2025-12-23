# Story 10a.2 Context: Fix "This Month" Navigation

**Story:** 10a.2 - Fix "This Month" Navigation
**Points:** 1
**Status:** Ready for Development

---

## Implementation Summary

Ensure clicking "This Month" card navigates to Analytics (TrendsView) with the current month pre-selected.

---

## Investigation

### Current Behavior

In `DashboardView.tsx` (around line 205):
```tsx
<div
    onClick={() => onViewTrends(currentMonth)}
    className="p-5 rounded-xl border cursor-pointer"
>
    <div>{t('thisMonth')}</div>
    <div>{formatCurrency(monthSpent, currency)}</div>
</div>
```

Where `currentMonth = new Date().toISOString().slice(0, 7)` (e.g., "2024-12")

### Trace Through App.tsx

Check how `onViewTrends` is handled:
```tsx
onViewTrends={(_month: string | null) => {
    // What happens here?
    setView('trends');
}}
```

The month parameter may not be being passed to TrendsView.

---

## File Changes

### 1. `src/App.tsx`

**Find the onViewTrends handler** and ensure it sets the month:

```tsx
// Add state for initial month
const [initialMonth, setInitialMonth] = useState<string | null>(null);

// Update handler
onViewTrends={(month: string | null) => {
    setInitialMonth(month);
    setView('trends');
}}

// Pass to TrendsView
{view === 'trends' && (
    <TrendsView
        // ... other props
        initialMonth={initialMonth}
    />
)}
```

### 2. `src/views/TrendsView.tsx`

**Add prop handling:**

```typescript
interface TrendsViewProps {
    // ... existing props
    initialMonth?: string | null;
}
```

**Use initialMonth to set initial temporal state:**
```typescript
useEffect(() => {
    if (initialMonth) {
        // Parse month and set temporal navigation to that month
        const [year, month] = initialMonth.split('-');
        // Set analytics context to show this specific month
    }
}, [initialMonth]);
```

---

## Alternative: Use AnalyticsContext

If TrendsView uses AnalyticsContext, the navigation could be:

```tsx
// In App.tsx handler
onViewTrends={(month: string | null) => {
    if (month) {
        // Dispatch to analytics context to set month
        analyticsDispatch({
            type: 'SET_TEMPORAL_LEVEL',
            payload: { level: 'month', month }
        });
    }
    setView('trends');
}}
```

---

## Testing Checklist

- [ ] Click "This Month" card on Home
- [ ] Analytics view opens
- [ ] Current month is selected in temporal breadcrumb
- [ ] Chart shows current month's data

---

## Estimated Time

~30 minutes (mostly investigation)
