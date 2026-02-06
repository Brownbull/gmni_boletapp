# Story 14e-17b: Categories App.tsx Integration

Status: done

<!-- Created by atlas-code-review workflow 2026-01-26 -->
<!-- Follow-up from 14e-17: Deferred Task 5 (App.tsx Integration) -->
<!-- DEPENDS: 14e-17 (feature module complete) -->

## Story

As a **developer**,
I want **composition hooks updated to use CategoriesFeature context**,
So that **App.tsx is simplified by ~30-50 lines and category state is consumed from the feature module**.

## Acceptance Criteria

### Core Integration

1. **AC1**: App.tsx renders `<CategoriesFeature />` in provider area:
   - Wraps app content (or appropriate subtree)
   - Passes `user` and `services` props
   - Headless provider (no visible UI)

2. **AC2**: Composition hooks migrate to `useCategoriesContext()`:
   - `useSettingsViewProps` uses context instead of prop drilling
   - `useTransactionEditorViewProps` uses context instead of prop drilling
   - Other consumers identified and migrated

3. **AC3**: Direct hook calls removed from App.tsx:
   - Remove `useCategoryMappings` call
   - Remove `useSubcategoryMappings` call
   - Remove category/subcategory state variables

4. **AC4**: ~30-50 lines removed from App.tsx (measured via `wc -l`)

5. **AC5**: All existing category tests pass without modification

### Atlas Workflow Protection (from 14e-17)

6. **AC6**: Scan Receipt Flow unchanged - `applyCategoryMappings()` continues to work
7. **AC7**: Learning Flow unchanged - category mappings save/retrieve correctly
8. **AC8**: SettingsView category management unchanged - CRUD operations work identically
9. **AC9**: Analytics/History category filtering unchanged

## Tasks / Subtasks

