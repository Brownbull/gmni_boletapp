# Tech Debt Story TD-18-1: Error Recovery Test File Cleanup

Status: done

> **Source:** KDBP Code Review (2026-03-10) on story 18-0
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story
As a **developer**, I want **the error recovery test file cleaned up (shared factory, dismiss coverage, reduced redundancy)**, so that **the file stays under the 300-line unit test limit and all three overlay handlers have parity test coverage**.

## Acceptance Criteria
- AC-1: `createProps` factory extracted to module scope (shared between retry + cancel + dismiss describe blocks)
- AC-2: `handleScanOverlayDismiss` describe block added with parity tests matching cancel/retry
- AC-3: Omnibus "full reset sequence" tests either removed (individual tests cover all assertions) or kept as the only tests per block
- AC-4: File is under 300 lines after cleanup
- AC-5: All existing tests still pass

## Tasks
### Task 1: Extract shared factory (2 subtasks)
- [x] 1.1: Move `createProps` to module scope above all describe blocks
- [x] 1.2: Remove duplicate `mockUser`, `mockDb`, `mockServices`, `mockUserPreferences`, `mockScanOverlay` declarations

### Task 2: Add dismiss coverage (2 subtasks)
- [x] 2.1: Add `handleScanOverlayDismiss` describe block with parity tests
- [x] 2.2: Verify dismiss calls `scanOverlay.reset()` (not retry) + full reset sequence

### Task 3: Reduce redundancy (1 subtask)
- [x] 3.1: Kept omnibus + overlay-method test per block; removed 4 individual assertion tests per block (fully covered by omnibus)

## Dev Notes
- Source story: [18-0](./18-0-scan-cancel-phase-reset-hotfix.md)
- Review findings: #1, #2, #3, #6 from code review synthesis
- Files affected: `tests/unit/features/scan/hooks/useScanHandlers.errorRecovery.test.ts`

## Senior Developer Review (KDBP)
- **Date:** 2026-03-11
- **Classification:** SIMPLE
- **Agents:** code-reviewer (8.5/10), tdd-guide (8/10)
- **Overall:** 8/10 — APPROVE
- **Quick fixes applied:** 2 (dismiss story label, dead afterEach)
- **TD stories created:** 0
- **Backlog items:** 0
<!-- CITED: none -->
