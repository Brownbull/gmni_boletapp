# Story 15b-1j: Consolidate features/settings/

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Move SettingsView directory (3 source files, ~1,052 lines) and 3 settings-specific components from `src/components/` (788 lines total) into `features/settings/`. The feature already has 17 files (3,376 lines) — this consolidates the ~6 remaining scattered files plus 2 test files. Create re-export shims at old SettingsView location for backward compatibility. Follows the same shim-based pattern established by stories 15b-1a and 15b-1b.

**Key correction from draft:** 3 components in `src/components/` (`NotificationSettings`, `PWASettingsSection`, `TrustedMerchantsList`) are each imported by exactly ONE settings subview — they are settings-specific and should consolidate with the feature. No shims needed for these 3 components (zero external consumers).

## Functional Acceptance Criteria

- [x] **AC1:** SettingsView/ directory and all 3 source modules moved into `features/settings/views/SettingsView/`
- [x] **AC2:** 3 settings-specific components moved from `src/components/` into `features/settings/components/`
- [x] **AC3:** All relative imports in moved component files converted to `@/` path aliases
- [x] **AC4:** 2 test files migrated alongside source files (mirror structure)
- [x] **AC5:** Re-export shims at `src/views/SettingsView/` (barrel + useSettingsViewData) for backward compatibility — 2 source consumers + 1 test mock resolved without modification
- [x] **AC6:** Feature barrel `src/features/settings/index.ts` updated with views export via barrel chain
- [x] **AC7:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** All 3 SettingsView source modules located under `src/features/settings/views/SettingsView/`
- [x] **AC-ARCH-LOC-2:** SettingsView barrel at `src/features/settings/views/SettingsView/index.ts` preserving all existing exports (`SettingsView`, `SettingsViewProps`, `SettingsViewTestOverrides`, `useSettingsViewData`, all type exports)
- [x] **AC-ARCH-LOC-3:** Views sub-barrel at `src/features/settings/views/index.ts`
- [x] **AC-ARCH-LOC-4:** Feature barrel at `src/features/settings/index.ts` containing `export * from './views'` AND `export * from './components'`
- [x] **AC-ARCH-LOC-5:** Barrel re-export shim at `src/views/SettingsView/index.ts`
- [x] **AC-ARCH-LOC-6:** Deep re-export shim at `src/views/SettingsView/useSettingsViewData.ts`
- [x] **AC-ARCH-LOC-7:** 3 settings-specific components located under `src/features/settings/components/`
- [x] **AC-ARCH-LOC-8:** Hook test at `tests/unit/features/settings/views/SettingsView/useSettingsViewData.test.ts`
- [x] **AC-ARCH-LOC-9:** Component test at `tests/unit/features/settings/components/TrustedMerchantsList.test.tsx`
- [x] **AC-ARCH-LOC-10:** No SettingsView source files remain at old location except the 2 shim files
- [x] **AC-ARCH-LOC-11:** No settings-specific component source files remain at `src/components/` (NotificationSettings, PWASettingsSection, TrustedMerchantsList all moved)

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel chain — `features/settings/index.ts` → `views/index.ts` → `SettingsView/index.ts` (same as `features/dashboard/`)
- [x] **AC-ARCH-PATTERN-2:** Re-export shims at old SettingsView location — 2 source consumers (`App.tsx`, `viewRenderers.tsx`) + 1 test mock (`viewRenderers.test.tsx`) resolved without modification
- [x] **AC-ARCH-PATTERN-3:** All moved component files use `@/` aliases for external imports — zero `../hooks/` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** Settings subviews (`AppView.tsx`, `LearnedDataView.tsx`) import moved components from feature-local paths (e.g., `../NotificationSettings`), not from `@/components/`
- [x] **AC-ARCH-PATTERN-5:** Internal `./` imports within SettingsView directory preserved — directory moves as unit
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/settings/` mirrors `src/features/settings/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — SettingsView must NOT import from settings top barrel (`@features/settings`), only from `@features/settings/components` (direct sub-barrel)
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/views/SettingsView' tests/unit/features/settings/` returns 0
- [x] **AC-ARCH-NO-3:** No stale component imports — `grep -r '@/components/NotificationSettings\|@/components/PWASettingsSection\|@/components/TrustedMerchantsList' src/features/settings/` returns 0
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** No behavior changes — pure structural refactoring; zero function/prop/return type changes
- [x] **AC-ARCH-NO-6:** No component shims at `src/components/` for the 3 moved components — they have zero external consumers

