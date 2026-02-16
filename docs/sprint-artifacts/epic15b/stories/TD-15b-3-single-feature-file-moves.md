# Tech Debt Story TD-15b-3: Single-Feature File Moves from Shared Audit

Status: done

> **Source:** ECC Code Review (2026-02-15) on story 15b-1k
> **Priority:** MEDIUM
> **Estimated Effort:** 3 pts

## Story

As a **developer**,
I want **to move 21 single-feature files from flat shared directories into their owning feature modules, and extract 3 non-thin views into feature modules**,
So that **FSD adoption increases beyond 85% and flat directories contain only truly cross-feature code**.

## Acceptance Criteria

- [x] **AC1:** 14 single-feature components moved to `src/features/<feature>/components/` (8 tx-editor + 4 settings + 1 history + 1 credit)
- [x] **AC2:** 2 single-feature services moved to `src/features/<feature>/services/` (locationService skipped: cross-feature)
- [x] **AC3:** 3 single-feature utils moved to `src/features/<feature>/utils/` (confetti skipped: cross-feature)
- [x] **AC4:** 2 non-thin views extracted into scan feature; NotificationsView flagged for Phase 2 (no clear owner)
- [x] **AC5:** All moved files re-exported from owning feature barrel `index.ts`
- [x] **AC6:** Backward-compatible re-export shim for batchProcessingService (6 consumers, 1 external)
- [x] **AC7:** `npm run test:quick` passes — 274 files, 6781 tests
- [x] **AC8:** No new circular dependencies (depcruise: 0 violations, 556 modules, 2007 deps)

## Tasks / Subtasks

- [x] **Task 1:** Move transaction-editor components (8 files)
  - [x] 1.1: Move AdvancedScanOptions, CategoryBadge, CategoryCombobox, CategorySelectorOverlay, CurrencyTag, DateTimeTag, ItemNameSuggestionIndicator, StoreTypeSelector → `features/transaction-editor/components/`
  - [x] 1.2: Update feature barrel, add re-exports from old locations if >3 consumers
  - [x] 1.3: Update test imports
  - [x] 1.4: Run `npm run test:quick` — 6779 tests pass

- [x] **Task 2:** Move settings components (4 files)
  - [x] 2.1: Move CategoryMappingsList, ItemNameMappingsList, MerchantMappingsList, SubcategoryMappingsList → `features/settings/components/`
  - [x] 2.2: Update feature barrel + re-exports
  - [x] 2.3: Run tests — 100 tests pass

- [x] **Task 3:** Move remaining single-feature components (2 files)
  - [x] 3.1: Move CountryFlag → `features/history/components/`
  - [x] 3.2: Move TrustMerchantPrompt → `features/credit/components/`
  - [x] 3.3: Update feature barrels + fix stale mock in IconCategoryFilter.test.tsx
  - [x] 3.4: Run tests — 72 tests pass

- [x] **Task 4:** Move single-feature services (2 files, locationService skipped)
  - [x] 4.1: Move batchProcessingService → `features/batch-review/services/` + re-export shim (6 consumers)
  - [x] 4.2: Move itemDuplicateDetectionService → `features/items/services/`
  - [x] 4.3: locationService SKIPPED — cross-feature (used by history, scan, and settings)
  - [x] 4.4: Update test mocks to target new paths
  - [x] 4.5: Run tests — 125 tests pass

- [x] **Task 5:** Move single-feature utils (3 files, confetti skipped)
  - [x] 5.1: confetti SKIPPED — cross-feature (used by batch-review and transaction-editor)
  - [x] 5.2: Move imageUtils → `features/batch-review/utils/`
  - [x] 5.3: Move statisticsUtils → `features/analytics/utils/`
  - [x] 5.4: Move totalValidation → `features/scan/utils/`
  - [x] 5.5: Run tests — 73 tests pass

- [x] **Task 6:** Extract non-thin views into feature modules (2 views moved)
  - [x] 6.1: NotificationsView FLAGGED for Phase 2 — no clear feature owner
  - [x] 6.2: Move RecentScansView → `features/scan/views/`
  - [x] 6.3: Move StatementScanView → `features/scan/views/`
  - [x] 6.4: Run tests — 71 tests pass

- [x] **Task 7:** Final verification
  - [x] 7.1: `npm run test:quick` — 274 files, 6781 tests pass (typecheck clean)
  - [x] 7.2: depcruise cycle check — 0 violations (556 modules, 2007 deps)

## Dev Notes

- Source story: [15b-1k](./15b-1k-shared-audit.md)
- Review findings: Follow-Up Actions > Single-Feature Moves + Non-Thin Views
- All 21 single-feature files verified by grep during shared audit (each has exactly 1 feature importer)
- For files with >3 import consumers, add backward-compatible re-export from original location (CLAUDE.md refactoring rules)
- Update test mocks to target new module paths after each move (stale mocks = #1 post-refactor failure source)
- Non-thin views: NotificationsView may warrant its own feature module; RecentScansView + StatementScanView logically belong to scan feature

## Senior Developer Review (ECC)

- **Review date:** 2026-02-15
- **ECC agents used:** code-reviewer (sonnet), security-reviewer (sonnet), architect (sonnet), tdd-guide (haiku)
- **Classification:** COMPLEX (7 tasks, 24 subtasks, 170+ files on consolidated branch)
- **Outcome:** APPROVE 10/10
- **Quick fixes applied:** 1 (removed pre-existing console.error in LearnedDataView.tsx)
- **TD stories created:** 0
- **Deferred items:** 0 new (NotificationsView Phase 2 deferral, locationService/confetti skips all documented)
- **Verification:**
  - 0 stale imports in src/ (6 grep patterns, all old paths)
  - 0 stale mocks in tests/ (5 grep patterns, all old mock paths)
  - 0 dependency violations (depcruise: 556 modules, 2007 deps)
  - 6781 tests pass, 274 files, TypeScript clean
  - 8/8 feature barrel chains correctly wired
  - 10 re-export shims, all follow `export * from '@features/...'` pattern
- **Session cost:** $14.49
