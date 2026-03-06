# Story 17-1: Design and Document New Category Taxonomy

## Status: ready-for-dev

## Intent
**Epic Handle:** "Name everything in the language the user thinks in"
**Story Handle:** "This story names everything by defining the new shelf labels before anyone starts relabeling"

## Story
As a product owner, I want a documented 4-level Spanish taxonomy with zero overlaps, so that development has a clear spec to implement.

## Acceptance Criteria

### Functional
- **AC-1:** Given the existing 4-level taxonomy (Store Category Group, Store Category, Item Category Group, Item Category), when reviewed, then each level has a clear Spanish label name (e.g., Rubro, Negocio, Familia, Tipo de Producto)
- **AC-2:** Given categories exist within each level, when de-overlapped, then zero category name appears in more than one level
- **AC-3:** Given the current 8 store category groups and 36 store categories, when reviewed, then the groupings are logical and no category is orphaned
- **AC-4:** Given the current 7 item category groups and 39 item categories, when reviewed, then the groupings are logical and no category is orphaned
- **AC-5:** Given the new taxonomy is documented, when reviewed, then it includes an old-to-new mapping table for every renamed category

### Architectural
- **AC-ARCH-LOC-1:** Taxonomy spec document at `docs/architecture/category-taxonomy-v2.md`
- **AC-ARCH-PATTERN-1:** Document includes: level names, category lists per level, old-to-new mapping, Gemini prompt guidance
- **AC-ARCH-NO-1:** No code changes in this story -- design only

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Taxonomy spec | `docs/architecture/category-taxonomy-v2.md` | Architecture doc | NEW |

## Tasks

### Task 1: Audit Current Taxonomy (3 subtasks)
- [ ] 1.1: Read current category constants -- catalog all 4 levels with exact values
- [ ] 1.2: Identify overlapping names across levels (e.g., same string used as store category and item category)
- [ ] 1.3: Identify categories with unclear or English-only names

### Task 2: Design New Spanish Labels (3 subtasks)
- [ ] 2.1: Define level names: Rubro (store group), Negocio/Giro (store category), Familia/Pasillo (item group), Tipo de Producto (item category)
- [ ] 2.2: Review each category within each level -- rename to clear Spanish, de-overlap
- [ ] 2.3: Validate with user: present proposed taxonomy for approval

### Task 3: Document Mapping and Spec (2 subtasks)
- [ ] 3.1: Create old-to-new mapping table for every category at every level
- [ ] 3.2: Write Gemini prompt guidance section -- how the AI should use the new names

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 3
- **Subtasks:** 8
- **Files:** 1

## Dependencies
- None (first story in epic)

## Risk Flags
- None (design only)

## Dev Notes
- Current category constants are in `src/shared/` or `src/features/categories/` -- locate exact files during Task 1
- The Gemini prompt currently includes category lists -- the prompt update (17-3) needs this spec
- Level name candidates from PRD: Rubro, Negocio/Giro, Familia/Pasillo, Tipo de Producto -- user confirms final choice
- De-overlapping may require merging some categories (e.g., if "Food" appears at both store and item level)
- This story requires USER COLLABORATION -- the taxonomy decisions are product decisions, not engineering decisions
