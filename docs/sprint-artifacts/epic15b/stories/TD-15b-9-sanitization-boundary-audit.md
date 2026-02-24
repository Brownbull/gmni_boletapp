# Tech Debt Story TD-15b-9: Sanitization Boundary Audit

**Status:** done

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-7
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story

As a **developer**, I want **sanitization maxLength constants aligned across helpers and call sites, and Firestore/Cloud Function boundaries verified**, so that **the security model is self-consistent and there are no surprising size discrepancies between layers**.

## Background

During the TD-15b-7 review, two divergences were identified between the named helpers in `sanitize.ts` and the maxLength values used inline in `EditViewItemsSection.tsx`:

- `sanitizeItemName()` defaults to `maxLength: 200`, but the UI uses `maxLength: 100`
- `sanitizeSubcategory()` defaults to `maxLength: 100`, but the UI uses `maxLength: 50`

Additionally, `EditViewItemsSection` sanitizes at the UI layer only. The data path is: UI → `onUpdateTransaction` prop → parent → Firestore. Server-side length enforcement (Firestore security rules, Cloud Functions) has not been audited.

The TD-15b-7 quick fix added `sanitizeNumericInput` to price inputs, but the `handleUpdateItem price` test comment says "passes raw value through parseStrictNumber prop" — this description is now slightly misleading (sanitization happens before parseStrictNumber).

## Acceptance Criteria

- [x] **AC1:** Audit all callers of `sanitizeItemName()` and `sanitizeSubcategory()` — determine if the 200/100 defaults are intentional (e.g., Firestore write layer allows longer values than the UI displays) or a latent inconsistency
- [x] **AC2:** Document the intent: either update helper defaults to match UI constraints, OR add comments in `sanitize.ts` explaining why the helpers allow larger values than the UI
- [x] **AC3:** Audit Firestore security rules (`firestore.rules`) for item field length enforcement — add `request.resource.data.name.size() <= 100` style constraints if absent
- [x] **AC4:** If any Cloud Functions write item data to Firestore, confirm they call `sanitizeInput` (or equivalent) before writing
- [x] **AC5:** Update `handleUpdateItem price` test comment from "passes raw value" to "passes sanitized value" (1-line doc fix from TD-15b-7 quick fix)
- [x] **AC6:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Audit sanitization helper maxLength inconsistency
- [x] 1.1 Search all callers of `sanitizeItemName` and `sanitizeSubcategory` in `src/`
- [x] 1.2 Identify intent: UI-layer limit (100/50) vs storage-layer limit (200/100)
- [x] 1.3 Resolve: update helper defaults OR add clarifying comments

### Task 2: Firestore security rules audit
- [x] 2.1 Read `firestore.rules` — check for item field length constraints
- [x] 2.2 If absent: add `name.size() <= 100` and `subcategory.size() <= 50` under item write rules

### Task 3: Cloud Functions audit
- [x] 3.1 Search `functions/src/` for any code that writes item data to Firestore
- [x] 3.2 Confirm sanitization is applied before writes; add if missing

### Task 4: Fix test comment
- [x] 4.1 In `EditViewItemsSection.grouped.test.tsx`, update line 138 comment: "passes raw value through parseStrictNumber prop" → "passes sanitized numeric value through parseStrictNumber prop"
- [x] 4.2 Run `npm run test:quick` — confirm all pass

## Dev Notes

- Source story: [TD-15b-7](./TD-15b-7-editviewitems-input-sanitization.md)
- Review findings: #1 (sanitizeItemName maxLength), #2 (sanitizeSubcategory maxLength), #7 (Firestore/Cloud Function boundary)
- Files affected: `src/utils/sanitize.ts`, `firestore.rules`, `src/features/transaction-editor/views/EditViewItemsSection.grouped.test.tsx`
- Context: `sanitizeItemName(name)` is defined at `sanitize.ts:159`; `sanitizeSubcategory(sub)` at `sanitize.ts:189` (after comment additions)
- Pre-existing gap: not introduced by TD-15b-7 — inherited from original sanitize.ts definition
- Test selector fragility (finding #4): test uses same placeholder for both views, relies on only-one-view-rendered invariant. LOW priority — add `data-testid="name-input-grouped"` / `data-testid="name-input-original"` if/when views are refactored to render simultaneously
- Note: Test file corrected to `EditViewItemsSection.grouped.test.tsx` (story originally said `.test.tsx` — that file doesn't exist; it was split into `.grouped.test.tsx` and `.edge.test.tsx` by TD-15b-8)

### Task 1 Audit Finding
The maxLength inconsistency is **intentional — 2-layer design**:
- **Storage layer** (`sanitizeItemName(200)`, `sanitizeSubcategory(100)`): used in `TransactionEditorViewInternal.tsx` (Firestore save path) and mapping services. AI receipt scans may produce item names up to ~150 chars; storage allows 200 chars.
- **UI edit layer** (inline `sanitizeInput(100/50)` in `EditViewItemsSection.tsx`): stricter limit for what users can type in the editing UI.
- **Callers of `sanitizeItemName`**: `TransactionEditorViewInternal.tsx:703`, `itemNameMappingService.ts:30`
- **Callers of `sanitizeSubcategory`**: `TransactionEditorViewInternal.tsx:704`, `subcategoryMappingService.ts:27`
- **Resolution**: Added clarifying comments to both helpers in `sanitize.ts` (not changing defaults).

### Task 2 Audit Finding
- Pre-existing rules: auth-only, no field-level validation
- **Item array element field lengths** (items[].name, items[].subcategory) cannot be validated in Firestore rules — rules engine cannot iterate list elements
- **Added**: `isValidTransactionWrite(data)` helper function validating `merchant.size() <= 200` (scalar top-level field, feasible to validate)
- **Architectural note**: The catch-all `{document=**}` user data rule also grants write access; Firestore grants if ANY rule allows, so the transaction-specific validation is currently advisory. Primary enforcement is at the client layer (sanitize.ts). Restructuring the overlap is tracked as future work.
- Split `allow read, write` into explicit `allow read`, `allow create, update` (validated), `allow delete`

### Task 3 Audit Finding
- `analyzeReceipt` is an `onCall` function — returns AI analysis data to the client, does NOT write to Firestore
- `cleanupCrossUserFcmToken.ts`, `cleanupStaleFcmTokens.ts`: FCM token cleanup only (batch deletes of token docs, not transaction/item data)
- `deleteTransactionImages.ts`, `webPushService.ts`: storage deletion and push notifications — no item data writes
- **AC4 satisfied**: No Cloud Functions write item data to Firestore. Client-side sanitization at `TransactionEditorViewInternal.tsx` is the only write path.

### Sizing Metrics
- Tasks: 4 | Subtasks: 10 | Files: 3 source + 1 test = 4 files
- Classification: COMPLEX (4 tasks > 3 threshold, but all tasks were audit/doc changes with minimal LOC)

### Code Review Deferred Items (2026-02-23)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [TD-15b-11](./TD-15b-11-firestore-rules-hardening.md) | Close catch-all rule bypass so `isValidTransactionWrite` actually enforces; evaluate items[] server-side enforcement | HIGH | CREATED |
