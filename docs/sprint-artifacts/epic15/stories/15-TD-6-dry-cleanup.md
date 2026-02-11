# Story 15-TD-6: DRY Cleanup

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** done

## Description

Eliminate remaining type duplications and normalize function duplicates identified during Epic 15 code reviews. Consolidate CircularProgress components, unify type definitions, and compose normalizer functions on the shared `normalizeForMapping` base.

## Source Tech Debt Items

- **TD-1:** CircularProgress duplication (TrendsView vs DashboardView versions differ in bgRingColor formula)
- **TD-5:** `DashboardView/types.ts` has local Transaction interface — consider using canonical type
- **TD-8:** `InsightContent`/`FullInsightContent` type duplication (`insightProfileRepository` vs `insightProfileService`)
- **TD-25:** `normalizeMerchantNameForTrust` + `normalizeItemName` (in `itemDuplicateDetectionService`) duplicates — compose on `normalizeForMapping`

## Acceptance Criteria

- [x] **AC1:** Single `CircularProgress` component in `src/shared/components/` used by both TrendsView and DashboardView (parameterized bgRingColor)
- [x] **AC2:** `DashboardView/types.ts` uses canonical `Transaction` type from `@/types/transaction` instead of local definition
- [x] **AC3:** `InsightContent`/`FullInsightContent` defined in one place and re-exported by both repository and service
- [x] **AC4:** `normalizeMerchantNameForTrust` composes on `normalizeForMapping` (adding NFD diacritics step)
- [x] **AC5:** `normalizeItemName` in `itemDuplicateDetectionService.ts` renamed to `normalizeForDuplicateDetection` for semantic clarity
- [x] **AC6:** All tests pass after changes; test mocks updated for renamed functions

## Tasks

- [x] **Task 1:** Unify CircularProgress
  - [x] Create `src/shared/components/CircularProgress.tsx` with parameterized `bgRingOpacity`
  - [x] Replace TrendsView and DashboardView versions with shared component
- [x] **Task 2:** Fix DashboardView/types.ts
  - [x] Replace local `Transaction` interface with import from `@/types/transaction`
  - [x] Verify all usages in DashboardView code still type-check
- [x] **Task 3:** Consolidate InsightContent types
  - [x] Move canonical definitions to `src/types/insight.ts`
  - [x] Re-export from repository and service modules
- [x] **Task 4:** Compose normalizer functions
  - [x] `normalizeMerchantNameForTrust` → call `normalizeForMapping()` after NFD diacritics removal
  - [x] Rename `normalizeItemName` in `itemDuplicateDetectionService.ts` → `normalizeForDuplicateDetection`
  - [x] Update tests and consumers (1 test file references the function by name)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/shared/components/CircularProgress.tsx` | CREATE | Unified CircularProgress with parameterized bgRingOpacity |
| `src/shared/components/index.ts` | MODIFY | Barrel export for CircularProgress |
| `src/views/TrendsView/animationComponents.tsx` | MODIFY | Re-export from shared instead of local definition |
| `src/views/DashboardView/AnimatedTreemapCard.tsx` | MODIFY | Import from shared, remove local definition |
| `src/views/DashboardView/types.ts` | MODIFY | Use canonical Transaction type via re-export |
| `src/views/DashboardView/DashboardView.tsx` | MODIFY | Remove TransactionType alias, add id guards |
| `src/types/insight.ts` | MODIFY | Canonical InsightContent + FullInsightContent types |
| `src/repositories/insightProfileRepository.ts` | MODIFY | Import InsightContent from canonical |
| `src/features/insights/hooks/useInsightProfile.ts` | MODIFY | Import FullInsightContent from canonical |
| `src/features/insights/services/insightProfileService.ts` | MODIFY | Import InsightContent from canonical |
| `src/services/merchantTrustService.ts` | MODIFY | Compose on normalizeForMapping |
| `src/services/itemDuplicateDetectionService.ts` | MODIFY | Rename normalizeItemName |
| `tests/unit/services/itemDuplicateDetectionService.test.ts` | MODIFY | Update function name references |

## Dev Notes

- CircularProgress bgRingColor difference: TrendsView uses `rgba(theme, 0.15)`, DashboardView uses `rgba(theme, 0.1)`. Parameterize as `bgRingOpacity` prop (default 0.3).
- `normalizeForDuplicateDetection` differs from `normalizeForMapping`: it removes punctuation specifically (`[.,;:!?()[\]{}]`) and replaces hyphens with spaces, while `normalizeForMapping` removes all non-alphanumeric. The rename makes this semantic difference explicit.
- `normalizeItemName` is re-exported as alias from 3 mapping services (`categoryMappingService`, `subcategoryMappingService`, `itemNameMappingService`) — those are aliases for `normalizeForMapping` and are NOT affected by this rename
- Code review: replaced 7 non-null assertions on `transaction.id!` with proper guard patterns (null check + type narrowing)
- Code review: completed InsightContent consolidation in `insightProfileService.ts` (was using inline type)

## Senior Developer Review (ECC)

- **Date:** 2026-02-11
- **Classification:** STANDARD (13 files, 4 tasks)
- **ECC Agents:** code-reviewer, security-reviewer
- **Outcome:** APPROVE with quick fixes
- **Score:** 8.5/10

### Quick Fixes Applied (4)
1. Removed redundant `tx as Transaction` cast in DashboardView.tsx:1590
2. Wrapped `handleExpand`/`handleCollapse` in `useCallback` in useDonutDrillDown.ts
3. Removed duplicate "Constants" section header in insight.ts
4. Fixed blank line artifact in DonutChart.test.tsx

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-15](./15-TD-15-standalone-mutation-safety.md) | insightProfileService TOCTOU (4 read-then-write + getOrCreateInsightProfile race) | MEDIUM | ADDED_TO_EXISTING |
| [15-TD-16](./15-TD-16-mega-view-decomposition-5c.md) | DashboardView `as any` casts (lines 1614, 1636) + `as Transaction[]` casts (lines 1314, 1319, 1325) | LOW | ADDED_TO_EXISTING |
