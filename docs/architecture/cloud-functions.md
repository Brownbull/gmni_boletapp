# Cloud Functions Architecture

> Last Updated: 2026-02-05 (Epic 14d-v2 additions)

This document provides a comprehensive inventory of all Firebase Cloud Functions deployed for Boletapp, including their purposes, criticality levels, dependencies, and security considerations.

## Function Summary

| Function | Type | Criticality | Purpose |
|----------|------|-------------|---------|
| `analyzeReceipt` | HTTPS Callable | **CRITICAL** | Receipt OCR via Gemini AI |
| `onTransactionDeleted` | Firestore Trigger | **CRITICAL** | Cascade delete images |
| `cleanupStaleFcmTokens` | Scheduled | MAINTENANCE | Daily token cleanup |
| `cleanupCrossUserFcmToken` | HTTPS Callable | FEATURE | Shared device token cleanup |
| `adminCleanupUserTokens` | HTTP | ADMIN | Manual token cleanup |
| `adminSendTestNotification` | HTTP | ADMIN | Test FCM delivery |
| `saveWebPushSubscription` | HTTPS Callable | FEATURE | Save VAPID subscription |
| `deleteWebPushSubscription` | HTTPS Callable | FEATURE | Delete VAPID subscription |
| `adminTestWebPush` | HTTP | ADMIN | Test VAPID delivery |
| `getVapidPublicKey` | HTTP | FEATURE | Return VAPID public key |
| `onTransactionWrite` | Firestore Trigger (v2) | **CRITICAL** | Changelog sync for shared groups |
| `onMemberRemoved` | Firestore Trigger | **CRITICAL** | Cleanup on member removal |

## Criticality Levels

| Level | Definition | Impact if Removed |
|-------|------------|-------------------|
| **CRITICAL** | Core features that break the app | App unusable |
| **FEATURE** | User-facing features that enhance the app | Feature unavailable |
| **MAINTENANCE** | Background jobs for system health | Gradual degradation |
| **ADMIN** | Debugging utilities | No user impact |

---

## CRITICAL Functions

### analyzeReceipt

**Type:** HTTPS Callable
**File:** `functions/src/analyzeReceipt.ts`
**Criticality:** CRITICAL

Analyzes receipt images using Google Gemini 2.0 Flash AI. This is the core OCR function that powers the entire receipt scanning feature.

**Features:**
- Extracts merchant, date, total, items, and categories from receipt images
- Supports re-scanning existing transactions (Story 14.15b)
- Uploads processed images to Firebase Storage
- Returns structured transaction data for client-side saving

**Configuration:**
| Parameter | Value |
|-----------|-------|
| Rate Limit | 10 requests/minute/user |
| Max Images | 5 per request |
| Max Image Size | 10MB each |
| AI Model | `gemini-2.0-flash` (GA) |
| Prompt Version | V3 (auto-detects currency) |

**Authentication:** Required (Firebase Auth)

**Error Handling:**
- Rate limit exceeded: `resource-exhausted`
- Invalid images: `invalid-argument`
- AI processing failure: `internal`

**Dependencies:**
- `imageProcessing.ts` - Image resize/compression
- `storageService.ts` - Firebase Storage upload
- `prompts/` - Prompt templates (V1, V2, V3)

**Secret Management:**
```
GEMINI_API_KEY - Stored in Firebase Secret Manager
                 Local development uses functions/.env
```

