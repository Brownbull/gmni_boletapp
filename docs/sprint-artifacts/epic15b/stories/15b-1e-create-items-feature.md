# Story 15b-1e: Create & Consolidate features/items/

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Create a new `src/features/items/` module from scratch and consolidate item-related code from three distinct source locations: `src/views/ItemsView/` (3 files), `src/components/items/` (6 files), and `src/hooks/useItems.ts` + `src/hooks/useDerivedItems.ts` (2 files). This is the only Phase 1 story that creates a feature module rather than consolidating into an existing one.

Follow the shim-based backward-compatibility pattern established by sibling stories 15b-1a through 15b-1d. 13 source files (~3,021 lines) move, 5 test files move, 6 re-export shims created at 3 old locations, 5 new barrel files created.

**Key correction from draft:** The draft listed `~5 files` for components and `useItems` as the only hook. Actual count: 6 component files (5 components + barrel) + 2 hooks (useItems + useDerivedItems). `useDerivedItems.ts` is items-specific (only consumer is ItemsView.tsx).

## Functional Acceptance Criteria

- [x] **AC1:** `src/features/items/` created with FSD structure (views/, components/, hooks/, index.ts)
- [x] **AC2:** All 3 ItemsView source files moved into `src/features/items/views/ItemsView/`
- [x] **AC3:** All 5 item component files moved into `src/features/items/components/`
- [x] **AC4:** Both item hooks (useItems.ts, useDerivedItems.ts) moved into `src/features/items/hooks/`
- [x] **AC5:** All `../../` and `../` relative imports in moved files converted to `@/` path aliases (22+ conversions)
- [x] **AC6:** Re-export shims at all 3 old locations — 8 external consumers resolved without modification
- [x] **AC7:** All 5 test files migrated alongside source files to `tests/unit/features/items/`
- [x] **AC8:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Feature barrel at `src/features/items/index.ts`
- [x] **AC-ARCH-LOC-2:** Components barrel at `src/features/items/components/index.ts` (moved + possibly updated)
- [x] **AC-ARCH-LOC-3:** Hooks barrel at `src/features/items/hooks/index.ts` (new)
- [x] **AC-ARCH-LOC-4:** Views barrel at `src/features/items/views/index.ts` (new)
- [x] **AC-ARCH-LOC-5:** ItemsView barrel at `src/features/items/views/ItemsView/index.ts` (moved)
- [x] **AC-ARCH-LOC-6:** All 5 component files under `src/features/items/components/`
- [x] **AC-ARCH-LOC-7:** Both hook files (`useItems.ts`, `useDerivedItems.ts`) under `src/features/items/hooks/`
- [x] **AC-ARCH-LOC-8:** Both ItemsView files (`ItemsView.tsx`, `useItemsViewData.ts`) under `src/features/items/views/ItemsView/`
- [x] **AC-ARCH-LOC-9:** Barrel re-export shim at `src/views/ItemsView/index.ts`
- [x] **AC-ARCH-LOC-10:** Deep re-export shim at `src/views/ItemsView/useItemsViewData.ts`
- [x] **AC-ARCH-LOC-11:** Barrel re-export shim at `src/components/items/index.ts`
- [x] **AC-ARCH-LOC-12:** Deep re-export shim at `src/components/items/ItemViewToggle.tsx`
- [x] **AC-ARCH-LOC-13:** Re-export shim at `src/hooks/useItems.ts`
- [x] **AC-ARCH-LOC-14:** Re-export shim at `src/hooks/useDerivedItems.ts`
- [x] **AC-ARCH-LOC-15:** All 5 unit tests under `tests/unit/features/items/` mirroring source structure
- [x] **AC-ARCH-LOC-16:** No source files remain at old locations except the 6 shim files

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel chain — `features/items/index.ts` → `{components,hooks,views}/index.ts` → leaf modules
- [x] **AC-ARCH-PATTERN-2:** Re-export shims at all 3 old locations — 8 external consumers (6 source + 2 test) resolved without modification
- [x] **AC-ARCH-PATTERN-3:** All moved source files use `@/` aliases for external imports — zero `../../` or `../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** Intra-feature cross-subdirectory imports use `@features/items/...` deep paths (not `@/hooks/useItems`)
- [x] **AC-ARCH-PATTERN-5:** Intra-directory imports use `./` relative paths (e.g., `useDerivedItems` → `./useItems`)
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/items/{components,hooks,views}/`
- [x] **AC-ARCH-PATTERN-7:** All moved test files use canonical `@features/items/...` paths for imports and mock targets

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — items feature must NOT import from its own barrel (`@features/items`); must use deep paths (`@features/items/components/X`)
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/hooks/useItems' tests/unit/features/items/` returns 0
- [x] **AC-ARCH-NO-3:** No relative `../../` imports in moved source files — `grep -rE "from '\.\./\.\." src/features/items/` returns 0
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** No duplicate type definitions — `ItemViewMode` type exists only at new location
- [x] **AC-ARCH-NO-6:** No orphaned old files — `src/components/items/` contains only 2 shim files, `src/views/ItemsView/` only 2 shim files, no leftover source
- [x] **AC-ARCH-NO-7:** No behavior changes — pure structural refactoring; zero function/prop/return type changes

