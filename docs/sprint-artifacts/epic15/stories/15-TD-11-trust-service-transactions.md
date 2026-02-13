# Story 15-TD-11: Trust Service Transaction Completeness

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** done

## Description

TD-1 wrapped `recordScan()` in `runTransaction()`, but three other trust mutation functions — `trustMerchant()`, `declineTrust()`, `revokeTrust()` — still perform read-then-write as separate operations without transaction protection. These are lower-frequency operations but still violate the project's TOCTOU prevention rule.

## Source

- **Code Review Finding #8 (HIGH):** `trustMerchant`, `declineTrust`, and `revokeTrust` in `merchantTrustService.ts` perform `getDoc()` → conditional `updateDoc()` without `runTransaction()`. Concurrent calls can corrupt trust status (e.g., two users both "trusting" a merchant could overwrite each other's trustCount increment).

## Acceptance Criteria

- [x] **AC1:** `trustMerchant()` wrapped in `runTransaction()` — read trust record, verify state, update atomically
- [x] **AC2:** `declineTrust()` wrapped in `runTransaction()` — read trust record, verify state, update atomically
- [x] **AC3:** `revokeTrust()` wrapped in `runTransaction()` — read trust record, verify state, update atomically
- [x] **AC4:** Transaction reads fresh data and validates pre-conditions (e.g., can't trust an already-trusted merchant)
- [x] **AC5:** Unit tests with `mockTransaction.get/set/update` pattern (matching TD-1 test style)
- [x] **AC6:** All existing tests pass

## Tasks

- [x] **Task 1:** Wrap `trustMerchant()` in `runTransaction()`
  - [x] Move `getDoc` into `transaction.get()`, `updateDoc`/`setDoc` into `transaction.update()`/`transaction.set()`
  - [x] Add pre-condition check: if already trusted, skip or throw
- [x] **Task 2:** Wrap `declineTrust()` in `runTransaction()`
  - [x] Same pattern: read inside transaction, validate, then write
- [x] **Task 3:** Wrap `revokeTrust()` in `runTransaction()`
  - [x] Same pattern: read inside transaction, validate, then write
- [x] **Task 4:** Add unit tests (3 functions x 2-3 tests each)
  - [x] Test normal flow with transaction mocks
  - [x] Test concurrent-safety (fresh read, not stale)
  - [x] Test pre-condition validation (e.g., revoking already-declined)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/services/merchantTrustService.ts` | MODIFY | Wrap 3 functions in runTransaction |
| `tests/unit/services/merchantTrustService.trust.test.ts` | CREATE | Tests for trust/decline/revoke transactions |

## Dev Notes

- Follow the same `runTransaction` pattern established in TD-1 for `recordScan()`
- These functions are lower-frequency than `recordScan` (user-initiated, not scan-triggered), so the risk is lower but the fix is straightforward
- Use `transaction.get()` + `transaction.update()` — not `transaction.set()` with merge unless the doc might not exist
- The existing `merchantTrustService.test.ts` tests the subscription and helper functions — the new file should focus specifically on the transaction behavior
- **Code Review Quick Fix (2026-02-10):** Added `data.trusted` guard to `declineTrust` to prevent contradictory state (`trusted: true, declined: true`)
- **Removed unused `updateDoc` import** — all 3 functions now use `transaction.update()` exclusively
- **Deferred:** `deleteTrustedMerchant` transaction wrapping — tracked in [15-TD-15](./15-TD-15-standalone-mutation-safety.md)

## Senior Developer Review (ECC)

- **Review date:** 2026-02-10
- **Classification:** STANDARD
- **ECC agents used:** code-reviewer, security-reviewer
- **Overall score:** 8.5/10
- **Outcome:** APPROVED — 5 quick fixes applied, 0 TD stories created
- **Quick fixes applied:**
  1. Added `sanitizeMerchantName()` to `trustMerchant`, `declineTrust`, `revokeTrust` (mandatory MUST CHECK rule)
  2. Added `sanitizeMerchantName()` to pre-existing `isMerchantTrusted`, `getMerchantTrustRecord` (consistency)
  3. Extracted `createMockMerchantData()` test factory to reduce duplication
  4. Consolidated 3 duplicate `beforeEach` blocks into single top-level setup
  5. Added `id` field to mock document snapshots for realism
