# Story 14c-refactor.35d: Final Cleanup - Dead Code & Verification

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **dead code removed and final architecture documented**,
So that **App.tsx reaches target line count and the epic can conclude**.

## Background

### Part of Story 35 Split

This story is Part D of 4 stories split from the original story 14c-refactor.35 (Final App.tsx Line Count Target). The split was performed via `atlas-story-sizing` workflow because the original story exceeded sizing guidelines.

**Split breakdown:**
- **35a:** Audit & Documentation (Task 1) - DONE
- **35b:** View Render Functions (Task 2) - DONE
- **35c:** Handler Hook Extraction (Task 3) - DONE
- **35d (this story):** Dead Code & Verification (Tasks 4-5) - DONE

### Focus

This is the final story of the epic. It:
1. Removes dead code identified in Story 35a
2. Consolidates duplicate patterns
3. Verifies the final line count
4. Documents the final architecture
5. Runs full test suite and smoke tests

## Acceptance Criteria

1. **Given** dead code is identified in Story 35a audit
   **When** this story is completed
   **Then:**
   - [x] Unused imports removed
   - [x] Unused variables removed
   - [x] Duplicate code patterns consolidated

2. **Given** the refactor epic completes
   **When** this story is completed
   **Then:**
   - [x] Final line count documented
   - [x] Architecture documented (what's where and why)
   - [x] All tests pass (5,274/5,280 - 6 pre-existing failures tracked separately)
   - [x] Build succeeds

3. **Given** App.tsx target is 1,500-2,000 lines
   **When** this story is completed
   **Then:**
   - [ ] ~~App.tsx is between 1,500-2,000 lines~~ NOT ACHIEVED
   - [x] Documented reason why target is not achievable with recommendations

## Implementation Results

### Dead Code Removed: 371 Lines

| Item | Lines | Location |
|------|-------|----------|
| `_handleRemovePhoto` | 8 | Deprecated photo handler |
| `_handleCancelNewTransaction` | 7 | Deprecated cancel handler |
| `_processBatchImages_DEPRECATED` | 210 | Legacy sequential batch processing |
| Batch cancel handlers | 18 | `handleBatchCancelRequest`, etc. |
| Commented view blocks | 32 | ScanView, ScanResultView, EditView |
| Legacy batch state | 7 | `isBatchProcessing`, `batchProgress`, etc. |
| Legacy batch UI | 76 | BatchProcessingProgress modal + cancel dialog |
| Unused imports | 2 | `BatchProcessingProgress`, `BatchItemResult` |
| **Total** | **371** | |

### Final Line Count

| Metric | Value |
|--------|-------|
| Pre-35d | 4,221 lines |
| After 35d | **3,850 lines** |
| Target | 1,500-2,000 lines |
| Gap | 1,850-2,350 lines |

### Why Target Not Achieved

See [app-architecture-final.md](../app-architecture-final.md) for full analysis. Summary:

1. **Handler functions (1,500 lines)** - Cannot extract without major refactoring due to cross-state dependencies
2. **State coupling (200 lines)** - States shared across views cannot be split
3. **Overlay rendering (1,050 lines)** - Many modals depend on inline handlers

### Recommendation

**Accept current state.** The 1,500-2,000 line target was aspirational. The realistic minimum is ~3,000-3,500 lines. Current 3,850 lines represents a **~20% reduction** from original ~4,800 lines while maintaining full functionality.

## Tasks / Subtasks

### Task 1: Remove Dead Code & Consolidate

- [x] 1.1 Find unused imports (ESLint + manual review)
- [x] 1.2 Find unused variables (TypeScript + manual review)
- [x] 1.3 Find duplicate code patterns
- [x] 1.4 Consolidate or remove

### Task 2: Final Verification

- [x] 2.1 Run `wc -l src/App.tsx` - **3,850 lines**
- [x] 2.2 Run full test suite - **5,274 passing, 6 pre-existing failures**
- [x] 2.3 Build passes - **Verified**
- [x] 2.4 Document final architecture - **app-architecture-final.md created**
- [x] 2.5 Document blockers and recommendations - **Included in architecture doc**

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Cleanup and verification
- **Actual effort:** ~2 hours

### Dependencies

- **Requires:**
  - Story 35a (Audit) - DONE
  - Story 35b (View render functions) - DONE
  - Story 35c (Handler hooks) - DONE
- **Blocks:** Epic retrospective

## References

- [Story 35a](14c-refactor-35a-audit-documentation.md) - Audit report
- [Architecture Doc](../app-architecture-final.md) - Final state documentation
- [Source: src/App.tsx] - Target file

## File List

**Modified:**
- `src/App.tsx` - Dead code removal (371 lines removed)
- `docs/sprint-artifacts/epic14c-refactor/app-architecture-final.md` - Line count corrections (code review fix)

**Created:**
- `docs/sprint-artifacts/epic14c-refactor/app-architecture-final.md` - Final architecture documentation

## Code Review Fixes (2026-01-24)

**Reviewer:** Atlas-Enhanced Code Review

**Issue Fixed:**
1. **MEDIUM: Architecture Doc Line Counts Inaccurate** - Updated extracted components and hooks tables with actual `wc -l` line counts. Original estimates were 2-6x off from actual values.

**Changes Applied:**
- `app-architecture-final.md`: Updated "Extracted Components" table (AppOverlays: ~300→599, viewRenderers: ~150→432, ViewHandlersContext: ~80→229)
- `app-architecture-final.md`: Updated "Extracted Hooks" table with accurate line counts for all 11 hooks

**Issue Noted (No Action Required):**
- **LOW: Void statements for reserved context values** - `void isBatchProcessingFromContext` and `void batchProgressFromContext` are intentionally kept for future Epic 14d re-implementation. Not dead code.
