# Tech Debt Story TD-15b-27: DAL Migration Code Quality Cleanup

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-28) on story 15b-3a
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **consistent DAL patterns across transaction hooks**, so that **subscription safety, code DRY-ness, and repo lifecycle are uniform**.

## Acceptance Criteria

- [ ] **AC1:** Subscription callbacks in `useTransactions.ts` and `useRecentScans.ts` guard against stale/null repo references — callbacks check repo validity before processing data.
- [ ] **AC2:** `sanitizeTransactions` utility is deduplicated — single shared implementation imported by both `useTransactions.ts` and `useRecentScans.ts` (currently duplicated inline).
- [ ] **AC3:** Transient repo creation in scan handlers (`useScanHandlers.ts`, `useScanFlowRouter.ts`) follows a consistent pattern — either all use factory-from-context or all use a memoized hook. Document chosen pattern in a code comment.
- [ ] **AC4:** No new non-null assertions (`!`) on `txRepo` in any migrated file.
- [ ] **AC5:** `npm run test:quick` passes.

## Tasks / Subtasks

### Task 1: Add subscription callback guards
- [ ] `useTransactions.ts`: wrap subscription callback to verify repo ref is current
- [ ] `useRecentScans.ts`: same pattern
- [ ] Verify existing subscription behavior unchanged

### Task 2: Deduplicate sanitizeTransactions
- [ ] Extract shared `sanitizeTransactions` to `src/repositories/utils.ts` or `src/utils/transactionSanitize.ts`
- [ ] Update imports in `useTransactions.ts` and `useRecentScans.ts`
- [ ] Verify existing tests pass (behavior-preserving)

### Task 3: Standardize transient repo pattern
- [ ] Review `useScanHandlers.ts` and `useScanFlowRouter.ts` for repo creation consistency
- [ ] Add code comment documenting the factory-from-context pattern choice (transient is correct for these — they operate within a single async flow, not across renders)
- [ ] No code change needed if pattern is intentional — document and move on

## Dev Notes
- Source story: [15b-3a](./15b-3a-dal-transaction-hooks.md)
- Review findings: #5 (subscription guards), #7 (sanitizeTransactions duplication), #8 (transient repo inconsistency)
- Files affected: `src/hooks/useTransactions.ts`, `src/hooks/useRecentScans.ts`, `src/features/scan/hooks/useScanHandlers.ts`, `src/features/scan/hooks/useScanFlowRouter.ts`
- Batch delete ownership (finding #6) is NOT tracked here — Firestore security rules at path level (`/users/{userId}/...`) enforce ownership by design.
