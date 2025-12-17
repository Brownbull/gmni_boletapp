# Architecture - Epic 10: Insight Engine

## Executive Summary

This architecture document defines the technical decisions for Epic 10's Insight Engine - transforming Boletapp from a "data entry tool" into a "financial awareness companion." The engine reveals "hidden knowledge" that users wouldn't notice themselves, delivered through a phase-based priority system that evolves with user maturity.

**Key Innovation:** Every scan reveals something interesting - even the first transaction. The system uses transaction-intrinsic insights for cold start, progressing to pattern-based insights as data accumulates. A 33/66 "sprinkle" distribution ensures variety while respecting the user's journey phase.

**Critical Risk Identified (Pre-mortem):** The #1 failure mode is "Insight Fatigue" - where users ignore insights due to repetition or irrelevance. This architecture prioritizes **variety scoring**, **robust cooldowns**, and **graceful fallbacks**.

## Project Context

This is a **brownfield project extension** for Boletapp, adding an Insight Engine to Epic 10.
The existing codebase (Epics 1-9) provides:

- **Transaction data model** with v2.6.0 fields (time, city, country, currency, receiptType)
- **React Context patterns** (AnalyticsContext, HistoryFiltersContext)
- **Services architecture** (firestore.ts, *MappingService.ts)
- **Hooks architecture** (useTransactions, useCategoryMappings, etc.)
- **Firebase backend** (Firestore, Auth, Storage, FCM)

**Epic 10 Focus Areas (from brainstorming):**
- Insight selection logic with phase-based priorities
- Data requirements using existing Transaction data
- 25+ new insight types across 4 categories
- Technical architecture: Client-side first, hybrid storage

### Critical Architectural Safeguards (from Pre-mortem)
1. **Insight generation MUST NOT block transaction save** - async/background
2. **Fallback chain**: Try insight → "building profile" → Never show nothing
3. **Sync validation on app startup** - reconcile local cache with Firestore
4. **Performance budget**: Insight calculation <100ms client-side
5. **Web Worker** for pattern detection when transactions >200

### State Ownership (from Devil's Advocate)
- **Firestore owns**: recentInsights[], firstTransactionDate, profile metadata
- **Local owns**: scanCounters, silencedUntil, pendingInsights queue
- **Sync rule**: On app load, Firestore wins; during session, local is source of truth

### UX Timing (from Journey Map)
- Insight appears AFTER save confirmation, not before
- User's primary goal is "save receipt" - insight is bonus
- "Ver más" for additional insights, quick dismiss option

## Project Initialization

**Not Applicable - Brownfield Project**

This is an existing production application. No starter template needed. The codebase is already established with React 18 + TypeScript + Vite + Firebase.

## Decision Categories

### CRITICAL (Design carefully - hard to change later)
1. **Data Storage Schema** - Firestore UserInsightProfile + localStorage cache structure
   - Risk: HIGH - migration pain if wrong
   - Approach: Design for extensibility, version the schema

### IMPORTANT (Follow existing patterns)
2. **Insight Service Interface** - Functional module matching existing *Service.ts pattern
   - Risk: MEDIUM - can refactor if needed
   - Approach: Pure functions, stateless, easy to test

### IMPLEMENTATION DETAILS (Not architectural decisions)
3. **Insight Type Organization** - Simple TypeScript object map (not a "registry pattern")
4. **Phase Detection** - Utility function with configurable thresholds
5. **Selection Algorithm** - Function in service with logging for tuning
6. **Web Worker** - YAGNI - defer until performance proves necessary

### DEFERRED (Out of scope for Epic 10 Phase 1)
7. **Batch Mode Server-Side** - Story 10.7, implement when needed
8. **Push Notification Integration** - Requires FCM, separate concern

## Decision Summary

| # | Category | Decision | Affects Stories | Rationale |
|---|----------|----------|-----------------|-----------|
| 1 | Data Storage | Firestore `insightProfile` + localStorage cache | 10.1, 10.2, 10.5 | Hybrid: durable profile + fast local counters |
| 2 | Service Pattern | Functional module `insightEngineService.ts` | 10.1-10.6 | Matches existing *Service.ts pattern, pure functions |
| 3 | Entry Point | Single `generateInsightForTransaction()` | 10.3, 10.4 | Clear API for AI agents, one function to call |
| 4 | Execution Model | Async side-effect after save | 10.3 | Never block transaction save flow |
| 5 | Performance | Pre-compute aggregates on app load | 10.4 | Stay within 100ms budget per insight |

## Architectural Decisions Detail

### Decision 1: Data Storage Schema (CRITICAL)

