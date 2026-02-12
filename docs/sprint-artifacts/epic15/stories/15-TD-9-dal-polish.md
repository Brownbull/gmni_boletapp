# Story 15-TD-9: DAL Polish

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** LOW
**Status:** review

## Description

Polish the Data Access Layer created in Phase 6 by improving the `save()` method signature to prevent type cast workarounds and begin migrating the first batch of consumers to use repository hooks.

## Source Tech Debt Items

- **TD-7:** `save()` signature needs `Omit<T, 'id'|'createdAt'|'updatedAt'>` to eliminate `as unknown as T` casts
- **TD-9:** 7 of 8 repository interfaces + all 11 repository hooks unconsumed — migrate consumers as features adopt DAL
- **CR-2 (TD-1/2/3 code review):** `saveMapping()` query-outside-transaction allows duplicate-create race — use deterministic document IDs

## Acceptance Criteria

- [x] **AC1:** Repository `save()` methods accept `Omit<T, 'id' | 'createdAt' | 'updatedAt'>` instead of full `T`
- [x] **AC2:** All `as unknown as T` casts in repository implementations removed
- [x] **AC3:** At least 2 consumer hooks migrated from direct service imports to repository hooks
- [x] **AC4:** Repository interfaces updated to reflect new save signature
- [x] **AC5:** `saveMapping()` uses deterministic document IDs (hash of primary key fields) to prevent duplicate-create race condition
- [x] **AC6:** All tests pass

## Tasks

- [x] **Task 1:** Fix `save()` signature in repository interfaces
  - [x] Update `IMappingRepository<T>` interface `save` method to accept `Omit<T, ServerGeneratedFields>`
  - [x] Remove `as unknown as T` casts from 4 consumer hooks
  - [x] Deprecate `creditsRepository.save()` and `saveUserCredits()` with `@deprecated` JSDoc
- [x] **Task 2:** Migrate 2 consumer hooks to repository pattern
  - [x] `useUserPreferences` → `usePreferencesRepository()` (get + save)
  - [x] `useTrustedMerchants` → `useTrustRepository()` (8 service methods → repository)
  - [x] Tests rewired from service mocks to repository mocks (13 tests pass)

- [x] **Task 3:** Fix saveMapping duplicate-create race
  - [x] `generateDeterministicId()` using `btoa(primaryKey).replace(/[^a-zA-Z0-9]/g, '')` with `::` compound separator
  - [x] Create path uses `doc(collRef, deterministicId)` + `transaction.get()` to detect concurrent create
  - [x] 8 deterministic ID tests + 6 saveMapping transaction tests pass

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/repositories/mappingRepository.ts` | MODIFY | `ServerGeneratedFields` type + `save()` Omit signature |
| `src/repositories/creditsRepository.ts` | MODIFY | `@deprecated` JSDoc on `save()` |
| `src/services/userCreditsService.ts` | MODIFY | `@deprecated` JSDoc on `saveUserCredits()` |
| `src/hooks/useMerchantMappings.ts` | MODIFY | Remove `as unknown as` cast |
| `src/hooks/useCategoryMappings.ts` | MODIFY | Remove `as unknown as` cast |
| `src/hooks/useItemNameMappings.ts` | MODIFY | Remove `as unknown as` cast |
| `src/hooks/useSubcategoryMappings.ts` | MODIFY | Remove `as unknown as` cast |
| `src/hooks/useUserPreferences.ts` | MODIFY | Migrate to `usePreferencesRepository()` |
| `src/hooks/useTrustedMerchants.ts` | MODIFY | Migrate to `useTrustRepository()` |
| `src/services/mappingServiceBase.ts` | MODIFY | `generateDeterministicId()` + deterministic create path |
| `tests/unit/hooks/useTrustedMerchants.test.ts` | MODIFY | Rewire to repository mocks |
| `tests/unit/services/mappingServiceBase.saveMapping.test.ts` | MODIFY | Deterministic ID + concurrent create tests |
| `tests/unit/services/mappingServiceBase.deterministicId.test.ts` | CREATE | 8 tests for ID generation |

## Dev Notes

- The `Omit<T, 'id' | 'createdAt' | 'updatedAt'>` pattern ensures callers don't need to provide server-generated fields
- Start consumer migration with the simplest hooks first to establish the pattern
- Phase 6 created 8 repositories but only 4 mapping hooks were migrated as consumers — remaining 7 repositories + 11 hooks are available for adoption
- Don't migrate all consumers at once — this story targets 2 as a proof-of-concept for the improved signature
- **TD-13 code review (2026-02-10):** `saveUserCredits()` (non-transactional setDoc) is still exported from `userCreditsService.ts` and wrapped as `save()` in `creditsRepository.ts`. When this story replaces `creditsRepository.save()` with transactional methods, also deprecate/remove the `saveUserCredits` export from the service layer to close the bypass vector.
- **Deterministic doc IDs:** Use a hash of the primary key field(s) as the document ID. E.g., for merchant mappings: `doc(collRef, hashKey(normalizedMerchant))`. This makes concurrent creates idempotent — both writers target the same doc, so Firestore's last-write-wins semantics apply instead of creating duplicates. A simple approach: `btoa(primaryKeyValue).replace(/[^a-zA-Z0-9]/g, '')` or use a proper hash function.
