# Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch

Status: done

> **Split from:** 14d-v2-1-7 (Leave/Manage Group)
> **Split strategy:** by_feature - UI layer (leave + transfer)
> **Part:** 4 of 6

## Story

As a **group member**,
I want **UI dialogs to leave a group and transfer ownership**,
So that **I can control my group participation with clear visual feedback**.

## Acceptance Criteria

### From Parent Story (applicable to this split)

1. **Given** I am a group member (not owner)
   **When** I tap "Leave Group" and confirm
   **Then** I am removed from the group
   **And** a toast confirms the action

2. **Given** I tap "Leave Group"
   **When** the confirmation dialog appears
   **Then** it shows warning: "Your transactions will remain visible to group members"

3. **Given** I am a group owner
   **When** I tap "Transfer Ownership"
   **Then** I see a list of current members (excluding myself)
   **And** I can select a new owner

4. **Given** I confirm ownership transfer
   **When** the transfer completes
   **Then** a toast shows: "Ownership transferred to [Name]"
   **And** the UI updates to reflect my new non-owner status

5. **Given** a user leaves a group while viewing that group's data
   **When** the leave is processed
   **Then** the app automatically switches to "Personal" view mode
   **And** a toast confirms: "You left [Group Name]. Viewing personal data."

## Tasks / Subtasks

