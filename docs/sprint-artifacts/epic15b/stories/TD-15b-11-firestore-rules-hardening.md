# Tech Debt Story TD-15b-11: Firestore Rules Architecture Hardening

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-9
> **Priority:** HIGH | **Estimated Effort:** 3 pts

## Story

As a **developer**, I want **Firestore security rules to actually enforce transaction write validation**, so that **the `isValidTransactionWrite` function provides real server-side enforcement rather than advisory-only documentation**.

## Background

TD-15b-9 added `isValidTransactionWrite` to validate `merchant.size() <= 200` and `total is number` on transaction writes. However, the catch-all wildcard rule (`match /artifacts/{appId}/users/{userId}/{document=**}`) also grants write access to authenticated users. Firestore evaluates rules with OR semantics — if ANY matching rule allows access, the request is granted. This means `isValidTransactionWrite` is entirely bypassed: a malicious client can write a 10,000-char merchant field or a non-numeric total by simply relying on the catch-all.

The current state was honestly documented in `firestore.rules` comments (TD-15b-9), and primary enforcement is at the client layer (`sanitize.ts`). For a financial app, having zero server-side write validation is a meaningful gap.

Additionally, `items[].name` (max 200 chars) and `items[].subcategory` (max 100 chars) have no server-side enforcement at any layer — Firestore rules cannot iterate list elements, and the client sanitization layer can be bypassed via direct Firestore SDK calls.

## Acceptance Criteria

- [ ] **AC1:** Restructure `firestore.rules` so the transaction-specific rule is the only one that matches transaction documents — the catch-all wildcard must NOT match the `transactions` subcollection, OR the catch-all must also include `isValidTransactionWrite` for transaction paths
- [ ] **AC2:** Verify `isValidTransactionWrite` actually enforces: write a transaction with `merchant` > 200 chars via Firestore emulator — confirm it is rejected
- [ ] **AC3:** Evaluate and document (in Dev Notes or ADR) the preferred approach for server-side `items[]` field enforcement — options: (a) move items to a subcollection, (b) Cloud Function write proxy, (c) scheduled audit function that flags/truncates oversized items
- [ ] **AC4:** If items enforcement approach is selected (not just documented): implement it
- [ ] **AC5:** All existing Firestore security rule tests pass (if any exist in `tests/`); or add emulator-based smoke test confirming the catch-all bypass is closed
- [ ] **AC6:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Audit current rule structure
- [ ] 1.1 Map all paths matched by each rule in `firestore.rules`
- [ ] 1.2 Identify all subcollections currently relying on the catch-all `{document=**}` rule
- [ ] 1.3 Confirm which subcollections need only auth-check vs which need field validation

### Task 2: Restructure rules to close the bypass
- [ ] 2.1 Choose approach: (a) narrow catch-all to exclude `transactions`, or (b) add `isValidTransactionWrite` guard to catch-all when path is a transaction
- [ ] 2.2 Implement chosen approach in `firestore.rules`
- [ ] 2.3 Verify via emulator: `merchant > 200 chars` → rejected; `total = "string"` → rejected; valid write → accepted
- [ ] 2.4 Verify all other subcollection writes (preferences, FCM tokens, etc.) still work

### Task 3: Evaluate items[] server-side enforcement
- [ ] 3.1 Research feasibility of items-as-subcollection (transaction data shape, migration cost)
- [ ] 3.2 Research Cloud Function write proxy option (performance, complexity, testing)
- [ ] 3.3 Document decision in Dev Notes (or create ADR if subcollection restructuring is chosen)
- [ ] 3.4 (Optional) Implement lightweight approach if effort fits in this story

## Dev Notes

- Source story: [TD-15b-9](./TD-15b-9-sanitization-boundary-audit.md)
- Review findings: #1 (CRITICAL, security-reviewer), #2 (HIGH, code+security)
- Files affected: `firestore.rules`, potentially `tests/` (emulator smoke test)
- Catch-all bypass explanation: Firestore rules grant access if ANY rule matches. The specific transaction rule validates; the catch-all matches the same path and grants unconditionally. Fixing requires either narrowing the catch-all scope or duplicating the validation.
- Example restructure (option a):
  ```
  // Replace broad catch-all with explicit subcollections only
  match /artifacts/{appId}/users/{userId}/preferences/{docId} { allow read, write: if auth... }
  match /artifacts/{appId}/users/{userId}/tokens/{docId} { allow read, write: if auth... }
  // Remove the {document=**} wildcard, or make it exclude transactions explicitly
  ```
- items[] enforcement note: Firestore rules cannot use `.size()` on elements of a list field. Server-side enforcement of per-item string lengths requires either (a) moving items to a subcollection where each document can be validated, or (b) a server-side write path (Cloud Function proxy) that sanitizes before writing.
- Sizing: Tasks: 3 | Subtasks: 10 | Files: ~2 (firestore.rules + optional test)
