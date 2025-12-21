# Story 10a.4: Insights History View

**Story Points:** 5
**Status:** Ready for Development
**Dependencies:** Story 10a.5 (InsightRecord storage)

---

## User Story

As a **user viewing the Insights tab**,
I want **to see a history of insights I've received**,
So that **I can recall interesting patterns and review past observations**.

---

## Acceptance Criteria

### AC1: Insights List Renders
**Given** I navigate to the Insights tab
**When** the view loads
**Then** I see a chronological list of past insights
**And** each insight shows: icon, title, message, date

### AC2: Grouped by Week
**Given** I have insights from multiple weeks
**When** I view the Insights list
**Then** insights are grouped under headers: "This Week", "Last Week", "Earlier"

### AC3: Insight Card Display
**Given** an insight is displayed
**When** I view the card
**Then** I see:
- The insight icon (matching the generator)
- The title (e.g., "Visita frecuente")
- The message (e.g., "3a vez en H&M este mes")
- The date it was shown

### AC4: Navigate to Transaction
**Given** an insight is displayed with a transactionId
**When** I tap the insight card
**Then** I navigate to the EditView for that transaction

### AC5: Empty State
**Given** I have no insights yet
**When** I view the Insights tab
**Then** I see a friendly empty state message
**And** suggestion to scan more receipts

### AC6: Backward Compatibility
**Given** an old InsightRecord without title/message
**When** the view renders
**Then** it displays the insightId as fallback
**And** no crash occurs

---

## Technical Notes

### Files to Create
- `src/views/InsightsView.tsx` - New view component
- `src/components/insights/InsightHistoryCard.tsx` - Card component

### Files to Modify
- `src/App.tsx` - Add InsightsView routing

### Implementation Steps
1. Create InsightsView component
2. Fetch user's InsightRecords from UserInsightProfile
3. Group insights by week (This Week, Last Week, Earlier)
4. Create InsightHistoryCard presentational component
5. Add navigation to source transaction on click
6. Handle empty state gracefully

### Data Access Pattern
```typescript
// From insightEngineService.ts
const profile = await getUserInsightProfile(userId);
const insights = profile?.shownInsights || [];

// Group by week
const groupedInsights = groupByWeek(insights);
```

### Card UI Pattern
```tsx
<InsightHistoryCard
  icon={insight.icon || 'Lightbulb'}
  title={insight.title || insight.insightId}
  message={insight.message || ''}
  date={insight.shownAt.toDate()}
  onClick={() => navigateToTransaction(insight.transactionId)}
/>
```

---

## Testing Requirements

### Unit Tests
- [ ] InsightsView renders insight list
- [ ] Insights grouped correctly by week
- [ ] InsightHistoryCard displays all fields
- [ ] Empty state renders when no insights
- [ ] Fallback for old records without title/message

### E2E Tests
- [ ] User can view insight history
- [ ] Tapping insight navigates to transaction

---

## Definition of Done
- [ ] All ACs verified
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Code review approved
