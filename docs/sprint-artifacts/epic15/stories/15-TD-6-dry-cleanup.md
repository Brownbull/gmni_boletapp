# Story 15-TD-6: DRY Cleanup

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** ready-for-dev

## Description

Eliminate remaining type duplications and normalize function duplicates identified during Epic 15 code reviews. Consolidate CircularProgress components, unify type definitions, and compose normalizer functions on the shared `normalizeForMapping` base.

## Source Tech Debt Items

- **TD-1:** CircularProgress duplication (TrendsView vs DashboardView versions differ in bgRingColor formula)
- **TD-5:** `DashboardView/types.ts` has local Transaction interface — consider using canonical type
- **TD-8:** `InsightContent`/`FullInsightContent` type duplication (`insightProfileRepository` vs `insightProfileService`)
- **TD-25:** `normalizeMerchantNameForTrust` + `normalizeItemName` (in `itemDuplicateDetectionService`) duplicates — compose on `normalizeForMapping`

## Acceptance Criteria

- [ ] **AC1:** Single `CircularProgress` component in `src/shared/components/` used by both TrendsView and DashboardView (parameterized bgRingColor)
- [ ] **AC2:** `DashboardView/types.ts` uses canonical `Transaction` type from `@entities/transaction/types` instead of local definition
- [ ] **AC3:** `InsightContent`/`FullInsightContent` defined in one place and re-exported by both repository and service
- [ ] **AC4:** `normalizeMerchantNameForTrust` composes on `normalizeForMapping` (adding NFD diacritics step)
- [ ] **AC5:** `normalizeItemName` in `itemDuplicateDetectionService.ts` renamed to `normalizeForDuplicateDetection` for semantic clarity
- [ ] **AC6:** All tests pass after changes; test mocks updated for renamed functions

## Tasks

- [ ] **Task 1:** Unify CircularProgress
  - [ ] Create `src/shared/components/CircularProgress.tsx` with parameterized `bgRingColor`
  - [ ] Replace TrendsView and DashboardView versions with shared component
- [ ] **Task 2:** Fix DashboardView/types.ts
  - [ ] Replace local `Transaction` interface with import from `@entities/transaction/types`
  - [ ] Verify all usages in DashboardView code still type-check
- [ ] **Task 3:** Consolidate InsightContent types
  - [ ] Move canonical definitions to `src/types/` or `src/features/insights/types.ts`
  - [ ] Re-export from repository and service modules
- [ ] **Task 4:** Compose normalizer functions
  - [ ] `normalizeMerchantNameForTrust` → call `normalizeForMapping()` after NFD diacritics removal
  - [ ] Rename `normalizeItemName` in `itemDuplicateDetectionService.ts` → `normalizeForDuplicateDetection`
  - [ ] Update tests and consumers (3 test files reference the function by name)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/shared/components/CircularProgress.tsx` | CREATE | Unified CircularProgress with parameterized bgRingColor |
| `src/views/DashboardView/types.ts` | MODIFY | Use canonical Transaction type |
| `src/types/insight.ts` or equivalent | MODIFY | Canonical InsightContent types |
| `src/services/merchantTrustService.ts` | MODIFY | Compose on normalizeForMapping |
| `src/services/itemDuplicateDetectionService.ts` | MODIFY | Rename normalizeItemName |
| `tests/unit/services/itemDuplicateDetectionService.test.ts` | MODIFY | Update function name references |

## Dev Notes

- CircularProgress bgRingColor difference: TrendsView uses `rgba(theme, 0.15)`, DashboardView uses `rgba(theme, 0.1)`. Parameterize as `bgRingOpacity` prop.
- `normalizeForDuplicateDetection` differs from `normalizeForMapping`: it removes punctuation specifically (`[.,;:!?()[\]{}]`) and replaces hyphens with spaces, while `normalizeForMapping` removes all non-alphanumeric. The rename makes this semantic difference explicit.
- `normalizeItemName` is re-exported as alias from 3 mapping services (`categoryMappingService`, `subcategoryMappingService`, `itemNameMappingService`) — those are aliases for `normalizeForMapping` and are NOT affected by this rename
