# Story 14.15b: Transaction Selection Mode & Groups

**Status:** ready-for-review
**Points:** 5
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.14 (Transaction List Redesign)
**Mockup:** [transaction-list.html](../../../uxui/mockups/01_views/transaction-list.html) - States 3-6

---

## Story

**As a** user managing my transaction history,
**I want to** select multiple transactions and assign them to custom groups,
**So that** I can organize my expenses by projects, events, or personal categories.

---

## Context

The transaction-list.html mockup shows:
- Selection mode with checkboxes on transactions
- Selection bar with "Grupo" and "Eliminar" actions
- Group assignment modal with existing groups dropdown
- Create new group modal with name input
- Delete confirmation modal with transaction preview

**Key Constraint:** Each transaction can belong to only ONE group at a time.

---

## Acceptance Criteria

### AC #1: Selection Mode Entry
- [ ] Long-press (~500ms) on a transaction enters selection mode
- [ ] Selection bar appears below header
- [ ] Checkboxes appear on all visible transactions
- [ ] Long-pressed transaction is auto-selected

### AC #2: Transaction Selection
- [ ] Tap checkbox to toggle selection
- [ ] Selection count updates in bar ("X seleccionados")
- [ ] Selected transactions have visual highlight
- [ ] Can select across date groups

### AC #3: Selection Bar
- [ ] Close button (X) exits selection mode
- [ ] Shows count of selected transactions
- [ ] "Grupo" button opens group assignment modal
- [ ] "Eliminar" button opens delete confirmation

### AC #4: Group Assignment
- [ ] Modal shows dropdown of existing groups
- [ ] Can select an existing group
- [ ] "+" button opens create new group modal
- [ ] "Asignar" assigns group to all selected transactions
- [ ] Exits selection mode after assignment

### AC #5: Create New Group
- [ ] Input field for group name
- [ ] Emoji tip shown ("Usa emoji al inicio...")
- [ ] "Crear" creates group and assigns to transactions
- [ ] "Volver" returns to group selection modal

### AC #6: Batch Delete
- [ ] Confirmation modal shows warning icon
- [ ] Shows list of transactions to be deleted with total
- [ ] "Eliminar" (red) confirms deletion
- [ ] "Cancelar" closes modal
- [ ] Exits selection mode after delete

### AC #7: Group Filter
- [ ] Layers icon in header opens group filter
- [ ] Dropdown shows all user groups
- [ ] Selecting a group filters transaction list
- [ ] Filter chip appears when group filter active

---

## Tasks

### Phase 1: Data Model & Services
- [x] Task 1.1: Add groupId/groupName fields to Transaction type
- [x] Task 1.2: Create TransactionGroup type
- [x] Task 1.3: Create groupService for Firestore operations
- [x] Task 1.4: Add batch update/delete functions to firestore.ts

### Phase 2: Selection Mode UI
- [x] Task 2.1: Create useSelectionMode hook
- [x] Task 2.2: Update TransactionCard with checkbox
- [x] Task 2.3: Create SelectionBar component
- [x] Task 2.4: Integrate selection mode into HistoryView (long-press + SelectionBar)

### Phase 3: Group Assignment Modal
- [x] Task 3.1: Create AssignGroupModal component
- [x] Task 3.2: Create CreateGroupModal component
- [x] Task 3.3: Create useGroups hook

### Phase 4: Delete Confirmation Modal
- [x] Task 4.1: Create DeleteTransactionsModal component
- [x] Task 4.2: Implement batch delete logic (integrated into HistoryView)

### Phase 5: Group Filter
- [x] Task 5.1: Add group filter to IconFilterBar
- [x] Task 5.2: Add groupId to HistoryFiltersContext
- [x] Task 5.3: Filter transactions by group

### Phase 6: Tests
- [x] Task 6.1: Unit tests for transactionGroup type utilities
- [x] Task 6.2: Unit tests for useSelectionMode hook
- [x] Task 6.3: Unit tests for historyFilterUtils group filter
- [ ] Task 6.4: Unit tests for SelectionBar component (deferred)
- [ ] Task 6.5: Unit tests for AssignGroupModal (deferred)
- [ ] Task 6.6: Integration tests for selection flow (deferred)

