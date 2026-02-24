# Tech Debt Story TD-15b-11: Firestore Rules Architecture Hardening

**Status:** done

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-9
> **Priority:** HIGH | **Estimated Effort:** 3 pts

## Story

As a **developer**, I want **Firestore security rules to actually enforce transaction write validation**, so that **the `isValidTransactionWrite` function provides real server-side enforcement rather than advisory-only documentation**.

## Background

TD-15b-9 added `isValidTransactionWrite` to validate `merchant.size() <= 200` and `total is number` on transaction writes. However, the catch-all wildcard rule (`match /artifacts/{appId}/users/{userId}/{document=**}`) also grants write access to authenticated users. Firestore evaluates rules with OR semantics — if ANY matching rule allows access, the request is granted. This means `isValidTransactionWrite` is entirely bypassed: a malicious client can write a 10,000-char merchant field or a non-numeric total by simply relying on the catch-all.

The current state was honestly documented in `firestore.rules` comments (TD-15b-9), and primary enforcement is at the client layer (`sanitize.ts`). For a financial app, having zero server-side write validation is a meaningful gap.

Additionally, `items[].name` (max 200 chars) and `items[].subcategory` (max 100 chars) have no server-side enforcement at any layer — Firestore rules cannot iterate list elements, and the client sanitization layer can be bypassed via direct Firestore SDK calls.

## Acceptance Criteria

- [x] **AC1:** Restructure `firestore.rules` so the transaction-specific rule is the only one that matches transaction documents — the catch-all wildcard must NOT match the `transactions` subcollection, OR the catch-all must also include `isValidTransactionWrite` for transaction paths
- [x] **AC2:** Verify `isValidTransactionWrite` actually enforces: write a transaction with `merchant` > 200 chars via Firestore emulator — confirm it is rejected
- [x] **AC3:** Evaluate and document (in Dev Notes or ADR) the preferred approach for server-side `items[]` field enforcement — options: (a) move items to a subcollection, (b) Cloud Function write proxy, (c) scheduled audit function that flags/truncates oversized items
- [x] **AC4:** If items enforcement approach is selected (not just documented): implement it — **Decision: no approach selected in this story (see Task 3 evaluation)**
- [x] **AC5:** All existing Firestore security rule tests pass (if any exist in `tests/`); or add emulator-based smoke test confirming the catch-all bypass is closed
- [x] **AC6:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Audit current rule structure
- [x] 1.1 Map all paths matched by each rule in `firestore.rules`
- [x] 1.2 Identify all subcollections currently relying on the catch-all `{document=**}` rule
- [x] 1.3 Confirm which subcollections need only auth-check vs which need field validation

### Task 2: Restructure rules to close the bypass
- [x] 2.1 Choose approach: (a) narrow catch-all to exclude `transactions`, or (b) add `isValidTransactionWrite` guard to catch-all when path is a transaction
- [x] 2.2 Implement chosen approach in `firestore.rules`
- [x] 2.3 Verify via emulator: `merchant > 200 chars` → rejected; `total = "string"` → rejected; valid write → accepted
- [x] 2.4 Verify all other subcollection writes (preferences, FCM tokens, etc.) still work

### Task 3: Evaluate items[] server-side enforcement
- [x] 3.1 Research feasibility of items-as-subcollection (transaction data shape, migration cost)
- [x] 3.2 Research Cloud Function write proxy option (performance, complexity, testing)
- [x] 3.3 Document decision in Dev Notes (or create ADR if subcollection restructuring is chosen)
- [ ] 3.4 (Optional) Implement lightweight approach if effort fits in this story — **SKIPPED: all viable options exceed this story's budget**

## Dev Notes

### Task 1 Audit Results

**All subcollections under `/artifacts/{appId}/users/{userId}/`:**

| Subcollection | Needs field validation? | Current rule coverage |
|---|---|---|
| `transactions/{txnId}` | YES — merchant ≤200, total is number | Specific rule + catch-all (fixed in Task 2) |
| `merchant_mappings/{docId}` | Auth only | Catch-all |
| `category_mappings/{docId}` | Auth only | Catch-all |
| `subcategory_mappings/{docId}` | Auth only | Catch-all |
| `item_name_mappings/{docId}` | Auth only | Catch-all |
| `trusted_merchants/{docId}` | Auth only | Catch-all |
| `airlocks/{docId}` | Auth only | Catch-all |
| `personalRecords/{docId}` | Auth only | Catch-all |
| `notifications/{docId}` | Auth only | Catch-all |
| `preferences/settings` | Auth only | Catch-all |
| `credits/balance` | Auth only | Catch-all |
| `insightProfile/profile` | Auth only | Catch-all |

