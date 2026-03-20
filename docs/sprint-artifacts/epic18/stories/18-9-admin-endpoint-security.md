# Story 18-9: Admin Endpoint Security — Replace Hardcoded Secrets with Firebase Auth

## Status: backlog

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Lock the back door — admin endpoints use a shared secret anyone could guess"

## Story
As a developer, I want to replace the hardcoded query-parameter secret (`fcm-cleanup-2026`) on all admin HTTP endpoints with Firebase Auth verification, so that only authenticated admin users can invoke admin operations and we eliminate the security risk of a shared plaintext secret in source code.

## Context
- 3 admin endpoints exist: `adminCleanupUserTokens`, `adminTestWebPush`, `adminSendTestNotification`
- All use the same hardcoded secret: `?secret=fcm-cleanup-2026` as query parameter
- Secret is visible in source code, git history, and any HTTP logs
- Source: 18-1 spike adversarial review finding
- These endpoints are HTTP triggers (not callable), so Firebase Auth must be verified manually via ID token in Authorization header

## Acceptance Criteria

### Functional
- **AC-1:** All 3 admin endpoints require Firebase Auth ID token in `Authorization: Bearer <token>` header
- **AC-2:** Token verified via `admin.auth().verifyIdToken(token)` — rejects expired/invalid tokens
- **AC-3:** Admin check: verified UID must be in admin allowlist (environment variable or Firestore config)
- **AC-4:** Hardcoded secret (`fcm-cleanup-2026`) completely removed from all files
- **AC-5:** Unauthenticated requests return 401, non-admin authenticated requests return 403
- **AC-6:** Error responses don't leak admin UIDs or token details

### Architectural
- **AC-ARCH-1:** Shared `verifyAdminAuth(req)` middleware function in `functions/src/utils/adminAuth.ts`
- **AC-ARCH-2:** Admin UID allowlist via `functions.config().admin.uids` or environment variable (NOT hardcoded)
- **AC-ARCH-3:** All 3 endpoints use the same middleware — no per-endpoint auth logic

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Admin auth middleware | `functions/src/utils/adminAuth.ts` | NEW |
| FCM cleanup endpoint | `functions/src/cleanupCrossUserFcmToken.ts` | MODIFY (replace secret with middleware) |
| Web push test endpoint | `functions/src/webPushService.ts` | MODIFY (replace secret with middleware) |
| Functions config | Firebase environment config | MODIFY (add admin.uids) |
| Admin auth tests | `functions/src/utils/__tests__/adminAuth.test.ts` | NEW |

## Tasks

### Task 1: Create Admin Auth Middleware (3 subtasks)
- [ ] 1.1: Create `verifyAdminAuth(req, res)`: extract Bearer token from Authorization header, verify with `admin.auth().verifyIdToken(token)`
- [ ] 1.2: Check verified UID against admin allowlist (from environment config: `functions.config().admin.uids` — comma-separated UIDs)
- [ ] 1.3: Return 401 for missing/invalid token, 403 for non-admin UID — error responses reveal nothing about admin list

### Task 2: Migrate Endpoints (2 subtasks)
- [ ] 2.1: Replace `secret` query parameter check with `verifyAdminAuth(req, res)` in `adminCleanupUserTokens` and `adminSendTestNotification` (cleanupCrossUserFcmToken.ts)
- [ ] 2.2: Replace `secret` query parameter check with `verifyAdminAuth(req, res)` in `adminTestWebPush` (webPushService.ts)

### Task 3: Remove Hardcoded Secret (1 subtask)
- [ ] 3.1: Grep for `fcm-cleanup-2026` across entire codebase, remove all occurrences (source, tests, docs, comments)

### Task 4: Configure Admin Allowlist (1 subtask)
- [ ] 4.1: Set admin UIDs via `firebase functions:config:set admin.uids="uid1,uid2"` on both staging and production

### Task 5: Tests (2 subtasks)
- [ ] 5.1: Unit tests for verifyAdminAuth: valid admin token → pass, valid non-admin token → 403, invalid token → 401, missing header → 401
- [ ] 5.2: Verify no remaining references to hardcoded secret in codebase (automated grep check)

## Sizing
- **Points:** 3 (SMALL-MEDIUM)
- **Tasks:** 5
- **Subtasks:** 9
- **Files:** ~5

## Dependencies
- None (independent story)

## Risk Flags
- CONFIG_DEPLOYMENT (admin UIDs must be set via functions config BEFORE deploying — otherwise all admin endpoints become inaccessible)
- TESTING_DIFFICULTY (testing Firebase Auth in unit tests requires mocking admin.auth().verifyIdToken)
