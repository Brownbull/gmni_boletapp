# Story 14d-v2.1.6c-2: Accept Invitation Dialog

Status: done

> **Split from:** [14d-v2-1-6c-invitations-ui.md](14d-v2-1-6c-invitations-ui.md)
> **Part:** 2 of 2 (Interaction Logic - Accept Dialog)
> **Related stories:** 14d-v2-1-6c-1 (Badge & List), 14d-v2-1-6d (Opt-In), 14d-v2-1-6b (Logic)

## Story

As a **user**,
I want **to see invitation details and accept/decline with clear UI feedback**,
So that **I can make informed decisions about joining groups**.

## Acceptance Criteria

### From Original Story (AC: #2, #3)

1. **Given** I view a pending invitation
   **When** I tap "Accept"
   **Then** I become a member of the group
   **And** the invitation is removed from pending
   **And** other group members can see me in the member list

2. **Given** I accept an invitation successfully
   **When** the View Mode Switcher is opened
   **Then** the newly joined group appears immediately in my groups list

## Tasks / Subtasks

- [x] **Task 8: Invitation Detail/Accept Dialog** (AC: #1, #2)
  - [x] 8.1: Create `src/components/SharedGroups/AcceptInvitationDialog.tsx`
  - [x] 8.2: Show invitation details: group name, inviter name, member count
  - [x] 8.3: If `transactionSharingEnabled == true`: trigger opt-in flow (Story 1.6d)
  - [x] 8.4: If `transactionSharingEnabled == false`: skip opt-in, join directly
  - [x] 8.5: Add Accept/Decline/Cancel buttons
  - [x] 8.6: Show success toast on accept
  - [x] 8.7: Navigate to new group after accept (AC: #2 - View Mode Switcher)
  - [x] 8.8: Add unit tests for dialog states

- [x] **Task 9: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [x] 9.1: All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - [x] 9.2: Add translation keys to `translations.ts`: `acceptInvitation`, `declineInvitation`, `joinGroup`, `invitedToJoin`, `members`, `transactionSharingLabel`, `reviewAndJoin`
  - [x] 9.3: Test component with all 3 themes (mono, normal, professional)
  - [x] 9.4: Test component in dark mode
  - [x] 9.5: Add data-testid attributes: `accept-invitation-dialog`, `accept-btn`, `decline-btn`, `cancel-btn`, `group-info`
  - [x] 9.6: Accessibility: aria-labelledby, Escape to close, focus management
  - [x] 9.7: Use Lucide icons only (Users, X, Check, Loader2, Share2, XCircle, ArrowLeft)
  - [x] 9.8: Follow dialog pattern from `CreateGroupDialog.tsx`

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Post-Accept Navigation** | View Mode Switcher | Immediate access to new group |
| **Opt-In Check** | transactionSharingEnabled flag | Privacy-first design |

### UI Mockup Reference

**Accept Dialog (basic - no sharing):**
```
+-----------------------------------------+
| Join "Household"?                       |
+-----------------------------------------+
| Alice invited you to join this group.   |
|                                         |
| Members: 3                              |
|                                         |
| [Cancel]  [Decline]  [Join Group]      |
+-----------------------------------------+
```

**Accept Dialog (with sharing - triggers opt-in):**
```
+-----------------------------------------+
| Join "Household"?                       |
+-----------------------------------------+
| Alice invited you to join this group.   |
|                                         |
| Members: 3                              |
| Transaction Sharing: Enabled            |
|                                         |
| [Cancel]  [Decline]  [Review & Join]   |
+-----------------------------------------+
```
Note: "Review & Join" opens opt-in flow from Story 14d-v2-1-6d

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | **NEW** | Accept/decline dialog |
| `tests/unit/components/SharedGroups/AcceptInvitationDialog.test.tsx` | **NEW** | Dialog tests |

### Testing Standards

- **Unit tests:** 10+ tests covering dialog states
- **Coverage target:** 80%+ for new code
- **Test patterns:** Mock accept/decline functions, test opt-in branching

### Conditional Flow Logic

```
onAccept():
  IF group.transactionSharingEnabled == true:
    openOptInDialog(group)  // Story 14d-v2-1-6d handles this
  ELSE:
    acceptInvitation(invitationId)
    showSuccessToast()
    navigateToGroup(groupId)
```

### Project Structure Notes

- Components: `src/components/SharedGroups/` directory
- Feature directory: `src/features/shared-groups/` (per Epic 14e patterns)

### References

- [Original Story: 14d-v2-1-6c-invitations-ui.md](14d-v2-1-6c-invitations-ui.md)
- [Story 1.6d (Opt-In): 14d-v2-1-6d-optin-error-ui.md](14d-v2-1-6d-optin-error-ui.md)
- [Story 1.10 (View Mode Switcher): 14d-v2-1-10a-viewmode-store-integration.md](14d-v2-1-10a-viewmode-store-integration.md)

## Dependency Notes

**UPSTREAM (must be complete):**
- Story 14d-v2-1-6c-1: Badge & List UI (triggers this dialog)
- Story 14d-v2-1-6b: Accept/Decline Logic (provides accept/decline functions)

**DOWNSTREAM (depends on this):**
- Story 14d-v2-1-6d: Opt-In Dialog (triggered when sharing enabled)
- Story 14d-v2-1-10b: View Mode Switcher UI (shows newly joined groups)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (atlas-dev-story workflow)

### Debug Log References

- All 41 unit tests pass for AcceptInvitationDialog
- All 6804 tests pass in quick test suite (no regressions)

### Completion Notes List

1. **AcceptInvitationDialog Component Created**
   - Modal dialog following CreateGroupDialog pattern
   - Shows invitation details: group name, inviter name, member count
   - Fetches group data on open to get member count and sharing status
   - Transaction sharing notice displays when group has sharing enabled
   - "Review & Join" button triggers opt-in flow (Story 1.6d)
   - "Join" button directly accepts when sharing disabled

2. **Opt-In Flow Integration**
   - `onOpenOptIn` callback triggers opt-in dialog when `transactionSharingEnabled=true`
   - Falls back to direct accept if no opt-in handler provided

3. **UI Standards Compliance**
   - All colors use CSS custom properties (--surface, --bg-tertiary, --primary, etc.)
   - Exception: #ef4444 for decline button per convention
   - Lucide icons: Users, X, Check, Loader2, Share2

4. **Accessibility**
   - ARIA: role="dialog", aria-modal, aria-labelledby
   - Escape key closes dialog (blocked during isPending)
   - Focus managed to close button on open
   - Body scroll locked when open

5. **Translation Keys Added**
   - `invitedToJoinMessage`, `transactionSharingLabel`, `reviewAndJoin`, `loadingGroup`
   - Both English and Spanish translations

6. **Test Coverage** (41 tests)
   - Basic rendering (5 tests)
   - Group info display (5 tests)
   - Transaction sharing notice (4 tests)
   - Button actions (8 tests)
   - Loading state (5 tests)
   - Accessibility (6 tests)
   - State management (2 tests)
   - Spanish language support (1 test)
   - Edge cases (5 tests)

### File List

| File | Action |
|------|--------|
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | **NEW** |
| `src/components/SharedGroups/index.ts` | **MODIFIED** - Added export |
| `src/utils/translations.ts` | **MODIFIED** - Added 5 translation keys (EN + ES) |
| `tests/unit/components/SharedGroups/AcceptInvitationDialog.test.tsx` | **NEW** |

---

## Code Review Record

### Review Date: 2026-02-02

### Reviewer: Claude Opus 4.5 (atlas-code-review workflow)

### Findings Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| **CRITICAL** | All 5 files NOT STAGED (`??` and ` M` status) | `git add` staged all files |
| **MEDIUM** | Task 9.7 icon list mismatch | Updated to match actual usage |
| **LOW** | "1 members" pluralization | Added `member` singular key + conditional |

### Tests After Fixes

- 41 tests passing ✅
- `act()` warnings present (async state updates in tests - acceptable)

### Atlas Validation

- ✅ Architecture compliance (CSS custom properties, callback pattern)
- ✅ Pattern compliance (tests in correct location, naming conventions)
- ⚠️ Historical lessons applied (git staging verification - 5th occurrence of this pattern)
