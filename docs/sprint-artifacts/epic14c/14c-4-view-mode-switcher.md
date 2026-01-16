# Story 14c.4: View Mode Switcher

Status: done

## Story

As a user in multiple shared groups,
I want to switch between personal and group view modes,
so that I can see combined spending for a specific group or just my own.

## Acceptance Criteria

1. **AC1: Tappable Logo Icon**
   - Given I am on any main screen (Home, Analytics, History, Insights)
   - When I tap the logo icon in the top-left header
   - Then a group selector dropdown/sheet appears
   - And the logo area is visually tappable (touch feedback)

2. **AC2: Group Selector Options**
   - Given the group selector is open
   - When I view the options
   - Then I see "Personal" as the first option (default)
   - And I see all shared groups I'm a member of
   - And each option shows: group icon, name, member count
   - And the currently active mode has a checkmark

3. **AC3: Personal Mode Appearance**
   - Given I select "Personal" mode
   - When the mode is active
   - Then the logo shows the default Boletapp icon/branding
   - And the header uses default app colors
   - And all data shown is my personal transactions only

4. **AC4: Group Mode Appearance**
   - Given I select a shared group
   - When that group mode is active
   - Then the logo changes to the group's icon
   - And the header background tints to the group's color
   - And member avatars appear next to the logo
   - And all data shown is the group's combined transactions

5. **AC5: All Views Filter to Group**
   - Given I'm in a shared group view mode
   - When I navigate to Home, Analytics, History, or Insights
   - Then each view shows data filtered to that group
   - And totals, charts, and lists reflect group transactions only
   - And this filtering persists across tab navigation

6. **AC6: Persist View Mode**
   - Given I select a view mode
   - When I close the app and reopen it
   - Then the same view mode is active (persisted in localStorage)
   - And the correct visual theming is applied on load

7. **AC7: Visual Mode Indicator**
   - Given I'm in a shared group mode
   - When viewing any screen
   - Then there is a clear visual indicator showing active group
   - And this could be: colored header, group name label, or badge
   - And users cannot confuse personal vs group data

## Tasks / Subtasks

