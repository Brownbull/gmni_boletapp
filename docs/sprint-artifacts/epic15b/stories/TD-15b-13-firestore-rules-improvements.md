# Tech Debt Story TD-15b-13: Firestore Rules isValidTransactionWrite Improvements

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-24) on story TD-15b-12
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **Firestore rules to cap `total` at a domain-appropriate upper bound and rename `isValidTransactionWrite` to reflect its document-agnostic scope**, so that **the rules are more accurate and maintainer-friendly**.

## Background

Two minor improvements identified during TD-15b-12 code review:

1. **Total upper bound** — `isValidTransactionWrite` accepts arbitrarily large `total` values (e.g., `1e308`). Client-side `sanitizeInput` provides a practical cap, but there is no server-side ceiling. A domain-appropriate cap (e.g., `total <= 999_999_999` for CLP amounts ~$1M USD) would close this defense-in-depth gap.

2. **Function naming** — `isValidTransactionWrite` is called on ALL subcollection writes via the catch-all rule (TD-15b-11), not just transaction writes. The name implies transaction-specificity, which could mislead future maintainers. A name like `hasValidFieldBounds` better reflects its document-agnostic role.

## Acceptance Criteria

- [ ] **AC1:** Add `data.total <= 999999999` guard to the `total` check — excessively large totals rejected (domain cap for CLP)
- [ ] **AC2:** Rename `isValidTransactionWrite` → `hasValidFieldBounds` (function declaration + 2 call sites in `firestore.rules`)
- [ ] **AC3:** Add tests for the upper bound: `total: 999999999` → assertSucceeds; `total: 1000000000` → assertFails
- [ ] **AC4:** Confirm existing TD-15b-11 and TD-15b-12 tests still pass after rename (no behavior change)
- [ ] **AC5:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Update hasValidFieldBounds in firestore.rules
- [ ] 1.1 Add `data.total <= 999999999` guard (total present → non-negative and ≤ 999,999,999)
- [ ] 1.2 Rename `isValidTransactionWrite` → `hasValidFieldBounds` (declaration + 2 call sites)
- [ ] 1.3 Update comment block: document the upper bound rationale (CLP domain context)

### Task 2: Update emulator tests
- [ ] 2.1 Add test: `total: 999999999` → assertSucceeds (at boundary)
- [ ] 2.2 Add test: `total: 1000000000` → assertFails (over boundary)

## Dev Notes

- Source story: [TD-15b-12](./TD-15b-12-transaction-schema-bounds.md)
- Review findings: #2 (LOW, security-reviewer), #6 (INFO, security-reviewer)
- Files affected: `firestore.rules`, `tests/integration/firestore-rules.test.ts`
- CLP context: ₡999,999,999 ≈ ~$1M USD. A single transaction exceeding this is almost certainly a data error.
- **File size note:** `firestore-rules.test.ts` is ~492 lines after TD-15b-12. Adding 2 new tests (+12 lines) will push it to ~504 lines, exceeding the 500-line integration test limit. Split the TD-15b-12 describe block into a new file (e.g., `tests/integration/firestore-rules-schema-bounds.test.ts`) before adding the upper-bound tests.
- Rename is mechanical — no behavior change. All existing tests will pass without modification once the function name is updated.
