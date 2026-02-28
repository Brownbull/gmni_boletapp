# Tech Debt Story TD-15b-26: Transaction Hook Test Coverage

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-28) on story 15b-3a
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **DAL-layer test coverage for transaction subscription hooks**, so that **the repository migration is fully verified and mocks align with the abstraction boundary**.

## Acceptance Criteria

- [ ] **AC1:** `useTransactionHandlers.test.ts` mock strategy upgraded — mock `@/repositories/transactionRepository` returning a fake `ITransactionRepository` object instead of mocking the underlying `services/firestore` module. Assertions use repo method calls (e.g., `mockRepo.add`) not service-level calls.
- [ ] **AC2:** New test file `tests/unit/hooks/useTransactions.test.ts` — covers subscribe callback, error handling, empty state, and cleanup (unsubscribe).
- [ ] **AC3:** New test file `tests/unit/hooks/useRecentScans.test.ts` — covers subscribeRecentScans callback, error handling, empty state, and cleanup.
- [ ] **AC4:** All existing tests in `useTransactionHandlers.test.ts` still pass after mock migration (no behavior regression).
- [ ] **AC5:** `npm run test:quick` passes.

## Tasks / Subtasks

### Task 1: Upgrade useTransactionHandlers.test.ts mock layer
- [ ] Replace `vi.mock('services/firestore')` with `vi.mock('@/repositories/transactionRepository')` returning mock factory
- [ ] Update all `firestoreService.*` assertions to use mock repo methods
- [ ] Verify all 37 existing tests pass

### Task 2: Create useTransactions.test.ts
- [ ] Mock `createTransactionRepository` to return fake repo with `subscribe` method
- [ ] Test: returns empty array when user/services null
- [ ] Test: calls repo.subscribe on mount, returns transactions via callback
- [ ] Test: calls unsubscribe on unmount
- [ ] Test: handles subscription errors gracefully

### Task 3: Create useRecentScans.test.ts
- [ ] Same structure as Task 2 but for `subscribeRecentScans`
- [ ] Test: returns empty array when user/services null
- [ ] Test: calls repo.subscribeRecentScans on mount
- [ ] Test: calls unsubscribe on unmount

## Dev Notes
- Source story: [15b-3a](./15b-3a-dal-transaction-hooks.md)
- Review findings: #3 (TDD mock layer), #9 (missing subscription tests)
- Files affected: `tests/unit/hooks/app/useTransactionHandlers.test.ts`, `tests/unit/hooks/useTransactions.test.ts` (new), `tests/unit/hooks/useRecentScans.test.ts` (new)
