# Story 7.9: UX Breadcrumb & Navigation Alignment

Status: done

## Story

As a **user**,
I want **the breadcrumb navigation to match the approved UX design with compact side-by-side buttons and dropdown menus**,
so that **I can efficiently navigate temporal and category hierarchies without excessive scrolling**.

## Acceptance Criteria

1. **AC #1:** Temporal and Category breadcrumbs display as two compact buttons side-by-side (not vertically stacked)
2. **AC #2:** Each breadcrumb button shows current level only (e.g., "November" or "Groceries") with an icon prefix
3. **AC #3:** Breadcrumb buttons have outlined style with border matching UX spec: `border: 1px solid var(--secondary)`
4. **AC #4:** Tapping a breadcrumb button opens a dropdown overlay showing all ancestor levels
5. **AC #5:** Dropdown items show level indicator (e.g., "Year", "Quarter") with the label
6. **AC #6:** Active level in dropdown is highlighted with accent background and white text
7. **AC #7:** Breadcrumb icons match UX spec: Calendar icon for temporal, Tag icon for category
8. **AC #8:** Dropdowns close when tapping outside or selecting an item
9. **AC #9:** Chart mode toggle matches UX spec: outlined container with active button filled with accent color
10. **AC #10:** Mode toggle shows icons (Pie chart for Aggregation, Bar chart for Comparison) with labels

## Tasks / Subtasks

