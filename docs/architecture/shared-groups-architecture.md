# Shared Groups Architecture

> **Epic 14c: Household Sharing**
> **Last Updated:** 2026-01-17
> **Status:** Production

---

## Executive Summary

Shared Groups enables users to share expense tracking with family members, couples, or roommates. This document details the architecture decisions, security model, and cost analysis for the cross-user transaction access system.

**Key Architecture Decision:** Server-side membership validation via Cloud Function (not client-side Firestore rules)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Data Architecture](#data-architecture)
4. [Security Model](#security-model)
5. [Alternatives Considered](#alternatives-considered)
6. [Cost Analysis](#cost-analysis)
7. [Implementation Details](#implementation-details)
8. [Caching Strategy](#caching-strategy)
9. [Real-Time Sync](#real-time-sync)
10. [Deployment](#deployment)

---

## Problem Statement

### User Need
Users want to share expense tracking with family members to answer: *"Where is our money going - even when I'm not the one spending it?"*

### Technical Challenge
Transactions are stored in user-isolated collections:
```
/artifacts/{appId}/users/{userId}/transactions/{txnId}
```

To show User A's transactions to User B (when both are in a shared group), we need **cross-user queries** - which Firestore doesn't natively support with proper access control.

### Firestore Limitation Discovered
**Critical Finding (2026-01-17):** Firestore collection group queries **CANNOT** evaluate `resource.data.*` conditions in security rules. This means:

```javascript
// THIS DOES NOT WORK for collection group queries:
match /{path=**}/transactions/{transactionId} {
  allow read: if request.auth != null
      && resource.data.sharedGroupIds != null  // ❌ Cannot evaluate
      && resource.data.sharedGroupIds.size() > 0;  // ❌ Cannot evaluate
}
```

Even with all documents having the `sharedGroupIds` field, Firestore denies permission because collection group rules cannot access document data.

---

## Solution Overview

### Architecture: Cloud Function with Server-Side Validation

```
┌──────────────┐     ┌─────────────────────────────────┐     ┌───────────────┐
│              │     │   Cloud Function                │     │               │
│    Client    │────▶│   getSharedGroupTransactions    │────▶│   Firestore   │
│              │     │                                 │     │   (admin)     │
│  React App   │     │   1. Validate auth token        │     │               │
│              │◀────│   2. Check group membership     │◀────│   Returns     │
│              │     │   3. Execute collectionGroup    │     │   transactions│
└──────────────┘     │   4. Add _ownerId to results    │     └───────────────┘
                     └─────────────────────────────────┘
```

### Why This Approach

| Requirement | Solution |
|-------------|----------|
| Cross-user data access | collectionGroup query |
| Membership validation | Server-side check (Cloud Function) |
| Security | Auth token + membership verified before query |
| Performance | Single query (not N per member) |
| Cost | Free tier covers MVP scale |

---

## Data Architecture

### Firestore Collections

```
Top-level collections (cross-user access):
├── /sharedGroups/{groupId}
│   ├── id: string
│   ├── ownerId: string                    // Creator, can transfer
│   ├── appId: string                      // 'boletapp'
│   ├── name: string                       // "🏠 Casa" (may include emoji)
│   ├── color: string                      // "#10B981" (hex)
│   ├── icon: string                       // Extracted emoji
│   ├── shareCode: string                  // 16-char nanoid (fallback invite)
│   ├── shareCodeExpiresAt: Timestamp      // 7-day expiry
│   ├── members: string[]                  // Max 10 user IDs
│   ├── memberUpdates: {                   // For cache invalidation
│   │     [userId]: { lastSyncAt: Timestamp }
│   │   }
│   ├── memberProfiles?: {                 // Denormalized for UI
│   │     [userId]: { displayName, email, photoURL }
│   │   }
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
│
└── /pendingInvitations/{invitationId}
    ├── id: string
    ├── groupId: string
    ├── groupName: string                  // Denormalized
    ├── groupColor: string                 // Denormalized
    ├── groupIcon?: string                 // Denormalized
    ├── invitedEmail: string               // Lowercase, indexed
    ├── invitedByUserId: string
    ├── invitedByName: string              // Denormalized
    ├── status: 'pending' | 'accepted' | 'declined' | 'expired'
    ├── createdAt: Timestamp
    └── expiresAt: Timestamp               // 7 days from creation

User-level collections:
└── /artifacts/{appId}/users/{userId}/transactions/{txnId}
    ├── ...existing transaction fields...
    ├── sharedGroupIds?: string[]          // Max 5 groups per transaction
    └── deletedAt?: Timestamp              // Soft delete support
```

### Limits

```typescript
export const SHARED_GROUP_LIMITS = {
  MAX_OWNED_GROUPS: 5,           // User can own max 5 groups
  MAX_MEMBER_OF_GROUPS: 10,      // User can be in max 10 groups
  MAX_MEMBERS_PER_GROUP: 10,     // Group has 2-10 members
  MAX_GROUPS_PER_TRANSACTION: 5, // Transaction tagged to max 5 groups
  SHARE_CODE_LENGTH: 16,         // nanoid(16) - ~95 bits entropy
  SHARE_CODE_EXPIRY_DAYS: 7,     // Codes expire after 7 days
  MAX_TIME_RANGE_MONTHS: 12,     // Query date range limit
  CACHE_MAX_RECORDS: 50_000,     // IndexedDB LRU limit
};
```

---

## Security Model

### Authentication Flow

```
1. User requests shared group transactions
   │
   ▼
2. Client calls Cloud Function with groupId
   │
   ▼
3. Cloud Function validates Firebase Auth token
   ├── Invalid? → HttpsError('unauthenticated')
   │
   ▼
4. Cloud Function fetches group document
   ├── Not found? → HttpsError('not-found')
   │
   ▼
5. Cloud Function checks members.includes(userId)
   ├── Not member? → HttpsError('permission-denied') + security log
   │
   ▼
6. Cloud Function executes collectionGroup query (admin SDK)
   │
   ▼
7. Returns transactions with _ownerId populated
```

### Security Rules

```javascript
// ============================================================================
// Shared Groups Security Rules
// ============================================================================

// Group management - members can read, owner can write
match /sharedGroups/{groupId} {
  allow create: if isValidNewGroup();
  allow read: if isGroupMember() || hasValidShareCode();
  allow update: if isGroupOwner() || isJoiningGroup();
  allow delete: if isGroupOwner();
}

// Pending invitations - email-based access
match /pendingInvitations/{invitationId} {
  allow create: if request.resource.data.invitedByUserId == request.auth.uid;
  allow read: if resource.data.invitedEmail == request.auth.token.email.lower();
  allow update: if isInvitedUser() && statusUpdateOnly();
  allow delete: if false;  // Audit trail
}

// Collection group queries - DENIED (Cloud Function handles this)
match /{path=**}/transactions/{transactionId} {
  allow read: if false;
}

// User's own transactions - full access
match /artifacts/{appId}/users/{userId}/transactions/{transactionId} {
  allow read, write: if request.auth.uid == userId;
  // Cross-user read for shared transactions (fallback, limited to 3 groups)
  allow read: if isGroupMemberForTransaction(request.auth.uid, resource.data.sharedGroupIds);
}
```

### Security Logging

Unauthorized access attempts are logged:

```typescript
console.warn(
  `[SECURITY] User ${userId} attempted to access group ${groupId} without membership`
);
```

---

## Alternatives Considered

### Option 1: Client-Side Collection Group Query (REJECTED)

```javascript
// Attempted approach
match /{path=**}/transactions/{transactionId} {
  allow read: if request.auth != null
      && request.query.limit <= 1000;  // Only auth + limit
}
```

**Why Rejected:**
- Relies on UUID obscurity for security
- If attacker obtains groupId, they can query all transactions
- GroupIds visible in network requests, localStorage, logs
- **Not proper security**

### Option 2: Per-Member Queries (CONSIDERED)

```typescript
// Query each member's collection individually
const queries = members.map(memberId =>
  query(collection(db, `users/${memberId}/transactions`),
    where('sharedGroupIds', 'array-contains', groupId))
);
const results = await Promise.all(queries);
```

**Why Not Primary:**
- Scales poorly: N members = N queries
- Higher latency for larger groups
- More complex real-time subscription management
- Higher Firestore read costs

**Used As:** Fallback when Cloud Function unavailable

### Option 3: Denormalized Transaction Refs (CONSIDERED)

```
sharedGroups/{groupId}/transactionRefs/{refId}
├── originalPath: "users/{userId}/transactions/{txnId}"
├── date, total, merchant, category (denormalized)
└── ownerId
```

**Why Not Chosen:**
- 2x writes on every tag/untag operation
- Risk of data inconsistency (original vs ref)
- Need Cloud Function trigger to keep in sync
- Added complexity for similar security

### Option 4: Cloud Function (CHOSEN)

**Why Chosen:**
- ✅ Proper server-side security
- ✅ Single query (efficient)
- ✅ Free tier covers MVP scale
- ✅ Simpler than denormalization
- ✅ Admin SDK bypasses rule limitations
- ⚠️ ~100-200ms latency (acceptable with caching)

---

## Cost Analysis

### Assumptions (MVP Scale)

| Metric | Value |
|--------|-------|
| Active groups | 100 |
| Average members per group | 4 |
| Views per user per day | 5 |
| Days per month | 30 |

### Monthly Usage Estimate

```
Total views = 100 groups × 4 members × 5 views × 30 days = 60,000/month
```

### Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Functions** | 60,000 invocations | **$0.00** (free tier: 2M/month) |
| **Firestore Reads** | ~120,000 reads | **~$0.07** ($0.06 per 100K) |
| **Firestore Writes** | ~5,000 (tagging) | **~$0.01** |
| **Total** | | **~$0.08/month** |

### Comparison with Alternatives

| Approach | Monthly Cost (MVP) | At 10x Scale |
|----------|-------------------|--------------|
| Cloud Function | ~$0.08 | ~$0.80 |
| Per-Member Queries | ~$0.14 | ~$1.40 |
| Denormalized Refs | ~$0.10 | ~$1.00 |

**Conclusion:** All approaches are cost-effective at MVP scale. Cloud Function chosen for security, not cost.

---

## Implementation Details

### Cloud Function

**Location:** `functions/src/getSharedGroupTransactions.ts`

```typescript
export const getSharedGroupTransactions = functions.https.onCall(
  async (data, context) => {
    // 1. Auth check
    if (!context.auth) throw HttpsError('unauthenticated', ...);

    // 2. Input validation
    const { groupId, startDate, endDate, limit } = data;

    // 3. Membership validation
    const groupDoc = await db.doc(`sharedGroups/${groupId}`).get();
    if (!groupDoc.data()?.members.includes(context.auth.uid)) {
      throw HttpsError('permission-denied', ...);
    }

    // 4. Execute secure query
    const query = db.collectionGroup('transactions')
      .where('sharedGroupIds', 'array-contains', groupId)
      .orderBy('date', 'desc')
      .limit(limit);

    // 5. Return with owner info
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      _ownerId: extractOwnerFromPath(doc.ref.path),
    }));
  }
);
```

### Client Service

**Location:** `src/services/sharedGroupTransactionService.ts`

```typescript
export async function fetchSharedGroupTransactions(...) {
  // Primary: Cloud Function (secure)
  if (USE_CLOUD_FUNCTION) {
    try {
      return await fetchViaCloudFunction(groupId, options);
    } catch {
      // Fallback to per-member queries
    }
  }
  return fetchPerMemberFallback(db, groupId, members, options);
}
```

### React Hook

**Location:** `src/hooks/useSharedGroupTransactions.ts`

```typescript
// Story 14c.16: Query key no longer includes date range
// This enables shared cache across all date selections with client-side filtering
export function useSharedGroupTransactions(options) {
  return useQuery({
    queryKey: QUERY_KEYS.sharedGroupTransactions(groupId),
    queryFn: () => fetchSharedGroupTransactions(...),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });
}
```

---

## Caching Strategy

### Three-Layer Cache

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: React Query In-Memory                     │
│  - staleTime: 5 minutes                             │
│  - gcTime: 30 minutes                               │
│  - Instant UI response                              │
├─────────────────────────────────────────────────────┤
│  Layer 2: IndexedDB Persistent Cache                │
│  - Survives app close/refresh                       │
│  - Works offline                                    │
│  - LRU eviction at 50K records                      │
├─────────────────────────────────────────────────────┤
│  Layer 3: Cloud Function → Firestore                │
│  - Source of truth                                  │
│  - Delta sync via memberUpdates timestamps          │
└─────────────────────────────────────────────────────┘
```

### Cache Invalidation

When a member modifies transactions:
1. Transaction update writes to `group.memberUpdates[userId].lastSyncAt`
2. Other members' Firestore subscriptions detect timestamp change
3. React Query cache invalidated
4. Fresh data fetched via Cloud Function

---

## Real-Time Sync

### Architecture Decision (2026-01-17)

**Decision:** Implement **Hybrid Approach (A+C)** combining:
1. **Complete the Circuit** - Firestore `onSnapshot` on `memberUpdates` for app-open sync
2. **FCM Push Notifications** - Closed-app notifications when partners add expenses

**Decision Document:** [BRAINSTORM-REALTIME-SYNC-DECISION.md](../sprint-artifacts/epic14c/BRAINSTORM-REALTIME-SYNC-DECISION.md)

**Stories:**
- [14c.12: Real-Time Sync - Complete the Circuit](../sprint-artifacts/epic14c/14c-12-realtime-sync-complete-circuit.md) (5 pts)
- [14c.13: FCM Push Notifications](../sprint-artifacts/epic14c/14c-13-fcm-push-notifications.md) (8 pts)

### Approach A: Complete the Circuit (App Open)

**Flow:**
```
User A modifies transaction
    │
    ▼
updateMemberTimestamp(groupId, userA) → memberUpdates[A].lastSyncAt = now
    │
    ▼
User B's onSnapshot fires (watching sharedGroup doc)
    │
    ▼
useEffect detects: memberUpdates[A].lastSyncAt > lastKnown
    │
    ▼
clearIndexedDBCache(groupId) + queryClient.invalidateQueries()
    │
    ▼
React Query refetches → Cloud Function → delta transactions
    │
    ▼
User B sees updated transactions (2-3s total latency)
```

**Implementation:**

```typescript
// App.tsx - Watch for other members' changes
const prevMemberUpdatesRef = useRef<Map<string, Record<string, { lastSyncAt?: { seconds: number } }>>>(new Map());

useEffect(() => {
  if (!userSharedGroups?.length || !user?.uid) return;

  for (const group of userSharedGroups) {
    const prevUpdates = prevMemberUpdatesRef.current.get(group.id) || {};
    const currentUpdates = group.memberUpdates || {};

    for (const [memberId, update] of Object.entries(currentUpdates)) {
      if (memberId === user.uid) continue; // Skip self

      const prevTimestamp = prevUpdates[memberId]?.lastSyncAt?.seconds || 0;
      const currentTimestamp = update.lastSyncAt?.seconds || 0;

      if (currentTimestamp > prevTimestamp) {
        console.log(`[Sync] Member ${memberId} updated group ${group.id}`);
        clearGroupCache(group.id);
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.sharedGroupTransactions(group.id),
        });
      }
    }

    prevMemberUpdatesRef.current.set(group.id, { ...currentUpdates });
  }
}, [userSharedGroups, user?.uid, queryClient]);
```

### Approach C: FCM Push Notifications (App Closed)

**Flow:**
```
User A tags transaction to group
    │
    ▼
Firestore trigger → Cloud Function
    │
    ▼
Get group members (excluding User A) → Get FCM tokens
    │
    ▼
messaging.sendEachForMulticast({
  notification: { title: "🏠 Casa", body: "Partner added: Walmart - $45" }
})
    │
    ▼
User B receives push notification (even with app closed)
    │
    ▼
User B taps notification → app opens to group view → syncs
```

**Components Required:**
- FCM token management (Firestore collection per user)
- Service worker for background messages
- Cloud Function Firestore trigger
- Notification click handling with deep linking

### Acceptable Latency

- Initial load: ~200-400ms (Cloud Function + Firestore)
- Cached load: <50ms (React Query)
- Cross-user sync (app open): ~2-3 seconds
- Cross-user sync (FCM): ~2-5 seconds

### Cost Analysis

| Scale | Approach A | Approach C | Hybrid A+C |
|-------|:----------:|:----------:|:----------:|
| MVP (100 users) | ~$0.06 | ~$0.15 | ~$0.21 |
| Growth (1K users) | ~$0.60 | ~$1.50 | ~$2.10 |
| Scale (10K users) | ~$6.00 | ~$15.00 | ~$21.00 |

**Note:** FCM is completely free. Costs are Firestore reads/writes.

---

## Deployment

### Deploy Cloud Function

```bash
cd functions
npm run build
firebase deploy --only functions:getSharedGroupTransactions
```

### Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### Verify Deployment

1. Test in emulator with two users
2. User A tags transaction to group
3. User B should see transaction in group view
4. User B should NOT be able to query without membership

---

## Related Documentation

- [Architecture Overview](./architecture.md) - ADR-011
- [API Contracts](./api-contracts.md) - Cloud Function interface
- [Data Models](./data-models.md) - SharedGroup schema
- [Diagrams: Shared Groups Flow](./diagrams/shared-groups-flow.md)
- [Epic 14c Stories](../sprint-artifacts/epic14c/)
- [Real-Time Sync Decision](../sprint-artifacts/epic14c/BRAINSTORM-REALTIME-SYNC-DECISION.md) - Brainstorming session 2026-01-17
- [Story 14c.12: Complete the Circuit](../sprint-artifacts/epic14c/14c-12-realtime-sync-complete-circuit.md)
- [Story 14c.13: FCM Push Notifications](../sprint-artifacts/epic14c/14c-13-fcm-push-notifications.md)

---

*Architecture documented by Atlas - Project Intelligence Guardian*
*Real-time sync decision added 2026-01-17 via brainstorming session*
