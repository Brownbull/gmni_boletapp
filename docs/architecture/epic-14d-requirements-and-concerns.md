# Epic 14d: Shared Groups v2 - Requirements and Concerns

**Created:** 2026-01-20
**Purpose:** Comprehensive requirements document for research and architectural design
**Context:** Post Epic 14c retrospective - rebuilding shared groups sync from lessons learned

---

## Executive Summary

Epic 14c attempted real-time sync for shared group transactions and failed due to:
1. Delta sync cannot detect transaction removals (label changes)
2. Complex multi-layer caching got out of sync
3. Cost explosion from fallback full-refetch strategies
4. Multiple iteration approaches caused more harm than one committed approach

Epic 14d will rebuild with explicit constraints, user-controlled sync, and server-side change tracking.

---

## 1. The Core Problem We're Solving

### Primary Use Case
Users share expense groups (household, roommates, couples) and need to see each other's transactions within those groups. When any member adds, edits, or removes a transaction from the group, all members should eventually see that change.

### The Bug That Broke Epic 14c
**Scenario:**
1. Alice creates a transaction, tags it with "Household" shared group
2. Bob and Carol (group members) see the transaction
3. Alice removes "Household" tag from her transaction
4. Alice sees: transaction gone from Household group ✓
5. Bob and Carol see: transaction STILL in Household group ✗

**Root Cause:** Delta sync query `where('sharedGroupIds', 'array-contains', groupId)` cannot detect when a transaction is REMOVED from the array - the transaction simply stops matching the query, so the removal is never "seen."

---

## 2. System Requirements

### 2.1 Functional Requirements

#### Transaction Sync
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Users can tag personal transactions with shared group labels | Must Have |
| FR-2 | All group members can view transactions tagged with their group | Must Have |
| FR-3 | When transaction owner removes group label, all members stop seeing it | Must Have |
| FR-4 | When transaction is edited, all members see updated data | Must Have |
| FR-5 | When transaction is deleted, all members stop seeing it | Must Have |
| FR-6 | Users can manually trigger sync of recent transactions (90 days) | Must Have |
| FR-7 | Users can manually trigger full sync of historical transactions (2 years) | Must Have |
| FR-8 | Visual indicator shows when sync is pending (badge/dot) | Must Have |
| FR-9 | Sync buttons have cooldown to prevent abuse | Must Have |

#### Analytics
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10 | Analytics show spending by category (no merchant names) | Must Have |
| FR-11 | Analytics show spending by group member | Must Have |
| FR-12 | Analytics support weekly, monthly, quarterly, yearly views | Must Have |
| FR-13 | Analytics are computed server-side, not client-side | Must Have |
| FR-14 | Analytics recalculate within 1 hour of transaction changes | Must Have |
| FR-15 | Group owner can force immediate analytics recalculation | Should Have |
| FR-16 | All members see countdown to next analytics refresh | Should Have |

#### Notifications
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-17 | Users receive push notifications when transactions affect their groups | Must Have |
| FR-18 | Notification triggers badge indicator, not automatic sync | Must Have |

### 2.2 Non-Functional Requirements

#### Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | App open to seeing cached data | < 500ms |
| NFR-2 | 90-day sync completion | < 5 seconds |
| NFR-3 | 2-year sync completion | < 30 seconds |
| NFR-4 | Analytics page load (cached) | < 1 second |

#### Cost (Firestore Reads/Writes)
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-5 | Daily reads per active user | < 1,000 |
| NFR-6 | Monthly cost at 1,000 users | < $50 |
| NFR-7 | No unbounded queries (full table scans) | Enforced |

#### Reliability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-8 | Sync correctness after any operation | 100% |
| NFR-9 | Recovery mechanism if sync gets corrupted | Available |
| NFR-10 | Multi-operation test coverage | Required |

---

## 3. Business Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max groups per user | 5 | Cost control, complexity limit |
| Max contributors per group | 10 | Sync complexity, write frequency |
| Max viewers per group | 200 | Read scaling |
| Transaction history window | 2 years | Storage and cost balance |
| Beyond 2 years | Blocked | No access to older transactions in shared groups |

