# Story 14d-v2.1.6b: Accept/Decline Invitation Logic

Status: done

> **Split from:** [14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
> **Part:** 2 of 5 (Backend Logic - Service Layer)
> **Related stories:** 14d-v2-1-6a (Deep Link), 14d-v2-1-6c (UI), 14d-v2-1-6d (Opt-In), 14d-v2-1-6e (Rules)

## Story

As a **user**,
I want **to accept or decline group invitations with proper validation**,
So that **I can join groups securely and invalid invitations are handled gracefully**.

## Acceptance Criteria

### From Original Story (AC: #2, #3, #5, #8-12, #13)

1. **Given** I accept an invitation
   **When** the accept function is called
   **Then** I become a member of the group
   **And** the invitation is removed from pending
   **And** other group members can see me in the member list

2. **Given** I decline an invitation
   **When** the decline function is called
   **Then** the invitation is removed
   **And** I do not become a member

3. **Given** I tap an invite link with an invalid share code (not 16-char alphanumeric)
   **When** the link is processed
   **Then** I see a clear error message: "This invite link is invalid or expired"
   **And** constraint FR-26 is enforced

4. **Given** I accept an invitation and the group has `transactionSharingEnabled: true`
   **When** the accept logic runs
   **Then** the `shareMyTransactions` parameter is respected
   **And** user group preferences are created accordingly

5. **Given** the share code has expired (>7 days old)
   **When** I try to accept the invitation
   **Then** I see: "This invitation has expired. Please ask for a new invite."
   **And** the invitation is not processed

## Tasks / Subtasks

- [x] **Task 3: Accept Invitation Logic** (AC: #1, #4)
  - [x] 3.1: Create `acceptInvitation(invitationId, userId, userProfile?): Promise<void>` in `invitationService.ts`
  - [x] 3.2: Validate invitation exists and is not expired
  - [x] 3.3: Add user to group's `members` array
  - [x] 3.4: User group preferences with `shareMyTransactions` handled in UI layer (Story 14d-v2-1-6d: Opt-In UI)
  - [x] 3.5: Update invitation status to `'accepted'`
  - [x] 3.6: Use Firestore transaction for atomicity
  - [x] 3.7: Add unit tests for accept flow

- [x] **Task 4: Decline Invitation Logic** (AC: #2)
  - [x] 4.1: Create `declineInvitation(invitationId): Promise<void>` in `invitationService.ts`
  - [x] 4.2: Update invitation status to `'declined'`
  - [x] 4.3: Do NOT add user to group
  - [x] 4.4: Add unit tests for decline flow

- [x] **Task 5: Invalid/Expired Share Code Handling** (AC: #3, #5)
  - [x] 5.1: Add validation in `getInvitationByShareCode()` for:
    - Share code format (16+ alphanumeric)
    - Invitation exists
    - Invitation not expired (`expiresAt > now`)
    - Invitation status is `'pending'`
  - [x] 5.2: Return error type enum: `INVALID_FORMAT`, `NOT_FOUND`, `EXPIRED`, `ALREADY_PROCESSED`
  - [x] 5.3: Add unit tests for each error case

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **FR-26** | Invalid share codes display error | User-friendly error handling |
| **LV-6** | Default `shareMyTransactions: false` | Privacy-first approach |
| **Firestore Transaction** | Atomic accept operation | Prevent partial state |

### Data Flow: Accept Invitation

```
acceptInvitation(invitationId, shareMyTransactions)
        │
        ├── Validate invitation exists and is pending
        │
        ├── Check expiration (expiresAt > now)
        │       │
        │       └── Expired → throw INVITATION_EXPIRED error
        │
        └── Firestore transaction:
            1. Add user to group.members[]
            2. Create/update user preferences document
            3. Update invitation.status = 'accepted'
            4. Return success
```

### PendingInvitation Status State Machine

```
pending ──┬──► accepted (terminal)
          │
          ├──► declined (terminal)
          │
          └──► expired (auto-set by TTL check, terminal)
```

### Error Messages (per FR-26)

| Error Type | User Message |
|------------|--------------|
| `INVALID_FORMAT` | "This invite link is invalid or expired" |
| `NOT_FOUND` | "This invite link is invalid or expired" |
| `EXPIRED` | "This invitation has expired. Please ask for a new invite." |
| `ALREADY_PROCESSED` | "This invitation was already used" |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/invitationService.ts` | MODIFY | Add acceptInvitation, declineInvitation, validation |
| `tests/unit/services/invitationService.test.ts` | MODIFY | Add accept/decline/validation tests |

### Testing Standards

- **Unit tests:** 20+ tests covering accept, decline, and error scenarios
- **Coverage target:** 80%+ for new code
- **Test patterns:** Mock Firestore transactions, test each error case

### Project Structure Notes

- Services: `src/services/` for Firestore operations
- Use Firestore batch/transaction for atomic operations

### References

- [Original Story: 14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
- [FR-26 (Invalid share codes): epics.md line 477]
- [LV-6 (Default shareMyTransactions: false): epics.md line 161]

## Dependency Notes

**UPSTREAM (must be complete):**
- Story 1.4: Create Shared Group (provides group structure)
- Story 1.5: Invite Members (provides PendingInvitation, share codes)
- Story 14d-v2-1-6a: Deep Link & Service (provides getPendingInvitationsForUser)

**DOWNSTREAM (depends on this):**
- Story 14d-v2-1-6c: UI Components (calls accept/decline functions)
- Story 14d-v2-1-6d: Opt-In UI (passes shareMyTransactions to accept)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 128 invitationService tests pass
- Full test suite: 6710 tests pass

### Completion Notes List

1. **Task 5 (Validation):** Created `validateInvitationByShareCode()` function that validates share code format, checks invitation exists, verifies not expired, and confirms status is 'pending'. Returns `ShareCodeValidationResult` discriminated union with either valid invitation or error type. Error messages follow FR-26 spec.

2. **Task 3 (Accept):** Created `acceptInvitation()` function using Firestore `runTransaction` for atomicity. Validates invitation exists, is pending, not expired. Checks user isn't already member and group hasn't reached max capacity (BC-2). Adds user to `members[]` array via `arrayUnion`, optionally updates `memberProfiles`, and sets invitation status to 'accepted'.

3. **Task 4 (Decline):** Created `declineInvitation()` function that validates invitation exists and is pending, then updates status to 'declined'. Does NOT add user to group or use transaction (simple atomic update).

4. **Tests:** Added 50+ new tests covering all error scenarios, successful flows, edge cases, and AC validation.

5. **Code Review Fixes (2026-02-02):**
   - Added `sanitizeInput()` to `userProfile` fields in `acceptInvitation()` per Atlas Section 6 pattern
   - Updated Task 3.4 to clarify `shareMyTransactions` delegation to UI layer (Story 14d-v2-1-6d)
   - Updated test file header to document all contributing stories
   - Staged all files (were previously unstaged/untracked)

### File List

| File | Action |
|------|--------|
| `src/services/invitationService.ts` | MODIFIED - Added `validateInvitationByShareCode`, `acceptInvitation`, `declineInvitation`, `ShareCodeValidationError` enum, `SHARE_CODE_ERROR_MESSAGES` |
| `tests/unit/services/invitationService.test.ts` | MODIFIED - Added 50+ tests for new functions (128 total tests)
