# Story 18-13b: Resilient Scan Delivery — Client Integration

Status: ready-for-dev

> **Parent:** 18-13-resilient-scan-delivery (split into 18-13a backend + 18-13b client)
> **Source:** Production incident (2026-03-16) — scans succeed on backend but fail on mobile due to network drops
> **Priority:** HIGH | **Estimated Effort:** 6 points
> **DEPENDS:** 18-13a (backend must be deployed before client can integrate)

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "The scan waits for you, not the other way around"
**Value:** V5 — "Easier than the receipt drawer"

## Story
As a **user**, I want **my scan results to persist in Firebase even if my phone loses connection**, so that **when I reconnect, the results are waiting for me and I can continue with the normal cancel/edit/save flow without re-scanning**.

This is the **client half** of the async scan pipeline: image upload, callable wrapper, Firestore listener, scan lock, pending scan detection, resolution flows, and client tests. Requires 18-13a backend deployed first.

## Background
See parent story [18-13-resilient-scan-delivery.md](18-13-resilient-scan-delivery.md) for full architecture diagrams, credit lifecycle, and scan lock pattern.

### Target architecture (this story delivers Phases 1 + 4)
```
Phase 1 — Upload:
  Phone ──uploads images to Storage──> pending_scans/{userId}/{scanId}/

Phase 4 — Deliver:
  Phone ──onSnapshot listener on pending doc──> receives result when ready
           └── Firestore real-time (survives disconnects automatically) ──┘
```

## Acceptance Criteria

### Image upload + queue
- **AC-1:** Before calling `queueReceiptScan`, client uploads images to Storage at `pending_scans/{userId}/{scanId}/image_{n}.jpg`
- **AC-2:** Upload progress reflected in scan overlay (real progress via `uploadBytesResumable`, not faked)
- **AC-3:** If upload fails → show error, allow retry (no pending doc created yet, no credit deducted)
- **AC-4:** Client generates `scanId` via `crypto.randomUUID()` — same ID for Storage path and callable
- **AC-5:** `gemini.ts` — new `queueReceiptScan` callable wrapper accepting `{ scanId, imageUrls, receiptType? }`, returning `{ scanId }`

### Firestore listener
- **AC-6:** After callable returns `{ scanId }`, client attaches `onSnapshot` listener to `pending_scans/{userId}/{scanId}`
- **AC-7:** On status=completed → feed result into existing processScan pipeline (Step 5 onwards: parse, validate, route)
- **AC-8:** On status=failed → show error overlay with Retry/Cancel
- **AC-9:** Listener survives network disconnects — Firestore SDK handles offline/reconnect automatically
- **AC-10:** If `processingDeadline` has passed and status is still processing → treat as failed, show timeout error

### Pending scan detection on app load
- **AC-11:** On app init, query `pending_scans/{userId}` for any documents
- **AC-12:** If status=completed → resume resolution flow (show transaction editor with the result)
- **AC-13:** If status=processing and within deadline → show scan overlay in "processing" state, attach listener
- **AC-14:** If status=processing and past deadline → treat as failed, show error
- **AC-15:** If status=failed → show error overlay with Retry/Cancel

### Scan lock
- **AC-16:** While any pending scan exists → disable scan FAB (all scan types: single, batch, credit card)
- **AC-17:** Show visual indicator on locked scan button (e.g., badge or different icon state)
- **AC-18:** Tapping locked scan button → navigate to pending scan resolution screen

### Resolution + cleanup
- **AC-19:** On cancel → delete pending scan document (triggers server-side cleanup from 18-13a)
- **AC-20:** On save → copy images from `pending_scans/` to `receipts/{userId}/{transactionId}/`, save transaction, then delete pending doc. `transactionId` from processor result
- **AC-21:** After deletion → scan button unlocked, user can start new scan
- **AC-22:** Multi-device: resolution uses `runTransaction` to verify doc still exists before acting. If already resolved → show "already handled" toast

