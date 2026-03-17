# Story 18-13a: Resilient Scan Delivery — Backend Pipeline

Status: done

> **Parent:** 18-13-resilient-scan-delivery (split into 18-13a backend + 18-13b client)
> **Source:** Production incident (2026-03-16) — scans succeed on backend but fail on mobile due to network drops during 30-40s HTTP connection
> **Priority:** HIGH | **Estimated Effort:** 7 points
> **DEPENDS:** TD-18-4 (withRetry logic reused in processReceiptScan)

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "The scan waits for you, not the other way around"
**Value:** V5 — "Easier than the receipt drawer" — if a mobile network hiccup loses your scan, the app is harder than the receipt drawer.

## Story
As a **user**, I want **my scan results to persist in Firebase even if my phone loses connection**, so that **when I reconnect, the results are waiting for me**.

This is the **backend half** of the async scan pipeline: types, rules, Cloud Functions, and backend tests. The client integration (18-13b) depends on this being deployed first.

## Background
See parent story [18-13-resilient-scan-delivery.md](18-13-resilient-scan-delivery.md) for full architecture diagrams, credit lifecycle, and scan lock pattern.

### Target architecture (this story delivers Phases 2-3)
```
Phase 2 — Accept:
  Phone ──calls queueReceiptScan──> callable creates pending doc (status=processing)
                                     returns { scanId } immediately (<1s)

Phase 3 — Process (separate function, triggered by Firestore):
  processReceiptScan (onCreate trigger) ──reads images from Storage──> Gemini (30-40s)
                                         ──writes result to pending doc──> status=completed|failed
```

## Acceptance Criteria

### Schema + Rules
- **AC-1:** `FirestorePendingScan` type defined in `src/types/pendingScan.ts` with: `scanId, status: 'processing'|'completed'|'failed', result?: FirestoreScanResult, error?: string, createdAt: Timestamp, imageUrls: string[], processingDeadline: Timestamp, creditDeducted: boolean`
- **AC-2:** Firestore rules for `pending_scans/{userId}/{scanId}` — user read/delete own, `create` and `update` blocked (Admin SDK only)
- **AC-3:** Storage rules for `pending_scans/{userId}/` — user write own path (`request.auth.uid == userId`), user read own path
- **AC-4:** Collection group index on `createdAt ASC` added to `firestore.indexes.json`

### Accept callable — `queueReceiptScan`
- **AC-5:** New callable: validates input (scanId UUID format, imageUrls 1-5 against `ALLOWED_URL_ORIGINS`, userId from auth, receiptType optional), returns `{ scanId }` in <1s
- **AC-6:** **Idempotent:** if `pending_scans/{userId}/{scanId}` already exists, return existing `{ scanId }` without re-deducting credit
- **AC-7:** Credit deduction + doc creation in single `runTransaction` — atomic, no TOCTOU gap
- **AC-8:** Pending doc created with: status=processing, imageUrls, processingDeadline=now+5min, creditDeducted=true
- **AC-9:** Rate limited (reuse in-memory pattern from analyzeReceipt, 10 req/min/user)

### Process trigger — `processReceiptScan`
- **AC-10:** Firestore `onCreate` trigger on `pending_scans/{userId}/{scanId}`
- **AC-11:** Validates each `imageUrl` against `ALLOWED_URL_ORIGINS` before fetching (SSRF prevention)
- **AC-12:** Validates image size from Storage metadata before downloading
- **AC-13:** Reads images from Storage, resize/compress, calls Gemini with `withRetry` (reuse from TD-18-4)
- **AC-14:** Generates thumbnail + `transactionId` (reuse `generateThumbnail`, `generateTransactionId`)
- **AC-15:** On success → single atomic update: status=completed, result (includes transactionId, thumbnailUrl, imageUrls)
- **AC-16:** On failure → single atomic update: status=failed, error, `creditDeducted=false` + refund 1 credit. Both fields in ONE write (prevents double-refund race)
- **AC-17:** Old `analyzeReceipt` callable remains unchanged

