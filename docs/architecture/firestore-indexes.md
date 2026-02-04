# Firestore Indexes Documentation

> **Last Updated:** 2026-02-01 (Story 14d-v2-1.3b)
> **Status:** Production
> **Firebase Project:** boletapp-d609f

---

## Overview

This document describes the Firestore composite indexes and field overrides configured for Boletapp. Indexes are defined in `firestore.indexes.json` at the project root.

---

## Current Index Inventory

### Composite Indexes

**None** - All composite indexes were removed in Epic 14c-refactor.14.

Personal transaction queries use the user-scoped path `artifacts/{appId}/users/{userId}/transactions/{transactionId}` which does not require composite indexes because:
1. Queries filter by userId via the document path
2. Single-field ordering (e.g., `orderBy('date', 'desc')`) uses automatic indexes

### Field Overrides

Field overrides enable specific query patterns on single fields.

| Collection | Field | Query Scope | Purpose |
|------------|-------|-------------|---------|
| `fcmTokens` | `token` | COLLECTION, COLLECTION_GROUP | FCM token lookup for push notifications |
| `pushSubscriptions` | `endpoint` | COLLECTION, COLLECTION_GROUP | Web Push subscription endpoint lookup |

**Query Locations:**
- `fcmTokens.token`: Used by `src/services/fcmTokenService.ts` for token deduplication and lookup
- `pushSubscriptions.endpoint`: Used by push notification service for subscription management

---

## Removed Indexes (Epic 14c-refactor.14)

The following indexes were removed on 2026-01-21 because their associated features were disabled:

| Collection | Fields | Removal Reason |
|------------|--------|----------------|
| `pendingInvitations` | invitedEmail (ASC), status (ASC), createdAt (DESC) | Security rules deny all access to pendingInvitations collection |
| `sharedGroups` | members (CONTAINS), createdAt (DESC) | `useSharedGroups` hook is stubbed; no queries execute |
| `transactions` (group) | sharedGroupIds (CONTAINS), updatedAt (DESC) | Collection group queries blocked by security rules |
| `transactions` (group) | sharedGroupIds (CONTAINS), date (DESC) | Collection group queries blocked by security rules |
| `transactions` (group) | sharedGroupIds (CONTAINS), date (DESC), __name__ (DESC) | Collection group queries blocked by security rules |

**Note:** These indexes supported Epic 14c (Household Sharing) which was reverted on 2026-01-20. When Epic 14d reimplements shared groups, new indexes will be created based on the revised architecture.

---

## Security Rules Context

The security rules in `firestore.rules` control which queries are possible:

```javascript
// Personal transactions - owner only
match /artifacts/{appId}/users/{userId}/transactions/{transactionId} {
  allow read, write: if request.auth.uid == userId;
}

// Collection group queries - DENIED
match /{path=**}/transactions/{transactionId} {
  allow read: if false;
}

// Shared groups/invitations - DISABLED until Epic 14d
match /sharedGroups/{groupId} { allow read, write: if false; }
match /pendingInvitations/{invitationId} { allow read, write: if false; }
```

---

## Index Management

### Deployment Commands

```bash
# Deploy indexes to production (always specify project explicitly)
firebase deploy --only firestore:indexes --project boletapp-d609f

# Force delete orphaned indexes (removes indexes not in firestore.indexes.json)
firebase deploy --only firestore:indexes --project boletapp-d609f --force

# Verify deployment in Firebase Console:
# Console > Firestore > Indexes > Check "Ready" status
```

### Verification Steps

1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Verify in Firebase Console: Console > Firestore > Indexes
3. Check for "Building" or "Deleting" status (asynchronous operations)
4. Run tests: `npm run test:quick` to verify no query regressions

### Creating New Indexes

When adding new composite indexes:

1. Add to `firestore.indexes.json`
2. Document the query location (file:line) that requires the index
3. Deploy and wait for "Ready" status (may take several hours for large collections)
4. Update this document with the new index entry

---

## TTL Policies (Epic 14d-v2)

### Changelog TTL (30 days)

The `sharedGroups/{groupId}/changelog` subcollection uses Firestore's Time-to-Live (TTL) feature to automatically delete changelog entries after 30 days (Architecture Decision AD-9).

| Collection Path | TTL Field | Duration | Purpose |
|-----------------|-----------|----------|---------|
| `sharedGroups/{groupId}/changelog` | `_ttl` | 30 days | Auto-cleanup of sync entries |

**TTL Field Specification:**
- Field name: `_ttl`
- Type: Firestore `Timestamp`
- Value: Set to `current time + 30 days` when creating changelog entries
- Firestore automatically deletes documents when `_ttl < server time`

### Manual Setup Required

⚠️ **TTL policies cannot be deployed via `firebase deploy`.** They must be configured manually in Firebase Console.

**Setup Steps:**

1. Navigate to [Firebase Console](https://console.firebase.google.com/project/boletapp-d609f/firestore/ttl)
2. Go to **Firestore Database** > **Time-to-live policies**
3. Click **Create policy**
4. Configure:
   - **Collection group**: `changelog`
   - **Timestamp field**: `_ttl`
5. Click **Create**

**Verification:**
- Policy appears in TTL policies list with "Active" status
- Monitor Cloud Logging for TTL deletion events (may take up to 24 hours to start)

### Cost Benefits

TTL auto-deletion reduces storage costs by:
- Removing stale changelog entries automatically
- No manual cleanup scripts required
- No additional read/write costs for deletion (Firestore handles internally)

---

## Cost Considerations

- **Composite indexes** incur storage and write costs
- **Unused indexes** waste resources - audit regularly
- **Field overrides** are more efficient than composite indexes for single-field queries
- Current configuration minimizes index overhead while supporting all active queries

---

## Epic 14d-v2 Implementation Status

Epic 14d-v2 (Shared Groups v2) is currently in progress. The following has been implemented:

### Implemented (Story 14d-v2-1.3b)
- **Changelog security rules** - Append-only subcollection for transaction sync
  - Read: Group members only
  - Create: Group members only with validation
  - Update/Delete: Forbidden (append-only pattern)
- **TTL policy documentation** - 30-day auto-expiration for changelog entries

### Pending Implementation
- Group membership queries (Story 1.4+)
- Real-time sync signals
- Cross-user transaction visibility

Design principles from Epic 14c lessons:
- Avoid collection group queries where possible (cost explosion risk)
- Prefer user-scoped paths with explicit sharing references
- Document all indexes with their query locations

---

## References

- [Firestore Index Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Epic 14c-refactor Tech Context](../sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md)
- [Epic 14c Retrospective](../sprint-artifacts/epic-14c-retro-2026-01-20.md)
- Security Rules: `firestore.rules`
- Index Configuration: `firestore.indexes.json`