### Phase 7: UI Enhancements (Story 14.15b)
- [x] Task 7.1: Center checkbox on TransactionCard
- [x] Task 7.2: CreateGroupModal positioning (respects header/nav)
- [x] Task 7.3: Add icon selector to CreateGroupModal
- [x] Task 7.4: Add color selector to CreateGroupModal

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Selection mode entry | Long-press transaction | Mobile-first, gesture-based (no extra UI clutter) |
| Group deletion behavior | Clear groupId from transactions | Transactions remain, just become ungrouped |
| Group constraint | One group per transaction | Simplifies UI and data model |

---

## File List

### New Files
- `src/types/transactionGroup.ts` - TransactionGroup interface
- `src/services/groupService.ts` - Firestore CRUD for groups
- `src/hooks/useSelectionMode.ts` - Selection state management
- `src/hooks/useGroups.ts` - Groups subscription hook
- `src/components/history/SelectionBar.tsx` - Floating action bar
- `src/components/history/AssignGroupModal.tsx` - Group assignment modal
- `src/components/history/CreateGroupModal.tsx` - New group creation modal
- `src/components/history/DeleteTransactionsModal.tsx` - Delete confirmation

### Modified Files
- `src/types/transaction.ts` - Add groupId, groupName fields
- `src/services/firestore.ts` - Add batch update/delete functions
- `src/components/history/TransactionCard.tsx` - Add checkbox for selection
- `src/components/history/IconFilterBar.tsx` - Add group filter button
- `src/contexts/HistoryFiltersContext.tsx` - Add groupId filter
- `src/views/HistoryView.tsx` - Integrate selection mode
- `src/utils/translations.ts` - Add translation keys

---

## Progress Log

| Date | Update |
|------|--------|
| 2026-01-04 | Story created. Exploration complete. Plan approved. |
| 2026-01-04 | Phase 1 complete: Transaction type updated with groupId/groupName, TransactionGroup type created, groupService created, batch functions added to firestore.ts |
| 2026-01-04 | Phase 2 complete: useSelectionMode hook created, TransactionCard updated with checkbox, SelectionBar component created, HistoryView integrated with long-press and selection bar |
| 2026-01-04 | Phase 3 complete: AssignGroupModal, CreateGroupModal, useGroups hook created and integrated into HistoryView |
| 2026-01-04 | Phase 4 complete: DeleteTransactionsModal created, batch delete integrated into HistoryView with handlers |
| 2026-01-04 | Phase 5 complete: Group filter added to IconFilterBar, groupId filter added to HistoryFiltersContext, transactions filtered by group |
| 2026-01-04 | Phase 6 partial: Unit tests for useSelectionMode (22 tests), transactionGroup types (16 tests), historyFilterUtils group filter (12 tests including multi-select) |
| 2026-01-04 | Phase 7 complete: UI enhancements - checkbox centered on cards, CreateGroupModal respects header/nav, icon/color selectors added |
| 2026-01-04 | Phase 8: UI refinements per mockup - SelectionBar layout (icons on top, labels below, green background, Layers icon), group filter multi-select support (groupIds instead of groupId), "My Groups" title in dropdown |
| 2026-01-05 | Phase 8 continued: CreateGroupModal positioning fixed (upper portion of screen with items-start), icon/color pickers redesigned with inline quick-pick row (5 options) + expandable grid below |
| 2026-01-05 | Phase 8 continued: AssignGroupModal positioning fixed to match CreateGroupModal (upper portion), CreateGroupModal header icon now shows live preview of selected icon/color |

---

## Test Plan

1. [ ] Long-press transaction to enter selection mode
2. [ ] Verify checkboxes appear on all transactions
3. [ ] Select multiple transactions
4. [ ] Tap "Grupo" and assign to existing group
5. [ ] Create a new group and assign
6. [ ] Verify transactions show group indicator
7. [ ] Tap "Eliminar" and confirm deletion
8. [ ] Filter by group using layers icon
9. [ ] Test on both light and dark themes
10. [ ] Test accessibility (keyboard navigation, screen reader)

