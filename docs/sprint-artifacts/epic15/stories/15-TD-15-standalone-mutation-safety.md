# Story 15-TD-15: Standalone Mutation Transaction Safety

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** ready-for-dev

## Description

Four mutation functions across 3 service files still use standalone `deleteDoc()` or `updateDoc()` without `runTransaction()` protection. While Firestore security rules enforce user isolation, these functions lack pre-condition verification (document exists, state is valid) and are vulnerable to concurrent call races.

## Source

- **TD-11 Code Review (2026-02-10):** `deleteTrustedMerchant` deferred as out of scope — both code-reviewer and security-reviewer flagged it as follow-up
- **Codebase audit (2026-02-10):** Full TOCTOU scan discovered 3 additional standalone mutation functions not covered by any existing TD story

## Acceptance Criteria

- [ ] **AC1:** `deleteTrustedMerchant()` wrapped in `runTransaction()` — verify doc exists before deleting
- [ ] **AC2:** `deleteTransaction()` wrapped in `runTransaction()` — verify doc exists before deleting
- [ ] **AC3:** `updateTransaction()` wrapped in `runTransaction()` — read fresh data, apply update atomically with version increment
- [ ] **AC4:** `deleteMapping()` wrapped in `runTransaction()` — verify doc exists before deleting (shared by 4 mapping services)
- [ ] **AC5:** Unit tests for each wrapped function (existence check + normal flow)
- [ ] **AC6:** All existing tests pass

## Tasks

- [ ] **Task 1:** Wrap `deleteTrustedMerchant()` in `runTransaction()`
  - [ ] Verify doc exists via `transaction.get()` before `transaction.delete()`
  - [ ] Throw if doc not found (matches trustMerchant/declineTrust/revokeTrust pattern)
- [ ] **Task 2:** Wrap `deleteTransaction()` in `runTransaction()`
  - [ ] Verify doc exists via `transaction.get()` before `transaction.delete()`
  - [ ] Log or throw if doc already deleted (idempotent handling)
- [ ] **Task 3:** Wrap `updateTransaction()` in `runTransaction()`
  - [ ] Move `updateDoc` with version increment into `transaction.update()`
  - [ ] Read fresh version via `transaction.get()` first to detect stale updates
- [ ] **Task 4:** Wrap `deleteMapping()` in `runTransaction()`
  - [ ] Verify doc exists before deleting
  - [ ] This is a base function used by 4 mapping services — single fix covers all
- [ ] **Task 5:** Add unit tests for all 4 wrapped functions
  - [ ] Test normal flow with transaction mocks
  - [ ] Test doc-not-found handling
  - [ ] Test idempotency (double-delete)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/services/merchantTrustService.ts` | MODIFY | Wrap deleteTrustedMerchant in runTransaction |
| `src/services/firestore.ts` | MODIFY | Wrap deleteTransaction + updateTransaction in runTransaction |
| `src/services/mappingServiceBase.ts` | MODIFY | Wrap deleteMapping in runTransaction |
| `tests/unit/services/merchantTrustService.trust.test.ts` | MODIFY | Add deleteTrustedMerchant tests |
| `tests/unit/services/firestore.mutations.test.ts` | CREATE | Transaction tests for delete/update |
| `tests/unit/services/mappingServiceBase.delete.test.ts` | CREATE | Transaction tests for deleteMapping |

## Dev Notes

- Follow the same `runTransaction` pattern established in TD-1 and TD-11
- `deleteMapping()` is called by `deleteCategoryMapping`, `deleteMerchantMapping`, `deletePaymentMethodMapping`, `deleteDescriptionMapping` — wrapping the base function covers all 4
- `updateTransaction()` already uses `increment(1)` for version — the transaction should read the current version first for true optimistic locking
- `deleteTransaction()` and `deleteTrustedMerchant()` are user-initiated, low-frequency operations — risk is LOW but consistency with the codebase pattern is the primary motivation
- Source: TD-11 code review deferred item + full TOCTOU codebase audit (2026-02-10)
