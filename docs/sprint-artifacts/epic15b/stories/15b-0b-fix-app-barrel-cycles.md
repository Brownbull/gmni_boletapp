# Story 15b-0b: Fix App Barrel Cycles (3/6 Circular Deps)

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Break `components/App/index.ts` barrel which re-exports `viewRenderers.tsx`, creating 3 of 6 circular dependencies when views import back from the barrel. This single barrel fix resolves half of all circular dependencies in one shot.

**Root cause:** The barrel re-exports ALL viewRenderers symbols (render functions + prop types). `viewRenderers.tsx` imports 13 view components. Several views import `View` type back from the barrel, closing the cycle: barrel → viewRenderers → view → barrel.

**Fix approach (Option B — full cleanup):** Redirect ALL `View` type imports to `@app/types` (canonical source) AND remove viewRenderers re-exports from the barrel entirely. This eliminates the root cause, not just the symptoms, and prevents future regressions.

## Background

Cycles caused by the barrel (from depcruise analysis):
1. **Cycle 1 (10 nodes):** App/index.ts → viewRenderers → TransactionEditorView → batch-review → App/index.ts
2. **Cycle 2 (4 nodes):** App/index.ts → viewRenderers → ItemsView → App/index.ts
3. **Cycle 3 (3 nodes):** App/index.ts → viewRenderers → HistoryView → App/index.ts

## Functional Acceptance Criteria

- [ ] **AC1:** `components/App/index.ts` no longer re-exports any symbols from `viewRenderers.tsx`
- [ ] **AC2:** All consumers of `View` type updated to import from `@app/types` instead of barrel
- [ ] **AC3:** 3 barrel-related circular deps resolved (depcruise shows ≤3 remaining cycles)
- [ ] **AC4:** `npm run test:quick` passes
- [ ] **AC5:** `npx tsc --noEmit` passes with zero errors

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements
- **AC-ARCH-LOC-1:** Canonical `View` type definition remains at `src/app/types.ts` — no other file defines it
- **AC-ARCH-LOC-2:** Backward-compat re-export of `View` in `src/components/App/types.ts` kept (other consumers use it)
- **AC-ARCH-LOC-3:** View render functions only importable from `src/components/App/viewRenderers.tsx`, NOT from barrel

### Pattern Requirements
- **AC-ARCH-PATTERN-1:** All `View` type imports in modified files use the `@app/types` path alias — zero `import.*View.*from.*components/App` matches in `src/views/`, `src/hooks/app/`, `src/features/batch-review/`
- **AC-ARCH-PATTERN-2:** `src/App.tsx` imports render functions directly from `./components/App/viewRenderers`, NOT from barrel
- **AC-ARCH-PATTERN-3:** Barrel at `src/components/App/index.ts` exports only: types (View, Theme, etc.), view classification utilities (shouldShowTopHeader, isFullScreenView), and architectural components (AppErrorBoundary, AppLayout, AppMainContent, AppRoutes, AppOverlays)
- **AC-ARCH-PATTERN-4:** After all changes, `npx tsc --noEmit` passes with zero errors

### Anti-Pattern Requirements (Must NOT Happen)
- **AC-ARCH-NO-1:** Barrel MUST NOT re-export any symbol from `./viewRenderers` — prevents circular deps
- **AC-ARCH-NO-2:** No file in `src/views/`, `src/hooks/app/`, or `src/features/batch-review/` imports `View` from barrel
- **AC-ARCH-NO-3:** No new `import type { View }` line uses relative path to `components/App` or `components/App/types` — all use `@app/types`
- **AC-ARCH-NO-4:** MUST NOT use `React.lazy()` or async imports — fix is static import path change only

## File Specification

