# Solving Gastify's shared expense sync with soft deletes and event feeds

The core technical challenge—Firestore's `array-contains` queries failing to detect transaction removals—has well-established solutions. After researching expense-sharing apps like Splitwise, Settle Up, and sync architectures from Linear and Figma, **the recommended approach is combining soft deletes with timestamp-based sync via a changelog subcollection**. This pattern directly solves the removal detection problem without requiring complex distributed systems techniques like CRDTs or operational transformation, which are overkill for expense tracking.

For the Chilean market specifically, the **"vaquita" tradition** (pooling money among family/friends) represents an untapped digital product opportunity. Major Chilean fintechs—Fintual, Tenpo, MACH—notably lack dedicated family/shared finance features, despite multigenerational households being culturally significant.

---

## How leading expense apps solve the sync problem

**Splitwise** employs a queue-based offline sync architecture inspired by Dropbox's Carousel. The app maintains a log of all local changes, pushing them to the server in commit order. Balance calculations are heavily cached using their open-source `cacheable` Ruby gem, with cache invalidation on writes rather than real-time recalculation. Deletions are handled via soft-delete patterns with relationship checks—you cannot delete a friend who shares active expenses with third parties.

**Settle Up** migrated to Firebase Realtime Database specifically for real-time sync without manual "Sync now" buttons. The app relies on Firebase's built-in conflict resolution (last-write-wins with timestamps) and works fully offline. Their architecture demonstrates that Firebase can handle collaborative expense data well when designed correctly.

**YNAB** uses a custom Rails/PostgreSQL API with a shared TypeScript library that runs in both iOS (via JavaScriptCore) and Android (via J2V8). Their sync handles "offline-able clients" through incremental delta updates. Shared budgets work through a simple shared-account model where partners use the same credentials, minimizing conflict scenarios.

**Linear's sync engine**—while not an expense app—represents the gold standard for local-first, fast applications. Key insight: **Linear doesn't use CRDTs**. Instead, they rely on total ordering via monotonically increasing `syncId` values, local IndexedDB caching, and Last-Write-Wins conflict resolution. This proves that simple patterns work for structured data.

| App | Sync Technology | Deletion Handling |
|-----|-----------------|-------------------|
| Splitwise | Custom queue-based (Ruby/Rails) | Soft delete with relationship checks |
| Settle Up | Firebase Realtime Database | Firebase's built-in deletion events |
| YNAB | Custom TypeScript SDK + Rails API | Shared account eliminates most conflicts |
| Linear | PostgreSQL + WebSocket delta sync | Tombstone records with `syncId` ordering |

---

## Recommended Firestore architecture for change detection

The fundamental fix requires **two architectural changes**: soft deletes for transactions, and a changelog subcollection to explicitly communicate removal events.

### The soft delete pattern solves removal detection directly

Instead of removing transactions from the `sharedGroups` array (which causes them to disappear from queries), mark them as deleted while keeping them queryable:

```javascript
// Document structure with soft delete fields
{
  id: "tx-123",
  amount: 50,
  groupId: "group-abc",
  sharedGroups: ["group1", "group2"],
  createdAt: Timestamp,
  updatedAt: Timestamp,      // Update on every change
  deletedAt: null,           // Set to timestamp when "deleted"
  deletedBy: null,           // User who performed deletion
  version: 1                 // For optimistic concurrency
}
```

The query changes from `array-contains` (which misses removals) to timestamp-based delta sync:

```javascript
// Before: misses removals
db.collection("transactions")
  .where("sharedGroups", "array-contains", userId)

// After: detects removals
db.collection("transactions")
  .where("groupId", "==", groupId)
  .where("updatedAt", ">", lastSyncTime)
// Client sees documents with deletedAt set, can update local cache
```

### Changelog subcollection provides explicit event feed

For complete reliability, maintain a changelog subcollection that explicitly records all state changes:

```
/groups/{groupId}/
    transactions/{transactionId}     // Current state
    changelog/{changeId}             // Event log
        - type: "TRANSACTION_REMOVED" | "ADDED" | "MODIFIED"
        - transactionId: string
        - timestamp: Timestamp
        - actorId: string
```

When removing a transaction, use a batch write to update both the transaction document and append to the changelog. Clients subscribe to both the transactions query AND the changelog—when a removal event appears in the changelog, they know to evict that transaction from local cache regardless of whether they were actively listening when the change occurred.

### Pruning strategy keeps costs manageable

Use Firestore's TTL policies to auto-delete changelog entries older than **30 days**. This balances sync reliability against storage costs. Clients offline longer than 30 days trigger a full re-sync rather than delta sync. A Cloud Function running on a daily schedule can handle additional cleanup:

```javascript
exports.pruneChangelog = functions.pubsub.schedule('every 24 hours')
  .onRun(async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldChanges = await db.collectionGroup("changelog")
      .where("timestamp", "<", cutoff).get();
    // Batch delete old entries
  });
```

---

## UX best practices for sync pending states in family finance apps

### Minimal feedback for automatic sync, prominent for manual actions

