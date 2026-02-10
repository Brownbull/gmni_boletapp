# Story 15-TD-9: DAL Polish

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** LOW
**Status:** ready-for-dev

## Description

Polish the Data Access Layer created in Phase 6 by improving the `save()` method signature to prevent type cast workarounds and begin migrating the first batch of consumers to use repository hooks.

## Source Tech Debt Items

- **TD-7:** `save()` signature needs `Omit<T, 'id'|'createdAt'|'updatedAt'>` to eliminate `as unknown as T` casts
- **TD-9:** 7 of 8 repository interfaces + all 11 repository hooks unconsumed — migrate consumers as features adopt DAL
- **CR-2 (TD-1/2/3 code review):** `saveMapping()` query-outside-transaction allows duplicate-create race — use deterministic document IDs

## Acceptance Criteria

- [ ] **AC1:** Repository `save()` methods accept `Omit<T, 'id' | 'createdAt' | 'updatedAt'>` instead of full `T`
- [ ] **AC2:** All `as unknown as T` casts in repository implementations removed
- [ ] **AC3:** At least 2 consumer hooks migrated from direct service imports to repository hooks
- [ ] **AC4:** Repository interfaces updated to reflect new save signature
- [ ] **AC5:** `saveMapping()` uses deterministic document IDs (hash of primary key fields) to prevent duplicate-create race condition
- [ ] **AC6:** All tests pass

## Tasks

- [ ] **Task 1:** Fix `save()` signature in repository interfaces
  - [ ] Update `Repository<T>` interface `save` method to accept `Omit<T, 'id' | 'createdAt' | 'updatedAt'>`
  - [ ] Update all 8 repository factory implementations
  - [ ] Remove `as unknown as T` casts
- [ ] **Task 2:** Migrate 2 consumer hooks to repository pattern
  - [ ] Choose 2 high-usage hooks (e.g., `useTransactions`, `useUserPreferences`)
  - [ ] Replace direct service function imports with repository hook usage
  - [ ] Verify behavior is identical

- [ ] **Task 3:** Fix saveMapping duplicate-create race
  - [ ] Generate deterministic document IDs from primary key fields (e.g., `hashKey(normalizedMerchant)` or `hashKey(normalizedMerchant, normalizedItemName)`)
  - [ ] Replace `doc(collRef)` (auto-ID) with `doc(collRef, deterministicId)` in the create path
  - [ ] This eliminates the race where two concurrent creates both see empty query results

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/repositories/types.ts` | MODIFY | Update Repository<T> save signature |
| `src/repositories/*.ts` | MODIFY | Remove `as unknown as T` casts |
| 2 consumer hook files | MODIFY | Migrate to repository hooks |
| `src/services/mappingServiceBase.ts` | MODIFY | Use deterministic doc IDs in create path |

## Dev Notes

- The `Omit<T, 'id' | 'createdAt' | 'updatedAt'>` pattern ensures callers don't need to provide server-generated fields
- Start consumer migration with the simplest hooks first to establish the pattern
- Phase 6 created 8 repositories but only 4 mapping hooks were migrated as consumers — remaining 7 repositories + 11 hooks are available for adoption
- Don't migrate all consumers at once — this story targets 2 as a proof-of-concept for the improved signature
- **TD-13 code review (2026-02-10):** `saveUserCredits()` (non-transactional setDoc) is still exported from `userCreditsService.ts` and wrapped as `save()` in `creditsRepository.ts`. When this story replaces `creditsRepository.save()` with transactional methods, also deprecate/remove the `saveUserCredits` export from the service layer to close the bypass vector.
- **Deterministic doc IDs:** Use a hash of the primary key field(s) as the document ID. E.g., for merchant mappings: `doc(collRef, hashKey(normalizedMerchant))`. This makes concurrent creates idempotent — both writers target the same doc, so Firestore's last-write-wins semantics apply instead of creating duplicates. A simple approach: `btoa(primaryKeyValue).replace(/[^a-zA-Z0-9]/g, '')` or use a proper hash function.
