# Shared Groups Data Flow

> Epic 14c: Household Sharing - Cross-User Transaction Access
> **Last Updated:** 2026-01-17
> **Complexity:** High

---

## Overview

This diagram illustrates how shared group transactions are securely fetched across user boundaries using a Cloud Function with server-side membership validation.

**Key Insight:** Firestore collection group queries cannot evaluate `resource.data.*` conditions in security rules, requiring server-side validation.

---

## Data Flow

```mermaid
sequenceDiagram
    participant C as Client (React)
    participant RQ as React Query
    participant CF as Cloud Function
    participant FS as Firestore

    C->>RQ: useSharedGroupTransactions(groupId)
    RQ->>RQ: Check cache (staleTime: 5min)

    alt Cache Hit
        RQ-->>C: Return cached data
    else Cache Miss
        RQ->>CF: httpsCallable('getSharedGroupTransactions')
        CF->>CF: 1. Validate auth token
        CF->>FS: 2. Fetch sharedGroups/{groupId}
        FS-->>CF: Group document
        CF->>CF: 3. Check members.includes(userId)

        alt Not Member
            CF-->>RQ: HttpsError('permission-denied')
            RQ-->>C: Error state
        else Is Member
            CF->>FS: 4. collectionGroup('transactions')<br/>where('sharedGroupIds', 'array-contains', groupId)
            FS-->>CF: Transaction documents
            CF->>CF: 5. Extract _ownerId from paths
            CF-->>RQ: Transactions with _ownerId
            RQ->>RQ: Update cache
            RQ-->>C: Transaction data
        end
    end
```

---

## Security Model

```mermaid
flowchart LR
    subgraph CLIENT
        A[React App]
    end

    subgraph CLOUD_FUNCTION["Cloud Function (Server)"]
        B[1. Auth Check]
        C[2. Fetch Group]
        D[3. Membership Check]
        E[4. Execute Query]
    end

    subgraph FIRESTORE
        F[(sharedGroups)]
        G[(transactions)]
    end

    A -->|httpsCallable| B
    B -->|context.auth| C
    C -->|db.doc| F
    F -->|group.members| D
    D -->|admin SDK| E
    E -->|collectionGroup| G
    G -->|results| A

    style B fill:#e8f5e9
    style C fill:#fff3e0
    style D fill:#fff3e0
    style E fill:#e3f2fd
```

### Security Steps

| Step | Action | Failure Response |
|------|--------|------------------|
| 1. Auth | Validate Firebase Auth token | `HttpsError('unauthenticated')` |
| 2. Fetch | Get group document | `HttpsError('not-found')` |
| 3. Check | `members.includes(userId)` | `HttpsError('permission-denied')` |
| 4. Query | Admin SDK (bypasses rules) | Success |

---

## Data Collections

```mermaid
erDiagram
    SHARED_GROUPS {
        string id PK
        string ownerId FK
        string name
        string color
        array members
        map memberUpdates
        string shareCode
        timestamp createdAt
    }

    PENDING_INVITATIONS {
        string id PK
        string groupId FK
        string invitedEmail
        string invitedByUserId
        string status
        timestamp expiresAt
    }

    TRANSACTIONS {
        string id PK
        string userId FK
        array sharedGroupIds
        number total
        string date
        timestamp updatedAt
    }

    SHARED_GROUPS ||--o{ PENDING_INVITATIONS : "invites"
    SHARED_GROUPS ||--o{ TRANSACTIONS : "tagged to"
```

---

## Why Cloud Function?

### The Problem

```javascript
// THIS DOES NOT WORK for collection group queries:
match /{path=**}/transactions/{transactionId} {
  allow read: if request.auth != null
      && resource.data.sharedGroupIds != null  // ❌ Cannot evaluate
      && resource.data.sharedGroupIds.size() > 0;  // ❌ Cannot evaluate
}
```

**Firestore Limitation:** Collection group queries cannot access `resource.data.*` in security rules.

### Rejected Alternative: UUID Obscurity

```javascript
// INSECURE - relies on unguessable groupIds
match /{path=**}/transactions/{transactionId} {
  allow read: if request.auth != null
      && request.query.limit <= 1000;  // Only auth + limit
}
```

**Problem:** If attacker obtains a groupId (from network logs, localStorage, etc.), they can query all transactions in that group.

### The Solution: Server-Side Validation

```typescript
// Cloud Function validates BEFORE querying
const groupDoc = await db.doc(`sharedGroups/${groupId}`).get();
if (!groupDoc.data()?.members.includes(context.auth.uid)) {
  throw new HttpsError('permission-denied', 'Not a member');
}
// Now safe to query with admin SDK
```

---

## Caching Strategy

```mermaid
flowchart TB
    subgraph "Layer 1: React Query"
        RQ[In-Memory Cache]
        RQ --> |staleTime: 5min| STALE
        RQ --> |gcTime: 30min| GC
    end

    subgraph "Layer 2: IndexedDB"
        IDB[Persistent Cache]
        IDB --> |LRU eviction| EVICT[50K records max]
    end

    subgraph "Layer 3: Firestore"
        FS[Source of Truth]
        FS --> |delta sync| DELTA[memberUpdates timestamps]
    end

    RQ <--> IDB
    IDB <--> FS
```

### Cache Invalidation

1. User A modifies transaction in group
2. Writes to `group.memberUpdates[userA].lastSyncAt`
3. User B's Firestore subscription detects change
4. React Query cache invalidated
5. Fresh fetch via Cloud Function

---

## Cost Analysis

### MVP Scale Assumptions

| Metric | Value |
|--------|-------|
| Active groups | 100 |
| Members per group | 4 |
| Views per user/day | 5 |
| Days per month | 30 |

### Monthly Cost

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Functions | 60,000 invocations | **$0.00** (free tier) |
| Firestore Reads | ~120,000 | **~$0.07** |
| **Total** | | **~$0.08/month** |

---

## Files

| File | Purpose |
|------|---------|
| `functions/src/getSharedGroupTransactions.ts` | Cloud Function implementation |
| `src/services/sharedGroupTransactionService.ts` | Client service (calls CF) |
| `src/hooks/useSharedGroupTransactions.ts` | React Query hook |
| `firestore.rules` | Security rules (denies client collection group) |

---

## Related Diagrams

- [Data Caching](./data-caching.md) - React Query + Firestore integration
- [Tech Stack](./tech-stack.md) - Technology layers

## Related Documentation

- [Shared Groups Architecture](../shared-groups-architecture.md) - Full decision document
- [Architecture Overview](../architecture.md) - ADR-011
- [Epic 14c Stories](../../sprint-artifacts/epic14c/)

---

*Diagram by Atlas - Project Intelligence Guardian*
