# Story 14d-v2.1.6a: Deep Link & Pending Invitations Service

Status: done

> **Split from:** [14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
> **Part:** 1 of 5 (Foundation - Service Layer)
> **Related stories:** 14d-v2-1-6b (Backend Logic), 14d-v2-1-6c (UI Components), 14d-v2-1-6d (Opt-In & Error UI), 14d-v2-1-6e (Rules & Tests)

## Story

As a **user**,
I want **deep links to group invitations to work whether I'm logged in or not**,
So that **I can easily join groups from shared invite links**.

## Acceptance Criteria

### From Original Story (AC: #4, #6, #7, #1, #15 - Foundation)

1. **Given** I tap an invite link while not logged in
   **When** I log in
   **Then** I am prompted to accept/decline the invitation

2. **Given** I access an invite link `/join/{shareCode}` while not authenticated
   **When** the deep link is processed
   **Then** the share code is stored in session/localStorage
   **And** I am redirected to login
   **And** after successful login, the invitation prompt is shown automatically

3. **Given** I access an invite link `/join/{shareCode}` while authenticated
   **When** the deep link is processed
   **Then** I am immediately shown the invitation details
   **And** I can accept or decline without additional navigation

4. **Given** I have pending group invitations
   **When** I query for my invitations
   **Then** they are returned sorted by date (newest first)
   **And** each includes group name, inviter, and invitation date

## Tasks / Subtasks

- [x] **Task 1: Deep Link Handler for `/join/{shareCode}`** (AC: #1, #2, #3)
  - [x] 1.1: Create `src/hooks/useDeepLinkInvitation.ts`
  - [x] 1.2: Detect `/join/{shareCode}` URL pattern on app open
  - [x] 1.3: If authenticated: fetch invitation by share code immediately
  - [x] 1.4: If not authenticated: store share code in localStorage, redirect to login
  - [x] 1.5: After login: check localStorage for pending share code, trigger invitation flow
  - [x] 1.6: Clear stored share code after processing (success or failure)
  - [x] 1.7: Add unit tests for deep link scenarios

- [x] **Task 2: Pending Invitations Service** (AC: #4)
  - [x] 2.1: Add `getPendingInvitationsForUser(email): Promise<PendingInvitation[]>` to `invitationService.ts`
  - [x] 2.2: Query invitations where `invitedEmail == user.email` AND `status == 'pending'`
  - [x] 2.3: Also query by share code for link-based invitations
  - [x] 2.4: Sort by `createdAt` descending (newest first)
  - [x] 2.5: Add unit tests for service function

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Deep Link Storage** | localStorage | Persists across login redirect |
| **Share Code Key** | `pendingInviteShareCode` | Clear naming for storage key |

### Data Flow: Deep Link Processing

```
User clicks link: https://gastify.app/join/aB3dEfGhIjKlMnOp
        │
        ├── App opens
        │       │
        │       ├── Authenticated?
        │       │       │
        │       │       ├── YES → Fetch invitation by shareCode
        │       │       │           │
        │       │       │           └── Return to UI for display (Story 1.6c)
        │       │       │
        │       │       └── NO → Store shareCode in localStorage
        │       │                       │
        │       │                       └── Redirect to login
        │       │                               │
        │       │                               └── After login: Check localStorage
        │       │                                       │
        │       │                                       └── shareCode found → Resume flow
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useDeepLinkInvitation.ts` | **NEW** | Deep link handler hook |
| `src/services/invitationService.ts` | MODIFY | Add getPendingInvitationsForUser |
| `tests/unit/hooks/useDeepLinkInvitation.test.ts` | **NEW** | Hook tests |
| `tests/unit/services/invitationService.test.ts` | MODIFY | Add service tests |

### Testing Standards

- **Unit tests:** 15+ tests covering deep link and service scenarios
- **Coverage target:** 80%+ for new code
- **Test patterns:** Mock localStorage, mock auth state, mock Firestore

### Project Structure Notes

- Hooks: `src/hooks/` for React hooks
- Services: `src/services/` for Firestore operations
- Feature directory: `src/features/shared-groups/` (per Epic 14e patterns)

### References

- [Original Story: 14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md]
- [Story 1.5 (Invite Members): 14d-v2-1-5-invite-members.md]

## Dependency Notes

**UPSTREAM (must be complete):**
- Story 1.5: Invite Members (provides PendingInvitation type, share codes)

**DOWNSTREAM (depends on this):**
- Story 14d-v2-1-6b: Accept/Decline Logic (uses service functions)
- Story 14d-v2-1-6c: UI Components (uses deep link hook)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) via atlas-dev-story workflow

### Debug Log References

- No debug issues encountered during implementation

### Completion Notes List

1. **Task 1 - Deep Link Hook (`useDeepLinkInvitation.ts`):**
   - Created comprehensive hook handling authenticated and unauthenticated deep link flows
   - Uses localStorage with key `pendingInviteShareCode` (different from existing `useJoinLinkHandler` which uses sessionStorage)
   - Reuses existing `parseShareCodeFromUrl` and `clearJoinUrlPath` utilities from `deepLinkHandler.ts`
   - Calls `getInvitationByShareCode` from invitationService for invitation-based flow
   - Handles error cases: NOT_FOUND, EXPIRED, NETWORK_ERROR, UNKNOWN_ERROR
   - 34 unit tests covering all scenarios

2. **Task 2 - Pending Invitations Service (`getPendingInvitationsForUser`):**
   - Added new function to invitationService.ts with `orderBy('createdAt', 'desc')` sorting
   - Added `orderBy` import from firebase/firestore
   - Queries by normalized email + status='pending' + sorted by date
   - Returns invitations with groupName, invitedByName, createdAt per AC#4
   - 17 unit tests added to existing invitationService.test.ts

3. **Test Results:**
   - 119 tests passing (85 invitationService + 34 useDeepLinkInvitation)
   - Pre-existing failure in firestore-rules.test.ts (unrelated to this story)

### File List

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `src/hooks/useDeepLinkInvitation.ts` | **NEW** | 324 | Deep link invitation hook |
| `src/services/invitationService.ts` | MODIFY | +56 | Added getPendingInvitationsForUser + orderBy import |
| `tests/unit/hooks/useDeepLinkInvitation.test.ts` | **NEW** | 815 | 34 hook tests |
| `tests/unit/services/invitationService.test.ts` | MODIFY | +120 | 17 service tests (85 total in file) |

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-02 | Story implementation complete | All tasks and ACs met |
| 2026-02-02 | Code review fixes: staged 3 untracked files, updated File List line counts | Atlas code review found staging issue (same pattern as 14d-v2-1-5a) |
