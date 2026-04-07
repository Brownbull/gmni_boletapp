# Deferred Findings Backlog

> Items identified during code review but deferred beyond the current epic.
> Grouped by product stage. Review during epic planning for future epics.
>
> **Triage status:** NEEDS-TRIAGE (2026-04-06) — schedule deep triage during next Epic 18 dev session.
> Items below have NOT been individually classified as fixed/remaining/won't-fix.

---

## PROD Backlog

### [PROD] Cloud Function Rate Limiter Hardening

- **Source:** 18-1-statement-scan-spike review (2026-03-12)
- **Finding:** In-memory rate limiting in Cloud Functions has three weaknesses:
  1. Not durable across cold starts — each instance has its own Map
  2. No upper bound on Map size — memory leak under sustained diverse-user load
  3. `analyzeStatement` and `analyzeReceipt` have independent Maps — user can bypass per-function limits by alternating callables
- **Files:** `functions/src/analyzeStatement.ts`, `functions/src/analyzeReceipt.ts`
- **Stage:** PROD — Required for production readiness under real user load, not for feature function
- **Estimated effort:** 3-5 points (evaluate Firestore-based rate limiting, shared limiter module, or Firebase Extensions)

### [PROD] Optional Gemini Field Validation (quantity, confidence)

- **Source:** TD-18-2-gemini-response-coercion review (2026-03-12)
- **Finding:** `quantity` and `confidence` fields in receipt responses are coerced by `parseGeminiNumber` but NOT validated by `validateGeminiResult`. If Gemini returns these as non-numeric strings (e.g., `"N/A"`), they pass through as `NaN` and are written to Firestore. No crash risk (fields are optional in the UI), but data quality issue.
- **Files:** `functions/src/analyzeReceipt.ts`
- **Stage:** PROD — Data quality hardening, not required for feature function
- **Estimated effort:** 1-2 points (add isFinite checks for optional numeric fields in validator)

### [PROD] String "null" Coercion for Nullable Fields