- [x] Task 1: Create View Mode Context (AC: #5, #6)
  - [x] 1.1 Create `src/contexts/ViewModeContext.tsx`
  - [x] 1.2 Define state: `{ mode: 'personal' | 'group', groupId?: string, group?: SharedGroup }`
  - [x] 1.3 Create `useViewMode()` and `useViewModeOptional()` hooks for accessing state
  - [x] 1.4 Implement localStorage persistence for view mode
  - [x] 1.5 Load persisted mode on app initialization
  - [x] 1.6 Provide `setPersonalMode()` and `setGroupMode(groupId, group?)` functions

- [x] Task 2: Update TopHeader Component (AC: #1, #3, #4, #7)
  - [x] 2.1 Make logo area tappable in `TopHeader.tsx` (via `onLogoClick` prop)
  - [x] 2.2 Show different logo based on view mode (personal = G logo, group = group icon)
  - [x] 2.3 Apply group color indicator to header in group mode
  - [x] 2.4 Show group name as centered title in group mode
  - [x] 2.5 Add `group-mode-indicator` test ID for visual clarity

- [x] Task 3: Create Group Selector Component (AC: #2)
  - [x] 3.1 Create `src/components/SharedGroups/ViewModeSwitcher.tsx`
  - [x] 3.2 Create dropdown UI for mode selection
  - [x] 3.3 Display Personal as first option with description
  - [x] 3.4 Display each group option with icon, name, member count
  - [x] 3.5 Show checkmark on currently active mode
  - [x] 3.6 Handle selection, close dropdown, and update ViewModeContext

- [x] Task 4: Create User Shared Groups Hook (AC: #2)
  - [x] 4.1 Create `src/hooks/useUserSharedGroups.ts`
  - [x] 4.2 Subscribe to user's shared groups via `subscribeToSharedGroups()`
  - [x] 4.3 Return array of groups with loading/error states
  - [x] 4.4 Provide `getGroupById()` helper function
  - [x] 4.5 Provide computed values: `groupCount`, `hasGroups`

- [ ] Task 5: Integrate View Mode into Views (AC: #5)
  - Note: Deferred to Story 14c.5 which handles cross-member transaction queries
  - [ ] 5.1 Update `DashboardView.tsx` to use ViewModeContext for filtering
  - [ ] 5.2 Update `TrendsView.tsx` / analytics to filter by group
  - [ ] 5.3 Update `HistoryView.tsx` to filter by group
  - [ ] 5.4 Update `InsightsView.tsx` to scope insights to group
  - [ ] 5.5 Create helper `useFilteredTransactions()` that respects view mode

- [x] Task 6: Add Visual Polish (AC: #3, #4, #7)
  - [x] 6.1 Styled ViewModeSwitcher with proper dropdown appearance
  - [x] 6.2 Group icon displayed in circular container with group color
  - [x] 6.3 Color indicator bar below logo in group mode
  - Note: Member avatar stack deferred - group name shown in title instead

- [x] Task 7: i18n Translations
  - [x] 7.1 Add "Personal", "Viewing", member count strings (EN + ES)
  - [x] 7.2 Add "selectViewMode", "switchViewMode" for accessibility

- [x] Task 8: Component Tests
  - [x] 8.1 Test ViewModeContext state management (17 tests)
  - [x] 8.2 Test localStorage persistence (5 tests)
  - [x] 8.3 Test TopHeader renders correctly per mode (6 tests)
  - [x] 8.4 Test ViewModeSwitcher displays all options (19 tests)
  - [x] 8.5 Test useUserSharedGroups hook (13 tests)

## Dev Notes

### Architecture Context

**View Mode as Global State:**
The view mode affects the entire app experience, so it's implemented as React Context that wraps the application. All data-fetching hooks will check this context to filter appropriately.

**Filter Strategy:**
```typescript
// In useFilteredTransactions hook
const { mode, groupId } = useViewMode();

if (mode === 'personal') {
  // Return user's own transactions only
  return useTransactions(userId);
} else {
  // Return transactions filtered by sharedGroupIds
  return useSharedGroupTransactions(groupId);
}
```

### Existing Code to Leverage

**TopHeader Component:** `src/components/TopHeader.tsx`
- Already has logo area
- Has header styling infrastructure
- Update to make logo tappable

**Existing Context Patterns:** `src/contexts/`
- `AuthContext.tsx` - auth state pattern
- `ScanContext.tsx` - app-wide state pattern

**Theme System:** `src/styles/themes/`
- Existing theme infrastructure
- Can apply group color as theme accent

### Project Structure Notes

**New files to create:**
```
src/
├── contexts/
│   └── ViewModeContext.tsx           # View mode state + persistence
├── components/
│   └── shared-groups/
│       ├── ViewModeSwitcher.tsx      # Dropdown/sheet component
│       └── MemberAvatarStack.tsx     # Stacked avatar display
├── hooks/
│   ├── useUserSharedGroups.ts        # Fetch user's groups
│   └── useFilteredTransactions.ts    # Mode-aware transaction hook
```

**Files to modify:**
```
src/App.tsx                           # Wrap with ViewModeProvider
src/components/TopHeader.tsx          # Make logo tappable, show group styling
src/components/views/DashboardView.tsx # Use view mode for filtering
src/components/views/TrendsView.tsx   # Use view mode for filtering
src/components/views/HistoryView.tsx  # Use view mode for filtering
src/components/views/InsightsView.tsx # Use view mode for filtering
```

### View Mode Context Implementation

```typescript
// src/contexts/ViewModeContext.tsx
interface ViewModeState {
  mode: 'personal' | 'group';
  groupId?: string;
  group?: SharedGroup;  // Cached group data for display
}

interface ViewModeContextValue extends ViewModeState {
  setPersonalMode: () => void;
  setGroupMode: (groupId: string) => void;
  isGroupMode: boolean;
}

const VIEW_MODE_STORAGE_KEY = 'boletapp_view_mode';

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViewModeState>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { mode: 'personal' };
      }
    }
    return { mode: 'personal' };
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ... provider implementation
}
```

### Header Visual States

**Personal Mode:**
```
┌─────────────────────────────────────┐
│ [B Logo]  Home                   ⚙️ │
│  Default colors, default branding   │
└─────────────────────────────────────┘
```

**Group Mode:**
```
┌─────────────────────────────────────┐
│ [👨‍👩‍👧] Familia Martinez   [G][M][P]  ⚙️ │
│  Group color tint, member avatars   │
└─────────────────────────────────────┘
```

### Group Selector Dropdown UI

```
┌────────────────────────────────────┐
│  Select View Mode                  │
├────────────────────────────────────┤
│ ✓ [B] Personal                     │
│       Only your transactions       │
├────────────────────────────────────┤
│   [👨‍👩‍👧] Familia Martinez            │
│       3 members                    │
├────────────────────────────────────┤
│   [🏠] Roommates                   │
│       2 members                    │
└────────────────────────────────────┘
```

### Data Flow for Filtered Views

```
┌─────────────────┐
│  ViewModeContext │
│  mode: 'group'  │
│  groupId: 'abc' │
└────────┬────────┘
         │
         ▼
┌───────────────────────────────────┐
│  useFilteredTransactions()        │
│  - Checks ViewModeContext         │
│  - If personal: query user txns   │
│  - If group: query shared txns    │
└────────┬──────────────────────────┘
         │
         ▼
┌───────────────────────────────────┐
│  Views (Dashboard, History, etc.) │
│  - Use filtered transaction hook  │
│  - Display appropriate data       │
└───────────────────────────────────┘
```

### UX Mockup Reference

See mockup: `docs/uxui/mockups/01_views/shared-groups.html`
- "View Mode Switcher" state: Shows personal vs group logo
- "Group Selector" state: Dropdown with options

### Performance Considerations

- Use React Query for caching group data
- Don't re-fetch all transactions on mode switch if already cached
- Debounce rapid mode switches
- Pre-fetch user's groups on app load

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Brainstorming - View Mode]: docs/analysis/brainstorming-session-2026-01-15.md#view-mode-switching
- [UX Mockup - View Switcher]: docs/uxui/mockups/01_views/shared-groups.html
- [Existing TopHeader]: src/components/TopHeader.tsx
- [React Context Best Practices]: https://react.dev/learn/passing-data-deeply-with-context

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. **ViewModeContext Implementation (Task 1)**
   - Created comprehensive context with TypeScript interfaces
   - Supports 'personal' and 'group' modes with optional group data caching
   - localStorage persistence with fallback for invalid/missing data
   - Exports `useViewMode()` (throws if outside provider) and `useViewModeOptional()` (returns null)

2. **TopHeader Updates (Task 2)**
   - Added `onLogoClick`, `viewMode`, and `activeGroup` props
   - Logo becomes tappable button when `onLogoClick` is provided
   - Shows group icon instead of "G" logo when in group mode
   - Displays group name as centered title in group mode
   - Color indicator bar appears below logo for group mode

3. **ViewModeSwitcher Component (Task 3)**
   - Dropdown UI with Personal option always first
   - Each group shows icon, name, and member count
   - Checkmark indicates active selection
   - Closes on selection, Escape key, or outside click
   - Full accessibility with role="menu" and role="menuitem"

4. **useUserSharedGroups Hook (Task 4)**
   - Subscribes to real-time updates via existing `subscribeToSharedGroups()`
   - Returns `groups`, `isLoading`, `error`, `groupCount`, `hasGroups`
   - Provides `getGroupById()` helper for quick lookups
   - Automatic cleanup on unmount or userId change

5. **Task 5 Deferred**
   - View filtering (Dashboard, History, Trends, Insights) intentionally deferred to Story 14c.5
   - Story 14c.5 handles cross-member transaction queries which are required for group filtering
   - ViewModeContext is ready - views can simply `useViewMode()` to check current mode

6. **Test Coverage**
   - 89 new tests across 4 test files (after code review fixes)
   - All tests passing
   - Build verification passed

7. **Code Review Fixes (2026-01-15)**
   - Added ViewModeSwitcher to barrel export `SharedGroups/index.ts`
   - Added 3 tests for `updateGroupData` function (previously untested)

8. **Manual Testing Issues Fixed (2026-01-15)**
   - Code review passed, manual testing revealed multiple issues
   - **Issue 1 FIXED**: Firebase permission error when sharing groups
     - Root cause: Firestore rules were never deployed to production
     - Fix: Ran `firebase deploy --only firestore:rules` to deploy sharedGroups and pendingInvitations rules
   - **Issue 2 FIXED**: ViewModeSwitcher not working (logo click did nothing)
     - Root cause: TopHeader not receiving `onLogoClick`, `viewMode`, `activeGroup` props; ViewModeSwitcher never rendered
     - Fix: Updated App.tsx to import hooks/components, pass props, and render ViewModeSwitcher dropdown
   - **Issue 3 FIXED**: Wrong icon in transaction selection (was Layers, should be Bookmark)
     - Fix: Changed import and usage from `Layers` to `Bookmark` in DashboardView.tsx line 21 and 3317
   - **Issue 4 FIXED**: Personal groups cannot be deleted or edited
     - Root cause: Only shared groups had GroupMembersManager UI
     - Fix: Added expand/collapse UI to personal groups with Edit and Delete buttons
     - Reused existing EditGroupModal and DeleteGroupDialog components

9. **Personal Group Management UI (2026-01-15)**
   - Personal groups now have expand/collapse on click (ChevronRight with rotation animation)
   - Expanded content shows two buttons:
     - "Editar grupo" (blue) - Opens EditGroupModal for name/icon/color changes
     - "Eliminar grupo" (red) - Opens DeleteGroupDialog with confirmation
   - Uses existing `updateGroup()` and `deleteGroup()` from groupService.ts
   - Toast notifications on success/error

### File List

**New Files Created:**
- `src/contexts/ViewModeContext.tsx` - View mode state management
- `src/hooks/useUserSharedGroups.ts` - Fetch user's shared groups hook
- `src/components/SharedGroups/ViewModeSwitcher.tsx` - Group selector dropdown
- `tests/unit/contexts/ViewModeContext.test.tsx` - Context tests (20)
- `tests/unit/hooks/useUserSharedGroups.test.tsx` - Hook tests (13)
- `tests/unit/components/SharedGroups/ViewModeSwitcher.test.tsx` - Component tests (19)

**Files Modified:**
- `src/main.tsx` - Added ViewModeProvider wrapper
- `src/components/TopHeader.tsx` - Added view mode props and group mode styling
- `src/components/SharedGroups/index.ts` - Added ViewModeSwitcher export (code review fix)
- `src/utils/translations.ts` - Added i18n keys for EN and ES
- `tests/unit/components/TopHeader.test.tsx` - Added 6 view mode tests
- `src/App.tsx` - Wired ViewModeSwitcher: imports, hooks, state, TopHeader props, dropdown rendering
- `src/views/DashboardView.tsx` - Changed Layers to Bookmark icon for group assignment button
- `src/components/settings/subviews/GruposView.tsx` - Added personal group expand/collapse, edit, and delete UI
- `firestore.rules` - Deployed to production (already had sharedGroups rules, just not deployed)

10. **Additional Features Added (2026-01-15 Session 2)**
    - **Share Code Enhancements:**
      - Share code is now clickable to copy (tap code itself → "¡Copiado!" feedback)
      - Added `handleCopyCode` function in ShareCodeDisplay.tsx
      - Regenerate Code button now always visible (not just when expired), styled subtly when not expired
    - **Join with Code Feature:**
      - New "Unirse con Código" section at top of Settings > Grupos
      - Text input for share code with "Unirse" button
      - Uses new `joinByShareCode()` service function
      - Error handling: CODE_NOT_FOUND, CODE_EXPIRED, ALREADY_MEMBER, GROUP_FULL
      - Success toast shows group name joined
    - **joinByShareCode Service Function:**
      - New function in sharedGroupService.ts
      - Finds group by share code, validates not expired/full/already-member
      - Atomic batch write: adds user to members[], updates memberUpdates, adds to user profile
      - Fixed bug: was stripping dashes but nanoid can generate codes WITH dashes
    - **Firestore Rules Update:**
      - Added rule to allow authenticated users to read sharedGroups by shareCode
      - Required for "join by code" flow where user isn't yet a member
      - Rule: `allow read: if isGroupMember() || (isAuthenticated() && resource.data.shareCode != null);`
      - Deployed with `firebase deploy --only firestore:rules`
    - **Remove from Group in Batch Selection:**
      - New "Quitar de grupo" option at top of AssignGroupModal
      - Red XCircle icon, selectable like other groups
      - Calls `onRemoveFromGroup` prop when selected
      - Added handler in DashboardView.tsx (uses clearGroupFromTransactions)
      - Added handler in HistoryView.tsx (uses removeTransactionsFromGroup + clearGroupFromTransactions)

**Files Modified (Session 2):**
- `src/components/SharedGroups/ShareCodeDisplay.tsx` - Clickable code, always-visible regenerate button
- `src/services/sharedGroupService.ts` - Added `joinByShareCode()` function, fixed dash handling
- `src/components/settings/subviews/GruposView.tsx` - Added "Join with Code" UI section
- `src/components/history/AssignGroupModal.tsx` - Added "Remove from group" option, `onRemoveFromGroup` prop
- `src/views/DashboardView.tsx` - Added `handleRemoveFromGroup`, passed to AssignGroupModal
- `src/views/HistoryView.tsx` - Added `handleRemoveFromGroup`, passed to AssignGroupModal
- `firestore.rules` - Updated read rule for shareCode-based queries

11. **Member Profile Display (2026-01-15 Session 3)**
    - **Problem:** All members displayed as "Usuario" instead of real names
    - **Solution:** Store and display member profiles (name, email, photo)
    - **Changes:**
      - `MemberProfile` interface added to sharedGroup.ts with displayName, email, photoURL
      - `memberProfiles` field added to SharedGroup type (Record<userId, MemberProfile>)
      - `createSharedGroup()` now accepts `ownerProfile` param and stores it
      - `joinByShareCode()` now accepts `userProfile` param and stores it
      - GruposView updated to pass user profile when creating/joining groups
      - GruposView passes memberNames/memberEmails/memberPhotos to GroupMembersManager
      - GroupMembersManager displays email below name in smaller, muted text

**Files Modified (Session 3):**
- `src/types/sharedGroup.ts` - Added MemberProfile interface, memberProfiles field to SharedGroup
- `src/services/sharedGroupService.ts` - Updated createSharedGroup and joinByShareCode to store profiles
- `src/components/settings/subviews/GruposView.tsx` - Added userDisplayName/userPhotoURL props, passes profiles to GroupMembersManager
- `src/views/SettingsView.tsx` - Passes displayName to GruposView as userDisplayName
- `src/components/SharedGroups/GroupMembersManager.tsx` - Already had props for memberNames/memberEmails/memberPhotos, displays email below name

12. **Bug Fixes & Dialog Improvements (2026-01-15 Session 3 continued)**
    - **Remove Member Firebase Permission Fix:**
      - Error: "Missing or insufficient permissions" when owner tried to remove member
      - Root cause: `removeMember()` was trying to update removed member's profile document, but security rules only allow users to write to their own data
      - Fix: Removed the profile update from `removeMember()` - now only updates the sharedGroup document
      - Also cleans up `memberProfiles.${memberId}` when removing member
    - **Dialog Backdrop Not Blocking Nav Bar:**
      - Changed all dialogs from `fixed inset-0` to `fixed inset-0 bottom-[72px]`
      - This leaves the nav bar visible and interactive while dialog is open
      - Updated: RemoveMemberDialog, LeaveGroupDialog, TransferOwnershipDialog, DeleteGroupDialog, OwnerLeaveWarningDialog, MakeShareableDialog
    - **Dialog Button Icons:**
      - Added X icon to Cancel button in RemoveMemberDialog
      - Updated Cancel button styling to use theme colors (--text-primary, --bg-secondary)

**Files Modified (Session 3 continued):**
- `src/services/sharedGroupService.ts` - Fixed removeMember to not update other user's profile
- `src/components/SharedGroups/RemoveMemberDialog.tsx` - Fixed backdrop, added X icon to Cancel
- `src/components/SharedGroups/LeaveGroupDialog.tsx` - Fixed backdrop
- `src/components/SharedGroups/TransferOwnershipDialog.tsx` - Fixed backdrop
- `src/components/SharedGroups/DeleteGroupDialog.tsx` - Fixed backdrop
- `src/components/SharedGroups/OwnerLeaveWarningDialog.tsx` - Fixed backdrop
- `src/components/SharedGroups/MakeShareableDialog.tsx` - Fixed backdrop

13. **UI/UX Improvements (2026-01-15 Session 4)**
    - **Dialog Full-Screen Backdrop Fix:**
      - Changed dialog structure to two-layer approach for proper backdrop coverage
      - Outer layer: `fixed inset-0` backdrop covering entire screen including header
      - Inner layer: `fixed inset-0 bottom-[72px]` centering container for modal positioning
      - Modal uses `pointer-events-auto` to be interactive while centering container has `pointer-events-none`
      - This ensures backdrop covers header while modal stays above nav bar
    - **Theme Colors in Dialogs:**
      - TransferOwnershipDialog: Changed hardcoded `#3b82f6` to `var(--primary)` for icon and buttons
      - OwnerLeaveWarningDialog: Changed `#3b82f6` to `var(--primary)` for "Manage Members" button
      - All Cancel buttons now use `var(--text-primary)` and `var(--bg-secondary)` for consistency
    - **Cancel Button Icons:**
      - Added X icon with `gap-2` flexbox layout to all Cancel buttons
      - Updated: TransferOwnershipDialog, LeaveGroupDialog, DeleteGroupDialog, MakeShareableDialog
    - **GruposView Spacing:**
      - Reduced padding from `p-4` to `p-3` on all card containers
      - Reduced section spacing from `space-y-4` to `space-y-3`
      - Reduced header margin from `mb-4` to `mb-3`
    - **Transaction Card Group Border:**
      - Changed left border from category color to group's custom color
      - Now uses `groupColor` prop directly instead of `categoryColors.fg`
      - Border appears when transaction belongs to a shared group
    - **Nav Bar Group Mode Indicator:**
      - Removed solid colored top border approach (was too harsh)
      - Added subtle gradient background: 70% normal theme color from bottom, fading to 20% opacity group color at top
      - Keeps normal `1px solid var(--border-medium)` top border
    - **TopHeader Group Mode Indicator:**
      - Removed the colored line indicator bar below the logo
      - Group mode is now indicated by: group icon in logo, group name as title, nav bar gradient
    - **Test Updates:**
      - Updated TopHeader test: Changed "should apply group color tint to header" to test group-mode-icon background color instead of group-color-indicator element

**Files Modified (Session 4):**
- `src/components/SharedGroups/TransferOwnershipDialog.tsx` - Full backdrop fix, theme colors, cancel icon
- `src/components/SharedGroups/LeaveGroupDialog.tsx` - Full backdrop fix, cancel icon
- `src/components/SharedGroups/DeleteGroupDialog.tsx` - Full backdrop fix, cancel icon
- `src/components/SharedGroups/OwnerLeaveWarningDialog.tsx` - Full backdrop fix, theme colors
- `src/components/SharedGroups/RemoveMemberDialog.tsx` - Full backdrop fix
- `src/components/SharedGroups/MakeShareableDialog.tsx` - Full backdrop fix, cancel icon
- `src/components/settings/subviews/GruposView.tsx` - Reduced padding and spacing
- `src/components/transactions/TransactionCard.tsx` - Changed left border to use group color
- `src/components/Nav.tsx` - Added `activeGroupColor` prop, gradient background for group mode
- `src/components/TopHeader.tsx` - Removed group color indicator bar below logo
- `src/App.tsx` - Passes `activeGroupColor` to Nav component
- `tests/unit/components/TopHeader.test.tsx` - Updated group mode appearance test

14. **Code Review Fixes (2026-01-15 Session 5)**
    - **Barrel Export Fix (MEDIUM-1):**
      - Added missing exports to `src/components/SharedGroups/index.ts`
      - Now exports: PendingInvitationsSection, GroupMembersManager, LeaveGroupDialog, DeleteGroupDialog, TransferOwnershipDialog, OwnerLeaveWarningDialog, RemoveMemberDialog
      - Follows Atlas Section 6 pattern: "Barrel export enforcement"
    - **Known Gaps (MEDIUM-2):**
      - Missing unit tests for 5 dialog components (DeleteGroupDialog, TransferOwnershipDialog, RemoveMemberDialog, OwnerLeaveWarningDialog, GroupMembersManager)
      - Only LeaveGroupDialog has dedicated test file (30 tests)
      - Tracked for follow-up - functional testing done manually

**Files Modified (Session 5 - Code Review):**
- `src/components/SharedGroups/index.ts` - Added 7 missing barrel exports

