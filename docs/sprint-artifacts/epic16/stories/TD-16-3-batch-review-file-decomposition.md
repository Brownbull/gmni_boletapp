# Tech Debt Story TD-16-3: Batch-Review File Decomposition

Status: ready-for-dev

> **Source:** KDBP Code Review (2026-03-07) on story 16-6
> **Priority:** MEDIUM | **Estimated Effort:** 3 pts

## Story
As a **developer**, I want **useBatchReviewHandlers.ts (773L) and BatchCaptureView.tsx (800L) decomposed below the 800-line hook threshold**, so that **future edits are not blocked by the file-size enforcement hook**.

## Acceptance Criteria
- AC-1: useBatchReviewHandlers.ts < 700 lines after extraction
- AC-2: BatchCaptureView.tsx < 700 lines after extraction
- AC-3: No behavior changes — pure structural refactoring
- AC-4: All existing tests pass without modification

## Tasks / Subtasks
- [ ] 1. Extract helper functions from useBatchReviewHandlers.ts into focused modules
- [ ] 2. Extract sub-components from BatchCaptureView.tsx (e.g., capture controls, preview section)
- [ ] 3. Verify all tests pass after extraction

## Dev Notes
- Source story: [16-6](./16-6-extract-shared-workflow-store.md)
- Review findings: #9, #10
- Files affected: `src/features/batch-review/hooks/useBatchReviewHandlers.ts`, `src/features/batch-review/views/BatchCaptureView.tsx`
- BatchCaptureView is AT the 800L limit — any future edit will be blocked
- useBatchReviewHandlers at 773L — dangerously close