- [x] **Task 1: UI Components - Leave Group** (AC: #1, #2)
  - [x] 1.1: Create `LeaveGroupDialog.tsx` confirmation dialog (pre-existing from Epic 14c)
  - [x] 1.2: Show warning: "Your transactions will remain visible to group members"
  - [x] 1.3: Add "Leave Group" button in group settings (GruposView integration)
  - [x] 1.4: On success, trigger view mode switch (Task 3)
  - [x] 1.5: Show toast: "You left [Group Name]"
  - [x] 1.6: Add component unit tests (50 tests)

- [x] **Task 2: UI Components - Transfer Ownership** (AC: #3, #4)
  - [x] 2.1: Create `TransferOwnershipDialog.tsx` (pre-existing from Epic 14c)
  - [x] 2.2: Show list of current members (exclude self) - MemberSelectorDialog created
  - [x] 2.3: Require confirmation: "Transfer ownership to [Name]?"
  - [x] 2.4: On success, show toast: "Ownership transferred to [Name]"
  - [x] 2.5: Update UI to reflect new owner status (refetch groups)
  - [x] 2.6: Add component unit tests (47 tests + 35 for MemberSelectorDialog)

- [x] **Task 3: View Mode Auto-Switch** (AC: #5)
  - [x] 3.1: In `useViewModeStore`, detect when current group is left
  - [x] 3.2: Subscribe to group membership changes for current user (GruposView handler)
  - [x] 3.3: When user leaves current viewed group, auto-switch to "Personal"
  - [x] 3.4: Show toast notification for context
  - [x] 3.5: Add hook unit tests (4 tests in GruposView.test.tsx)

- [x] **Task 4: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [x] 4.1: All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - [x] 4.2: Add translation keys to `translations.ts` (all keys added for EN/ES)
  - [x] 4.3: Test components with all 3 themes (mono, normal, professional)
  - [x] 4.4: Test components in dark mode
  - [x] 4.5: Add data-testid attributes: `leave-group-dialog`, `leave-confirm-btn`, `transfer-dialog`, `member-list`, `member-item-{id}`, `transfer-confirm-btn`
  - [x] 4.6: Accessibility: aria-labelledby, focus management, list navigation
  - [x] 4.7: Use Lucide icons only (LogOut, Crown, Users, AlertTriangle, Check, X)
  - [x] 4.8: Follow dialog pattern from `CreateGroupDialog.tsx`

## Dev Notes

### Component Architecture

```typescript
// LeaveGroupDialog.tsx
interface LeaveGroupDialogProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  onLeaveSuccess: () => void;
}

// TransferOwnershipDialog.tsx
interface TransferOwnershipDialogProps {
  groupId: string;
  members: GroupMember[];  // Excludes current user
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess: (newOwnerId: string) => void;
}
```

### View Mode Auto-Switch Logic

```typescript
// In useViewModeStore or a subscription hook
useEffect(() => {
  if (viewMode.type === 'group' && !userGroups.includes(viewMode.groupId)) {
    // User is no longer in this group
    setViewMode({ type: 'personal' });
    showToast(`You left ${groupName}. Viewing personal data.`);
  }
}, [userGroups, viewMode]);
```

### Error Handling

| Scenario | Error Message |
|----------|---------------|
| Network error on leave | "Failed to leave group. Please try again." |
| Network error on transfer | "Failed to transfer ownership. Please try again." |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/LeaveGroupDialog.tsx` | **NEW** | Leave confirmation UI |
| `src/components/SharedGroups/TransferOwnershipDialog.tsx` | **NEW** | Transfer ownership UI |
| `src/shared/stores/useViewModeStore.ts` | Modify | Add auto-switch on leave logic |
| `tests/unit/components/SharedGroups/LeaveGroupDialog.test.tsx` | **NEW** | Component tests |
| `tests/unit/components/SharedGroups/TransferOwnershipDialog.test.tsx` | **NEW** | Component tests |

### Testing Standards

- **Unit tests:** 30+ tests covering dialog states and view mode switching
- **Coverage target:** 80%+ for new code
- Test loading states, error states, success states
- Test view mode auto-switch scenarios

### Dependencies

- **14d-v2-1-7a**: Service layer functions (`leaveGroup`, `transferOwnership`)
- **14d-v2-0**: `useViewModeStore` (for auto-switch)

### Downstream Stories

- **14d-v2-1-7f**: Integration tests (verifies UI flows)

### References

- [Parent Story: 14d-v2-1-7-leave-manage-group.md]
- [Atlas Workflow Analysis: View Mode Switcher must auto-switch to Personal]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) via ECC dev-story workflow

### ECC Agents Used

| Agent | Purpose | Output |
|-------|---------|--------|
| Planner | Implementation planning | Detailed plan with phases |
| TDD Guide (x4) | Tests-first development | 157 new tests |
| Code Reviewer | Quality review | 2 HIGH, 6 MEDIUM issues found |
| Security Reviewer | Security analysis | 0 HIGH, 2 MEDIUM (pre-existing) |
| **ECC Code Review (4 parallel)** | Final review | 3 HIGH, 10 MEDIUM, 7 LOW (see follow-ups) |

### Debug Log References

- TDD Guide sessions: LeaveGroupDialog (50 tests), TransferOwnershipDialog (47 tests), MemberSelectorDialog (35 tests), GruposView integration (25 tests)
- Build verification: Type-check passes, 8022 tests pass (2 pre-existing failures in Firestore rules)

### Completion Notes List

1. **LeaveGroupDialog.tsx** and **TransferOwnershipDialog.tsx** were pre-existing from Epic 14c - added comprehensive tests
2. **MemberSelectorDialog.tsx** created new - enables owner to select member for ownership transfer
3. **GruposView.tsx** updated with Leave/Transfer button integration, dialog state management, and view mode auto-switch
4. **translations.ts** updated with 11 new EN/ES translation keys for leave/transfer functionality
5. **Soft/Hard leave mode limitation**: UI captures mode but backend only supports soft leave. Hard leave (transaction untagging) deferred to Story 14d-v2-1-7c Cloud Function

### Code Review Fixes Applied

1. Added missing translation keys: `selectMember`, `selectMemberDescription`, `noOtherMembers` (EN + ES)
2. Documented unused `mode` parameter with TODO for Story 14d-v2-1-7c

### ECC Code Review Follow-ups (2026-02-02)

**Review Score:** 7.5/10 | **Recommendation:** CHANGES REQUESTED

**HIGH Priority (Must fix):**
- [x] [ECC-Review][HIGH][Security] Fix Firestore read rule to require membership: `firestore.rules:62` - change to `allow read: if request.auth != null && request.auth.uid in resource.data.members`
- [x] [ECC-Review][HIGH][Security] Upgrade Firebase to 12.8.0+ to fix `undici` vulnerabilities (functions)
- [x] [ECC-Review][HIGH][Security] Upgrade Firebase SDK to 12.8.0+ in main project `package.json` *(Session 2)*
- [x] [ECC-Review][HIGH][Code] Replace non-null assertions with proper null checks in `GruposView.tsx:377,381,383,430`

**MEDIUM Priority (Should fix):**
- [ ] [ECC-Review][MEDIUM][Code] Extract dialog state to `useGroupDialogs()` hook to consolidate 15 useState calls → **Deferred to TD-7d-1**
- [ ] [ECC-Review][MEDIUM][Code] Extract shared hooks: `useBodyScrollLock`, `useEscapeKey` (duplicated in 4 dialogs) → **Deferred to TD-7d-2**
- [x] [ECC-Review][MEDIUM][Arch] Add focus trap to MemberSelectorDialog for WCAG 2.1 AA parity
- [x] [ECC-Review][MEDIUM][Test] Create dedicated test file for OwnerLeaveWarningDialog.tsx
- [x] [ECC-Review][MEDIUM][Arch] Add focus trap to TransferOwnershipDialog for WCAG 2.1 AA parity *(Session 2)*
- [x] [ECC-Review][MEDIUM][Arch] Add focus trap to OwnerLeaveWarningDialog for WCAG 2.1 AA parity *(Session 2)*

**LOW Priority (Nice to have):**
- [ ] [ECC-Review][LOW][Code] Centralize z-index values in constants file → **Deferred to TD-7d-3**
- [x] [ECC-Review][LOW][Code] Update epic references from "14c" to "14d-v2" in dialog doc comments *(Session 2: all files)*
- [x] [ECC-Review][LOW][Code] Add fallback to `getInitials()` for empty names in MemberSelectorDialog

**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel execution)

### Review Fixes Session (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC dev-story workflow

**Fixes Applied:**

1. **[HIGH] Firestore Security Rule** - Changed `firestore.rules:62` from permissive auth-only check to proper membership check: `allow read: if request.auth != null && request.auth.uid in resource.data.members`

2. **[HIGH] Firebase Version** - Updated `functions/package.json` from `firebase-admin: ^12.0.0` to `^12.8.0` to address undici vulnerabilities

3. **[HIGH] Non-null Assertions** - Replaced `selectedGroupForAction.id!` with proper null checks in `GruposView.tsx` handlers:
   - `handleConfirmLeave`: Added `const groupId = selectedGroupForAction?.id` with early return
   - `handleConfirmTransfer`: Same pattern applied

4. **[MEDIUM] Focus Trap** - Added WCAG 2.1 AA compliant focus trap to `MemberSelectorDialog.tsx` using Tab/Shift+Tab cycling

5. **[MEDIUM] Test File** - Created `tests/unit/components/SharedGroups/OwnerLeaveWarningDialog.test.tsx` with 27 tests covering:
   - Rendering states (open/closed, with/without icon)
   - User interactions (manage members, delete, close)
   - Keyboard accessibility (Escape key)
   - ARIA attributes
   - Body scroll lock
   - Translation support

6. **[LOW] Epic References** - Updated `OwnerLeaveWarningDialog.tsx` doc comment from "Epic 14c" to "Story 14d-v2-1-7d / Epic 14d-v2"

7. **[LOW] getInitials() Fallback** - Fixed empty name handling in `MemberSelectorDialog.tsx`:
   - Added `if (!name || name.trim() === '') return '?'`
   - Added filter for empty parts: `.filter((part) => part.length > 0)`
   - Added final fallback: `|| '?'`

**Deferred Items (Future Stories):**
- Extract dialog state to `useGroupDialogs()` hook (code organization, not critical)
- Extract shared hooks `useBodyScrollLock`, `useEscapeKey` (code reuse opportunity)
- Centralize z-index values (nice to have)

### Review Fixes Session 2 (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC ecc-code-review workflow (4 parallel agents)

**Fixes Applied:**

1. **[HIGH] Firebase SDK Upgrade** - Updated main project `package.json` from `firebase: ^10.14.1` to `^12.8.0` to fix undici and fast-xml-parser vulnerabilities

2. **[MEDIUM] Epic References** - Updated doc comments from "Epic 14c" to "Epic 14d-v2" in:
   - `LeaveGroupDialog.tsx`
   - `TransferOwnershipDialog.tsx`
   - `index.ts` (barrel exports)

3. **[MEDIUM] Focus Trap** - Added WCAG 2.1 AA compliant focus trap to:
   - `TransferOwnershipDialog.tsx` (lines 85-111)
   - `OwnerLeaveWarningDialog.tsx` (lines 90-116)

4. **[MEDIUM] npm audit fix** - Ran npm audit fix to address lodash prototype pollution vulnerability

**Updated Review Score:** 8.25/10 | **Recommendation:** APPROVE

**Test Results (Session 2):**
- Type-check: ✅ Pass
- Unit tests: ✅ 7,166 tests passing
- TransferOwnershipDialog.test.tsx: ✅ 47/47 tests pass
- OwnerLeaveWarningDialog.test.tsx: ✅ 27/27 tests pass

### ECC Code Review Session 3 (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC ecc-code-review workflow (4 parallel agents)
**Review Score:** 7.75/10 | **Recommendation:** CHANGES REQUESTED

**HIGH Priority (Must fix):**
- [x] [ECC-Review][HIGH][Code] Export missing Props types in `index.ts`: `TransferOwnershipDialogProps`, `OwnerLeaveWarningDialogProps` *(Session 4)*
- [x] [ECC-Review][HIGH][Code] Add null check for `user` before rendering MemberSelectorDialog with `currentUserId` in `GruposView.tsx` *(Session 4)*
- [x] [ECC-Review][HIGH][Security] Verify firebase-admin 12.8.0+ applied (fast-xml-parser DoS vulnerability) - Already done in Session 2

**MEDIUM Priority (Should fix):**
- [x] [ECC-Review][MEDIUM][Code] Add `type="button"` to OwnerLeaveWarningDialog close button *(Session 4)*
- [x] [ECC-Review][MEDIUM][Code] Add `aria-describedby` to TransferOwnershipDialog for accessibility *(Session 4)*
- [ ] [ECC-Review][MEDIUM][Arch] Create `useLeaveGroup`/`useTransferOwnership` hooks to eliminate direct `getFirestore()` calls → **Defer to TD-7d-4**
- [x] [ECC-Review][MEDIUM][Code] Replace hardcoded hex colors with CSS custom properties *(Session 4)*
- [x] [ECC-Review][MEDIUM][Security] Add photoURL domain validation before rendering (defense-in-depth) *(Session 4)*

**LOW Priority (Nice to have):**
- [x] [ECC-Review][LOW][Code] Use underscore prefix `_mode` instead of eslint-disable comment for unused params *(Session 4)*
- [ ] [ECC-Review][LOW][Arch] Extract dialog hooks into `useDialogAccessibility` composite hook → **Defer to TD-7d-2**
- [ ] [ECC-Review][LOW][Arch] Add loading state to MemberSelectorDialog confirm button → **Defer to TD-7d-6**
- [x] [ECC-Review][LOW][Code] Add TODO ticket references for deferred items *(Session 4)*

**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel execution)

**Test Review Summary (TDD Guide):**
- Total Tests: 221 passing (story-related)
- ACs Tested: 5/5 (100%)
- Coverage: 85-90% estimated
- Test Quality: GOOD
- TDD Compliance: COMPLIANT
- Recommendation: APPROVE ✅

### Tech Debt Backlog (Future Stories)

The following items are tracked for future refactoring sprints:

| ID | Priority | Category | Description | Impact |
|----|----------|----------|-------------|--------|
| ID | Priority | Category | Description | Impact | Status |
|----|----------|----------|-------------|--------|--------|
| TD-7d-1 | LOW | Arch | Extract `useGroupDialogs()` hook from GruposView (841 lines, 15+ useState calls) | Code organization | ✅ DONE (Session 6) |
| TD-7d-2 | LOW | Arch | Extract shared hooks: `useBodyScrollLock`, `useEscapeKey`, `useFocusTrap` (duplicated in 4+ dialogs) | Code reuse | ✅ DONE (already existed) |
| TD-7d-3 | LOW | Code | Centralize z-index values in constants file (13+ files use `z-[9999]`) | Maintainability | ✅ DONE (already existed) |
| TD-7d-4 | LOW | Arch | Refactor direct Firestore import in GruposView to use services pattern | Architecture compliance | ✅ DONE (Session 6) |
| TD-7d-5 | LOW | Feature | Implement hard leave mode when Cloud Function is ready (Story 14d-v2-1-7c) | Feature completeness | Deferred |
| TD-7d-6 | LOW | UX | Add loading state to MemberSelectorDialog confirm button | User feedback | Deferred |
| TD-7d-7 | LOW | Code | Add setTimeout cleanup in useEffect hooks (LeaveGroupDialog, TransferOwnershipDialog, OwnerLeaveWarningDialog, MemberSelectorDialog) | Memory leak prevention | ✅ DONE (Session 6) |

**Test Results:**
- Type-check: ✅ Pass
- OwnerLeaveWarningDialog.test.tsx: ✅ 27/27 tests pass
- MemberSelectorDialog.test.tsx: ✅ 35/35 tests pass
- GruposView.test.tsx: ✅ 62/62 tests pass
- firestore-rules.test.ts: ✅ 45/45 tests pass

### ECC Review Session 4 - Fixes (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC ecc-dev-story workflow
**Purpose:** Address Session 3 review notes

**Fixes Applied:**

1. **[HIGH] Export missing Props types** - Added `TransferOwnershipDialogProps` and `OwnerLeaveWarningDialogProps` exports to `index.ts`

2. **[HIGH] User null check** - Added proper `user &&` guard before rendering MemberSelectorDialog, changed from `user?.uid || ''` to `user.uid`

3. **[MEDIUM] type="button"** - Added `type="button"` to OwnerLeaveWarningDialog close button

4. **[MEDIUM] aria-describedby** - Added `aria-describedby="transfer-ownership-description"` to TransferOwnershipDialog and added `id` to description paragraph

5. **[MEDIUM] CSS custom properties** - Replaced hardcoded colors with CSS variables + fallbacks:
   - `#3b82f6` → `var(--info, #3b82f6)`
   - `#ef4444` → `var(--error, #ef4444)`
   - `#f59e0b` → `var(--warning, #f59e0b)`

6. **[MEDIUM] photoURL domain validation** - Added defense-in-depth validation in MemberSelectorDialog:
   - Created `ALLOWED_PHOTO_DOMAINS` constant with trusted domains
   - Created `isValidPhotoUrl()` helper function
   - Applied validation before rendering `<img>` tag
   - Added `referrerPolicy="no-referrer"` for privacy

7. **[LOW] _mode prefix** - Changed `mode: LeaveMode` to `_mode: LeaveMode` and removed eslint-disable comment

8. **[LOW] TODO references** - Added TD-7d-5 (hard leave mode) and TD-7d-6 (loading state) to Tech Debt Backlog

**Deferred Items (Tech Debt):**
- TD-7d-4: Create useLeaveGroup/useTransferOwnership hooks
- TD-7d-2: Extract dialog hooks into useDialogAccessibility
- TD-7d-6: Add loading state to MemberSelectorDialog

**Updated Review Score:** 8.5/10 | **Recommendation:** APPROVE

### ECC Review Session 5 - Parallel Review (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC ecc-code-review workflow (4 parallel agents)
**Purpose:** Final comprehensive review with parallel ECC agents

**ECC Agents Used (Parallel):**
- code-reviewer: Quality, maintainability
- security-reviewer: OWASP, vulnerabilities
- architect: Patterns, design
- tdd-guide: Test coverage

**Overall Score:** 7.75/10 → 8.5/10 (after fixes)

**Fixes Applied:**

1. **[HIGH][Code] CSS Custom Properties** - Replaced hardcoded hex colors with CSS variables + fallbacks:
   - `#10b981` → `var(--success, #10b981)`
   - `#ef4444` → `var(--error, #ef4444)`
   - `#f59e0b` → `var(--warning, #f59e0b)`
   - `rgba(...)` → `var(--success-bg, ...)`, `var(--error-bg, ...)`, `var(--error-border, ...)`
   - Files: LeaveGroupDialog.tsx, OwnerLeaveWarningDialog.tsx

2. **[HIGH][Code] aria-hidden Attributes** - Added `aria-hidden="true"` to all decorative icons:
   - LeaveGroupDialog: FileText, ShieldOff
   - TransferOwnershipDialog: X, ArrowRightLeft, Loader2
   - MemberSelectorDialog: X, Crown, Users
   - OwnerLeaveWarningDialog: X

3. **[HIGH][Security] Dependency Vulnerability** - Added fast-xml-parser override to root package.json:
   ```json
   "overrides": { "fast-xml-parser": "^5.3.4" }
   ```

**Deferred Items (Tech Debt):**
- TD-7d-7: Add setTimeout cleanup in useEffect hooks (memory leak prevention)

**Test Results:**
- Type-check: ✅ Pass
- Unit tests: ✅ 160/160 tests pass (dialog components)

**Final Score:** 8.5/10 | **Recommendation:** APPROVE ✅

### ECC Review Session 6 - Tech Debt Refactoring (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC ecc-dev-story workflow
**Purpose:** Address tech debt items TD-7d-1, TD-7d-2, TD-7d-4, TD-7d-7

**ECC Agents Used:**
- Planner: Implementation planning (4-phase approach)
- TDD Guide: Test-first development (3 sessions)
- Code Reviewer: Quality review (parallel)
- Security Reviewer: Security analysis (parallel)

**Phases Completed:**

**Phase 1: TD-7d-7 - setTimeout Cleanup**
- Added `focusTimeoutRef` and proper cleanup to 4 dialog components
- Files: LeaveGroupDialog, TransferOwnershipDialog, MemberSelectorDialog, OwnerLeaveWarningDialog
- Tests: 4 new cleanup tests added

**Phase 2: TD-7d-4 - useLeaveTransferFlow Hook**
- Created `src/features/shared-groups/services/invitationHandlers.ts` - Service functions for accept/decline
- Created `src/features/shared-groups/hooks/useLeaveTransferFlow.ts` - Hook for leave/transfer/invitation flows
- Updated exports in services/index.ts, hooks/index.ts, and main index.ts
- Tests: 35 new tests (22 for hook, 13 for services)

**Phase 3: TD-7d-1 - useGroupDialogs Integration**
- Integrated existing `useGroupDialogs()` hook into GruposView
- Removed 15+ individual useState calls
- Integrated `useLeaveTransferFlow` hook
- Removed direct `getFirestore()` import
- Updated test mocks for new hook pattern

**Additional Discovery:**
- TD-7d-2 and TD-7d-3 were already completed (shared hooks and Z_INDEX constants already exist)

**Review Findings Applied:**
- [HIGH] Added missing `!user` check in `handleDeclineInvitation` for consistency
- Updated dependency array to include `user`

**Test Results:**
- Type-check: ✅ Pass
- useLeaveTransferFlow.test.ts: ✅ 22/22 tests pass
- invitationHandlers.test.ts: ✅ 13/13 tests pass
- GruposView.test.tsx: ✅ 62/62 tests pass
- All SharedGroups tests: ✅ 544/544 tests pass

**Review Score:** 8.0/10 | **Recommendation:** APPROVED

**New Files Created:**
- `src/features/shared-groups/services/invitationHandlers.ts`
- `src/features/shared-groups/hooks/useLeaveTransferFlow.ts`
- `tests/unit/features/shared-groups/hooks/useLeaveTransferFlow.test.ts`
- `tests/unit/features/shared-groups/services/invitationHandlers.test.ts`

### File List

**New Files:**
- `src/components/SharedGroups/MemberSelectorDialog.tsx` - Member selection for ownership transfer
- `tests/unit/components/SharedGroups/MemberSelectorDialog.test.tsx` - 35 tests
- `tests/unit/components/SharedGroups/LeaveGroupDialog.test.tsx` - 50 tests
- `tests/unit/components/SharedGroups/TransferOwnershipDialog.test.tsx` - 47 tests
- `tests/unit/components/SharedGroups/OwnerLeaveWarningDialog.test.tsx` - 27 tests (ECC Review)
- `src/features/shared-groups/services/invitationHandlers.ts` - Service functions for accept/decline (Session 6)
- `src/features/shared-groups/hooks/useLeaveTransferFlow.ts` - Leave/transfer flow hook (Session 6)
- `tests/unit/features/shared-groups/hooks/useLeaveTransferFlow.test.ts` - 22 tests (Session 6)
- `tests/unit/features/shared-groups/services/invitationHandlers.test.ts` - 13 tests (Session 6)

**Modified Files:**
- `src/components/settings/subviews/GruposView.tsx` - Leave/Transfer integration + null check fixes + CSS vars + _mode prefix (ECC Review Session 4)
- `tests/unit/components/settings/subviews/GruposView.test.tsx` - +25 tests
- `src/utils/translations.ts` - +11 EN/ES keys
- `src/components/SharedGroups/index.ts` - Export MemberSelectorDialog + Props types exports (ECC Review Session 2, 4)
- `src/components/SharedGroups/OwnerLeaveWarningDialog.tsx` - Epic reference + focus trap + type="button" + CSS vars + aria-hidden (ECC Review Session 2, 4, 5)
- `src/components/SharedGroups/LeaveGroupDialog.tsx` - Epic reference + CSS vars + aria-hidden (ECC Review Session 2, 5)
- `src/components/SharedGroups/TransferOwnershipDialog.tsx` - Epic reference + focus trap + aria-describedby + aria-hidden (ECC Review Session 2, 4, 5)
- `src/components/SharedGroups/MemberSelectorDialog.tsx` - Focus trap + getInitials fallback + photoURL validation + aria-hidden (ECC Review Session 3, 4, 5)
- `firestore.rules` - Membership check for sharedGroups read rule (ECC Review)
- `functions/package.json` - Firebase-admin upgrade to 12.8.0 (ECC Review)
- `package.json` - Firebase SDK upgrade to 12.8.0 + fast-xml-parser override (ECC Review Session 2, 5)
- `tests/unit/components/SharedGroups/LeaveGroupDialog.test.tsx` - Updated test for CSS variables (ECC Review Session 5), setTimeout cleanup test (Session 6)
- `tests/unit/components/SharedGroups/TransferOwnershipDialog.test.tsx` - setTimeout cleanup test (Session 6)
- `tests/unit/components/SharedGroups/MemberSelectorDialog.test.tsx` - setTimeout cleanup test (Session 6)
- `tests/unit/components/SharedGroups/OwnerLeaveWarningDialog.test.tsx` - setTimeout cleanup test (Session 6)
- `src/features/shared-groups/services/index.ts` - Export invitationHandlers (Session 6)
- `src/features/shared-groups/hooks/index.ts` - Export useLeaveTransferFlow (Session 6)
- `src/features/shared-groups/index.ts` - Re-export new hook (Session 6)
- `docs/sprint-artifacts/sprint-status.yaml` - Status updated
