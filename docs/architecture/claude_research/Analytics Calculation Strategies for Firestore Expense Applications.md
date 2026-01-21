# Analytics Calculation Strategies for Firestore Expense Applications

**For Gastify's scale and 1-hour latency requirement, the optimal strategy is a hybrid approach combining write-time incremental updates for simple metrics with scheduled batch recalculation for complex analytics.** This architecture minimizes Firestore costs while ensuring data accuracy through nightly reconciliation. The recommended pattern mirrors how Splitwise calculates group balances in real-time but aligns more closely with dashboard tools like Metabase that use tiered caching with periodic refresh for complex aggregations.

## How production expense and analytics apps handle this problem

Real-world financial and analytics applications reveal a clear pattern: use the simplest approach that meets latency requirements, then add complexity only where needed.

**Splitwise calculates balances in real-time** using immediate recalculation on every transaction write. Their debt simplification algorithm runs a greedy matching process instantly when expenses change, with read locks preventing data inconsistency during concurrent updates. This works because balance accuracy is critical for user trust in expense-sharing apps.

**Dashboard tools like Looker and Metabase take a different approach.** Looker's Persistent Derived Tables (PDTs) pre-compute query results and store them in a scratch schema, rebuilding on triggers or schedules rather than real-time. Metabase implements tiered caching—duration-based (invalidate after X hours), schedule-based (cron), or adaptive (execution time × multiplier). Airbnb's Superset deployment achieves **86% cache hit rates** by warming caches during off-peak hours using Airflow.

**High-scale social apps like Instagram denormalize counters directly.** Rather than incrementing counters in memcache, Instagram moved to denormalized database counters where each like directly increments a stored count. Both the counter update and the like record write happen in a single atomic transaction. This pattern handles **4 billion likes per day** efficiently.

| Strategy | Latency | Cost | Best For |
|----------|---------|------|----------|
| Real-time on write | Milliseconds | Highest | User-facing balances, fraud detection |
| Debounced/batched | Seconds to minutes | Medium | Sensor data, high-frequency events |
| Scheduled batch | Minutes to hours | Lowest | Dashboard analytics, reports |
| On-demand | Variable | Pay-per-query | Ad-hoc analysis, rare queries |
| Hybrid | Mixed | Optimized | Production systems at scale |

## Which metrics can be incrementally updated

Not all analytics metrics behave the same way. The key distinction is whether a metric is **decomposable**—meaning it can be computed from partial results without accessing all source data.

**Safe for incremental updates:**
- **Sum**: `newSum = oldSum + addedValue - removedValue`
- **Count**: Simply increment/decrement by 1
- **Average**: Store both `sum` and `count`; compute `average = sum / count` on read
- **Standard deviation**: Store `sum`, `count`, and `sumOfSquares`; compute on read

**Partial support (additions safe, deletions may require recalc):**
- **Min/Max**: Adding a new value is O(1) comparison, but deleting the current min/max requires finding the next candidate
- **Range**: Derived from min and max; same constraints

**Requires full recalculation:**
- **Median**: No incremental formula exists; requires sorted access to all values
- **Percentiles (p50, p90, p99)**: Must be recalculated when population changes
- **Mode**: Frequency tracking can help, but deletions complicate matters

For Gastify's analytics—`highestTransaction`, `lowestTransaction`, `averageTransaction`, `medianTransaction`—only **median requires scheduled batch recalculation**. The others can use incremental updates with careful handling of the highest/lowest edge cases when the current extreme value is deleted.

## Firestore-specific patterns and their cost implications

Firestore's pricing model heavily favors read optimization through pre-aggregation. Understanding the cost structure is essential for architecture decisions.

**Aggregation query costs:** Firestore charges **1 document read per 1,000 index entries scanned**. Running `sum()` on 1,000 documents costs just 1 read (~$0.00006), while reading all 1,000 documents individually costs 1,000 reads (~$0.06). This makes read-time aggregation **1,000× cheaper** than fetching raw documents—but only for simple, infrequent queries.