Tricount's approach—"No internet? No problem. Add expenses anytime, and they'll sync automatically"—sets the right user expectation. For automatic background sync, keep indicators subtle (small icon in navbar). Reserve prominent indicators (progress bars, banners) for user-initiated syncs or when attention is genuinely needed.

**Optimistic updates work well for expense additions**. Adding an expense should feel instant—update local state immediately, show a subtle "saving" indicator, and roll back only on failure. For deletions or balance-affecting changes, showing brief confirmation before optimistic update is appropriate given the higher stakes.

### Freshness indicators build trust in shared contexts

Display "Last synced: 2 minutes ago" prominently in shared expense views. Users checking shared balances need confidence they're seeing current data. Use relative timestamps for frequently-updated data. If data may be stale due to connectivity issues, apply subtle visual treatment (yellow tinting) rather than blocking the UI.

### Privacy controls are critical for family contexts

**Honeydue's per-account privacy model** is the gold standard: users choose per account whether to share full transaction history, balance only, or hide completely. For Chilean family contexts where multigenerational households are common, implement role-based visibility:

- **Parents/Admins**: Full visibility of all household transactions
- **Adult members**: See shared household expenses, own private expenses hidden
- **Youth members (10-17)**: Limited view appropriate to age; parents can see their activity

Nubank's Under-18 accounts demonstrate this well: parents can view balances and transaction history, but cannot withdraw from kids' accounts—respecting youth autonomy while maintaining oversight.

---

## Cost modeling at different scales on Firebase

### Early stage (1,000-10,000 users): $0-75/month

Firebase's free tier covers **50,000 reads/day, 20,000 writes/day, 1GB storage**. A 10,000-user expense app with 10% daily active users stays within free limits with careful design. Key optimizations:

- **Pre-compute group balances** in a denormalized document instead of calculating from transaction history on every read
- **Enable offline persistence**—reduces reconnection reads dramatically
- **Batch writes** when adding expenses (transaction + changelog in single batch)
- **Avoid broad real-time listeners**—use pagination and narrow queries

### Growth stage (100K+ users): $1,000-3,000/month

Database reads dominate costs. A moderately complex screen requiring 10 document reads × 100K DAU × 10 sessions/day = **10 million reads daily = ~$180/day**. Mitigation strategies:

- Add external caching layer (Redis) for hot data like group balances
- Move analytics aggregations to BigQuery (cheaper for large computations)
- Implement aggressive client-side caching with longer TTLs
- Consider Firebase Data Connect for PostgreSQL queries where Firestore is awkward

### The $72K Firebase billing cautionary tale

A startup's buggy Cloud Function caused 116 billion Firestore reads in hours. Key lessons: Firebase billing updates with 24+ hour delay, budget alerts only notify (don't stop charges), and the Firebase console itself counts against your usage. Set budget alerts at **$10, $50, $100** thresholds and monitor closely.

### Splitwise's scaling approach

Splitwise processes $1B+ in expenses with a small engineering team (just 2 engineers as of 2014) using Ruby on Rails with aggressive caching. Their `cacheable` gem implements aspect-oriented caching tied to object state (`cache_key` = class + id + updated_at). Philosophy: **balance calculations should never be responsible for their own caching**—separate concerns cleanly.

---

## Chilean market opportunity for family expense tracking

### Major gap in local fintech landscape

Chile has **348 active fintech companies** with 16% YoY growth, but the major players lack family/shared features:

| App | Family Features | Notes |
|-----|-----------------|-------|
| Fintual | ❌ None | Individual investment accounts only |
| Tenpo | ⚠️ Limited | Standard P2P transfers; no shared accounts |
| MACH | ❌ None | Individual digital wallet |

This represents a significant product opportunity. Nubank in Brazil launched "Family Space" (January 2024) with shared balances, proportional expense division, and Under-18 accounts with parental controls—**3+ million youth users**, representing 18% of new monthly customers.

### The "vaquita" tradition provides natural product framing

"Hacer una vaca/vaquita" is a deeply rooted cultural practice of pooling money among friends and family for shared purposes—asados (BBQs), gifts, trips, rent. Regional variations exist across LatAm (Chile: "vaquita," Peru: "chanchita," Mexico: "cooperacha"). A digital "vaquita" feature with contribution tracking, goal-setting, and WhatsApp sharing would resonate strongly.

### Design for Chilean realities

- **WhatsApp integration is essential**—dominant communication channel for invites and updates
- **Offline-first architecture** critical for broader LatAm expansion (26% of LatAm still unbanked)
- **Cash transaction tracking**—manual entry remains primary method, not bank sync
- **Multi-currency support** for families with members abroad (remesas)

Chile's fintech regulatory environment (Fintech Law, January 2023) provides clear compliance framework including CMF registration, open banking provisions, and data protection requirements.

---

## Alternative architectures: what's overkill versus appropriate

### Recommended: Soft deletes + timestamp sync

