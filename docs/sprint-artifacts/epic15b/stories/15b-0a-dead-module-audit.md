# Story 15b-0a: Dead Module Audit

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Verify 5 suspect entry points identified by dependency analysis (modules with 0 incoming dependencies) and delete confirmed dead code. This establishes a clean baseline before file consolidation begins.

Note: `views/EditView.tsx` and `views/ScanResultView.tsx` also appear as entry points but are loaded via dynamic import in `viewRenderers.tsx` — they are NOT dead.

## Acceptance Criteria

- [ ] **AC1:** All 5 suspect modules verified via grep for imports/references
- [ ] **AC2:** Confirmed dead modules deleted with their barrel exports updated
- [ ] **AC3:** `npm run test:quick` passes after deletions
- [ ] **AC4:** 0 orphaned modules in depcruise output

## Tasks

- [ ] **Task 1:** Grep each suspect for imports/references across codebase
  - [ ] `hooks/useAirlocks.ts` — check all imports
  - [ ] `hooks/useDialogResolution.ts` — check all imports
  - [ ] `utils/semanticColors.ts` — check all imports
  - [ ] `components/charts/*.tsx` (2 files) — check all imports
  - [ ] `features/settings/components/subviews/DatosAprendidosView.tsx` — check imports and route config
- [ ] **Task 2:** Delete confirmed dead modules
- [ ] **Task 3:** Update barrel exports that referenced deleted modules
- [ ] **Task 4:** Run `npm run test:quick` and fix any breakage

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAirlocks.ts` | VERIFY/DELETE | Check if dead, delete if confirmed |
| `src/hooks/useDialogResolution.ts` | VERIFY/DELETE | Check if dead, delete if confirmed |
| `src/utils/semanticColors.ts` | VERIFY/DELETE | Check if dead, delete if confirmed |
| `src/components/charts/*.tsx` | VERIFY/DELETE | Check 2 chart files if dead |
| `src/features/settings/components/subviews/DatosAprendidosView.tsx` | VERIFY/DELETE | Check if dead |
| Barrel `index.ts` files | MODIFY | Remove exports for deleted modules |

## Dev Notes

- Use `grep -r "useAirlocks" src/` (or ast-grep) to find all references — imports AND string references
- Check route configs, lazy imports, and dynamic imports — not just static imports
- If a module is used only in tests, it's still dead (test-only usage doesn't justify keeping source)
- Run depcruise after cleanup to verify 0 orphans
