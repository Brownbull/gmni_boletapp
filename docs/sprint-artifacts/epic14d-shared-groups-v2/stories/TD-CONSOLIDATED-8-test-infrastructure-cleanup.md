# TD-CONSOLIDATED-8: Test Infrastructure Cleanup

Status: ready-for-dev

> **Tier:** 3 - Test Quality (DO WHEN TOUCHING)
> **Consolidated from:** TD-14d-8, TD-14d-31, TD-14d-34, TD-14d-35, TD-14d-37, TD-14d-49
> **Priority:** LOW (fix inline when working on related code)
> **Estimated Effort:** 4-6 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **test infrastructure cleaned up with DRY helpers, proper type safety, and consistent naming**,
So that **tests are maintainable and follow consistent patterns**.

## Problem Statement

Multiple test quality issues accumulated across the shared-groups feature:
1. Integration test DRY violations (repeated setup/teardown)
2. `as any` type casts in test factories instead of proper typing
3. Shared test factory functions duplicated across files
4. Inconsistent override prop naming (`_testOverrides` vs `__testData`)
5. Test quality issues in sharingCooldown tests (magic numbers, missing JSDoc)
6. Missing error translation mock helper

## Acceptance Criteria

- [ ] DRY integration test helpers extracted
- [ ] Replace `as any` with proper TypeScript types in test factories
- [ ] Standardize test override prop naming convention
- [ ] Extract `createMockTimestamp` to `tests/helpers/firestore.ts`
- [ ] Remove magic numbers in cooldown tests, add constants
- [ ] All tests pass after cleanup

## Cross-References

- **Original stories:**
  - [TD-14d-8](TD-ARCHIVED/TD-14d-8-integration-test-dry-refactor.md) - Integration test DRY refactor
  - [TD-14d-31](TD-ARCHIVED/TD-14d-31-test-factory-type-safety.md) - Test factory type safety
  - [TD-14d-34](TD-ARCHIVED/TD-14d-34-shared-test-factory.md) - Shared test factory
  - [TD-14d-35](TD-ARCHIVED/TD-14d-35-test-override-naming.md) - Test override naming
  - [TD-14d-37](TD-ARCHIVED/TD-14d-37-sharingcooldown-test-quality.md) - SharingCooldown test quality
  - [TD-14d-49](TD-ARCHIVED/TD-14d-49-missing-error-translation.md) - Missing error translation
- **Sources:** Multiple ECC Reviews (2026-02-03 through 2026-02-05)
- **ECC Review 14d-v2-1-14 (2026-02-05):** Added 2 items:
  - GruposView.test.tsx at 2679 lines exceeds 300-line test file guideline (split into describe-level files)
  - E2E toast assertions wrapped in try/catch are effectively optional - add retry/waitFor patterns
- **ECC Review 14d-v2-1-13+14 (2026-02-07):** Added 2 items:
  - `expect.anything()` used for docRef params in 13+ assertions across userPreferencesService.test.ts — replace with `mockDoc()` return value or `expect.objectContaining` for stronger verification
  - userPreferencesService.test.ts at 840+ lines — split into domain-specific test files (preference-crud, sharing-toggle, cooldown-logic)