### Cleanup triggers
- **AC-18:** `onPendingScanDeleted` (Firestore onDelete): refund credit only if `creditDeducted=true`, delete Storage images at `pending_scans/{userId}/{scanId}/`
- **AC-19:** `cleanupPendingScans` (scheduled every 1h, `pubsub.schedule` only — NOT HTTP): delete docs older than 24h, paginated at `limit(500)` loop, trigger cleanup cascade
- **AC-20:** Auto-fail: cleanup marks processing docs past deadline as failed (with credit refund)

### Tests
- **AC-21:** `queueReceiptScan.test.ts` — credit deduction, idempotency, doc creation, input validation, rate limit
- **AC-22:** `processReceiptScan.test.ts` — Gemini success/failure, doc update, credit refund, SSRF validation
- **AC-23:** `onPendingScanDeleted` — creditDeducted=true refunds, creditDeducted=false skips

## Architectural Acceptance Criteria (MANDATORY)

### File Location Requirements
- **AC-ARCH-LOC-1:** `FirestorePendingScan` and `FirestoreScanStatus` defined in `src/types/pendingScan.ts` only. The deprecated `PendingScan` in `src/types/scan.ts` is not touched.
- **AC-ARCH-LOC-3:** `queueReceiptScan.ts`, `processReceiptScan.ts`, `onPendingScanDeleted.ts`, `cleanupPendingScans.ts` each live as top-level files in `functions/src/`.
- **AC-ARCH-LOC-4:** Storage path helpers (`deletePendingScanImages`) added to `functions/src/storageService.ts`.

### Pattern Requirements
- **AC-ARCH-PATTERN-1:** Credit deduction and refund both use `admin.firestore().runTransaction()`.
- **AC-ARCH-PATTERN-5:** `processReceiptScan` reuses `withRetry` + `isTransientGeminiError` from `functions/src/utils/retryHelper.ts`.
- **AC-ARCH-PATTERN-6:** New functions exported from `functions/src/index.ts` follow existing JSDoc block pattern.
- **AC-ARCH-PATTERN-7:** `queueReceiptScan` validates `imageUrls` against `ALLOWED_URL_ORIGINS`.
- **AC-ARCH-PATTERN-8:** `cleanupPendingScans` chunks Firestore batch deletes at 500 ops.

### Anti-Pattern Requirements
- **AC-ARCH-NO-2:** Pending scan Firestore doc at `/pending_scans/{userId}/{scanId}` — NOT inside `/artifacts/{appId}/users/`.
- **AC-ARCH-NO-5:** `cleanupPendingScans` deployed as `pubsub.schedule()` only — NOT as HTTP endpoint.

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Pending scan types | `src/types/pendingScan.ts` | NEW — `FirestorePendingScan`, `FirestoreScanStatus`, `FirestoreScanResult` |
| Accept callable | `functions/src/queueReceiptScan.ts` | NEW — validate, deduct credit, create pending doc, return scanId |
| Process trigger | `functions/src/processReceiptScan.ts` | NEW — Firestore onCreate, Gemini call, thumbnail gen, update pending doc |
| Cleanup trigger | `functions/src/onPendingScanDeleted.ts` | NEW — Firestore onDelete, refund credit, delete Storage images |
| Scheduled cleanup | `functions/src/cleanupPendingScans.ts` | NEW — TTL cleanup (24h), `pubsub.schedule` |
| Functions entry | `functions/src/index.ts` | EDIT — export 4 new functions with JSDoc blocks |
| Storage service | `functions/src/storageService.ts` | EDIT — add `deletePendingScanImages` helper |
| Firestore rules | `firestore.rules` | EDIT — add `pending_scans/{userId}/{scanId}` rule block (include Gustify paths per INC-001) |
| Storage rules | `storage.rules` | EDIT — add `pending_scans/{userId}/` path |
| Firestore indexes | `firestore.indexes.json` | EDIT — add collection group index on `createdAt ASC` |
| Tests | `functions/src/__tests__/queueReceiptScan.test.ts` | NEW |
| Tests | `functions/src/__tests__/processReceiptScan.test.ts` | NEW |

## Tasks