## File Specification

### Target Directory Structure

```
src/features/items/
  index.ts                          # NEW: feature barrel
  views/
    index.ts                        # NEW: views sub-barrel
    ItemsView/
      index.ts                      # MOVED: ItemsView barrel
      ItemsView.tsx                 # MOVED + MODIFIED (3 intra-feature imports)
      useItemsViewData.ts           # MOVED (no changes)
  components/
    index.ts                        # MOVED: components barrel (existing content)
    ItemCard.tsx                    # MOVED + MODIFIED (6 import conversions)
    AggregatedItemCard.tsx          # MOVED + MODIFIED (4 import conversions)
    ItemCategoryFilterBar.tsx       # MOVED + MODIFIED (3 import conversions)
    ItemIconFilterBar.tsx           # MOVED + MODIFIED (2 import conversions)
    ItemViewToggle.tsx              # MOVED (no relative imports)
  hooks/
    index.ts                        # NEW: hooks sub-barrel
    useItems.ts                     # MOVED + MODIFIED (3 import conversions)
    useDerivedItems.ts              # MOVED + MODIFIED (2 import conversions)

src/views/ItemsView/               # OLD LOCATION — shims only
  index.ts                          # REPLACED: re-export shim
  useItemsViewData.ts               # NEW: deep re-export shim

src/components/items/               # OLD LOCATION — shims only
  index.ts                          # REPLACED: re-export shim
  ItemViewToggle.tsx                # NEW: deep re-export shim

src/hooks/                          # OLD LOCATION — shims only
  useItems.ts                       # REPLACED: re-export shim
  useDerivedItems.ts                # REPLACED: re-export shim

tests/unit/features/items/          # NEW: test mirror
  views/ItemsView/
    useItemsViewData.test.ts        # MOVED + import path updated
  components/
    ItemViewToggle.test.tsx          # MOVED + import path updated
    ItemViewToggle.integration.test.tsx  # MOVED + import path updated
  hooks/
    useItems.test.ts                # MOVED + import path updated
    useDerivedItems.test.ts         # MOVED + import path updated
```

### Moved Source Files (11)

| File | From | To |
|------|------|----|
| ItemsView.tsx | `src/views/ItemsView/` | `src/features/items/views/ItemsView/` |
| useItemsViewData.ts | `src/views/ItemsView/` | `src/features/items/views/ItemsView/` |
| index.ts (views barrel) | `src/views/ItemsView/` | `src/features/items/views/ItemsView/` |
| ItemCard.tsx | `src/components/items/` | `src/features/items/components/` |
| AggregatedItemCard.tsx | `src/components/items/` | `src/features/items/components/` |
| ItemCategoryFilterBar.tsx | `src/components/items/` | `src/features/items/components/` |
| ItemIconFilterBar.tsx | `src/components/items/` | `src/features/items/components/` |
| ItemViewToggle.tsx | `src/components/items/` | `src/features/items/components/` |
| index.ts (components barrel) | `src/components/items/` | `src/features/items/components/` |
| useItems.ts | `src/hooks/` | `src/features/items/hooks/` |
| useDerivedItems.ts | `src/hooks/` | `src/features/items/hooks/` |

### Moved Test Files (5)

