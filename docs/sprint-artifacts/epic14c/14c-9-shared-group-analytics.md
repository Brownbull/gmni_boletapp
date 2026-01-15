# Story 14c.9: Shared Group Analytics

Status: ready-for-dev

## Story

As a group member,
I want to see spending analytics for the shared group,
so that I understand our collective spending patterns.

## Acceptance Criteria

1. **AC1: Polygon Visualization for Group**
   - Given I'm viewing analytics in group view mode
   - When the polygon chart renders
   - Then it shows category breakdown for group transactions only
   - And all members' transactions are aggregated by category
   - And the polygon morphs smoothly on data changes

2. **AC2: Sparkline Trends for Group**
   - Given I'm viewing the group's analytics
   - When sparkline trend charts render
   - Then they show spending trends based on group transactions
   - And trends are calculated from all members' combined data

3. **AC3: Sunburst/Treemap for Group**
   - Given I'm viewing the group's analytics
   - When the sunburst or treemap renders
   - Then it shows breakdown using group transaction data
   - And drill-down shows aggregated category/subcategory totals

4. **AC4: Per-Member Contribution Breakdown**
   - Given I'm viewing group analytics
   - When viewing spending breakdowns
   - Then I can see each member's contribution to the total
   - And this is shown as a bar/pie chart or percentage list
   - And I can identify who spent what

5. **AC5: Insights Scoped to Group**
   - Given I'm in group view mode
   - When insights are generated
   - Then they are based on group transactions only
   - And insight text references "the group" not "you"
   - And comparisons are against group historical data

6. **AC6: Existing Components Work in Group Mode**
   - Given existing analytics components (polygon, trends, etc.)
   - When rendering in group view mode
   - Then all components receive filtered group data
   - And no component crashes or shows personal-only data
   - And all date range filters work with group data

## Tasks / Subtasks