**Workflow Chains:**
- Scan Receipt Flow (#1) - Primary consumer
- Batch Processing Flow (#3) - Parallel calls for batch mode

---

### onTransactionDeleted

**Type:** Firestore Trigger
**File:** `functions/src/deleteTransactionImages.ts`
**Criticality:** CRITICAL

Cascade deletes receipt images from Firebase Storage when a transaction document is deleted. Ensures data integrity by preventing orphaned files.

**Trigger Path:**
```
artifacts/{appId}/users/{userId}/transactions/{transactionId}
```

**Behavior:**
1. Fires when a transaction document is deleted
2. Extracts `userId` and `transactionId` from the document path
3. Deletes all files in `users/{userId}/receipts/{transactionId}/`

**Error Handling:**
- Storage failures are logged but don't throw errors
- Orphaned images are acceptable (can be cleaned up later)
- Transaction is already deleted, so we can't reverse it

**Dependencies:**
- `storageService.ts` - Firebase Storage delete operations

---

### onTransactionWrite

**Type:** Firestore Trigger (2nd gen, `onDocumentWritten`)
**File:** `functions/src/changelogWriter.ts`
**Criticality:** CRITICAL
**Added:** Epic 14d-v2 (Stories 14d-v2-1-8a/8b/8c)

Primary sync mechanism for shared groups. Fires on any transaction document write (create, update, delete) and detects changes to the `sharedGroupId` field.

**Trigger Path:**
```
artifacts/{appId}/users/{userId}/transactions/{transactionId}
```

**Handled Cases:**
1. **Soft delete** (`deletedAt` set while in group) - writes `TRANSACTION_REMOVED`
2. **Hard delete** (document deleted while in group) - writes `TRANSACTION_REMOVED`
3. **Group change** (groupA to groupB) - atomic batch: `REMOVED` from old + `ADDED` to new
4. **Removed from group** (group to null) - writes `TRANSACTION_REMOVED`
5. **Added to group** (null to group) - writes `TRANSACTION_ADDED` with full data
6. **Modified within group** (same group, data changed) - writes `TRANSACTION_MODIFIED`

**Security:**
- GroupId format validation
- Group membership verification before writing
- HTML tag sanitization on summary fields
- Deterministic document IDs for idempotent retries
- 30-day TTL on all changelog entries

---

### onMemberRemoved

**Type:** Firestore Trigger (1st gen, `onUpdate`)
**File:** `functions/src/triggers/onMemberRemoved.ts`
**Criticality:** CRITICAL
**Added:** Epic 14d-v2 (Story 14d-v2-1-7c)

Detects when members are removed from a shared group's `members` array and creates `TRANSACTION_REMOVED` changelog entries for their shared transactions.

**Trigger Path:**
```
sharedGroups/{groupId}
```

**Behavior:**
1. Compares before/after `members` arrays to find removed members
2. Queries removed member's transactions tagged with this `sharedGroupId`
3. Creates `TRANSACTION_REMOVED` changelog entries for each transaction
4. Uses deterministic IDs (`removed-{memberId}-{transactionId}`) for idempotency
5. Processes in parallel batches of 50, safety cap of 500 transactions per member

---

## FEATURE Functions

### cleanupCrossUserFcmToken

**Type:** HTTPS Callable
**File:** `functions/src/cleanupCrossUserFcmToken.ts`
**Criticality:** FEATURE

Removes an FCM token from all users except the calling user. Solves the shared device problem where the same FCM token gets registered to multiple user accounts.

**Use Case:**
When users share devices (e.g., family tablet), the same FCM token can end up registered to multiple accounts, causing notifications for User B to appear on User A's device.

**Authentication:** Required (Firebase Auth)

**Called From:** `src/services/fcmTokenService.ts` → `saveFCMTokenWithTracking()`

---

### saveWebPushSubscription

**Type:** HTTPS Callable
**File:** `functions/src/webPushService.ts`
**Criticality:** FEATURE

Saves a VAPID web push subscription for the authenticated user. Implements single-device policy.

**Behavior:**
1. Deletes ALL existing subscriptions for the user
2. Deletes same endpoint from OTHER users (cross-user cleanup)
3. Saves the new subscription

**Authentication:** Required (Firebase Auth)

**Storage Path:**
```
artifacts/{appId}/users/{userId}/pushSubscriptions/{subscriptionId}
```

---

### deleteWebPushSubscription

**Type:** HTTPS Callable
**File:** `functions/src/webPushService.ts`
**Criticality:** FEATURE

Deletes all web push subscriptions for the authenticated user. Called during logout.

**Authentication:** Required (Firebase Auth)

---

### getVapidPublicKey

**Type:** HTTP Endpoint
**File:** `functions/src/webPushService.ts`
**Criticality:** FEATURE

Returns the VAPID public key for client-side subscription setup. Public endpoint.

**Authentication:** None (public key is safe to expose)

**Response:**
```json
{ "publicKey": "BN..." }
```

---

## MAINTENANCE Functions

### cleanupStaleFcmTokens

**Type:** Scheduled (Pub/Sub)
**File:** `functions/src/cleanupStaleFcmTokens.ts`
**Criticality:** MAINTENANCE

Scheduled function that runs daily to clean up stale FCM tokens.

**Schedule:** `0 3 * * *` (Daily at 3:00 AM UTC)

**Cleanup Logic:**
1. Query all users in `artifacts/{appId}/users`
2. For each user, query their `fcmTokens` subcollection
3. Delete tokens where `lastUsedAt < (now - 60 days)`
4. Also clean up legacy tokens without `lastUsedAt`
5. Clean up old rate limit documents (older than 24 hours)

**Constants:**
| Constant | Value |
|----------|-------|
| `STALE_TOKEN_DAYS` | 60 |
| `BATCH_SIZE` | 500 |

---

## ADMIN Functions

These functions are debugging utilities and are NOT secured for production use. They use a simple secret query parameter.

### adminCleanupUserTokens

**Type:** HTTP Endpoint
**File:** `functions/src/cleanupCrossUserFcmToken.ts`

**Usage:**
```
POST /adminCleanupUserTokens?userId=xxx&secret=fcm-cleanup-2026
```

Cleans up all FCM tokens for a specific user except the most recent one.

---

### adminSendTestNotification

**Type:** HTTP Endpoint
**File:** `functions/src/cleanupCrossUserFcmToken.ts`

**Usage:**
```
GET /adminSendTestNotification?userId=xxx&secret=fcm-cleanup-2026
```

Sends a test FCM push notification to a user.

---

### adminTestWebPush

**Type:** HTTP Endpoint
**File:** `functions/src/webPushService.ts`

**Usage:**
```
GET /adminTestWebPush?userId=xxx&secret=fcm-cleanup-2026
```

Sends a test VAPID web push notification to a user.

---

## Environment Variables

> **Note:** Story 14c-refactor.15 audited all Cloud Functions configuration.
> Environment variables (`.env` files) are the preferred method for local development.
> For production, the function checks `process.env.GEMINI_API_KEY` first, then falls back
> to `functions.config().gemini.api_key` for backwards compatibility.
>
> **Migration path:** `functions.config()` is deprecated (March 2026). To migrate:
> 1. Set up Secret Manager: `firebase functions:secrets:set GEMINI_API_KEY`
> 2. Or use environment config: `firebase functions:config:set gemini.api_key="YOUR_KEY"`

### Production (Secret Manager)

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push | Yes |

### Environment (.env)

| Variable | Purpose | Required |
|----------|---------|----------|
| `VAPID_PUBLIC_KEY` | VAPID public key (safe to commit) | Yes |
| `VAPID_SUBJECT` | VAPID subject (mailto: URI) | Yes |

### Local Development

Create `functions/.env` (gitignored):
```
GEMINI_API_KEY=your-api-key
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:notifications@boletapp.com
```

---

## Security Considerations

### Authentication Requirements

| Function | Auth Required | Method |
|----------|---------------|--------|
| `analyzeReceipt` | Yes | Firebase Auth |
| `onTransactionDeleted` | N/A | Firestore trigger |
| `cleanupStaleFcmTokens` | N/A | Scheduled |
| `cleanupCrossUserFcmToken` | Yes | Firebase Auth |
| `saveWebPushSubscription` | Yes | Firebase Auth |
| `deleteWebPushSubscription` | Yes | Firebase Auth |
| `getVapidPublicKey` | No | Public |
| Admin functions | Secret param | NOT production secure |

### Admin Function Warning

The admin functions (`adminCleanupUserTokens`, `adminSendTestNotification`, `adminTestWebPush`) use a simple secret query parameter for access control. This is **NOT** secure for production environments and is intended only for debugging during development.

**Current Secret:** `fcm-cleanup-2026`

If these functions need to be used in production, they should be:
1. Protected with Firebase Auth admin claims
2. Rate limited
3. Behind a VPN or IP whitelist

---

## File Structure

```
functions/src/
├── index.ts                     # Function exports
├── analyzeReceipt.ts            # Receipt OCR (CRITICAL)
├── deleteTransactionImages.ts   # Cascade delete (CRITICAL)
├── cleanupStaleFcmTokens.ts     # Scheduled cleanup (MAINTENANCE)
├── changelogWriter.ts           # Shared group sync (CRITICAL)
├── cleanupCrossUserFcmToken.ts  # FCM token utilities (FEATURE/ADMIN)
├── webPushService.ts            # VAPID web push (FEATURE/ADMIN)
├── triggers/
│   └── onMemberRemoved.ts      # Member removal handler (CRITICAL)
├── imageProcessing.ts           # Image resize/compress
├── storageService.ts            # Firebase Storage utilities
├── prompts/                     # AI prompt templates
│   ├── index.ts
│   ├── types.ts
│   ├── v1-original.ts
│   ├── v2-multi-currency-receipt-types.ts
│   ├── v3-category-standardization.ts  # Current production
│   ├── input-hints.ts
│   └── output-schema.ts
├── shared/schema/               # Shared type definitions
│   ├── index.ts
│   ├── categories.ts
│   └── currencies.ts
└── __tests__/                   # Unit tests
    ├── analyzeReceipt.test.ts
    └── imageProcessing.test.ts
```

---

## Deployment

### Dry Run

```bash
cd functions
firebase deploy --only functions --dry-run
```

### Production Deploy

```bash
firebase deploy --only functions
```

### Deploy Single Function

```bash
firebase deploy --only functions:analyzeReceipt
```

---

## Removed Functions

### getSharedGroupTransactions (Removed in Story 14c-refactor.1)

This function was removed as part of the Epic 14c-refactor cleanup. It was part of the Shared Groups feature which has been reverted.

**Removal Details:**
- Story: 14c-refactor.1
- Date: 2026-01-21
- Reason: Shared Groups feature reverted; function no longer needed
- Test file deleted: `functions/src/__tests__/getSharedGroupTransactions.test.ts`

---

## Related Documentation

- [API Contracts](./api-contracts.md) - REST API documentation
- [Architecture](./architecture.md) - System architecture overview
- [React Query Caching](./react-query-caching.md) - Client-side caching patterns
- [Firestore Indexes](./firestore-indexes.md) - Index configuration
