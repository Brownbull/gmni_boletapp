# Tech Debt Story TD-16-5: Event Bus Payload and Naming Polish

Status: done

> **Source:** ECC Code Review (2026-03-07) on story 16-7
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **event payloads to carry actual transaction IDs and event names to match their semantics**, so that **the event bus contract is honest and cross-feature read coupling is eliminated**.

## Acceptance Criteria
- AC-1: `scan:completed` emits populated `resultIndex` (not empty transactionIds)
- AC-2: `useScanEventSubscription` reads from shared workflow store, not `getScanState()` — removes `@features/scan/store` import
- AC-3: `review:saved` renamed to `batch:editing-finished` to match cancel-path semantics
- AC-4: All tests updated to match new payloads and event names

## Tasks / Subtasks
### Task 1: Populate scan:completed payload (2 subtasks)
- [x] 1.1: In processScan.ts, emit `{ resultIndex: 0 }` instead of empty `{ transactionIds: [] }`
- [x] 1.2: In useScanEventSubscription.ts, read from shared workflow store's `pendingTransaction`

### Task 2: Eliminate cross-feature read coupling (2 subtasks)
- [x] 2.1: Remove `getScanState` import from `useScanEventSubscription.ts`
- [x] 2.2: Added `pendingTransaction` to shared workflow store; `processSuccess` mirrors active result

### Task 3: Rename review:saved event (3 subtasks)
- [x] 3.1: Rename `review:saved` to `batch:editing-finished` in AppEvents type
- [x] 3.2: Update emit site in useTransactionEditorHandlers.ts
- [x] 3.3: Update subscriber in useBatchReviewEventSubscription.ts

### Task 4: Update tests (2 subtasks)
- [x] 4.1: Update unit tests for new payloads (eventBus, useScanEventSubscription, useBatchReviewEventSubscription, processScan)
- [x] 4.2: Update integration test for renamed event and new payloads

## Dev Notes
- Source story: [16-7](./16-7-event-bus.md)
- Review findings: #2 (cross-feature READ coupling), #3 (event naming)
- Architecture decision: Option A — `pendingTransaction` added to shared workflow store. `processSuccess` mirrors active result. Subscriber reads from `getWorkflowState().pendingTransaction`. Maintains "IDs/indices only in payloads" pattern.
- Files changed (13): eventTypes.ts, useScanWorkflowStore.ts, shared/stores/index.ts, scanCoreSlice.ts, processScan.ts, useScanEventSubscription.ts, useTransactionEditorHandlers.ts, useBatchReviewEventSubscription.ts + 5 test files

## Senior Developer Review (KDBP)
- **Date:** 2026-03-07
- **Agents:** code-reviewer, security-reviewer (opus), architect (opus), tdd-guide
- **Classification:** COMPLEX (14 files)
- **Score:** 8.7/10
- **Outcome:** APPROVE — 1 quick fix (added setPendingTransaction unit test), 0 TD stories
- **Findings:** All LOW/info — vestigial resultIndex (intentional forward-compat), defense-in-depth shape validation suggestion (single-writer contract makes it safe)
<!-- CITED: none -->
