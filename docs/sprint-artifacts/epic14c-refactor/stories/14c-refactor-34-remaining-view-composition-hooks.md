# Story 14c-refactor.34: Create Remaining View Composition Hooks

Status: split

**SPLIT 2026-01-23:** This story exceeded sizing guidelines (5 tasks, 31 subtasks, 8 files).
Split into 3 sub-stories via `atlas-story-sizing` workflow:
- [34a: DashboardView Hook](14c-refactor-34a-dashboard-composition-hook.md) - 3 pts
- [34b: SettingsView Hook](14c-refactor-34b-settings-composition-hook.md) - 3 pts
- [34c: ItemsView Hook + Verification](14c-refactor-34c-items-composition-hook.md) - 2 pts

**Split Strategy:** by_feature - Each view hook is independent with no shared code.

## Story

As a **developer maintaining App.tsx**,
I want **composition hooks for DashboardView, SettingsView, and ItemsView**,
So that **these views can also use spread syntax and further reduce App.tsx line count**.

## Background

### Views Without Composition Hooks

Story 26 created hooks for 4 views (History, Trends, BatchReview, TransactionEditor). The following views still have inline props in App.tsx:

| View | Inline Props | Priority |
|------|-------------|----------|
| DashboardView | ~60 lines | HIGH - Main view |
| SettingsView | ~80 lines | HIGH - Complex settings |
| ItemsView | ~40 lines | MEDIUM |
| InsightsView | ~50 lines | LOW - Deferred (complex) |
| ReportsView | ~50 lines | LOW - Deferred (complex) |
| BatchCaptureView | ~30 lines | LOW - Keep inline |
| StatementScanView | ~20 lines | LOW - Keep inline |
| NotificationsView | ~15 lines | LOW - Keep inline |
| RecentScansView | ~25 lines | LOW - Keep inline |

### Scope

This story creates hooks for the HIGH priority views: **DashboardView, SettingsView, ItemsView**.

InsightsView and ReportsView are explicitly deferred due to complex patterns identified in Story 27.

### Target Reduction

- DashboardView: ~60 lines → 1 line = **-59 lines**
- SettingsView: ~80 lines → 1 line = **-79 lines**
- ItemsView: ~40 lines → 1 line = **-39 lines**
- **Total: -177 lines**

## Acceptance Criteria

1. **Given** DashboardView has ~60 lines of inline props
   **When** this story is completed
   **Then:**
   - `useDashboardViewProps` hook created in `src/hooks/app/`
   - Hook includes all props required by DashboardView
   - App.tsx uses spread: `<DashboardView {...dashboardViewProps} />`

2. **Given** SettingsView has ~80 lines of inline props
   **When** this story is completed
   **Then:**
   - `useSettingsViewProps` hook created in `src/hooks/app/`
   - Hook includes all props required by SettingsView
   - App.tsx uses spread: `<SettingsView {...settingsViewProps} />`

3. **Given** ItemsView has ~40 lines of inline props
   **When** this story is completed
   **Then:**
   - `useItemsViewProps` hook created in `src/hooks/app/`
   - Hook includes all props required by ItemsView
   - App.tsx uses spread: `<ItemsView {...itemsViewProps} />`

4. **Given** InsightsView and ReportsView have complex patterns
   **When** this story is completed
   **Then:**
   - These views are NOT addressed
   - Inline props remain for these views
   - Documented as intentional deferral

5. **Given** all new hooks are created
   **When** this story is completed
   **Then:**
   - App.tsx reduced by ~177 lines
   - All tests pass
   - Hooks exported from `src/hooks/app/index.ts`

## Tasks / Subtasks

### Task 1: Create useDashboardViewProps

