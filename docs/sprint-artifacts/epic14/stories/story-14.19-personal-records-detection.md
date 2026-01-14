# Story 14.19: Personal Records Detection

**Status:** done
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.1 (Animation Framework), Story 14.18 (Celebration System)

---

## Story

As a **user who achieved a spending milestone**,
I want **automatic detection and celebration of personal records**,
so that **I'm recognized for positive financial behaviors**.

## Acceptance Criteria

1. **RecordsService** with detection logic for various record types
2. **"Lowest [category] week in X months!"** detection and messaging
3. **Record celebration display** with PersonalRecordBanner component
4. **Record history storage** in Firestore for tracking achievements
5. **Integration with Celebration System** for celebrateBig effects
6. **Non-overwhelming** - cooldown between record notifications

## Tasks / Subtasks

- [x] Task 1: Create RecordsService (AC: #1)
  - [x] Create `src/services/recordsService.ts`
  - [x] Define record types (lowest_week, consecutive_days, etc.)
  - [x] Implement detection algorithms
  - [x] Export detection functions

- [x] Task 2: Implement lowest category detection (AC: #2)
  - [x] Compare current week to historical weeks
  - [x] Track per-category weekly totals
  - [x] Generate message: "Tu semana más baja en [category] en [X] meses!"
  - [x] Handle edge cases (first week, no data)

- [x] Task 3: Create PersonalRecordBanner component (AC: #3)
  - [x] Create `src/components/celebrations/PersonalRecordBanner.tsx`
  - [x] Trophy/medal icon with animation
  - [x] Record description text
  - [x] Dismiss button

- [x] Task 4: Implement record storage (AC: #4)
  - [x] Define PersonalRecord interface
  - [x] Store in Firestore personalRecords collection
  - [x] Include type, date, value, category

- [x] Task 5: Integrate with Celebration System (AC: #5)
  - [x] Trigger celebrateBig on new record
  - [x] Use CelebrationTrigger component
  - [x] Show banner after confetti

- [x] Task 6: Add cooldown logic (AC: #6)
  - [x] Maximum one record celebration per session
  - [x] Minimum 24h between same record type
  - [x] Store last celebration timestamp

- [x] Task 7: Write tests
  - [x] Test record detection algorithms (25 tests)
  - [x] Test storage operations
  - [x] Test cooldown logic
  - [x] Test PersonalRecordBanner component (15 tests)
  - [x] Test usePersonalRecords hook (6 tests)

## Dev Notes

### Record Types

```typescript
type PersonalRecordType =
  | 'lowest_category_week'
  | 'lowest_total_week'
  | 'consecutive_tracking_days'
  | 'first_under_budget'
  | 'savings_milestone';

interface PersonalRecord {
  id: string;
  type: PersonalRecordType;
  category?: string;  // For category-specific records
  value: number;
  previousBest?: number;
  achievedAt: Date;
  message: string;
}
```

### Detection Algorithm

```typescript
async function detectLowestCategoryWeek(
  userId: string,
  category: string,
  currentWeekTotal: number,
  lookbackMonths: number = 3
): Promise<PersonalRecord | null> {
  // Get historical weekly totals for category
  const historicalWeeks = await getWeeklyTotals(userId, category, lookbackMonths);

  if (historicalWeeks.length < 2) {
    return null; // Not enough data
  }

  const previousBest = Math.min(...historicalWeeks.map(w => w.total));

  if (currentWeekTotal < previousBest) {
    return {
      type: 'lowest_category_week',
      category,
      value: currentWeekTotal,
      previousBest,
      achievedAt: new Date(),
      message: `¡Tu semana más baja en ${category} en ${lookbackMonths} meses!`,
    };
  }

  return null;
}
```

### Banner Component

```typescript
interface PersonalRecordBannerProps {
  record: PersonalRecord;
  onDismiss: () => void;
}

const PersonalRecordBanner: React.FC<PersonalRecordBannerProps> = ({
  record,
  onDismiss,
}) => {
  return (
    <div className="personal-record-banner animate-slide-down">
      <div className="record-icon">🏆</div>
      <div className="record-content">
        <h3>¡Récord Personal!</h3>
        <p>{record.message}</p>
      </div>
      <button onClick={onDismiss}>✕</button>
    </div>
  );
};
```

### Integration with Insight Engine

Records can be registered as insight generators:

```typescript
// Add to insight generator registry
const personal_record: InsightGenerator = {
  name: 'personal_record',
  generate: async (context) => {
    const records = await detectAllRecords(context);
    if (records.length === 0) return null;

    return {
      type: 'personal_record',
      priority: 100,  // High priority
      content: records[0].message,
      metadata: { record: records[0] },
    };
  },
};
```

### Cooldown Storage

```typescript
interface RecordCooldowns {
  lastCelebration: Date | null;
  recordTypeCooldowns: Record<PersonalRecordType, Date>;
}

function canShowRecord(
  type: PersonalRecordType,
  cooldowns: RecordCooldowns
): boolean {
  // Max one celebration per session
  if (cooldowns.lastCelebration && isThisSession(cooldowns.lastCelebration)) {
    return false;
  }

  // 24h cooldown per record type
  const lastOfType = cooldowns.recordTypeCooldowns[type];
  if (lastOfType && hoursSince(lastOfType) < 24) {
    return false;
  }

  return true;
}
```

### References

- [Source: docs/sprint-artifacts/epic14/tech-context-epic14.md#Story 14.13]
- [Source: src/services/insightEngine.ts - Generator pattern]
- [Source: docs/uxui/voice-tone-guidelines.md#Celebrations]

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Insight Generation Flow (#5)**: Personal records are high-priority insights
- **Quick Save Flow (#6)**: Record check happens after save

### Downstream Effects to Consider

- Records feed into Achievement system (Epic 18)
- May need to expose records in Settings or Profile view
- Consider showing record history somewhere in the app

### Testing Implications

- **Existing tests to verify:** InsightEngine tests, generator tests
- **New scenarios to add:** Record detection, storage, cooldown logic

### Workflow Chain Visualization

```
[Transaction Save] → [Record Detection] → [THIS STORY: Celebration] → [Record Storage] → [Achievement History]
```

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. **Type definitions**: Created `src/types/personalRecord.ts` with:
   - `PersonalRecordType` union type for record types
   - `PersonalRecord` interface for detected records
   - `StoredPersonalRecord` interface for Firestore storage
   - `RecordCooldowns` interface for session/type cooldowns
   - `WeeklyTotal` and `RecordDetectionResult` helper types

2. **RecordsService**: Created `src/services/recordsService.ts` with:
   - ISO week calculation utilities (getCurrentWeekId, getWeekStart, getWeekEnd)
   - Weekly totals calculation (getWeeklyTotalsForCategory)
   - Record detection (detectLowestCategoryWeek, detectLowestTotalWeek, detectAllRecords)
   - Spanish message generation (generateRecordMessage)
   - Cooldown management (canShowRecord, getRecordCooldowns, setRecordCooldowns)
   - Firestore storage (storePersonalRecord, getRecentPersonalRecords, hasRecentSimilarRecord)
   - Main entry point (detectAndFilterRecords)

3. **PersonalRecordBanner**: Created `src/components/celebrations/PersonalRecordBanner.tsx` with:
   - Trophy icon from Lucide
   - Slide-down entry animation
   - Amber/gold gradient styling matching celebration theme
   - Auto-dismiss with configurable delay
   - Compact variant for inline use
   - Full accessibility support (role="status", aria-live)

4. **usePersonalRecords hook**: Created `src/hooks/usePersonalRecords.ts` with:
   - checkForRecords() for post-transaction detection
   - Integration with Celebration System via delayed banner display
   - Fire-and-forget Firestore storage
   - Week-based duplicate detection prevention

5. **Cooldown system**:
   - Session-based cooldown (max 1 celebration per 30-minute session)
   - Type-based cooldown (24 hours between same record type)
   - localStorage persistence

6. **Tests**: 46 tests total, all passing
   - recordsService.test.ts: 25 tests for detection, cooldowns, week calculations
   - PersonalRecordBanner.test.tsx: 15 tests for rendering, dismissal, animation
   - usePersonalRecords.test.ts: 6 tests for hook initialization and state management

### File List

**New Files:**
- `src/types/personalRecord.ts` - Type definitions
- `src/services/recordsService.ts` - Core service
- `src/components/celebrations/PersonalRecordBanner.tsx` - Banner component
- `src/hooks/usePersonalRecords.ts` - Integration hook
- `tests/unit/services/recordsService.test.ts` - Service tests
- `tests/unit/components/celebrations/PersonalRecordBanner.test.tsx` - Component tests
- `tests/unit/hooks/usePersonalRecords.test.ts` - Hook tests

**Modified Files:**
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status
- `docs/sprint-artifacts/epic14/stories/story-14.19-personal-records-detection.md` - This file
- `src/App.tsx` - Integrated usePersonalRecords hook and PersonalRecordBanner (code review fix)
- `src/components/celebrations/index.ts` - Added PersonalRecordBanner export (code review fix)

### Code Review Fixes (2026-01-12)

**HIGH-1**: Integrated `usePersonalRecords` hook into App.tsx
- Added import for hook and component
- Initialized hook with Firebase services
- Added useEffect to check for records when transactions change
- Rendered PersonalRecordBanner component

**HIGH-2**: Exported PersonalRecordBanner from celebrations module
- Added export to `src/components/celebrations/index.ts`

**MEDIUM-1**: Fixed act() warnings in tests
- Wrapped timer advances in `act()` blocks

**MEDIUM-2**: Added eslint-disable comment for intentional dependency omission
- handleDismiss intentionally omitted from auto-dismiss useEffect
