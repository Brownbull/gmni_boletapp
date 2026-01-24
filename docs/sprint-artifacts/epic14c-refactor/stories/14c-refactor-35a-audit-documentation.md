# Story 14c-refactor.35a: Final Cleanup - Audit & Documentation

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **a complete audit of remaining code in App.tsx**,
So that **we have clear documentation of what can move, what must stay, and why**.

## Background

### Part of Story 35 Split

This story is Part A of 4 stories split from the original story 14c-refactor.35 (Final App.tsx Line Count Target). The split was performed via `atlas-story-sizing` workflow because the original story exceeded sizing guidelines (5 tasks, 23 subtasks vs max 4 tasks, 15 subtasks).

**Split breakdown:**
- **35a (this story):** Audit & Documentation (Task 1)
- **35b:** View Render Functions (Task 2)
- **35c:** Handler Hook Extraction (Task 3)
- **35d:** Dead Code & Verification (Tasks 4-5)

### Current State

After completing stories 30-34, App.tsx is **4,221 lines**. The target is 1,500-2,000 lines. This audit provides the foundation for the subsequent cleanup stories.

## Acceptance Criteria

1. **Given** App.tsx is ~3,700 lines after stories 30-34
   **When** this story is completed
   **Then:**
   - All remaining code is categorized by type
   - Each code block has a "can move" or "must stay" designation
   - "Must stay" items have documented reasons

2. **Given** the audit is complete
   **When** developers review the output
   **Then:**
   - A clear list of code blocks that can move to viewRenderers.tsx
   - A clear list of handlers that can become hooks
   - A clear list of dead code for removal

## Tasks / Subtasks

### Task 1: Audit Remaining Code

- [x] 1.1 Categorize all remaining code in App.tsx
  - State declarations (count lines)
  - Hook calls (count lines)
  - Effect hooks (count lines)
  - Handler functions (list each with line count)
  - View rendering code (count lines)
  - Overlay/dialog rendering (count lines)
  - Miscellaneous (imports, types, etc.)
- [x] 1.2 Identify code that can move to viewRenderers.tsx
  - Views without composition hooks
  - Render helpers that belong with views
- [x] 1.3 Identify handlers that can become hooks
  - Group by domain (insight, credit, session, etc.)
  - Estimate line savings per extraction
- [x] 1.4 Identify dead code for removal
  - Unused imports
  - Unused variables
  - Commented code blocks
  - Duplicate patterns
- [x] 1.5 Document "must remain" items with reasons
  - State that must be in App.tsx (why?)
  - Handlers that can't be extracted (why?)
  - Code coupled to multiple features

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Update Background section line count: "~3,700 lines" → "4,221 lines" [story:25]
- [x] [AI-Review][MEDIUM] Update Dev Notes output filename: `app-tsx-audit-report.md` → `35a-app-audit-report.md` [story:91]
- [x] [AI-Review][MEDIUM] Fix audit report Section 4.1: `_processBatchImages_DEPRECATED` is 91 lines (not ~200) [audit:272]
  - **VERIFIED**: Function is 205 lines (lines 1947-2151). Audit's "~200" is CORRECT. Review finding was incorrect.
- [x] [AI-Review][MEDIUM] Remove audit report Section 4.2 (commented view blocks) - patterns not found in App.tsx [audit:274-280]
  - **VERIFIED**: Commented blocks DO exist at lines 3493-3524. Audit is CORRECT. Review finding was incorrect.
- [x] [AI-Review][LOW] Align target line count between story (1,500-2,000) and audit report (1,000-1,200) [story:25, audit:6]

## Dev Notes

### Estimation

- **Points:** 1 pt
- **Risk:** LOW - Analysis and documentation only

### Dependencies

- **Requires:**
  - Story 30c (HistoryView integration) - MUST be done
  - Story 31c (TrendsView integration) - MUST be done
  - Story 32c (BatchReviewView integration) - MUST be done
  - Story 33c (TransactionEditorView integration) - MUST be done
  - Story 34c (Remaining hooks) - MUST be done
- **Blocks:** Stories 35b, 35c, 35d

### Output Format

Create an audit report as a markdown file:
`docs/sprint-artifacts/epic14c-refactor/35a-app-audit-report.md`

Structure:
1. Line count summary by category
2. "Can move" items (with destination)
3. "Can extract" handlers (with proposed hook name)
4. Dead code list
5. "Must remain" items with rationale

## References

- [Original Story 35](14c-refactor-35-final-app-line-count-target.md) - Original story (split)
- [Source: src/App.tsx] - Target file

## Dev Agent Record

### Completion Notes (2026-01-24)

**Review Follow-up Resolution:**

1. ✅ Updated Background section line count from "~3,700 lines" to "4,221 lines"
2. ✅ Updated Dev Notes output filename to match actual file: `35a-app-audit-report.md`
3. ✅ Verified audit Section 4.1 - `_processBatchImages_DEPRECATED` is 205 lines (lines 1947-2151). Audit's "~200" estimate was accurate. Review finding claiming "91 lines" was incorrect.
4. ✅ Verified audit Section 4.2 - Commented view blocks DO exist at App.tsx lines 3493-3524 (ScanView, ScanResultView, EditView). Review finding claiming "patterns not found" was incorrect.
5. ✅ Aligned audit report target line count (1,000-1,200 → 1,500-2,000) to match story requirements

**Acceptance Criteria Verification:**
- AC1: All remaining code categorized (Sections 1.1-1.8 in audit)
- AC2: Clear lists provided - viewRenderers candidates (Section 2), handler extraction candidates (Section 3), dead code (Section 4)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-24 | AI Dev | Initial audit completed (Tasks 1.1-1.5) |
| 2026-01-24 | AI Review | Code review: 5 items flagged |
| 2026-01-24 | AI Dev | Review follow-ups resolved (2 items corrected, 2 verified incorrect, 1 aligned) |
| 2026-01-24 | AI Review | Atlas code review: 1 MEDIUM, 2 LOW issues found |
| 2026-01-24 | AI Dev | Code review fixes: File List deduplication, Appendix B clarification, Gap Analysis added |

## File List

**Modified:**
- `docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-35a-audit-documentation.md` - Story updates

**Created:**
- `docs/sprint-artifacts/epic14c-refactor/35a-app-audit-report.md` - Comprehensive audit documentation (target aligned per review follow-up)
