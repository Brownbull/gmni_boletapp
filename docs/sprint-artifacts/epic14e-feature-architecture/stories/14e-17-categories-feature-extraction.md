# Story 14e-17: Categories Feature Extraction

Status: ready-for-dev

<!-- Created by atlas-create-story workflow 2026-01-25 -->
<!-- Atlas Analysis: 4 workflow impacts detected -->

## Story

As a **developer**,
I want **category management extracted to a feature module**,
So that **category logic is colocated, isolated, and App.tsx is further simplified**.

## Acceptance Criteria

### Core Feature Extraction (from Epic 14e epics.md)

1. **AC1**: `src/features/categories/` directory structure complete with:
   - `CategoriesFeature.tsx` (orchestrator component)
   - `state/useCategoriesState.ts` (wraps existing hooks)
   - `handlers/saveCategory.ts`, `handlers/deleteCategory.ts`
   - `components/` directory (if needed beyond ModalManager)
   - `index.ts` barrel export

2. **AC2**: `useCategoriesState` hook wraps existing hooks:
   - `useCategoryMappings` (category learning)
   - `useSubcategoryMappings` (subcategory learning)
   - Exposes unified interface for feature consumers

3. **AC3**: Category handlers extracted from App.tsx:
   - `saveCategory` / `updateCategoryMapping` handlers
   - `deleteCategory` / `deleteMapping` handlers
   - Integration with ModalManager for CategoryEditorModal (if not already migrated in 14e-4/14e-5)

4. **AC4**: App.tsx integration simplified:
   - Imports and uses `<CategoriesFeature />`
   - Category-related state removed from App.tsx (~30-50 lines reduced)
   - Passes minimal props (user, services) to feature

5. **AC5**: All existing category tests pass without modification

### Atlas Workflow Protection (from workflow chain analysis)

6. **AC6**: Scan Receipt Flow unchanged - `applyCategoryMappings()` continues to work for new scans
7. **AC7**: Learning Flow unchanged - category mappings save/retrieve correctly via new state hook
8. **AC8**: SettingsView category management unchanged - CRUD operations work identically
9. **AC9**: Analytics/History category filtering unchanged - no regression in drill-down or filter behavior

## Tasks / Subtasks