- [x] Task 1: Redesign TemporalBreadcrumb component (AC: #1-#8)
  - [x] Change layout from vertical chips to compact button
  - [x] Show only current level label with Calendar icon
  - [x] Add chevron-down indicator for dropdown affordance
  - [x] Implement dropdown overlay with all ancestor levels
  - [x] Style dropdown items with level indicators
  - [x] Highlight active level with accent styling
  - [x] Add outside-click handler to close dropdown

- [x] Task 2: Redesign CategoryBreadcrumb component (AC: #1-#8)
  - [x] Change layout from vertical chips to compact button
  - [x] Show only current category label with Tag icon
  - [x] Add chevron-down indicator for dropdown affordance
  - [x] Implement dropdown overlay with category hierarchy
  - [x] Style dropdown items with level indicators
  - [x] Highlight active category with accent styling
  - [x] Add outside-click handler to close dropdown

- [x] Task 3: Update breadcrumb container layout (AC: #1)
  - [x] TrendsView already has row layout (lines 482-512)
  - [x] Gap-2 between temporal and category buttons
  - [x] Responsive behavior maintained

- [x] Task 4: Redesign ChartModeToggle component (AC: #9, #10)
  - [x] Update container to outlined style with secondary border
  - [x] Update active button to have accent background with white text
  - [x] Update inactive button to show secondary text only
  - [x] Pie chart icon for Aggregation mode (already present)
  - [x] Bar chart icon for Comparison mode (already present)
  - [x] Touch targets at 44px minimum

- [x] Task 5: Update TrendsView integration (AC: All)
  - [x] Breadcrumb container styling confirmed correct
  - [x] Breadcrumbs and chart toggle work together
  - [x] Navigation flow verified

- [x] Task 6: Run tests and verify (AC: All)
  - [x] TypeScript compilation passes
  - [x] 610 unit tests pass
  - [x] 300 integration tests pass
  - [x] Build succeeds

## Dev Notes

### Architecture Alignment

This story aligns the breadcrumb navigation implementation with the approved UX design in [docs/ux-design-directions.html](docs/ux-design-directions.html).

**Current Implementation Issues:**
- Breadcrumbs stack vertically instead of horizontally
- Each level shows as a separate chip instead of collapsed button
- Missing dropdown behavior
- Chart toggle styling doesn't match spec

**Target Design (from UX spec):**
```html
<!-- Two buttons side-by-side -->
<div class="px-4 py-3 flex gap-3 relative">
    <!-- Temporal Button -->
    <button class="breadcrumb-button w-full justify-between">
        <div class="flex items-center gap-2">
            <svg><!-- Calendar icon --></svg>
            <span>November</span>
        </div>
        <svg><!-- Chevron down --></svg>
    </button>

    <!-- Category Button -->
    <button class="breadcrumb-button w-full justify-between">
        <div class="flex items-center gap-2">
            <svg><!-- Tag icon --></svg>
            <span>All</span>
        </div>
        <svg><!-- Chevron down --></svg>
    </button>
</div>
```

**Breadcrumb Button CSS (from UX spec):**
```css
.breadcrumb-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--surface);
    border: 1px solid var(--secondary);
    opacity: 0.8;
}
```

**Dropdown Item CSS (from UX spec):**
```css
.breadcrumb-item {
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.breadcrumb-item.active {
    background-color: var(--accent);
    color: white;
    font-weight: 600;
}
```

### Translation Keys Required

No new translation keys needed - existing keys cover temporal and category labels.

### Project Structure Notes

**Files to Modify:**
- `src/components/analytics/TemporalBreadcrumb.tsx` - Complete redesign
- `src/components/analytics/CategoryBreadcrumb.tsx` - Complete redesign
- `src/components/analytics/ChartModeToggle.tsx` - Style updates
- `src/views/TrendsView.tsx` - Container layout updates

**No New Files Expected:**
- Dropdown logic integrated into breadcrumb components

### Dependency on Previous Stories

This story depends on **Story 7.8 (Bug Fixes & Polish) being complete**.

### Testing Strategy

```bash
# During development
npx tsc --noEmit
npm run test:unit -- --run "tests/unit/analytics/*"
npm run test:integration -- --run "tests/integration/analytics/*"

# Before marking story as "review"
npm run test:all
```

### References

- [Source: docs/ux-design-directions.html](docs/ux-design-directions.html) - Approved UX design
- [Source: docs/architecture-epic7.md](docs/architecture-epic7.md) - Epic 7 architecture
- [Source: docs/prd-epic7.md](docs/prd-epic7.md) - PRD requirements

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/epic7/7-9-ux-breadcrumb-alignment.context.xml](7-9-ux-breadcrumb-alignment.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Story 7.9 Implementation Complete - 2025-12-07**

All acceptance criteria satisfied:

1. **Breadcrumb Redesign (AC #1-#8):**
   - TemporalBreadcrumb: Compact button with Calendar icon, ChevronDown, dropdown overlay
   - CategoryBreadcrumb: Compact button with Tag icon, ChevronDown, dropdown overlay
   - Level indicators added (Year, Quarter, Month, Week, Day / All, Category, Group, Subcategory)
   - Active level highlighted with blue-500 background and white text
   - Outside-click and Escape key close dropdowns
   - Full keyboard navigation (Arrow keys, Home, End, Enter, Space)

2. **Outlined Style (AC #3, #9):**
   - Buttons: `bg-white border border-slate-400` (light), `dark:bg-slate-800 dark:border-slate-500` (dark)
   - ChartModeToggle: Same outlined container style with rounded-lg corners
   - Active mode: `bg-blue-500 text-white font-medium`

3. **Translations Added:**
   - `levelYear`, `levelQuarter`, `levelMonth`, `levelWeek`, `levelDay`
   - `levelAll`, `levelCategory`, `levelGroup`, `levelSubcategory`
   - Spanish translations included

4. **Tests Updated:**
   - Changed font-bold → font-semibold for active level styling
   - Changed bg-slate-100/bg-slate-800 → bg-white/border for outlined style
   - Changed rounded-full → rounded-lg/rounded-md for segmented control
   - All 610 unit tests pass, all 300 integration tests pass

### File List

**Modified Files:**
- `src/components/analytics/TemporalBreadcrumb.tsx` - Complete redesign with outlined style and level indicators
- `src/components/analytics/CategoryBreadcrumb.tsx` - Complete redesign with outlined style and level indicators
- `src/components/analytics/ChartModeToggle.tsx` - Updated to outlined segmented control
- `src/utils/translations.ts` - Added level indicator translations
- `tests/unit/analytics/TemporalBreadcrumb.test.tsx` - Updated for new styling
- `tests/unit/analytics/CategoryBreadcrumb.test.tsx` - Updated for new styling
- `tests/unit/analytics/ChartModeToggle.test.tsx` - Updated for new styling

## Code Review

### Review Date: 2025-12-07
### Reviewer: Senior Dev Agent (Code Review Workflow)

### Decision: ✅ APPROVED

---

### Acceptance Criteria Validation

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| #1 | Breadcrumbs display as compact side-by-side buttons | ✅ PASS | TrendsView lines 482-512: `flex justify-between items-center gap-2` layout |
| #2 | Each button shows current level only with icon prefix | ✅ PASS | TemporalBreadcrumb:406-409 (Calendar icon), CategoryBreadcrumb:344-347 (Tag icon) |
| #3 | Outlined style with secondary border | ✅ PASS | `bg-white border border-slate-300` / `bg-slate-800 border border-slate-500` |
| #4 | Dropdown overlay shows ancestor levels | ✅ PASS | Both components implement `buildTemporalPath` / `buildCategoryPath` functions |
| #5 | Level indicator in dropdown items | ✅ PASS | `levelLabel` property with translations (levelYear, levelQuarter, etc.) |
| #6 | Active level highlighted with accent | ✅ PASS | `bg-blue-500 text-white font-semibold` for current level |
| #7 | Icons match UX spec | ✅ PASS | Calendar from lucide-react (temporal), Tag (category), ChevronDown (both) |
| #8 | Dropdowns close on outside-click | ✅ PASS | `handleClickOutside` event listener in both components |
| #9 | Chart toggle outlined style | ✅ PASS | ChartModeToggle:122-127 with `bg-white border border-slate-300` |
| #10 | Mode toggle shows icons with labels | ✅ PASS | PieChart for Aggregation, BarChart2 for Comparison |

### Task Completion Validation

| Task | Description | Status | Evidence |
|------|-------------|--------|----------|
| 1 | Redesign TemporalBreadcrumb | ✅ COMPLETE | 453 lines, dropdown overlay, level indicators, outlined style |
| 2 | Redesign CategoryBreadcrumb | ✅ COMPLETE | 391 lines, dropdown overlay, level indicators, outlined style |
| 3 | Container layout update | ✅ COMPLETE | TrendsView row layout already correct |
| 4 | Redesign ChartModeToggle | ✅ COMPLETE | 183 lines, outlined container, accent-fill active state |
| 5 | TrendsView integration | ✅ COMPLETE | All components render correctly with theme/locale props |
| 6 | Tests and verification | ✅ COMPLETE | 610 unit tests pass, TypeScript compiles |

### Code Quality Assessment

**Architecture Alignment:**
- ✅ Follows Pattern 3 (Breadcrumb Dropdown Pattern) from architecture-epic7.md
- ✅ Uses dual-axis independence (temporal navigation preserves category filter)
- ✅ Proper use of Context API via `useAnalyticsNavigation` hook

**React Best Practices:**
- ✅ Hooks called unconditionally before early returns
- ✅ Proper use of `useCallback` for event handlers
- ✅ Proper cleanup of event listeners in `useEffect`
- ✅ Controlled component pattern with state management

**Accessibility (WCAG 2.1):**
- ✅ `role="navigation"` with `aria-label`
- ✅ `aria-expanded` on toggle button
- ✅ `aria-haspopup="listbox"` with `role="listbox"` dropdown
- ✅ `aria-selected` on options
- ✅ Full keyboard navigation (Arrow keys, Home, End, Enter, Space, Escape)
- ✅ 44px minimum touch targets (`min-w-11 min-h-11`)
- ✅ Focus management (returns focus to button on close)

**i18n Support:**
- ✅ Level indicators translated (en/es)
- ✅ Month names use `Intl.DateTimeFormat` for locale-aware formatting
- ✅ Props-based locale switching

**Theme Support:**
- ✅ Light/dark themes via `theme` prop
- ✅ Conditional styling with `isDark` boolean (matches app pattern)

**Test Coverage:**
- ✅ TemporalBreadcrumb: ~50 tests covering all AC
- ✅ CategoryBreadcrumb: ~50 tests covering all AC
- ✅ ChartModeToggle: ~40 tests covering all AC
- ✅ Tests updated to match new outlined styling

### Security Review

- ✅ No user input directly rendered (XSS-safe)
- ✅ No sensitive data handling
- ✅ Event handlers properly scoped to component

### Suggestions (Non-blocking)

1. **Consider extracting shared dropdown logic** - Both breadcrumb components have nearly identical dropdown state management. A custom `useDropdown` hook could reduce duplication.

2. **CSS class consolidation** - The `buttonClasses` and `dropdownClasses` arrays are quite long. Consider extracting to CSS modules or a utility function.

These are minor improvements for future refactoring, not blockers for this story.

---

### Conclusion

The implementation fully satisfies all 10 acceptance criteria and follows React/TypeScript best practices. Code is well-documented with JSDoc comments referencing the architecture and story documentation. Tests have been updated to validate the new outlined styling. The breadcrumb navigation now matches the approved UX specification.

**Recommended Action:** Move story status to `done`.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Story created for UX alignment after reviewing production vs design | SM Agent |
| 2025-12-07 | Implementation complete - all AC satisfied, 910 tests pass | Dev Agent |
| 2025-12-07 | Code review: APPROVED - all AC validated, code quality verified | Senior Dev Agent |
