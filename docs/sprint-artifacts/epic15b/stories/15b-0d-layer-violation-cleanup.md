# Story 15b-0d: Layer Violation Cleanup

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Fix 8 layer violations, all concentrated in `src/hooks/app/`. Hooks should not import from components or views — they should depend on abstractions (interfaces/types) instead. Extract needed types from components/views into shared type files.

## Background

All violations are in 2 hook files:
- `useDialogHandlers.ts` → imports from `components/App/` (5 edges)
- `useNavigationHandlers.ts` → imports from `components/App/` (2 edges)
- `useNavigationHandlers.ts` → imports from `views/TrendsView/` (1 edge)

Expected layer flow: `views → components → features → hooks/services → shared → utils/types`
Violations: hooks importing upward into components and views.

## Acceptance Criteria

- [ ] **AC1:** `useDialogHandlers.ts` no longer imports from `components/App/`
- [ ] **AC2:** `useNavigationHandlers.ts` no longer imports from `components/App/` or `views/TrendsView/`
- [ ] **AC3:** 0 layer violations remaining (depcruise confirms)
- [ ] **AC4:** Extracted interfaces maintain same behavior — no logic changes
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Identify exact imports causing violations
  - [ ] List what `useDialogHandlers.ts` imports from `components/App/`
  - [ ] List what `useNavigationHandlers.ts` imports from `components/App/` and `views/TrendsView/`
- [ ] **Task 2:** Extract needed types/interfaces to shared location
  - [ ] Create interface files in `src/types/` or `src/shared/types/`
  - [ ] Define interfaces that match the consumed API surface
- [ ] **Task 3:** Update hooks to import from shared types
  - [ ] Replace concrete component imports with interface imports
- [ ] **Task 4:** Verify with depcruise — 0 violations
- [ ] **Task 5:** Run `npm run test:quick` and fix any breakage

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/app/useDialogHandlers.ts` | MODIFY | Replace component imports with interface imports |
| `src/hooks/app/useNavigationHandlers.ts` | MODIFY | Replace component/view imports with interface imports |
| `src/shared/types/appInterfaces.ts` | CREATE | Extracted interfaces from components/views |

## Dev Notes

- This is a pure interface extraction — no behavior changes
- The hooks likely import view/component constants or type definitions — extract only what's needed
- If a hook needs a React component reference (e.g., for rendering), consider passing it as a parameter instead of importing it
- Run depcruise after each file change to track violation count decreasing
