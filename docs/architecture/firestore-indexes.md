# Firestore Indexes Documentation

> **Last Updated:** 2026-02-09 (Shared groups feature removed)
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

**Note:** These indexes supported Epic 14c (Household Sharing) which was reverted on 2026-01-20. The shared groups feature has been removed entirely (2026-02-09).

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

## Cost Considerations

- **Composite indexes** incur storage and write costs
- **Unused indexes** waste resources - audit regularly
- **Field overrides** are more efficient than composite indexes for single-field queries
- Current configuration minimizes index overhead while supporting all active queries

---

## References

- [Firestore Index Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Epic 14c-refactor Tech Context](../sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md)
- [Epic 14c Retrospective](../sprint-artifacts/epic-14c-retro-2026-01-20.md)
- Security Rules: `firestore.rules`
- Index Configuration: `firestore.indexes.json`