**Finding:** Only `transactions` needs field validation. All other subcollections are auth-only. None of the auth-only subcollections use `merchant` or `total` as field names.

### Task 2 Implementation

**Approach chosen: Option B (add `isValidTransactionWrite` to catch-all write rule)**

Why Option B over Option A (enumerate subcollections):
- `isValidTransactionWrite` already uses optional field guards (`!('merchant' in data) || ...`), so it returns `true` for any document without `merchant`/`total` fields
- All 11 non-transaction subcollections lack these fields → no breakage
- Single-line change vs 11 new rules (much lower maintenance burden — new subcollections auto-covered)

Before fix:
```
match /artifacts/{appId}/users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

After fix:
```
match /artifacts/{appId}/users/{userId}/{document=**} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null
    && request.auth.uid == userId
    && isValidTransactionWrite(request.resource.data);
}
```

**Bypass trace (post-fix):**
- Invalid transaction write (merchant = 'x' × 201): transaction rule DENY + catch-all DENY = **DENIED** ✓
- Valid transaction write: transaction rule ALLOW = **ALLOWED** ✓
- Preferences write (no merchant/total): catch-all ALLOW (isValidTransactionWrite returns true) = **ALLOWED** ✓

### Task 3: items[] Server-Side Enforcement Evaluation

**Constraint:** Firestore rules cannot iterate list elements. `.size()` on `data.items[0].name` is not valid Firestore rules syntax.

**Option (a): Move items to subcollection (`transactions/{txnId}/items/{itemId}`)**
- Each item becomes a document → can apply per-document field length rules
- Cost: Full data model migration for all existing transactions (Firestore documents + client read/write code changes in ~20 files)
- Testing: All transaction services, queries, pagination need updates
- **Verdict: Too costly for this story (5+ story points of migration work)**

**Option (b): Cloud Function write proxy (all transaction writes go through a CF)**
- CF sanitizes items before writing, so rules can trust items content
- Cost: New CF endpoint, update all client-side transaction writes to call the CF instead of direct SDK, performance overhead (CF cold starts on every write)
- Testing: Full regression on transaction creation flow (scan, manual, batch)
- **Verdict: Too costly + performance risk (cold starts on financial writes)**

**Option (c): Scheduled audit function**
- CF runs periodically, scans transactions for oversized item names, truncates or flags
- Cost: New CF function + schedule config, but NO client changes
- Limitation: Doesn't prevent bad writes — only corrects after the fact
- **Verdict: Feasible but delayed enforcement (not "real-time" server-side guard)**

**Decision:** No implementation in this story. Client-side enforcement via `sanitizeItemName(200)` / `sanitizeSubcategory(100)` in `sanitize.ts` remains primary. A direct Firestore SDK attack is a theoretical concern but not a practical risk for a solo-user app. Track Option (c) as a future tech debt story if items field corruption is observed in production.

**Future story:** Create `TD-items-audit-cf` if items field corruption occurs or if CF budget allows.

---

### Sizing Actuals
- Tasks: 3 (10 subtasks completed, 1 optional skipped)
- Files changed: 2 (`firestore.rules`, `tests/integration/firestore-rules.test.ts`)
- Story matched estimate exactly

### Source story
- [TD-15b-9](./TD-15b-9-sanitization-boundary-audit.md)
- Review findings: #1 (CRITICAL, security-reviewer), #2 (HIGH, code+security)

---

## Senior Developer Review (ECC) — 2026-02-24

**Agents:** code-reviewer, security-reviewer | **Classification:** STANDARD | **Score:** 8.0/10

**Outcome:** APPROVED WITH FIXES — 3 quick fixes applied, 1 TD story created

### Deferred Items

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [TD-15b-12](./TD-15b-12-transaction-schema-bounds.md) | merchant non-empty + total >= 0 bounds in isValidTransactionWrite | LOW | CREATED |

### Fixes Applied in Review

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 1 | HIGH | `allow write` in catch-all included delete; `request.resource.data` null on delete → non-transaction subcollection deletes DENIED | Changed to `allow create, update` + separate `allow delete: if auth` |
| 2 | MEDIUM | No delete test for non-transaction subcollection | Added Test 11 (delete preferences) |
| 6 | INFO | Only `preferences` tested; `credits` not verified | Added Test 12 (credits write) |