## File Specification

### Target Directory Structure

```
src/features/settings/
  index.ts                          # MODIFY: add export * from './views'
  views/
    index.ts                        # NEW: views sub-barrel
    SettingsView/
      SettingsView.tsx              # MOVED (zero import changes needed — all @/ aliases)
      useSettingsViewData.ts        # MOVED (zero import changes needed — all @/ aliases)
      index.ts                      # MOVED (same exports)
  components/
    index.ts                        # MODIFY: add 3 new component exports
    NotificationSettings.tsx        # MOVED + MODIFIED (../hooks/ → @/hooks/)
    PWASettingsSection.tsx          # MOVED + MODIFIED (../hooks/ → @/hooks/)
    TrustedMerchantsList.tsx        # MOVED + MODIFIED (relative imports → @/ aliases)
    SettingsBackHeader.tsx          # EXISTING (no changes)
    SettingsMenuItem.tsx            # EXISTING (no changes)
    SettingsSelect.tsx              # EXISTING (no changes)
    SignOutDialog.tsx               # EXISTING (no changes)
    subviews/
      AppView.tsx                   # MODIFY: update NotificationSettings + PWASettingsSection imports
      LearnedDataView.tsx           # MODIFY: update TrustedMerchantsList import
      (8 more subviews)             # EXISTING (no changes)

src/views/SettingsView/
  index.ts                          # REPLACED: re-export shim → @features/settings
  useSettingsViewData.ts            # NEW: deep re-export shim for test mocks

tests/unit/features/settings/
  views/SettingsView/
    useSettingsViewData.test.ts     # MOVED + import path updated
  components/
    TrustedMerchantsList.test.tsx   # MOVED + import path updated
```

### File Action Table

| File/Component | Exact Path | Action | AC Reference |
|----------------|------------|--------|--------------|
| SettingsView.tsx | `src/features/settings/views/SettingsView/SettingsView.tsx` | MOVE | AC-ARCH-LOC-1 |
| useSettingsViewData.ts | `src/features/settings/views/SettingsView/useSettingsViewData.ts` | MOVE | AC-ARCH-LOC-1 |
| SettingsView barrel | `src/features/settings/views/SettingsView/index.ts` | MOVE | AC-ARCH-LOC-2 |
| NotificationSettings.tsx | `src/features/settings/components/NotificationSettings.tsx` | MOVE + MODIFY | AC-ARCH-LOC-7 |
| PWASettingsSection.tsx | `src/features/settings/components/PWASettingsSection.tsx` | MOVE + MODIFY | AC-ARCH-LOC-7 |
| TrustedMerchantsList.tsx | `src/features/settings/components/TrustedMerchantsList.tsx` | MOVE + MODIFY | AC-ARCH-LOC-7 |
| Views sub-barrel | `src/features/settings/views/index.ts` | CREATE | AC-ARCH-LOC-3 |
| Feature barrel | `src/features/settings/index.ts` | MODIFY | AC-ARCH-LOC-4 |
| Components barrel | `src/features/settings/components/index.ts` | MODIFY | AC-ARCH-LOC-7 |
| AppView.tsx | `src/features/settings/components/subviews/AppView.tsx` | MODIFY (imports) | AC-ARCH-PATTERN-4 |
| LearnedDataView.tsx | `src/features/settings/components/subviews/LearnedDataView.tsx` | MODIFY (imports) | AC-ARCH-PATTERN-4 |
| Barrel shim | `src/views/SettingsView/index.ts` | REPLACE (shim) | AC-ARCH-LOC-5 |
| Deep shim | `src/views/SettingsView/useSettingsViewData.ts` | CREATE (shim) | AC-ARCH-LOC-6 |
| useSettingsViewData test | `tests/unit/features/settings/views/SettingsView/useSettingsViewData.test.ts` | MOVE + MODIFY | AC-ARCH-LOC-8 |
| TrustedMerchantsList test | `tests/unit/features/settings/components/TrustedMerchantsList.test.tsx` | MOVE + MODIFY | AC-ARCH-LOC-9 |