| File | From | To |
|------|------|----|
| useItemsViewData.test.ts | `tests/unit/views/ItemsView/` | `tests/unit/features/items/views/ItemsView/` |
| ItemViewToggle.test.tsx | `tests/unit/components/items/` | `tests/unit/features/items/components/` |
| ItemViewToggle.integration.test.tsx | `tests/unit/components/items/` | `tests/unit/features/items/components/` |
| useItems.test.ts | `tests/unit/hooks/` | `tests/unit/features/items/hooks/` |
| useDerivedItems.test.ts | `tests/unit/hooks/` | `tests/unit/features/items/hooks/` |

### New Files (5 barrels + 6 shims = 11)

| File | Exact Path | Purpose |
|------|------------|---------|
| Feature barrel | `src/features/items/index.ts` | FSD feature entry point |
| Views barrel | `src/features/items/views/index.ts` | Views sub-barrel |
| Hooks barrel | `src/features/items/hooks/index.ts` | Hooks sub-barrel |
| Views shim | `src/views/ItemsView/index.ts` | Re-export for App.tsx, viewRenderers |
| Views deep shim | `src/views/ItemsView/useItemsViewData.ts` | Re-export for test mock path |
| Components shim | `src/components/items/index.ts` | Re-export barrel |
| Components deep shim | `src/components/items/ItemViewToggle.tsx` | Re-export for 3 deep-path consumers |
| Hooks shim | `src/hooks/useItems.ts` | Re-export for DashboardView consumer |
| Hooks shim | `src/hooks/useDerivedItems.ts` | Re-export for test backward compat |

### External Consumers (resolved by shims — NO changes needed)

| Consumer | Import Path | Served By Shim |
|----------|-------------|----------------|
| `src/App.tsx:75` | `./views/ItemsView` | Views barrel shim |
| `src/components/App/viewRenderers.tsx:38` | `../../views/ItemsView` | Views barrel shim |
| `src/views/TransactionEditorViewInternal.tsx:93` | `../components/items/ItemViewToggle` | Components deep shim |
| `src/views/EditView.tsx:33` | `../components/items/ItemViewToggle` | Components deep shim |
| `src/views/TransactionEditorView/EditorItemsSection.tsx:25` | `../../components/items/ItemViewToggle` | Components deep shim |
| `src/views/DashboardView/categoryDataHelpers.ts:24` | `../../hooks/useItems` | Hooks shim |
| `tests/unit/components/App/viewRenderers.test.tsx:46` | `vi.mock('../../../../src/views/ItemsView')` | Views barrel shim |
| `tests/unit/views/DashboardView/categoryDataHelpers.test.ts:40` | `vi.mock('@/hooks/useItems')` | Hooks shim |

## Tasks / Subtasks

### Task 1: Create feature directory structure and move hooks (2 files)

- [x]1.1 Create directory structure: `mkdir -p src/features/items/{views/ItemsView,components,hooks}`
- [x]1.2 `git mv src/hooks/useItems.ts src/features/items/hooks/`
- [x]1.3 `git mv src/hooks/useDerivedItems.ts src/features/items/hooks/`
- [x]1.4 Convert 3 relative imports in `useItems.ts`: `../types/transaction` → `@/types/transaction`, `../types/item` → `@/types/item`, `../utils/categoryNormalizer` → `@/utils/categoryNormalizer`
- [x]1.5 Convert 2 relative imports in `useDerivedItems.ts`: `../types/transaction` → `@/types/transaction`, `../types/item` → `@/types/item` (keep `./useItems` as-is — same directory)
- [x]1.6 Create hooks shim at `src/hooks/useItems.ts` (re-export all named + default exports from `@features/items/hooks/useItems`)
- [x]1.7 Create hooks shim at `src/hooks/useDerivedItems.ts` (re-export from `@features/items/hooks/useDerivedItems`)
- [x]1.8 Run `npx tsc --noEmit` — fix any type errors

### Task 2: Move component files and fix imports (6 files)

