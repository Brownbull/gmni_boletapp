# Story 18-13: Resilient Scan Delivery — Async Result Pipeline

Status: split

> **SPLIT into:** [18-13a-resilient-scan-backend.md](18-13a-resilient-scan-backend.md) (7pts) + [18-13b-resilient-scan-client.md](18-13b-resilient-scan-client.md) (6pts)
> **Source:** Production incident (2026-03-16) — scans succeed on backend but fail on mobile due to network drops during 30-40s HTTP connection
> **Priority:** HIGH | **Original Effort:** 13 points → split into 18-13a (7pts) + 18-13b (6pts)

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "The scan waits for you, not the other way around"
**Value:** V5 — "Easier than the receipt drawer" — if a mobile network hiccup loses your scan, the app is harder than the receipt drawer.

## Story
As a **user**, I want **my scan results to persist in Firebase even if my phone loses connection**, so that **when I reconnect, the results are waiting for me and I can continue with the normal cancel/edit/save flow without re-scanning**.

## Background

### Current architecture (broken on mobile)
```
Phone ──HTTP request──> Cloud Function (30-40s Gemini call) ──HTTP response──> Phone
         └── Single connection held open for 30-40 seconds ──┘
```
If mobile drops the connection at second 25: backend finishes (200), images stored, but the phone never gets the parsed data. Transaction never created. Credit refunded but images orphaned. User must re-scan.

### Target architecture (2-function split)
```
Phase 1 — Upload:
  Phone ──uploads images to Storage──> pending_scans/{userId}/{scanId}/

Phase 2 — Accept:
  Phone ──calls queueReceiptScan──> callable creates pending doc (status=processing)
                                     returns { scanId } immediately (<1s)

Phase 3 — Process (separate function, triggered by Firestore):
  processReceiptScan (onCreate trigger) ──reads images from Storage──> Gemini (30-40s)
                                         ──writes result to pending doc──> status=completed|failed

Phase 4 — Deliver:
  Phone ──onSnapshot listener on pending doc──> receives result when ready
           └── Firestore real-time (survives disconnects automatically) ──┘
```

**Why 2 functions:** Firebase callables terminate when the returned Promise resolves. You cannot return `{ scanId }` and keep processing in the same function. The accept callable (`queueReceiptScan`) creates the job and exits. The processor (`processReceiptScan`) is a Firestore `onCreate` trigger — a completely separate function.

### Key design principle
The Cloud Function **does NOT save the transaction**. It only produces the analysis output and writes it to a pending scan document. The client receives the output and continues with the **exact same** cancel/edit/save flow that exists today. The only change is HOW the output gets from the function to the client.

### Image upload before scan
Currently images are sent as base64 inside the callable request body (up to 10MB each). This cannot work with the 2-function split because:
- The accept callable must return fast (<1s) — can't process 10MB
- Firestore documents have a 1MB limit — can't store base64 in pending doc
- The processor trigger needs access to the images

**Solution:** Client uploads images to Storage first (`pending_scans/{userId}/{scanId}/`), then passes Storage URLs to the accept callable. The processor reads from Storage URLs. Upload progress is now real (not faked).

