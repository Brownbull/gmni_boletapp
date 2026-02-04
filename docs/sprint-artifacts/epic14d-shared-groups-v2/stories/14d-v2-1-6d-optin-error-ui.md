# Story 14d-v2.1.6d: Transaction Sharing Opt-In & Error UI

Status: done

> **Split from:** [14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
> **Part:** 4 of 5 (UI Components - Opt-In & Errors)
> **Related stories:** 14d-v2-1-6a (Deep Link), 14d-v2-1-6b (Logic), 14d-v2-1-6c (Main UI), 14d-v2-1-6e (Rules)

## Story

As a **user**,
I want **to choose whether to share my transactions when joining a group with sharing enabled**,
So that **I have control over my privacy when joining shared groups**.

## Acceptance Criteria

### From Original Story (AC: #5, #8-12, #13)

1. **Given** I accept a group invitation and the group has `transactionSharingEnabled: true`
   **When** before completing the join
   **Then** I see a dialog:
     - Title: "[Group Name] allows transaction sharing"
     - Body: "Would you like to share your transaction details with group members? Your spending totals will always be visible in group statistics."
     - Options: [Yes, share my transactions] [No, just statistics]
   **And** constraint FR-25 is enforced (join flow opt-in prompt)

2. **Given** I tap "Yes, share my transactions" in the opt-in dialog
   **When** the join completes
   **Then** `shareMyTransactions` is set to `true` for this group
   **And** I see confirmation: "You're now a member of [Group Name]"

3. **Given** I tap "No, just statistics" in the opt-in dialog
   **When** the join completes
   **Then** `shareMyTransactions` is set to `false` for this group
   **And** I see confirmation: "You're now a member of [Group Name]. You can change sharing preferences in group settings."

4. **Given** the group has `transactionSharingEnabled: false`
   **When** I accept the invitation
   **Then** I do NOT see the transaction sharing prompt
   **And** I join directly with `shareMyTransactions: false`

5. **Given** I dismiss the opt-in dialog without choosing
   **When** the join completes
   **Then** `shareMyTransactions` defaults to `false` (privacy-first)
   **And** constraint LV-6 is enforced (default: false)

6. **Given** I tap an invite link with an invalid share code
   **When** the link is processed
   **Then** I see a clear error message: "This invite link is invalid or expired"
   **And** constraint FR-26 is enforced

7. **Given** the share code has expired (>7 days old)
   **When** I try to accept the invitation
   **Then** I see: "This invitation has expired. Please ask for a new invite."

## Tasks / Subtasks

- [x] **Task 9: Transaction Sharing Opt-In Dialog** (AC: #1-5)
  - [x] 9.1: Create `src/components/SharedGroups/TransactionSharingOptInDialog.tsx`
  - [x] 9.2: Display per FR-25: "[Group Name] allows transaction sharing"
  - [x] 9.3: Explain: "Would you like to share your transaction details..."
  - [x] 9.4: Options: [Yes, share my transactions] [No, just statistics]
  - [x] 9.5: Handle dismiss as "No" (privacy-first, per LV-6)
  - [x] 9.6: Add unit tests for dialog

- [x] **Task 10: Error Handling UI** (AC: #6, #7)
  - [x] 10.1: Create `src/components/SharedGroups/InvitationErrorView.tsx`
  - [x] 10.2: Display appropriate error message based on error type
  - [x] 10.3: "This invite link is invalid or expired" for invalid format
  - [x] 10.4: "This invitation has expired. Please ask for a new invite." for expired
  - [x] 10.5: "This invitation was already used" for already processed
  - [x] 10.6: Add "Back to Home" button
  - [x] 10.7: Add unit tests for error states

- [x] **Task 11: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [x] 11.1: All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - [x] 11.2: Add translation keys to `translations.ts`: `shareMyTransactions`, `shareMyTransactionsDescription`, `yesShareTransactions`, `noJustStatistics`, `privacyNote`, `invalidInviteLink`, `invitationExpired`, `invitationAlreadyUsed`, `askForNewInvite`, `backToHome`
  - [x] 11.3: Test components with all 3 themes (mono, normal, professional)
  - [x] 11.4: Test components in dark mode
  - [x] 11.5: Add data-testid attributes: `optin-dialog`, `share-yes-btn`, `share-no-btn`, `join-btn`, `error-view`, `back-home-btn`
  - [x] 11.6: Accessibility: aria-labelledby, focus management, radio button group semantics
  - [x] 11.7: Use Lucide icons only (AlertTriangle, Info, Check, X, Home)
  - [x] 11.8: Follow dialog pattern from `CreateGroupDialog.tsx`

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **FR-25** | Join flow opt-in prompt | Clear consent when joining sharing-enabled group |
| **FR-26** | Invalid share codes display error | User-friendly error handling |
| **LV-6** | Default `shareMyTransactions: false` | Privacy-first approach |
| **LV-8** | Join flow opt-in prompt | Prompt on join for sharing-enabled groups |

### UI Mockup Reference

**Opt-In Dialog:**
```
┌────────────────────────────────────────┐
│ "Household" allows transaction sharing │
├────────────────────────────────────────┤
│ Would you like to share your           │
│ transaction details with group members?│
│                                        │
│ Your spending totals will always be    │
│ visible in group statistics.           │
│                                        │
│ ○ Yes, share my transactions           │
│ ● No, just statistics (default)        │
│                                        │
│ [Cancel]              [Join Group]     │
└────────────────────────────────────────┘
```

**Error View:**
```
┌────────────────────────────────────────┐
│ ⚠️ Invalid Invitation                  │
├────────────────────────────────────────┤
│                                        │
│ This invite link is invalid or expired │
│                                        │
│ Please ask the group owner for a new   │
│ invitation link.                       │
│                                        │
│         [Back to Home]                 │
│                                        │
└────────────────────────────────────────┘
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
| `src/components/SharedGroups/TransactionSharingOptInDialog.tsx` | **NEW** | Opt-in prompt |
| `src/components/SharedGroups/InvitationErrorView.tsx` | **NEW** | Error display |
| `tests/unit/components/SharedGroups/TransactionSharingOptInDialog.test.tsx` | **NEW** | Opt-in tests |
| `tests/unit/components/SharedGroups/InvitationErrorView.test.tsx` | **NEW** | Error tests |

### Testing Standards

- **Unit tests:** 20+ tests covering opt-in dialog and error states
- **Coverage target:** 80%+ for new code
- **Test patterns:** Test each option selection, dismiss behavior, all error types

### Project Structure Notes

- Components: `src/components/SharedGroups/` directory
- Feature directory: `src/features/shared-groups/` (per Epic 14e patterns)

### References

- [Original Story: 14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)
- [FR-25 (Join flow opt-in): epics.md line 84]
- [FR-26 (Invalid share codes): epics.md line 477]
- [LV-6 (Default shareMyTransactions: false): epics.md line 161]
- [LV-8 (Join flow opt-in prompt): epics.md line 163]

## Dependency Notes

**UPSTREAM (must be complete):**
- Story 14d-v2-1-6b: Accept/Decline Logic (provides error types)
- Story 14d-v2-1-6c: Invitations UI (triggers opt-in dialog)

**DOWNSTREAM (depends on this):**
- Story 14d-v2-1-6e: Integration Tests (tests full opt-in flow)
- Story 1.12: User Transaction Sharing Preference (respects shareMyTransactions)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered during implementation

### Completion Notes List

1. **Task 9 - TransactionSharingOptInDialog**: Created opt-in dialog with radio group selection for transaction sharing preference. Implements FR-25 (join flow opt-in) and LV-6 (privacy-first default to false). Dialog shows group name, explains sharing choice, and defaults to "No, just statistics" option.

2. **Task 10 - InvitationErrorView**: Created error display component supporting all error types (INVALID_FORMAT, NOT_FOUND, EXPIRED, ALREADY_PROCESSED, ALREADY_MEMBER, GROUP_FULL, NETWORK_ERROR). Implements FR-26 with user-friendly error messages and "Back to Home" navigation.

3. **Task 11 - UI Standards**: Both components follow 14d-v2-ui-conventions.md:
   - CSS custom properties for all colors (except #ef4444 for errors)
   - 30+ translation keys added (English + Spanish)
   - All interactive elements have data-testid attributes
   - Full accessibility: ARIA attributes, keyboard navigation, focus management, radiogroup semantics
   - Lucide icons only (X, Users, Loader2, Info, Check, AlertTriangle, Home, Link2Off, Clock, CheckCircle2)
   - Dialog pattern follows CreateGroupDialog.tsx

4. **Test Results**: 75 new tests created (38 for opt-in dialog, 37 for error view). Full test suite passes: 6,879 tests passing.

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/TransactionSharingOptInDialog.tsx` | **NEW** | Opt-in dialog for transaction sharing choice |
| `src/components/SharedGroups/InvitationErrorView.tsx` | **NEW** | Error display for invitation errors |
| `src/components/SharedGroups/index.ts` | **MODIFIED** | Added exports for new components |
| `src/utils/translations.ts` | **MODIFIED** | Added 30+ translation keys (en + es) |
| `tests/unit/components/SharedGroups/TransactionSharingOptInDialog.test.tsx` | **NEW** | 38 unit tests for opt-in dialog |
| `tests/unit/components/SharedGroups/InvitationErrorView.test.tsx` | **NEW** | 37 unit tests for error view |
| `docs/sprint-artifacts/sprint-status.yaml` | **MODIFIED** | Status: ready-for-dev → in-progress |
