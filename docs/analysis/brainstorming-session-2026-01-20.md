---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: 'BoletApp Epic 14c/14d Reset - Strategic Architecture & Refactoring'
session_goals: 'Define cleanup scope (14c-refactor), design shared groups v2 with deletion strategy (14d), establish sync infrastructure (soft delete + tiered caching)'
selected_approach: 'ai-recommended'
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Gabe
**Date:** 2026-01-20

## Session Overview

**Topic:** BoletApp Epic 14c/14d Reset - Strategic Architecture & Refactoring
**Goals:**
- Define 14c-refactor cleanup scope
- Design shared groups v2 with deletion strategy (14d)
- Establish sync infrastructure (soft delete, tiered caching)

### Context Guidance

_Post-retrospective reset session following Epic 14c challenges. Focus on learning from past complexity to build simpler, more robust architecture._

### Session Setup

_Strategic architecture planning session using AI-recommended techniques optimized for post-mortem learning and forward architecture design._

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Architecture reset with focus on learning from Epic 14c and designing robust shared groups v2

**Recommended Techniques:**

1. **Assumption Reversal:** Clear faulty assumptions from Epic 14c before rebuilding
2. **First Principles Thinking:** Establish core architectural primitives from fundamental truths
3. **Morphological Analysis:** Systematically explore deletion strategy and sync infrastructure options
4. **Chaos Engineering:** Stress-test designs against failure scenarios

**AI Rationale:** This sequence moves from clearing past assumptions → establishing truths → exploring options systematically → validating robustness. Perfect for post-retrospective architecture reset.

---

## Technique Execution Results

### Technique 1: Assumption Reversal

**Focus:** Identify and flip faulty assumptions from Epic 14c

#### Assumptions Identified and Reversed

| Original Assumption | Reality | Flip |
|---------------------|---------|------|
| "We must read the whole group each time" | Groups grow exponentially (users × transactions), expensive at scale | Never read whole group - use tiered caching and pagination |
| "Delta sync is easy to manage" | Created synchronization nightmares, can't detect removals | Use change feed with explicit events instead |
| "Iteration will find the answer" | Multiple approaches caused more harm | Commit to ONE simple approach |
| "Real-time sync should be automatic and invisible" | Complex, error-prone, cost explosion | User-controlled sync with visible buttons |
| "Label changes sync like field updates" | Label removal = visibility change, not just update | Explicit server-side events for label changes |

#### Key Insight: The Real Bug

**Not deletion - it's group label removal and sync propagation.**

When transaction owner removes group label:
- Owner sees: transaction gone from group ✓
- Other members see: transaction STILL in group ✗

**Root cause:** Delta sync query `where('sharedGroupIds', 'array-contains', groupId)` cannot detect when transaction is REMOVED from the array.

---

### Breakthrough Ideas Generated

#### [Sync #1]: Two-Button Tiered Refresh
- Quick sync (90-day window, short cooldown: 1min ×3, then 15min, resets daily)
- Full sync (2-year fetch, longer cooldown, in Settings)
- User controls when sync happens

#### [Cache #1]: Two-Tier Transaction Storage
| Tier | Scope | Storage | Refresh |
|------|-------|---------|---------|
| Hot | Last 90 days | Device cache | Manual button |
| Warm | 90 days - 2 years | Device persistent | Settings button (incremental) |
| Beyond 2 years | Blocked | No access in shared groups |

#### [Analytics #1]: Debounced Aggregate Recalculation
- Transaction change detected → identify affected periods
- Start 1-hour debounce timer (group-level, visible to all members)
- Batch recalculate after hour
- Owner can force recalculate (3x/day, 5min cooldown)
- Owner can cancel pending recalculation

#### [Analytics #2]: Server-Computed Aggregates
```
/groups/{groupId}/analytics/
  ├── weekly/2026-W03
  ├── monthly/2026-01
  ├── quarterly/2026-Q1
  └── yearly/2026
```

Fields per period:
- totalSpent, totalIncome, netBalance, transactionCount
- byCategory: total, count, average, min, max per category
- byCategoryGroup: aggregates by category groups
- byMember: spending per group member
- insights: highest/lowest/average/median (amounts only, no merchant names)

**Privacy constraint:** NO merchant names, NO item names in analytics.