---

## Session Notes (for continuing work)

### Last Session Summary (2026-01-04)

**Completed:**
- Phase 5: Group filter fully implemented with multi-select support
- Phase 6: 50+ unit tests passing (useSelectionMode, transactionGroup types, historyFilterUtils)
- Phase 7: CreateGroupModal with icon/color selectors, proper positioning
- Phase 8: SelectionBar UI matches mockup (icons on top, labels below, green bg)

**Key Changes Made:**
1. `GroupFilterState.groupId` → `GroupFilterState.groupIds` (comma-separated for multi-select)
2. `SelectionBar` - new layout with vertical icon+label buttons, uses Layers icon
3. `GroupFilterDropdown` - multi-select checkboxes, "My Groups" title
4. `CreateGroupModal` - icon picker (60 emojis), color picker (24 colors), respects header/nav padding

**Files Modified in Last Session:**
- `src/components/history/SelectionBar.tsx` - New layout
- `src/components/history/IconFilterBar.tsx` - Multi-select group dropdown
- `src/components/history/CreateGroupModal.tsx` - Icon/color selectors
- `src/components/history/TransactionCard.tsx` - Centered checkbox
- `src/contexts/HistoryFiltersContext.tsx` - groupIds instead of groupId
- `src/hooks/useHistoryFilters.ts` - Updated for groupIds
- `src/utils/historyFilterUtils.ts` - Multi-select filter logic
- `tests/unit/utils/historyFilterUtils.group.test.ts` - Added multi-select test

**Tests Status:**
- All 12 group filter tests passing
- All 22 useSelectionMode tests passing
- All 16 transactionGroup type tests passing

**Next Steps:**
1. Visual QA of all modals and selection UI
2. Test complete flow: select → assign group → filter by group
3. Verify dark mode styling
4. Consider remaining deferred tests (SelectionBar, AssignGroupModal components)

---

### Last Session Summary (2026-01-05)

**Completed:**
- Group color integration: color field added to TransactionGroup, saved to Firestore
- Transaction cards show group-colored border when assigned to a group (2px thick)
- Group badge on thumbnail REMOVED - using border color only as visual indicator
- AssignGroupModal redesigned: dropdown replaced with scrollable list view showing:
  - Group icon badge with color
  - Group name and transaction count
  - Edit (pencil) and Delete (trash) icon buttons per group
- EditGroupModal created: edit name, icon, and color of existing groups
- DeleteGroupModal created: in-app confirmation (replaces window.confirm)
- Transaction count fix: when moving transactions between groups, old group count now decrements

**New Files Created:**
- `src/components/history/EditGroupModal.tsx` - Edit group modal
- `src/components/history/DeleteGroupModal.tsx` - Delete confirmation modal

**Key Changes Made:**
1. `TransactionGroup.color` - new optional field for group color
2. `CreateTransactionGroupInput.color` - passes color when creating groups
3. `UpdateTransactionGroupInput.color` - allows updating color
4. `groupService.ts`:
   - `createGroup` saves color
   - `updateGroup` handles color updates
   - `assignTransactionsToGroup` now includes groupColor parameter
   - `updateGroupOnTransactions()` - new function to sync name/color to transactions
5. `Transaction` type: added `groupColor` field
6. `TransactionCard`: border color shows group color, group badge removed from thumbnail
7. `AssignGroupModal`: list view with edit/delete icons per group
8. `HistoryView`:
   - `handleAssignGroup` and `handleCreateGroup` now decrement old group counts when moving transactions
   - `handleEditGroup` opens edit modal
   - `handleConfirmDeleteGroup` deletes group with in-app modal confirmation

**Files Modified:**
- `src/types/transactionGroup.ts` - Added color field
- `src/types/transaction.ts` - Added groupColor field
- `src/services/groupService.ts` - Color handling, updateGroupOnTransactions()
- `src/components/history/TransactionCard.tsx` - Border color, removed group badge
- `src/components/history/AssignGroupModal.tsx` - List view with edit/delete icons
- `src/components/history/CreateGroupModal.tsx` - Passes color to onCreate
- `src/components/history/index.ts` - Export new modals
- `src/views/HistoryView.tsx` - Edit/delete group handlers, count decrement fix