- [x]2.1 `git mv src/components/items/ItemCard.tsx src/features/items/components/`
- [x]2.2 `git mv src/components/items/AggregatedItemCard.tsx src/features/items/components/`
- [x]2.3 `git mv src/components/items/ItemCategoryFilterBar.tsx src/features/items/components/`
- [x]2.4 `git mv src/components/items/ItemIconFilterBar.tsx src/features/items/components/`
- [x]2.5 `git mv src/components/items/ItemViewToggle.tsx src/features/items/components/`
- [x]2.6 `git mv src/components/items/index.ts src/features/items/components/`
- [x]2.7 Convert relative imports in `ItemCard.tsx` (6 conversions): `../../types/item` → `@/types/item`, `../../config/categoryColors` → `@/config/categoryColors`, `../../utils/currency` → `@/utils/currency`, `../../utils/categoryTranslations` → `@/utils/categoryTranslations`, `../../utils/categoryNormalizer` → `@/utils/categoryNormalizer`, `../../hooks/useIsForeignLocation` → `@/hooks/useIsForeignLocation`, `../../hooks/useLocations` → `@/hooks/useLocations`, `../../types/settings` → `@/types/settings`
- [x]2.8 Convert relative imports in `AggregatedItemCard.tsx` (4 conversions): `../../types/item` → `@/types/item`, `../../config/categoryColors` → `@/config/categoryColors`, `../../utils/categoryTranslations` → `@/utils/categoryTranslations`, `../../utils/currency` → `@/utils/currency`, `../../utils/categoryNormalizer` → `@/utils/categoryNormalizer`
- [x]2.9 Convert relative imports in `ItemCategoryFilterBar.tsx` (3 conversions): `../../utils/categoryTranslations` → `@/utils/categoryTranslations`, `../../utils/categoryNormalizer` → `@/utils/categoryNormalizer`, `../../utils/translations` → `@/utils/translations`
- [x]2.10 Convert relative imports in `ItemIconFilterBar.tsx` (2 conversions): `../../utils/translations` → `@/utils/translations`, `../../utils/categoryTranslations` → `@/utils/categoryTranslations`
- [x]2.11 Create components barrel shim at `src/components/items/index.ts` (re-export all from `@features/items/components`)
- [x]2.12 Create components deep shim at `src/components/items/ItemViewToggle.tsx` (re-export for 3 deep-path consumers)
- [x]2.13 Run `npx tsc --noEmit` — fix any type errors

### Task 3: Move view files and update intra-feature imports (3 files)

- [x]3.1 `git mv src/views/ItemsView/ItemsView.tsx src/features/items/views/ItemsView/`
- [x]3.2 `git mv src/views/ItemsView/useItemsViewData.ts src/features/items/views/ItemsView/`
- [x]3.3 `git mv src/views/ItemsView/index.ts src/features/items/views/ItemsView/`
- [x]3.4 Update 3 intra-feature imports in `ItemsView.tsx`: `@/components/items` → `@features/items/components`, `@/hooks/useItems` (aggregateItems etc.) → `@features/items/hooks/useItems`, `@/hooks/useDerivedItems` → `@features/items/hooks/useDerivedItems`
- [x]3.5 Create views barrel shim at `src/views/ItemsView/index.ts` (re-export ItemsView, useItemsViewData, types)
- [x]3.6 Create views deep shim at `src/views/ItemsView/useItemsViewData.ts` (re-export for test mock path)
- [x]3.7 Run `npx tsc --noEmit` — fix any type errors

### Task 4: Create barrel chain (3 new files)

- [x]4.1 Create hooks barrel at `src/features/items/hooks/index.ts` — export from `./useItems` and `./useDerivedItems`
- [x]4.2 Create views sub-barrel at `src/features/items/views/index.ts` — `export * from './ItemsView'`
- [x]4.3 Create feature barrel at `src/features/items/index.ts` — `export * from './components'; export * from './hooks'; export * from './views'`
- [x]4.4 Run `npx tsc --noEmit` — verify barrel chain resolves correctly

### Task 5: Move test files and fix import/mock paths (5 files)