#### [Sync #4]: Change Feed Instead of Delta Sync
```
/groups/{groupId}/changeFeed/
  └── latestChangeAt: timestamp
  └── changes: [
        { type: "added", txnId: "xxx", data: {...}, at: timestamp },
        { type: "removed", txnId: "yyy", at: timestamp },
        { type: "edited", txnId: "zzz", data: {...}, at: timestamp }
      ]
```

Server writes events via Firestore trigger when:
- Transaction added to group (label added)
- Transaction removed from group (label removed)
- Transaction edited (while in group)
- Transaction deleted entirely

#### [Sync #5]: Hybrid Playback + Recovery
- **Normal sync (90-day button):** Fetch change feed, apply incrementally (cheap)
- **Recovery sync (Settings button):** Full 2-year fetch, replace cache entirely (expensive but guaranteed correct)

#### [Sync #6]: Poll-Based Badge Detection
- On app open: fetch `changeFeed.latestChangeAt` for each group
- Compare to local `lastSyncedAt`
- If newer → show red dot on sync button
- No persistent listeners (simplicity first)

---

### Decisions Locked

| Component | Decision |
|-----------|----------|
| Change detection | Poll on app open, compare timestamps |
| Badge indicator | Red dot only (no count) |
| Normal sync (90-day) | Change feed playback (cheap) |
| Recovery sync (2-year) | Full fetch, replace cache (expensive) |
| Server-side | Firestore trigger writes add/remove/edit events |
| Listeners | None for now (poll only) |
| Aggregates | Server-computed, group-level, 1-hour debounce |
| Analytics privacy | No merchant/item names, only categories and amounts |

---

### Technique 2: First Principles Thinking

**Focus:** Establish irreducible truths as bedrock for Epic 14d architecture

#### Domain 1: Firestore Constraints (Technical Bedrock)

| Truth | Implication |
|-------|-------------|
| Reads cost $0.06 per 100K | Every query design is a cost decision |
| Writes cost $0.18 per 100K | Server-side triggers add write costs |
| `array-contains` cannot detect removals | Must use explicit removal events |
| Queries are shallow (no joins) | Denormalization or multiple queries required |
| Listeners maintain open connections | Battery/data cost when active |
| Offline persistence exists | Can work with stale data |
| Security rules are per-document | Can't query across groups in single call |

#### Domain 2: Ownership Model (Business Logic Bedrock)

| Truth | Implication |
|-------|-------------|
| Transaction owner = creator only | Only creator can edit/delete/change labels |
| Ownership is permanent | Cannot transfer (except on account deletion) |
| Group owner ≠ Transaction owner | Different concepts, different permissions |
| Group owner cannot remove others' transactions | Can only manage their own transactions |
| Account deletion transfers ownership | Passes to next registered user in group |
| No remaining users = group deleted | Cascade deletion on last user |

#### Domain 3: User Needs (Product Bedrock)

| Truth | Implication |
|-------|-------------|
| Users track shared household expenses | Core use case is financial visibility |
| Users need to know when money-affecting changes happen | Notifications essential |
| Analytics/graphs are core value | Pre-computed aggregates justified |
| Historical access needed (up to 2 years) | Can't just cache recent data |
| Yearly reports and insights planned | Need yearly aggregate data |
| Privacy: no merchant/item names in analytics | Categories only |

#### Domain 4: Epic 14c Learnings (Proven Truths)

| Truth | How We Know |
|-------|-------------|
| Delta sync cannot detect removals | Core bug that caused failure |
| Single-operation tests give false confidence | "Works first time, fails second" pattern |
| Multiple iterations cause more harm | Retrospective finding |
| `refetchOnMount: true` = cost explosion | Projected costs unsustainable |
| Multi-layer caching gets out of sync | React Query + IndexedDB + Firestore conflicted |

#### Domain 5: Business Constraints (Operational Bedrock)

| Constraint | Value |
|------------|-------|
| Max groups per user | 5 |
| Max contributors per group | 10 |
| Max viewers per group | 200 |
| Transaction history | 2 years |
| Beyond 2 years | Blocked |

#### Architectural Primitives (Derived from First Principles)