### Task 1: Pending scan schema + rules (4 subtasks)
- [ ] 1.1: Define `FirestorePendingScan`, `FirestoreScanStatus`, `FirestoreScanResult` types in `src/types/pendingScan.ts`
- [ ] 1.2: Firestore rules for `pending_scans/{userId}/{scanId}` — user read/delete own, create/update blocked. Include Gustify paths per INC-001
- [ ] 1.3: Storage rules for `pending_scans/{userId}/` — user write/read own path
- [ ] 1.4: Add collection group index on `createdAt ASC` to `firestore.indexes.json`

### Task 2: Accept callable — `queueReceiptScan` (5 subtasks)
- [ ] 2.1: Validate input: scanId as UUID format (reject path-traversal), imageUrls 1-5 against ALLOWED_URL_ORIGINS, userId from auth, receiptType optional against known enum
- [ ] 2.2: Idempotency check + credit deduction in single `runTransaction`: read doc, if exists return `{ scanId }`, else deduct credit + create doc atomically
- [ ] 2.3: Create pending doc: status=processing, imageUrls, processingDeadline=now+5min, creditDeducted=true
- [ ] 2.4: Rate limiting (reuse in-memory pattern from analyzeReceipt)
- [ ] 2.5: Export from `functions/src/index.ts` with JSDoc block

### Task 3: Process trigger — `processReceiptScan` (5 subtasks)
- [ ] 3.1: Firestore `onCreate` trigger on `pending_scans/{userId}/{scanId}`
- [ ] 3.2: Validate imageUrls against ALLOWED_URL_ORIGINS (SSRF), validate image size from Storage metadata, fetch + resize/compress, call Gemini with withRetry
- [ ] 3.3: Generate thumbnail (reuse `generateThumbnail`), upload to Storage, generate `transactionId` (reuse `generateTransactionId`)
- [ ] 3.4: On success → single update: status=completed, result={transactionId, imageUrls, thumbnailUrl, ...ScanResult}
- [ ] 3.5: On failure → single atomic update: status=failed, error, creditDeducted=false + refund 1 credit via `runTransaction`. Export from `functions/src/index.ts`

### Task 4: Cleanup triggers + backend tests (5 subtasks)
- [ ] 4.1: `onPendingScanDeleted` — onDelete trigger: refund if `creditDeducted=true`, delete Storage via `deletePendingScanImages`. Export from index.ts
- [ ] 4.2: `cleanupPendingScans` — `pubsub.schedule('every 60 minutes')`: query createdAt < 24h ago with `limit(500)` loop, auto-fail stale processing, delete (triggers cascade). Export from index.ts
- [ ] 4.3: Add `deletePendingScanImages` to `functions/src/storageService.ts`
- [ ] 4.4: Tests: `queueReceiptScan.test.ts` (credit deduction, idempotency, validation, rate limit)
- [ ] 4.5: Tests: `processReceiptScan.test.ts` (success/failure, doc update, credit refund, SSRF)

## Scope Boundaries
- **Backend only.** Client integration is 18-13b.
- Old `analyzeReceipt` callable stays untouched.
- Statement scanning (`analyzeStatement`) out of scope.

## Dependencies
- TD-18-4 (withRetry + isTransientGeminiError reused in processReceiptScan)
- Firestore rules deployment (shared staging — INC-001, include Gustify paths)

## Risk Flags
- CLOUD_FUNCTION_CHANGE (requires `cd functions && npm run build` before CI)
- FIRESTORE_RULES_CHANGE (shared staging Firebase — coordinate with Gustify)
- STORAGE_RULES_CHANGE (new pending_scans/ path)
- CREDIT_LIFECYCLE (server-side deduct/refund — highest-risk integration point)

## Dev Notes

### Credit Lifecycle (Critical)
- `creditDeducted=false` and `status=failed` MUST be written in a single atomic update
- Idempotency check + credit deduction MUST be same `runTransaction`
- `onDelete` trigger reads `creditDeducted` from snapshot — if false (processor refunded), skip refund

### Database Notes
- `pending_scans/{userId}/{scanId}` at Firestore root level — cleanup uses `collectionGroup('pending_scans')`
- Cleanup must paginate: `limit(500)` loop (matches `cleanupStaleFcmTokens` pattern)
- No native Firestore TTL — `cleanupPendingScans` IS the TTL mechanism
- `imageUrls` must be Storage URLs (strings), never base64 — enforce at type level

