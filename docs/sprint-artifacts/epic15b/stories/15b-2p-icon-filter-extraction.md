# Story 15b-2p: IconCategoryFilter Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 2
**Priority:** LOW
**Status:** drafted

## Overview

IconCategoryFilter.tsx is currently 1,107 lines with 10 import dependencies. Epic 15 (Story 15-5e) extracted it from IconFilterBar.tsx, but no further sub-files were created -- the file is monolithic. The remaining lines contain two large sub-components (`StoreGroupedCategoriesSection` at 134 lines and `ItemGroupedCategoriesSection` at 135 lines) that are structurally near-identical, a duplicated `toSentenceCase` helper, the inline location tab JSX (~122 lines), and a pending-animation CSS block (~36 lines) -- all of which are extractable without behavior change. Target: reduce IconCategoryFilter.tsx to under 800 lines.

## Functional Acceptance Criteria

- [ ] **AC1:** IconCategoryFilter.tsx reduced to <800 lines (from 1,107)
- [ ] **AC2:** Each extracted file is <400 lines
- [ ] **AC3:** All existing tests pass before AND after extraction (including `tests/unit/features/history/components/IconCategoryFilter.test.tsx`)
- [ ] **AC4:** No new functionality added -- pure decomposition
- [ ] **AC5:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Grouped category sections at `src/features/history/components/GroupedCategoriesSection.tsx`
- [ ] **AC-ARCH-LOC-2:** Location tab section at `src/features/history/components/LocationTabSection.tsx`
- [ ] **AC-ARCH-LOC-3:** Pending animation styles at `src/features/history/components/filterAnimationStyles.ts`
- [ ] **AC-ARCH-LOC-4:** Grouped categories tests at `tests/unit/features/history/components/GroupedCategoriesSection.test.tsx`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases for external imports -- zero `../../` relative imports
- [ ] **AC-ARCH-PATTERN-2:** IconCategoryFilter.tsx imports extracted modules via relative `./` paths (same directory)
- [ ] **AC-ARCH-PATTERN-3:** `filterAnimationStyles.ts` contains ONLY string constants -- no React imports, no hooks, no side effects
- [ ] **AC-ARCH-PATTERN-4:** `GroupedCategoriesSection.tsx` exports two named components (`StoreGroupedCategoriesSection` and `ItemGroupedCategoriesSection`) with the same prop interfaces they currently have
- [ ] **AC-ARCH-PATTERN-5:** `LocationTabSection` accepts all data as props -- no direct store access, no `useLocationDisplay` hook call (the parent passes `getCountryName` and `getCityName` as props)
- [ ] **AC-ARCH-PATTERN-6:** The duplicated `toSentenceCase` helper is extracted once into `GroupedCategoriesSection.tsx` as a shared private function (not exported)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency -- extracted files must NOT import from `@features/history` barrel (`src/features/history/components/index.ts`)
- [ ] **AC-ARCH-NO-2:** No new `console.log` statements in extracted files
- [ ] **AC-ARCH-NO-3:** No `: any` types in extracted files -- use proper TypeScript types
- [ ] **AC-ARCH-NO-4:** No state lifting -- all `useState`, `useMemo`, `useEffect` calls in `CategoryFilterDropdownMenu` stay in `CategoryFilterDropdownMenu`; only presentation sub-components move out
- [ ] **AC-ARCH-NO-5:** No barrel modification -- `src/features/history/components/index.ts` must NOT be modified (extracted files are internal implementation details, not public API)

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| IconCategoryFilter.tsx | `src/features/history/components/IconCategoryFilter.tsx` | Reduce from 1,107 to ~750 lines; import from extracted files |

### New Files

| File/Component | Exact Path | Pattern | Est. Lines |
|----------------|------------|---------|------------|
| GroupedCategoriesSection.tsx | `src/features/history/components/GroupedCategoriesSection.tsx` | React FC sub-components (2 exports) | ~200 |
| LocationTabSection.tsx | `src/features/history/components/LocationTabSection.tsx` | React FC sub-component | ~140 |
| filterAnimationStyles.ts | `src/features/history/components/filterAnimationStyles.ts` | String constants | ~40 |
| GroupedCategoriesSection.test.tsx | `tests/unit/features/history/components/GroupedCategoriesSection.test.tsx` | Unit test | ~150 |

### Unchanged Files (verified no modification needed)

| File | Exact Path | Reason |
|------|------------|--------|
| index.ts | `src/features/history/components/index.ts` | Extracted files are internal; barrel stays unchanged |
| IconCategoryFilter.test.tsx | `tests/unit/features/history/components/IconCategoryFilter.test.tsx` | Tests interact via `CategoryFilterDropdownMenu` public API; no change needed |
| IconFilterBar.tsx | `src/features/history/components/IconFilterBar.tsx` | Imports `CategoryFilterDropdownMenu` from `./IconCategoryFilter`; unchanged |
| CountryFlag.tsx | `src/features/history/components/CountryFlag.tsx` | Referenced by LocationTabSection via `./CountryFlag`; unchanged |

