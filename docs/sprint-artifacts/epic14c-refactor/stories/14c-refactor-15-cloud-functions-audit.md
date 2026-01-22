# Story 14c-refactor.15: Cloud Functions Audit

Status: ready-for-dev

## Story

As a **developer**,
I want **all Cloud Functions audited and consolidated**,
So that **only necessary functions remain, naming is consistent, and documentation exists for future maintenance**.

## Acceptance Criteria

### Core Requirements (from epics.md)

1. **AC1:** Inventory all Cloud Functions with their purposes in `docs/architecture/cloud-functions.md`
2. **AC2:** Identify and document any unused functions (mark for potential removal in future)
3. **AC3:** Ensure consistent naming convention (camelCase) across all function exports
4. **AC4:** Verify all functions have proper error handling
5. **AC5:** Update `functions/src/index.ts` exports to be well-organized with comments
6. **AC6:** Functions deploy successfully: `firebase deploy --only functions --dry-run`

### Atlas-Enhanced Requirements

7. **AC7:** Document function criticality levels: `critical` (breaks core features if removed), `admin` (debugging/maintenance), `deprecated` (scheduled for removal)
8. **AC8:** Delete orphan test file `functions/src/__tests__/getSharedGroupTransactions.test.ts` (function was deleted in Story 14c-refactor.1)
9. **AC9:** Add JSDoc comments to all function exports in `functions/src/index.ts` explaining purpose and dependencies

## Tasks / Subtasks