### Files That Do NOT Move

| File | Reason |
|------|--------|
| `src/App.tsx` | Consumer — resolves via shim at old location |
| `src/components/App/viewRenderers.tsx` | Consumer — resolves via shim at old location |
| `tests/unit/components/App/viewRenderers.test.tsx` | Consumer test — vi.mock resolves via shim |
| `src/components/ProfileDropdown.tsx` | Cross-feature (7 importers across 6 views + TopHeader) — NOT settings-specific |

## Tasks / Subtasks

### Task 1: Move SettingsView source files and create barrel chain (6 files)

- [x] 1.1 Create target directory `src/features/settings/views/SettingsView/`
- [x] 1.2 `git mv` all 3 files from `src/views/SettingsView/` to `src/features/settings/views/SettingsView/`
- [x] 1.3 Verify: SettingsView.tsx and useSettingsViewData.ts use ALL `@/` aliases — expect ZERO import changes
- [x] 1.4 Create views sub-barrel at `src/features/settings/views/index.ts` (`export * from './SettingsView'`)
- [x] 1.5 Update feature barrel `src/features/settings/index.ts` to add `export * from './views'`
- [x] 1.6 Run `npx tsc --noEmit` — fix any type errors

### Task 2: Create re-export shims at old SettingsView location (2 files)

- [x] 2.1 Create barrel shim at `src/views/SettingsView/index.ts` (re-exports from `@features/settings/views/SettingsView`)
- [x] 2.2 Create deep shim at `src/views/SettingsView/useSettingsViewData.ts` (re-exports for test mock paths)
- [x] 2.3 Run `npx tsc --noEmit` — verify shims resolve correctly

### Task 3: Move settings-specific components and update consumers (6 files)

- [x] 3.1 `git mv` 3 components from `src/components/` to `src/features/settings/components/`:
  - `NotificationSettings.tsx`
  - `PWASettingsSection.tsx`
  - `TrustedMerchantsList.tsx`
- [x] 3.2 Convert relative imports to `@/hooks/` aliases in moved files:
  - `NotificationSettings.tsx`: `'../hooks/usePushNotifications'` → `'@/hooks/usePushNotifications'`
  - `PWASettingsSection.tsx`: `'../hooks/usePWAInstall'` → `'@/hooks/usePWAInstall'`, `'../hooks/usePWAUpdate'` → `'@/hooks/usePWAUpdate'`
  - `TrustedMerchantsList.tsx`: verify and fix all relative imports
- [x] 3.3 Update `src/features/settings/components/index.ts` — add 3 new exports
- [x] 3.4 Update `AppView.tsx` imports: `@/components/NotificationSettings` → `'../NotificationSettings'`, `@/components/PWASettingsSection` → `'../PWASettingsSection'`
- [x] 3.5 Update `LearnedDataView.tsx` import: `@/components/TrustedMerchantsList` → `'../TrustedMerchantsList'`
- [x] 3.6 Run `npx tsc --noEmit` — fix any type errors

### Task 4: Move test files and fix imports/mocks (2 files)

- [x] 4.1 Create target directories:
  - `tests/unit/features/settings/views/SettingsView/`
  - `tests/unit/features/settings/components/`
- [x] 4.2 `git mv` test files:
  - `tests/unit/views/SettingsView/useSettingsViewData.test.ts` → `tests/unit/features/settings/views/SettingsView/`
  - `tests/unit/components/TrustedMerchantsList.test.tsx` → `tests/unit/features/settings/components/`
- [x] 4.3 Update import in useSettingsViewData test:
  - `@/views/SettingsView/useSettingsViewData` → `@features/settings/views/SettingsView/useSettingsViewData`
