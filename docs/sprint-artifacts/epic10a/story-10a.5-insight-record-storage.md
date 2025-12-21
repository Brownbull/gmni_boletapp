# Story 10a.5: Update InsightRecord Storage

**Story Points:** 1
**Status:** Done
**Dependencies:** None

---

## User Story

As a **developer storing insights**,
I want **InsightRecord to include full insight content**,
So that **we can display insight history without regenerating**.

---

## Acceptance Criteria

### AC1: Extended Schema
**Given** a new insight is generated and stored
**When** the InsightRecord is saved
**Then** it includes: title, message, category, icon

### AC2: Backward Compatible
**Given** old InsightRecords without new fields
**When** the code reads them
**Then** no errors occur
**And** missing fields are undefined

### AC3: Storage Size Check
**Given** a user with many insights
**When** insights are stored
**Then** profile document stays under Firestore 1MB limit
**And** we store max 50 recent insights (FIFO)

---

## Technical Notes

### Current Schema
```typescript
interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
}
```

### New Schema
```typescript
interface InsightRecord {
  insightId: string;
  shownAt: Timestamp;
  transactionId?: string;
  // NEW: Full insight content for history
  title?: string;      // e.g., "Visita frecuente"
  message?: string;    // e.g., "3a vez en H&M este mes"
  category?: InsightCategory;
  icon?: string;       // e.g., "Repeat"
}
```

### Files to Modify
- `src/types/insight.ts` - Extend InsightRecord interface
- `src/services/insightEngineService.ts` - Save full content when storing

### Implementation Steps
1. Extend InsightRecord interface with optional fields
2. Update `recordInsightShown()` to accept and store full insight
3. Add FIFO cleanup if shownInsights exceeds 50 records
4. Test with existing data (backward compatibility)

### Storage Calculation
- Estimated size per InsightRecord: ~200 bytes
- 50 records = ~10KB (well under 1MB limit)

---

## Tasks/Subtasks

- [x] Extend InsightRecord interface with optional fields (title, message, category, icon)
- [x] Update MAX_RECENT_INSIGHTS constant from 30 to 50
- [x] Update recordInsightShown() in insightProfileService.ts to store full content
- [x] Verify FIFO cleanup logic (already present)
- [x] Write unit tests for new fields and backward compatibility
- [x] Run full test suite and verify no regressions

---

## Testing Requirements

### Unit Tests
- [x] New fields saved correctly
- [x] Old records without new fields read without error
- [x] FIFO cleanup works when exceeding 50 records

---

## Definition of Done
- [x] All ACs verified
- [x] Unit tests passing
- [x] Code review approved

---

## Dev Agent Record

### Implementation Date
2025-12-21

### Completion Notes

**Implementation Summary:**
Story 10a.5 updates the InsightRecord storage to include full insight content (title, message, category, icon) so that the Insights History view can display past insights without regenerating them. The MAX_RECENT_INSIGHTS constant was increased from 30 to 50 to support the history view.

**Key Changes:**
1. **src/types/insight.ts** - Updated MAX_RECENT_INSIGHTS from 30 to 50 for insight history support
2. **src/services/insightProfileService.ts** - Updated JSDoc comment to reflect 50-record limit
3. **tests/unit/services/insightProfileService.test.ts** - Added 3 new tests for Story 10a.5:
   - `should store full insight content (title, message, category, icon)`
   - `should not error when reading old records without new fields` (backward compatibility)
   - `should handle partial fullInsight object (only some fields provided)`

**Note:** Most of the implementation was already completed in Story 10a.4:
- InsightRecord interface already had the new optional fields (title, message, category, icon)
- recordInsightShown() already accepted and stored full insight content
- FIFO cleanup was already in place using MAX_RECENT_INSIGHTS

**Tests:**
- All 1428 unit tests passing
- All 332 integration tests passing
- TypeScript compiles without errors

### File List

**Modified:**
- [src/types/insight.ts](src/types/insight.ts) - MAX_RECENT_INSIGHTS 30 → 50
- [src/services/insightProfileService.ts](src/services/insightProfileService.ts) - Updated JSDoc comment with fullInsight parameter docs
- [src/hooks/useInsightProfile.ts](src/hooks/useInsightProfile.ts) - FullInsightContent interface, hook signature updated (Story 10a.4)
- [tests/unit/services/insightProfileService.test.ts](tests/unit/services/insightProfileService.test.ts) - Added 3 new tests for Story 10a.5
- [tests/unit/hooks/useInsightProfile.test.ts](tests/unit/hooks/useInsightProfile.test.ts) - Added fullInsight parameter pass-through test

### Change Log

| Date | Change | By |
|------|--------|-----|
| 2025-12-21 | Implementation complete - MAX_RECENT_INSIGHTS increased to 50, tests added | AI |
| 2025-12-21 | Code review fixes - Enhanced JSDoc, added hook test for fullInsight pass-through, updated File List | AI |
