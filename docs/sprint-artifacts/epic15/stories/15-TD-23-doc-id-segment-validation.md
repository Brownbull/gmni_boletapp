# Tech Debt Story TD-15-TD-23: Document ID Segment Validation in Service Functions

Status: done

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-18
> **Priority:** LOW
> **Estimated Effort:** 2 points

## Story

As a **developer**,
I want **all Firestore document ID parameters in service functions to pass through `assertValidSegment` validation**,
So that **the defense-in-depth path validation introduced in TD-18 is applied consistently across all `doc()` call sites, not just the `*DocSegments` path builders**.

## Context

Story 15-TD-18 added `assertValidSegment` validation for `userId`, `transactionId`, and `notificationId` in `firestorePaths.ts` path builders. However, several service functions construct document references using `doc(db, collectionPath(...), documentId)` where the `documentId` is appended directly without validation. The collection path (via `transactionsPath()` etc.) validates `appId` and `userId`, but the document ID segment is unvalidated.

In practice, document IDs come from Firestore auto-generation or query results (trusted data), and Security Rules enforce `auth.uid == userId` regardless. This is a defense-in-depth consistency improvement, not a vulnerability fix.

## Acceptance Criteria

- [x] **AC1:** `transactionId` validated in `firestore.ts` CRUD functions (`deleteTransaction`, `updateTransaction`, `deleteTransactionsBatch`, `updateTransactionsBatch`)
- [x] **AC2:** `mappingId` validated in `mappingServiceBase.ts` document operations
- [x] **AC3:** `merchantId`/`normalizedName` validated in `merchantTrustService.ts` document operations (uses `assertValidDocumentId` for space-containing normalized names)
- [x] **AC4:** `airlockId` validated in `airlockService.ts` document operations
- [x] **AC5:** `recordId` validated in `recordsService.ts` document operations
- [x] **AC6:** All existing tests pass after adding validation calls (6910 tests, 283 files)

## Tasks

- [x] **Task 1:** Add `assertValidSegment` calls in `firestore.ts` (4 functions: deleteTransaction, updateTransaction, deleteTransactionsBatch, updateTransactionsBatch)
- [x] **Task 2:** Add validation in `mappingServiceBase.ts` (3 functions) + `merchantTrustService.ts` (7 functions using `assertValidDocumentId`)
- [x] **Task 3:** Add validation in `airlockService.ts` (3 functions) + `recordsService.ts` (2 functions)
- [x] **Task 4:** Updated 3 test mock files, all 6910 tests pass

## Dev Notes

- Source story: [15-TD-18](./15-TD-18-path-parameter-validation.md)
- Review findings: Security review MEDIUM-1
- **Decision:** Exported `assertValidSegment` from `firestorePaths.ts` (was module-private) + created new `assertValidDocumentId` with `[a-zA-Z0-9_ -]+` pattern
- **Key finding:** `normalizeForMapping()` produces names with spaces (e.g., "jumbo mall 123") — `assertValidSegment` would reject these, so `assertValidDocumentId` was created for merchantTrustService
- **Two-tier validation:** Strict `assertValidSegment` for auto-generated IDs (transactionId, mappingId, airlockId, recordId) vs space-permitting `assertValidDocumentId` for normalized merchant names
- Firestore Security Rules provide server-side mitigation — this is defense-in-depth only
- Files modified: `src/lib/firestorePaths.ts`, `src/services/firestore.ts`, `src/services/mappingServiceBase.ts`, `src/services/merchantTrustService.ts`, `src/features/insights/services/airlockService.ts`, `src/features/insights/services/recordsService.ts`
- Test files updated: `firestorePaths.test.ts` (+40 lines), `firestore.mutations.test.ts` (mock), `merchantTrustService.recordScan.test.ts` (mock), `merchantTrustService.trust.test.ts` (mock)
- **Reviews:** Code review APPROVE (0 HIGH), Security review APPROVE (0 HIGH)

## Senior Developer Review (ECC)

- **Date:** 2026-02-13
- **Classification:** STANDARD
- **Agents:** code-reviewer, security-reviewer
- **Overall Score:** 9/10
- **Outcome:** APPROVE — 1 quick fix applied, 0 TD stories created

### Quick Fix Applied
- **Finding #2 (LOW):** `assertValidDocumentId` now rejects whitespace-only strings (added `!value.trim()` check + 2 test cases)

### Deferred Items (No Action Needed)
| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| 1 | Service test mocks use no-op `vi.fn()` for validators | MEDIUM | Mitigated — `firestorePaths.test.ts` has 40+ edge-case tests covering both validators comprehensively |
| 3 | Generic error messages (can't distinguish empty/too-long/path-traversal) | LOW | Cosmetic observability improvement — no security impact, not worth a TD story |
