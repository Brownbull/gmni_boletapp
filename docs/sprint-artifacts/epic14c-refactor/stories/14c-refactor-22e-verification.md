# Story 14c-refactor.22e: Final Cleanup & Verification

Status: done

> **Depends on:** Stories 22b, 22c, 22d - All extractions must be complete first.

## Story

As a **developer**,
I want **App.tsx cleaned up and all workflow chains verified working**,
So that **the refactor is complete and ready for Story 25 (ViewHandlersContext)**.

## Background

This story was split from 14c-refactor.22a (Task 5). After Stories 22b-22d complete the extractions, this story:
1. Removes dead code from App.tsx
2. Verifies line count target achieved
3. Runs full test suite
4. Performs manual smoke testing of all critical paths

**Expected State After 22b-22d:**
- TypeScript safety in viewRenderers (22b)
- renderViewSwitch function integrated (22c)
- AppOverlays component integrated (22d)

**Target State After This Story:**
- App.tsx at ~2,800-3,200 lines (down from 4,408)
- All dead code removed
- All tests passing
- All workflow chains verified

## Acceptance Criteria

1. **Given** Stories 22b-22d are complete
   **When** this story starts
   **Then:**
   - viewRenderers.tsx has 0 `any` types ✅
   - renderViewSwitch is used in App.tsx ⚠️ **PARTIAL** - Individual render functions used (5 views), full switch deferred to Story 25
   - AppOverlays is used in App.tsx ✅

2. **Given** App.tsx contains dead code after extractions
   **When** this story is completed
   **Then:**
   - Commented imports removed
   - Unused inline handlers removed
   - Commented-out code blocks removed
   - No ESLint warnings for unused variables

3. **Given** all extractions are complete
   **When** measuring App.tsx
   **Then:**
   - App.tsx is ~2,800-3,200 lines ⚠️ **PARTIAL** - Actual: 4,104 lines. Full reduction requires Story 25 (ViewHandlersContext)
   - All tests pass (`npm test`) ✅ 5,787 passed
   - Build succeeds (`npm run build`) ✅
   - Type check passes (`npm run type-check`) ✅

4. **Given** the refactor is complete
   **When** verifying workflow chains
   **Then:**
   - Auth → Scan → Save Critical Path works
   - Scan Receipt Flow works (single mode)
   - Quick Save Flow works
   - Batch Processing Flow works
   - All 15 views accessible and functional
   - All overlays render at correct timing

## Tasks / Subtasks

### Task 1: Dead Code Removal

- [x] 1.1 Remove commented imports at top of App.tsx
- [x] 1.2 Remove commented-out code blocks
- [x] 1.3 Remove unused inline handlers (if any remain)
- [x] 1.4 Run ESLint and fix unused variable warnings
- [x] 1.5 Remove any TODO comments that are now resolved

### Task 2: Build Verification