### Retry
- **AC-23:** Retry on failed scan creates a NEW pending scan (new scanId), deletes the old one. Same upload→queue→listener flow
- **AC-24:** Credit for retry deducted by the new `queueReceiptScan` call (old credit was refunded on failure by 18-13a)

## Architectural Acceptance Criteria (MANDATORY)

### File Location Requirements
- **AC-ARCH-LOC-1:** `FirestorePendingScan` imported from `src/types/pendingScan.ts` (defined in 18-13a). No duplicate type definitions.
- **AC-ARCH-LOC-2:** `pendingScanUpload.ts` lives under `src/features/scan/services/` (not hooks/ — pure async service, no React lifecycle).

### Pattern Requirements
- **AC-ARCH-PATTERN-2:** `usePendingScan` and `useScanLock` follow project hook pattern: all hook calls before any early return.
- **AC-ARCH-PATTERN-3:** `useScanLock` uses `useShallow` if reading multiple values from scan store.
- **AC-ARCH-PATTERN-4:** `onSnapshot` in `usePendingScan` unsubscribed in `useEffect` cleanup function. No listener leaks.

### Anti-Pattern Requirements
- **AC-ARCH-NO-1:** `useScanInitiation.handleRescan` must NOT be modified. Re-scan continues using sync `analyzeReceipt`.
- **AC-ARCH-NO-3:** Client code must NOT directly write to `pending_scans/{userId}/{scanId}` in Firestore.
- **AC-ARCH-NO-4:** `scanPendingSlice.ts` must NOT exceed 300 lines.

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Image uploader | `src/features/scan/services/pendingScanUpload.ts` | NEW — upload images to Storage with progress |
| Pending scan listener | `src/features/scan/hooks/usePendingScan.ts` | NEW — onSnapshot, status transitions, deadline check |
| Scan lock hook | `src/features/scan/hooks/useScanLock.ts` | NEW — FAB lock state from pending scans |
| Scan pending slice | `src/features/scan/store/slices/scanPendingSlice.ts` | NEW — pendingScanId, pendingScanDeadline |
| Gemini service | `src/services/gemini.ts` | EDIT — add `queueReceiptScan` callable wrapper |
| Scan initiation | `src/features/scan/hooks/useScanInitiation.ts` | EDIT — upload first, then queue, respect scan lock |
| ProcessScan handler | `src/features/scan/handlers/processScan/processScan.ts` | EDIT — accept result from listener path (stub injection) |
| Scan overlay | `src/features/scan/components/ScanOverlay.tsx` | EDIT — real upload progress, resumed processing state |
| App init check | `src/App.tsx` | EDIT — query pending_scans on authenticated mount |
| Scan store | `src/features/scan/store/useScanStore.ts` | EDIT — compose scanPendingSlice |
| Scan store barrel | `src/features/scan/store/index.ts` | EDIT — export pending slice |
| Hooks barrel | `src/features/scan/hooks/index.ts` | EDIT — export usePendingScan, useScanLock |
| Tests | `tests/unit/features/scan/hooks/usePendingScan.test.ts` | NEW |
| Tests | `tests/unit/features/scan/hooks/useScanLock.test.ts` | NEW |

## Tasks

### Task 1: Callable wrapper + image upload service (5 subtasks)
- [ ] 1.1: `gemini.ts` — add `queueReceiptScan` callable wrapper: `QueueReceiptScanRequest` + `QueueReceiptScanResponse` interfaces, `httpsCallable` call
- [ ] 1.2: `pendingScanUpload.ts` — upload images to `pending_scans/{userId}/{scanId}/image_{n}.jpg` using `uploadBytesResumable` for progress, return download URLs
- [ ] 1.3: Client generates `scanId` via `crypto.randomUUID()` before upload. Do NOT reuse `generateScanSessionId()` from `src/types/scan.ts`
- [ ] 1.4: Update `useScanInitiation.handleFileSelect` — generate scanId, upload to Storage, call `queueReceiptScan`, start listener. On callable network error: safe to retry (idempotent)
- [ ] 1.5: Scan overlay shows real upload progress during Storage upload phase

