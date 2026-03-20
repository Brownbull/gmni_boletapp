# Story 19-9: Group Admin Panel, Settings, and Member Management UI

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Add the management office — admin controls for settings, members, and the building manager's tools"

## Story
As a group admin, I want a panel to manage members (add/remove), transfer admin roles, update group settings (name/icon/color), and delete the group, so that I can maintain the group.

## Acceptance Criteria

### Functional
- **AC-1:** Given admin panel, when admin views members, then each shows name and photo (from memberProfiles), role (admin/member), and action buttons
- **AC-2:** Given admin panel, when admin removes a member, then `manageGroupMember` Cloud Function is called
- **AC-3:** Given admin panel, when admin transfers admin role (promote/demote), then `transferGroupAdmin` Cloud Function is called. Self-demotion allowed if ≥2 admins exist.
- **AC-4:** Given admin panel, when admin updates group name/icon/color, then `updateGroup` Cloud Function is called
- **AC-5:** Given admin panel, when admin deletes group, then confirmation dialog appears showing transaction count: "This will permanently delete all [N] transactions posted to this group. This cannot be undone." User must type group name to confirm. Then `deleteGroup` Cloud Function is called.
- **AC-6:** Given non-admin user, when viewing group, then admin panel is NOT visible
- **AC-7:** Given admin is the only admin but other members exist, when admin tries to demote self or leave, then show "You must appoint another admin first" error

### Architectural
- **AC-ARCH-LOC-1:** Admin panel at `src/features/groups/components/GroupAdminPanel.tsx`
- **AC-ARCH-LOC-2:** Group settings at `src/features/groups/components/GroupSettingsForm.tsx`
- **AC-ARCH-PATTERN-1:** Client-side role check for UX only — never trusted for security

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Admin panel | `src/features/groups/components/GroupAdminPanel.tsx` | FSD component | NEW |
| Group settings form | `src/features/groups/components/GroupSettingsForm.tsx` | FSD component | NEW |
| Admin handlers | `src/features/groups/handlers/useGroupAdmin.ts` | Feature hook | NEW |
| Tests | `tests/unit/features/groups/GroupAdminPanel.test.tsx` | Vitest/RTL | NEW |

## Tasks

### Task 1: Group Settings UI (2 subtasks)
- [ ] 1.1: Create `GroupSettingsForm.tsx` — edit group name (text input with sanitizeInput), icon (emoji picker or predefined set), color (color picker with hex output)
- [ ] 1.2: Submit calls `updateGroup` Cloud Function. Success toast on update. Form pre-populated with current values.

### Task 2: Admin Panel UI (3 subtasks)
- [ ] 2.1: Member list with name, photo, role badges (from memberProfiles) and action menus: remove member, promote to admin, demote from admin
- [ ] 2.2: "Delete Group" button with destructive confirmation dialog: show transaction count (Firestore `.count()` query), display "This will permanently delete all [N] transactions posted to this group. This cannot be undone." Require typing group name to confirm.
- [ ] 2.3: **HARDENING:** Disable self-demotion if user is last admin (show "appoint another admin first"). Allow self-demotion if ≥2 admins.

### Task 3: Admin Handlers (2 subtasks)
- [ ] 3.1: Create `useGroupAdmin.ts` — wraps Cloud Function calls for: member management (add/remove), admin transfer (promote/demote), group settings update, group deletion
- [ ] 3.2: Error handling: show toast for each error code (UNAUTHORIZED, GROUP_ADMIN_MIN, MUST_APPOINT_ADMIN, GROUP_NOT_FOUND, etc.)

### Task 4: Tests (2 subtasks)
- [ ] 4.1: Unit tests: admin panel renders for admin (with member list, settings, delete), hidden for non-admin, group settings form validation
- [ ] 4.2: Unit tests: handler calls correct Cloud Functions with correct params, delete confirmation flow, self-demotion rules

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 10
- **Files:** ~4

## Dependencies
- **19-2** (CRUD Cloud Functions including updateGroup), **19-5** (group view context)

## Risk Flags
- PURE_COMPONENT (conditional rendering based on role)
- ERROR_RESILIENCE (Cloud Function error handling)
- INPUT_SANITIZATION (group name)

## Dev Notes
- "Type group name to confirm deletion" pattern prevents accidental group deletion
- Cloud Functions enforce all business rules (1+ admin, 50 member limit, group limit, etc.) — client just calls and handles responses
- Error toast: use existing toast/notification system in the app
- Admin panel accessible from group view (e.g., gear icon in group header, visible only to admins)
- Group settings: name (text input, maxLength 100), icon (emoji or predefined icon set), color (hex color picker like #FF5733)
- memberProfiles provides displayName and photoURL for the member list — no extra Firebase Auth lookups needed
