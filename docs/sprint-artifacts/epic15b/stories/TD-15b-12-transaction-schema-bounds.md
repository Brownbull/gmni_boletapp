# Tech Debt Story TD-15b-12: Transaction Schema Bounds Hardening

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-24) on story TD-15b-11
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **Firestore rules to enforce non-empty merchant and non-negative total at the server layer**, so that **the transaction schema is protected from degenerate values even via direct Firestore SDK writes**.

## Background

`isValidTransactionWrite` currently enforces:
- `merchant` is a string ≤ 200 chars (if present)
- `total` is a number (if present)

Two gaps remain:
1. `merchant: ""` (empty string) passes validation — 0 chars is technically ≤ 200
2. `total: -999999` (negative number) passes — `is number` doesn't enforce a lower bound

These are not exploitable for security purposes but are schema gaps that could cause data-quality issues (empty merchant name shown in UI, negative totals in reports). Primary enforcement is already at the client layer (`sanitize.ts` min-length checks, `total` input constraints), so this is a defense-in-depth improvement.

## Acceptance Criteria

- [ ] **AC1:** Add `data.merchant.size() >= 1` guard to `isValidTransactionWrite` when `merchant` is present — empty string rejected
- [ ] **AC2:** Add `data.total >= 0` guard to `isValidTransactionWrite` when `total` is present — negative totals rejected
- [ ] **AC3:** Update emulator tests — add: `merchant: ""` rejected, `total: -1` rejected, `total: 0` accepted (zero is a valid total)
- [ ] **AC4:** Verify the optional-field guard pattern is preserved — documents without `merchant`/`total` fields still pass
- [ ] **AC5:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Update isValidTransactionWrite function
- [ ] 1.1 Add `data.merchant.size() >= 1` guard (merchant present → non-empty string, ≤ 200 chars)
- [ ] 1.2 Add `data.total >= 0` guard (total present → non-negative number)
- [ ] 1.3 Confirm non-transaction subcollection writes still pass (no merchant/total → optional guards return true)

### Task 2: Update emulator tests
- [ ] 2.1 Add test: `merchant: ""` → assertFails
- [ ] 2.2 Add test: `total: -1` → assertFails
- [ ] 2.3 Add test: `total: 0` → assertSucceeds (zero is a valid total, e.g. free items)

## Dev Notes

- Source story: [TD-15b-11](./TD-15b-11-firestore-rules-hardening.md)
- Review findings: #3 (LOW, security-reviewer), #4 (LOW, security-reviewer)
- Files affected: `firestore.rules`, `tests/integration/firestore-rules.test.ts`
- Pattern to follow: `isValidTransactionWrite` optional field guards at `firestore.rules:36-39`
- Note: `total: 0` must be explicitly tested since `>= 0` is the intended bound, not `> 0`