| # | File/Component | Exact Path | Action | AC Reference |
|---|----------------|------------|--------|--------------|
| 1 | App barrel | `src/components/App/index.ts` | MODIFY — remove viewRenderers re-export block (lines 72-123) | AC1, AC-ARCH-NO-1 |
| 2 | App root | `src/App.tsx` | MODIFY — split barrel import into direct imports | AC-ARCH-PATTERN-2 |
| 3 | HistoryView | `src/views/HistoryView.tsx` | MODIFY — line 59: `../components/App` → `@app/types` | AC2, AC-ARCH-PATTERN-1 |
| 4 | ItemsView | `src/views/ItemsView/ItemsView.tsx` | MODIFY — line 71: `@/components/App` → `@app/types` | AC2, AC-ARCH-PATTERN-1 |
| 5 | TrendsView | `src/views/TrendsView/TrendsView.tsx` | MODIFY — line 74: `../../components/App/types` → `@app/types` | AC-ARCH-NO-3 (consistency) |
| 6 | batch-review types | `src/features/batch-review/handlers/types.ts` | MODIFY — line 20: `@/components/App` → `@app/types` | AC2, AC-ARCH-PATTERN-1 |
| 7 | useBatchReviewHandlers | `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | MODIFY — line 24: `@/components/App` → `@app/types` | AC2, AC-ARCH-PATTERN-1 |
| 8 | useDialogHandlers | `src/hooks/app/useDialogHandlers.ts` | MODIFY — line 61: `../../components/App` → `@app/types` | AC2, AC-ARCH-NO-2 |
| 9 | useNavigationHandlers | `src/hooks/app/useNavigationHandlers.ts` | MODIFY — line 52: `../../components/App` → `@app/types` | AC2, AC-ARCH-NO-2 |
| 10 | useTransactionHandlers | `src/hooks/app/useTransactionHandlers.ts` | MODIFY — line 44: `../../components/App` → `@app/types` | AC2, AC-ARCH-NO-2 |
| 11 | useScanHandlers | `src/hooks/app/useScanHandlers.ts` | MODIFY — line 48: `../../components/App` → `@app/types` | AC2, AC-ARCH-NO-2 |
| 12 | useNavigationHandlers test | `tests/unit/hooks/app/useNavigationHandlers.test.ts` | MODIFY — line 16: `../../../../src/components/App` → `@app/types` | AC2 |

## Tasks / Subtasks

- [x] **Task 1:** Redirect all `View` type imports from barrel to `@app/types` (9 files + 1 test)
  - [x] Change `src/views/HistoryView.tsx` line 59
  - [x] Change `src/views/ItemsView/ItemsView.tsx` line 71
  - [x] Change `src/views/TrendsView/TrendsView.tsx` line 74 (consistency)
  - [x] Change `src/features/batch-review/handlers/types.ts` line 20
  - [x] Change `src/features/batch-review/hooks/useBatchReviewHandlers.ts` line 24
  - [x] Change `src/hooks/app/useDialogHandlers.ts` line 61
  - [x] Change `src/hooks/app/useNavigationHandlers.ts` line 52
  - [x] Change `src/hooks/app/useTransactionHandlers.ts` line 44
  - [x] Change `src/hooks/app/useScanHandlers.ts` line 48
  - [x] Change `tests/unit/hooks/app/useNavigationHandlers.test.ts` line 16
- [x] **Task 2:** Update `App.tsx` and clean barrel (2 files)
  - [x] Split `App.tsx` barrel import (lines 17-27) into: barrel for AppLayout/AppOverlays/shouldShowTopHeader, `@app/types` for View, direct `./components/App/viewRenderers` for render functions
  - [x] Remove viewRenderers re-export block from `src/components/App/index.ts` (lines 72-123)
- [x] **Task 3:** Verify and test
  - [x] Run `npx tsc --noEmit` — 0 errors
  - [x] Run `npm run test:quick` — all pass (281 files, 6884 tests)
  - [x] depcruise not installed locally — verified cycle removal logically (barrel no longer imports viewRenderers, views no longer import from barrel)
  - [x] Grep for remaining barrel imports: zero matches in src/views/, src/hooks/app/, src/features/batch-review/

## Dev Notes

### Architecture Guidance

**Type import chain after change:**
```
Current:  View consumer --> components/App/index.ts --> components/App/types.ts --> @app/types
After:    View consumer --> @app/types  (direct, 0 intermediaries)
```

**Barrel structure after change** — retains only:
- Types re-exports from `./types` (View, Theme, ColorTheme, FontFamily, layout props)
- View classification utilities (FULL_SCREEN_VIEWS, shouldShowTopHeader, isFullScreenView)
- Architectural components (AppErrorBoundary, AppLayout, AppMainContent, AppRoutes, AppOverlays)

**Key insight:** The `View` type already lives canonically at `src/app/types.ts` and the `@app/*` alias is configured in both `tsconfig.json` (line 25) and `vite.config.ts` (line 77). Two files already use `@app/types` — this redirects the rest.

### Technical Notes

- No specialized technical review required (no database or auth concerns)
- All changes are `import type` — zero runtime effect
- No mocks target the barrel for `View` type — zero mock path updates needed
- Only 1 test file needs updating (`useNavigationHandlers.test.ts`)

### What NOT to Change
- `src/components/App/types.ts` backward-compat re-export: KEEP (other consumers use it)
- `src/components/App/viewRenderers.tsx` internal `import type { View } from './types'`: KEEP (local, not barrel-traversing)
- `src/main.tsx` import of `AppErrorBoundary` from barrel: KEEP (not cycle-related)

### Execution Order
1. Redirect all `View` type imports first (Task 1) — safe to do independently
2. Split `App.tsx` imports + remove viewRenderers from barrel (Task 2) — do after Task 1
3. Run `npx tsc --noEmit` after each task to catch import resolution issues atomically
4. Full verification (Task 3)

### Verification Commands
```bash
# Check for remaining barrel imports of View in cycle-participating dirs
grep -rn "import.*View.*from.*components/App" src/views/ src/hooks/app/ src/features/batch-review/

# Check barrel no longer exports viewRenderers symbols
grep "viewRenderers\|renderDashboardView\|renderViewSwitch" src/components/App/index.ts

# Run depcruise to verify cycle count reduced
npx depcruise --output-type err src/

# Type check
npx tsc --noEmit

# Quick test
npm run test:quick
```

### E2E Testing
E2E coverage not applicable — pure import refactoring with no UI/behavior changes.

## ECC Analysis Summary
- Risk Level: LOW
- Complexity: Simple
- Sizing: SMALL (2 pts) — 3 tasks, 14 subtasks, 12 files
- Agents consulted: Planner, Architect