1. **Change Feed is Source of Sync Truth** - Server writes explicit events, client consumes
2. **User Controls Sync Timing** - Manual buttons, no invisible auto-sync
3. **Two-Tier Cache Architecture** - Hot (90 days) + Warm (90 days - 2 years)
4. **Aggregates Are Separate Data Stream** - Server-computed, debounced, independent refresh
5. **Transaction Ownership is Immutable** - Creator owns forever (except account deletion cascade)

---

### Research Integration: Industry Best Practices

**Sources:** Analysis of Splitwise, Settle Up, YNAB, Linear, Figma architectures

#### Key Industry Finding: Simple Patterns Beat Complex Ones

| App | Sync Technology | Deletion Handling |
|-----|-----------------|-------------------|
| Splitwise | Custom queue-based (Ruby/Rails) | Soft delete with relationship checks |
| Settle Up | Firebase Realtime Database | Firebase's built-in deletion events |
| YNAB | Custom TypeScript SDK + Rails API | Shared account eliminates conflicts |
| Linear | PostgreSQL + WebSocket delta sync | Tombstone records with `syncId` ordering |

**Critical Insight:** Linear and Figma DON'T use CRDTs. Simple patterns (soft deletes + timestamp sync) work better for structured data than complex distributed systems techniques.

#### Recommended Pattern from Research

**Soft Delete + Changelog Subcollection + Timestamp-Based Sync**

```
/groups/{groupId}/
    transactions/{transactionId}     // Current state (with soft delete fields)
    changelog/{changeId}             // Event log SUBCOLLECTION (not array)
```

#### Architecture Updates Based on Research

| Original Proposal | Research Recommendation | Decision |
|-------------------|-------------------------|----------|
| Changelog as array in single doc | Changelog as subcollection | ✅ **Change to subcollection** |
| No soft delete fields | Add `deletedAt`, `updatedAt`, `version` | ✅ **Add soft delete** |
| 1-hour debounce for all analytics | 30-sec for most, hourly for median | ✅ **Refine debounce** |
| Poll changelog only | Query both transactions + changelog | ✅ **Dual query** |
| No pruning strategy | 30-day TTL auto-delete on changelog | ✅ **Add TTL pruning** |

#### Revised Transaction Document Structure

```javascript
{
  id: "tx-123",
  amount: 50,
  description: "Dinner",
  groupId: "group-abc",
  sharedGroupIds: ["group1", "group2"],
  ownerId: "user-1",
  category: "food",

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,      // Update on EVERY change

  // Soft delete
  deletedAt: null,           // Set when soft-deleted
  deletedBy: null,

  // Optimistic concurrency
  version: 1,

  // Pre-computed periods (for efficient aggregation)
  periods: {
    day: "2026-01-20",
    week: "2026-W04",
    month: "2026-01",
    quarter: "2026-Q1",
    year: "2026"
  }
}
```

#### Revised Changelog Structure (Subcollection)

```
/groups/{groupId}/changelog/{changeId}
{
  type: "TRANSACTION_ADDED" | "TRANSACTION_MODIFIED" | "TRANSACTION_REMOVED",
  transactionId: "tx-123",
  timestamp: Timestamp,
  actorId: "user-1",
  summary: { amount: 50, description: "Dinner" }
}
```

**Pruning:** Firestore TTL policy auto-deletes entries older than 30 days

#### Revised Sync Flow

```
On App Open:
  1. Query: changelog where timestamp > lastSyncTime (cheap, recent only)
  2. If changes exist → show red dot badge

On 90-Day Sync Button:
  1. Query: transactions where updatedAt > lastSyncTime AND groupId = X
  2. For each result:
     - If deletedAt != null → remove from local cache
     - Else → upsert to local cache
  3. Update lastSyncTime
  4. Clear badge

On Full Sync (Settings, Recovery):
  1. Query all transactions for group (2-year window)
  2. REPLACE entire local cache
  3. Update lastSyncTime

If offline > 30 days:
  → Force full re-sync (changelog pruned, can't do incremental)
```

#### Revised Analytics Architecture

**Incremental vs Batch by Metric Type:**

| Metric | Strategy | Notes |
|--------|----------|-------|
| Sum/Count | ✅ Incremental | `newSum = oldSum + delta` |
| Average | ✅ Incremental | Store `sum` and `count`, compute on read |
| Min/Max | ⚠️ Partial | Additions safe, deletions may need recalc |
| Median | ❌ Batch only | No incremental formula exists |