- [ ] 1.1 Audit DashboardView props interface
- [ ] 1.2 Create `src/hooks/app/useDashboardViewProps.ts`
- [ ] 1.3 Define options interface (all inputs from App.tsx)
- [ ] 1.4 Define return type (all props for DashboardView)
- [ ] 1.5 Implement hook with useMemo
- [ ] 1.6 Create `tests/unit/hooks/app/useDashboardViewProps.test.ts`
- [ ] 1.7 Export from `src/hooks/app/index.ts`

### Task 2: Create useSettingsViewProps

- [ ] 2.1 Audit SettingsView props interface
- [ ] 2.2 Create `src/hooks/app/useSettingsViewProps.ts`
- [ ] 2.3 Define options interface
- [ ] 2.4 Define return type
- [ ] 2.5 Implement hook with useMemo
- [ ] 2.6 Create `tests/unit/hooks/app/useSettingsViewProps.test.ts`
- [ ] 2.7 Export from `src/hooks/app/index.ts`

### Task 3: Create useItemsViewProps

- [ ] 3.1 Audit ItemsView props interface
- [ ] 3.2 Create `src/hooks/app/useItemsViewProps.ts`
- [ ] 3.3 Define options interface
- [ ] 3.4 Define return type
- [ ] 3.5 Implement hook with useMemo
- [ ] 3.6 Create `tests/unit/hooks/app/useItemsViewProps.test.ts`
- [ ] 3.7 Export from `src/hooks/app/index.ts`

### Task 4: Integrate into App.tsx

- [ ] 4.1 Import all 3 new hooks
- [ ] 4.2 Call hooks in component body
- [ ] 4.3 Replace DashboardView inline props with spread
- [ ] 4.4 Replace SettingsView inline props with spread
- [ ] 4.5 Replace ItemsView inline props with spread

### Task 5: Verification

- [ ] 5.1 Run full test suite
- [ ] 5.2 Manual smoke test Dashboard
- [ ] 5.3 Manual smoke test Settings (all sub-views)
- [ ] 5.4 Manual smoke test Items view
- [ ] 5.5 Count line reduction: `wc -l src/App.tsx`

## Dev Notes

### Estimation

- **Points:** 8 pts
- **Risk:** MEDIUM - 3 hooks to create, SettingsView is complex

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 35 (final line count target)

### SettingsView Complexity

SettingsView has the most props because it manages:
- User preferences (theme, language, currency, date format)
- Category mappings CRUD
- Merchant mappings CRUD
- Subcategory mappings CRUD
- Item name mappings CRUD
- Trusted merchants
- Export functionality
- Profile settings
- Notification settings
- Data management (sign out, delete account)

The hook will need to accept many callback props.

### Hook Pattern

Follow the same pattern as existing hooks:

```tsx
export interface UseDashboardViewPropsOptions {
    // All data from App.tsx state
}

export interface DashboardViewDataProps {
    // All props for DashboardView
}

export function useDashboardViewProps(
    options: UseDashboardViewPropsOptions
): DashboardViewDataProps {
    return useMemo(() => ({
        // Transform options to props
    }), [/* dependencies */]);
}
```

## References

- [Story 26: View Prop Composition Hooks](14c-refactor-26-view-prop-composition-hooks.md) - Pattern reference
- [Story 29 Feature Review](14c-refactor-29-app-prop-composition-integration.md) - Identified need
- [Source: src/views/DashboardView.tsx]
- [Source: src/views/SettingsView.tsx]
- [Source: src/views/ItemsView.tsx]

## File List

**Created:**
- `src/hooks/app/useDashboardViewProps.ts`
- `src/hooks/app/useSettingsViewProps.ts`
- `src/hooks/app/useItemsViewProps.ts`
- `tests/unit/hooks/app/useDashboardViewProps.test.ts`
- `tests/unit/hooks/app/useSettingsViewProps.test.ts`
- `tests/unit/hooks/app/useItemsViewProps.test.ts`

**Modified:**
- `src/hooks/app/index.ts` - Export new hooks
- `src/App.tsx` - Integrate new hooks
