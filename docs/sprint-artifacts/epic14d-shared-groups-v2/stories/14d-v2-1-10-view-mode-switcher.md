# Story 14d-v2-1.10: View Mode Switcher

Status: **SUPERSEDED** - Split into sub-stories (see below)

> **Architecture Alignment (2026-02-01):**
> This story was split into 4 sub-stories to align with Epic 14e Zustand architecture.
> See [Architecture Alignment Plan](../14d-v2-architecture-alignment-plan.md) for decisions.
>
> **Replacement Stories:**
> - [14d-v2-0: Architecture Alignment](./14d-v2-0-architecture-alignment.md) - Creates useViewModeStore
> - [14d-v2-1.10a: ViewMode Store Integration](./14d-v2-1-10a-viewmode-store-integration.md)
> - [14d-v2-1.10b: ViewModeSwitcher UI](./14d-v2-1-10b-viewmodeswitcher-ui.md)
> - [14d-v2-1.10c: Header Mode Indicator](./14d-v2-1-10c-header-mode-indicator.md)
> - [14d-v2-1.10d: Data Filtering Integration](./14d-v2-1-10d-data-filtering-integration.md)
>
> **Original story preserved below for reference.**

---

## Story

As a **user**,
I want **to switch between Personal and Group views**,
So that **I can see my own transactions or shared group transactions**.

## Acceptance Criteria

### Core Functionality

1. **Given** I am on the Home screen
   **When** I tap the logo/icon in the header
   **Then** a group selector appears showing:
   - "Personal" option (always first)
   - List of my groups (from `useUserSharedGroups`)

2. **Given** I select a group from the switcher
   **When** the view switches
   **Then** all views (Home, History, Analytics) filter to show only that group's data
   **And** the header indicates which view mode I'm in
   **And** a visual indicator shows the active group (group icon + name)

3. **Given** I select "Personal"
   **When** the view switches
   **Then** all views show only my personal transactions (no `sharedGroupId` filter)

### Atlas-Suggested Acceptance Criteria (Workflow Integration)

4. **Given** I switch from Personal to Group view
   **When** I'm on Analytics
   **Then** the charts re-render with group-filtered data

5. **Given** I'm in Group view
   **When** I open History
   **Then** I see only transactions with `sharedGroupId` matching my selected group

6. **Given** I switch view mode while filters are applied
   **When** the view updates
   **Then** filters are cleared (prevents stale filter state from wrong context)

7. **Given** I have no groups
   **When** I tap the view mode switcher
   **Then** I see only "Personal" option
   **And** I see a "Create Group" call-to-action button (links to Settings > Groups)

## Dependencies

### Upstream (Required First)
- **Story 1.1**: Legacy Shared Groups Cleanup (codebase prepared)
- **Story 1.4**: Create Shared Group (groups exist to display)
- **Story 1.6**: Accept/Decline Invitation (joined groups appear in list)

### Downstream (Depends on This)
- **Story 2.1**: Tag Transaction to Group (needs view mode context)
- **Story 2.2**: View Group Transactions (needs view mode for filtering)

## Tasks / Subtasks