**Calculation Timing:**
- **On transaction write:** Enqueue Cloud Task with 30-second delay
- **Task execution:** Full recalc except median, set `needsMedianRecalc: true`
- **Hourly function:** Recalculate medians for flagged periods
- **Nightly function:** Full reconciliation, reset any drift

**Document Structure:**
```
/groups/{groupId}/analytics/month_2026-01
{
  period: "2026-01",
  periodType: "month",
  metrics: {
    totalSpent: 15000.50,
    totalIncome: 20000.00,
    netBalance: 4999.50,
    transactionCount: 47
  },
  byCategory: { food: 5000, transport: 3000 },
  byCategoryGroup: { essentials: 8000, lifestyle: 7000 },
  byMember: { user1: 8000, user2: 7000 },
  insights: {
    highestTransaction: 500,
    lowestTransaction: 2.50,
    averageTransaction: 319.15,
    medianTransaction: 45.00
  },
  lastUpdated: Timestamp,
  needsMedianRecalc: false
}
```

#### Cost Projections (from Research)

| Scale | Monthly Cost | Strategy |
|-------|--------------|----------|
| 1,000 users | ~$7/month | Pre-aggregated Firestore + Cloud Functions |
| 10,000 users | ~$75/month | Same + CDN caching (5-15 min TTL) |
| 100,000 users | ~$700/month | Add BigQuery for complex analytics |

---

### Updated Decisions (Post-Research)

| Component | Final Decision |
|-----------|----------------|
| Change detection | Poll on app open, query changelog subcollection |
| Badge indicator | Red dot only (no count) |
| Normal sync (90-day) | Timestamp-based query on transactions (`updatedAt > lastSync`) |
| Recovery sync (2-year) | Full fetch, replace cache entirely |
| Changelog storage | **Subcollection** (not array), 30-day TTL pruning |
| Soft delete | **Add** `deletedAt`, `deletedBy`, `updatedAt`, `version` fields |
| Analytics debounce | **30 seconds** for most metrics, **hourly** for median |
| Nightly reconciliation | **Add** full reconciliation to catch drift |
| Listeners | None for now (poll only) |

---

### Final Architecture Decisions (Session Conclusion)

#### Decision 1: Single `sharedGroupId` Per Transaction

**Changed from:** `sharedGroupIds: ["group1", "group2"]` (array)
**Changed to:** `sharedGroupId: "group-abc" | null` (single nullable string)

**Rationale:**
- Eliminates `array-contains` query limitations entirely
- Enables simple `WHERE sharedGroupId == groupId` queries
- Simplifies changelog logic (one group affected per change)
- Reduces edge cases for sync and analytics
- User wanting to share with multiple groups can create separate transactions

#### Decision 2: Changelog as Primary Sync Source

**Key insight:** The Epic 14c bug was that transaction-based queries cannot detect removals. Changelog-driven sync solves this.

**Normal Sync Flow (90-day button):**
```
1. Query: changelog WHERE timestamp > lastSyncTime
   LIMIT 10,000 (if more, suggest full sync)

2. Process each entry IN TIMESTAMP ORDER:
   - TRANSACTION_REMOVED → delete transactionId from local cache
   - TRANSACTION_ADDED → add entry.data to local cache
   - TRANSACTION_MODIFIED → update entry.data in local cache

3. Show progress: "Syncing 24 of 253 changes..."

4. Update lastSyncTime, clear badge
```

**Full Sync Flow (Settings button - recovery):**
```
1. Query: transactions WHERE sharedGroupId == groupId
   AND deletedAt == null
   AND date >= (now - 2 years)

2. REPLACE entire local cache for this group

3. Update lastSyncTime, clear badge
```

#### Decision 3: Full Transaction Data in Changelog

Changelog entries include complete transaction data for ADDED/MODIFIED events:

