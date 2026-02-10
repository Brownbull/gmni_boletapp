# Story 15-TD-11: Trust Service Transaction Completeness

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** ready-for-dev

## Description

TD-1 wrapped `recordScan()` in `runTransaction()`, but three other trust mutation functions — `trustMerchant()`, `declineTrust()`, `revokeTrust()` — still perform read-then-write as separate operations without transaction protection. These are lower-frequency operations but still violate the project's TOCTOU prevention rule.

## Source

- **Code Review Finding #8 (HIGH):** `trustMerchant`, `declineTrust`, and `revokeTrust` in `merchantTrustService.ts` perform `getDoc()` → conditional `updateDoc()` without `runTransaction()`. Concurrent calls can corrupt trust status (e.g., two users both "trusting" a merchant could overwrite each other's trustCount increment).

## Acceptance Criteria

- [ ] **AC1:** `trustMerchant()` wrapped in `runTransaction()` — read trust record, verify state, update atomically
- [ ] **AC2:** `declineTrust()` wrapped in `runTransaction()` — read trust record, verify state, update atomically
- [ ] **AC3:** `revokeTrust()` wrapped in `runTransaction()` — read trust record, verify state, update atomically
- [ ] **AC4:** Transaction reads fresh data and validates pre-conditions (e.g., can't trust an already-trusted merchant)
- [ ] **AC5:** Unit tests with `mockTransaction.get/set/update` pattern (matching TD-1 test style)
- [ ] **AC6:** All existing tests pass

## Tasks

- [ ] **Task 1:** Wrap `trustMerchant()` in `runTransaction()`
  - [ ] Move `getDoc` into `transaction.get()`, `updateDoc`/`setDoc` into `transaction.update()`/`transaction.set()`
  - [ ] Add pre-condition check: if already trusted, skip or throw
- [ ] **Task 2:** Wrap `declineTrust()` in `runTransaction()`
  - [ ] Same pattern: read inside transaction, validate, then write
- [ ] **Task 3:** Wrap `revokeTrust()` in `runTransaction()`
  - [ ] Same pattern: read inside transaction, validate, then write
- [ ] **Task 4:** Add unit tests (3 functions x 2-3 tests each)
  - [ ] Test normal flow with transaction mocks
  - [ ] Test concurrent-safety (fresh read, not stale)
  - [ ] Test pre-condition validation (e.g., revoking already-declined)

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
