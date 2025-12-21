# Story 10a.5: Update InsightRecord Storage

**Story Points:** 1
**Status:** Ready for Development
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

## Testing Requirements

### Unit Tests
- [ ] New fields saved correctly
- [ ] Old records without new fields read without error
- [ ] FIFO cleanup works when exceeding 50 records

---

## Definition of Done
- [ ] All ACs verified
- [ ] Unit tests passing
- [ ] Code review approved
