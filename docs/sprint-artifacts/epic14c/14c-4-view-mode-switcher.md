# Story 14c.4: View Mode Switcher

Status: ready-for-dev

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

- [ ] Task 1: Create View Mode Context (AC: #5, #6)
  - [ ] 1.1 Create `src/contexts/ViewModeContext.tsx`
  - [ ] 1.2 Define state: `{ mode: 'personal' | 'group', groupId?: string }`
  - [ ] 1.3 Create `useViewMode()` hook for accessing state
  - [ ] 1.4 Implement localStorage persistence for view mode
  - [ ] 1.5 Load persisted mode on app initialization
  - [ ] 1.6 Provide `setViewMode(mode, groupId?)` function

- [ ] Task 2: Update TopHeader Component (AC: #1, #3, #4, #7)
  - [ ] 2.1 Make logo area tappable in `TopHeader.tsx`
  - [ ] 2.2 Show different logo based on view mode (personal vs group icon)
  - [ ] 2.3 Apply group color tint to header in group mode
  - [ ] 2.4 Show member avatars next to logo in group mode
  - [ ] 2.5 Add "Viewing: [Group Name]" label for clarity

- [ ] Task 3: Create Group Selector Component (AC: #2)
  - [ ] 3.1 Create `src/components/shared-groups/ViewModeSwitcher.tsx`
  - [ ] 3.2 Create dropdown/bottom sheet UI for mode selection
  - [ ] 3.3 Fetch user's shared groups via `useUserSharedGroups()` hook
  - [ ] 3.4 Display each option with icon, name, member count
  - [ ] 3.5 Show checkmark on currently active mode
  - [ ] 3.6 Handle selection and close dropdown

- [ ] Task 4: Create User Shared Groups Hook (AC: #2)
  - [ ] 4.1 Create `src/hooks/useUserSharedGroups.ts`
  - [ ] 4.2 Subscribe to user's `memberOfSharedGroups` profile field
  - [ ] 4.3 Fetch SharedGroup documents for each groupId
  - [ ] 4.4 Return array of groups with loading/error states
  - [ ] 4.5 Use React Query for caching

- [ ] Task 5: Integrate View Mode into Views (AC: #5)
  - [ ] 5.1 Update `DashboardView.tsx` to use ViewModeContext for filtering
  - [ ] 5.2 Update `TrendsView.tsx` / analytics to filter by group
  - [ ] 5.3 Update `HistoryView.tsx` to filter by group
  - [ ] 5.4 Update `InsightsView.tsx` to scope insights to group
  - [ ] 5.5 Create helper `useFilteredTransactions()` that respects view mode

- [ ] Task 6: Add Visual Polish (AC: #3, #4, #7)
  - [ ] 6.1 Animate transition between modes (logo morph, color fade)
  - [ ] 6.2 Style group selector dropdown per mockup
  - [ ] 6.3 Create member avatar stack component
  - [ ] 6.4 Ensure dark mode compatibility for group colors

- [ ] Task 7: i18n Translations
  - [ ] 7.1 Add "Personal", "Viewing", member count strings
  - [ ] 7.2 Add accessibility labels for view mode switcher

- [ ] Task 8: Component Tests
  - [ ] 8.1 Test ViewModeContext state management
  - [ ] 8.2 Test localStorage persistence
  - [ ] 8.3 Test TopHeader renders correctly per mode
  - [ ] 8.4 Test GroupSelector displays all user groups

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

{{agent_model_name_version}}

### Completion Notes List

### File List

