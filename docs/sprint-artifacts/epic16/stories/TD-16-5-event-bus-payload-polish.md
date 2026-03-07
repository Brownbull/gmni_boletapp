# Tech Debt Story TD-16-5: Event Bus Payload and Naming Polish

Status: ready-for-dev

> **Source:** ECC Code Review (2026-03-07) on story 16-7
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **event payloads to carry actual transaction IDs and event names to match their semantics**, so that **the event bus contract is honest and cross-feature read coupling is eliminated**.

## Acceptance Criteria
- AC-1: `scan:completed` emits populated `transactionIds` array (not empty)
- AC-2: `useScanEventSubscription` reads IDs from event payload, not `getScanState()` — removes `@features/scan/store` import
- AC-3: `review:saved` renamed to `batch:editing-finished` (or similar) to match cancel-path semantics
- AC-4: All tests updated to match new payloads and event names

## Tasks / Subtasks
### Task 1: Populate scan:completed payload (2 subtasks)
- [ ] 1.1: In processScan.ts, pass transaction IDs from `finalTransaction` to event payload
- [ ] 1.2: In useScanEventSubscription.ts, read transaction from event payload or shared store using IDs

### Task 2: Eliminate cross-feature read coupling (2 subtasks)
- [ ] 2.1: Remove `getScanState` import from `useScanEventSubscription.ts`
- [ ] 2.2: Pass needed data via event payload or shared workflow store

### Task 3: Rename review:saved event (3 subtasks)
- [ ] 3.1: Rename `review:saved` to `batch:editing-finished` in AppEvents type
- [ ] 3.2: Update emit site in useTransactionEditorHandlers.ts
- [ ] 3.3: Update subscriber in useBatchReviewEventSubscription.ts

### Task 4: Update tests (2 subtasks)
- [ ] 4.1: Update unit tests for new payloads
- [ ] 4.2: Update integration test for renamed event

## Dev Notes
- Source story: [16-7](./16-7-event-bus.md)
- Review findings: #2 (cross-feature READ coupling), #3 (event naming)
- Files affected: eventTypes.ts, processScan.ts, useScanEventSubscription.ts, useTransactionEditorHandlers.ts, useBatchReviewEventSubscription.ts, + test files
- Note: Transaction IDs may not exist at emit time (not yet persisted). Consider passing store index or using shared workflow store IDs.
