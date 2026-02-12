# Tech Debt Story TD-15-TD-23: Document ID Segment Validation in Service Functions

Status: ready-for-dev

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

- [ ] **AC1:** `transactionId` validated in `firestore.ts` CRUD functions (`deleteTransaction`, `updateTransaction`, `getTransaction`)
- [ ] **AC2:** `mappingId` validated in `mappingServiceBase.ts` document operations
- [ ] **AC3:** `merchantId`/`normalizedName` validated in `merchantTrustService.ts` document operations
- [ ] **AC4:** `airlockId` validated in `airlockService.ts` document operations
- [ ] **AC5:** `recordId` validated in `recordsService.ts` document operations
- [ ] **AC6:** All existing tests pass after adding validation calls

## Tasks

- [ ] **Task 1:** Add `assertValidSegment` calls (or migrate to `*DocSegments` pattern) in `firestore.ts`
- [ ] **Task 2:** Add validation in `mappingServiceBase.ts`, `merchantTrustService.ts`
- [ ] **Task 3:** Add validation in `airlockService.ts`, `recordsService.ts`
- [ ] **Task 4:** Verify tests pass — update mocks if validation throws on existing test fixtures

## Dev Notes

- Source story: [15-TD-18](./15-TD-18-path-parameter-validation.md)
- Review findings: Security review MEDIUM-1
- `assertValidSegment` is module-private in `firestorePaths.ts` — either export it or add inline validation in services
- Alternative: migrate all `doc(db, path, id)` calls to use `*DocSegments` functions which already validate
- Firestore Security Rules provide server-side mitigation — this is defense-in-depth only
- Files affected: `src/services/firestore.ts`, `src/services/mappingServiceBase.ts`, `src/services/merchantTrustService.ts`, `src/features/insights/services/airlockService.ts`, `src/features/insights/services/recordsService.ts`
