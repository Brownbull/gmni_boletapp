# Story 19-5: Group List and Group Detail UI

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by creating the rooms people walk into -- group list and group detail views"

## Story
As a user, I want to see my groups and view group details (members, settings), so that I can navigate the shared expense experience.

## Acceptance Criteria

### Functional
- **AC-1:** Given user is a member of groups, when viewing group list, then all their groups are displayed
- **AC-2:** Given a group, when user taps it, then group detail shows: name, member list, admin indicators, transaction count
- **AC-3:** Given group detail, when user is admin, then admin actions are visible (manage members, delete group)
- **AC-4:** Given group detail, when user is NOT admin, then admin actions are hidden
- **AC-5:** Given user creates a new group, when form is submitted, then createGroup Cloud Function is called

### Architectural
- **AC-ARCH-LOC-1:** Group feature at `src/features/groups/`
- **AC-ARCH-LOC-2:** Group store at `src/features/groups/stores/useGroupStore.ts`
- **AC-ARCH-PATTERN-1:** TanStack Query for group list subscription
- **AC-ARCH-PATTERN-2:** data-testid on all interactive elements

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Group store | `src/features/groups/stores/useGroupStore.ts` | Zustand store | NEW |
| Group list component | `src/features/groups/components/GroupList.tsx` | FSD component | NEW |
| Group detail component | `src/features/groups/components/GroupDetail.tsx` | FSD component | NEW |
| Create group form | `src/features/groups/components/CreateGroupForm.tsx` | FSD component | NEW |
| Group hooks | `src/features/groups/hooks/useGroups.ts` | TanStack Query | NEW |
| Feature barrel | `src/features/groups/index.ts` | FSD barrel | NEW |
| Navigation | `src/app/` or `src/views/` | App routing | MODIFIED |
| Tests | `tests/unit/features/groups/` | Vitest/RTL | NEW |

## Tasks

### Task 1: Group Feature Scaffold (2 subtasks)
- [ ] 1.1: Create `src/features/groups/` directory structure (stores/, components/, hooks/, handlers/, types/)
- [ ] 1.2: Create feature barrel `index.ts`

### Task 2: Group Data Hook (2 subtasks)
- [ ] 2.1: Create `useGroups.ts` -- TanStack Query hook for user's groups (onSnapshot subscription)
- [ ] 2.2: Cache configuration: staleTime 5min, gcTime 30min (matches existing pattern)

### Task 3: Group List UI (3 subtasks)
- [ ] 3.1: Create `GroupList.tsx` -- list of group cards with name, member count, last activity
- [ ] 3.2: Create "Create Group" button + `CreateGroupForm.tsx` (name input + create)
- [ ] 3.3: **HARDENING (PURE_COMPONENT):** Empty state when user has no groups

### Task 4: Group Detail UI (3 subtasks)
- [ ] 4.1: Create `GroupDetail.tsx` -- group name, member list with admin badges
- [ ] 4.2: Admin section: manage members, delete group (conditional on user role)
- [ ] 4.3: **HARDENING (INPUT_SANITIZATION):** Group name input through sanitizeInput()

### Task 5: Navigation (1 subtask)
- [ ] 5.1: Add groups view to app navigation (tab or menu item)

### Task 6: Tests and Verification (2 subtasks)
- [ ] 6.1: Unit tests: GroupList rendering, empty state, CreateGroupForm
- [ ] 6.2: Run `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 13
- **Files:** ~8

## Dependencies
- **19-1** (types), **19-2** (Cloud Functions for CRUD)

## Risk Flags
- PURE_COMPONENT (empty states, loading states)
- INPUT_SANITIZATION (group name)
- E2E_TESTING (data-testid)

## Dev Notes
- Feature-Sliced Design: groups is a new feature directory under `src/features/groups/`
- TanStack Query for data subscription matches the existing codebase pattern (transactions use it)
- Client-side admin check is for UX only (show/hide actions) -- never trusted for security (security rules are authoritative)
- Group list query: read all groups where `members` array contains current userId