## Tasks / Subtasks

### Task 1: Establish baseline

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `npx vitest run tests/unit/features/history/components/IconCategoryFilter.test.tsx` and confirm all pass
- [ ] 1.3 Count current IconCategoryFilter.tsx lines: `wc -l src/features/history/components/IconCategoryFilter.tsx` (expect 1,107)
- [ ] 1.4 Record current fan-out: count import lines in IconCategoryFilter.tsx (expect ~10 import statements)

### Task 2: Extract StoreGroupedCategoriesSection and ItemGroupedCategoriesSection into GroupedCategoriesSection.tsx

- [ ] 2.1 Create `src/features/history/components/GroupedCategoriesSection.tsx`
- [ ] 2.2 Move the `StoreGroupedCategoriesSectionProps` interface (lines 83-89) and `StoreGroupedCategoriesSection` function component (lines 91-213) to the new file
- [ ] 2.3 Move the `ItemGroupedCategoriesSectionProps` interface (lines 219-225) and `ItemGroupedCategoriesSection` function component (lines 227-349) to the new file
- [ ] 2.4 Extract the duplicated `toSentenceCase` helper as a single shared private function at module scope (used by both components, currently duplicated at lines 113-116 and 249-252)
- [ ] 2.5 Add required imports: `React`, `useState` from `'react'`; `Check` from `'lucide-react'`; category color utilities from `@/config/categoryColors`; emoji/translation utilities from `@/utils/categoryEmoji` and `@/utils/categoryTranslations`; `Language` type from `@/utils/translations`
- [ ] 2.6 Export both components as named exports and both props interfaces
- [ ] 2.7 Update IconCategoryFilter.tsx: replace inline definitions with `import { StoreGroupedCategoriesSection, ItemGroupedCategoriesSection } from './GroupedCategoriesSection'`
- [ ] 2.8 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.9 Run `npx vitest run tests/unit/features/history/components/IconCategoryFilter.test.tsx` -- confirm all pass
- [ ] 2.10 Create `tests/unit/features/history/components/GroupedCategoriesSection.test.tsx` with render tests for both components: group expansion toggle, category toggle callback, group toggle callback, and `toSentenceCase` formatting visible in group headers

### Task 3: Extract LocationTabSection into LocationTabSection.tsx

- [ ] 3.1 Create `src/features/history/components/LocationTabSection.tsx`
- [ ] 3.2 Define `LocationTabSectionProps` interface with props: `sortedCountries: string[]`, `availableFilters: AvailableFilters`, `expandedCountries: Set<string>`, `pendingLocations: Set<string>`, `getCountryName: (code: string) => string`, `getCityName: (code: string) => string`, `getCountrySelectionState: (country: string) => 'all' | 'some' | 'none'`, `toggleCountryExpansion: (country: string) => void`, `handleCountryToggle: (country: string) => void`, `handleCityToggle: (city: string) => void`, `t: (key: string) => string`, `lang: Language`
- [ ] 3.3 Move the location tab JSX block (the `activeTab === 2` branch content, ~lines 943-1064) into the new component
- [ ] 3.4 Add required imports: `React` from `'react'`; `ChevronDown`, `Check` from `'lucide-react'`; `CountryFlag` from `./CountryFlag`; `Language` type from `@/utils/translations`; `AvailableFilters` type from `@shared/utils/historyFilterUtils`
- [ ] 3.5 Update IconCategoryFilter.tsx: replace inline location JSX with `<LocationTabSection sortedCountries={sortedCountries} ... />`
- [ ] 3.6 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 3.7 Run `npx vitest run tests/unit/features/history/components/IconCategoryFilter.test.tsx` -- confirm location tab tests still pass

### Task 4: Extract filterAnimationStyles into filterAnimationStyles.ts

- [ ] 4.1 Create `src/features/history/components/filterAnimationStyles.ts`
- [ ] 4.2 Move the pending animation CSS string (the `@keyframes pendingShine` and `.pending-pulse` rules) to an exported constant: `export const PENDING_ANIMATION_CSS: string`
- [ ] 4.3 Move the icon size CSS string (the `.filter-tab-icon` and `[data-font-size]` rules) to an exported constant: `export const ICON_SIZE_CSS: string`
- [ ] 4.4 Update IconCategoryFilter.tsx: replace inline style string literals with `import { ICON_SIZE_CSS, PENDING_ANIMATION_CSS } from './filterAnimationStyles'`
- [ ] 4.5 Note: preserve the conditional render for `PENDING_ANIMATION_CSS` -- it is currently rendered only when `isTransactionsPending || isItemsPending || isLocationsPending`; do NOT render it unconditionally
- [ ] 4.6 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Verify extraction and run full test suite

