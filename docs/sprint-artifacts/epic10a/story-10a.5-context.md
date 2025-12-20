# Story 10a.5 Context: Update InsightRecord Storage

**Story:** 10a.5 - Update InsightRecord Storage
**Points:** 1
**Status:** Ready for Development

---

## Implementation Summary

Extend the `InsightRecord` interface to store full insight content (title, message, category, icon) so that the Insights History view can display past insights without regenerating them.

---

## File Changes

### 1. `src/types/insight.ts`

**Current InsightRecord (line 113-120):**
```typescript
export interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
}
```

**New InsightRecord:**
```typescript
export interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
  // Epic 10a: Full content for history display
  title?: string;
  message?: string;
  category?: InsightCategory;
  icon?: string;
}
```

**Also update MAX_RECENT_INSIGHTS constant:**
```typescript
// Change from 30 to 50 for insight history
export const MAX_RECENT_INSIGHTS = 50;
```

---

### 2. `src/services/insightEngineService.ts`

Find the function that records shown insights and update it to include full content.

**Current pattern (search for `recordInsightShown` or where InsightRecord is created):**
```typescript
const record: InsightRecord = {
  insightId: insight.id,
  shownAt: Timestamp.now(),
  transactionId: insight.transactionId,
};
```

**New pattern:**
```typescript
const record: InsightRecord = {
  insightId: insight.id,
  shownAt: Timestamp.now(),
  transactionId: insight.transactionId,
  // Epic 10a: Store full content for history
  title: insight.title,
  message: insight.message,
  category: insight.category,
  icon: insight.icon,
};
```

---

## Backward Compatibility

- All new fields are **optional** (`title?: string`)
- Old InsightRecords without these fields will still work
- InsightsView will use `record.title || record.insightId` as fallback

---

## FIFO Cleanup Logic

When saving a new InsightRecord, if `recentInsights.length >= MAX_RECENT_INSIGHTS`:
```typescript
// Remove oldest insights to stay under limit
const updatedInsights = [
  newRecord,
  ...profile.recentInsights.slice(0, MAX_RECENT_INSIGHTS - 1)
];
```

---

## Testing Checklist

- [ ] New InsightRecord fields are optional (no TS errors with old data)
- [ ] New insights are saved with title, message, category, icon
- [ ] FIFO cleanup limits array to 50 records
- [ ] Reading old InsightRecords without new fields works

---

## Estimated Time

~30 minutes