---

## 4. Technical Constraints (Firestore)

| Constraint | Implication |
|------------|-------------|
| Reads: $0.06 per 100K | Every query design is a cost decision |
| Writes: $0.18 per 100K | Server-side triggers add write costs |
| `array-contains` cannot detect removals | Must use explicit removal events |
| Queries are shallow (no joins) | Denormalization or multiple queries required |
| Listeners maintain open connections | Battery/data cost when active |
| Security rules are per-document | Can't query across groups in single call |

---

## 5. Data Model Constraints

### Ownership Model
| Rule | Description |
|------|-------------|
| Transaction owner = creator | Only the user who created the transaction owns it |
| Ownership is permanent | Cannot transfer ownership (except account deletion) |
| Only owner can edit | Labels, amounts, categories - all owner-only |
| Only owner can remove from group | Removing group label requires ownership |
| Group owner ≠ Transaction owner | Different concepts, different permissions |
| Group owner cannot remove others' transactions | Can only manage their own transactions in the group |
| Account deletion transfers ownership | Ownership passes to next registered user in group |
| If no remaining users | Group gets deleted along with account |

### Group Roles
| Role | Permissions |
|------|-------------|
| Owner | Manage group, members, force analytics refresh, all contributor permissions |
| Contributor | Add transactions to group, view all transactions |
| Viewer | View transactions only |

---

## 6. Concerns and Research Answers

### 6.1 Sync Architecture Concerns

**Concern 1: Change Feed Size Growth**
- ~~If we store all change events in an array, it will grow unbounded~~
- **RESOLVED:** Use subcollection instead of array
- **Solution:** `/groups/{groupId}/changelog/{changeId}` - each change is separate document
- **Pruning:** Firestore TTL policy auto-deletes entries older than 30 days
- **Offline >30 days:** Forces full re-sync (changelog pruned)

**Concern 2: Change Feed Consistency**
- Server writes events via Firestore trigger
- **RESOLVED:** Cloud Functions have built-in retry behavior
- **Solution:** Use event IDs for idempotency in Cloud Functions
- **Backup:** Nightly reconciliation catches any missed events

**Concern 3: Client Cache Corruption**
- If client applies events incorrectly, cache becomes wrong
- **RESOLVED:** Dual safety mechanisms
- **Solution 1:** Full sync recovery button in Settings
- **Solution 2:** Nightly reconciliation on server catches drift
- **Solution 3:** Soft delete with `deletedAt` field ensures removals are explicit

**Concern 4: Offline Behavior**
- **RESOLVED:** Last-Write-Wins is sufficient for expense tracking
- **Research finding:** Linear and Figma use LWW, not CRDTs - simple patterns work for structured data
- **Solution:** Firestore offline persistence + manual sync buttons
- **Conflict resolution:** Server timestamp wins, client sees merged result on sync

### 6.2 Analytics Concerns

**Concern 5: Aggregate Calculation Cost**
- **RESOLVED:** Use incremental aggregation for most metrics
- **Research finding:** Only median requires full recalculation
- **Solution:**
  - Sum/Count/Average: Incremental with `FieldValue.increment(delta)`
  - Min/Max: Incremental for additions, recalc on deletion of extreme
  - Median: Hourly batch recalculation only

**Concern 6: Period Boundary Edge Cases**
- **RESOLVED:** Pre-compute period identifiers at write time
- **Solution:** Store `periods` field on each transaction:
  ```javascript
  periods: { day: "2026-01-31", week: "2026-W05", month: "2026-01", quarter: "2026-Q1", year: "2026" }
  ```
- **Date edits:** Compare before/after periods, queue recalc for union of affected periods
- **Timezone:** Single timezone per group (stored as IANA identifier), applied at write time

### 6.3 Cost Concerns

**Concern 7: Change Feed Reads**
- **RESOLVED:** 5 reads per app open is acceptable
- **Research finding:** At 1,000 users, total monthly cost ~$7
- **Optimization:** Query `changelog where timestamp > lastSyncTime` (only recent entries)

