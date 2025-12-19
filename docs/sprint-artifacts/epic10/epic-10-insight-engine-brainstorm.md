# Epic 10 - Insight Engine Brainstorming Session

**Date:** 2025-12-17
**Facilitator:** Claude (Brainstorming Coach)
**Participant:** Gabe
**Focus Areas:** Insight Selection Logic, Data Requirements, New Insight Types, Technical Architecture
**Excluded:** UX Refinement (dedicated epic planned)

---

## Session Overview

This brainstorming session explored the foundation for Gastify's Insight Engine - a system designed to reveal "hidden knowledge" that users wouldn't notice on their own. The session used four techniques: First Principles Thinking, Mind Mapping, Five Whys, and SCAMPER for architecture.

---

## Technique 1: Data Requirements (First Principles)

### Core Philosophy
> "Every scan should reveal hidden knowledge - things the user wouldn't notice themselves"

### Key Decisions

1. **Cold Start Strategy**: Even with 1 transaction, provide transaction-intrinsic insights
2. **Fallback Message**: When no statistical insight available, show positive "building your profile" message
3. **All calculations derived from existing Epic 9 data** - no new data collection needed

### Available Data (from Epic 9)
- Transaction: timestamp, city, country
- Merchant: name, alias, learned categories
- Items: name, category, subcategory, price, quantity
- History: all previous transactions for pattern detection

---

## Technique 2: New Insight Types (Mind Mapping)

### Approved Insight Categories

#### Single Receipt Insights (Work with 1 transaction)
| Insight ID | Description | Trigger |
|------------|-------------|---------|
| `biggest_item` | Highlights most expensive item | Always available |
| `item_count` | Notes quantity of items | items > 5 |
| `unusual_hour` | Flags late-night/early purchases | hour < 6 or > 22 |
| `weekend_warrior` | Weekend shopping pattern | Saturday/Sunday |
| `new_merchant` | First time at this store | No prior transactions |
| `new_city` | Shopping in new location | City not in history |
| `category_variety` | Multiple categories in one receipt | categories > 3 |

#### Pattern Detection Insights (Need history)
| Insight ID | Description | Minimum Data |
|------------|-------------|--------------|
| `merchant_frequency` | "3rd visit this month to X" | 2+ visits |
| `category_trend` | Spending trend in category | 2+ weeks data |
| `day_pattern` | Consistent shopping day | 3+ same weekday |
| `time_pattern` | Consistent shopping time | 3+ similar times |
| `spending_velocity` | Rate of spending this week | 1+ week data |

#### Milestone Insights (Celebratory)
| Insight ID | Description | Trigger |
|------------|-------------|---------|
| `first_scan` | Welcome message | First ever scan |
| `scan_count_milestone` | 10th, 50th, 100th scan | Milestone counts |
| `week_streak` | Consecutive weeks scanning | 2+ weeks |
| `under_budget_category` | Spending less than usual | Category trend down |
| `savings_detected` | Found a deal/discount | Price comparison |

#### Quirky/Delightful Insights
| Insight ID | Description | Trigger |
|------------|-------------|---------|
| `late_night_snacker` | "Midnight munchies?" | Food purchase after 11pm |
| `coffee_counter` | Coffee purchase tracking | Coffee category |
| `treat_yourself` | Indulgence detection | Luxury/treat categories |
| `weather_shopper` | Seasonal pattern | Weather-correlated items |

### Rejected
- `receipt_type_first` - App designed for personal expenses only

### Cold Start Insights (Transaction-Intrinsic)
These work with ANY single transaction:
1. `biggest_item` - Always has a most expensive item
2. `item_count` - Can comment on basket size
3. `unusual_hour` - Time is always available
4. `new_merchant` - First transaction = first merchant
5. `category_variety` - Categories from OCR

### Building Profile Message
When no statistical insight available:
> "Estamos conociendo tus patrones de compra. Con unas semanas mas de datos, te mostraremos insights personalizados."

---

## Technique 3: Insight Selection Logic (Five Whys)

### Phase-Based Priority System

| Phase | Duration | Weekday Distribution | Weekend Distribution |
|-------|----------|---------------------|---------------------|
| **Phase 1** | Week 1 | 100% Quirky First | 100% Quirky First |
| **Phase 2** | Weeks 2-3 | 66% Celebratory / 33% Actionable | 66% Celebratory / 33% Actionable |
| **Phase 3** | 3+ weeks | 66% Actionable / 33% Celebratory | 66% Celebratory / 33% Actionable |

### 33/66 Sprinkle Distribution
- Every 3rd scan gets the "minority" insight type
- Counter resets weekly
- Ensures variety while maintaining phase priorities

