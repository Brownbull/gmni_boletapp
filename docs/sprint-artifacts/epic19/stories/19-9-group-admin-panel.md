# Story 19-9: Group Admin Panel and Member Management UI

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by adding the management office door -- admin controls for the building manager"

## Story
As a group admin, I want a panel to manage members (add/remove), transfer admin roles, and delete the group, so that I can maintain the group.

## Acceptance Criteria

### Functional
- **AC-1:** Given admin panel, when admin views members, then each shows name, role (admin/member), and action buttons
- **AC-2:** Given admin panel, when admin removes a member, then `manageGroupMember` Cloud Function is called
- **AC-3:** Given admin panel, when admin transfers admin role, then `transferGroupAdmin` Cloud Function is called
- **AC-4:** Given admin panel, when admin deletes group, then confirmation dialog appears and `deleteGroup` Cloud Function is called
- **AC-5:** Given non-admin user, when viewing group, then admin panel is NOT visible

### Architectural
- **AC-ARCH-LOC-1:** Admin panel at `src/features/groups/components/GroupAdminPanel.tsx`
- **AC-ARCH-PATTERN-1:** Client-side role check for UX only -- never trusted for security

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Admin panel | `src/features/groups/components/GroupAdminPanel.tsx` | FSD component | NEW |
| Admin handlers | `src/features/groups/handlers/useGroupAdmin.ts` | Feature hook | NEW |
| Tests | `tests/unit/features/groups/GroupAdminPanel.test.tsx` | Vitest/RTL | NEW |

## Tasks

### Task 1: Admin Panel UI (3 subtasks)
- [ ] 1.1: Member list with role badges and action menus (remove, promote/demote admin)
- [ ] 1.2: "Delete Group" button with destructive confirmation dialog (type group name to confirm)
- [ ] 1.3: **HARDENING:** Disable "remove self" if user is last admin (must transfer first)

### Task 2: Admin Handlers (2 subtasks)
- [ ] 2.1: Create `useGroupAdmin.ts` -- wraps Cloud Function calls for member management, admin transfer, group deletion
- [ ] 2.2: Error handling: show toast for each error code (UNAUTHORIZED, GROUP_ADMIN_MIN, etc.)

### Task 3: Tests (2 subtasks)
- [ ] 3.1: Unit tests: admin panel renders for admin, hidden for non-admin
- [ ] 3.2: Unit tests: handler calls correct Cloud Functions with correct params

### Task 4: Verification (1 subtask)
- [ ] 4.1: Run `npm run test:quick`

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 8
- **Files:** ~3

## Dependencies
- **19-2** (CRUD Cloud Functions), **19-5** (group detail view)

## Risk Flags
- PURE_COMPONENT (conditional rendering based on role)
- ERROR_RESILIENCE (Cloud Function error handling)

## Dev Notes
- "Type group name to confirm deletion" pattern prevents accidental group deletion
- Cloud Functions enforce all business rules (1+ admin, 50 member limit, etc.) -- client just calls and handles responses
- Error toast: use existing toast/notification system in the app