**Concern 8: Full Sync Cost**
- **RESOLVED:** Acceptable at current scale
- **Research finding:** 5,000 transactions = ~$0.30 per full sync
- **Mitigation:** Cooldown on full sync button, incremental sync for normal use
- **Future (100K users):** Add BigQuery for complex analytics

### 6.4 Security Concerns

**Concern 9: Change Feed Access**
- **RESOLVED:** Standard Firestore security rules sufficient
- **Solution:**
  ```javascript
  match /groups/{groupId}/changelog/{changeId} {
    allow read: if isGroupMember();
    allow create: if isGroupMember();
    allow update, delete: if false; // Append-only
  }
  ```
- **Spam prevention:** Rate limiting via cooldowns on sync buttons

---

## 7. Final Architecture (Research-Validated)

### 7.1 Two-Tier Transaction Cache

| Tier | Scope | Storage | Refresh Mechanism |
|------|-------|---------|-------------------|
| Hot | Last 90 days | Device cache | Manual button, 1min cooldown (×3), then 15min, resets daily |
| Warm | 90 days - 2 years | Device persistent | Settings button, incremental fetch, longer cooldown |

### 7.2 Transaction Document Structure (with Soft Delete)

**Key Decision:** Transaction can only belong to ONE shared group (not array). This simplifies sync logic and eliminates `array-contains` query limitations.

```javascript
{
  id: "tx-123",
  amount: 50,
  description: "Dinner",
  ownerId: "user-1",
  category: "food",

  // SINGLE shared group (nullable) - NOT an array
  // Transaction can only be shared with ONE group at a time
  sharedGroupId: "group-abc" | null,

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

**Rationale for single sharedGroupId:**
- Eliminates `array-contains` query limitations
- Enables simple `WHERE sharedGroupId == groupId` queries
- Simplifies changelog logic (one group affected per change)
- Reduces edge cases for sync and analytics
- User wanting to share with multiple groups can create separate transactions

### 7.3 Changelog Structure (Subcollection - Primary Sync Source)

**Key Decision:** Changelog is the PRIMARY sync source. For ADDED/MODIFIED events, include full transaction data so clients don't need separate fetches.

```
/groups/{groupId}/changelog/{changeId}
{
  type: "TRANSACTION_ADDED" | "TRANSACTION_MODIFIED" | "TRANSACTION_REMOVED",
  transactionId: "tx-123",
  timestamp: Timestamp,
  actorId: "user-1",

  // For ADDED and MODIFIED: include full transaction data
  // Eliminates need for separate transaction fetch during sync
  data: {
    amount: 50,
    description: "Dinner",
    category: "food",
    ownerId: "user-1",
    createdAt: Timestamp,
    updatedAt: Timestamp,
    periods: {
      day: "2026-01-20",
      week: "2026-W04",
      month: "2026-01",
      quarter: "2026-Q1",
      year: "2026"
    }
    // All fields needed for display and local storage
  },

  // Lightweight summary for notifications/logs
  summary: { amount: 50, description: "Dinner" }
}
```

**Pruning:** Firestore TTL policy auto-deletes entries older than 30 days
**If offline >30 days:** Client must do full re-sync

**Why include data in changelog:**
- Client syncs from changelog ONLY (no separate transaction query for normal sync)
- Single read operation per change (not 1 changelog read + 1 transaction read)
- Reduces Firestore read costs by 50%
- Simpler client sync logic

### 7.4 Analytics Structure

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

**Privacy constraint:** NO merchant names, NO item names - categories only.

### 7.5 Sync Flow (Changelog-Driven)

**Key Decision:** Normal sync reads ONLY from changelog (not transactions). This guarantees removal detection since TRANSACTION_REMOVED events are explicit.

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRANSACTION CHANGES                          │
│  (Add / Remove Label / Edit / Delete)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Firestore Trigger (batch write)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  1. Update transaction document (set updatedAt, sharedGroupId)  │
│  2. Append to /groups/{groupId}/changelog/{changeId}            │
│     - Include FULL transaction data in changelog entry          │
│  3. Enqueue Cloud Task for analytics (30-sec delay)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                    │
│                                                                 │
│  On App Open:                                                   │
│    1. Query changelog where timestamp > lastSyncTime            │
│    2. If changes exist → show red dot badge                     │
│                                                                 │
│  On 90-Day Sync Button Press (CHANGELOG-DRIVEN):                │
│    1. Query: changelog WHERE timestamp > lastSyncTime           │
│       LIMIT 10,000 (if more changes, suggest full sync)         │
│                                                                 │
│    2. Process each entry IN TIMESTAMP ORDER:                    │
│       - TRANSACTION_REMOVED → delete transactionId from cache   │
│       - TRANSACTION_ADDED → add entry.data to cache             │
│       - TRANSACTION_MODIFIED → update entry.data in cache       │
│                                                                 │
│    3. Show progress: "Syncing 24 of 253 changes..."             │
│                                                                 │
│    4. Update lastSyncTime, clear badge                          │
│                                                                 │
│  On Full Sync Button Press (Settings - TRANSACTION QUERY):      │
│    1. Query: transactions WHERE sharedGroupId == groupId        │
│       AND deletedAt == null                                     │
│       AND date >= (now - 2 years)                               │
│                                                                 │
│    2. REPLACE entire local cache for this group                 │
│                                                                 │
│    3. Update lastSyncTime, clear badge                          │
│                                                                 │
│  If offline > 30 days:                                          │
│    → Force full re-sync (changelog pruned)                      │
└─────────────────────────────────────────────────────────────────┘
```

