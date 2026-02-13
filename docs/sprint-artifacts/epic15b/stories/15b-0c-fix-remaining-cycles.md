# Story 15b-0c: Fix Stores/ModalManager/EditorScanThumbnail Cycles (3/6)

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** drafted

## Description

Fix the remaining 3 circular dependencies after the App barrel cycles are resolved in 15b-0b. Each cycle has a different root cause requiring a distinct fix strategy.

## Background

Remaining cycles:
1. `shared/stores → useInsightStore → SessionComplete → shared/stores` (4 nodes) — barrel re-export loop
2. `ModalManager → registry → CreditInfoModal → ModalManager` (4 nodes) — registry pattern
3. `TransactionEditorViewInternal ↔ EditorScanThumbnail` (2 nodes) — bidirectional component dep

## Acceptance Criteria

- [ ] **AC1:** Stores barrel cycle resolved — direct imports instead of barrel
- [ ] **AC2:** ModalManager registry cycle resolved — lazy modal registration
- [ ] **AC3:** EditorScanThumbnail bidirectional dep resolved — shared types extracted
- [ ] **AC4:** 0 circular dependencies remaining (depcruise confirms)
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Fix stores barrel cycle
  - [ ] Remove `useInsightStore` re-export from `shared/stores/index.ts` that creates the loop
  - [ ] Update `SessionComplete` to import directly from `useInsightStore` file
  - [ ] Update other consumers of the stores barrel
- [ ] **Task 2:** Fix ModalManager registry cycle
  - [ ] Refactor modal registration to use lazy loading or dynamic import
  - [ ] Break CreditInfoModal's circular import back to ModalManager
- [ ] **Task 3:** Fix EditorScanThumbnail bidirectional dep
  - [ ] Extract shared types/props to a separate file (e.g., `editorScanTypes.ts`)
  - [ ] Both components import from the shared types file instead of each other
- [ ] **Task 4:** Verify all 6 cycles resolved with depcruise
- [ ] **Task 5:** Run `npm run test:quick` and fix any breakage

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/shared/stores/index.ts` | MODIFY | Remove cycle-creating re-export |
| `src/managers/ModalManager/registry.ts` | MODIFY | Lazy modal registration |
| `src/managers/ModalManager/ModalManager.tsx` | MODIFY | Update to support lazy modals |
| `src/views/TransactionEditorViewInternal.tsx` | MODIFY | Import from shared types |
| `src/components/EditorScanThumbnail.tsx` | MODIFY | Import from shared types |
| `src/types/editorScanTypes.ts` | CREATE | Shared types for editor-scan components |

## Dev Notes

- Depends on 15b-0b (App barrel cycles must be fixed first for clean depcruise output)
- For ModalManager: `React.lazy()` or dynamic `import()` inside a registration function breaks the sync cycle
- For EditorScanThumbnail: identify the minimum shared interface (likely props types and callback signatures)
- Pattern: when two components share types, extract to a third file that both import — never import types from a component file
