# Tech Debt Story TD-15b-9: Sanitization Boundary Audit

**Status:** ready-for-dev

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

- [ ] **AC1:** Audit all callers of `sanitizeItemName()` and `sanitizeSubcategory()` — determine if the 200/100 defaults are intentional (e.g., Firestore write layer allows longer values than the UI displays) or a latent inconsistency
- [ ] **AC2:** Document the intent: either update helper defaults to match UI constraints, OR add comments in `sanitize.ts` explaining why the helpers allow larger values than the UI
- [ ] **AC3:** Audit Firestore security rules (`firestore.rules`) for item field length enforcement — add `request.resource.data.name.size() <= 100` style constraints if absent
- [ ] **AC4:** If any Cloud Functions write item data to Firestore, confirm they call `sanitizeInput` (or equivalent) before writing
- [ ] **AC5:** Update `handleUpdateItem price` test comment from "passes raw value" to "passes sanitized value" (1-line doc fix from TD-15b-7 quick fix)
- [ ] **AC6:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Audit sanitization helper maxLength inconsistency
- [ ] 1.1 Search all callers of `sanitizeItemName` and `sanitizeSubcategory` in `src/`
- [ ] 1.2 Identify intent: UI-layer limit (100/50) vs storage-layer limit (200/100)
- [ ] 1.3 Resolve: update helper defaults OR add clarifying comments

### Task 2: Firestore security rules audit
- [ ] 2.1 Read `firestore.rules` — check for item field length constraints
- [ ] 2.2 If absent: add `name.size() <= 100` and `subcategory.size() <= 50` under item write rules

### Task 3: Cloud Functions audit
- [ ] 3.1 Search `functions/src/` for any code that writes item data to Firestore
- [ ] 3.2 Confirm sanitization is applied before writes; add if missing

### Task 4: Fix test comment
- [ ] 4.1 In `EditViewItemsSection.test.tsx`, update line ~137 comment: "passes raw value through parseStrictNumber prop" → "passes sanitized numeric value through parseStrictNumber prop"
- [ ] 4.2 Run `npm run test:quick` — confirm all pass

## Dev Notes

- Source story: [TD-15b-7](./TD-15b-7-editviewitems-input-sanitization.md)
- Review findings: #1 (sanitizeItemName maxLength), #2 (sanitizeSubcategory maxLength), #7 (Firestore/Cloud Function boundary)
- Files likely affected: `src/utils/sanitize.ts`, `firestore.rules`, possibly `functions/src/`, `EditViewItemsSection.test.tsx`
- Context: `sanitizeItemName(name)` is defined at `sanitize.ts:148`; `sanitizeSubcategory(sub)` at `sanitize.ts:168`
- Pre-existing gap: not introduced by TD-15b-7 — inherited from original sanitize.ts definition
- Test selector fragility (finding #4): test uses same placeholder for both views, relies on only-one-view-rendered invariant. LOW priority — add `data-testid="name-input-grouped"` / `data-testid="name-input-original"` if/when views are refactored to render simultaneously