```javascript
{
  type: "TRANSACTION_ADDED" | "TRANSACTION_MODIFIED" | "TRANSACTION_REMOVED",
  transactionId: "tx-123",
  timestamp: Timestamp,
  actorId: "user-1",

  // For ADDED and MODIFIED: include full transaction data
  data: {
    amount: 50,
    description: "Dinner",
    category: "food",
    ownerId: "user-1",
    createdAt: Timestamp,
    updatedAt: Timestamp,
    periods: { day, week, month, quarter, year }
  },

  summary: { amount: 50, description: "Dinner" }
}
```

**Benefits:**
- Single read operation per change (not 1 changelog + 1 transaction)
- Reduces Firestore read costs by 50%
- Simpler client sync logic

---

### Why This Architecture Solves Epic 14c

| Epic 14c Problem | Epic 14d Solution |
|------------------|-------------------|
| `array-contains` can't detect removals | TRANSACTION_REMOVED is explicit event in changelog |
| Delta sync missed label changes | Changelog captures ALL changes including label removal |
| Multi-layer cache conflicts | Single source of truth: changelog for sync |
| Transaction query couldn't see removed items | Don't query transactions for sync - use changelog |

**The key insight:** When Alice removes the "Household" label from her transaction:
1. Server writes `TRANSACTION_REMOVED` event to `/groups/household/changelog/`
2. Bob and Carol's next sync reads this event
3. They delete that transaction from their local cache
4. **Removal is now EXPLICIT, not inferred from query results**

---

### Research Contrast: Deviations and Final Decisions

After contrasting our architecture with the research document, the following deviations were evaluated and decisions locked:

#### Deviation Analysis Results

| Deviation | Research Says | Our Decision | Rationale |
|-----------|---------------|--------------|-----------|
| Dual Query vs Changelog-Only | Query both transactions + changelog | **Changelog-only** | Simpler, cheaper, explicit events sufficient |
| syncId vs Timestamp | Use monotonic `syncId` for ordering | **Timestamp-only** | Collisions rare at our scale, simpler |
| Optimistic Updates | "Add expense should feel instant" | **Yes, for writer only** | Writer sees instant, others use sync button |
| Freshness Indicator | "Display 'Last synced: X ago'" | **Yes, add it** | Builds trust in shared contexts |
| Stale Data Visual | "Yellow tinting for stale data" | **Yes + offline banner** | Clear staleness communication |
| TTL + Cloud Function | Both for pruning | **TTL only** | Firestore TTL is reliable, simpler |
| Offline Persistence | "Reduces reconnection reads" | **Yes, enable it** | 30-50% cost reduction |

#### Analytics Timing (Refined from Research)

| Metric Type | Timing | Method |
|-------------|--------|--------|
| Sum/Count/NetBalance | **Immediate** | `FieldValue.increment()` in same batch |
| Average | **Immediate** | Computed on read (sum/count) |
| Min/Max, byCategory, byMember | **30-second debounce** | Cloud Task batch |
| Median | **30-minute cooldown** | Timer starts on first change, recalc after 30 min |

---

### Session Summary: All Locked Decisions

#### Core Sync Architecture
- ✅ Single `sharedGroupId` per transaction (not array)
- ✅ Changelog as PRIMARY sync source
- ✅ Full transaction data embedded in changelog entries
- ✅ Timestamp-based ordering (no syncId)
- ✅ 30-day TTL pruning (no Cloud Function)
- ✅ Firestore offline persistence enabled

#### Analytics
- ✅ Immediate: sum, count, netBalance, average
- ✅ 30-second debounce: min/max, byCategory, byMember
- ✅ 30-minute cooldown: median
- ✅ Nightly reconciliation for drift correction

#### UX Enhancements
- ✅ Optimistic updates for writer (instant feedback)
- ✅ "Last synced: X ago" freshness indicator
- ✅ Offline banner: "Showing cached data"
- ⏳ Yellow tint for stale data (nice-to-have)

#### Cost Optimizations
- ✅ Changelog-only sync (no dual query)
- ✅ Firestore offline persistence (30-50% read reduction)
- ✅ Full data in changelog (eliminates transaction fetches)

---

### Next Steps

1. **Epic 14c Cleanup** - Revert to stable baseline, remove broken sync code
2. **Epic 14d Implementation** - Build new architecture per these decisions
3. **Testing Strategy** - Multi-operation tests (not single-operation)
4. **Chaos Engineering** - Stress-test against failure scenarios (next brainstorming technique)

---