**Firestore Document: `users/{userId}/insightProfile`**
```typescript
interface UserInsightProfile {
  schemaVersion: 1;                    // For future migrations
  firstTransactionDate: Timestamp;     // Phase calculation
  totalTransactions: number;           // Quick access, no need to count
  recentInsights: InsightRecord[];     // Last 30, for cooldown checking
}

interface InsightRecord {
  insightId: string;                   // e.g., "merchant_frequency"
  shownAt: Timestamp;
  transactionId?: string;              // Which transaction triggered it
}
```

**localStorage Key: `boletapp_insight_cache`**
```typescript
interface LocalInsightCache {
  weekdayScanCount: number;            // For sprinkle distribution
  weekendScanCount: number;
  lastCounterReset: string;            // ISO date, reset weekly
  silencedUntil: string | null;        // "Silenciar 4h" feature
  precomputedAggregates?: {            // Performance optimization
    merchantVisits: Record<string, number>;
    categoryTotals: Record<string, number>;
    computedAt: string;
  };
}
```

### Decision 2: Service Interface (IMPORTANT)

**Single Entry Point Pattern:**
```typescript
// src/services/insightEngineService.ts

// Main entry point - called after transaction save
export async function generateInsightForTransaction(
  transaction: Transaction,
  allTransactions: Transaction[],
  profile: UserInsightProfile,
  cache: LocalInsightCache
): Promise<Insight | null>

// Support functions (exported for testing)
export function calculateUserPhase(profile: UserInsightProfile): UserPhase
export function selectInsight(candidates: Insight[], profile: UserInsightProfile, cache: LocalInsightCache): Insight | null
export function checkCooldown(insightId: string, recentInsights: InsightRecord[]): boolean
```

### Decision 3: Side-Effect Execution Model

```
ScanView.tsx (after successful save)
    │
    ├── 1. await addTransaction(tx)           // Primary flow - MUST succeed
    │       └── ✅ "Guardado!" toast shown
    │
    └── 2. generateInsightForTransaction(tx)  // Side effect - fire and forget
            │
            ├── Success → 💡 InsightCard slides up
            └── Failure → 📊 "Construyendo tu perfil..." fallback
```

**Key Principle:** Transaction save is the user's goal. Insight is a bonus. Never let insight generation failure affect the save flow.

## Service Blueprint

```
CUSTOMER ACTIONS (User)
────────────────────────────────────────────────────────────────────────────────
  📷 Scan       →    ✅ Save        →    👀 See Insight    →    👆 Interact
  Receipt            Transaction          Card                   (dismiss/more)

FRONTSTAGE (UI Layer)
────────────────────────────────────────────────────────────────────────────────
  ScanView      →    "Guardado!"    →    InsightCard       →    InsightModal
  Camera UI          toast               slides up              (if "Ver más")

LINE OF VISIBILITY ═══════════════════════════════════════════════════════════

BACKSTAGE (Service Layer)
────────────────────────────────────────────────────────────────────────────────
  gemini.ts     →    firestore.ts   →    insightEngine     →    Update cache
  AI extraction      addTransaction()     Service.ts            + Firestore

SUPPORT PROCESSES (Data Layer)
────────────────────────────────────────────────────────────────────────────────
  Gemini API         Firestore           localStorage           Firestore
  (external)         transactions/       insightCache           insightProfile
```

## Project Structure

```
boletapp/
├── src/
│   ├── components/
│   │   └── insights/                    # NEW: Insight UI components
│   │       ├── InsightCard.tsx          # Main insight display card
│   │       ├── InsightModal.tsx         # "Ver más" expanded view
│   │       └── BuildingProfileCard.tsx  # Fallback message component
│   ├── services/
│   │   ├── firestore.ts                 # EXISTING
│   │   ├── insightEngineService.ts      # NEW: Core insight logic
│   │   ├── insightProfileService.ts     # NEW: Firestore profile CRUD
│   │   └── insightCacheService.ts       # NEW: localStorage cache
│   ├── hooks/
│   │   ├── useTransactions.ts           # EXISTING
│   │   └── useInsightProfile.ts         # NEW: Load/sync profile
│   ├── types/
│   │   ├── transaction.ts               # EXISTING
│   │   └── insight.ts                   # NEW: Insight type definitions
│   ├── utils/
│   │   └── insightGenerators.ts         # NEW: Individual insight functions
│   └── views/
│       └── ScanView.tsx                 # MODIFY: Add insight generation
├── tests/
│   └── unit/
│       └── insights/                    # NEW: Insight engine tests
│           ├── insightEngineService.test.ts
│           ├── phaseCalculation.test.ts
│           └── insightGenerators.test.ts
└── docs/
    └── planning/
        ├── architecture-epic10-insight-engine.md  # THIS DOCUMENT
        └── epic-10-insight-engine-brainstorm.md   # Brainstorming results
```

