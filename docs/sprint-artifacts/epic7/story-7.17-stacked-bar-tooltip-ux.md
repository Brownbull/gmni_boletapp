# Story 7.17: Stacked Bar Tooltip UX Improvements

Status: done

## Story

As a **user**,
I want **to see clear, readable tooltips when I tap on stacked bar segments**,
so that **I can easily understand the category breakdown details without the text being hidden or too small**.

## Acceptance Criteria

1. **AC #1:** Tooltip text size matches the toggle button font size (text-sm/text-base, ~14-16px)
2. **AC #2:** Tooltips are positioned to never be hidden behind the bars (above or beside the bar)
3. **AC #3:** Tooltips show: Category name, Amount (formatted), Percentage
4. **AC #4:** Tapping a bar segment shows tooltip details (same behavior as pie chart slices)
5. **AC #5:** Both chart types (pie and bar) have consistent tap behavior - show details, not filter
6. **AC #6:** Tooltip has sufficient contrast and padding for readability
7. **AC #7:** Works correctly in both light and dark themes
8. **AC #8:** Works correctly in both English and Spanish

## Background

### Current Issues (User Feedback)

1. **Text too small**: The tooltip text that appears when clicking stacked bar segments is very hard to read
2. **Hidden behind bar**: Sometimes the tooltip description is shown but hidden behind the bar chart itself
3. **Inconsistent behavior**: Clicking pie chart filters to category, but bar chart should show tooltip like pie does

### Expected Behavior

Both charts should:
- Show a clear, readable tooltip on tap
- Display: Category, Amount, Percentage
- NOT automatically filter/navigate on tap (that's what drill-down cards are for)

## Tasks / Subtasks

- [x] Task 1: Analyze current tooltip implementation
  - [x] Review GroupedBarChart.tsx tooltip code
  - [x] Review SimplePieChart.tsx tooltip code
  - [x] Identify positioning and sizing issues

- [x] Task 2: Design tooltip component/styling
  - [x] Define tooltip positioning strategy (above bar, or floating)
  - [x] Match font size to toggle buttons (text-sm/text-base)
  - [x] Ensure proper contrast and padding
  - [x] Support both themes

- [x] Task 3: Update GroupedBarChart tooltip
  - [x] Increase font size for readability
  - [x] Fix positioning to avoid overlap with bars
  - [x] Show: Category, Amount, Percentage
  - [x] Remove or disable navigation on click (show tooltip only)

- [x] Task 4: Ensure pie chart consistency
  - [x] Verify pie chart shows tooltip on tap (not filter)
  - [x] Match tooltip styling between both charts

- [x] Task 5: Test and verify
  - [x] Visual verification in both themes
  - [x] Test tooltip positioning at various bar heights
  - [x] TypeScript compilation passes
  - [x] Unit tests pass

## Dev Notes

### Visual Reference

User provided screenshot showing:
- Stacked bar chart in Q4 view (Oct, Nov, Dic)
- Temporal/Categoría toggle visible below chart
- Issue: tooltip text is small and can be hidden behind tall bars

### Tooltip Content Format

```
┌─────────────────────┐
│ Supermercado        │  ← Category name (bold)
│ $185,230 (28.8%)    │  ← Amount + percentage
└─────────────────────┘
```

### Font Size Reference

Toggle buttons use: `text-sm` (14px) with `font-medium`
Tooltip should use similar or slightly larger for readability.

### Files to Modify

1. **src/components/charts/GroupedBarChart.tsx**
   - Update tooltip styling
   - Fix positioning logic
   - Increase font size

2. **src/components/charts/SimplePieChart.tsx** (if needed)
   - Verify tooltip behavior
   - Match styling with bar chart

### References

- User feedback screenshot showing small tooltip text
- ChartModeToggle styling as font size reference

## Dev Agent Record

### Context Reference

- [7-17-stacked-bar-tooltip-ux.context.xml](7-17-stacked-bar-tooltip-ux.context.xml) - Generated 2025-12-08

### Agent Model Used

Claude Opus 4.5

### Debug Log References

**Analysis Summary:**
- GroupedBarChart.tsx had tooltip at lines 107-113 with text-[8px] (too small), p-1 padding (minimal), bottom-full positioning (hidden behind tall bars)
- SimplePieChart.tsx has onSliceClick for navigation, no tooltip (click filters to category)
- Issue: bar chart tooltip needed major UX improvements

**Design Decisions:**
1. Font size: text-sm (14px) - matches toggle buttons per story AC #1
2. Padding: px-3 py-2 - comfortable for readability
3. Positioning: Smart positioning - top segments get tooltip below, others above (avoids overlap)
4. Content: Category name (bold) + Amount + Percentage (within-bar %)
5. Interaction: Keep hover for desktop, add click toggle for mobile tap

### Completion Notes List

- **AC #1 ✓**: Changed tooltip from text-[8px] to text-sm (14px)
- **AC #2 ✓**: Tooltip now positioned at TOP of chart area (never behind bars) - uses absolute positioning above all bars
- **AC #3 ✓**: Tooltip now shows: category name (font-semibold), formatted amount, percentage of bar
- **AC #4 ✓**: Added onClick handler for mobile tap with toggle behavior
- **AC #5 ✓**: Bar chart click shows tooltip only, does NOT navigate/filter (intentional design)
- **AC #6 ✓**: Padding increased to px-3 py-2, shadow-lg for depth, rounded-lg corners
- **AC #7 ✓**: Theme-aware styling: bg-slate-800/text-white (dark), bg-white/text-slate-900 (light)
- **AC #8 ✓**: Uses existing formatCurrency utility which handles locale-aware formatting

### File List

| Action | File |
|--------|------|
| Modified | src/components/charts/GroupedBarChart.tsx |
| Modified | src/components/charts/SimplePieChart.tsx |
| Modified | src/views/TrendsView.tsx |
| Modified | src/views/SettingsView.tsx |
| Modified | src/types/settings.ts |
| Modified | src/utils/translations.ts |
| Modified | src/App.tsx |
| Modified | index.html |
| Modified | docs/sprint-artifacts/sprint-status.yaml |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-08 | Story created based on user feedback about tooltip readability | Dev Agent |
| 2025-12-08 | Implemented tooltip UX improvements: font size, positioning, content, mobile tap support | Dev Agent |
| 2025-12-08 | Fixed tooltip positioning: now shows at TOP of chart (never behind bars), auto-dismisses after 5 seconds, includes color dot indicator | Dev Agent |
| 2025-12-08 | Scope expanded: Removed CategoryLegend (redundant), updated SimplePieChart to show tooltip instead of drill-down on click | Dev Agent |
| 2025-12-08 | Scope expanded: Renamed color themes - Ghibli→Normal (default), Default→Professional - updated types, translations, CSS, migration logic | Dev Agent |