- [ ] 5.1 Count final IconCategoryFilter.tsx lines: `wc -l src/features/history/components/IconCategoryFilter.tsx` (target: <800)
- [ ] 5.2 Verify all extracted files are <400 lines each
- [ ] 5.3 Verify no `../../` imports in extracted files: `grep -rE "from '\.\./\.\." src/features/history/components/GroupedCategoriesSection.tsx src/features/history/components/LocationTabSection.tsx src/features/history/components/filterAnimationStyles.ts` returns 0
- [ ] 5.4 Verify no circular deps: `npx madge --circular src/features/history/components/`
- [ ] 5.5 Verify barrel is unchanged: `git diff src/features/history/components/index.ts` returns empty
- [ ] 5.6 Run `npm run test:quick` -- all tests pass
- [ ] 5.7 Run `npx vitest run tests/unit/features/history/components/IconCategoryFilter.test.tsx` -- all tests pass
- [ ] 5.8 Record final import count in IconCategoryFilter.tsx -- must be lower than 10 (category color, emoji, and translation imports moved to GroupedCategoriesSection.tsx)

## Dev Notes

### Architecture Guidance

**Extraction 1 -- GroupedCategoriesSection.tsx (Store + Item):** These two sub-components (totaling ~270 lines) are the highest-value extraction target. They are structurally near-identical -- both follow the same expand/collapse group pattern with the same checkbox styling. Each manages its own `expandedGroups` useState and a local `toSentenceCase` helper. Neither accesses parent state directly; all data flows through props. The parent's `onGroupToggle` inline handler stays in `CategoryFilterDropdownMenu` since it calls `setPendingTransactions`/`setPendingItems` -- only those inline arrow function definitions remain in the parent. After extraction, IconCategoryFilter.tsx drops 5 of its 10 import dependencies (categoryColors, categoryEmoji, categoryTranslations utilities) because only the sub-components use them.

**Extraction 2 -- LocationTabSection.tsx:** The location tab renders a Country-City tree with expand/collapse and multi-select checkboxes (~122 lines of JSX). All state it reads (`sortedCountries`, `expandedCountries`, `pendingLocations`) and all callbacks it calls (`toggleCountryExpansion`, `handleCountryToggle`, `handleCityToggle`, `getCountrySelectionState`) are passed as props from the parent. The `useLocationDisplay` hook call remains in the parent (its current position before conditional rendering) so hook call order is preserved -- `LocationTabSection` receives `getCountryName` and `getCityName` as function props. The `CountryFlag` import moves to the new file.

**Extraction 3 -- filterAnimationStyles.ts:** Two inline `<style>` blocks (icon sizing and pending animation) are pure CSS strings with no React dependencies. Extracting them as string constants is trivial and removes ~55 lines of noise from the main component's render method.

### Critical Pitfalls

1. **Hook call order preservation:** `useLocationDisplay(lang)` is called inside `CategoryFilterDropdownMenu`. It must NOT be moved into `LocationTabSection` because that component renders conditionally (`activeTab === 2`). Conditional hook calls violate Rules of Hooks. Pass the hook's return values (`getCountryName`, `getCityName`) as props instead.

2. **toSentenceCase duplication:** Both `StoreGroupedCategoriesSection` and `ItemGroupedCategoriesSection` define identical `toSentenceCase` functions. In the extracted file, consolidate to a single private function at module scope. Do not export it -- it is an implementation detail.

3. **onGroupToggle inline handlers stay in parent:** The `onGroupToggle` prop callbacks call `setPendingTransactions` and `setPendingItems` respectively. These are parent state setters and must remain as inline arrow functions in `CategoryFilterDropdownMenu`, not move into `GroupedCategoriesSection.tsx`.

4. **Pending animation conditional render:** The `<style>{PENDING_ANIMATION_CSS}</style>` block is currently rendered conditionally (`isTransactionsPending || isItemsPending || isLocationsPending`). Preserve this conditional when using the imported constant -- do not render it unconditionally.

5. **Test mock compatibility:** The existing test at `IconCategoryFilter.test.tsx` mocks `categoryColors`, `categoryEmoji`, and `categoryTranslations` at the source paths. After extraction, these mocks still work because Vitest module mocks apply globally per test file -- they will intercept the imports in `GroupedCategoriesSection.tsx` as well. No test changes needed.

## ECC Analysis Summary

- **Risk Level:** LOW (pure decomposition, no prior sub-files to coordinate with)
- **Complexity:** Low -- 3 extractions (2 sub-components, 1 presentation sub-component, 1 CSS constants file), 1 new test file
- **Sizing:** 5 tasks / 22 subtasks / 6 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- IconCategoryFilter is imported only by IconFilterBar.tsx and is self-contained

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite. Source analysis of IconCategoryFilter.tsx (1,107 lines, 10 imports, 0 existing sub-files). 3 extraction targets: GroupedCategoriesSection.tsx (~200L with 2 sub-components + shared helper), LocationTabSection.tsx (~140L presentation component), filterAnimationStyles.ts (~40L CSS constants). Target residual: ~750 lines. 10 architectural ACs, 5 tasks, 22 subtasks, 6 files. |