- [ ] Task 1: Re-enable ViewModeContext (AC: #1-3)
  - [ ] Remove `setGroupMode` stub - implement actual state update
  - [ ] Add `setState({ mode: 'group', groupId, group })` implementation
  - [ ] Keep `setPersonalMode` as-is (already functional)
  - [ ] Remove DEV-only warning in `setGroupMode`
  - [ ] Test: Context updates correctly on mode switch

- [ ] Task 2: Update ViewModeSwitcher to render groups (AC: #1, #7)
  - [ ] Remove "Coming soon" placeholder section
  - [ ] Map `groups` prop to `ViewModeOption` components
  - [ ] Each group shows: icon (Users), name, member count badge
  - [ ] Active group shows checkmark (like Personal option)
  - [ ] Add "Create Group" button when `groups.length === 0`
  - [ ] Test: Groups render correctly, click handlers work

- [ ] Task 3: Wire up header tap to open switcher (AC: #1)
  - [ ] In App.tsx or AppLayout, add state: `isViewModeSwitcherOpen`
  - [ ] On logo/icon tap: `setIsViewModeSwitcherOpen(true)`
  - [ ] Pass groups from `useUserSharedGroups` to ViewModeSwitcher
  - [ ] Handle loading state (show spinner in dropdown header)
  - [ ] Test: Tap opens switcher, Escape/overlay click closes

- [ ] Task 4: Add header visual indicator for current mode (AC: #2)
  - [ ] When `isGroupMode === false`: Show default logo/icon
  - [ ] When `isGroupMode === true`: Show group icon + truncated group name
  - [ ] Use CSS variable colors for consistency
  - [ ] Test: Header updates on mode switch

- [ ] Task 5: Integrate view mode filtering in data hooks (AC: #2, #4, #5)
  - [ ] `useTransactions` hook: Filter by `sharedGroupId` when `isGroupMode`
  - [ ] Analytics context: Pass `sharedGroupId` to aggregation queries
  - [ ] History filter: Include `sharedGroupId` in query when in group mode
  - [ ] Note: Don't auto-tag new transactions (Story 2.1 handles explicit tagging)
  - [ ] Test: Data filters correctly based on view mode

- [ ] Task 6: Clear filters on view mode switch (AC: #6)
  - [ ] In `setGroupMode` and `setPersonalMode`, dispatch filter clear
  - [ ] Access HistoryFiltersContext or pass callback prop
  - [ ] Clear: temporal, category, location filters
  - [ ] Keep: Scroll position (preserve UX continuity)
  - [ ] Test: Filters reset when switching modes

- [ ] Task 7: Update existing tests for ViewModeContext (AC: #1-3)
  - [ ] Remove stub-related tests
  - [ ] Add tests for actual group mode setting
  - [ ] Add tests for mode persistence within session
  - [ ] Test: 100% branch coverage on context

- [ ] Task 8: Update existing tests for ViewModeSwitcher (AC: #1, #7)
  - [ ] Add tests for group list rendering
  - [ ] Add tests for empty groups state ("Create Group" CTA)
  - [ ] Add tests for selection callback with group data
  - [ ] Test: All accessibility attributes present (role, aria-label)

## Dev Notes

### Critical Context: Re-enabling Stubbed Components

This story reactivates the ViewModeContext and ViewModeSwitcher components that were stubbed in Epic 14c-refactor (Stories 14c-refactor.5 and 14c-refactor.13).

**Current State (Stubbed):**
- `ViewModeContext.tsx`: `setGroupMode` logs a warning and does nothing
- `ViewModeSwitcher.tsx`: Shows "Coming soon" placeholder instead of groups

**Target State (Active):**
- `ViewModeContext.tsx`: Full state management for personal/group modes
- `ViewModeSwitcher.tsx`: Renders actual group list from props

### File Locations

| File | Purpose | Lines (Stubbed) |
|------|---------|-----------------|
| `src/contexts/ViewModeContext.tsx` | View mode state management | ~261 |
| `src/components/SharedGroups/ViewModeSwitcher.tsx` | Group selector dropdown | ~252 |
| `tests/unit/contexts/ViewModeContext.test.tsx` | Context unit tests | TBD |
| `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` | Component tests | TBD |

### ViewModeContext Changes

**Before (Stub):**
```typescript
const setGroupMode = useCallback((_groupId: string, _group?: SharedGroup) => {
  if (import.meta.env.DEV) {
    console.warn('[ViewModeContext] setGroupMode called but shared groups are disabled...');
  }
  // Do nothing - feature disabled
}, []);
```

**After (Active):**
```typescript
const setGroupMode = useCallback((groupId: string, group?: SharedGroup) => {
  setState({
    mode: 'group',
    groupId,
    group,
  });

  // Clear filters when switching modes (AC #6)
  clearFilters?.();

  if (import.meta.env.DEV) {
    console.log('[ViewModeContext] Switched to group mode:', groupId);
  }
}, [clearFilters]);
```

### ViewModeSwitcher Changes

**Remove:**
```tsx
{/* Story 14c-refactor.5: "Coming soon" placeholder for shared groups */}
<div data-testid="view-mode-coming-soon" ... >
```

**Add:**
```tsx
{/* Group options */}
{groups.map((group) => (
  <ViewModeOption
    key={group.id}
    testId={`view-mode-option-group-${group.id}`}
    isActive={currentMode === 'group' && groupId === group.id}
    icon={<Users size={24} />}
    name={group.name}
    description={`${group.members.length} ${t('members')}`}
    onClick={() => handleSelectGroup(group)}
  />
))}

{/* Empty state - Create Group CTA */}
{groups.length === 0 && (
  <button onClick={navigateToCreateGroup}>
    {t('createGroup')}
  </button>
)}
```

### Data Filtering Pattern

When `isGroupMode === true`, all data queries should include:

```typescript
// In useTransactions or similar
const query = useMemo(() => {
  const baseQuery = collection(db, 'users', userId, 'transactions');

  if (isGroupMode && groupId) {
    return query(baseQuery, where('sharedGroupId', '==', groupId));
  }

  // Personal mode - no group filter
  return baseQuery;
}, [db, userId, isGroupMode, groupId]);
```

### Architecture Decision: Session-Only Persistence

Per AD-4 from Epic 14d brainstorming, view mode does NOT persist:
- On app open: Always start in Personal mode
- No localStorage or Firestore persistence (removed in 14c-refactor.13)
- Rationale: Simpler architecture, users explicitly choose mode

Epic 14d-v2 may add optional persistence in a later story if user feedback indicates need.

### Translation Keys Required

```json
{
  "selectViewMode": "Seleccionar vista",
  "personal": "Personal",
  "viewModePersonalDescription": "Mis gastos personales",
  "members": "miembros",
  "createGroup": "Crear grupo",
  "noGroupsYet": "Aún no tienes grupos"
}
```

### Workflow Integration Notes (Atlas Analysis)

**Analytics Navigation Flow (#4):**
- `TrendsView`, `DashboardView`, charts must respect `isGroupMode`
- When switching modes, `AnalyticsContext` recalculates aggregations
- May need to invalidate React Query cache on mode switch

**History Filter Flow (#6):**
- `HistoryFiltersContext` filters must include `sharedGroupId` when in group mode
- Filter clear on mode switch prevents showing wrong-context filters

**Scan Receipt Flow (#1):**
- **Important:** New transactions are NOT auto-tagged to current group
- Story 2.1 implements explicit tagging via `sharedGroupId` field
- This story only affects *viewing*, not *creating*

### Testing Strategy

**Unit Tests:**
- ViewModeContext: State transitions, callback stability, error boundary
- ViewModeSwitcher: Rendering, accessibility, keyboard navigation

**Integration Tests:**
- Mode switch triggers data refresh
- Filter clear on mode switch
- Header indicator updates

**E2E Tests (Deferred to Story 2.2):**
- Full flow: Create group → Switch to group → See group transactions

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows
- **Analytics Navigation Flow (#4)**: View mode switch must filter TrendsView, Charts, and drill-down data by `sharedGroupId` when in group mode
- **History Filter Flow (#6)**: Transaction list in History View must respect view mode (personal: no group filter, group: filter by `sharedGroupId`)
- **Scan Receipt Flow (#1)**: Save path should NOT auto-tag transactions with sharedGroupId - users explicitly tag (Story 2.1)
- **Insight Generation Flow (#7)**: Insights should remain personal-mode only (no group insights in v1)

### Downstream Effects to Consider
- Home View: Transaction list filtering must be mode-aware
- Analytics Dashboard: Category and spending breakdowns must respect view mode
- Export functionality: Should export mode-appropriate data (personal OR group, not both)
- Empty states: Need different messaging for personal vs group mode

### Testing Implications
- **Existing tests to verify:** History filter tests, Analytics navigation tests may need view mode setup
- **New scenarios to add:** View mode switch preserves navigation, analytics re-filter on mode change

### Workflow Chain Visualization
```
[Groups Created/Joined] → [THIS STORY: View Mode Switcher] → [Data Filtering in All Views]
                                    ↓
                          [Story 2.1: Tag Transactions]
                                    ↓
                          [Story 2.2: View Group Transactions]
```

## References

- [Epic 14d-v2 Epics](../epics.md) - Full story breakdown
- [ViewModeContext](src/contexts/ViewModeContext.tsx) - Current stub implementation
- [ViewModeSwitcher](src/components/SharedGroups/ViewModeSwitcher.tsx) - Current stub component
- [Story 14c-refactor.13](../../epic14c-refactor/stories/14c-refactor-13-view-mode-state-unification.md) - Stubbing context
- [Atlas Memory: Workflow Chains](/_bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md) - Workflow impact reference

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

