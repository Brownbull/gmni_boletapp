# Story 15b-4f: App.tsx Fan-Out Reduction

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** drafted

## Description

Reduce App.tsx's outgoing dependency count from 74 to <30 by extracting feature orchestrators. App.tsx was assessed as "irreducible orchestration" in Epic 15 Phase 5f, but with feature modules now holding more logic (after Phases 1-3), further extraction should be possible.

## Acceptance Criteria

- [ ] **AC1:** App.tsx fan-out reduced from 74 to <30 outgoing dependencies
- [ ] **AC2:** Extracted orchestrators are cohesive feature entry points
- [ ] **AC3:** App.tsx line count decreased (secondary to fan-out reduction)
- [ ] **AC4:** No behavioral changes — pure structural extraction
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Analyze App.tsx's 74 dependencies — categorize by feature
  - [ ] Which imports belong to analytics? dashboard? scan? etc.
  - [ ] Which imports are truly cross-cutting (auth, routing, theme)?
- [ ] **Task 2:** Design feature orchestrator pattern
  - [ ] Each feature gets an orchestrator that handles its App-level concerns
  - [ ] App.tsx imports orchestrators, not individual feature files
- [ ] **Task 3:** Extract feature orchestrators
  - [ ] `features/*/AppOrchestrator.tsx` or similar pattern
  - [ ] Move feature-specific App logic into orchestrators
- [ ] **Task 4:** Verify fan-out with depcruise — must be <30
- [ ] **Task 5:** Run `npm run test:quick`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | MODIFY | Reduce from 74 to <30 outgoing deps |
| `src/features/*/AppOrchestrator.tsx` | CREATE | Feature-level orchestrators |
| `src/components/App/viewRenderers.tsx` | MODIFY | May be absorbed into orchestrators |

## Dev Notes

- This builds on Phase 1 consolidation — features now contain their full code
- The key insight: App.tsx shouldn't import individual views/hooks/components — it should import feature entry points
- `viewRenderers.tsx` may become redundant if orchestrators handle view mounting
- App.tsx will remain as the top-level router/provider shell — ~400-600 lines is a good target
- Pattern reference: Next.js app router pattern where each route is a feature entry point
