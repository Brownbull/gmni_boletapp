# Tech Debt Story TD-17-1: Add Normalizer and Chart Aggregation Unit Tests

## Status: ready-for-dev

> **Source:** KDBP Code Review (2026-03-09) on story 17-2
> **Priority:** HIGH | **Estimated Effort:** 2 points (SMALL)

## Story
As a **developer**, I want **comprehensive unit tests for categoryNormalizer.ts and chartDataHelpers.ts group-mode aggregation**, so that **legacy mapping regressions are caught before they silently corrupt analytics for users with historical data**.

## Acceptance Criteria
- **AC-1:** Given all 60 LEGACY_ITEM_CATEGORY_MAP entries, when tested with parameterized `it.each`, then every mapping produces the correct V4 output
- **AC-2:** Given all 50 LEGACY_STORE_CATEGORY_MAP entries, when tested with parameterized `it.each`, then every mapping produces the correct V4 output
- **AC-3:** Given `normalizeItemGroupToEnglish`, when called with Spanish, already-English, unknown, and empty inputs, then correct results are returned
- **AC-4:** Given `isLegacyCategory`, when called with item and store types, then correct boolean is returned (including prototype-safe behavior)
- **AC-5:** Given `getLegacyMappings`, when called, then returns defensive copies (not references to internal maps)
- **AC-6:** Given `chartDataHelpers.ts` in `store-groups` and `item-groups` modes, when "otros"/"otros-item" aggregation occurs, then the otherKey correctly identifies and merges the other group

## Tasks / Subtasks
- [ ] 1.1: Create `tests/unit/utils/categoryNormalizer.test.ts` with parameterized tests for all item mappings
- [ ] 1.2: Add parameterized tests for all store mappings
- [ ] 1.3: Add edge case tests (empty, null-ish, already-V4 pass-through, prototype keys)
- [ ] 1.4: Add `normalizeItemGroupToEnglish` reverse-lookup tests
- [ ] 1.5: Add `isLegacyCategory` and `getLegacyMappings` tests
- [ ] 2.1: Add `chartDataHelpers.test.ts` cases for store-groups and item-groups otherKey aggregation
- [ ] 3.1: Run `npm run test:quick` — zero failures

## Dev Notes
- Source story: [17-2](./17-2-update-constants-types.md)
- Review findings: #2 (normalizer tests), #7 (otherKey tests)
- Files affected: `tests/unit/utils/categoryNormalizer.test.ts` (NEW), `tests/unit/features/dashboard/views/DashboardView/chartDataHelpers.test.ts` (MODIFIED)
- All 5 consumer test files mock the normalizer with `vi.fn((cat) => cat)` — these are not substitutes for direct normalizer tests