### Credit lifecycle (async)
- **Deduct:** Server-side in the accept callable (`queueReceiptScan`) — atomic with pending doc creation
- **Refund on failure:** Server-side in the processor trigger (`processReceiptScan`) — sets `creditDeducted=false` after refunding, so onDelete trigger knows not to double-refund
- **Refund on cancel:** Server-side via Firestore `onDelete` trigger on the pending doc — refund only if `creditDeducted=true` (processor hasn't already refunded)
- Client never touches credits directly for scan operations

### Scan lock pattern
Any scan operation (single, batch, credit card, future types) **locks the scan UI** until the result is resolved:
- While a pending scan exists → scan button disabled, loading state shown
- On reconnect → app detects pending scan, resumes the resolution flow
- Resolution = cancel OR edit OR save (normal workflow)
- After resolution → pending scan document deleted → scan button unlocked
- This persists across sessions, app restarts, even logout/login — the pending result stays for that user until resolved

## Acceptance Criteria

### Backend — 2-function architecture
- **AC-1:** New callable `queueReceiptScan`: validates input, deducts credit, creates pending doc with status=processing, returns `{ scanId }` (<1s). **Idempotent:** client passes `scanId` — if doc already exists, return existing `{ scanId }` without re-deducting credit (handles network-drop retries)
- **AC-2:** New trigger `processReceiptScan` (Firestore `onCreate` on `pending_scans/{userId}/{scanId}`): reads images from Storage URLs, calls Gemini with withRetry, writes result or error to pending doc. Also generates thumbnail from first image and includes `thumbnailUrl` + `transactionId` in the result
- **AC-3:** Pending scan document schema: `{ scanId, status: 'processing'|'completed'|'failed', result?: ScanResult, error?: string, createdAt, imageUrls: string[], processingDeadline, creditDeducted: boolean }`
- **AC-4:** On Gemini success → processor sets status=completed + result (result includes `transactionId` and `thumbnailUrl` for downstream save)
- **AC-5:** On Gemini failure (after TD-18-4 retry exhausted) → processor sets status=failed + error + refunds 1 credit server-side + sets `creditDeducted=false` (prevents double refund on later cancel/delete)
- **AC-6:** Processing timeout: `processingDeadline = createdAt + 5 minutes`. If processor hasn't updated status by deadline, client treats as failed. Scheduled cleanup auto-fails stale processing docs.
- **AC-7:** Old `analyzeReceipt` callable remains unchanged (no backward compat needed — new callable name `queueReceiptScan`)

### Client — Image upload step
- **AC-8:** Before calling `queueReceiptScan`, client uploads images to Storage at `pending_scans/{userId}/{scanId}/image_{n}.jpg`
- **AC-9:** Upload progress reflected in scan overlay (real progress, not faked)
- **AC-10:** If upload fails → show error, refund credit (no pending doc created yet), allow retry

### Client — Firestore listener
- **AC-11:** After callable returns `{ scanId }`, client attaches `onSnapshot` listener to `pending_scans/{userId}/{scanId}`
- **AC-12:** On status=completed → feed result into existing processScan pipeline (Step 5 onwards: parse, validate, show dialogs, route to quicksave/edit/etc.)
- **AC-13:** On status=failed → show error overlay with Retry/Cancel
- **AC-14:** Listener survives network disconnects — Firestore SDK handles offline/reconnect automatically
- **AC-15:** If `processingDeadline` has passed and status is still processing → treat as failed, show timeout error

### Client — Pending scan detection on app load
- **AC-16:** On app init, query `pending_scans/{userId}` for any documents
- **AC-17:** If status=completed → resume resolution flow (show transaction editor with the result)
- **AC-18:** If status=processing and within deadline → show scan overlay in "processing" state, attach listener
- **AC-19:** If status=processing and past deadline → treat as failed, show error
- **AC-20:** If status=failed → show error overlay with Retry/Cancel

### Client — Scan lock
- **AC-21:** While any pending scan exists → disable scan FAB (all scan types: single, batch, credit card)
- **AC-22:** Show visual indicator on locked scan button (e.g., badge or different icon state)
- **AC-23:** Tapping locked scan button → navigate to pending scan resolution screen instead of starting new scan

### Resolution + cleanup
- **AC-24:** On cancel → delete pending scan document. Server-side `onDelete` trigger handles: refund credit (only if `creditDeducted=true`), delete orphaned images from Storage
- **AC-25:** On save → copy images from `pending_scans/{userId}/{scanId}/` to `receipts/{userId}/{transactionId}/` in Storage, then delete pending scan document. `transactionId` comes from the processor result (AC-4)
- **AC-26:** After deletion → scan button unlocked, user can start new scan
- **AC-27:** TTL safety net: scheduled Cloud Function deletes pending_scans older than 24h + cleans up Storage + refunds credit if needed
- **AC-28:** Multi-device: resolution uses `runTransaction` to verify doc still exists before acting. If already resolved on another device → show "already handled" toast

### Retry
- **AC-29:** Retry on failed scan creates a NEW pending scan (new scanId), deletes the old failed one. Same accept→listener flow. Images are already in Storage — re-upload only if original upload path was cleaned up.
- **AC-30:** Credit for retry: deducted by the new `queueReceiptScan` call (old credit was refunded on failure by AC-5)

## Architectural Acceptance Criteria (MANDATORY)
> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements
- **AC-ARCH-LOC-1:** `FirestorePendingScan` and `FirestoreScanStatus` defined in `src/types/pendingScan.ts` only. No other file declares a competing `PendingScan` for the Firestore concept. The deprecated `PendingScan` in `src/types/scan.ts` is not touched.
- **AC-ARCH-LOC-2:** `pendingScanUpload.ts` lives under `src/features/scan/services/` (not hooks/ — it is a pure async service with no React lifecycle).
- **AC-ARCH-LOC-3:** `queueReceiptScan.ts`, `processReceiptScan.ts`, `onPendingScanDeleted.ts`, `cleanupPendingScans.ts` each live as top-level files in `functions/src/` (consistent with `analyzeReceipt.ts`).
- **AC-ARCH-LOC-4:** Storage path helpers (`deletePendingScanImages`) added to `functions/src/storageService.ts`, not inline in trigger files.

### Pattern Requirements
- **AC-ARCH-PATTERN-1:** Credit deduction (queueReceiptScan) and credit refund (processReceiptScan) both use `admin.firestore().runTransaction()` — TOCTOU: auth + mutation in same transaction.
- **AC-ARCH-PATTERN-2:** `usePendingScan` and `useScanLock` follow project hook pattern: all hook calls before any early return.
- **AC-ARCH-PATTERN-3:** `useScanLock` uses `useShallow` if reading multiple values from scan store.
- **AC-ARCH-PATTERN-4:** `onSnapshot` in `usePendingScan` unsubscribed in `useEffect` cleanup function. No listener leaks.
- **AC-ARCH-PATTERN-5:** `processReceiptScan` reuses `withRetry` + `isTransientGeminiError` from `functions/src/utils/retryHelper.ts`.
- **AC-ARCH-PATTERN-6:** New functions exported from `functions/src/index.ts` follow existing JSDoc block pattern.
- **AC-ARCH-PATTERN-7:** `queueReceiptScan` validates `imageUrls` against `ALLOWED_URL_ORIGINS` (SSRF check).
- **AC-ARCH-PATTERN-8:** `cleanupPendingScans` chunks Firestore batch deletes at 500 ops.

### Anti-Pattern Requirements (Must NOT Happen)
- **AC-ARCH-NO-1:** `useScanInitiation.handleRescan` must NOT be modified. Re-scan continues using sync `analyzeReceipt`.
- **AC-ARCH-NO-2:** Pending scan Firestore doc must NOT be inside `/artifacts/{appId}/users/`. It belongs at `/pending_scans/{userId}/{scanId}` — separate root-level path.
- **AC-ARCH-NO-3:** Client code must NOT directly write to `pending_scans/{userId}/{scanId}` in Firestore. Rules explicitly block `create` and `update` from client auth.
- **AC-ARCH-NO-4:** `scanPendingSlice.ts` must NOT exceed 300 lines (store slice file limit).
- **AC-ARCH-NO-5:** `cleanupPendingScans` must NOT be exposed as an HTTP endpoint — deploy as `pubsub.schedule()` only.

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Accept callable | `functions/src/queueReceiptScan.ts` | NEW — validate, deduct credit, create pending doc, return scanId |
| Process trigger | `functions/src/processReceiptScan.ts` | NEW — Firestore onCreate, Gemini call, thumbnail gen, update pending doc |
| Cleanup trigger | `functions/src/onPendingScanDeleted.ts` | NEW — Firestore onDelete, refund credit, delete Storage images |
| Scheduled cleanup | `functions/src/cleanupPendingScans.ts` | NEW — TTL cleanup (24h) |
| Old callable | `functions/src/analyzeReceipt.ts` | UNCHANGED (kept for re-scan and legacy) |
| Functions entry | `functions/src/index.ts` | EDIT — export queueReceiptScan, processReceiptScan, onPendingScanDeleted, cleanupPendingScans |
| Storage rules | `storage.rules` | EDIT — add pending_scans/{userId}/ path: user write own, service read/delete |
| Pending scan types | `src/types/pendingScan.ts` | NEW |
| Image uploader | `src/features/scan/services/pendingScanUpload.ts` | NEW — upload images to Storage |
| Pending scan listener | `src/features/scan/hooks/usePendingScan.ts` | NEW |
| Scan lock hook | `src/features/scan/hooks/useScanLock.ts` | NEW |
| App init check | `src/App.tsx` | EDIT — check pending scans on mount |
| ProcessScan handler | `src/features/scan/handlers/processScan/processScan.ts` | EDIT — accept result from listener path |
| Scan overlay | `src/features/scan/components/ScanOverlay.tsx` | EDIT — real upload progress, resumed processing state |
| Scan initiation | `src/features/scan/hooks/useScanInitiation.ts` | EDIT — upload first, then queue, respect scan lock |
| Gemini service | `src/services/gemini.ts` | EDIT — add `queueReceiptScan` callable wrapper |
| Firestore rules | `firestore.rules` | EDIT — pending_scans: user read/delete, service write only |
| Tests (backend) | `functions/src/__tests__/` | NEW — queueReceiptScan, processReceiptScan, onPendingScanDeleted |
| Storage service | `functions/src/storageService.ts` | EDIT — add `deletePendingScanImages`, `copyPendingToReceipts` helpers |
| Scan pending slice | `src/features/scan/store/slices/scanPendingSlice.ts` | NEW — pendingScanId, pendingScanDeadline state + actions |
| Scan store | `src/features/scan/store/useScanStore.ts` | EDIT — compose scanPendingSlice |
| Scan store barrel | `src/features/scan/store/index.ts` | EDIT — export pending slice |
| Hooks barrel | `src/features/scan/hooks/index.ts` | EDIT — export usePendingScan, useScanLock |
| Tests (client) | `tests/unit/features/scan/hooks/` | NEW — usePendingScan, useScanLock |

## Tasks

### Task 1: Pending scan schema + rules (3 subtasks)
- [ ] 1.1: Define `FirestorePendingScan` type (avoids collision with deprecated `PendingScan` in `src/types/scan.ts`): scanId, status (`FirestoreScanStatus`), result (`FirestoreScanResult`), error, createdAt, imageUrls, processingDeadline, creditDeducted
- [ ] 1.2: Firestore rules for `pending_scans/{userId}/{scanId}` — user read/delete own, Cloud Function service account write only
- [ ] 1.3: Storage rules for `pending_scans/{userId}/` — user write own path, service read/delete

### Task 2: Accept callable — `queueReceiptScan` (5 subtasks)
- [ ] 2.1: Validate input (scanId required, imageUrls required, userId from auth, receiptType optional)
- [ ] 2.2: Idempotency check: if `pending_scans/{userId}/{scanId}` already exists, return existing `{ scanId }` without re-deducting
- [ ] 2.3: Deduct 1 credit server-side (atomic with doc creation via `runTransaction`)
- [ ] 2.4: Create pending doc: status=processing, imageUrls, processingDeadline=now+5min, creditDeducted=true
- [ ] 2.5: Return `{ scanId }` — function exits immediately. Export from `functions/src/index.ts`

### Task 3: Process trigger — `processReceiptScan` (5 subtasks)
- [ ] 3.1: Firestore `onCreate` trigger on `pending_scans/{userId}/{scanId}` — fires only on new docs, no guard needed
- [ ] 3.2: Read images from Storage URLs, resize/compress, call Gemini with withRetry (reuse existing image processing + prompt logic from analyzeReceipt)
- [ ] 3.3: Generate thumbnail from first image (reuse `generateThumbnail`), upload to Storage, generate `transactionId` (reuse `generateTransactionId`)
- [ ] 3.4: On success → update doc: status=completed, result=ScanResult (includes transactionId, imageUrls, thumbnailUrl)
- [ ] 3.5: On failure → update doc: status=failed, error=message, refund 1 credit server-side, set `creditDeducted=false`. Export from `functions/src/index.ts`

### Task 4: Cleanup triggers (3 subtasks)
- [ ] 4.1: `onPendingScanDeleted` — Firestore onDelete trigger: refund credit only if `creditDeducted=true` (safe — processor already sets to false after refunding), delete Storage images at `pending_scans/{userId}/{scanId}/`. Export from `functions/src/index.ts`
- [ ] 4.2: `cleanupPendingScans` — scheduled (every 1h): delete docs older than 24h, trigger cleanup cascade. Export from `functions/src/index.ts`
- [ ] 4.3: Auto-fail: in cleanup or client-side, mark processing docs past deadline as failed

### Task 5: Client — Image upload + queue (5 subtasks)
- [ ] 5.1: `pendingScanUpload.ts` — upload images to `pending_scans/{userId}/{scanId}/` in Storage, return URLs
- [ ] 5.2: Client generates `scanId` via `crypto.randomUUID()` before upload — same ID used for Storage path and callable. Do NOT reuse `generateScanSessionId()` from `src/types/scan.ts` (lower entropy, wrong format)
- [ ] 5.3: Update `useScanInitiation` — generate scanId, upload to Storage, then call `queueReceiptScan` with scanId + URLs. On callable network error: safe to retry (idempotent by AC-1)
- [ ] 5.4: Scan overlay shows real upload progress during Storage upload phase
- [ ] 5.5: `gemini.ts` — add `queueReceiptScan` callable wrapper accepting `{ scanId, imageUrls, receiptType? }`, returning `{ scanId }`

### Task 6: Client — Listener + pending scan detection (4 subtasks)
- [ ] 6.1: `usePendingScan` hook — attaches `onSnapshot` to pending doc, handles status transitions
- [ ] 6.2: On completed → feed result into existing pipeline (Step 5+ of processScan: parse, validate, route)
- [ ] 6.3: On failed / past deadline → show error overlay with Retry/Cancel
- [ ] 6.4: App init — query `pending_scans/{userId}` on mount, resume if found

### Task 7: Client — Scan lock + resolution (5 subtasks)
- [ ] 7.1: `useScanLock` hook — returns locked state based on pending scans existence
- [ ] 7.2: Disable scan FAB when locked, show indicator, tap → navigate to pending resolution
- [ ] 7.3: Cancel resolution — delete pending doc (triggers server-side cleanup via AC-24). Use `runTransaction` for multi-device safety.
- [ ] 7.4: Save resolution — copy images from `pending_scans/{userId}/{scanId}/` to `receipts/{userId}/{transactionId}/`, save transaction, then delete pending doc. `transactionId` from processor result.
- [ ] 7.5: Retry resolution — create new pending scan (new scanId), delete old failed one. Images re-uploaded only if old Storage path was cleaned up.

### Task 8: Tests (4 subtasks)
- [ ] 8.1: Backend: queueReceiptScan (credit deduction, doc creation, input validation)
- [ ] 8.2: Backend: processReceiptScan (Gemini success/failure, doc update, credit refund)
- [ ] 8.3: Client: usePendingScan (completed/failed/processing/deadline states)
- [ ] 8.4: Client: useScanLock (locked/unlocked, FAB behavior, app init detection)

## Scope Boundaries
- **Single receipt scan only.** Batch scanning (multiple receipts per session) is out of scope — batch would need a `batchId` envelope document and per-receipt pending docs. Follow-up story if needed.
- **Statement scanning (`analyzeStatement`) out of scope.** Same 30-40s problem applies but has different input (PDF, not images) and output (array of transactions, not single). Will adopt this pattern in a separate follow-up story.
- Old `analyzeReceipt` callable stays untouched — re-scan flow (Story 14.15b) continues using it.

## Sizing
- **Points:** 13 (XL — 2-function split + image upload step + credit lifecycle + client listener + lock + cleanup)
- **Tasks:** 8
- **Subtasks:** 34
- **Files:** ~19
- **Recommend split:** 18-13a (backend: Tasks 1-4, ~7pts) + 18-13b (client: Tasks 5-8, ~6pts)

## Dependencies
- TD-18-4 (withRetry logic reused in processReceiptScan)
- Firestore rules deployment (shared staging — see CLAUDE.md gotcha)
- Firebase Storage rules (pending_scans/ path — user write own, service read)

## Risk Flags
- CLOUD_FUNCTION_CHANGE (requires `cd functions && npm run build` before CI)
- FIRESTORE_RULES_CHANGE (shared staging Firebase — coordinate with Gustify)
- STORAGE_RULES_CHANGE (new pending_scans/ path in Storage rules)
- ARCHITECTURE_CHANGE (async pattern replaces sync callable for new scans)
- CREDIT_LIFECYCLE (server-side deduct/refund — no client credit manipulation for scans)

## Dev Notes

### Architecture Guidance
- `analyzeReceipt` stays as-is — used by re-scan flow (Story 14.15b) which sends Storage URLs. Only new scans use `queueReceiptScan`.
- Using `onCreate` trigger (not `onWrite`) — no guard needed, no infinite-loop risk. Retry creates a new doc (new scanId), so `onCreate` fires naturally.
- `onSnapshot` fires immediately with current doc state — handles the case where processor finishes before listener attaches.
- Pending scan docs are ~2KB (result only, no images). Negligible Firestore cost.
- Storage path `pending_scans/{userId}/{scanId}/` keeps images isolated. On save, client copies to `receipts/{userId}/{transactionId}/` then deletes pending doc (triggering Storage cleanup via onDelete). On cancel, delete triggers cleanup directly.
- Processing deadline (5min) is checked client-side AND by scheduled cleanup. Client shows timeout immediately; cleanup catches abandoned docs.
- `transactionId` is generated by the processor (same `generateTransactionId()` as current `analyzeReceipt`), included in the completed result. Client uses it for the permanent Storage path and Firestore transaction doc.
- Thumbnail generated by the processor (reuses `generateThumbnail` from `imageProcessing.ts`), uploaded to `pending_scans/{userId}/{scanId}/thumbnail.jpg`, URL included in result. Copied to permanent path on save.
- **processScan bypass for async path:** The `usePendingScan` hook feeds the completed result into the existing `processScan` pipeline by injecting a resolved-promise stub for `services.analyzeReceipt` — enters at Step 5 (parse fields), skipping Steps 1-4 (image check, credit check, credit deduction, Gemini call). The `processScan` function signature is unchanged.
- **Two "pending scan" concepts coexist:** `pendingScanStorage.ts` (localStorage) tracks client-side scan state. `FirestorePendingScan` (Firestore) tracks the async pipeline. They represent different concepts — do not confuse or merge them. App init must handle both independently.

### Credit Lifecycle (Critical)
- Credit double-refund prevention: processor sets `creditDeducted=false` after refunding on failure. The `onDelete` trigger only refunds if `creditDeducted=true`. This means: abandoned processing → onDelete refunds. Failed processing → processor refunds, onDelete skips.
- **Atomicity:** `creditDeducted=false` and `status=failed` MUST be written in a single atomic update. If these are separate writes, an `onDelete` trigger fired between them (client cancels during failure handling) could see `creditDeducted=true` and double-refund.
- **Idempotency + credit deduction MUST be same `runTransaction`:** In `queueReceiptScan`, the doc existence check (2.2) and credit deduction (2.3) must be in the same transaction. Otherwise concurrent retries could both pass the check before either creates the doc, resulting in double credit deduction.

### Database Notes (from DB review)
- **Collection path:** `pending_scans/{userId}/{scanId}` is at Firestore root level. The scheduled cleanup uses `collectionGroup('pending_scans')` query. Requires explicit collection group index on `createdAt ASC` in `firestore.indexes.json`.
- **Cleanup must paginate:** Query with `limit(500)` and loop (matches `cleanupStaleFcmTokens` pattern). Single unbounded collection group query will timeout across many users.
- **No native Firestore TTL:** The scheduled `cleanupPendingScans` function IS the TTL mechanism. Must handle crash mid-batch — use delete-then-verify pattern.
- **`imageUrls` must be Storage URLs (strings), never base64.** Enforce at type level in `FirestorePendingScan`.

### Security Notes (from security review)
- **SSRF in processor:** `processReceiptScan` MUST validate each `imageUrl` from the pending doc against `ALLOWED_URL_ORIGINS` before fetching — the owning user wrote these URLs and could have tampered after upload.
- **scanId validation:** Validate as UUID format in `queueReceiptScan` — reject path-traversal attempts like `../other-user`.
- **Processor image size validation:** Validate image size from Storage metadata before downloading (don't trust client-side check alone).
- **Firestore rules:** `create` and `update` blocked for all client auth on `pending_scans/`. Without this, a client could forge a `status=completed` doc with arbitrary scan results.
- **Storage rules:** `pending_scans/{userId}/` write scoped to `request.auth.uid == userId`. Without this, any authenticated user could inject malicious images into another user's path.
- **AC-25 copy-on-save atomicity gap:** If `copyPendingToReceipts` succeeds but `deleteDoc` fails, images exist in both paths. The `onTransactionDeleted` trigger cleans `receipts/` if transaction is deleted; `cleanupPendingScans` TTL cleans `pending_scans/`. Acceptable — no data loss, no double-billing.

### E2E Testing
E2E coverage recommended — run `/ecc-e2e 18-13` after implementation (requires staging deployment of new Cloud Functions).

## ECC Analysis Summary
- **Risk Level:** HIGH
- **Complexity:** Complex (architecture change + credit lifecycle + 4 new Cloud Functions)
- **Classification:** COMPLEX
- **Agents consulted:** planner (sonnet), architect (sonnet), database-reviewer (sonnet), security-reviewer (sonnet)
- **Split mandatory:** 18-13a (backend: Tasks 1-4, ~7pts) + 18-13b (client: Tasks 5-8, ~6pts)