## Story to Architecture Mapping

| Story | Components/Files | Responsibility |
|-------|------------------|----------------|
| **10.1** InsightEngine Service Interface | `types/insight.ts`, `services/insightEngineService.ts` | Core types, main entry point |
| **10.2** Phase Detection Logic | `insightEngineService.ts` | `calculateUserPhase()` function |
| **10.3** Transaction-Intrinsic Insights | `utils/insightGenerators.ts` | 7 cold-start insight generators |
| **10.4** Pattern Detection Insights | `utils/insightGenerators.ts` | 5 history-based generators |
| **10.5** Selection Algorithm + Sprinkle | `insightEngineService.ts` | `selectInsight()` with priority logic |
| **10.6** Batch Mode Summary | `components/insights/BatchSummary.tsx` | Unified batch insight display |
| **10.7** Server-Side Reports | `functions/scheduledInsights.ts` | Cloud Function (deferred) |

## Technology Stack Details

### Core Technologies

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React | 18.3.1 | UI Framework | Existing |
| TypeScript | 5.3.3 | Type Safety | Existing |
| Firebase Firestore | 10.14.1 | Profile persistence | Existing |
| localStorage | Browser API | Fast cache | Existing |
| Vite | 5.4.0 | Build Tool | Existing |

### Integration Points

**Data Flow:**
```
useTransactions (Existing)
    → insightEngineService.ts (NEW)
    → InsightCard component (NEW)
    → User sees insight
```

**Storage Integration:**
- **Firestore**: New collection `users/{userId}/insightProfile` (single document)
- **localStorage**: New key `boletapp_insight_cache`
- **Sync**: On app load, merge Firestore → localStorage

## Novel Pattern: Phase-Based Insight Selection

This is the key innovation of Epic 10 - a selection system that evolves with user maturity.

### Phase Definitions

```typescript
// types/insight.ts

type UserPhase = 'WEEK_1' | 'WEEKS_2_3' | 'MATURE';

type InsightCategory = 'QUIRKY_FIRST' | 'CELEBRATORY' | 'ACTIONABLE';

interface Insight {
  id: string;                          // e.g., "merchant_frequency"
  category: InsightCategory;
  title: string;                       // e.g., "Visita frecuente"
  message: string;                     // e.g., "3ra vez en Jumbo este mes"
  icon?: string;                       // Lucide icon name
  priority: number;                    // For tie-breaking (higher = better)
  transactionId?: string;              // Which transaction triggered it
}
```

### Selection Algorithm

```typescript
// insightEngineService.ts

function getInsightPriority(
  phase: UserPhase,
  scanCounter: number,
  isWeekend: boolean
): InsightCategory[] {
  if (phase === 'WEEK_1') {
    return ['QUIRKY_FIRST'];
  }

  if (phase === 'WEEKS_2_3') {
    // Same pattern weekday and weekend
    return scanCounter % 3 === 0
      ? ['ACTIONABLE', 'CELEBRATORY', 'QUIRKY_FIRST']
      : ['CELEBRATORY', 'ACTIONABLE', 'QUIRKY_FIRST'];
  }

  // MATURE phase
  if (isWeekend) {
    return scanCounter % 3 === 0
      ? ['ACTIONABLE', 'CELEBRATORY', 'QUIRKY_FIRST']
      : ['CELEBRATORY', 'ACTIONABLE', 'QUIRKY_FIRST'];
  } else {
    return scanCounter % 3 === 0
      ? ['CELEBRATORY', 'ACTIONABLE', 'QUIRKY_FIRST']
      : ['ACTIONABLE', 'CELEBRATORY', 'QUIRKY_FIRST'];
  }
}
```

### Insight Generators Map