### Task 2: Listener + pending scan detection (4 subtasks)
- [ ] 2.1: `usePendingScan` hook — `onSnapshot` on pending doc, handles status transitions (processing→completed/failed/expired)
- [ ] 2.2: On completed → feed result into `processScan` pipeline at Step 5 (inject resolved-promise stub for `services.analyzeReceipt`). processScan signature unchanged
- [ ] 2.3: On failed / past deadline → show error overlay with Retry/Cancel
- [ ] 2.4: App init (`App.tsx`) — on authenticated mount, query `pending_scans/{userId}`, resume if found (AC-11 through AC-15)

### Task 3: Scan lock + resolution (5 subtasks)
- [ ] 3.1: `useScanLock` hook — `onSnapshot` on `pending_scans/{userId}` collection, returns `{ isLocked, pendingScan }`
- [ ] 3.2: Disable scan FAB when locked, show indicator, tap → navigate to pending resolution
- [ ] 3.3: Cancel resolution — `runTransaction` verify doc exists → delete pending doc (triggers server-side cleanup)
- [ ] 3.4: Save resolution — copy images from `pending_scans/` to `receipts/{userId}/{transactionId}/`, save transaction, delete pending doc
- [ ] 3.5: Retry resolution — create new pending scan (new scanId), delete old failed one

### Task 4: Store + tests (4 subtasks)
- [ ] 4.1: `scanPendingSlice.ts` — `pendingScanId`, `pendingScanDeadline` state + `setPendingScan`/`clearPendingScan` actions
- [ ] 4.2: Compose slice into `useScanStore.ts`, export from barrel
- [ ] 4.3: Tests: `usePendingScan.test.ts` (completed/failed/processing/deadline states via mock onSnapshot)
- [ ] 4.4: Tests: `useScanLock.test.ts` (locked/unlocked, FAB behavior, app init detection)

## Scope Boundaries
- **Client only.** Backend (18-13a) must be deployed first.
- `handleRescan` in `useScanInitiation` is NOT modified — re-scan continues using `analyzeReceipt`.
- Batch scanning and statement scanning out of scope.
- Two "pending scan" concepts coexist: `pendingScanStorage.ts` (localStorage, existing) vs `FirestorePendingScan` (Firestore, new) — do not confuse or merge them.

## Dependencies
- **18-13a** (backend Cloud Functions must be deployed before client can call them)
- Firestore `pending_scans` collection and Storage `pending_scans/` path must exist (created by 18-13a rules)

## Risk Flags
- ARCHITECTURE_CHANGE (async pattern replaces sync callable for new scans)
- APP_TSX_CHANGE (pending scan detection on mount)
- STORE_CHANGE (new scanPendingSlice)

## Dev Notes

### processScan bypass for async path
The `usePendingScan` hook feeds the completed result into `processScan` by injecting a resolved-promise stub for `services.analyzeReceipt` — enters at Step 5 (parse fields), skipping Steps 1-4. The client stub must NOT deduct credits (already server-side). The `processScan` function signature is unchanged.

### Two "pending scan" concepts
`pendingScanStorage.ts` (localStorage) tracks client-side scan state for crash recovery. `FirestorePendingScan` (Firestore) tracks the async pipeline. Both checked on app init — independently, not merged.

### AC-20 copy-on-save atomicity
If `copyPendingToReceipts` succeeds but `deleteDoc` fails, images exist in both paths. `onTransactionDeleted` cleans `receipts/` if transaction deleted; `cleanupPendingScans` TTL cleans `pending_scans/`. Acceptable — no data loss.

### App init recovery
`getDocs(pending_scans/{userId})` runs after `onAuthStateChanged` resolves with `user !== null`. Must not run before auth to avoid permission errors.

## ECC Analysis Summary
- **Risk Level:** HIGH
- **Classification:** COMPLEX (split from parent 18-13)
- **Points:** 6 | **Tasks:** 4 | **Subtasks:** 18 | **Files:** 14
- **Agents consulted:** planner, architect, database-reviewer, security-reviewer