**Pre-computed aggregates win at scale.** Once you're querying aggregates frequently (multiple times per minute across users) or exceeding tens of thousands of documents, pre-computed summary documents become more economical. The trade-off is write amplification: one transaction write triggers updates to multiple aggregate documents.

**The 1 write/second limit matters for high-frequency updates.** Firestore limits document writes to approximately 1 per second per document. For expense tracking with normal usage patterns (perhaps 10-50 transactions per user per day), this isn't a concern. However, if aggregate documents consolidate activity across many users, distributed counters (sharding across 10-100 sub-documents) may be necessary. The Firebase Distributed Counter Extension handles this automatically, scaling from 0 to 10,000 writes/second.

| Scale | Aggregation Strategy | Distributed Counters |
|-------|---------------------|---------------------|
| <1K docs, <1 write/sec | Read-time aggregation queries | Not needed |
| 1K-100K docs, 1-10 writes/sec | Pre-computed with Cloud Functions triggers | 10 shards if hitting limits |
| >100K docs, >10 writes/sec | Pre-computed + scheduled batch | 50-100 shards or Extension |

## Implementing debounce and batching in Cloud Functions

Gastify's requirement of "within 1 hour" latency opens the door to significant cost savings through debounced batch processing rather than real-time triggers.

**The serverless debounce challenge:** Cloud Functions are stateless, making traditional debounce patterns impossible within a single function. Production systems solve this using **Cloud Tasks with delayed execution**:

```
Transaction write → Cloud Function → Enqueue Cloud Task (30-60 second delay)
                                           ↓
                              Task executes → Full recalculation for period
```

If another transaction arrives before the task executes, the same period gets queued again—but with proper deduplication (using period ID as task name), only one calculation runs. This pattern from AWS SQS implementations translates directly to Firebase Cloud Tasks.

**Recommended debounce windows for expense apps:**

| Use Case | Debounce Window |
|----------|----------------|
| User-facing balance updates | 0-30 seconds |
| Period analytics (totals, breakdowns) | 30-60 seconds |
| Complex analytics (median, insights) | 5-60 minutes or scheduled |

**Implementation pattern for Gastify:**
1. Transaction write triggers `onDocumentWritten` Cloud Function
2. Function calculates affected periods from timestamp
3. For each period, enqueue a Cloud Task with 30-second delay
4. Task performs full recalculation for that specific period
5. Nightly scheduled function runs reconciliation across all periods

## Handling multi-period calculations and date changes

A single transaction on January 31 affects **week 5, January, Q1, and 2026**. When editing a transaction that changes its date from January to February, you affect **two months, potentially two quarters, and two weeks**.

**Pre-compute period identifiers at write time.** Store period keys directly on each transaction document:

```javascript
{
  amount: 45.00,
  timestamp: "2026-01-31T14:30:00Z",
  periods: {
    day: "2026-01-31",
    week: "2026-W05",
    month: "2026-01",
    quarter: "2026-Q1",
    year: "2026"
  }
}
```

This enables efficient querying and makes period identification trivial during aggregation.

**For date edits, track both old and new periods.** The Cloud Function's `onDocumentUpdated` trigger provides both `event.data.before` and `event.data.after`. Compare period identifiers; if any differ, queue recalculation jobs for the union of affected periods.

**Flat aggregation beats hierarchical for Firestore.** While you could compute yearly totals by summing monthly documents (hierarchical), this requires 12 document reads versus 1 for a pre-computed yearly aggregate. Given Firestore's read pricing, pre-computing all period levels (daily, weekly, monthly, quarterly, yearly) independently—despite the write amplification—delivers better economics and simpler client code.

**Timezone handling recommendation:** Store all timestamps in UTC. Configure a single timezone per group (stored as IANA identifier like `America/New_York`). Calculate period boundaries using the group's timezone at write time, storing results in the `periods` field. This avoids the complexity of per-user timezone handling while ensuring consistent aggregation for shared expense groups.

## Handling edits, deletes, and ensuring accuracy

Incremental updates are prone to drift from race conditions, partial failures, and edge cases. Production systems universally implement reconciliation.

**For edits:** Capture the delta by comparing before and after values. For amount changes: `delta = newAmount - previousAmount`. Apply the delta using `FieldValue.increment(delta)` for atomic updates. For category or date changes, treat as a delete from the old category/period plus an add to the new one.