- [x] 2.1 Run `wc -l src/App.tsx` - 4,104 lines (see AC #3 deviation note)
- [x] 2.2 Run `npm run type-check` - PASSED (0 errors)
- [x] 2.3 Run `npm run build` - PASSED
- [x] 2.4 Run `npm run lint` - no errors (deprecation warnings acceptable)

### Task 3: Test Suite Verification

- [x] 3.1 Run `npm test` - 5,787 passed, 62 skipped (expected)
- [x] 3.2 Verify no test regressions from extractions
- [x] 3.3 Document any tests that needed updates (see Implementation Review)

### Task 4: Manual Smoke Testing

- [x] 4.1 **App Lifecycle:** All pass (user verified 2026-01-22)
- [x] 4.2 **Scan Receipt Flow (Critical Path #1):** All pass
- [x] 4.3 **Quick Save Flow (Critical Path #2):** All pass
- [x] 4.4 **Batch Processing Flow:** All pass
- [x] 4.5 **All Views Accessible:** All 15 views verified
- [x] 4.6 **Overlays Render Correctly:** All overlays verified

### Task 5: Documentation Update

- [x] 5.1 Update story 22a with final line counts
- [x] 5.2 Mark all 22a-22e stories as done
- [x] 5.3 Update epics.md if needed
- [x] 5.4 Verify Story 25 dependencies are now unblocked

### Review Follow-ups (AI Code Review 2026-01-22)

- [x] [AI-Review][MEDIUM] AC #1 deviation: Added ⚠️ PARTIAL note to AC #1 documenting renderViewSwitch deferral to Story 25
- [x] [AI-Review][LOW] Line count target: Added ⚠️ PARTIAL note to AC #3 documenting 4,104 vs 2,800-3,200 deviation

---

## Dev Notes

### Estimation

- **Points:** 1 pt
- **Risk:** LOW - Verification and cleanup, no new logic

### Dependencies

- **Requires:** Stories 22b, 22c, 22d all complete
- **Blocks:** Story 14c-refactor-25-view-handlers-context

### Line Count Expectations

| Story | Extraction | Lines Removed |
|-------|------------|---------------|
| 22a | Hook integration | ~412 (already done) |
| 22c | renderViewSwitch | ~400-500 |
| 22d | AppOverlays | ~300-400 |
| 22e | Dead code | ~100-200 |
| **Total** | | **~1,200-1,500** |

**Starting:** 4,408 lines
**Target:** ~2,800-3,200 lines

### Workflow Chain Reference

| Chain | Entry Point | Exit Point | Critical Components |
|-------|-------------|------------|---------------------|
| #1 Scan Receipt | FAB tap | Transaction saved | ScanOverlay → TransactionEditor → Save |
| #2 Quick Save | Scan complete | Toast shown | QuickSaveCard → Save → Toast |
| #3 Batch Processing | Long-press FAB | All saved | BatchCapture → BatchReview → Save |
| #4 Analytics Nav | Trends drill-down | History filtered | TrendsView → HistoryView |
| #6 History Filter | History view | Filtered list | HistoryView + HistoryFiltersProvider |

---

## References

- [Source: Story 22a](14c-refactor-22a-interim-cleanup.md) - Parent story
- [Source: Story 22b](14c-refactor-22b-viewrenderers-typescript.md) - Prerequisite
- [Source: Story 22c](14c-refactor-22c-renderviewswitch.md) - Prerequisite
- [Source: Story 22d](14c-refactor-22d-appoverlays.md) - Prerequisite
- [Source: Story 25](14c-refactor-25-view-handlers-context.md) - Unblocked by this story

## File List

**To Modify:**
- `src/App.tsx` - Remove dead code, final cleanup

**To Update (Documentation):**
- This story file - Add final line counts
- `docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-22a-interim-cleanup.md` - Mark complete

---

*Story created: 2026-01-22 via story split from 14c-refactor.22a*

---

## Implementation Review

### Session: 2026-01-22

**Tasks Completed:**

#### Task 1: Dead Code Removal ✅
- Removed 197 lines from App.tsx (4,301 → 4,104 lines)
- Cleaned up:
  - Commented imports (ScanView, EditView, ScanResultView, deprecated hooks)
  - "Story X: REMOVED/DELETED/MOVED" comments that no longer provide value
  - Legacy TODO comments that were resolved
  - Multi-line comment blocks documenting removed code
  - Verbose story reference comments

#### Task 2: Build Verification ✅
- `npm run type-check` - PASSED (0 errors)
- `npm run build` - PASSED (successful production build)
- Line count: 4,104 lines (Note: target 2,800-3,200 would require additional refactoring beyond dead code removal)

#### Task 3: Test Suite Verification ✅
- Full test suite: 5,020 tests passed, 33 skipped (expected)
- App-related tests: 428 tests passed
  - viewRenderers.test.tsx: 49 tests ✅
  - AppOverlays.test.tsx: 28 tests ✅
  - useTransactionHandlers.test.ts: 36 tests ✅
  - useNavigationHandlers.test.ts: 38 tests ✅
  - useScanHandlers.test.ts: 65 tests ✅
  - useDialogHandlers.test.ts: 26 tests ✅

#### Task 4: Manual Smoke Testing ✅
User verified all smoke test items pass:
- App lifecycle (load, login, logout) ✅
- Scan receipt flow ✅
- Quick save flow ✅
- Batch processing ✅
- All 15 views accessible ✅
- Overlays render correctly ✅

#### Task 5: Documentation Update ✅
- Story status: done
- Sprint status: updated

### Line Count Analysis

| Milestone | Lines | Change |
|-----------|-------|--------|
| Story start (22e) | 4,301 | - |
| After dead code removal | 4,104 | -197 |

**Note:** The target of ~2,800-3,200 lines requires additional refactoring in Story 25 (ViewHandlersContext) and subsequent stories. This story achieved its primary goal of removing dead code and verifying all workflow chains work correctly.

### Deprecation Warnings (Expected)

The following deprecation hints are expected and will be resolved in Epic 14d (Shared Groups v2):
- `'groups' is deprecated` (line 2762) - Shared groups stub
- `'isLoading' is deprecated` (line 2763) - Shared groups stub
- JoinGroupDialog deprecated props (lines 4101-4108)

These are TypeScript hints (not errors) for the intentionally deprecated shared groups interface.
