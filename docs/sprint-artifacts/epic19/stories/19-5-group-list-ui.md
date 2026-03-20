# Story 19-5: Group Context Switcher and Group View

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Build the room selector — the dropdown that lets you walk between your personal space and shared boards"

## Story
As a user, I want to switch between my personal view and group views via a dropdown in the app header, so that I can see group transactions and analytics within the same familiar interface.

## Acceptance Criteria

### Functional
- **AC-1:** Given the Gastify logo icon in the app header, when tapped, then a dropdown opens showing: "Gastify" (personal) and all groups the user belongs to (max 5)
- **AC-2:** Given the dropdown, when a group name/icon is tapped, then the app switches to group view: title shows group name + icon, navigation bar background changes to group color
- **AC-3:** Given group view is active, when user navigates between Home/Transactions/Analytics/Settings, then all navigation options remain — only the nav bar background color changes
- **AC-4:** Given the dropdown in group view, when "Gastify" (personal) is tapped, then the app returns to personal view with original title and nav bar colors
- **AC-5:** Given the dropdown, each group shows an auto-copy toggle — when ON, new personal transactions are automatically copied to that group (integration in 19-6)
- **AC-6:** Given group view, when user taps "Leave Group" in group options, then leave-group rules apply: last person → delete confirmation, only admin but others exist → must appoint admin first (error), otherwise → confirm and leave
- **AC-7:** Given the dropdown, a "Create Group" button is visible, tapping it opens the Create Group form (name, icon, color)
- **AC-8:** Given user creates a new group, when form is submitted, then `createGroup` Cloud Function is called and group appears in dropdown

### Architectural
- **AC-ARCH-LOC-1:** Group feature at `src/features/groups/`
- **AC-ARCH-LOC-2:** Group context store at `src/features/groups/stores/useGroupContextStore.ts`
- **AC-ARCH-LOC-3:** Auto-copy toggle state at `src/features/groups/stores/useGroupAutoCopyStore.ts` (localStorage persisted)
- **AC-ARCH-PATTERN-1:** TanStack Query for group list subscription
- **AC-ARCH-PATTERN-2:** data-testid on all interactive elements
- **AC-ARCH-PATTERN-3:** Nav bar only changes background color — all navigation options remain identical

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Group context store | `src/features/groups/stores/useGroupContextStore.ts` | Zustand store | NEW |
| Auto-copy store | `src/features/groups/stores/useGroupAutoCopyStore.ts` | Zustand + localStorage | NEW |
| Group switcher dropdown | `src/features/groups/components/GroupSwitcherDropdown.tsx` | FSD component | NEW |
| Create group form | `src/features/groups/components/CreateGroupForm.tsx` | FSD component | NEW |
| Leave group handler | `src/features/groups/handlers/useLeaveGroup.ts` | Feature hook | NEW |
| Group hooks | `src/features/groups/hooks/useGroups.ts` | TanStack Query | NEW |
| Feature barrel | `src/features/groups/index.ts` | FSD barrel | NEW |
| App header | `src/app/` or header component | App shell | MODIFIED |
| Navigation bar | `src/app/` or nav component | App shell | MODIFIED |
| Tests | `tests/unit/features/groups/` | Vitest/RTL | NEW |

## Tasks

### Task 1: Group Feature Scaffold (2 subtasks)
- [ ] 1.1: Create `src/features/groups/` directory structure (stores/, components/, hooks/, handlers/, types/)
- [ ] 1.2: Create feature barrel `index.ts`

### Task 2: Group Data Hook (2 subtasks)
- [ ] 2.1: Create `useGroups.ts` — TanStack Query hook for user's groups (Firestore query: groups where members array-contains userId)
- [ ] 2.2: Cache configuration: staleTime 5min, gcTime 30min (matches existing pattern)

### Task 3: Group Context and Auto-Copy Stores (3 subtasks)
- [ ] 3.1: Create `useGroupContextStore.ts` — activeGroupId (null = personal view), activeGroup data (name, icon, color, admins, members, memberProfiles), enterGroupView(groupId), exitGroupView()
- [ ] 3.2: Create `useGroupAutoCopyStore.ts` — per-group toggle state `{ [groupId]: boolean }`, persisted to localStorage. getAutoCopyGroupIds() returns list of group IDs with toggle ON.
- [ ] 3.3: **HARDENING (PURE_COMPONENT):** Ensure store changes trigger minimal re-renders — use Zustand selectors

### Task 4: Group Switcher Dropdown (3 subtasks)
- [ ] 4.1: Create `GroupSwitcherDropdown.tsx` — dropdown triggered by logo icon tap. Shows "Gastify" (personal, always first) + list of user's groups (icon + name + auto-copy toggle each).
- [ ] 4.2: Group item: tap name/icon → call enterGroupView(groupId). Toggle → update auto-copy store.
- [ ] 4.3: "Create Group" button at bottom → opens `CreateGroupForm.tsx` (name input, icon picker, color picker). **HARDENING (INPUT_SANITIZATION):** Group name through sanitizeInput().

### Task 5: Group View Integration (3 subtasks)
- [ ] 5.1: Modify app header: when activeGroupId is set, show group name + icon as title instead of "Gastify"
- [ ] 5.2: Modify navigation bar: when activeGroupId is set, change background color to group's color. All navigation items remain identical (Home, Transactions, Analytics, Settings).
- [ ] 5.3: **HARDENING:** Empty state when user has no groups — show "Create your first group" prompt in dropdown

### Task 6: Leave Group Flow (2 subtasks)
- [ ] 6.1: Create `useLeaveGroup.ts` — calls manageGroupMember CF for self-removal. Handles three cases: (a) last person → show deletion confirmation warning, (b) only admin with other members → show "You must appoint another admin before leaving" error toast, (c) otherwise → confirm and leave.
- [ ] 6.2: Add "Leave Group" action accessible from group view (e.g., in dropdown group options or gear icon in group header)

### Task 7: Tests and Verification (2 subtasks)
- [ ] 7.1: Unit tests: GroupSwitcherDropdown rendering (personal + groups), group context switching (enter/exit), auto-copy toggle state, CreateGroupForm validation, leave group scenarios (last person, only admin, normal leave)
- [ ] 7.2: Run `npm run test:quick`

## Sizing
- **Points:** 8 (LARGE)
- **Tasks:** 7
- **Subtasks:** 17
- **Files:** ~10

## Dependencies
- **19-1** (types and constants), **19-2** (Cloud Functions for create and leave)

## Risk Flags
- PURE_COMPONENT (context switching, empty states, loading states)
- INPUT_SANITIZATION (group name, icon, color)
- E2E_TESTING (data-testid on all elements)

## Dev Notes
- Feature-Sliced Design: groups is a new feature directory under `src/features/groups/`
- TanStack Query for data subscription matches existing codebase pattern (transactions use it)
- Client-side admin check is for UX only (show/hide actions) — never trusted for security
- Group list query: Firestore query on groups collection where `members` array contains current userId
- Auto-copy toggle is client-side only (Zustand + localStorage) — not shared with other group members, not stored in Firestore
- When entering group view, the existing Home/Transactions/Analytics views should detect `activeGroupId` and fetch group-scoped data — transaction feed integration in Story 19-6, analytics integration in Story 19-8
- Group transaction count: use Firestore `.count()` aggregation query for display in dropdown (cheap and accurate)
- **Offline note:** Group creation and leave require internet. Show toast "Group actions require internet connection." Disable create/leave buttons when offline.
