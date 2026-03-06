# Story 17-2: Update Category Constants, Types, and Translations

## Status: ready-for-dev

## Intent
**Epic Handle:** "Name everything in the language the user thinks in"
**Story Handle:** "This story names everything by replacing the code-level labels -- the foundation all other changes read from"

## Story
As a developer, I want category constants, TypeScript types, and translation files updated to the new Spanish taxonomy, so that all downstream code references the new names.

## Acceptance Criteria

### Functional
- **AC-1:** Given the taxonomy spec from 17-1, when constants are updated, then all 4 levels use the new Spanish names as canonical values
- **AC-2:** Given TypeScript enums/types for categories, when updated, then type-safe references use new names
- **AC-3:** Given `translations.ts` has category strings, when updated, then Spanish and English translations reflect new taxonomy
- **AC-4:** Given the normalizer (`FR-3.5`) maps old names to current, when updated, then it maps old names to NEW names
- **AC-5:** Given all constant/type changes, when `npx tsc --noEmit` runs, then zero TypeScript errors

### Architectural
- **AC-ARCH-PATTERN-1:** Category constants are the SINGLE SOURCE OF TRUTH -- all UI, analytics, and AI reference these
- **AC-ARCH-PATTERN-2:** Normalizer updated to map OLD canonical names to NEW canonical names (additive, not replacing old entries)
- **AC-ARCH-NO-1:** No UI component changes in this story -- constants and types only

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Store category constants | `src/features/categories/` or `src/shared/` (locate in Task 1) | Constants | MODIFIED |
| Item category constants | Same location | Constants | MODIFIED |
| TypeScript types | Category type files | Types | MODIFIED |
| Translations | `src/utils/translations.ts` | i18n | MODIFIED |
| Normalizer | Category normalizer file | Normalizer | MODIFIED |
| Tests | Category-related test files | Vitest | MODIFIED |

## Tasks

### Task 1: Locate and Catalog Category Files (2 subtasks)
- [ ] 1.1: Grep for category constant definitions -- catalog all files that define category values
- [ ] 1.2: Catalog all files that import/reference category constants (impact scope)

### Task 2: Update Constants and Types (3 subtasks)
- [ ] 2.1: Update store category group constants (8 groups -> new Spanish names per spec)
- [ ] 2.2: Update store category constants (36 categories -> new Spanish names per spec)
- [ ] 2.3: Update item category group and item category constants (7 groups, 39 categories)

### Task 3: Update Translations (2 subtasks)
- [ ] 3.1: Update `translations.ts` Spanish entries for all 4 category levels
- [ ] 3.2: Update English translation entries (for EN locale display)

### Task 4: Update Normalizer (2 subtasks)
- [ ] 4.1: Add old-to-new mappings to the normalizer (additive -- keep existing legacy mappings)
- [ ] 4.2: **HARDENING:** Validate normalizer completeness -- every old canonical name must map to a new one

### Task 5: Update Tests and Verify (3 subtasks)
- [ ] 5.1: Update test assertions that reference old category names
- [ ] 5.2: **HARDENING:** Add test verifying no category name appears in more than one level
- [ ] 5.3: Run `npm run test:quick` and `npx tsc --noEmit` -- zero errors

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~6

## Dependencies
- **17-1** (taxonomy spec must be complete)

## Risk Flags
- DATA_PIPELINE (constants are referenced everywhere)
- INPUT_SANITIZATION (new values must be validated in normalizer)

## Dev Notes
- The normalizer is the safety net during migration. It must handle: old English names, old Spanish names, legacy names from pre-Epic-14 data, AND new canonical names.
- After 17-5 (migration), old entries in the normalizer can be pruned. But for now, keep all entries.
- TypeScript types should use string literal unions (not enums) for category values -- check current pattern.
- This story will cause test failures in files that assert on old category names. Fix them here, not in later stories.