**Why this solves the Epic 14c bug:**
- TRANSACTION_REMOVED is an EXPLICIT event in the changelog
- Client WILL see the removal event and delete from local cache
- No more relying on `array-contains` which couldn't detect removals
- Changelog is append-only, so events are never missed (within 30-day TTL)

### 7.6 Analytics Calculation (Research-Optimized)

**Metric-Specific Strategies:**

| Metric | Strategy | Timing |
|--------|----------|--------|
| Sum/Count | Incremental (`FieldValue.increment`) | **Immediate** (same write batch) |
| Average | Derived from sum/count | **Immediate** (computed on read) |
| Min/Max | Check if affected | 30-second debounce |
| byCategory, byMember | Update affected buckets | 30-second debounce |
| Median | Full recalculation | **30-minute cooldown** |

**Calculation Flow:**

```
Transaction Change Detected
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  IMMEDIATE (in same Firestore batch write):                     │
│    - FieldValue.increment() for sum, count                      │
│    - Update netBalance = totalIncome - totalSpent               │
│    - Average computed on read (sum / count)                     │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  DEBOUNCED (30-second Cloud Task):                              │
│    - Check/update min/max for period                            │
│    - Update byCategory breakdowns                               │
│    - Update byMember breakdowns                                 │
│    - Set needsMedianRecalc: true                                │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  30-MINUTE COOLDOWN:                                            │
│    - On first change: start 30-min timer                        │
│    - Additional changes within window: no new timer             │
│    - After 30 min: recalculate median for flagged periods       │
│    - Set needsMedianRecalc: false                               │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  NIGHTLY (2 AM):                                                │
│    - Full reconciliation of ALL metrics                         │
│    - Compare computed values vs stored                          │
│    - Auto-correct any drift                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Owner override:** Force recalculation (3x/day, 5min cooldown)
**Owner control:** Cancel pending recalculation if not needed

### 7.7 UX Enhancements (Research-Validated)

#### Optimistic Updates for Writers

When user adds/edits a transaction, update local state immediately:

```
┌─────────────────────────────────────────────────────────────────┐
│  WRITER (Alice adds expense)                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Alice taps "Add Expense"                                    │
│  2. LOCAL: Instantly appears in her UI (optimistic)             │
│  3. BACKGROUND: Write to Firestore + changelog                  │
│  4. If success → subtle checkmark indicator                     │
│  5. If failure → rollback local state, show error toast         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
               Server writes changelog entry
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  READERS (Bob, Carol) - unchanged behavior                      │
├─────────────────────────────────────────────────────────────────┤
│  On app open: Poll changelog → Red dot badge if changes         │
│  Press sync button: Fetch changelog → See Alice's expense       │
└─────────────────────────────────────────────────────────────────┘
```

**Key:** Optimistic updates are for **writer's UX only**. Other users still use manual sync.

#### Freshness Indicator

Display "Last synced: X ago" near sync button:
- Shows relative time: "2 minutes ago", "1 hour ago", "Yesterday"
- Builds trust in shared expense contexts
- Users know if data might be stale before checking balances

#### Offline Mode Visual Treatment

| State | Visual Treatment |
|-------|------------------|
| Online, synced | Normal display |
| Online, pending changes | Red dot badge on sync button |
| Offline | Banner: "Offline - showing cached data" |
| Stale >1 hour (nice-to-have) | Subtle yellow tint on data sections |

### 7.8 Client-Side Requirements

#### Firestore Offline Persistence

**Requirement:** Enable Firestore offline persistence for cost reduction and offline support.

```javascript
// Initialize on app startup
firebase.firestore().enablePersistence({ synchronizeTabs: true })
```

**Benefits:**
- 30-50% read reduction on app reopen (serves from cache first)
- App works fully offline with cached data
- Reduces reconnection reads dramatically
- Aligns with research recommendation

---

## 8. Final Decisions (Research-Validated)

### 8.1 Sync Architecture

| Decision | Rationale | Research Source |
|----------|-----------|-----------------|
| **Single `sharedGroupId` (not array)** | Eliminates `array-contains` limitations, simpler queries | Brainstorming decision |
| **Changelog-driven sync** (not transaction query) | Explicit removal events, guaranteed detection | Research validated |
| **Full transaction data in changelog** | Single read per change, 50% cost reduction | Optimization |
| **Timestamp-based ordering** (no syncId) | Sufficient for expense data, simpler | Linear pattern adapted |
| Poll on app open, no persistent listeners | Simplicity, battery savings | Linear/Figma pattern |
| Red dot badge only (no count) | Simpler state, sufficient UX | Industry standard |
| Changelog as **subcollection** (not array) | Avoids 1MB doc limit, enables TTL pruning | Firestore best practice |
| Soft delete with `deletedAt`, `updatedAt`, `version` | Enables timestamp-based delta sync | Splitwise pattern |
| 30-day TTL on changelog entries (TTL only, no Cloud Function) | Balance sync reliability vs storage cost | Industry standard |
| Full fetch for recovery (2-year sync) | Guaranteed correctness, handles >30 day offline | Fallback pattern |

### 8.2 Analytics

| Decision | Rationale | Research Source |
|----------|-----------|-----------------|
| **Immediate** sum/count updates | `FieldValue.increment()` in same batch | Research finding |
| **30-second debounce** for breakdowns | Responsive updates without cost explosion | Research finding |
| **30-minute cooldown** for median | No incremental formula, batch is practical | Mathematical constraint |
| Nightly reconciliation | Catches drift, ensures accuracy | Twitter/production pattern |
| Pre-computed period fields on transactions | Efficient aggregation queries | Performance optimization |
| Group-level timezone (not per-user) | Consistent aggregation, simpler logic | Practical trade-off |
| No merchant/item names in analytics | Privacy requirement | Business constraint |

### 8.3 UX Enhancements

| Decision | Rationale | Research Source |
|----------|-----------|-----------------|
| **Optimistic updates for writer** | Instant feedback for person making changes | Tricount pattern |
| **"Last synced: X ago" indicator** | Builds trust in shared contexts | Research recommendation |
| **Offline banner** "Showing cached data" | Clear staleness communication | UX best practice |
| Yellow tint for stale data (nice-to-have) | Subtle visual indicator | Research recommendation |

### 8.4 Cost Optimization

| Decision | Rationale | Research Source |
|----------|-----------|-----------------|
| **Firestore offline persistence** | 30-50% read reduction on app reopen | Research recommendation |
| Changelog-only sync (no dual query) | Single query simpler, cheaper | Optimization |

---

## 9. Research Findings Summary

### 9.1 Industry Patterns Validated

| App | Key Pattern | Applied to Gastify |
|-----|-------------|-------------------|
| Splitwise | Soft delete + cached balance calculations | ✅ Soft delete fields |
| Settle Up | Firebase built-in conflict resolution | ✅ Last-Write-Wins |
| Linear | Total ordering via `syncId`, no CRDTs | ✅ Timestamp-based sync |
| Figma | Centralized server, not P2P | ✅ Firestore as source of truth |

### 9.2 What NOT to Use

| Pattern | Why Not |
|---------|---------|
| CRDTs | Overkill for structured expense data |
| Operational Transformation | For collaborative text editing, not expenses |
| Vector Clocks | For P2P systems, not client-server |
| Real-time listeners for sync | Complex, error-prone, cost explosion |

### 9.3 Cost Projections

| Scale | Monthly Cost | Strategy |
|-------|--------------|----------|
| 1,000 users | ~$7/month | Pre-aggregated Firestore + Cloud Functions |
| 10,000 users | ~$75/month | Same + CDN caching (5-15 min TTL) |
| 100,000 users | ~$700/month | Add BigQuery for complex analytics |

### 9.4 Research Documents

- [Solving Gastify's shared expense sync](./claude_research/Solving%20Gastify's%20shared%20expense%20sync%20with%20soft%20deletes%20and%20event%20feeds.md)
- [Analytics Calculation Strategies](./claude_research/Analytics%20Calculation%20Strategies%20for%20Firestore%20Expense%20Applications.md)

---

## 10. Success Criteria for Epic 14d

| Criteria | Measurement |
|----------|-------------|
| Label removal syncs correctly | Test: remove label, verify other users see removal within one manual sync |
| Multi-operation reliability | Test: perform 5 sequential operations, verify all sync correctly |
| Cost stays within budget | Monitor: Firestore dashboard shows < $50/month at 1,000 users |
| No listener complexity | Code review: no onSnapshot listeners for transaction sync |
| Recovery mechanism works | Test: corrupt cache intentionally, verify full sync recovers |
| Analytics accurate | Test: add/edit/delete transactions, verify aggregates update within 1 hour |

---

## Appendix A: Epic 14c Failure Summary

### What Failed
1. **Delta sync cannot detect removals** - `array-contains` query misses removed items
2. **State staleness after first operation** - `prevMemberUpdatesRef` didn't update correctly
3. **Cost explosion from full refetch fallback** - `refetchOnMount: true` bankrupted the budget
4. **Multi-layer cache conflicts** - React Query + IndexedDB + Firestore got out of sync

### What Worked
- UI components (view mode switcher, ownership indicators)
- Security rules (group membership validation)
- Cloud Function for cross-user queries
- Group CRUD operations
- Transaction tagging
- Push notifications
- Writer-side signal updates

### Key Lessons
1. Delta sync CANNOT detect deletions without explicit events
2. Single-operation tests give FALSE confidence
3. Multiple iteration approaches cause more harm than one committed approach
4. `refetchOnMount: true` as fallback = cost explosion
5. Complex listener + ref tracking is error-prone

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Transaction Owner | The user who created the transaction (permanent, non-transferable) |
| Group Owner | The user who created/owns the shared group (manages membership) |
| Hot Tier | Recent transactions (90 days) - synced frequently |
| Warm Tier | Historical transactions (90 days - 2 years) - synced rarely |
| Change Feed | Server-side log of all transaction changes affecting a group |
| Playback | Applying change events to local cache incrementally |
| Full Sync | Fetching all transactions and replacing local cache entirely |
| Debounce | Delaying recalculation to batch multiple changes |
| Soft Delete | Marking records as deleted (via `deletedAt`) rather than removing them |
| Tombstone | A deleted record that remains queryable to signal removal to sync clients |
| TTL | Time-To-Live - automatic deletion of documents after specified duration |
| LWW | Last-Write-Wins - simple conflict resolution where latest timestamp wins |
| Incremental Aggregation | Updating aggregate values with delta changes instead of full recalculation |