### Selection Algorithm
```
function getInsightPriority(maturity, counter, isWeekend):
  if maturity == WEEK_1:
    return [QUIRKY_FIRST]

  if maturity == WEEKS_2_3:
    # Same pattern weekday and weekend
    if counter % 3 == 0:
      return [ACTIONABLE, CELEBRATORY, QUIRKY]
    else:
      return [CELEBRATORY, ACTIONABLE, QUIRKY]

  if maturity == MATURE:
    if isWeekend:
      if counter % 3 == 0:
        return [ACTIONABLE, CELEBRATORY, QUIRKY]
      else:
        return [CELEBRATORY, ACTIONABLE, QUIRKY]
    else: # Weekday
      if counter % 3 == 0:
        return [CELEBRATORY, ACTIONABLE, QUIRKY]
      else:
        return [ACTIONABLE, CELEBRATORY, QUIRKY]
```

### Cooldown Rules
- **No-Repeat Rule**: Same insight type has 1-week cooldown
- **Recent Insights**: Track last 30 insights shown
- **Fallback**: Always have "building profile" message available

---

## Technique 4: Two User Modes

### Real-Time Scanner Mode
- Scans receipts one at a time throughout the day
- **Insight Delivery**: Individual insight per scan
- **Feature**: "Silenciar 4h" option for trip/shopping spree mode
- **Behavior**: When silenced, queue insights for later summary

### Batch Scanner Mode
- Scans multiple receipts in one session
- **Insight Delivery**: Unified batch summary
- **Components**:
  1. **Batch Summary**: "Escaneaste 5 boletas por $XX,XXX"
  2. **Historical Comparison**: "vs semana pasada: +15% en supermercado"
  3. **Top Insight**: Most interesting insight from the batch

### Multi-Insight Handling
When multiple insights available:
- Show primary insight prominently
- "Ver mas" option reveals additional insights
- Max 3 insights shown to avoid overwhelm

---

## Technique 5: Technical Architecture (SCAMPER)

### Engine Location Decision
**Chosen: Client-Side First, Server-Side for Scheduled Reports**

| Component | Location | Rationale |
|-----------|----------|-----------|
| Real-time insights | Client (React) | Immediate feedback, offline capable |
| Pattern detection | Client (React) | Data already loaded |
| Scheduled reports | Server (Cloud Functions) | Background processing |
| Push notifications | Server (FCM) | Requires server trigger |

### Data Storage Decision
**Chosen: Firestore User Document + Local Cache Hybrid**

#### Firestore User Document Field
```typescript
interface UserInsightProfile {
  userId: string;
  firstTransactionDate: Timestamp;
  totalTransactions: number;
  weeksWithData: number;
  recentInsights: {
    insightId: string;
    shownAt: Timestamp;
    category: string;
  }[]; // Last 30 insights
}
```

#### Local Storage Cache
```typescript
interface LocalInsightCache {
  weekdayScanCount: number;
  weekendScanCount: number;
  lastCounterReset: string; // ISO date
  silencedUntil: string | null;
  pendingInsights: Insight[];
}
```

### Architecture Benefits
1. **Firestore**: Persists across devices, survives app reinstall
2. **Local Cache**: Fast access, handles offline, reduces reads
3. **Sync Strategy**: Update Firestore on significant events, local for counters

---

## Key Insights & Themes

### Recurring Themes
1. **Delight Over Data**: Prioritize surprising/delightful insights over dry statistics
2. **Progressive Engagement**: Start fun, evolve to actionable as trust builds
3. **No Shame**: Never punish overspending, always frame positively
4. **Hidden Knowledge**: Show what users couldn't see themselves

### Design Principles Emerged
1. Every transaction has something interesting to say
2. Phase-based engagement respects user journey
3. Variety prevents fatigue (sprinkle system)
4. Two modes serve different user behaviors

### Questions for Architecture Session
1. How to efficiently calculate pattern insights client-side?
2. Firestore document structure for insight history?
3. Service worker integration for offline insights?
4. Testing strategy for phase-based logic?

---

## Action Items

| Priority | Item | Target |
|----------|------|--------|
| P0 | Define InsightEngine service interface | Story 10.1 |
| P0 | Implement phase detection logic | Story 10.2 |
| P0 | Create transaction-intrinsic insights | Story 10.3 |
| P1 | Build pattern detection insights | Story 10.4 |
| P1 | Implement selection algorithm with sprinkle | Story 10.5 |
| P2 | Add batch mode summary | Story 10.6 |
| P2 | Server-side scheduled reports | Story 10.7 |

---

## Session Metadata

- **Techniques Used**: First Principles, Mind Mapping, Five Whys, SCAMPER
- **Duration**: ~90 minutes
- **Ideas Generated**: 25+ insight types, 2 user modes, complete selection algorithm
- **Next Step**: Architecture session to formalize technical design
