# Story 14.19: Personal Records Detection

**Status:** ready-for-dev
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

- [ ] Task 1: Create RecordsService (AC: #1)
  - [ ] Create `src/services/recordsService.ts`
  - [ ] Define record types (lowest_week, consecutive_days, etc.)
  - [ ] Implement detection algorithms
  - [ ] Export detection functions

- [ ] Task 2: Implement lowest category detection (AC: #2)
  - [ ] Compare current week to historical weeks
  - [ ] Track per-category weekly totals
  - [ ] Generate message: "Tu semana más baja en [category] en [X] meses!"
  - [ ] Handle edge cases (first week, no data)

- [ ] Task 3: Create PersonalRecordBanner component (AC: #3)
  - [ ] Create `src/components/celebrations/PersonalRecordBanner.tsx`
  - [ ] Trophy/medal icon with animation
  - [ ] Record description text
  - [ ] Dismiss button

- [ ] Task 4: Implement record storage (AC: #4)
  - [ ] Define PersonalRecord interface
  - [ ] Store in Firestore personalRecords collection
  - [ ] Include type, date, value, category

- [ ] Task 5: Integrate with Celebration System (AC: #5)
  - [ ] Trigger celebrateBig on new record
  - [ ] Use CelebrationTrigger component
  - [ ] Show banner after confetti

- [ ] Task 6: Add cooldown logic (AC: #6)
  - [ ] Maximum one record celebration per session
  - [ ] Minimum 24h between same record type
  - [ ] Store last celebration timestamp

- [ ] Task 7: Write tests
  - [ ] Test record detection algorithms
  - [ ] Test storage operations
  - [ ] Test cooldown logic

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

_To be filled by dev agent_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