- [x]5.1 Create test directories: `mkdir -p tests/unit/features/items/{views/ItemsView,components,hooks}`
- [x]5.2 `git mv tests/unit/views/ItemsView/useItemsViewData.test.ts tests/unit/features/items/views/ItemsView/`
- [x]5.3 `git mv tests/unit/components/items/ItemViewToggle.test.tsx tests/unit/features/items/components/`
- [x]5.4 `git mv tests/unit/components/items/ItemViewToggle.integration.test.tsx tests/unit/features/items/components/`
- [x]5.5 `git mv tests/unit/hooks/useItems.test.ts tests/unit/features/items/hooks/`
- [x]5.6 `git mv tests/unit/hooks/useDerivedItems.test.ts tests/unit/features/items/hooks/`
- [x]5.7 Update import in `useItemsViewData.test.ts`: `@/views/ItemsView/useItemsViewData` → `@features/items/views/ItemsView/useItemsViewData`
- [x]5.8 Update imports in both ItemViewToggle tests: `../../../../src/components/items/ItemViewToggle` → `@features/items/components/ItemViewToggle`
- [x]5.9 Update import in `useItems.test.ts`: `../../../src/hooks/useItems` → `@features/items/hooks/useItems`
- [x]5.10 Update import in `useDerivedItems.test.ts`: `../../../src/hooks/useDerivedItems` → `@features/items/hooks/useDerivedItems`
- [x]5.11 Run `npx vitest run tests/unit/features/items/` — fix any failures atomically

### Task 6: Verification and cleanup

- [x]6.1 Grep: `grep -rE "from '\.\./\.\." src/features/items/` returns 0 (no stale relative imports)
- [x]6.2 Grep: `grep -r '@/hooks/useItems' tests/unit/features/items/` returns 0 (no stale mock paths)
- [x]6.3 Grep: `grep -r '@/components/items' tests/unit/features/items/` returns 0 (no stale paths)
- [x]6.4 Verify external consumer: `npx vitest run tests/unit/components/App/viewRenderers.test.tsx`
- [x]6.5 Verify external consumer: `npx vitest run tests/unit/views/DashboardView/categoryDataHelpers.test.ts`
- [x]6.6 Run `npm run test:quick` — all tests pass
- [x]6.7 Verify no circular deps: `npx madge --circular src/features/items/`

## Import Conversion Table

### Component Files (15 relative imports to convert)

| File | Current Import | New Import |
|------|---------------|------------|
| ItemCard.tsx | `../../types/item` | `@/types/item` |
| ItemCard.tsx | `../../config/categoryColors` | `@/config/categoryColors` |
| ItemCard.tsx | `../../utils/currency` | `@/utils/currency` |
| ItemCard.tsx | `../../utils/categoryTranslations` | `@/utils/categoryTranslations` |
| ItemCard.tsx | `../../utils/categoryNormalizer` | `@/utils/categoryNormalizer` |
| ItemCard.tsx | `../../hooks/useIsForeignLocation` | `@/hooks/useIsForeignLocation` |
| ItemCard.tsx | `../../hooks/useLocations` | `@/hooks/useLocations` |
| ItemCard.tsx | `../../types/settings` | `@/types/settings` |
| AggregatedItemCard.tsx | `../../types/item` | `@/types/item` |
| AggregatedItemCard.tsx | `../../config/categoryColors` | `@/config/categoryColors` |
| AggregatedItemCard.tsx | `../../utils/categoryTranslations` | `@/utils/categoryTranslations` |
| AggregatedItemCard.tsx | `../../utils/currency` | `@/utils/currency` |
| AggregatedItemCard.tsx | `../../utils/categoryNormalizer` | `@/utils/categoryNormalizer` |
| ItemCategoryFilterBar.tsx | `../../utils/categoryTranslations` | `@/utils/categoryTranslations` |
| ItemCategoryFilterBar.tsx | `../../utils/categoryNormalizer` | `@/utils/categoryNormalizer` |
| ItemCategoryFilterBar.tsx | `../../utils/translations` | `@/utils/translations` |
| ItemIconFilterBar.tsx | `../../utils/translations` | `@/utils/translations` |
| ItemIconFilterBar.tsx | `../../utils/categoryTranslations` | `@/utils/categoryTranslations` |

### Hook Files (5 relative imports to convert)

| File | Current Import | New Import |
|------|---------------|------------|
| useItems.ts | `../types/transaction` | `@/types/transaction` |
| useItems.ts | `../types/item` | `@/types/item` |
| useItems.ts | `../utils/categoryNormalizer` | `@/utils/categoryNormalizer` |
| useDerivedItems.ts | `../types/transaction` | `@/types/transaction` |
| useDerivedItems.ts | `../types/item` | `@/types/item` |

