# Story 16-7: Replace Cross-Feature Store Writes with Event Bus (mitt)

## Status: done

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by replacing hardwired connections with broadcast signals -- features listen, not import"

## Story
As a developer, I want cross-feature handoffs to use a typed event bus, so that scan results flow to consumers without direct store imports.

## Acceptance Criteria

### Functional
- **AC-1:** Given `processScan.ts` directly calls `transactionEditorActions.setTransaction()`, when replaced, then it emits `scan:completed` event with transaction data
- **AC-2:** Given `useTransactionEditorHandlers` calls `batchReviewActions.finishEditing()`, when replaced, then it emits `review:saved` event
- **AC-3:** Given typed event map `AppEvents` exists in `shared/events/eventTypes.ts`, when an event name is misspelled, then TypeScript compiler catches it
- **AC-4:** Given event subscriptions in `useEffect`, when component unmounts, then subscription is cleaned up (no leaks)
- **AC-5:** Given `mitt` is installed, when the event bus is instantiated, then it uses the typed `AppEvents` map for compile-time safety

### Architectural
- **AC-ARCH-LOC-1:** Event bus at `src/shared/events/eventBus.ts`
- **AC-ARCH-LOC-2:** Event types at `src/shared/events/eventTypes.ts`
- **AC-ARCH-LOC-3:** Events barrel at `src/shared/events/index.ts`
- **AC-ARCH-PATTERN-1:** Events use `feature:action` format, past tense: `scan:completed`, `review:saved`, `scan:cancelled`
- **AC-ARCH-PATTERN-2:** Events carry IDs only, never full objects
- **AC-ARCH-PATTERN-3:** All subscriptions return cleanup functions used in `useEffect` return
- **AC-ARCH-NO-1:** No `processScan.ts` imports from `@features/transaction-editor`
- **AC-ARCH-NO-2:** No `useTransactionEditorHandlers.ts` imports from `@features/batch-review`

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Event types | `src/shared/events/eventTypes.ts` | Architecture doc (4b) | NEW |
| Event bus | `src/shared/events/eventBus.ts` | mitt typed emitter | NEW |
| Events barrel | `src/shared/events/index.ts` | Shared barrel | NEW |
| Process scan | `src/features/scan/handlers/processScan/processScan.ts` | Feature handler | MODIFIED |
| Editor handlers | `src/features/transaction-editor/views/.../useTransactionEditorHandlers.ts` | Feature hook | MODIFIED |
| Editor subscription hook | `src/features/transaction-editor/hooks/useScanEventSubscription.ts` | Feature hook | NEW |
| Batch review subscription | `src/features/batch-review/hooks/useScanEventSubscription.ts` | Feature hook | NEW |
| Integration tests | `tests/integration/eventBus.test.ts` | Vitest | NEW |

## Tasks

### Task 1: Install mitt and Create Event Infrastructure (3 subtasks)
- [x] 1.1: Install `mitt` as a dependency (`npm install mitt`)
- [x] 1.2: Create `src/shared/events/eventTypes.ts` — typed event map:
  ```typescript
  type AppEvents = {
    'scan:completed': { transactionIds: string[] }
    'scan:cancelled': { mode: ScanMode }
    'review:saved': { transactionIds: string[] }
  }
  ```
- [x] 1.3: Create `src/shared/events/eventBus.ts` — typed mitt instance + barrel export

### Task 2: Replace processScan Cross-Feature Write (3 subtasks)
- [x] 2.1: In `processScan.ts`, replace `transactionEditorActions.setTransaction()` with `appEvents.emit('scan:completed', { transactionIds })`
- [x] 2.2: Remove import of `@features/transaction-editor/store` from `processScan.ts`
- [x] 2.3: Create `useScanEventSubscription.ts` in transaction-editor — subscribes to `scan:completed`, calls local `setTransaction()` handler

### Task 3: Replace Transaction-Editor Cross-Feature Write (3 subtasks)
- [x] 3.1: In `useTransactionEditorHandlers.ts`, replace `batchReviewActions.finishEditing()` with `appEvents.emit('review:saved', { transactionIds })`
- [x] 3.2: Remove import of `@features/batch-review` from `useTransactionEditorHandlers.ts`
- [x] 3.3: Create `useBatchReviewEventSubscription.ts` in batch-review — subscribes to `review:saved`, calls local `finishEditing()` handler

### Task 4: Hardening — Cleanup and Integration (3 subtasks)
- [x] 4.1: Verify all `useEffect` subscriptions return cleanup (via `appEvents.off()`)
- [x] 4.2: Write integration test: emit `scan:completed` -> verify transaction-editor receives -> verify state update
- [x] 4.3: Write integration test: emit `review:saved` -> verify batch-review receives -> verify finishEditing called

### Task 5: Verification (3 subtasks)
- [x] 5.1: Run `npm run test:quick` — all 7165 tests pass (312 files)
- [x] 5.2: Run `npx tsc --noEmit` — zero TypeScript errors
- [x] 5.3: Verify zero cross-feature store WRITE imports between scan/batch-review/transaction-editor (grep check)

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 15
- **Files:** ~8

## Dependencies
- **16-6** (shared workflow store must exist — events complement shared state reads)

## Risk Flags
- CROSS_STORE (replacing direct writes with events)

## Deferred Items (from code review 2026-03-07)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-16-5 | Populate event payloads + rename review:saved + remove getScanState coupling | LOW | CREATED |

## Senior Developer Review (ECC)
- **Date:** 2026-03-07
- **Classification:** COMPLEX
- **Agents:** code-reviewer, security-reviewer (opus), architect (opus), tdd-guide
- **Outcome:** APPROVE 8.6/10
- **Quick fixes:** 1 (event type JSDoc documentation)
- **TD stories created:** 1 (TD-16-5: payload polish + naming + coupling)
<!-- CITED: L2-004 (feature module exports), L2-008 (TOCTOU — N/A, no auth mutations) -->

## Dev Notes
- Architecture decision 4b specifies `mitt` and the `feature:action` naming convention — follow exactly.
- Events carry IDs only, never full objects. The subscriber fetches data from the shared workflow store using the IDs.
- The `scan:cancelled` event is defined for future use (statement scanning cancel propagation). Not wired in this story.
- `useEffect` cleanup pattern:
  ```typescript
  useEffect(() => {
    const unsub = appEvents.on('scan:completed', handleScanComplete)
    return () => unsub()
  }, [])
  ```
- After this story, the feature-level cycle `batch-review -> scan -> transaction-editor -> batch-review` is BROKEN. All three features point to `shared/` — hub-and-spoke topology.