**Known Issues:**
- AssignGroupModal backdrop may not extend fully to screen edges (w-screen h-screen fix applied)

**Next Steps:**
1. Test backdrop fix visually
2. Test edit/delete group flow end-to-end
3. Verify transaction count accuracy when moving between groups
4. Dark mode testing
5. Consider adding "unassign from group" option

---

### Current Session Summary (2026-01-05 continued)

**Bugs Fixed:**

1. **Home screen treemap "Otro" category duplication** (`DashboardView.tsx`)
   - Issue: If transactions had category `'Otro'` or `'Other'`, it appeared twice in treemap
   - Fix: Filter out existing Otro/Other categories from above/below threshold lists, merge them into aggregated "Otro" at end

2. **Incorrect transaction count when assigning to groups** (`HistoryView.tsx`)
   - Issue: When assigning a transaction already in the target group, count was double-incremented
   - Fix: Filter out transactions already in target group before calling `assignTransactionsToGroup()`

3. **Group count not recalculating after corrupted data** (`groupService.ts`, `useGroups.ts`, `HistoryView.tsx`)
   - Issue: Groups showed incorrect transaction counts from previous bugs
   - Fix: Added `recalculateGroupCounts()` and `recalculateAllGroupCounts()` functions
   - Auto-recalculates all group counts on HistoryView load

4. **View not resetting when deleting filtered group** (`HistoryView.tsx`)
   - Issue: When deleting a group while filtering by it, view showed no transactions
   - Fix: Clear group filter (`CLEAR_GROUP` action) if the deleted group was being filtered

5. **Delete group modal not appearing / potential confusion with delete transactions** (`HistoryView.tsx`)
   - Issue: When clicking delete group from AssignGroupModal, the confirmation modal might not appear or wrong modal shown
   - Fix: `handleDeleteGroup` now closes ALL other modals before showing DeleteGroupModal
   - Also exits selection mode after successfully deleting a group

6. **Modal backdrop not covering full screen** (All modals)
   - Issue: Gray backdrop had gaps at edges (left, right, bottom) because modals were rendered inside PageTransition which has `overflow: hidden`
   - Fix: Added React Portal (`createPortal`) to render all modals at `document.body` level

7. **Modal positioning inconsistent** (Group modals vs Delete modal)
   - Issue: AssignGroupModal, CreateGroupModal appeared at different positions than DeleteTransactionsModal
   - Fix: All modals now use same structure:
     - Outer container: `fixed inset-0 z-[200]`
     - Backdrop: `fixed inset-0 bg-black/40`
     - Centering container: `fixed inset-0 flex items-center justify-center p-4 pointer-events-none`
     - Modal card: `pointer-events-auto` for click handling

**New Functions Added:**

1. `recalculateGroupCounts()` in `groupService.ts` - Recalculate single group's count from transactions
2. `recalculateAllGroupCounts()` in `groupService.ts` - Recalculate all groups' counts in batch
3. `recalculateCounts()` in `useGroups.ts` hook - Exposed for components to call

**Key Code Changes:**

1. **All 5 modals now use React Portal:**
   - `AssignGroupModal.tsx` - `createPortal(..., document.body)`
   - `CreateGroupModal.tsx` - `createPortal(..., document.body)`
   - `EditGroupModal.tsx` - `createPortal(..., document.body)`
   - `DeleteGroupModal.tsx` - `createPortal(..., document.body)`
   - `DeleteTransactionsModal.tsx` - `createPortal(..., document.body)`

2. **Modal structure standardized:**
   ```tsx
   return createPortal(
       <div className="fixed inset-0 z-[200]">
           <div className="fixed inset-0 bg-black/40" />
           <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
               <div className="modal-card pointer-events-auto">...</div>
           </div>
       </div>,
       document.body
   );
   ```

3. **HistoryView.tsx changes:**
   - Added `filterDispatch` from `useHistoryFilters()`
   - Added `recalculateCounts` from `useGroups()`
   - Added `useEffect` for auto-recalculating group counts on load
   - `handleDeleteGroup` closes all modals before showing DeleteGroupModal
   - `handleConfirmDeleteGroup` clears group filter if needed, exits selection mode

