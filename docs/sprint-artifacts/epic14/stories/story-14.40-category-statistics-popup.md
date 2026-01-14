# Story 14.40: Category Statistics Popup

## Story

**As a** user analyzing my spending patterns in the Tendencias (Trends) view,
**I want** to see detailed statistics when I tap on a category in the treemap, donut chart, or trend line,
**So that** I can understand the price distribution and patterns for that specific category within the selected time period.

## Background

Currently, tapping on a category in the Tendencias view navigates to the filtered history. This story adds an intermediate statistics popup that shows aggregated metrics before the user decides to drill down. This provides quick insights without leaving the current view.

## Acceptance Criteria

### AC1: Popup Trigger Points
- [x] Tapping a category cell in the TreeMap triggers the popup
- [x] Tapping a category segment in the Donut chart triggers the popup
- [x] Tapping a data point in the Trend line (carousel slot 2) triggers the popup
- [x] Popup appears as a modal overlay with backdrop dimming

### AC2: Transaction Statistics
For the selected category and time period, display:
- [x] **Transaction Count**: Total number of transactions
- [x] **Total Spent**: Sum of all transaction amounts
- [x] **Minimum Transaction**: Lowest transaction amount
- [x] **Maximum Transaction**: Highest transaction amount
- [x] **Average Transaction**: Mean transaction amount
- [x] **Median Transaction**: Middle value when sorted

### AC3: Item Statistics (when item data available)
For the selected category and time period, display:
- [x] **Item Count**: Total number of unique items
- [x] **Minimum Item Price**: Lowest individual item price
- [x] **Maximum Item Price**: Highest individual item price
- [x] **Average Item Price**: Mean item price
- [x] **Median Item Price**: Middle item price when sorted

### AC4: Additional Insights
- [x] **Most Frequent Merchant**: Store with most transactions in this category
- [ ] **Price Trend**: Whether spending is trending up/down vs previous period (if data available) *(Deferred - returns null, future story)*
- [x] **Percentage of Total**: What % of total spending this category represents

### AC5: Popup UI Design
- [x] Category emoji and name displayed prominently at top
- [x] Statistics organized in clear sections (Transactions / Items / Insights)
- [x] Values formatted according to user's currency preference
- [x] "Ver Historial" (View History) button to navigate to filtered transactions
- [x] Close button (X) in top-right corner
- [x] Tap outside popup to dismiss
- [x] Smooth entrance/exit animations (respecting reduced motion)

### AC6: Localization
- [x] All labels translated to Spanish/English based on user preference
- [x] Number formatting follows locale (decimal separators, etc.)

## Technical Notes

### Data Sources
- Transaction data filtered by category and temporal period from `useHistoryFilters`
- Item data from transaction items array
- Calculations performed client-side from cached transaction data

### Calculation Functions
```typescript
interface CategoryStatistics {
  // Transaction stats
  transactionCount: number;
  totalSpent: number;
  minTransaction: number;
  maxTransaction: number;
  avgTransaction: number;
  medianTransaction: number;

  // Item stats (optional - only if items exist)
  itemCount?: number;
  minItemPrice?: number;
  maxItemPrice?: number;
  avgItemPrice?: number;
  medianItemPrice?: number;

  // Insights
  topMerchant?: string;
  topMerchantCount?: number;
  percentageOfTotal: number;
  periodComparison?: 'up' | 'down' | 'same' | null;
}
```

### Components to Create
1. `CategoryStatisticsPopup` - Modal component displaying stats
2. `useCategoryStatistics` - Hook to calculate statistics for a category
3. `calculateMedian` - Utility function for median calculation

### Integration Points
- TrendsView: TreeMap cell click handler
- TrendsView: Donut segment click handler
- TrendsView: Trend line data point click handler
- Existing `filterDispatch` for "View History" navigation

## Out of Scope
- Statistics for item-level categories (only store/transaction categories for now)
- Historical comparison charts within the popup
- Export statistics functionality

## Design Reference
- Similar pattern to existing modal overlays in the app
- Use CSS variables for theming consistency
- Follow existing popup patterns from `InsightDetailModal`

## Story Points
**Estimate**: 5 points

## Dependencies
- Story 14.13: Polygon integration (treemap/donut already implemented)
- Existing transaction filtering infrastructure

## Testing Requirements
- Unit tests for statistics calculation functions
- Unit tests for median calculation edge cases (empty arrays, single item, even/odd counts)
- Component tests for popup rendering
- Integration test for click-to-popup flow

## Definition of Done
- [x] All acceptance criteria met (except Price Trend - deferred)
- [x] Unit tests passing with >80% coverage on new code
- [x] TypeScript compiles without errors
- [x] Spanish and English translations complete
- [x] Works correctly on mobile viewport sizes
- [x] Animations respect `prefers-reduced-motion`
- [x] Code reviewed and approved

## Dev Agent Record

### Files Created/Modified
| File | Action | Description |
|------|--------|-------------|
| `src/components/analytics/CategoryStatisticsPopup.tsx` | Created | Modal popup component |
| `src/hooks/useCategoryStatistics.ts` | Created | Statistics calculation hook |
| `src/utils/statisticsUtils.ts` | Created | calculateMedian, calculateBasicStats, findMostFrequent |
| `src/views/TrendsView.tsx` | Modified | Added popup state and icon click handlers |
| `src/utils/translations.ts` | Modified | Added 22 new translation keys (EN/ES) |
| `tests/unit/components/analytics/CategoryStatisticsPopup.test.tsx` | Created | 16 component tests |
| `tests/unit/utils/statisticsUtils.test.ts` | Created | 16 utility tests |
| `tests/unit/hooks/useCategoryStatistics.test.ts` | Created | 14 hook tests |

### Change Log
- 2026-01-13: Initial implementation complete
- 2026-01-13: Code review - added missing hook tests, updated AC status
- **Note:** AC4 Price Trend deferred to future story (returns `null`)
