# Tech Debt Story TD-15b-2: Dead Code Cleanup from Shared Audit

Status: done

> **Source:** ECC Code Review (2026-02-15) on story 15b-1k
> **Priority:** MEDIUM
> **Estimated Effort:** 1 pt

## Story

As a **developer**,
I want **to delete 10 dead files identified by the shared audit (0 consumers each)**,
So that **the codebase has no orphan code and grep/search results are cleaner**.

## Acceptance Criteria

- [x] **AC1:** All 10 dead files deleted (source + associated test files)
- [x] **AC2:** `npm run test:quick` passes after all deletions
- [x] **AC3:** No broken imports (grep for deleted module names across src/ and tests/)

## Tasks / Subtasks

- [x] **Task 1:** Delete quick-win dead files (6 files, 0 consumers, no tests)
  - [x] 1.1: Delete `src/hooks/useFirestoreMutation.ts`
  - [x] 1.2: Delete `src/components/UpgradePromptModal.tsx`
  - [x] 1.3: Delete `src/utils/colors.ts`
  - [x] 1.4: Delete `src/utils/csv.ts`
  - [x] 1.5: Delete `src/utils/json.ts`
  - [x] 1.6: Delete `src/services/analyticsService.ts`
  - [x] 1.7: Run `npm run test:quick` — verify no breakage

- [x] **Task 2:** Delete dead files with tests (4 files + tests)
  - [x] 2.1: Delete `src/hooks/useChangeDetection.ts` + test
  - [x] 2.2: Delete `src/hooks/useManualSync.ts` + test
  - [x] 2.3: Delete `src/hooks/useSubscriptionTier.ts` + 2 tests
  - [x] 2.4: Delete `src/utils/deepLinkHandler.ts` + test
  - [x] 2.5: Run `npm run test:quick` — verify no breakage

- [x] **Task 3:** Delete dead component directory
  - [x] 3.1: Verify `src/components/batch/` barrel has 0 external importers
  - [x] 3.2: Delete entire `src/components/batch/` directory
  - [x] 3.3: Remove any barrel re-exports referencing batch/ from parent index files
  - [x] 3.4: Run `npm run test:quick` — verify no breakage

## Dev Notes

- Source story: [15b-1k](./15b-1k-shared-audit.md)
- Review findings: Follow-Up Actions > Dead Code Deletion
- All files verified as 0 consumers during shared audit (grep-based)
- Quick wins (Task 1) can be done in bulk; moderate files (Task 2) need test file cleanup; complex (Task 3) needs directory verification

### Implementation Notes (2026-02-15)

**Additional cleanup beyond story scope:**
- Deleted `tests/unit/services/analyticsService.test.ts` (test for deleted service)
- Removed unused `exportToCSV` import from `tests/integration/analytics-workflows.test.tsx`
- Cleaned `useSubscriptionTier` references from `tests/integration/trends-export.test.tsx` (all skipped tests)
- Deleted `tests/unit/components/batch/` directory (2 test files for deleted shims)
- Removed batch test glob from `tests/config/vitest.config.ci.group-components-scan.ts`

**Files deleted (source):** 10 + 3 shim directory files = 13 source files
**Files deleted (tests):** 7 test files
**Test files modified:** 3 (removed dead imports/mocks)

## Senior Developer Review (ECC)

- **Review date:** 2026-02-15
- **Classification:** TRIVIAL (pure deletion story)
- **ECC agents:** [code-reviewer]
- **Outcome:** APPROVE 10/10
- **Findings:** 0 (clean deletion, zero broken references)
- **TD stories created:** 0
- **Lines removed:** 2,575 (13 source + 7 test files)
