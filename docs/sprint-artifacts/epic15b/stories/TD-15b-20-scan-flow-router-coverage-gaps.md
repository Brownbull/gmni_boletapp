# Tech Debt Story TD-15b-20: Harden useScanFlowRouter test coverage

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-25) on story TD-15b-19
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **the useScanFlowRouter hook tests to cover missing branches (merchant confidence boundary, usage increment assertions, null guards, dispatchProcessSuccess in continueScan)**, so that **the hook's behavior is fully verified and regressions are caught**.

## Acceptance Criteria

- [ ] **AC1:** Add boundary test for merchant confidence = 0.7 (should NOT apply merchant mapping)
- [ ] **AC2:** Assert `incrementMerchantMappingUsage` called when merchant matched in continueScan
- [ ] **AC3:** Assert `incrementItemNameMappingUsage` called when item names applied in continueScan
- [ ] **AC4:** Add test for `dispatchProcessSuccess`/`setSkipScanCompleteModal` path in continueScan (parallel to existing proceedAfter test)
- [ ] **AC5:** Add null-guard tests: `user: null` and `services: null` in both continueScan and proceedAfter
- [ ] **AC6:** Tighten `addTransaction` assertions to use `toHaveBeenCalledWith` instead of bare `toHaveBeenCalled`
- [ ] **AC7:** Both test files remain under 300 lines after additions
- [ ] **AC8:** `npm run test:quick` passes with 0 failures

## Tasks / Subtasks

### Task 1: Add missing branch coverage to continueScan tests
- [ ] 1.1 Add merchant confidence boundary test (confidence: 0.7 → no mapping applied)
- [ ] 1.2 Add `incrementMerchantMappingUsage` assertion to merchant match test
- [ ] 1.3 Add `incrementItemNameMappingUsage` assertion to item name mapping test
- [ ] 1.4 Add `dispatchProcessSuccess`/`setSkipScanCompleteModal` test for edit-view path
- [ ] 1.5 Add null-guard tests for `user: null` and `services: null`
- [ ] 1.6 Tighten `addTransaction` to use `toHaveBeenCalledWith`

### Task 2: Add missing branch coverage to proceedAfter tests
- [ ] 2.1 Add null-guard tests for `user: null` and `services: null`
- [ ] 2.2 Tighten `addTransaction` to use `toHaveBeenCalledWith`
- [ ] 2.3 Add negative assertions to low-confidence path (no addTransaction, no showScanDialog)

### Task 3: Verify constraints
- [ ] 3.1 Both test files remain under 300 lines
- [ ] 3.2 Run `npm run test:quick` — all tests pass

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