- [x] 4.4 Update imports in TrustedMerchantsList test:
  - `@/components/TrustedMerchantsList` → `@features/settings/components/TrustedMerchantsList`
- [x] 4.5 Run `npx vitest run tests/unit/features/settings/` — fix failures atomically

### Task 5: Verification and cleanup

- [x] 5.1 Grep: `grep -r '@/views/SettingsView' tests/unit/features/settings/` returns 0
- [x] 5.2 Grep: `grep -r '@/components/NotificationSettings\|@/components/PWASettingsSection\|@/components/TrustedMerchantsList' src/features/settings/` returns 0
- [x] 5.3 Grep: `grep -rE "from '\.\./hooks/" src/features/settings/components/NotificationSettings.tsx src/features/settings/components/PWASettingsSection.tsx` returns 0
- [x] 5.4 Verify external consumers: `npx vitest run tests/unit/components/App/viewRenderers.test.tsx`
- [x] 5.5 Run `npm run test:quick` — all tests pass
- [x] 5.6 Verify no circular deps: `npx madge --circular src/features/settings/`

## Dev Notes

### Architecture Guidance

**Import rewiring strategy:** SettingsView.tsx and useSettingsViewData.ts already use 100% `@/` and `@features/` path aliases — ZERO import changes needed in the view files. Only the 3 moved component files need import updates (relative `../hooks/` → `@/hooks/` aliases). This is simpler than 15b-1b.

**Re-export shim justification:** 2 source consumers (`App.tsx`, `viewRenderers.tsx`) + 1 test consumer mock (`viewRenderers.test.tsx`) = 3 total dependents. Shims cost 2 trivial files and prevent breaking 3 consumers. The `useSettingsViewData.ts` deep shim is needed because test mock paths don't follow barrel re-exports.

**No component shims needed:** `NotificationSettings`, `PWASettingsSection`, and `TrustedMerchantsList` each have exactly 1 consumer inside `features/settings/` subviews. Zero external consumers. Just update the 2 subview imports directly.

**Barrel chain:** `features/settings/index.ts` → `views/index.ts` → `SettingsView/index.ts` (matches `features/dashboard/` and `features/analytics/` structure).

**SettingsView ↔ settings barrel safety:** SettingsView.tsx imports from `@features/settings/components` which resolves directly to the sub-barrel, NOT through the top-level `@features/settings` barrel. This avoids circular dependencies.

### Critical Pitfalls

1. **git mv order:** Move all source files first (including old index.ts), THEN create shim files at old location. If you create shims before moving, git sees conflicts.

2. **`useSettingsViewData.ts` shim vs source:** After `git mv`, the original 611-line file no longer exists at old location. The shim is a NEW file with only re-export statements. Do NOT accidentally leave the original behind.

3. **Component relative imports:** `NotificationSettings.tsx` and `PWASettingsSection.tsx` use `'../hooks/...'` which resolves to `src/hooks/` from `src/components/`. After moving to `src/features/settings/components/`, this relative path breaks. Must convert to `@/hooks/...`.

4. **Test fixture paths:** Check if moved test files import from relative fixture paths and update accordingly.

### E2E Testing

No E2E testing needed — pure structural refactoring with zero behavior changes.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple (mechanical file moves + import rewiring)
- **Sizing:** MEDIUM (5 tasks, 16 subtasks, 15 files)
- **Classification:** SIMPLE
- **Agents consulted:** Planner (architect skipped — pattern reference from 15b-1b sufficient)

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-15
- **ECC Agents:** code-reviewer (sonnet), security-reviewer (sonnet), architect (sonnet), tdd-guide (haiku)
- **Classification:** COMPLEX (file_count 15 > 10 threshold)
- **Outcome:** APPROVE 9.69/10
- **Findings:** 4 LOW (all pre-existing — file sizes below Phase 2 threshold, console.error in catch blocks)
- **Quick Fixes:** 0
- **TD Stories Created:** 0
- **Architectural ACs:** 23/23 PASS (11 location + 6 pattern + 6 anti-pattern)
- **Session Cost:** $9.25
