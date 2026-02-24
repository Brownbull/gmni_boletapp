# Tech Debt Story TD-15b-13: Firestore Rules isValidTransactionWrite Improvements

**Status:** done

> **Source:** ECC Code Review (2026-02-24) on story TD-15b-12
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **Firestore rules to cap `total` at a domain-appropriate upper bound and rename `isValidTransactionWrite` to reflect its document-agnostic scope**, so that **the rules are more accurate and maintainer-friendly**.

## Background

Two minor improvements identified during TD-15b-12 code review:

1. **Total upper bound** — `isValidTransactionWrite` accepts arbitrarily large `total` values (e.g., `1e308`). Client-side `sanitizeInput` provides a practical cap, but there is no server-side ceiling. A domain-appropriate cap (e.g., `total <= 999_999_999` for CLP amounts ~$1M USD) would close this defense-in-depth gap.

2. **Function naming** — `isValidTransactionWrite` is called on ALL subcollection writes via the catch-all rule (TD-15b-11), not just transaction writes. The name implies transaction-specificity, which could mislead future maintainers. A name like `hasValidFieldBounds` better reflects its document-agnostic role.

## Acceptance Criteria

- [x] **AC1:** Add `data.total <= 999999999` guard to the `total` check — excessively large totals rejected (domain cap for CLP)
- [x] **AC2:** Rename `isValidTransactionWrite` → `hasValidFieldBounds` (function declaration + 2 call sites in `firestore.rules`)
- [x] **AC3:** Add tests for the upper bound: `total: 999999999` → assertSucceeds; `total: 1000000000` → assertFails
- [x] **AC4:** Confirm existing TD-15b-11 and TD-15b-12 tests still pass after rename (no behavior change)
- [x] **AC5:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Update hasValidFieldBounds in firestore.rules
- [x] 1.1 Add `data.total <= 999999999` guard (total present → non-negative and ≤ 999,999,999)
- [x] 1.2 Rename `isValidTransactionWrite` → `hasValidFieldBounds` (declaration + 2 call sites)
- [x] 1.3 Update comment block: document the upper bound rationale (CLP domain context)

### Task 2: Update emulator tests
- [x] 2.1 Add test: `total: 999999999` → assertSucceeds (at boundary)
- [x] 2.2 Add test: `total: 1000000000` → assertFails (over boundary)

## Dev Notes

- Source story: [TD-15b-12](./TD-15b-12-transaction-schema-bounds.md)
- Review findings: #2 (LOW, security-reviewer), #6 (INFO, security-reviewer)
- Files affected: `firestore.rules`, `tests/integration/firestore-rules.test.ts`, `tests/integration/firestore-rules-schema-bounds.test.ts` (new)
- CLP context: ₡999,999,999 ≈ ~$1M USD. A single transaction exceeding this is almost certainly a data error.
- **File size note:** `firestore-rules.test.ts` was ~492 lines after TD-15b-12. TD-15b-12 describe block split to `firestore-rules-schema-bounds.test.ts` (117 lines). `firestore-rules.test.ts` now 437 lines. Both under 500-line limit.
- Rename is mechanical — no behavior change. All existing 12 TD-15b-11 tests still pass.
- Also updated `isValidTransactionWrite` comment references in `firestore-rules.test.ts` to `hasValidFieldBounds` for consistency.

## Senior Developer Review (ECC) — 2026-02-24

- **Agents:** code-reviewer (sonnet), security-reviewer (sonnet)
- **Classification:** STANDARD (firestore.rules → security pattern match)
- **Outcome:** APPROVE — 9.0/10
- **Quick fixes applied:** 2 (stale JSDoc in sanitize.ts:137, inline comment in firestore.rules:10)
- **TD stories created:** 0 (4 INFO items acknowledged, no blockers)
- **Tests:** 6810 pass ✅

## Deferred Items (Code Review 2026-02-24)

| # | Sev | Finding | Action |
|---|-----|---------|--------|
| 3 | INFO | Duplicated `beforeAll`/`afterAll`/`beforeEach` + `getTxnCollection` in schema-bounds.test.ts | ACKNOWLEDGED — 117 lines, cosmetic DRY; no story |
| 4 | INFO | `(AC3)` label ambiguity between TD-15b-12 and TD-15b-13 describe blocks | ACKNOWLEDGED — cosmetic; no story |
| 5 | INFO | Whitespace-only merchant strings pass `size() >= 1` | ALREADY_DOCUMENTED in `firestore.rules:22-23`; client layer handles |
| 6 | INFO | CLP fractional totals (`99.99`) accepted by rules | ACKNOWLEDGED — domain concern, not a security issue |

## Implementation Metrics

- Files changed: 3 (firestore.rules, firestore-rules.test.ts, firestore-rules-schema-bounds.test.ts)
- Tests: 18 integration tests pass (12 existing + 6 in new file), 6810 unit tests pass
- Line counts: firestore.rules=80, firestore-rules.test.ts=437, schema-bounds.test.ts=117