- [ ] **Task 1: Create Feature Directory Structure** (AC: #1)
  - [ ] 1.1: Update `src/features/categories/index.ts` (currently stub) with proper exports
  - [ ] 1.2: Create `src/features/categories/state/` directory
  - [ ] 1.3: Create `src/features/categories/handlers/` directory
  - [ ] 1.4: Create `src/features/categories/components/` directory (if needed)
  - [ ] 1.5: Verify path alias `@features/categories` works

- [ ] **Task 2: Create useCategoriesState Hook** (AC: #2)
  - [ ] 2.1: Analyze existing `useCategoryMappings` (src/hooks/useCategoryMappings.ts) interface
  - [ ] 2.2: Analyze existing `useSubcategoryMappings` (src/hooks/useSubcategoryMappings.ts) interface
  - [ ] 2.3: Create `src/features/categories/state/useCategoriesState.ts`
  - [ ] 2.4: Wrap both hooks with unified interface exposing:
    - `categoryMappings`, `subcategoryMappings` (data)
    - `isLoading` (combined loading state)
    - `saveMapping`, `deleteMapping`, `updateMapping` (category)
    - `saveSubcategoryMapping`, `deleteSubcategoryMapping`, `updateSubcategoryMapping` (subcategory)
  - [ ] 2.5: Export from feature index.ts
  - [ ] 2.6: Add unit tests for wrapper hook (verify passthrough behavior)

- [ ] **Task 3: Extract Category Handlers** (AC: #3)
  - [ ] 3.1: Identify handler functions in App.tsx related to categories:
    - `updateCategoryMapping` (line 225 callback)
    - `deleteMapping` (line 225 callback)
    - `saveSubcategoryMapping`, `deleteSubcategoryMapping`, `updateSubcategoryMapping` (lines 235-240)
  - [ ] 3.2: Create `src/features/categories/handlers/categoryHandlers.ts`
  - [ ] 3.3: Extract handlers with props-based dependency injection pattern (per Epic 14c-refactor patterns)
  - [ ] 3.4: Add unit tests for handlers
  - [ ] 3.5: Verify CategoryEditorModal integration (check if already in ModalManager from 14e-4/14e-5)

- [ ] **Task 4: Create CategoriesFeature Orchestrator** (AC: #1, #4)
  - [ ] 4.1: Create `src/features/categories/CategoriesFeature.tsx`
  - [ ] 4.2: Component uses `useCategoriesState` hook internally
  - [ ] 4.3: Exposes category state and handlers via context or render props
  - [ ] 4.4: Renders nothing (headless feature) OR renders CategoryEditorModal if needed
  - [ ] 4.5: Export from feature index.ts

- [ ] **Task 5: App.tsx Integration** (AC: #4, #5)
  - [ ] 5.1: Import `CategoriesFeature` and `useCategoriesState` in App.tsx
  - [ ] 5.2: Replace direct `useCategoryMappings` call with feature hook
  - [ ] 5.3: Replace direct `useSubcategoryMappings` call with feature hook
  - [ ] 5.4: Update handler references to use feature handlers
  - [ ] 5.5: Remove category-related state variables from App.tsx
  - [ ] 5.6: Render `<CategoriesFeature />` in appropriate location (likely headless in providers)
  - [ ] 5.7: Verify line count reduction (~30-50 lines)

- [ ] **Task 6: Workflow Regression Testing** (AC: #6, #7, #8, #9)
  - [ ] 6.1: Test scan flow - verify `applyCategoryMappings` still works
  - [ ] 6.2: Test learning flow - edit category, confirm prompt, verify mapping saved
  - [ ] 6.3: Test SettingsView - view/edit/delete category mappings
  - [ ] 6.4: Test Analytics drill-down - category filtering works
  - [ ] 6.5: Test History filters - category filter applies correctly
  - [ ] 6.6: Run full test suite - all ~5,700+ tests pass

## Dev Notes

### Architecture Patterns to Follow

**Feature Module Pattern** (per Epic 14e architecture):
```
src/features/categories/
├── index.ts                    # Public API exports
├── CategoriesFeature.tsx       # Orchestrator component (may be headless)
├── state/
│   └── useCategoriesState.ts   # Wraps existing hooks
├── handlers/
│   └── categoryHandlers.ts     # Extracted handler functions
└── components/                 # Feature-specific UI (if any)
```

**Hook Wrapper Pattern** (per Epic 14c-refactor.27):
- New hook wraps existing hooks rather than replacing them
- Use `useMemo` for stable object references
- Maintain exact same interface for backward compatibility

**Handler Extraction Pattern** (per Epic 14c-refactor.20):
- Props-based dependency injection
- `useCallback` for handler stability
- Fire-and-forget Firestore operations (offline persistence)

### Source Files to Touch

**Files to Create:**
- `src/features/categories/state/useCategoriesState.ts`
- `src/features/categories/handlers/categoryHandlers.ts`
- `src/features/categories/CategoriesFeature.tsx`

**Files to Modify:**
- `src/features/categories/index.ts` (update from stub)
- `src/App.tsx` (~30-50 lines reduced)

**Files to Reference (DO NOT MODIFY unless needed):**
- `src/hooks/useCategoryMappings.ts` (source hook)
- `src/hooks/useSubcategoryMappings.ts` (source hook)
- `src/utils/categoryMatcher.ts` (`applyCategoryMappings` utility)
- `src/services/categoryMappingService.ts`

### Testing Standards

- Unit tests for `useCategoriesState` hook (verify wrapper behavior)
- Unit tests for extracted handlers
- Integration: All existing category tests must pass unchanged
- Smoke tests: Scan flow, learning flow, SettingsView CRUD

### Project Structure Notes

**Alignment with Epic 14e Architecture:**
- Uses `src/features/categories/` per architecture-decision.md
- Follows Feature Slicing pattern (colocated state + handlers + components)
- Does NOT require Zustand store (simple wrapper around existing hooks)

**Dependencies:**
- Story 14e-1 MUST be complete (directory structure exists)
- Story 14e-4/14e-5 may have migrated CategoryEditorModal to ModalManager (verify before implementing)

### Atlas Workflow Impact Summary

| Workflow | Impact | Risk |
|----------|--------|------|
| #1 Scan Receipt | Uses `applyCategoryMappings` - verify unchanged | MEDIUM |
| #5 Learning | Uses category hooks - verify save/delete work | MEDIUM |
| #4 Analytics | Uses category filtering - verify drill-down | LOW |
| #6 History | Uses category filtering - verify filter works | LOW |

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.17]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#Target-Structure]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md#Learning-Flow]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md#App-Level-Hook-Pattern]

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Workflow #1 (Scan Receipt Flow)**: Categories applied via `applyCategoryMappings` during scan processing
- **Workflow #5 (Learning Flow)**: Category mappings saved/deleted via `useCategoryMappings` hook
- **Workflow #4 (Analytics Navigation)**: Category drill-down depends on transaction categorization
- **Workflow #6 (History Filter Flow)**: Category filtering in IconFilterBar

### Downstream Effects to Consider

- Scan flow relies on `applyCategoryMappings()` being importable and functional
- Learning system saves mappings that are retrieved on next scan
- SettingsView renders mapping CRUD UI that must continue working
- Analytics and History views apply category filters via HistoryFiltersContext

### Testing Implications

- **Existing tests to verify:** All tests in `tests/unit/hooks/useCategoryMappings.test.ts`, `tests/unit/hooks/useSubcategoryMappings.test.ts`
- **New test scenarios:** `useCategoriesState` wrapper behavior, handler passthrough tests

### Workflow Chain Visualization

```
[User Edits Category] → Learning Flow → [useCategoryMappings SAVE] → [THIS STORY - useCategoriesState] → [Future Scan] → Scan Receipt Flow
                                                                                    ↓
                                                              [SettingsView Category Management]
```

## Dev Agent Record

### Agent Model Used

<!-- Filled by dev agent -->

### Debug Log References

<!-- Filled by dev agent -->

### Completion Notes List

<!-- Filled by dev agent -->

### File List

<!-- Filled by dev agent -->
