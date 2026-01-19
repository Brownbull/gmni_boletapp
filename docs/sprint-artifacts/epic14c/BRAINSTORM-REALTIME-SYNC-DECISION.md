# Brainstorming Decision: Real-Time Sync for Shared Group Transactions

**Date**: 2026-01-17
**Epic**: 14c - Household Sharing
**Participants**: Gabe (Product Owner), Claude (Architect/Facilitator)
**Session Type**: AI-Recommended Brainstorming (Morphological Analysis + Constraint Mapping)

---

## Executive Summary

**Problem**: When User A modifies transactions in a shared group, User B doesn't see changes until manual page refresh.

**Decision**: Implement **Hybrid Approach (A+C)** combining:
1. **Complete the Circuit** - Real-time sync via Firestore `onSnapshot` on `memberUpdates` (immediate need)
2. **FCM Push Notifications** - Closed-app notifications when group members add expenses (future enhancement)

**Rationale**: Both approaches are cost-effective. The hybrid delivers immediate real-time sync while enabling "Partner added expense" notifications for better UX.

---

## Problem Statement

### Current State
- Cross-user transaction visibility works via Cloud Function (`getSharedGroupTransactions`)
- Data fetches on mount/focus but has no real-time listeners
- `memberUpdates` structure exists in schema but isn't wired up
- Delta sync capability exists but isn't triggered automatically

### User Impact
- User B must manually refresh to see User A's changes
- No notification when partner adds shared expense
- Feels like a broken collaborative experience

### Constraints
1. **Security**: Firestore collection group queries cannot validate membership via `resource.data.*`
2. **Cost**: Must stay within free tier for MVP scale
3. **Latency**: 2-5 seconds acceptable for cross-user sync

---

## Solution Analysis

### Approach A: Complete the Circuit (memberUpdates + onSnapshot)

**How it works:**
```
User A modifies tx → writes memberUpdates[A].lastSyncAt → Firestore
User B's onSnapshot fires → detects change → calls CF → gets delta
```

| Criterion | Assessment |
|-----------|------------|
| Scalability | Good - 10 groups max × 10 members = 100 listeners max |
| Speed | 2-3 seconds (Firestore ~1s + CF ~200ms + render) |
| Security | Excellent - already secured, no new attack surface |
| Cost | ~$0.06/month at MVP scale |
| Implementation | 4-6 hours - uses existing schema |

**What exists but isn't wired:**
- `sharedGroup.memberUpdates[userId].lastSyncAt` - schema exists
- Delta sync in Cloud Function - supports `startDate` filtering
- Architecture doc has sample code (lines 437-452 of shared-groups-architecture.md)

**What's missing:**
1. Writer side: Update `memberUpdates` when user modifies transactions
2. Reader side: `onSnapshot` listener that detects changes
3. Reactor: `useEffect` that invalidates cache on change detection

### Approach C: FCM Push Notifications

**How it works:**
```
User A modifies tx → Firestore trigger → Cloud Function → FCM push
User B's device receives push → shows notification → opens app → syncs
```

| Criterion | Assessment |
|-----------|------------|
| Scalability | Good - FCM handles millions |
| Speed | 2-5 seconds (FCM delivery varies) |
| Security | Good - tokens tied to users |
| Cost | $0.00 - FCM is completely free |
| Implementation | 10-17 hours - new infrastructure |

**Components required:**
1. Token management (store FCM tokens per user)
2. Service worker (receive background messages)
3. Cloud Function trigger (send FCM on transaction change)
4. Click handling (open app to right screen)
5. Permission UX (request notification permission)

### Approach A+C: Hybrid (Chosen)

**Why hybrid:**
- **App open**: Fast sync via Approach A (2-3s)
- **App closed**: Notification via FCM ("Partner added $45 grocery expense")

**Cost comparison:**

| Scale | Users | A: Circuit | C: FCM | A+C: Hybrid |
|-------|-------|:----------:|:------:|:-----------:|
| MVP | 100 | $0.06 | $0.15 | $0.21 |
| Growth | 1,000 | $0.60 | $1.50 | $2.10 |
| Scale | 10,000 | $6.00 | $15.00 | $21.00 |

All approaches stay within free tier at MVP scale.

---

## Decision: Implement Hybrid (A+C)

### Phase 1: Complete the Circuit (Story 14c.12) - 5 points

**Delivers**: Real-time sync when app is open

**Tasks:**
1. Update `memberUpdates[userId].lastSyncAt` when user modifies transactions
2. Add `onSnapshot` listener on sharedGroup documents
3. Add `useEffect` to detect other members' timestamp changes
4. Invalidate React Query + IndexedDB cache on detection
5. Call Cloud Function for delta sync
6. Tests for sync flow

### Phase 2: FCM Push Notifications (Story 14c.13) - 8 points

**Delivers**: Notifications when app is closed

**Tasks:**
1. FCM token management (collection + CRUD)
2. Service worker for background messages
3. Firestore trigger → Cloud Function → FCM send
4. Notification click handling (deep link)
5. Permission request UX in settings
6. Token cleanup scheduled function
7. Tests for FCM flow

---