- [ ] **Task 1: Function Inventory** (AC: #1, #7)
  - [ ] 1.1: Document `analyzeReceipt` - HTTPS Callable, Receipt OCR with Gemini AI
  - [ ] 1.2: Document `onTransactionDeleted` - Firestore Trigger, Cascade delete images
  - [ ] 1.3: Document `cleanupStaleFcmTokens` - Scheduled (daily 3AM UTC), Token cleanup
  - [ ] 1.4: Document `cleanupCrossUserFcmToken` - HTTPS Callable, Shared device token cleanup
  - [ ] 1.5: Document `adminCleanupUserTokens` - HTTP, Admin token cleanup utility
  - [ ] 1.6: Document `adminSendTestNotification` - HTTP, Admin FCM test utility
  - [ ] 1.7: Document `saveWebPushSubscription` - HTTPS Callable, VAPID subscription save
  - [ ] 1.8: Document `deleteWebPushSubscription` - HTTPS Callable, VAPID subscription delete
  - [ ] 1.9: Document `adminTestWebPush` - HTTP, Admin VAPID test utility
  - [ ] 1.10: Document `getVapidPublicKey` - HTTP, Return VAPID public key for client

- [ ] **Task 2: Criticality Classification** (AC: #7)
  - [ ] 2.1: Mark `analyzeReceipt` as **CRITICAL** - Core scan feature
  - [ ] 2.2: Mark `onTransactionDeleted` as **CRITICAL** - Data integrity
  - [ ] 2.3: Mark `cleanupStaleFcmTokens` as **MAINTENANCE** - Background cleanup
  - [ ] 2.4: Mark notification functions as **FEATURE** - PWA notifications
  - [ ] 2.5: Mark admin functions as **ADMIN** - Debugging utilities
  - [ ] 2.6: Note: No functions currently marked DEPRECATED

- [ ] **Task 3: Code Quality Audit** (AC: #3, #4, #5, #9)
  - [ ] 3.1: Review naming conventions (all use camelCase - verified)
  - [ ] 3.2: Audit error handling in each function
  - [ ] 3.3: Add JSDoc comments to index.ts exports
  - [ ] 3.4: Organize exports by category (Core, Notifications, Admin)

- [ ] **Task 4: Dead Code Cleanup** (AC: #2, #8)
  - [ ] 4.1: Delete `functions/src/__tests__/getSharedGroupTransactions.test.ts`
  - [ ] 4.2: Verify no other orphan files exist in functions/src/
  - [ ] 4.3: Document that `getSharedGroupTransactions.ts` was removed in Story 14c-refactor.1

- [ ] **Task 5: Documentation & Deployment** (AC: #1, #6)
  - [ ] 5.1: Create `docs/architecture/cloud-functions.md` with full documentation
  - [ ] 5.2: Run `firebase deploy --only functions --dry-run` to verify deployment
  - [ ] 5.3: Commit documentation changes

## Dev Notes

### Current Functions Inventory (Pre-Audit)

From `functions/src/index.ts`:

```typescript
// Core Receipt Processing
export { analyzeReceipt } from './analyzeReceipt'
export { onTransactionDeleted } from './deleteTransactionImages'

// FCM token cleanup utilities
export { cleanupStaleFcmTokens } from './cleanupStaleFcmTokens'
export { cleanupCrossUserFcmToken, adminCleanupUserTokens, adminSendTestNotification } from './cleanupCrossUserFcmToken'

// Web Push (VAPID) notifications
export { saveWebPushSubscription, deleteWebPushSubscription, adminTestWebPush, getVapidPublicKey } from './webPushService'
```

### Function Details

| Function | Type | Trigger | Rate Limit | Purpose |
|----------|------|---------|------------|---------|
| `analyzeReceipt` | Callable | Client call | 10/min/user | Receipt OCR via Gemini 2.0 Flash |
| `onTransactionDeleted` | Trigger | Firestore delete | N/A | Cascade delete images from Storage |
| `cleanupStaleFcmTokens` | Scheduled | Daily 3AM UTC | N/A | Delete tokens unused >60 days |
| `cleanupCrossUserFcmToken` | Callable | Client call | None | Clean shared device tokens |
| `adminCleanupUserTokens` | HTTP | Admin secret | None | Manual token cleanup |
| `adminSendTestNotification` | HTTP | Admin secret | None | Test FCM delivery |
| `saveWebPushSubscription` | Callable | Client call | None | Save VAPID subscription |
| `deleteWebPushSubscription` | Callable | Client call | None | Delete on logout |
| `adminTestWebPush` | HTTP | Admin secret | None | Test VAPID delivery |
| `getVapidPublicKey` | HTTP | Public | None | Return public key |

### Orphan Files to Clean Up

- `functions/src/__tests__/getSharedGroupTransactions.test.ts` - Function deleted in 14c-refactor.1

### Architectural Notes

- **Error Handling Pattern:** All callable functions use `functions.https.HttpsError`
- **Rate Limiting:** Only `analyzeReceipt` has rate limiting (10/min/user)
- **Admin Secret:** Admin functions use simple secret query param (`fcm-cleanup-2026`) - NOT production security
- **VAPID Keys:** Stored in environment variables (`.env` / Secret Manager)
- **Gemini API Key:** Migrated to Secret Manager per Story 14c.14

### Security Considerations

- Admin functions are NOT secured for production - intentional for debugging
- All user-facing callable functions require authentication
- VAPID private key must be in Secret Manager for production

### References

- [Source: functions/src/index.ts] - Function exports
- [Source: docs/architecture/api-contracts.md] - Partial Cloud Functions documentation
- [Source: Atlas 04-architecture.md] - ADRs and patterns
- [Source: Story 14c-refactor.1] - Removed getSharedGroupTransactions

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Scan Receipt Flow (#1):** `analyzeReceipt` is the core OCR function - must preserve
- **Batch Processing Flow (#3):** Uses `analyzeReceipt` for parallel processing
- **Scan Request Lifecycle (#9):** Relies on `analyzeReceipt` response format

### Downstream Effects to Consider

- Client code in `src/services/scanService.ts` calls `analyzeReceipt`
- Batch processing in `useBatchProcessing.ts` calls `analyzeReceipt` multiple times
- Storage cascade delete relies on `onTransactionDeleted` trigger

### Testing Implications

- **Existing tests to verify:** `analyzeReceipt.test.ts`, `imageProcessing.test.ts`
- **Dead test to delete:** `getSharedGroupTransactions.test.ts`
- **New scenarios:** None - this is audit/documentation story

### Workflow Chain Visualization

```
[User Scan Request] → analyzeReceipt → [Gemini OCR] → [Client Save]
                                                            ↓
[User Delete Transaction] → onTransactionDeleted → [Storage Cleanup]
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Story creation

### Completion Notes List

_To be filled during implementation_

### File List

**To Create:**
- `docs/architecture/cloud-functions.md`

**To Modify:**
- `functions/src/index.ts` (add JSDoc comments)

**To Delete:**
- `functions/src/__tests__/getSharedGroupTransactions.test.ts`