- [ ] Task 1: Update Analytics Data Source (AC: #6)
  - [ ] 1.1 Modify analytics hooks to check ViewModeContext
  - [ ] 1.2 Use `useSharedGroupTransactions()` when in group mode
  - [ ] 1.3 Use personal transactions when in personal mode
  - [ ] 1.4 Create `useAnalyticsTransactions()` wrapper hook

- [ ] Task 2: Update Polygon Component (AC: #1)
  - [ ] 2.1 Ensure `DynamicPolygon.tsx` accepts filtered data
  - [ ] 2.2 Aggregate categories across all members' transactions
  - [ ] 2.3 Test polygon renders correctly with group data

- [ ] Task 3: Update Trend Charts (AC: #2)
  - [ ] 3.1 Ensure sparkline components use filtered data
  - [ ] 3.2 Calculate trends from group transactions
  - [ ] 3.3 Update chart labels if needed (e.g., "Group Spending")

- [ ] Task 4: Update Breakdown Charts (AC: #3)
  - [ ] 4.1 Ensure sunburst/treemap uses group data
  - [ ] 4.2 Drill-down works with aggregated group data
  - [ ] 4.3 Category totals sum all members' contributions

- [ ] Task 5: Create Member Contribution View (AC: #4)
  - [ ] 5.1 Create `MemberContributionChart.tsx` component
  - [ ] 5.2 Calculate each member's total spending
  - [ ] 5.3 Display as bar chart or pie chart
  - [ ] 5.4 Show percentage breakdown
  - [ ] 5.5 Add member avatars to legend

- [ ] Task 6: Update Insight Generation (AC: #5)
  - [ ] 6.1 Modify insight generator to accept data source
  - [ ] 6.2 Pass group transactions when in group mode
  - [ ] 6.3 Update insight text templates for group context
  - [ ] 6.4 Add "Group spent X on Y" style messages

- [ ] Task 7: Integration Testing (AC: #6)
  - [ ] 7.1 Test all analytics views render in group mode
  - [ ] 7.2 Test date range filters work with group data
  - [ ] 7.3 Test data aggregation is correct
  - [ ] 7.4 Test no regressions in personal mode

- [ ] Task 8: i18n Updates
  - [ ] 8.1 Add "Group spending", "Member contributions" strings
  - [ ] 8.2 Update insight templates with group variants
  - [ ] 8.3 Add accessibility labels for group analytics

## Dev Notes

### Architecture Context

**Data Flow:**
```
ViewModeContext (mode: 'group', groupId: 'abc')
          │
          ▼
useAnalyticsTransactions()
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
Personal    useSharedGroupTransactions()
(existing)   (from 14c.5)
```

All analytics components should receive transactions from this unified hook, ensuring they automatically work with either personal or group data.

### Existing Code to Leverage

**Analytics Components:**
- `src/components/analytics/DynamicPolygon.tsx` - Polygon visualization
- `src/components/analytics/TrendSparkline.tsx` - Trend charts
- `src/components/analytics/Sunburst.tsx` or `Treemap.tsx` - Breakdowns
- `src/components/views/TrendsView.tsx` - Analytics page

**Insight Engine:**
- `src/services/insightEngineService.ts` - Insight generation
- `src/types/insight.ts` - Insight types

**Existing Aggregation:**
- `src/lib/analytics.ts` or similar - Category aggregation utilities

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── shared-groups/
│       └── MemberContributionChart.tsx  # Per-member breakdown
├── hooks/
│   └── useAnalyticsTransactions.ts      # Unified data source
```

**Files to modify:**
```
src/components/views/TrendsView.tsx       # Use unified data source
src/components/analytics/*.tsx            # Ensure they accept data prop
src/services/insightEngineService.ts      # Add group-aware insights
```

### Unified Analytics Data Hook

```typescript
// src/hooks/useAnalyticsTransactions.ts
export function useAnalyticsTransactions(options?: {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}): {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  isGroupMode: boolean;
} {
  const { mode, groupId } = useViewMode();

  // Personal mode: use user's own transactions
  const personalQuery = useTransactions({
    ...options,
    enabled: mode === 'personal',
  });

  // Group mode: use shared group transactions
  const groupQuery = useSharedGroupTransactions({
    groupId: groupId || '',
    ...options,
    enabled: mode === 'group' && !!groupId,
  });

  const isGroupMode = mode === 'group';
  const activeQuery = isGroupMode ? groupQuery : personalQuery;

  return {
    transactions: activeQuery.data || [],
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    isGroupMode,
  };
}
```

### Member Contribution Chart

```typescript
// src/components/shared-groups/MemberContributionChart.tsx
interface MemberContribution {
  memberId: string;
  memberName: string;
  avatarColor: string;
  total: number;
  percentage: number;
}

interface MemberContributionChartProps {
  transactions: Transaction[];
  members: SharedGroupMember[];
}

export function MemberContributionChart({
  transactions,
  members,
}: MemberContributionChartProps) {
  const contributions = useMemo(() => {
    // Group transactions by owner
    const byMember = new Map<string, number>();

    for (const tx of transactions) {
      const ownerId = tx._ownerId || 'unknown';
      byMember.set(ownerId, (byMember.get(ownerId) || 0) + tx.total);
    }

    const total = Array.from(byMember.values()).reduce((a, b) => a + b, 0);

    return members.map(member => ({
      memberId: member.uid,
      memberName: member.displayName,
      avatarColor: member.avatarColor,
      total: byMember.get(member.uid) || 0,
      percentage: total > 0 ? ((byMember.get(member.uid) || 0) / total) * 100 : 0,
    }));
  }, [transactions, members]);

  return (
    <div className="member-contribution-chart">
      <h3 className="text-lg font-semibold mb-4">{t('memberContributions')}</h3>

      {/* Bar chart showing each member's contribution */}
      <div className="space-y-3">
        {contributions.map(contrib => (
          <div key={contrib.memberId} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: contrib.avatarColor }}
            >
              {contrib.memberName[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>{contrib.memberName}</span>
                <span>{formatCurrency(contrib.total)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${contrib.percentage}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 w-12 text-right">
              {contrib.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Group-Aware Insights

```typescript
// In insightEngineService.ts
function generateSpendingInsight(
  transactions: Transaction[],
  isGroupMode: boolean
): Insight | null {
  const total = transactions.reduce((sum, tx) => sum + tx.total, 0);

  if (isGroupMode) {
    return {
      type: 'trend',
      title: t('groupSpendingThisMonth'),
      description: t('theGroupSpent', { amount: formatCurrency(total) }),
      // ... other insight fields
    };
  } else {
    return {
      type: 'trend',
      title: t('yourSpendingThisMonth'),
      description: t('youSpent', { amount: formatCurrency(total) }),
      // ... other insight fields
    };
  }
}
```

### Category Aggregation for Group

```typescript
// Utility for aggregating categories across all members
function aggregateCategoriesForGroup(
  transactions: Transaction[]
): CategoryBreakdown[] {
  const categoryMap = new Map<string, number>();

  for (const tx of transactions) {
    const category = tx.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + tx.total);
  }

  return Array.from(categoryMap.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: (total / totalSpending) * 100,
    }))
    .sort((a, b) => b.total - a.total);
}
```

### UX Considerations

**Context Clarity:**
- Clear indication that analytics show "Group" data
- Header label: "Familia Martinez Analytics" vs "Your Analytics"

**Member Contribution Value:**
- Helps understand spending balance
- Non-judgmental presentation (no "X spent too much")
- Optional visibility toggle if privacy concerns

**Performance:**
- Group analytics may involve more data
- Use caching from 14c.5 (IndexedDB)
- Consider pagination for large datasets

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Brainstorming - Analytics Edge Cases]: docs/analysis/brainstorming-session-2026-01-15.md#category-4-analytics-edge-cases
- [Story 14c.4 - View Mode]: docs/sprint-artifacts/epic14c/14c-4-view-mode-switcher.md
- [Story 14c.5 - Shared Transactions]: docs/sprint-artifacts/epic14c/14c-5-shared-group-transactions-view.md
- [Epic 14 - Polygon/Analytics]: docs/sprint-artifacts/epic14/

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

