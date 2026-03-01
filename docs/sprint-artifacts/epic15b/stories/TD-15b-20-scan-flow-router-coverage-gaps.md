# Tech Debt Story TD-15b-20: Harden useScanFlowRouter test coverage

Status: done

> **Source:** ECC Code Review (2026-02-25) on story TD-15b-19
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **the useScanFlowRouter hook tests to cover missing branches (merchant confidence boundary, usage increment assertions, null guards, dispatchProcessSuccess in continueScan)**, so that **the hook's behavior is fully verified and regressions are caught**.

## Acceptance Criteria

- [x] **AC1:** Add boundary test for merchant confidence = 0.7 (should NOT apply merchant mapping)
- [x] **AC2:** Assert `incrementMerchantMappingUsage` called when merchant matched in continueScan
- [x] **AC3:** Assert `incrementItemNameMappingUsage` called when item names applied in continueScan
- [x] **AC4:** Add test for `dispatchProcessSuccess`/`setSkipScanCompleteModal` path in continueScan (parallel to existing proceedAfter test)
- [x] **AC5:** Add null-guard tests: `user: null` and `services: null` in both continueScan and proceedAfter
- [x] **AC6:** Tighten `addTransaction` assertions to use `toHaveBeenCalledWith` instead of bare `toHaveBeenCalled`
- [x] **AC7:** Both test files remain under 300 lines after additions
- [x] **AC8:** `npm run test:quick` passes with 0 failures

## Tasks / Subtasks

### Task 1: Add missing branch coverage to continueScan tests
- [x] 1.1 Add merchant confidence boundary test (confidence: 0.7 → no mapping applied)
- [x] 1.2 Add `incrementMerchantMappingUsage` assertion to merchant match test
- [x] 1.3 Add `incrementItemNameMappingUsage` assertion to item name mapping test
- [x] 1.4 Add `dispatchProcessSuccess`/`setSkipScanCompleteModal` test for edit-view path
- [x] 1.5 Add null-guard tests for `user: null` and `services: null`
- [x] 1.6 Tighten `addTransaction` to use `toHaveBeenCalledWith`

### Task 2: Add missing branch coverage to proceedAfter tests
- [x] 2.1 Add null-guard tests for `user: null` and `services: null`
- [x] 2.2 Tighten `addTransaction` to use `toHaveBeenCalledWith`
- [x] 2.3 Add negative assertions to low-confidence path (no addTransaction, no showScanDialog)

### Task 3: Verify constraints
- [x] 3.1 Both test files remain under 300 lines
- [x] 3.2 Run `npm run test:quick` — all tests pass

## File List
| File | Action | Est. Lines Added |
|------|--------|-----------------|
| `tests/unit/features/scan/hooks/useScanFlowRouter.continueScan.test.ts` | MODIFY | +40-60 |
| `tests/unit/features/scan/hooks/useScanFlowRouter.proceedAfter.test.ts` | MODIFY | +20-30 |

## Dev Notes
- Source story: [TD-15b-19](./TD-15b-19-scan-flow-router-test-split.md)
- Review findings: #1-#6 from TD-15b-19 code review
- All gaps are pre-existing from the original 391-line file, not regressions from the split
- Pre-existing concerns from 15b-2l review (NOT in scope for this TD):
  - console.error in catch blocks may leak Firestore paths (cross-cutting concern)
  - Advisory TOCTOU gap between checkTrusted() and addTransaction (low risk)

## Senior Developer Review (ECC)
- **Date:** 2026-02-25
- **Classification:** SIMPLE
- **Agents:** code-reviewer (9/10), tdd-guide (8.5/10)
- **Overall:** APPROVE 8.75/10
- **Quick fixes applied (2):** console.error stderr suppression in failure tests, matcher-based boundary assertion
- **NITs skipped (2):** `[tx]` literal in proceedAfter (correct per analysis), long lines (cosmetic)
- **Deferred items:** 0 new (2 pre-existing cross-cutting concerns carried forward)