### View File Intra-Feature Imports (3 canonical path updates)

| File | Current Import | New Import |
|------|---------------|------------|
| ItemsView.tsx | `@/components/items` | `@features/items/components` |
| ItemsView.tsx | `@/hooks/useItems` (aggregateItems etc.) | `@features/items/hooks/useItems` |
| ItemsView.tsx | `@/hooks/useDerivedItems` | `@features/items/hooks/useDerivedItems` |

## Re-Export Shim Specifications

### `src/views/ItemsView/index.ts` (barrel shim)

```typescript
/**
 * Re-export shim for backward compatibility.
 * Canonical location: @features/items/views/ItemsView/
 * Consumers: App.tsx, viewRenderers.tsx (2 source + 1 test)
 * Story: 15b-1e
 */
export { ItemsView } from '@features/items/views/ItemsView';
export {
    useItemsViewData,
    type UseItemsViewDataReturn,
    type UserInfo,
} from '@features/items/views/ItemsView/useItemsViewData';
```

### `src/views/ItemsView/useItemsViewData.ts` (deep shim)

```typescript
/**
 * Deep re-export shim for test mock paths.
 * Canonical location: @features/items/views/ItemsView/useItemsViewData.ts
 * Story: 15b-1e
 */
export { useItemsViewData, type UseItemsViewDataReturn, type UserInfo } from '@features/items/views/ItemsView/useItemsViewData';
```

### `src/components/items/index.ts` (barrel shim)

```typescript
/**
 * Re-export shim for backward compatibility.
 * Canonical location: @features/items/components/
 * Story: 15b-1e
 */
export { ItemCard, type ItemCardProps, type ItemCardFormatters, type ItemCardTheme } from '@features/items/components/ItemCard';
export { AggregatedItemCard, type AggregatedItemCardProps, type AggregatedItemCardFormatters, type AggregatedItemCardTheme } from '@features/items/components/AggregatedItemCard';
export { ItemCategoryFilterBar } from '@features/items/components/ItemCategoryFilterBar';
export { ItemIconFilterBar } from '@features/items/components/ItemIconFilterBar';
export { ItemViewToggle, type ItemViewMode, type ItemViewToggleProps } from '@features/items/components/ItemViewToggle';
```

### `src/components/items/ItemViewToggle.tsx` (deep shim)

```typescript
/**
 * Deep re-export shim for backward compatibility.
 * Canonical location: @features/items/components/ItemViewToggle.tsx
 * Consumers: TransactionEditorViewInternal, EditView, EditorItemsSection (3 source + 2 test)
 * Story: 15b-1e
 */
export { ItemViewToggle, type ItemViewMode, type ItemViewToggleProps } from '@features/items/components/ItemViewToggle';
```

### `src/hooks/useItems.ts` (shim)

```typescript
/**
 * Re-export shim for backward compatibility.
 * Canonical location: @features/items/hooks/useItems.ts
 * Consumers: DashboardView/categoryDataHelpers.ts (1 source + 1 test)
 * Story: 15b-1e
 */
export {
    useItems,
    flattenTransactionItems,
    filterItems,
    sortItemsByDate,
    sortItemsByPrice,
    sortItemsByName,
    groupItemsByDate,
    groupItemsByCategory,
    calculateItemsTotal,
    normalizeItemNameForGrouping,
    aggregateItems,
    sortAggregatedItems,
    extractAvailableItemFilters,
    type AvailableItemFilters,
} from '@features/items/hooks/useItems';
export { default } from '@features/items/hooks/useItems';
```

### `src/hooks/useDerivedItems.ts` (shim)

```typescript
/**
 * Re-export shim for backward compatibility.
 * Canonical location: @features/items/hooks/useDerivedItems.ts
 * Story: 15b-1e
 */
export { useDerivedItems } from '@features/items/hooks/useDerivedItems';
export { default } from '@features/items/hooks/useDerivedItems';
```

## Dev Notes

### Architecture Guidance

**This is the ONLY new feature module in Phase 1.** All sibling stories consolidate into existing feature directories (analytics, dashboard, history, transaction-editor). This story creates `features/items/` from scratch with 3 FSD layers (views, components, hooks).