**Files Modified This Session:**
- `src/views/DashboardView.tsx` - Fix Otro duplication
- `src/views/HistoryView.tsx` - Multiple fixes (count, filter, modal handling)
- `src/services/groupService.ts` - Added recalculate functions
- `src/hooks/useGroups.ts` - Added recalculateCounts
- `src/components/history/AssignGroupModal.tsx` - Portal + positioning
- `src/components/history/CreateGroupModal.tsx` - Portal + positioning
- `src/components/history/EditGroupModal.tsx` - Portal + positioning
- `src/components/history/DeleteGroupModal.tsx` - Portal + positioning
- `src/components/history/DeleteTransactionsModal.tsx` - Portal + positioning

**Tests Status:**
- All TypeScript compiles without errors
- Core functionality tested manually

**Remaining Known Issues:**
- None critical - all reported bugs have been addressed

**Next Steps for Future Session:**
1. Final visual QA of modal backdrops (should now cover full screen including bottom nav)
2. Test complete flow: create group → assign → filter → delete group
3. Verify dark mode styling of all modals
4. Run full test suite to ensure no regressions
5. Consider component tests for modals (deferred)
6. Update sprint-status.yaml when ready to deploy

---

### Session Summary (2026-01-05 evening)

**UI Improvements Completed:**

1. **CreateGroupModal icon grid improvements:**
   - Changed icon grid from 6 columns to 7 columns (`grid-cols-7`)
   - Reduced icons from 60 to exactly 49 (7x7 grid)
   - Reduced gap between icons (`gap-1` → `gap-0.5`)
   - Icons reorganized into logical categories across 7 rows

2. **Icon/Color expand button toggle state:**
   - "+" button now shows highlighted state when picker is open
   - Open state: Primary color background with white icon
   - Closed state: Tertiary background with dashed border
   - Added `aria-expanded` attribute for accessibility

3. **GroupFilterDropdown (MIS GRUPOS) improvements:**
   - Groups with transactions: Show pill with Package icon + count (e.g., `📦 1`)
   - Groups without transactions: Show red trash icon for direct deletion
   - Changed outer element from `<button>` to `<div role="button">` to fix DOM nesting error (button inside button)
   - Added keyboard navigation support (Enter/Space)

4. **HistoryView header redesign:**
   - Changed title from "Transacciones" to "Compras" / "Purchases"
   - Added back button (ChevronLeft) on the left side
   - Added ProfileDropdown on the right side (same as ReportsView)
   - Header now matches ReportsView layout exactly (72px height, same padding)

5. **HistoryView layout alignment with ReportsView:**
   - Removed `p-3` padding from main container for history view
   - Header uses fixed 72px height with `paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)'`
   - Content area wrapped in `px-3` container for horizontal margins
   - Transaction cards no longer touch screen edges

**New Translation Keys:**
- `purchases: "Purchases"` (en)
- `purchases: "Compras"` (es)

**Files Modified:**
- `src/components/history/CreateGroupModal.tsx` - 7x7 icon grid, toggle button styling
- `src/components/history/AssignGroupModal.tsx` - Transaction count pill, trash icon for empty groups
- `src/components/history/IconFilterBar.tsx` - GroupFilterDropdown pill/trash UI, DOM fix
- `src/views/HistoryView.tsx` - Header redesign (back button, title, profile dropdown), layout alignment
- `src/App.tsx` - Added userName, userEmail, onNavigateToView props to HistoryView; removed p-3 padding for history view
- `src/utils/translations.ts` - Added "purchases" translation key

**Props Added to HistoryView:**
- `userName?: string` - For profile avatar initials
- `userEmail?: string` - For profile dropdown display
- `onNavigateToView?: (view: string) => void` - For profile menu navigation

**Pending Work for Next Session:**
1. Ensure DashboardView transaction cards use same layout as HistoryView
2. Visual QA on both light and dark themes
3. Test profile dropdown navigation from HistoryView
4. Run full test suite
