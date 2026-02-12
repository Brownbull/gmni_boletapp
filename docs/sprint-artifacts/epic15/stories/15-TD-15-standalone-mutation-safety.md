# Story 15-TD-15: Standalone Mutation Transaction Safety

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Description

Four mutation functions across 3 service files still use standalone `deleteDoc()` or `updateDoc()` without `runTransaction()` protection. While Firestore security rules enforce user isolation, these functions lack pre-condition verification (document exists, state is valid) and are vulnerable to concurrent call races.

## Source

- **TD-11 Code Review (2026-02-10):** `deleteTrustedMerchant` deferred as out of scope — both code-reviewer and security-reviewer flagged it as follow-up
- **Codebase audit (2026-02-10):** Full TOCTOU scan discovered 3 additional standalone mutation functions not covered by any existing TD story

## Acceptance Criteria

- [x] **AC1:** `deleteTrustedMerchant()` wrapped in `runTransaction()` — verify doc exists before deleting
- [x] **AC2:** `deleteTransaction()` wrapped in `runTransaction()` — verify doc exists before deleting
- [x] **AC3:** `updateTransaction()` wrapped in `runTransaction()` — read fresh data, apply update atomically with version increment
- [x] **AC4:** `deleteMapping()` wrapped in `runTransaction()` — verify doc exists before deleting (shared by 4 mapping services)
- [x] **AC5:** Unit tests for each wrapped function (existence check + normal flow)
- [x] **AC6:** All existing tests pass

## Tasks

- [x] **Task 1:** Wrap `deleteTrustedMerchant()` in `runTransaction()`
  - [x] Verify doc exists via `transaction.get()` before `transaction.delete()`
  - [x] Throw if doc not found (matches trustMerchant/declineTrust/revokeTrust pattern)
- [x] **Task 2:** Wrap `deleteTransaction()` in `runTransaction()`
  - [x] Verify doc exists via `transaction.get()` before `transaction.delete()`
  - [x] Throw if doc already deleted (matches codebase TOCTOU pattern)
- [x] **Task 3:** Wrap `updateTransaction()` in `runTransaction()`
  - [x] Move `updateDoc` with version increment into `transaction.update()`
  - [x] Read fresh version via `transaction.get()` first to detect stale updates
- [x] **Task 4:** Wrap `deleteMapping()` in `runTransaction()`
  - [x] Verify doc exists before deleting
  - [x] This is a base function used by 4 mapping services — single fix covers all
- [x] **Task 5:** Add unit tests for all 4 wrapped functions
  - [x] Test normal flow with transaction mocks (19 tests: 4+4+6+5)
  - [x] Test doc-not-found handling
  - [x] Test version increment (updateTransaction legacy docs without version)

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
- **Added from 15-TD-6 code review (2026-02-11):** `insightProfileService.ts` has 4 read-then-write functions without `runTransaction()`: `recordInsightShown`, `deleteInsight`, `deleteInsights`, `recordIntentionalResponse` + `getOrCreateInsightProfile` has a non-transactional create-if-not-exists race. LOW impact (per-user insight history, no financial data) but inconsistent with codebase TOCTOU policy.

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-20](./15-TD-20-insight-profile-toctou.md) | insightProfileService 5 TOCTOU functions → runTransaction | LOW | CREATED |
| [15-TD-19](./15-TD-19-sanitizer-defense-depth.md) | updateTransaction unsanitized Partial<Transaction> | MEDIUM | ALREADY_TRACKED |

### Senior Developer Review (ECC)

- **Review date:** 2026-02-12
- **ECC agents used:** code-reviewer, security-reviewer, architect, tdd-guide (COMPLEX classification)
- **Outcome:** APPROVE — 5 quick fixes applied, 1 TD story created
- **Quick fixes applied:** JSDoc comment wording, error message consistency (3 functions), leakage assertions in test, computePeriods integration test
- **Deferred:** insightProfileService TOCTOU (TD-20), DRY transactional delete helper (below threshold)