**For deletes:** Reverse the contribution using `FieldValue.increment(-deletedAmount)`. For highest/lowest metrics, check if the deleted value equals the current extreme; if so, query for the new extreme:

```javascript
if (deletedAmount === currentHighest) {
  const newHighest = await transactions
    .where('period.month', '==', month)
    .orderBy('amount', 'desc')
    .limit(1)
    .get();
}
```

**Nightly reconciliation is essential.** Schedule a Cloud Function at 2 AM to:
1. Query all transactions for each period
2. Compute true aggregates using read-time aggregation queries
3. Compare against stored pre-computed values
4. Auto-correct any drift, logging discrepancies for monitoring

This pattern—incremental for speed, batch for accuracy—mirrors how Twitter evolved their observability system: real-time for user experience, batch reconciliation for correctness.

## Cost modeling across Gastify's growth trajectory

The optimal architecture changes as user base grows. Here's the cost projection:

**At 1,000 users (current/near-term):**
- ~10K transactions/month
- Transaction writes: ~$1/month
- Aggregate writes (5 periods × 10K): ~$5/month
- Analytics reads: ~$0.50/month
- **Total: ~$7/month**
- **Recommendation:** Pre-aggregated Firestore documents with triggered Cloud Functions

**At 10,000 users:**
- ~100K transactions/month
- Transaction writes: ~$11/month
- Aggregate writes: ~$54/month
- Analytics reads: ~$5/month
- Cloud Functions: ~$5/month
- **Total: ~$75/month**
- **Recommendation:** Same architecture + caching via Firebase Hosting CDN (5-15 minute TTL on analytics endpoints)

**At 100,000 users:**
- ~1M transactions/month
- Transaction writes: ~$108/month
- Aggregate writes: ~$540/month
- Cloud Functions: ~$50/month
- **Total: ~$700/month for Firestore operations**
- **Recommendation:** Firestore for real-time + BigQuery export for complex analytics (historical analysis, cross-group insights). BigQuery adds ~$40/month for analytics but enables SQL-based reporting impossible in Firestore.

## Recommended architecture for Epic 14d

Based on this research, here's the specific architecture for Gastify's analytics:

**Document structure:**
```
groups/{groupId}/analytics/{periodType}_{periodId}
  Example: groups/abc123/analytics/month_2026-01
  
  {
    period: "2026-01",
    periodType: "month",
    metrics: {
      totalSpent: 15000.50,
      totalIncome: 20000.00,
      netBalance: 4999.50,
      transactionCount: 47
    },
    byCategory: { food: 5000, transport: 3000, ... },
    byCategoryGroup: { essentials: 8000, lifestyle: 7000, ... },
    byMember: { user1: 8000, user2: 7000 },
    insights: {
      highestTransaction: { amount: 500, id: "tx123" },
      lowestTransaction: { amount: 2.50, id: "tx456" },
      averageTransaction: 319.15,
      medianTransaction: 45.00  // Calculated in batch
    },
    lastUpdated: Timestamp,
    needsMedianRecalc: false
  }
```

**Calculation timing:**
- **On transaction write:** Enqueue Cloud Task with 30-second delay for affected periods
- **Task execution:** Full recalculation of all metrics except median; set `needsMedianRecalc: true`
- **Hourly scheduled function:** Recalculate medians for all periods flagged `needsMedianRecalc: true`
- **Nightly scheduled function:** Full reconciliation of all metrics, reset drift

**Key implementation details:**
- Use `FieldValue.increment()` for atomic counter updates in high-frequency scenarios
- Store period identifiers on transactions at write time
- Configure group-level timezone (default UTC)
- Implement idempotency using event IDs in Cloud Functions
- Cache analytics API responses via Firebase Hosting CDN with 5-minute TTL

This architecture handles Gastify's 1-hour latency requirement with significant headroom, optimizes for Firestore's cost model, and scales gracefully from 1,000 to 100,000 users without fundamental changes—only adding BigQuery integration at the highest tier for advanced analytics capabilities.