## Architecture: Complete the Circuit Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User A modifies transaction (tag/untag/edit/delete)            │
│       │                                                          │
│       ▼                                                          │
│  updateMemberTimestampsForTransaction(groupId, userId)          │
│       │                                                          │
│       ▼                                                          │
│  Firestore: sharedGroups/{groupId}.memberUpdates[A].lastSyncAt  │
│       │                                                          │
│       ▼                                                          │
│  User B's onSnapshot fires (watching sharedGroup doc)           │
│       │                                                          │
│       ▼                                                          │
│  useEffect detects: memberUpdates[A].lastSyncAt > lastKnown     │
│       │                                                          │
│       ▼                                                          │
│  clearIndexedDBCache(groupId)                                   │
│  queryClient.invalidateQueries(['sharedGroupTransactions', groupId])
│       │                                                          │
│       ▼                                                          │
│  React Query refetches → Cloud Function → delta transactions    │
│       │                                                          │
│       ▼                                                          │
│  User B sees updated transactions (2-3s total latency)          │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture: FCM Push Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User A tags transaction to group                                │
│       │                                                          │
│       ▼                                                          │
│  Firestore trigger: onWrite transactions/{txnId}                │
│       │                                                          │
│       ▼                                                          │
│  Cloud Function: detectSharedGroupChange()                      │
│       │                                                          │
│       ├── Get group members (excluding User A)                  │
│       ├── Get FCM tokens for other members                      │
│       │                                                          │
│       ▼                                                          │
│  messaging.sendEachForMulticast({                               │
│    tokens,                                                       │
│    notification: {                                               │
│      title: "🏠 Casa",                                          │
│      body: "Partner added: Walmart - $45.00"                    │
│    },                                                            │
│    data: { type: 'TRANSACTION_ADDED', groupId, ... }            │
│  })                                                              │
│       │                                                          │
│       ▼                                                          │
│  User B's device shows notification (even if app closed)        │
│       │                                                          │
│       ▼                                                          │
│  User B taps notification → app opens to group view → syncs     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis Detail

### Approach A: Complete the Circuit

| Operation | Frequency (MVP) | Unit Cost | Monthly |
|-----------|-----------------|-----------|---------|
| Write memberUpdates | 60K/month | $0.18/100K | $0.01 |
| onSnapshot reads | 60K/month | $0.06/100K | $0.04 |
| CF delta calls | 60K/month | Free tier | $0.00 |
| Delta tx reads | 120K/month | $0.06/100K | $0.07 |
| **Total A** | | | **~$0.12** |

### Approach C: FCM

| Operation | Frequency (MVP) | Unit Cost | Monthly |
|-----------|-----------------|-----------|---------|
| FCM messages | Unlimited | FREE | $0.00 |
| Token storage | ~2KB/user | FREE | $0.00 |
| Trigger reads (group) | 60K/month | $0.06/100K | $0.04 |
| Trigger reads (tokens) | 180K/month | $0.06/100K | $0.11 |
| **Total C** | | | **~$0.15** |

### Hybrid A+C

| Scale | Monthly Cost |
|-------|-------------|
| MVP (100 users) | ~$0.27 |
| Growth (1K users) | ~$2.70 |
| Scale (10K users) | ~$27.00 |

**Conclusion**: Cost is negligible. Decision based on UX value, not cost.

---

## Alternatives Considered

### Firebase Realtime Database (RTDB) for Signals

| Aspect | Assessment |
|--------|------------|
| Speed | Faster (~100-500ms vs Firestore's ~1-2s) |
| Complexity | Adds new service, duplicate security rules |
| Decision | **Rejected** - 2-3s is acceptable, not worth added complexity |

### Polling

| Aspect | Assessment |
|--------|------------|
| Simplicity | Very simple to implement |
| Efficiency | Wasteful - constant reads even when no changes |
| Decision | **Rejected** - listener-based is more efficient |

### WebSockets / Custom Server

| Aspect | Assessment |
|--------|------------|
| Speed | Sub-second possible |
| Complexity | Requires backend infrastructure |
| Decision | **Rejected** - overkill for 2-5s requirement |

---

## Implementation Plan

### Story 14c.12: Real-Time Sync (Complete the Circuit) - 5 pts

**Priority**: High (immediate need)
**Dependencies**: 14c.5 (in-progress)

**Acceptance Criteria:**
1. When User A tags/untags a transaction, `memberUpdates[A].lastSyncAt` is updated
2. User B's app detects the timestamp change within 2 seconds
3. User B's transaction cache is invalidated and refetched
4. User B sees the updated transaction list within 3-5 seconds total
5. Works for all modification types: tag, untag, edit, delete

### Story 14c.13: FCM Push Notifications - 8 pts

**Priority**: Medium (enhancement)
**Dependencies**: 14c.12

**Acceptance Criteria:**
1. Users can enable/disable notifications in Settings
2. When User A adds expense to group, User B receives push notification
3. Notification shows group name and expense summary
4. Tapping notification opens app to the shared group view
5. Works when app is closed/backgrounded
6. Stale tokens are cleaned up automatically

---

## References

- [Shared Groups Architecture](../../../architecture/shared-groups-architecture.md)
- [ADR-011: Household Sharing](../../../architecture/architecture.md#adr-011)
- [Story 14c.5: Shared Group Transactions View](./14c-5-shared-group-transactions-view.md)
- [Continuation Prompt: Real-Time Sync](./CONTINUATION-PROMPT-REALTIME-SYNC.md)

---

## Decision Record

| Attribute | Value |
|-----------|-------|
| Decision | Implement Hybrid Approach (A+C) |
| Date | 2026-01-17 |
| Status | Approved |
| Deciders | Gabe (PO), Claude (Architect) |
| Confidence | High |

**Rationale Summary:**
1. Cost is not a differentiator (both within free tier)
2. "Complete the Circuit" solves immediate real-time sync need
3. FCM adds valuable closed-app notifications
4. Phased implementation reduces risk
5. Uses existing infrastructure where possible

---

*Document generated from brainstorming session using Morphological Analysis and Constraint Mapping techniques.*