**Barrel chain:** `features/items/index.ts` → `{components,hooks,views}/index.ts` → leaf modules. Matches `features/analytics/` structure.

**Import rewiring strategy:** Same as 15b-1a — convert all `../../` and `../` relative imports to `@/` path aliases. Intra-feature imports use `@features/items/...` deep paths (not `@/hooks/useItems`).

### Critical Pitfalls

1. **Circular import via feature barrel:** After creating `features/items/index.ts`, ItemsView.tsx must NOT import from `@features/items` (the barrel). It must use deep paths like `@features/items/components` and `@features/items/hooks/useItems`. Importing the barrel creates a cycle.

2. **useItems.ts default export:** `useItems.ts` has `export default useItems`. The shim must re-export both named and default: `export { default } from '@features/items/hooks/useItems'`.

3. **ItemViewToggle deep path consumers:** Three source files import `ItemViewToggle` via deep path (`../components/items/ItemViewToggle`), not via barrel. The barrel shim alone is insufficient — the `ItemViewToggle.tsx` shim is required.

4. **git mv ordering:** Move ALL files from each old directory BEFORE creating shim files at those locations. If shims are created before moves, git sees conflicts.

5. **useDerivedItems internal relative import:** `useDerivedItems.ts` imports `./useItems` (relative). Both files move to `src/features/items/hooks/` — the relative import stays valid because they remain siblings. No change needed for this import.

6. **External test mocks that must NOT change:** `categoryDataHelpers.test.ts` mocks `@/hooks/useItems` — this is an EXTERNAL consumer, handled by shim. `viewRenderers.test.tsx` mocks `../../../../src/views/ItemsView` — also handled by shim. Do NOT move these tests.

### E2E Testing

No E2E testing needed — pure structural refactoring with zero behavior changes.

## ECC Analysis Summary

- **Risk Level:** MEDIUM
- **Complexity:** Moderate (3-location consolidation, highest shim count in Phase 1)
- **Sizing:** MEDIUM (6 tasks, 34 subtasks, 23 files — re-estimated from 2 to 3 pts)
- **Agents consulted:** Planner, Architect
- **Pattern reference:** 15b-1a (consolidate-analytics) — identical shim strategy, broader scope
- **Dependencies:** BLOCKS 15b-2d (decompose-items-view); DEPENDS (optional) 15b-1b (dashboard) — shim handles either order

## Senior Developer Review (ECC)

**Verdict:** APPROVE 9.75/10
**Reviewer:** ECC Code Review (4 parallel agents)
**Date:** 2026-02-14

### Agent Scores
| Agent | Score | Findings |
|-------|-------|----------|
| Code Reviewer | 10/10 | 1 LOW (stale comments), 1 INFO (defensive defaults) |
| Security Reviewer | 10/10 | 0 findings — no user input, no Firestore writes, no auth changes |
| Architect | 10/10 | 30/30 ACs pass (16 LOC + 7 PATTERN + 7 NO) |
| TDD Guide | 9/10 | 2 style nits (bare assertions, duplicated factory) |

### Quick Fixes Applied
1. Updated stale Epic 14 comments in `src/features/items/components/index.ts` to `Story: 15b-1e`
2. Strengthened bare `toHaveBeenCalled()` assertions in `tests/unit/features/items/hooks/useDerivedItems.test.ts` to use `toHaveBeenCalledWith` with specific matchers

### Deferred Items
None — all findings resolved or classified as INFO (no action needed).

### Test Results
All 6,884 tests pass (281 files). Items-specific: 103 tests across 5 files.

### Cost
$18.65 (under P90 of $30.40 for code reviews)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-14 | ECC create-story refinement: Planner + Architect analysis. Corrected file count 5→13, added useDerivedItems.ts, expanded to 3-location consolidation (views+components+hooks). Added architectural ACs (16 LOC + 7 PATTERN + 7 NO), exact file specification with 11 source + 5 test moves + 11 new files. 6 re-export shim specifications with exact export lists. Import conversion table (23 conversions). 6 critical pitfalls. Re-estimated 2→3 pts |
| 2026-02-14 | ECC code review: APPROVE 9.75/10. 2 quick fixes applied (stale comments + bare assertions). 30/30 architectural ACs verified. Status → done |