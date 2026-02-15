# Tech Debt Story TD-15b-2: Dead Code Cleanup from Shared Audit

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-15) on story 15b-1k
> **Priority:** MEDIUM
> **Estimated Effort:** 1 pt

## Story

As a **developer**,
I want **to delete 10 dead files identified by the shared audit (0 consumers each)**,
So that **the codebase has no orphan code and grep/search results are cleaner**.

## Acceptance Criteria

- [ ] **AC1:** All 10 dead files deleted (source + associated test files)
- [ ] **AC2:** `npm run test:quick` passes after all deletions
- [ ] **AC3:** No broken imports (grep for deleted module names across src/ and tests/)

## Tasks / Subtasks

- [ ] **Task 1:** Delete quick-win dead files (6 files, 0 consumers, no tests)
  - [ ] 1.1: Delete `src/hooks/useFirestoreMutation.ts`
  - [ ] 1.2: Delete `src/components/UpgradePromptModal.tsx`
  - [ ] 1.3: Delete `src/utils/colors.ts`
  - [ ] 1.4: Delete `src/utils/csv.ts`
  - [ ] 1.5: Delete `src/utils/json.ts`
  - [ ] 1.6: Delete `src/services/analyticsService.ts`
  - [ ] 1.7: Run `npm run test:quick` — verify no breakage

- [ ] **Task 2:** Delete dead files with tests (4 files + tests)
  - [ ] 2.1: Delete `src/hooks/useChangeDetection.ts` + test
  - [ ] 2.2: Delete `src/hooks/useManualSync.ts` + test
  - [ ] 2.3: Delete `src/hooks/useSubscriptionTier.ts` + 2 tests
  - [ ] 2.4: Delete `src/utils/deepLinkHandler.ts` + test
  - [ ] 2.5: Run `npm run test:quick` — verify no breakage

- [ ] **Task 3:** Delete dead component directory
  - [ ] 3.1: Verify `src/components/batch/` barrel has 0 external importers
  - [ ] 3.2: Delete entire `src/components/batch/` directory
  - [ ] 3.3: Remove any barrel re-exports referencing batch/ from parent index files
  - [ ] 3.4: Run `npm run test:quick` — verify no breakage

## Dev Notes

- Source story: [15b-1k](./15b-1k-shared-audit.md)
- Review findings: Follow-Up Actions > Dead Code Deletion
- All files verified as 0 consumers during shared audit (grep-based)
- Quick wins (Task 1) can be done in bulk; moderate files (Task 2) need test file cleanup; complex (Task 3) needs directory verification
