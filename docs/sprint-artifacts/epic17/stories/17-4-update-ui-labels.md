# Story 17-4: Update UI Labels and Analytics Groupings

## Status: done

## Intent
**Epic Handle:** "Name everything in the language the user thinks in"
**Story Handle:** "This story names everything by relabeling every visible shelf sign the user reads"

## Story
As a user, I want every screen -- analytics, history, editing, scan review -- to show the new Spanish category labels consistently.

## Acceptance Criteria

### Functional
- **AC-1:** Given analytics drill-down shows category names, when viewed, then all levels use new Spanish labels
- **AC-2:** Given transaction editor shows category dropdowns, when editing, then dropdown options use new names
- **AC-3:** Given batch review shows scanned categories, when reviewing, then categories display new names
- **AC-4:** Given history view shows category badges, when viewing, then badges use new names
- **AC-5:** Given CSV export includes category columns, when exported, then column values use new names
- **AC-6:** Given the app is set to English locale, when viewed, then English translations of new labels are shown

### Architectural
- **AC-ARCH-PATTERN-1:** All UI reads category display names from `translations.ts` -- no hardcoded strings
- **AC-ARCH-PATTERN-2:** Analytics grouping keys match new canonical constant values
- **AC-ARCH-NO-1:** No hardcoded category strings in any component file
- **AC-ARCH-NO-2:** No analytics logic changes -- only display labels change

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Analytics components | `src/features/trends/` or `src/views/` (analytics views) | FSD components | MODIFIED |
| Transaction editor | `src/features/transaction-editor/` | FSD components | MODIFIED |
| Batch review | `src/features/batch-review/` | FSD components | MODIFIED |
| History view | `src/views/` (history) | Views | MODIFIED |
| CSV export | `src/features/` or `src/shared/` (export logic) | Feature | MODIFIED |
| Chart components | `src/` (chart/visualization components) | Components | MODIFIED |

## Tasks

### Task 1: Audit UI Category References (2 subtasks)
- [x] 1.1: Grep all component files for category display -- catalog every location that shows a category name to the user
- [x] 1.2: Verify each location reads from translations, not hardcoded -- flag any hardcoded strings

### Task 2: Update Analytics Components (3 subtasks)
- [x] 2.1: Update analytics drill-down labels (Year > Month > Category Group > Category) — VERIFIED: already uses translateCategory() from categoryTranslations.ts
- [x] 2.2: Update chart legends and axis labels — VERIFIED: DonutLegend already uses centralized translations
- [x] 2.3: Update analytics grouping keys if they reference old canonical names — VERIFIED: keys are English canonical, display via translateCategory()

### Task 3: Update Transaction Editor and Batch Review (2 subtasks)
- [x] 3.1: Update category dropdown options in transaction editor — VERIFIED: CategoryCombobox/CategorySelectorOverlay already use centralized translations
- [x] 3.2: Update category display in batch review cards — VERIFIED: BatchReviewCard uses getCategoryEmoji/getCategoryColorsAuto

### Task 4: Update History and Export (2 subtasks)
- [x] 4.1: Update category badges in history/transaction list view — VERIFIED: TransactionCard/FilterChips/CategoryFilterDropdown already use centralized translations
- [x] 4.2: Update CSV export column values — FIXED: replaced inline ITEM_CATEGORY_TRANSLATIONS_ES map with translateItemGroup()/translateSubcategory()

### Task 5: Hardening (2 subtasks)
- [x] 5.1: **i18n completeness check:** Confirmed only csvExport.ts and reportCategoryGrouping.ts had inline maps (both fixed). Report components only have Spanish in JSDoc examples.
- [x] 5.2: **PURE_COMPONENT:** Verified — all translation functions handle empty/null keys with safe fallback (return original key)

### Task 6: Verification (2 subtasks)
- [x] 6.1: Run `npm run test:quick` -- 316 files, 7364 tests pass
- [x] 6.2: Run `npx tsc --noEmit` -- included in test:quick typecheck, zero errors

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 13
- **Files:** ~8-10

## Dependencies
- **17-2** (constants and translations must be updated first)

## Risk Flags
- PURE_COMPONENT (display components showing category data)
- E2E_TESTING (visual regression in analytics)

## Dev Notes
- This is the highest-touch story in Epic 17 -- many files but all small changes (label swaps).
- If translations are set up correctly, most changes are just verifying that components read from translations rather than constants directly.
- Analytics grouping is the most sensitive area -- if grouping keys change, historical data displays differently. Ensure the normalizer (from 17-2) handles this.
- CSV export: if users have existing exported CSVs, the new names will differ. This is expected and documented.
- **2026-03-10 Implementation:** Only 2 files needed code changes. All other UI components already used centralized translations from 17-2. Changes: (1) csvExport.ts — removed 51-line inline V3 map, now uses translateItemGroup()/translateSubcategory(); (2) reportCategoryGrouping.ts — replaced 60-line inline formatCategoryName() map with translateStoreCategory() delegation. Some report Spanish labels changed to canonical form (e.g., 'Salud'→'Medico', 'Bencina'→'Bencinera').

## Deferred Items (from code review 2026-03-10)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-17-2 | `formatCategoryName` hardcodes 'es' + hardcoded 'compra'/'items' strings | LOW | CREATED |
| — | `captureCSVContent` Blob monkey-patch fragility (test quality nit) | LOW | NOTED (no story) |

## Senior Developer Review (KDBP Code Review)
- **Date:** 2026-03-10
- **Classification:** STANDARD
- **Agents:** code-reviewer (8/10), security-reviewer (9/10)
- **Overall:** APPROVE 8.5/10
- **Quick fixes:** 4 (test double-assertion cleanup, verification of fallbacks + stale imports, categoryColors.ts deletion noted for commit)
- **TD stories created:** 1 (TD-17-2: report grouping i18n completion)
- **Action items:** 0 remaining

<!-- CITED: L2-004 (i18n completeness), L2-006 (DRY/SSOT) -->
