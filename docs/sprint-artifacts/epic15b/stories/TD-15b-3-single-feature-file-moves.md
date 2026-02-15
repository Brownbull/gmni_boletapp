# Tech Debt Story TD-15b-3: Single-Feature File Moves from Shared Audit

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-15) on story 15b-1k
> **Priority:** MEDIUM
> **Estimated Effort:** 3 pts

## Story

As a **developer**,
I want **to move 21 single-feature files from flat shared directories into their owning feature modules, and extract 3 non-thin views into feature modules**,
So that **FSD adoption increases beyond 85% and flat directories contain only truly cross-feature code**.

## Acceptance Criteria

- [ ] **AC1:** 14 single-feature components moved to `src/features/<feature>/components/`
- [ ] **AC2:** 3 single-feature services moved to `src/features/<feature>/services/`
- [ ] **AC3:** 4 single-feature utils moved to `src/features/<feature>/utils/`
- [ ] **AC4:** 3 non-thin views extracted into feature modules (or flagged for Phase 2 if >800 lines)
- [ ] **AC5:** All moved files re-exported from owning feature barrel `index.ts`
- [ ] **AC6:** Backward-compatible re-exports added for files with >3 consumers
- [ ] **AC7:** `npm run test:quick` passes after all moves
- [ ] **AC8:** No new circular dependencies (depcruise check)

## Tasks / Subtasks

- [ ] **Task 1:** Move transaction-editor components (8 files)
  - [ ] 1.1: Move AdvancedScanOptions, CategoryBadge, CategoryCombobox, CategorySelectorOverlay, CurrencyTag, DateTimeTag, ItemNameSuggestionIndicator, StoreTypeSelector → `features/transaction-editor/components/`
  - [ ] 1.2: Update feature barrel, add re-exports from old locations if >3 consumers
  - [ ] 1.3: Update test imports
  - [ ] 1.4: Run `npm run test:quick`

- [ ] **Task 2:** Move settings components (4 files)
  - [ ] 2.1: Move CategoryMappingsList, ItemNameMappingsList, MerchantMappingsList, SubcategoryMappingsList → `features/settings/components/`
  - [ ] 2.2: Update feature barrel + re-exports
  - [ ] 2.3: Run `npm run test:quick`

- [ ] **Task 3:** Move remaining single-feature components (2 files)
  - [ ] 3.1: Move CountryFlag → `features/history/components/`
  - [ ] 3.2: Move TrustMerchantPrompt → `features/credit/components/`
  - [ ] 3.3: Update feature barrels + re-exports
  - [ ] 3.4: Run `npm run test:quick`

- [ ] **Task 4:** Move single-feature services (3 files)
  - [ ] 4.1: Move batchProcessingService → `features/batch-review/services/`
  - [ ] 4.2: Move itemDuplicateDetectionService → `features/items/services/`
  - [ ] 4.3: Move locationService → `features/scan/services/`
  - [ ] 4.4: Update test mocks to target new paths
  - [ ] 4.5: Run `npm run test:quick`

- [ ] **Task 5:** Move single-feature utils (4 files)
  - [ ] 5.1: Move confetti → `features/transaction-editor/utils/`
  - [ ] 5.2: Move imageUtils → `features/batch-review/utils/`
  - [ ] 5.3: Move statisticsUtils → `features/analytics/utils/`
  - [ ] 5.4: Move totalValidation → `features/scan/utils/`
  - [ ] 5.5: Run `npm run test:quick`

- [ ] **Task 6:** Extract non-thin views into feature modules
  - [ ] 6.1: Evaluate NotificationsView (160 lines) — extract to feature module or flag for Phase 2
  - [ ] 6.2: Evaluate RecentScansView (438 lines) — move to `features/scan/views/`
  - [ ] 6.3: Evaluate StatementScanView (162 lines) — move to `features/scan/views/`
  - [ ] 6.4: Run `npm run test:quick`

- [ ] **Task 7:** Final verification
  - [ ] 7.1: Run depcruise — verify no new cycles
  - [ ] 7.2: Run `npm run test:story` — full integration test

## Dev Notes

- Source story: [15b-1k](./15b-1k-shared-audit.md)
- Review findings: Follow-Up Actions > Single-Feature Moves + Non-Thin Views
- All 21 single-feature files verified by grep during shared audit (each has exactly 1 feature importer)
- For files with >3 import consumers, add backward-compatible re-export from original location (CLAUDE.md refactoring rules)
- Update test mocks to target new module paths after each move (stale mocks = #1 post-refactor failure source)
- Non-thin views: NotificationsView may warrant its own feature module; RecentScansView + StatementScanView logically belong to scan feature
