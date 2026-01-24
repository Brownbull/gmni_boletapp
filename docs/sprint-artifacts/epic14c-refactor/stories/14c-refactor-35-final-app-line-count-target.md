# Story 14c-refactor.35: Final App.tsx Line Count Target

Status: split

> **SPLIT 2026-01-23:** This story was split via `atlas-story-sizing` workflow.
> - Original: 5 tasks, 23 subtasks (exceeded max 4 tasks, 15 subtasks)
> - Split strategy: `by_phase`
> - Sub-stories created:
>   - [14c-refactor-35a](14c-refactor-35a-audit-documentation.md) - Audit & Documentation (1 pt)
>   - [14c-refactor-35b](14c-refactor-35b-view-render-functions.md) - View Render Functions (2 pts)
>   - [14c-refactor-35c](14c-refactor-35c-handler-hook-extraction.md) - Handler Hook Extraction (2 pts)
>   - [14c-refactor-35d](14c-refactor-35d-dead-code-verification.md) - Dead Code & Verification (2 pts)
> - Total: 7 pts (up from original 3 pts estimate - reflects true scope)

## Story

As a **developer maintaining App.tsx**,
I want **App.tsx reduced to the target 1,500-2,000 lines**,
So that **it becomes a thin orchestration layer that's easy to understand and maintain**.

## Background

### Line Count Journey

| Story | Action | Lines | Delta |
|-------|--------|-------|-------|
| Start (14c-refactor.11) | Initial decomposition | 4,500 | - |
| 14c-refactor.22e | View renderers, overlays | 4,202 | -298 |
| 14c-refactor.29 | Hook integration (partial) | 4,245 | +43 |
| 14c-refactor.30-33 | View props alignment | ~3,900 | -345 |
| 14c-refactor.34 | Remaining hooks | ~3,700 | -200 |
| **14c-refactor.35** | **Final cleanup** | **~1,500-2,000** | **-1,700 to -2,200** |

### What Remains After Stories 30-34

After completing the view props alignment and new hooks, App.tsx will still have:

1. **State declarations** (~200 lines) - Cannot be further reduced
2. **Hook calls** (~100 lines) - Needed for composition hooks
3. **Effect hooks** (~150 lines) - App-level lifecycle
4. **Handler functions** (~300 lines) - Complex business logic
5. **View rendering switch** (~200 lines) - Could use renderViewSwitch
6. **Overlay/dialog rendering** (~100 lines) - Already in AppOverlays
7. **Miscellaneous** (~50 lines) - Imports, types, etc.

**Estimated after 30-34:** ~3,700 lines
**Target:** ~1,500-2,000 lines
**Gap:** ~1,700-2,200 lines

### This Story's Focus

This story addresses the **remaining gap** through:

1. **Move remaining views to render functions** (views not using composition hooks)
2. **Extract more handler groups** to dedicated hooks
3. **Remove any remaining dead code**
4. **Consolidate duplicate patterns**
5. **Document what MUST remain inline and why**

## Acceptance Criteria

1. **Given** App.tsx is ~3,700 lines after stories 30-34
   **When** this story is completed
   **Then:**
   - App.tsx is between 1,500-2,000 lines
   - OR documented reason why target is not achievable

2. **Given** some views don't have composition hooks (Insights, Reports, BatchCapture, etc.)
   **When** this story is completed
   **Then:**
   - Small views converted to use `renderViewName()` functions in viewRenderers.tsx
   - OR kept inline with documented reason

3. **Given** handler functions remain in App.tsx
   **When** this story is completed
   **Then:**
   - Handler groups extracted to dedicated hooks where feasible
   - Remaining handlers documented as "must stay inline" with reason