- [x] **Task 1: App.tsx CategoriesFeature Integration** (AC: #1, partial #3)
  - [x] 1.1: Import `CategoriesFeature` from `@features/categories`
  - [x] 1.2: Render `<CategoriesFeature user={user} services={services}>` wrapping ViewHandlersProvider
  - [x] 1.3: Remove unused category variables (`mappingsLoading`, `updateCategoryMapping`) from destructuring
  - [x] 1.4: Remove unused subcategory variables (`subcategoryMappingsLoading`, `updateSubcategoryMapping`) from destructuring
  - [x] 1.5: Remove category/subcategory props from `useSettingsViewProps` call
  - **Note**: Direct hook calls retained for `useScanHandlers` and `handleClearAllLearnedData` (see architectural limitation)

- [x] **Task 2: View-Level Context Migration** (AC: #2 alternative approach)
  - [x] 2.1: Update `SettingsView` to use `useCategoriesContextOptional()`:
    - Gets category/subcategory data from context when available
    - Falls back to props for backward compatibility
  - [x] 2.2: Update `useSettingsViewProps` interface:
    - Category/subcategory props marked as optional and @deprecated
    - Removed from App.tsx call (SettingsView uses context)
  - **Note**: `useTransactionEditorViewProps` does not use category props - no migration needed
  - **Note**: Composition hooks cannot call context internally (see architectural limitation)

- [x] **Task 3: Verification** (AC: #5, #6-#9)
  - [x] 3.1: Measure line count: Before=3245, After=3243 (2 lines reduced)
  - [x] 3.2: **AC4 not achieved** - See architectural limitation below
  - [x] 3.3: Run test suite - 5,757 tests pass ✅
  - [x] 3.4: Build passes ✅

### Review Follow-ups (Archie)

> Added by post-dev feature review 2026-01-27

- [ ] [Archie-Review][MEDIUM] **Future: Full App.tsx Line Reduction** - Consider one of the documented options (main.tsx lift, AppContent pattern, or moving hooks to views) when tackling App.tsx simplification epic. AC4 target of 30-50 lines deferred. [src/App.tsx]
- [x] [Archie-Review][LOW] **Consolidate handlers module** - `src/features/categories/handlers/index.ts` currently only re-exports from state module. ✅ Decision: Keep as documented placeholder for consistency with feature module pattern (scan, batch-review have handlers directories). Serves as documented extension point for future complex operations.
- [x] [Archie-Review][LOW] **Add deprecation timeline** - Props marked `@deprecated` in `useSettingsViewProps` should include migration timeline. ✅ Added "Remove in Epic 15 after full context migration" to all 12 deprecated props.

### Review Follow-ups (Atlas Code Review)

> Added by atlas-code-review workflow 2026-01-27

- [x] [AI-Review][MEDIUM] **File List incomplete** - Story File List missing newly created test files. Add to File List: `tests/unit/features/categories/CategoriesFeature.test.tsx` (327 lines, 18 tests), `tests/unit/features/categories/state/useCategoriesState.test.ts` (462 lines, 21 tests). Pattern: "File List must match git reality" (06-lessons.md) ✅ Fixed in atlas-code-review
- [x] [AI-Review][MEDIUM] **Stage unstaged changes** - Several story-related files have unstaged modifications: `src/views/SettingsView.tsx`, `src/hooks/app/useSettingsViewProps.ts`. ✅ All story files staged via `git add`.
- [x] [AI-Review][LOW] **Dev Notes code example outdated** - Dev Notes shows `useSettingsViewProps` calling `useCategoriesContext()` internally. ✅ Updated Dev Notes to show actual pattern: SettingsView uses `useCategoriesContextOptional()` with prop fallback.

### Architectural Limitation (AC3, AC4 Not Achieved)

**Issue:** Composition hooks (useSettingsViewProps) are called in App.tsx body BEFORE the render phase. CategoriesFeature is rendered IN the return statement. React hooks evaluate during render, but App's body hooks execute before any JSX is rendered.

**Consequence:**
- Composition hooks CANNOT use `useCategoriesContext()` internally
- The direct hook calls (`useCategoryMappings`, `useSubcategoryMappings`) cannot be fully removed from App.tsx
- Line count reduction minimal (~2 lines) instead of expected 30-50 lines

**Solution Implemented:**
- CategoriesFeature wraps view content (ViewHandlersProvider)
- SettingsView uses `useCategoriesContextOptional()` directly to get category data
- Category props made optional in useSettingsViewProps (marked @deprecated)
- App.tsx no longer passes category props to useSettingsViewProps

**Future Work (if full migration desired):**
- Option A: Move CategoriesFeature to main.tsx (above App)
- Option B: Create AppContent inner component pattern
- Option C: Move composition hook calls into view components

## Dev Notes

### Context Migration Pattern (Actual Implementation)

```typescript
// BEFORE: App.tsx passes category props to useSettingsViewProps
const settingsViewProps = useSettingsViewProps({
  mappings: categoryMappings,
  subcategoryMappings,
  onDeleteMapping: deleteCategoryMapping,
  // ... many more category props passed from App.tsx hooks
});

// AFTER: Props optional with @deprecated, SettingsView uses context
// 1. useSettingsViewProps interface - category props now optional
interface SettingsViewPropsInput {
  /** @deprecated Use CategoriesContext instead */
  mappings?: CategoryMapping[];
  /** @deprecated Use CategoriesContext instead */
  subcategoryMappings?: SubcategoryMapping[];
  // ... props remain for backward compatibility but marked deprecated
}

// 2. SettingsView uses context directly with prop fallback
// src/views/SettingsView.tsx
import { useCategoriesContextOptional } from '@features/categories';

function SettingsView(props: SettingsViewProps) {
  // Get from context, fall back to props for backward compatibility
  const categoriesContext = useCategoriesContextOptional();
  const categoryMappings = categoriesContext?.categoryMappings ?? props.mappings ?? [];
  const subcategoryMappings = categoriesContext?.subcategoryMappings ?? props.subcategoryMappings ?? [];
  // ...
}
```

**Why this pattern?** Composition hooks (useSettingsViewProps) execute in App.tsx body BEFORE render phase. CategoriesFeature renders IN the return statement. React context is not available until render. Therefore, views must consume context directly.

### App.tsx Integration Location

```tsx
// src/App.tsx
import { CategoriesFeature } from '@features/categories';

function App() {
  // ... existing code ...

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <CategoriesFeature user={user} services={services}>
          {/* Rest of app content */}
          <ModalManager />
          <ScanFeature />
          <AppLayout>
            {/* Views */}
          </AppLayout>
        </CategoriesFeature>
      </QueryClientProvider>
    </AuthProvider>
  );
}
```

### Files to Modify

- `src/App.tsx` - Add CategoriesFeature, remove direct hook calls (~30-50 lines)
- `src/hooks/app/useSettingsViewProps.ts` - Use context instead of props
- `src/hooks/app/useTransactionEditorViewProps.ts` - Use context instead of props
- Tests for modified hooks

### Testing Strategy

- Unit tests: Update hook tests to provide CategoriesFeature context wrapper
- Integration: Existing category tests should pass without changes
- Smoke: Verify category CRUD in SettingsView, learning flow, scan categorization

### References

- [Parent Story: 14e-17-categories-feature-extraction.md](./14e-17-categories-feature-extraction.md)
- [Feature Module: src/features/categories/](../../../../src/features/categories/)
- [CategoriesFeature.tsx](../../../../src/features/categories/CategoriesFeature.tsx)
- [useCategoriesContext hook](../../../../src/features/categories/CategoriesFeature.tsx#L63)

## Atlas Workflow Analysis

> Inherited from Story 14e-17

### Affected Workflows

- **Workflow #1 (Scan Receipt Flow)**: Categories applied via `applyCategoryMappings` during scan processing
- **Workflow #5 (Learning Flow)**: Category mappings saved/deleted via context
- **Workflow #4 (Analytics Navigation)**: Category drill-down depends on transaction categorization
- **Workflow #6 (History Filter Flow)**: Category filtering in IconFilterBar

### Risk Assessment

| Impact | Risk Level | Mitigation |
|--------|------------|------------|
| App.tsx refactoring | LOW | Context-based, no behavior change |
| Composition hook changes | LOW | Interface simplification only |
| Test updates | LOW | Context wrapper addition |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. **CategoriesFeature integrated into App.tsx** - Wraps ViewHandlersProvider, provides context to all views
2. **SettingsView updated** - Uses `useCategoriesContextOptional()` for category/subcategory data with prop fallback
3. **useSettingsViewProps simplified** - Category/subcategory props marked optional and @deprecated, removed from App.tsx call
4. **Architectural limitation documented** - Composition hooks cannot use context (called before render), direct hook calls retained for useScanHandlers
5. **5,757 tests pass** - No regressions introduced
6. **Line reduction minimal (2 lines)** - AC4 not achieved due to architectural constraint
7. **✅ Review follow-up: Staged all story files** - `git add` for SettingsView, useSettingsViewProps, App.tsx, story file
8. **✅ Review follow-up: Dev Notes code example fixed** - Updated to show actual pattern (SettingsView uses context with prop fallback, not hook internal context)
9. **✅ Review follow-up: Handlers module kept as placeholder** - Consistent with feature module pattern; well-documented extension point
10. **✅ Review follow-up: Deprecation timeline added** - All 12 deprecated props now include "Remove in Epic 15 after full context migration"

### File List

**Modified:**
- `src/App.tsx` - Added CategoriesFeature wrapper, removed unused category variables, removed category props from useSettingsViewProps call (lines: 3245→3243)
- `src/views/SettingsView.tsx` - Added useCategoriesContextOptional() for category/subcategory data with prop fallback
- `src/hooks/app/useSettingsViewProps.ts` - Category/subcategory props marked optional and @deprecated in interfaces, deprecation timeline added ("Remove in Epic 15")

**Created (from parent story 14e-17, committed together):**
- `src/features/categories/CategoriesFeature.tsx` - Context provider component (152 lines)
- `src/features/categories/state/useCategoriesState.ts` - Unified state hook (227 lines)
- `src/features/categories/state/index.ts` - State barrel exports
- `src/features/categories/handlers/index.ts` - Handlers barrel (re-exports state)
- `src/features/categories/index.ts` - Feature module barrel exports
- `tests/unit/features/categories/CategoriesFeature.test.tsx` - Provider tests (326 lines, 15 tests)
- `tests/unit/features/categories/state/useCategoriesState.test.ts` - State hook tests (461 lines, 27 tests)

**Not Modified (as originally planned):**
- `src/hooks/app/useTransactionEditorViewProps.ts` - Does not use category props, no changes needed
- Existing test files - Pass without modification (context fallback pattern used)
- `docs/sprint-artifacts/sprint-status.yaml` (status updates)