- **Source:** TD-18-2-gemini-response-coercion review (2026-03-12)
- **Finding:** Gemini may return the string `"null"` instead of JSON `null` for nullable fields (`currency`, `country`, `city` in receipt; `originalCurrency`, `originalAmount` in statement). These pass type checks (they're valid strings/non-null) and are written to Firestore as literal string "null". No crash risk, but downstream code comparing `=== null` won't match.
- **Files:** `functions/src/analyzeReceipt.ts`, `functions/src/analyzeStatement.ts`
- **Stage:** PROD — Data quality hardening, not required for feature function
- **Estimated effort:** 1 point (add string "null" → null coercion for known nullable fields)

### [PROD] Hardcoded Refund Amount in Credit Safety Net

- **Source:** TD-18-3-scan-dialog-autodismiss-credit-leak review (2026-03-13)
- **Finding:** `_refundIfOutstanding` always refunds `1` credit. The amount is not tied to `creditsCount` stored in state (received by `processStart`). If credit cost ever varies, the safety net silently refunds the wrong amount.
- **Files:** `src/features/scan/store/slices/scanCoreSlice.ts`
- **Stage:** PROD — Maintenance trap for future credit pricing changes
- **Estimated effort:** 1 point (read creditsCount from state, add named constant)

### [PROD] Unguarded Credit Refund Callback Registration

- **Source:** TD-18-3-scan-dialog-autodismiss-credit-leak review (2026-03-13)
- **Finding:** `registerCreditRefundCallback` is a public export with no re-registration guard. Any module can silently overwrite the callback. Acceptable for same-origin PWA but the single-caller contract is undocumented.
- **Files:** `src/features/scan/store/slices/scanCoreSlice.ts`, `src/features/scan/store/index.ts`
- **Stage:** PROD — Defensive programming for future refactors
- **Estimated effort:** 1 point (add warning log on overwrite, document contract)

### [PROD] Missing Test for Refund Rejection Branch

- **Source:** TD-18-3-scan-dialog-autodismiss-credit-leak review (2026-03-13)
- **Finding:** No test verifies that `_refundIfOutstanding`'s `.catch()` branch handles a failed refund call (now logs via `logGuardViolation`). The rejection path is untested.
- **Files:** `src/features/scan/store/__tests__/useScanStore.credit.test.ts`
- **Stage:** PROD — Test coverage gap for error path
- **Estimated effort:** 1 point (add test with mockRefund.mockRejectedValue)

### [PROD] QuickSaveCard timeStr Derived from Date Instead of Time

- **Source:** TD-18-7-hide-default-time-sentinel review (2026-03-13)
- **Finding:** `timeStr` in QuickSaveCard is computed from `transaction.date` via `toLocaleTimeString()`, not from `transaction.time`. When a real time exists, the Clock row displays the date-parsed local time rather than the stored time string. The conditional guard from TD-18-7 correctly suppresses the sentinel, but the displayed value for real times is the wrong source.
- **Files:** `src/features/scan/components/QuickSaveCard.tsx`
- **Stage:** PROD — Data display accuracy, not breaking but misleading
- **Estimated effort:** 2 points (use transaction.time for display, format consistently)

### [PROD] Duplicate getTimeDisplay() Logic Across TransactionCard Variants

- **Source:** TD-18-7-hide-default-time-sentinel review (2026-03-13)
- **Finding:** `getTimeDisplay()` is duplicated verbatim in `src/features/history/components/TransactionCard.tsx` and `src/components/transactions/TransactionCard.tsx`. TD-18-7 extended the duplication with the sentinel filter. Should extract to a shared utility.
- **Files:** `src/features/history/components/TransactionCard.tsx`, `src/components/transactions/TransactionCard.tsx`
- **Stage:** PROD — DRY violation, maintenance risk for future time display changes
- **Estimated effort:** 2 points (extract shared util, update imports, move tests)

### [PROD] Missing Test Coverage for Legacy TransactionCard

- **Source:** TD-18-7-hide-default-time-sentinel review (2026-03-13)
- **Finding:** `src/components/transactions/TransactionCard.tsx` (legacy shared component) has no test file. Its `getTimeDisplay()` sentinel logic is identical to the history variant but has zero test coverage. The component has a different props interface (structured `transaction` object, `formatters`, `theme` objects).
- **Files:** `src/components/transactions/TransactionCard.tsx`
- **Stage:** PROD — Test coverage gap for shared component
- **Estimated effort:** 3 points (create test file with structured props, cover sentinel + existing functionality)

### [PROD] parseHour DEFAULT_TIME Guard Undocumented by Tests

- **Source:** TD-18-7-hide-default-time-sentinel review (2026-03-13)
- **Finding:** `parseHour()` in `insightGenerators.ts` already guards against DEFAULT_TIME (`if (time === DEFAULT_TIME) return null`), but no test explicitly documents this behavior. AC-6 claim ("no analytics aggregate by time") is factually incorrect — insights DO aggregate by time, the guard is the safety net.
- **Files:** `src/utils/insightGenerators.ts`
- **Stage:** PROD — Test documentation of existing safety guard
- **Estimated effort:** 1 point (add parseHour(DEFAULT_TIME) → null assertion in insights test file)

### [PROD] Consolidate price→totalPrice Compat Fallback to Single Location

- **Source:** TD-18-8-rename-item-price-to-totalprice review (2026-03-13)
- **Finding:** AC-9 requires "ONE mapping in the normalizer" but backward-compat fallback `totalPrice ?? (i as any).price` exists in two locations: `src/repositories/utils.ts` and `src/hooks/usePaginatedTransactions.ts`. Both are at the data boundary layer but should be consolidated into a shared util (e.g., `normalizeItemPrice()`) or the hook should delegate to the repository normalizer.
- **Files:** `src/repositories/utils.ts`, `src/hooks/usePaginatedTransactions.ts`
- **Stage:** PROD — Code hygiene, not feature-breaking. Both paths produce correct output.
- **Estimated effort:** 1 point (extract shared normalizer function, update 2 call sites)

### [PROD] Remove Deprecated getDuplicateKey or Complete Deprecation Path

- **Source:** TD-18-6-fuzzy-duplicate-detection review (2026-03-14)
- **Finding:** `getDuplicateKey` silently changed its return value from `date|merchant|total` to `date|total` — the `@deprecated` annotation was added but the function still exists. Any code comparing old stored keys vs new ones would get different results. Zero external callers currently, but the deprecation path is incomplete.
- **Files:** `src/services/duplicateDetectionService.ts`
- **Stage:** PROD — Dead code cleanup, no current breakage
- **Estimated effort:** 1 point (remove function + update any remaining imports)

### [PROD] Remove Dead Time Exports from Duplicate Detection Service

- **Source:** TD-18-6-fuzzy-duplicate-detection review (2026-03-14)
- **Finding:** `parseTimeToMinutes` and `areTimesWithinProximity` are exported and tested but NOT used anywhere in duplicate detection logic. They are dead exports that mislead future readers. Tests are marked "(legacy)" but still run.
- **Files:** `src/services/duplicateDetectionService.ts`, `tests/unit/duplicateDetection.test.ts`
- **Stage:** PROD — Dead code cleanup
- **Estimated effort:** 1 point (check for external importers, remove if none, update tests)

### [PROD] filterToDuplicatesGrouped Calls findDuplicates Redundantly

- **Source:** TD-18-6-fuzzy-duplicate-detection review (2026-03-14)
- **Finding:** `filterToDuplicatesGrouped` internally calls `findDuplicates(transactions)`. If a caller also needs the raw duplicate map (e.g., for counting + rendering), `findDuplicates` runs twice. Consider accepting an optional pre-computed map parameter.
- **Files:** `src/services/duplicateDetectionService.ts`
- **Stage:** PROD — Performance optimization, not breaking
- **Estimated effort:** 1 point (add optional map param, thread through)

### [PROD] Duplicate Detection Test File Exceeds 300-Line Limit

- **Source:** TD-18-6-fuzzy-duplicate-detection review (2026-03-14)
- **Finding:** `duplicateDetection.test.ts` is 694 lines, exceeding the 300-line unit test limit from testing.md. Pre-existing issue expanded by TD-18-6 additions (~70 lines). Split into focused test files (merchants, grouping, integration).
- **Files:** `tests/unit/duplicateDetection.test.ts`
- **Stage:** PROD — Test maintainability
- **Estimated effort:** 2 points (split file, update imports, verify all tests pass)

### [PROD] Missing Tests for Thin Wrapper Functions in Duplicate Detection

- **Source:** TD-18-6-fuzzy-duplicate-detection review (2026-03-14)
- **Finding:** `hasPotentialDuplicates`, `getDuplicateCount`, `filterToDuplicateTransactions` are exported public functions with no direct tests. They are thin delegates to `findDuplicates`/`getDuplicateIds` — low risk but untested public surface.
- **Files:** `src/services/duplicateDetectionService.ts`, `tests/unit/duplicateDetection.test.ts`
- **Stage:** PROD — Test coverage gap for public API
- **Estimated effort:** 1 point (add 3-4 simple tests)

### [PROD] Missing Test for Credit Deduction During Retry Path

- **Source:** TD-18-4-scan-retry-fix review (2026-03-15)
- **Finding:** AC-9 states "credit re-reserved on retry" but no test asserts that `deductUserCredits` is called when `processScan` is triggered via the retry handler. `processScan` handles its own credit lifecycle, so the behavior is correct, but no test coverage verifies the deduction fires on the retry code path specifically.
- **Files:** `tests/unit/features/scan/hooks/useScanHandlers.errorRecovery.test.ts`, `src/features/scan/handlers/processScan/processScan.ts`
- **Stage:** PROD — Test coverage gap for financial operation
- **Estimated effort:** 1-2 points (integration test asserting deductUserCredits called on retry path)

### [PROD] Duplicate Store Reads for Scan Results in ScanFeature + ScanOverlay

- **Source:** TD-18-23 review (2026-04-06)
- **Finding:** `scanResults` and `activeResultIndex` are read from `useScanStore` in both `ScanFeature.tsx` (lines 433-434, for overlay onSave/onEdit handlers) and internally in `ScanOverlay.tsx` (for its own rendering). The two reads always agree (same store), but this architectural duplication means changes to index logic in ScanOverlay require parallel updates in ScanFeature's closures. The overlay's callback signature could pass the active result up instead.
- **Files:** `src/features/scan/ScanFeature.tsx`, `src/features/scan/components/ScanOverlay.tsx`
- **Stage:** PROD — Maintenance hazard, not feature-breaking
- **Estimated effort:** 2 points (refactor ScanOverlay callbacks to pass result, remove ScanFeature store reads)

### [PROD] Unhandled Promise Rejection in Overlay Save Handler

- **Source:** TD-18-23 review (2026-04-06)
- **Finding:** `onQuickSave` is typed `(data?: QuickSaveDialogData) => Promise<void>` but the overlay's `onSave` closure calls it without `await` or `.catch()`. If the parent's save handler throws, it produces an unhandled promise rejection. The sync `onEdit` handler is unaffected.
- **Files:** `src/features/scan/ScanFeature.tsx:485-488`
- **Stage:** PROD — Error handling gap, not feature-breaking (save failure still caught by parent)
- **Estimated effort:** 1 point (add `.catch()` with toast feedback, or mark handler as void-returning)

### [PROD] Add data-testid to SkeletonLine for Test Resilience

- **Source:** TD-18-25 review (2026-04-06)
- **Finding:** ScanSkeleton tests query SkeletonLine elements via `.rounded` Tailwind class selector. A cosmetic className refactor would break all 8 shimmer-element tests simultaneously. Adding `data-testid="skeleton-line"` to the SkeletonLine sub-component would decouple tests from styling.
- **Files:** `src/features/scan/components/ScanSkeleton.tsx:36`, `tests/unit/features/scan/components/ScanSkeleton.test.tsx:99`
- **Stage:** PROD — Test infrastructure resilience, not feature-breaking
- **Estimated effort:** 1 point (add data-testid to SkeletonLine, update test selectors)

---

## SCALE Backlog

### [SCALE] Unbounded Group Size in Duplicate Detection O(k^2) Loop

- **Source:** TD-18-6-fuzzy-duplicate-detection review (2026-03-14)
- **Finding:** `findDuplicates` groups by `date|total` only, then does O(k^2) pairwise merchant comparison within each group. No upper bound on group size. Degenerate data (many transactions same date+total, all different merchants) produces quadratic comparisons. Fine for real data (k=2-5) but no cap exists.
- **Files:** `src/services/duplicateDetectionService.ts`
- **Stage:** SCALE — Only relevant at high transaction volume with pathological data patterns
- **Estimated effort:** 1 point (add early-exit or warning if group size > 20)

### [SCALE] Imprecise Transient Error Keyword Matching in retryHelper

- **Source:** TD-18-4-scan-retry-fix review (2026-03-15)
- **Finding:** `TRANSIENT_KEYWORDS` in `retryHelper.ts` uses substring matching (`msg.includes(keyword)`). The keyword `enotfound` could false-positive on error messages containing "not found" in other contexts (e.g., "not found in response body"). A word-boundary regex or code-based check (`error.code === 'ENOTFOUND'`) would be more precise.
- **Files:** `functions/src/utils/retryHelper.ts`
- **Stage:** SCALE — Only relevant at high error volume where false-positive retries waste Gemini API calls
- **Estimated effort:** 1 point (switch to regex or error.code check for network error keywords)

### [SCALE] Redundant imageUrls Storage in Pending Scan Results

- **Source:** 18-13a-resilient-scan-backend review (2026-03-17)
- **Finding:** `imageUrls` stored both at doc root (`pending_scans/{scanId}.imageUrls`) and inside `result.imageUrls`. Client reads from `result`; root field is never updated post-creation. Redundant storage and potential consistency drift.
- **Files:** `functions/src/processReceiptScan.ts`
- **Stage:** SCALE — Minor storage waste, no functional impact
- **Estimated effort:** 0.5 points (omit from result write, client reads from root)

### [SCALE] Guard Violation Logging in Production

- **Source:** TD-18-3-scan-dialog-autodismiss-credit-leak review (2026-03-13)
- **Finding:** `logGuardViolation` uses `console.warn` unconditionally in all environments. Current content is safe (no PII), but if `detail` is extended to include userId or transaction amounts, exposure risk increases. Should document PII exclusion policy in guardLog.ts.
- **Files:** `src/features/scan/store/slices/guardLog.ts`
- **Stage:** SCALE — Only matters at compliance/audit scale
- **Estimated effort:** 0.5 points (add documentation comment)

---

## TD Backlog (from Story 18-8 prompt review — 2026-03-14)

### [TD] Eliminate prompt file duplication between prompt-testing/ and functions/src/

- **Source:** Story 18-8 prompt adversarial review (2026-03-14)
- **Finding:** All prompt files exist as identical copies in `prompt-testing/prompts/` and `functions/src/prompts/` (differing only in import paths). Same for `shared/schema/`. Manual sync required for every change — high drift risk.
- **Files:** `prompt-testing/prompts/*.ts`, `functions/src/prompts/*.ts`, `shared/schema/`, `functions/src/shared/schema/`
- **Options:** (A) Symlinks or build step to generate functions copy from prompt-testing; (B) Add a CI test that diffs the two directories and fails on divergence
- **Estimated effort:** 2-3 points

### [TD] Rename `qty` → `quantity` codebase-wide

- **Source:** Story 18-8 prompt adversarial review (2026-03-14)
- **Finding:** Prompt uses `quantity` (full word), TypeScript `TransactionItem` uses `qty`. Cloud Function maps between them. Inconsistent naming across the boundary. Should use `quantity` everywhere for clarity.
- **Files:** `src/types/transaction.ts`, `src/types/item.ts`, all consumers of `item.qty`
- **Scope:** Similar to TD-18-8 (price→totalPrice rename), estimated ~30 files
- **Estimated effort:** 3 points

### [TD] Update statement prompt to English-only pattern

- **Source:** Story 18-8 prompt adversarial review (2026-03-14)
- **Finding:** `prompt-testing/prompts/statement/v1-statement-extraction.ts` still uses `STORE_CATEGORIES_GROUPED` (Spanish labels). Should switch to `STORE_CATEGORY_LIST` + locale import for consistency with V4 receipt prompt changes.
- **Files:** `prompt-testing/prompts/statement/v1-statement-extraction.ts`, `functions/src/prompts/statement/v1-statement-extraction.ts`
- **Estimated effort:** 1 point

### [PROD] normalizeItems Diverges from Pipeline (Missing deriveItemsPrices)

- **Source:** 18-8-item-price-extraction review (2026-03-14)
- **Finding:** `normalizeItems()` in `src/features/scan/handlers/processScan/utils.ts` maps AI fields but does NOT call `deriveItemsPrices()`. The live pipeline in `processScan.ts` calls both sequentially, but direct callers of `normalizeItems` will produce items with raw unitPrice (no derivation). Function should be renamed to `normalizeItemFields` or should call `deriveItemsPrices` internally.
- **Files:** `src/features/scan/handlers/processScan/utils.ts`
- **Stage:** PROD — Maintenance trap for future callers, not currently breaking
- **Estimated effort:** 1 point (rename + update callers, or compose with deriveItemsPrices)

### [TD] Regenerate all expected.json baselines after Cloud Function deploy

- **Source:** Story 18-8 prompt adversarial review (2026-03-14)
- **Finding:** Existing `expected.json` files in `prompt-testing/test-cases/` were generated with old V4 prompt (Spanish groups, no unitPrice). After deploying the updated Cloud Function, regenerate with `--force` to capture new prompt behavior.
- **Files:** `prompt-testing/test-cases/**/*.expected.json`
- **Estimated effort:** 1 point (scripted, but needs manual review of diffs)

### [PROD] Remove dead `isSaving` prop from TransactionEditorScanStatusProps

- **Source:** TD-18-5 review (2026-03-15)
- **Finding:** `isSaving` prop is accepted in the public interface but deliberately discarded (`_isSaving`). The prop creates a misleading contract — callers in `TransactionEditorViewInternal.tsx` pass a value they believe is used. Should either remove from interface + call site or mark `@deprecated`.
- **Files:** `src/features/transaction-editor/views/TransactionEditorScanStatus.tsx`, `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx`
- **Stage:** PROD — compile-time hygiene, not a runtime risk
- **Estimated effort:** 1 point (2 files, remove prop from interface + call site)

### [PROD] Missing dismissScanDialog Tests in useScanHandlers (Blocked by File Size)

- **Source:** TD-18-9-quicksave-dismiss-stuck review (2026-03-17)
- **Finding:** `handleQuickSaveComplete` and `handleQuickSaveCancel` now call `dismissScanDialog()` (TD-18-9 fix) but no handler-level test asserts this. Cannot add tests because `useScanHandlers.test.ts` is 1278 lines (800-line hook blocks edits). Requires test file split first.
- **Files:** `tests/unit/features/scan/hooks/useScanHandlers.test.ts`
- **Stage:** PROD — Test coverage gap for dialog dismiss path
- **Estimated effort:** 2 points (split test file into focused suites, then add dismiss assertions)

### [PROD] Pre-existing console.warn in useScanHandlers Catch Blocks

- **Source:** TD-18-9-quicksave-dismiss-stuck review (2026-03-17)
- **Finding:** Three `console.warn` calls in fire-and-forget catch blocks (insight recording L359, transaction tracking L365, merchant scan L379). Violates project no-console rule. Pre-existing, not introduced by TD-18-9.
- **Files:** `src/features/scan/hooks/useScanHandlers.ts`
- **Stage:** PROD — Code hygiene, no runtime impact
- **Estimated effort:** 1 point (replace with proper logging or remove)

### [PROD] cleanupPendingScans Phase 1 Not Paginated (Capped at 500)

- **Source:** 18-13a-resilient-scan-backend review (2026-03-17)
- **Finding:** Phase 1 (auto-fail stale processing scans) uses `.limit(BATCH_SIZE)` but no pagination loop, unlike Phase 2. If >500 scans are stale simultaneously (e.g., after an outage), extras wait for the next cleanup cycle. Each stale doc also runs a sequential transaction — performance bottleneck.
- **Files:** `functions/src/cleanupPendingScans.ts`
- **Stage:** PROD — Resilience under outage recovery, not feature-breaking
- **Estimated effort:** 1 point (wrap Phase 1 in same loop pattern as Phase 2)

### [PROD] APP_ID Hardcoded String Duplicated Across 5 Cloud Function Files

- **Source:** 18-13a-resilient-scan-backend review (2026-03-17)
- **Finding:** `const APP_ID = 'boletapp-d609f'` duplicated in queueReceiptScan, processReceiptScan, onPendingScanDeleted, cleanupPendingScans, and cleanupStaleFcmTokens. A typo in one file silently writes credits to the wrong Firestore path.
- **Files:** `functions/src/queueReceiptScan.ts`, `functions/src/processReceiptScan.ts`, `functions/src/onPendingScanDeleted.ts`, `functions/src/cleanupPendingScans.ts`, `functions/src/cleanupStaleFcmTokens.ts`
- **Stage:** PROD — DRY violation with silent-failure risk
- **Estimated effort:** 1 point (extract to functions/src/constants.ts, update 5 imports)

### [PROD] AC-2 Spec Path Mismatch with Implementation (Docs Errata)

- **Source:** 18-13a-resilient-scan-backend review (2026-03-17)
- **Finding:** Story AC-2 specifies `pending_scans/{userId}/{scanId}` but implementation uses flat `pending_scans/{scanId}` with userId as a field. The flat collection is architecturally correct (enables cross-user queries for cleanup, avoids collectionGroup index collision). Spec text needs errata update.
- **Files:** `docs/sprint-artifacts/epic18/stories/18-13a-resilient-scan-backend.md`
- **Stage:** PROD — Documentation accuracy
- **Estimated effort:** 0.5 points (update AC-2 text)

### [PROD] No Timeout on Image Upload in pendingScanUpload

- **Source:** 18-13b-resilient-scan-client review (2026-03-17)
- **Finding:** `uploadBytesResumable` in `uploadScanImages` has no per-image timeout. On poor mobile connections, uploads can hang indefinitely, holding the scan lock and blocking the user. Needs `Promise.race` with timeout and upload task cancellation.
- **Files:** `src/features/scan/services/pendingScanUpload.ts`
- **Stage:** PROD — Resilience for poor network conditions, not feature-breaking
- **Estimated effort:** 2 points (wrap each upload in timeout, cancel upload task, aggregate error handling)

### [PROD] Serial Image Fetch in copyPendingToReceipts

- **Source:** TD-18-11 review (2026-03-17) — 18-13b bundled changes
- **Finding:** `copyPendingToReceipts` downloads each image sequentially with `await` inside a `for` loop — O(n) serial fetches instead of `Promise.all`. For 2-3 image receipts, this is 2-3x slower than necessary. The parallel pattern already exists in `uploadScanImages` in the same file.
- **Files:** `src/features/scan/services/pendingScanUpload.ts`
- **Stage:** PROD — Performance optimization, not feature-breaking
- **Estimated effort:** 1 point (refactor to Promise.all with mapped array)

### [PROD] vi.clearAllMocks vs vi.resetAllMocks in useScanInitiation tests

- **Source:** TD-18-12-18-13b-review-quick-fixes review (2026-03-18)
- **Finding:** `useScanInitiation.test.ts` uses `vi.clearAllMocks()` in `beforeEach` instead of `vi.resetAllMocks()`. `clearAllMocks` only clears call history, not implementations — so module-level mocks (`mockQueueReceiptScan`, `mockUploadScanImages`, `analyzeReceipt`) retain resolved values across tests. Changing to `resetAllMocks` requires restoring mock implementations in `beforeEach` for all module-level mocks.
- **Files:** `tests/unit/features/scan/hooks/useScanInitiation.test.ts`
- **Stage:** PROD — Test hygiene, prevents mock state leakage between tests
- **Estimated effort:** 1 point (move mock implementations to beforeEach, change to resetAllMocks)

### [PROD] Per-image file size limit in pendingScanUpload

- **Source:** TD-18-10 review (2026-03-18)
- **Finding:** `base64ToBlob` decodes arbitrarily large base64 payloads with `atob()` + `Uint8Array` allocation. No `MAX_IMAGE_BYTES` guard prevents client-side memory DoS from oversized images. Add size check before creating the byte array.
- **Files:** `src/features/scan/services/pendingScanUpload.ts`
- **Stage:** PROD — Defense against client-side DoS via oversized uploads
- **Estimated effort:** 1 point (add MAX_IMAGE_BYTES const + guard in base64ToBlob)

### [PROD] Storage path input validation (defense-in-depth)

- **Source:** TD-18-10 review (2026-03-18)
- **Finding:** `uploadScanImages` and `copyPendingToReceipts` interpolate `userId`/`scanId`/`transactionId` into Storage paths without validation. While these IDs come from Firebase Auth/UUID (safe sources), the service functions accept raw strings. Validate IDs against `/^[a-zA-Z0-9_-]+$/` for defense-in-depth.
- **Files:** `src/features/scan/services/pendingScanUpload.ts`
- **Stage:** PROD — Defense-in-depth for Storage path construction
- **Estimated effort:** 1 point (add ID validation regex + guard)

### [PROD] Tighten STORAGE_URL_PATTERN hostname validation

- **Source:** TD-18-10 review (2026-03-18)
- **Finding:** `STORAGE_URL_PATTERN` regex only checks domain prefix (`^https://firebasestorage.googleapis.com/`). Use `new URL()` with explicit hostname check for robustness against crafted redirect URLs.
- **Files:** `src/features/scan/services/pendingScanUpload.ts`
- **Stage:** PROD — Hardened SSRF prevention at URL validation boundary
- **Estimated effort:** 1 point (replace regex with URL parser + hostname check)

### [PROD] Check response.ok after fetch in copyPendingToReceipts

- **Source:** TD-18-10 review (2026-03-18)
- **Finding:** `copyPendingToReceipts` calls `fetch()` without checking `response.ok`. A 4xx/5xx response silently produces a non-image blob that gets re-uploaded as corrupted data.
- **Files:** `src/features/scan/services/pendingScanUpload.ts`
- **Stage:** PROD — Data integrity for image copy pipeline
- **Estimated effort:** 1 point (add response.ok check + error throw)

### [PROD] Controlled vs Uncontrolled Mismatch in Item Editor totalPrice Inputs

- **Source:** TD-18-13 review (2026-03-19), updated repeat review (2026-03-19)
- **Finding:** `EditViewItemsSection.tsx` uses controlled totalPrice input (`value` + `onChange`) while `EditorItemsSection.tsx` uses uncontrolled (`defaultValue` + `onBlur`). Qty mismatch was resolved in TD-18-13 repeat review (both now uncontrolled). totalPrice mismatch remains. Causes behavioral inconsistency: controlled inputs update state on every keystroke; uncontrolled only on blur.
- **Files:** `src/features/transaction-editor/views/EditViewItemsSection.tsx`, `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx`
- **Stage:** PROD — UX consistency, not feature-breaking
- **Estimated effort:** 2 points (standardize totalPrice inputs to uncontrolled pattern)

### [PROD] Structural Layout Difference Between Grouped and Original Edit Views

- **Source:** TD-18-13 repeat review (2026-03-19)
- **Finding:** In `EditorItemsSection.tsx`, `GroupedItemEditView` places the unitPrice span in the price row (between totalPrice and category/qty), while `OriginalItemEditView` places it in the action row (between qty and category button). Different visual structure for the same fields creates inconsistent user experience between the two view modes.
- **Files:** `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx`
- **Stage:** PROD — UX consistency, not feature-breaking
- **Estimated effort:** 2 points (align layout structure between both edit views)

### [PROD] Duplicate Qty Validation Logic Across 4 Input Locations

- **Source:** TD-18-13 review (2026-03-19)
- **Finding:** Integer-only qty validation (`replace(/[^0-9]/g, '')` + `parseInt` + fallback-to-1) duplicated in 4 places across 2 files. `EditorItemsSection.tsx` additionally blocks keys via `onKeyDown`; `EditViewItemsSection.tsx` does not. Should extract to a shared `parseQtyInput()` helper.
- **Files:** `src/features/transaction-editor/views/EditViewItemsSection.tsx`, `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx`
- **Stage:** PROD — DRY violation, maintenance risk
- **Estimated effort:** 1 point (extract shared helper, update 4 call sites)

### [PROD] TransactionEditorView handleFinalSave Guard Branch Test

- **Source:** TD-18-15 review (2026-03-19)
- **Finding:** AC-8 test only covers the happy path (items present). The `if (!transaction) return` early exit guard in handleFinalSave has no test coverage. Minor gap — guard is trivial but untested.
- **Files:** `tests/unit/features/transaction-editor/views/TransactionEditorViewInternal.test.tsx`
- **Stage:** PROD — test completeness for guard branches
- **Estimated effort:** 0.5 points (add one test case with null transaction)

### [PROD] parseStrictNumber Mock Accuracy in Qty Tests

- **Source:** TD-18-15 review (2026-03-19)
- **Finding:** `makeProps().parseStrictNumber` is stubbed as `parseFloat(String(val)) || 0` but the real implementation uses strict integer parsing for CLP. Stub is never asserted against currently but could mislead future price-related tests in the same file.
- **Files:** `src/features/transaction-editor/views/EditViewItemsSection.qty.test.tsx`
- **Stage:** PROD — mock accuracy for future test reliability
- **Estimated effort:** 0.5 points (align stub with real implementation)

### [PROD] JSON Repair Regex Not String-Aware (Comment Stripping + Key Quoting)

- **Source:** TD-18-17 review (2026-04-05)
- **Finding:** Two regex patterns in `repairJson` are not string-aware: (1) `//` comment stripping fires inside double-quoted strings (e.g., `"https://store.cl//promo"` truncated), and (2) key-quoting regex matches `{word:` patterns inside string values. Both are documented limitations. Safe for current Gemini schema which has no URL fields or colon-containing values. If schema evolves, upgrade to string-aware tokenizer or `jsonrepair` library.
- **Files:** `functions/src/utils/jsonRepair.ts:30,37`
- **Stage:** PROD — No current trigger; mitigation needed if Gemini schema adds URL or free-text fields
- **Estimated effort:** 3 points (string-aware tokenizer or switch to `jsonrepair` library — addresses both issues)

### [PROD] ALLOWED_GEMINI_MODELS Defined Independently in 3 Cloud Functions

- **Source:** TD-18-18 review (2026-04-05)
- **Finding:** `ALLOWED_GEMINI_MODELS` array is defined identically but independently in `analyzeReceipt.ts`, `processReceiptScan.ts`, and `analyzeStatement.ts`. A future model addition or removal requires editing all 3 files. Extract to a shared constants module (e.g., `functions/src/constants.ts` or `functions/src/geminiConfig.ts`).
- **Files:** `functions/src/analyzeReceipt.ts`, `functions/src/processReceiptScan.ts`, `functions/src/analyzeStatement.ts`
- **Stage:** PROD — DRY violation, maintenance risk for model list updates
- **Estimated effort:** 1 point (extract const + default, update 3 imports)

### [PROD] No Explicit Test for Disallowed GEMINI_MODEL Guard

- **Source:** TD-18-18 review (2026-04-05)
- **Finding:** The `if (!ALLOWED_GEMINI_MODELS.includes(geminiModel)) throw` guard in all 3 CFs has no explicit test setting `GEMINI_MODEL` to an invalid value and asserting the error. The guard is exercised indirectly (happy path uses a valid model), but the rejection branch is untested.
- **Files:** `functions/src/__tests__/analyzeReceipt.test.ts`, `functions/src/__tests__/processReceiptScan.test.ts`
- **Stage:** PROD — Test coverage gap for configuration validation guard
- **Estimated effort:** 1 point (add 1 test per CF: set env to invalid model, assert error)

### [PROD] Repair Path Tests Missing Sanitization Assertions

- **Source:** TD-18-20 review (2026-04-05)
- **Finding:** CF-level repair path tests verify syntactic repair (malformed JSON → valid JSON) but do not assert that repaired string values are sanitized before storage. A crafted AI response with XSS payload in `merchant`/`items` fields would pass current tests undetected. Add a fixture case where at least one string field contains a `<script>` or SQL injection payload; assert the stored value is sanitized or that `sanitizeInput()` was called.
- **Files:** `functions/src/__tests__/analyzeReceipt.test.ts`, `functions/src/__tests__/processReceiptScan.test.ts`
- **Stage:** PROD — Sanitization layer exists in production code; gap is test coverage, not runtime safety
- **Estimated effort:** 1 point (add one fixture case with payload string per test file)

### [PROD] Integration Seam Gap: Scan Pipeline → Overlay Result Display

- **Source:** TD-18-19-scan-ux-immediate-overlay review (2026-04-06)
- **Finding:** Story touches the receipt scan pipeline (useScanInitiation → CF → Firestore → onSnapshot → ScanOverlay). All seams are mocked on both sides in unit tests — no emulator-backed integration test exercises the CF write → Firestore listener → overlay result render handoff. `INTEGRATION_SEAM_CHECK: FAIL`.
- **Files:** `src/features/scan/hooks/useScanInitiation.ts`, `src/features/scan/components/ScanOverlay.tsx`, `tests/integration/`
- **Stage:** PROD — Required for integration confidence, not for feature function
- **Estimated effort:** 3 points (requires Firestore emulator setup, integration test infrastructure for scan pipeline)

### [PROD] ScanOverlay Test File Exceeds 300-Line Unit Cap

- **Source:** TD-18-19-scan-ux-immediate-overlay review (2026-04-06)
- **Finding:** `ScanOverlay.test.tsx` is 450 lines, exceeding the 300-line unit test limit from testing.md. TD-18-19 added ~120 lines for ready state, fast scan, and action button tests. Split into focused test files (e.g., ScanOverlay.states.test.tsx, ScanOverlay.ready.test.tsx, ScanOverlay.accessibility.test.tsx).
- **Files:** `tests/unit/features/scan/components/ScanOverlay.test.tsx`
- **Stage:** PROD — Test maintainability
- **Estimated effort:** 2 points (split file, update imports, verify all tests pass)

### [PROD] Adversarial Fixture File Unused by Tests

- **Source:** TD-18-20 review (2026-04-05)
- **Finding:** `prompt-testing/test-cases/adversarial/malformed-json.fixture.json` contains both the raw malformed response and expected coerced output, but no test file loads it. TD-18-20 story background identified this fixture as the intended test data source, but the implementation inlined the malformed string instead. Loading the fixture file directly would make tests self-updating if the fixture evolves.
- **Files:** `prompt-testing/test-cases/adversarial/malformed-json.fixture.json`, both CF test files
- **Stage:** PROD — Test infrastructure improvement, not required for feature function
- **Estimated effort:** 2 points (add fixture-loading utility, update both tests to load from file)