4. **Given** the refactor epic completes
   **When** this story is completed
   **Then:**
   - Final line count documented
   - Architecture documented (what's where and why)
   - All tests pass
   - Smoke test passes

## Tasks / Subtasks

### Task 1: Audit Remaining Code

- [ ] 1.1 Categorize all remaining code in App.tsx
- [ ] 1.2 Identify code that can move to viewRenderers.tsx
- [ ] 1.3 Identify handlers that can become hooks
- [ ] 1.4 Identify dead code for removal
- [ ] 1.5 Document "must remain" items with reasons

### Task 2: Move Remaining Views to Render Functions

For views without composition hooks:
- [ ] 2.1 InsightsView → `renderInsightsView()` (already exists, verify usage)
- [ ] 2.2 ReportsView → `renderReportsView()` (already exists, verify usage)
- [ ] 2.3 BatchCaptureView → evaluate inline vs render function
- [ ] 2.4 NotificationsView → evaluate inline vs render function
- [ ] 2.5 StatementScanView → already uses `renderStatementScanView()`

### Task 3: Extract More Handler Hooks (if needed)

Evaluate extracting:
- [ ] 3.1 Insight-related handlers → `useInsightHandlers()`
- [ ] 3.2 Credit-related handlers → `useCreditHandlers()`
- [ ] 3.3 Session-related handlers → `useSessionHandlers()`
- [ ] 3.4 Each extraction must reduce lines without adding complexity

### Task 4: Remove Dead Code & Consolidate

- [ ] 4.1 Find unused imports
- [ ] 4.2 Find unused variables
- [ ] 4.3 Find duplicate code patterns
- [ ] 4.4 Consolidate or remove

### Task 5: Final Verification

- [ ] 5.1 Run `wc -l src/App.tsx` - Document final count
- [ ] 5.2 Run full test suite
- [ ] 5.3 Run smoke test checklist
- [ ] 5.4 Document final architecture
- [ ] 5.5 If target not met, document blockers and recommendations

## Dev Notes

### Estimation

- **Points:** 3 pts
- **Risk:** LOW - Cleanup and documentation

### Dependencies

- **Requires:**
  - Story 30 (HistoryView alignment) - MUST be done
  - Story 31 (TrendsView alignment) - MUST be done
  - Story 32 (BatchReviewView alignment) - MUST be done
  - Story 33 (TransactionEditorView alignment) - MUST be done
  - Story 34 (Remaining hooks) - MUST be done
- **Blocks:** Epic retrospective

### Target Breakdown

To reach 1,500-2,000 lines, the following distribution is expected:

| Category | Target Lines | Notes |
|----------|-------------|-------|
| Imports | ~50 | Reduced by extracting components |
| Types | ~20 | Minimal, most in separate files |
| State declarations | ~150 | Cannot reduce much |
| Hook calls | ~100 | Composition hooks + library hooks |
| Effects | ~100 | App-level lifecycle only |
| Memoized values | ~50 | Computed values |
| Handler definitions | ~200 | Business logic that must stay |
| Main component body | ~100 | Provider wrapping, view routing |
| Render switch | ~200 | View selection logic |
| **Total** | **~970-1,000** | Realistic minimum |

This suggests the target of 1,500-2,000 is achievable, with ~500-1,000 lines buffer for:
- Comments and documentation
- Edge case handling
- Feature flags
- Debug logging

### If Target Not Achievable

Document:
1. What blocks further reduction
2. What the realistic minimum is
3. Recommendations for future work
4. Whether the current state is maintainable

## References

- [Story 29 Feature Review](14c-refactor-29-app-prop-composition-integration.md) - Started this work
- [Epic 14c-refactor Tech Context](../tech-context-epic14c-refactor.md) - Original goals
- [Source: src/App.tsx] - Target file

## File List

**Modified:**
- `src/App.tsx` - Final cleanup
- `src/components/App/viewRenderers.tsx` - Possibly add render functions
- `src/hooks/app/index.ts` - Possibly add handler hooks

**Created:**
- `docs/sprint-artifacts/epic14c-refactor/app-architecture-final.md` - Documentation