```typescript
// utils/insightGenerators.ts

interface InsightGenerator {
  id: string;
  category: InsightCategory;
  canGenerate: (tx: Transaction, history: Transaction[]) => boolean;
  generate: (tx: Transaction, history: Transaction[]) => Insight;
}

export const INSIGHT_GENERATORS: Record<string, InsightGenerator> = {
  // Single Receipt (Cold Start)
  biggest_item: { /* ... */ },
  item_count: { /* ... */ },
  unusual_hour: { /* ... */ },
  weekend_warrior: { /* ... */ },
  new_merchant: { /* ... */ },
  new_city: { /* ... */ },
  category_variety: { /* ... */ },

  // Pattern Detection
  merchant_frequency: { /* ... */ },
  category_trend: { /* ... */ },
  day_pattern: { /* ... */ },
  spending_velocity: { /* ... */ },

  // Milestones
  first_scan: { /* ... */ },
  scan_count_milestone: { /* ... */ },
  week_streak: { /* ... */ },
  under_budget_category: { /* ... */ },

  // Quirky
  late_night_snacker: { /* ... */ },
  coffee_counter: { /* ... */ },
  treat_yourself: { /* ... */ },
};
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Pattern 1: Insight Generator Pattern

All insight generators follow this structure:

```typescript
// CORRECT - Follow this pattern
const merchantFrequencyGenerator: InsightGenerator = {
  id: 'merchant_frequency',
  category: 'ACTIONABLE',
  canGenerate: (tx, history) => {
    const visits = history.filter(h => h.merchant === tx.merchant).length;
    return visits >= 2;  // Need 2+ visits
  },
  generate: (tx, history) => {
    const visits = history.filter(h => h.merchant === tx.merchant).length + 1;
    return {
      id: 'merchant_frequency',
      category: 'ACTIONABLE',
      title: 'Visita frecuente',
      message: `${visits}ª vez en ${tx.merchant} este mes`,
      priority: visits,  // More visits = higher priority
    };
  },
};
```

### Pattern 2: Fallback Chain Pattern

Always have a fallback:

```typescript
// In generateInsightForTransaction()
const insight = selectInsight(candidates, profile, cache);

if (insight) {
  return insight;
}

// Fallback to "building profile" message
return {
  id: 'building_profile',
  category: 'QUIRKY_FIRST',
  title: 'Construyendo tu perfil',
  message: 'Con más datos, te mostraremos insights personalizados.',
  priority: 0,
};
```

### Pattern 3: Async Side-Effect Pattern

Never block the save flow:

```typescript
// In ScanView.tsx - CORRECT
const handleSave = async () => {
  // Primary flow - must succeed
  await addTransaction(db, userId, appId, transaction);
  setShowSavedToast(true);

  // Side effect - fire and forget
  generateInsightForTransaction(transaction, transactions, profile, cache)
    .then(insight => setCurrentInsight(insight))
    .catch(() => setCurrentInsight(FALLBACK_INSIGHT));
};
```

## Consistency Rules

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Insight IDs | snake_case | `merchant_frequency`, `biggest_item` |
| Generator functions | camelCase | `generateMerchantFrequency()` |
| Type interfaces | PascalCase | `UserInsightProfile`, `InsightRecord` |
| Service files | camelCase + Service | `insightEngineService.ts` |
| Component files | PascalCase | `InsightCard.tsx` |
| localStorage keys | snake_case with prefix | `boletapp_insight_cache` |

### Code Organization

**File Structure for Insight Components:**
```
src/components/insights/InsightCard.tsx      # Component
tests/unit/insights/InsightCard.test.tsx     # Unit tests
```

**Import Order:**
1. React imports
2. Third-party imports (lucide-react, etc.)
3. Type imports
4. Service imports
5. Utility imports
6. Relative imports

### Error Handling

| Scenario | Strategy | User Feedback |
|----------|----------|---------------|
| No candidates available | Return fallback insight | "Construyendo tu perfil..." |
| Profile load fails | Use empty profile, create on first save | Silent - no error shown |
| Cache corrupted | Reset cache to defaults | Silent - no error shown |
| Generator throws | Skip that generator, try others | Silent - try next insight |

### Logging Strategy

| Level | Use For | Example |
|-------|---------|---------|
| `console.debug` | Insight selection decisions | "Selected: merchant_frequency (priority 3)" |
| `console.warn` | Fallback triggered | "No insights available, showing fallback" |
| `console.error` | Unexpected errors | "Generator threw: ..." |
| No logging | Normal operations | Successful insight generation |

**Tuning Mode:** Add `?insightDebug=true` URL param to enable verbose logging for selection algorithm tuning.

## Data Architecture

### Firestore Schema

**Collection:** `artifacts/{appId}/users/{userId}/insightProfile` (single document)

```typescript
{
  schemaVersion: 1,
  firstTransactionDate: Timestamp,
  totalTransactions: number,
  recentInsights: [
    { insightId: "merchant_frequency", shownAt: Timestamp, transactionId: "abc123" },
    { insightId: "biggest_item", shownAt: Timestamp, transactionId: "def456" },
    // ... last 30
  ]
}
```

### localStorage Schema

**Key:** `boletapp_insight_cache`

```typescript
{
  weekdayScanCount: 5,
  weekendScanCount: 2,
  lastCounterReset: "2025-12-16",
  silencedUntil: null,
  precomputedAggregates: {
    merchantVisits: { "Jumbo": 3, "Lider": 2 },
    categoryTotals: { "Supermarket": 45000, "Restaurant": 12000 },
    computedAt: "2025-12-17T10:00:00Z"
  }
}
```

### Data Relationships

```
Transaction (existing)
    │
    ├── triggers → InsightEngine
    │                   │
    │                   ├── reads → UserInsightProfile (Firestore)
    │                   ├── reads → LocalInsightCache (localStorage)
    │                   └── produces → Insight
    │
    └── aggregated by → precomputedAggregates (localStorage)