### Security Notes
- SSRF: validate imageUrls against ALLOWED_URL_ORIGINS in processor (user could tamper after upload)
- scanId: validate as UUID format — reject path-traversal (`../other-user`)
- Image size: validate from Storage metadata before downloading
- Firestore rules: create/update blocked for client — prevents result spoofing
- `cleanupPendingScans` must NOT be HTTP-exposed — `pubsub.schedule()` only

## Bundled Hotfixes (no separate story — tracked here)

Three production issues discovered and fixed during 18-13a development session (2026-03-17):

### Hotfix 1: V4 Prompt Promotion — qty>1 price derivation bug
- **Symptom:** Scanning a receipt with qty=8, unit price $1,550, total $12,400 → app showed unitPrice=194 (1550/8) instead of 1,550
- **Root cause:** Production used V3 prompt where `price` = unit price. Cloud Function remap (`price → totalPrice`) changed semantics — V3's unit price became V4's line total. When qty > 1, `deriveItemsPrices` divided again: 1550/8 = 194
- **Fix:** Promoted V4 prompt to `PRODUCTION_PROMPT` in `prompt-testing/prompts/index.ts` (one-line change). V4 has explicit `unitPrice`/`totalPrice` disambiguation with PRICE LOGIC section
- **Verification:** `/scan-test generate edge-cases/edgeqtytotal` confirmed V4 returns correct `{ unitPrice: 1550, totalPrice: 12400, quantity: 8 }`
- **Files:** `prompt-testing/prompts/index.ts` (PRODUCTION_PROMPT = PROMPT_V4)
- **Deployed:** 2026-03-17, `firebase deploy --only functions`

### Hotfix 2: Recent scans carousel stuck on stale cached data
- **Symptom:** Dashboard "Últimos Escaneados" carousel showed March 6 scans while "Ver todos" showed today's scans
- **Root cause:** `subscribeToRecentScans` Firestore `onSnapshot` with `orderBy('createdAt', 'desc'), limit(10)` was stuck on offline cache (`fromCache: true`, never synced to server). Known Firestore SDK issue — offline persistence cache satisfies `limit()` queries from stale local data without server round-trip
- **Fix:** Derive `recentScans` from the main transaction list (already synced correctly via `usePaginatedTransactions`) instead of the separate stuck listener. Client-side sort by `createdAt desc, slice(0, 10)` — same approach that `RecentScansView` ("Ver todos") already uses successfully
- **Files:** `src/features/dashboard/views/DashboardView/useDashboardViewData.ts` (derive from merged transactions)
- **Deployed:** 2026-03-17, `firebase deploy --only hosting`

### Hotfix 3: `/scan-test` command created
- **What:** Claude Code slash command for prompt testing infrastructure. Handles staging auth, credentials, and all test:scan subcommands
- **Files:** `.claude/commands/scan-test.md`, `CLAUDE.md` (Commands section updated)
- **Not deployed** (developer tooling only)

## Senior Developer Review (KDBP)

- **Date:** 2026-03-17
- **Classification:** COMPLEX | **Agents:** code-reviewer, security-reviewer (opus), architect (opus), tdd-guide
- **Score:** 7.9/10 → APPROVE (after fixes)
- **Quick fixes applied (14):** idempotency guard, double-refund prevention, OOM fetch guard, error message sanitization, CLP-only docs, path regex warning, UUID comment fix, onPendingScanDeleted tests (3), malformed JSON test, rate limit test, non-OK fetch test, retry assertion fix, mock reset fix
- **Backlog deferrals (4):** Phase 1 pagination (#7 PROD), APP_ID duplication (#8 PROD), AC-2 docs errata (#18 PROD), imageUrls redundancy (#11 SCALE)
- **Architectural ACs:** 10/10 PASS

<!-- CITED: L2-004 (TOCTOU), L2-008 (batch-500), L2-002 (input-sanitization) -->

## ECC Analysis Summary
- **Risk Level:** HIGH
- **Classification:** COMPLEX (split from parent 18-13)
- **Points:** 7 | **Tasks:** 4 | **Subtasks:** 19 | **Files:** 12
- **Agents consulted:** planner, architect, database-reviewer, security-reviewer
