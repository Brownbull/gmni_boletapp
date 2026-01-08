# Story 14.30: Test Technical Debt Cleanup

## Status: Ready for Development

> **Created:** 2026-01-07
> **Origin:** Test failures discovered during Story 14.27 implementation
> **Scope:** 71 failing tests across multiple test suites

## Overview

Fix failing tests that accumulated from recent refactoring work in Stories 14.23 (TransactionEditorView), 14.29 (React Query Migration), and UI component updates that moved from Tailwind classes to CSS variables.

## User Story

As a developer, I want all tests to pass so that CI/CD pipelines don't fail and we maintain confidence in our test coverage.

## Problem Statement

### Current State
- 71 tests failing out of 3,673 total
- Tests were written against old component APIs/patterns
- CI/CD may be failing on these tests

### Root Causes

1. **React Query Migration (14.29)** - Components now require `QueryClientProvider` wrapper
2. **UI Refactoring** - Components use inline styles (`style={{backgroundColor: 'var(--surface)'}}`) instead of Tailwind classes (`bg-white`)
3. **Translation Key Changes** - Some translation keys were renamed
4. **Button Text Changes (14.23)** - "Save" → "Save Transaction"
5. **Prompt Library Updates** - Category counts changed, prompt structure changed

---

## Acceptance Criteria

### AC #1: React Query Provider Fixes
- [ ] All TrendsView tests use custom render with QueryClientProvider
- [ ] All analytics integration tests use custom render
- [ ] Tests import from `tests/setup/test-utils` instead of `@testing-library/react`

### AC #2: UI/Theme Test Updates
- [ ] Tests checking for Tailwind classes updated to check inline styles or CSS variables
- [ ] MerchantMappingsList tests updated for new component structure
- [ ] TrustedMerchantsList tests updated for new component structure
- [ ] CategoryMappingsList tests updated for new component structure

### AC #3: Translation/Button Text Fixes
- [ ] All tests using `"Save"` button updated to `"Save Transaction"`
- [ ] Translation mocks include all required keys

### AC #4: Prompt Library Tests
- [ ] Update expected category counts to match current values
- [ ] Update prompt structure expectations

### AC #5: Clean Test Run
- [ ] All 3,673+ tests pass
- [ ] No skipped tests that should be enabled
- [ ] CI/CD pipeline passes

---

## Failing Test Categories

### Category 1: React Query Provider (Fixed during 14.27)
Files already fixed:
- `tests/unit/views/TrendsView.polygon.test.tsx` ✅
- `tests/integration/analytics/trendsViewIntegration.test.tsx` ✅
- `tests/integration/analytics-workflows.test.tsx` ✅

### Category 2: Prompts Library (~27 tests)
Files:
- `functions/src/prompts/__tests__/index.test.ts`
- `prompt-testing/prompts/__tests__/index.test.ts`
- `shared/prompts/__tests__/index.test.ts`

Issues:
- Expected 34 store categories, 32 item categories (counts have changed)
- `ACTIVE_PROMPT` references changed
- `buildPrompt()` behavior changed

### Category 3: Component Theme/Styling (~25 tests)
Files:
- `tests/unit/components/MerchantMappingsList.test.tsx`
- `tests/unit/components/TrustedMerchantsList.test.tsx`
- `tests/integration/category-mappings.test.tsx`

Issues:
- Tests check for `bg-white` class but components use `style={{backgroundColor: 'var(--surface)'}}`
- Component structure may have changed

### Category 4: QuickSaveCard (~4 tests)
File: `tests/unit/components/scan/QuickSaveCard.test.tsx`

Issues:
- Theme styling tests check wrong selectors
- Item count display format changed

### Category 5: Settings Export (~2 tests)
File: `tests/integration/settings-export.test.tsx`

Issues:
- Button labels changed
- Component structure may have changed

### Category 6: Batch Review (~2 tests)
Files:
- `tests/unit/hooks/useBatchReview.test.ts`
- `tests/unit/views/BatchReviewView.test.tsx`

Issues:
- Return type expectations changed

---

## Tasks

### Phase 1: Prompt Library Tests (~27 tests)
- [ ] Task 1.1: Update `functions/src/prompts/__tests__/index.test.ts` category counts
- [ ] Task 1.2: Update `prompt-testing/prompts/__tests__/index.test.ts` category counts
- [ ] Task 1.3: Update `shared/prompts/__tests__/index.test.ts` category counts
- [ ] Task 1.4: Fix `ACTIVE_PROMPT` and `buildPrompt()` expectations

### Phase 2: Component Theme Tests (~25 tests)
- [ ] Task 2.1: Update MerchantMappingsList tests for CSS variable styling
- [ ] Task 2.2: Update TrustedMerchantsList tests for CSS variable styling
- [ ] Task 2.3: Update CategoryMappingsList tests for CSS variable styling

### Phase 3: Remaining Component Tests (~10 tests)
- [ ] Task 3.1: Fix QuickSaveCard theme tests
- [ ] Task 3.2: Fix settings-export tests
- [ ] Task 3.3: Fix useBatchReview tests
- [ ] Task 3.4: Fix BatchReviewView tests

### Phase 4: Verification
- [ ] Task 4.1: Run full test suite - verify all pass
- [ ] Task 4.2: Verify CI/CD pipeline passes

---

## Dependencies
- Story 14.29 (React Query Migration) - ✅ COMPLETED
- Story 14.23 (Unified Transaction Editor) - ✅ COMPLETED

## Estimated Effort
- **Size**: Small (3 points)
- **Risk**: Low - test-only changes, no production code changes

---

## Test Fixes Already Applied (during 14.27)

The following fixes were already applied:

1. **ScanOverlay.test.tsx**: `tipCanNavigate` → `tipCanNavigateWhileProcessing`
2. **TrendsView.polygon.test.tsx**: Import from `test-utils` with QueryClientProvider
3. **trendsViewIntegration.test.tsx**: Import from `test-utils`
4. **analytics-workflows.test.tsx**: Import from `test-utils`
5. **category-learning.test.tsx**: `"Save"` → `"Save Transaction"` (15 occurrences)
6. **QuickSaveCard.test.tsx**: Updated "0 items" test expectation

---

## Resume Prompt for New Session

```
Continue implementing Story 14.30: Test Technical Debt Cleanup.

Read the story at `docs/sprint-artifacts/epic14/stories/story-14.30-test-technical-debt.md`.

**Current state**: 71 failing tests
**Already fixed**: ScanOverlay, TrendsView (QueryClient), category-learning tests

**Run tests to see current failures:**
npm run test -- --run --reporter=verbose 2>&1 | grep "FAIL" | sort -u

**Priority categories:**
1. Prompt library tests (~27) - update category counts
2. Component theme tests (~25) - update for CSS variables
3. Remaining component tests (~10)

**Key pattern**: Tests checking `bg-white` class should check for CSS variable styling instead.
```