| Approach | Verdict | Complexity | Rationale |
|----------|---------|------------|-----------|
| **Soft Delete** | ✅ Recommended | Low | Directly solves removal detection |
| **Timestamp Sync** | ✅ Recommended | Medium | Efficient delta sync, tombstone pattern |
| **Event Sourcing** | ⚠️ Consider future | High | Elegant but major architecture change |
| **CRDTs** | ❌ Overkill | Very High | For collaborative text editing, not expenses |
| **Operational Transformation** | ❌ Overkill | Very High | Google Docs pattern, wrong use case |
| **Vector Clocks** | ❌ Overkill | High | For P2P systems, not client-server |

### Why CRDTs are wrong for Gastify

CRDTs (Conflict-free Replicated Data Types) guarantee eventual consistency through mathematical properties, but they're designed for **collaborative rich text editing** where many users concurrently modify the same document. Libraries like Yjs and Automerge excel for this.

Expense tracking is fundamentally different: conflicts are rare (users rarely edit the same expense simultaneously), changes are discrete (add/remove transaction, not character-by-character), and Last-Write-Wins conflict resolution is sufficient. Linear—the gold-standard local-first app—explicitly doesn't use CRDTs for structured data, only for issue descriptions (rich text).

### The Linear/Figma pattern Gastify should follow

Both Linear and Figma use centralized servers for ordering and authority, not peer-to-peer CRDTs. Their pattern:

1. **Total ordering**: Every change gets a monotonically increasing `syncId`
2. **Local-first caching**: IndexedDB for instant UI, sync in background
3. **Delta sync**: Client sends `lastSyncId`, server returns changes since
4. **Soft deletes**: Deleted items appear as tombstones in sync response
5. **Last-Write-Wins**: Simple conflict resolution sufficient for structured data

---

## Specific recommendations for Gastify Epic 14d

### Phase 1: Quick fix (1-2 weeks)

Add `deletedAt`, `deletedBy`, and `updatedAt` fields to transaction documents. Modify all queries to use `updatedAt > lastSyncTime` rather than `array-contains`. On "delete," set `deletedAt = serverTimestamp()` instead of removing from arrays.

### Phase 2: Changelog implementation (2-4 weeks)

Create `/groups/{groupId}/changelog/{changeId}` subcollection. Batch write to both transaction document and changelog on every state change. Client subscribes to both queries; changelog provides explicit removal notification regardless of listener state.

### Phase 3: UX polish

Implement sync status indicator showing "Last synced: X minutes ago." Add optimistic updates for expense creation with rollback on failure. Display "pending" badge on expenses not yet confirmed by server.

### Phase 4: Chilean market features

Build "Vaquita" pooled money feature with contribution tracking and settlement suggestions. Implement WhatsApp-based invite flow (dominant in LatAm). Add manual cash expense entry as first-class feature. Design privacy controls for multigenerational households (parent/youth visibility settings).

### Data model for Epic 14d

```javascript
// Transaction with soft delete + sync fields
{
  id: "tx-123",
  amount: 50,
  description: "Dinner",
  groupId: "group-abc",
  paidBy: "user-1",
  splitAmong: ["user-1", "user-2"],
  category: "food",
  createdAt: Timestamp,
  createdBy: "user-1",
  updatedAt: Timestamp,      // Update on every change
  deletedAt: null,           // Set when soft-deleted
  deletedBy: null,           // Who deleted
  version: 1                 // Optimistic concurrency
}

// Changelog entry
{
  type: "TRANSACTION_REMOVED",
  transactionId: "tx-123",
  timestamp: Timestamp,
  actorId: "user-2",
  summary: { amount: 50, description: "Dinner" }
}
```

### Security rules for shared access

```javascript
match /groups/{groupId}/transactions/{txId} {
  function isGroupMember() {
    return request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
  }
  
  allow read: if isGroupMember();
  allow create: if isGroupMember() && request.resource.data.createdBy == request.auth.uid;
  allow update: if isGroupMember();
  allow delete: if false; // Enforce soft delete
}

match /groups/{groupId}/changelog/{changeId} {
  allow read: if isGroupMember();
  allow create: if isGroupMember();
  allow update, delete: if false; // Append-only
}
```

---

## Conclusion: Simple patterns solve complex-sounding problems

The Firestore `array-contains` removal detection problem has a straightforward solution: soft deletes with timestamp-based sync. This is the same pattern Linear, Figma, and successful expense apps use—not because they couldn't implement CRDTs, but because simpler approaches work better for structured data.

For the Chilean market, Gastify has a clear opportunity. The major fintechs lack family features, while the "vaquita" tradition creates natural product-market fit. Design for WhatsApp sharing, offline-first usage, and multigenerational privacy controls. Launch in Chile (high digital adoption, clear regulatory framework), but design architecture for LatAm expansion from day one.

The recommended architecture—Firestore with soft deletes, changelog subcollection, and pre-computed balances—scales cost-efficiently to 50-100K DAU. Beyond that scale, consider hybrid approaches (Firebase Auth + external PostgreSQL), but that's a future problem. Focus now on solving the sync problem simply and validating product-market fit in the Chilean family finance space.