```

## Security Architecture

**No changes to existing security model:**

- Firestore rules: User data isolation maintained (user can only read/write own insightProfile)
- No new API endpoints
- All insight generation is client-side
- No sensitive data in insights (just transaction references)

**New Firestore Rule (add to existing):**
```
match /artifacts/{appId}/users/{userId}/insightProfile {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Performance Considerations

| Concern | Solution | Target |
|---------|----------|--------|
| Insight calculation time | Pre-compute aggregates on app load | <100ms per insight |
| History filtering | Use cached aggregates, not full scan | <30ms for pattern detection |
| Firestore reads | Load profile once, cache in React state | 1 read per session |
| localStorage access | Sync reads, fast | <5ms |
| Re-renders | Memoize insight components | No unnecessary re-renders |

### Performance Budget

```
Total insight generation: <100ms
├── Phase calculation:     <5ms   (date math)
├── Candidate generation: <50ms   (run generators)
├── Selection algorithm:  <20ms   (cooldown check, priority sort)
├── Cache update:         <10ms   (localStorage write)
└── Buffer:               15ms
```

## Deployment Architecture

**Unchanged from existing:**
- Firebase Hosting (existing)
- GitHub Actions CI/CD (existing)
- No new infrastructure for Epic 10 Phase 1

**Future (Story 10.7):**
- Cloud Functions for scheduled insight reports
- FCM integration for push notifications

## Development Environment

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Firebase CLI
- Git

### Setup Commands

```bash
# Clone and install (if not already set up)
git clone https://github.com/Brownbull/gmni_boletapp.git
cd boletapp
npm install

# Run development server
npm run dev

# Run tests
npm run test:all

# Run insight-specific tests
npm run test -- --grep "insight"
```

## Architecture Decision Records (ADRs)

### ADR-015: Client-Side Insight Engine

**Status:** Accepted
**Date:** 2025-12-17

**Context:**
Epic 10 requires generating insights after each transaction save. Options: client-side, server-side, or hybrid.

**Decision:**
Client-side first, with server-side deferred to Story 10.7 for scheduled reports.

**Rationale:**
- Immediate feedback (no network latency)
- Works offline
- Scales to zero cost (no cloud functions running)
- User data stays on device for privacy

**Consequences:**
- (+) Fast, offline-capable
- (+) No additional infrastructure
- (-) Heavy calculations could impact mobile performance
- (-) Must implement Web Worker if needed (YAGNI for now)

---

### ADR-016: Hybrid Storage (Firestore + localStorage)

**Status:** Accepted
**Date:** 2025-12-17

**Context:**
Insight profile needs to persist across devices but also support fast, frequent updates (scan counters).

**Decision:**
- **Firestore**: Durable profile (recentInsights, firstTransactionDate)
- **localStorage**: Ephemeral cache (counters, precomputed aggregates)

**Rationale:**
- Firestore for what matters long-term (cooldown history)
- localStorage for what changes frequently (counters reset weekly anyway)
- Reduces Firestore read/write costs

**Consequences:**
- (+) Fast local access for frequent operations
- (+) Survives app reinstall via Firestore
- (-) Must handle sync on app load
- (-) Two sources of truth (mitigated by clear ownership rules)

---

### ADR-017: Phase-Based Priority System

**Status:** Accepted
**Date:** 2025-12-17

**Context:**
Users have different needs at different stages of their journey. Week 1 users need delight; mature users need actionable insights.

**Decision:**
Three phases (Week 1, Weeks 2-3, Mature) with different insight category priorities and a 33/66 "sprinkle" distribution for variety.

**Rationale:**
- Respects user journey (fun first, actionable later)
- Prevents fatigue through variety
- Weekday/weekend differentiation matches user mindset

**Consequences:**
- (+) Personalized experience that evolves
- (+) Prevents "same insight every time" fatigue
- (-) More complex selection logic
- (-) Thresholds may need tuning (make configurable)

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-12-17_
_For: Gabe_
