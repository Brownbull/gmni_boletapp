# Story 15b-0b: Fix App Barrel Cycles (3/6 Circular Deps)

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** drafted

## Description

Break `components/App/index.ts` barrel which re-exports `viewRenderers.tsx`, creating 3 of 6 circular dependencies when views import back from the barrel. This single barrel fix resolves half of all circular dependencies in one shot.

## Background

Cycles caused by the barrel:
1. App → viewRenderers → TransactionEditor → batch-review → App (10 nodes)
2. App → viewRenderers → ItemsView → App (4 nodes)
3. App → viewRenderers → HistoryView → App (3 nodes)

## Acceptance Criteria

- [ ] **AC1:** `components/App/index.ts` no longer re-exports symbols that create import cycles
- [ ] **AC2:** All consumers updated to use direct imports instead of barrel
- [ ] **AC3:** 3 barrel-related circular deps resolved (depcruise shows ≤3 remaining cycles)
- [ ] **AC4:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Audit `components/App/index.ts` — list all re-exports and identify which create cycles
  - [ ] Map which views import from the App barrel
  - [ ] Map which barrel exports are consumed by views
- [ ] **Task 2:** Remove cycle-creating re-exports from barrel
  - [ ] Keep only exports that don't create circular paths
- [ ] **Task 3:** Update all consumers to use direct imports
  - [ ] Find all files importing from `components/App/` or `@app/`
  - [ ] Replace barrel imports with direct file imports
- [ ] **Task 4:** Verify with depcruise — ≤3 cycles remaining
- [ ] **Task 5:** Run `npm run test:quick` and fix any breakage

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/components/App/index.ts` | MODIFY | Remove cycle-creating re-exports |
| `src/components/App/viewRenderers.tsx` | MODIFY | Update imports if needed |
| Consumer files (views, features) | MODIFY | Replace barrel imports with direct imports |

## Dev Notes

- The key insight is that barrels create cycles when module A re-exports module B, and module B imports from module A's barrel
- Use `npx depcruise --output-type err src/` to verify cycles before and after
- Consider whether viewRenderers should be moved out of components/App/ entirely
- Lazy imports (`React.lazy()`) break the synchronous import cycle — consider for view imports in viewRenderers
