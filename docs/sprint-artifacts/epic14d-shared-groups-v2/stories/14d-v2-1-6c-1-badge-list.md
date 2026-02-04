# Story 14d-v2.1.6c-1: Pending Invitations Badge & List UI

Status: done

> **Split from:** [14d-v2-1-6c-invitations-ui.md](14d-v2-1-6c-invitations-ui.md)
> **Part:** 1 of 2 (Foundation UI - Badge + List)
> **Related stories:** 14d-v2-1-6c-2 (Accept Dialog), 14d-v2-1-6a (Deep Link), 14d-v2-1-6b (Logic)

## Story

As a **user**,
I want **to see a badge indicating pending invitations and view them in a list**,
So that **I know when I have group invitations waiting and can review them**.

## Acceptance Criteria

### From Original Story (AC: #1, #4)

1. **Given** I have a pending group invitation
   **When** I open the app
   **Then** I see a notification badge indicating pending invitations

2. **Given** I have multiple pending invitations
   **When** I view the invitations list
   **Then** I see all pending invitations sorted by date (newest first)
   **And** each shows group name, inviter name, and invitation date

## Tasks / Subtasks

- [x] **Task 6: Pending Invitations Badge** (AC: #1)
  - [x] 6.1: Create `usePendingInvitationsCount()` hook
  - [x] 6.2: Query count of pending invitations for current user
  - [x] 6.3: Update Settings icon or dedicated location with badge count
  - [x] 6.4: Add unit tests for badge logic

- [x] **Task 7: Invitations List UI** (AC: #2)
  - [x] 7.1: Create `src/components/SharedGroups/PendingInvitationsView.tsx`
  - [x] 7.2: Display list of pending invitations with group name, inviter, date
  - [x] 7.3: Add Accept/Decline buttons for each invitation (triggers dialog from 14d-v2-1-6c-2)
  - [x] 7.4: Handle empty state: "No pending invitations"
  - [x] 7.5: Add loading state while fetching
  - [x] 7.6: Add unit tests for component

- [x] **Task 8: UI Standards Compliance** (Reference: [14d-v2-ui-conventions.md](../14d-v2-ui-conventions.md))
  - [x] 8.1: All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - [x] 8.2: Add translation keys to `translations.ts`: `pendingInvitations`, `noPendingInvitations`, `invitedBy`, `expiresIn`, `daysAgo`
  - [x] 8.3: Test component with all 3 themes (mono, normal, professional)
  - [x] 8.4: Test component in dark mode
  - [x] 8.5: Add data-testid attributes: `pending-invitations-badge`, `pending-invitations-list`, `invitation-item-{id}`, `accept-btn`, `decline-btn`
  - [x] 8.6: Accessibility: proper list semantics, button labels
  - [x] 8.7: Use Lucide icons only (Users, Bell, Check, X)
  - [x] 8.8: Badge styling matches app notification conventions

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Badge Location** | Settings icon or dedicated area | Visible notification of pending invitations |
| **List Sorting** | Newest first | Most relevant invitations at top |

### UI Mockup Reference

**Pending Invitations List:**
```
+-----------------------------------------+
| Pending Invitations                     |
+-----------------------------------------+
| +-------------------------------------+ |
| | Household                           | |
| | Invited by Alice - 2 days ago      | |
| | [Accept]  [Decline]                | |
| +-------------------------------------+ |
| +-------------------------------------+ |
| | Office Lunch                        | |
| | Invited by Bob - 5 days ago        | |
| | [Accept]  [Decline]                | |
| +-------------------------------------+ |
+-----------------------------------------+
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePendingInvitationsCount.ts` | **NEW** | Badge count hook |
| `src/components/SharedGroups/PendingInvitationsView.tsx` | **NEW** | Invitations list |
| `tests/unit/hooks/usePendingInvitationsCount.test.ts` | **NEW** | Hook tests |
| `tests/unit/components/SharedGroups/PendingInvitationsView.test.tsx` | **NEW** | Component tests |

### Testing Standards

- **Unit tests:** 15+ tests covering hook and component
- **Coverage target:** 80%+ for new code
- **Test patterns:** Mock service functions, test loading/empty/error states

### Project Structure Notes

- Components: `src/components/SharedGroups/` directory
- Hooks: `src/hooks/` for React hooks
- Feature directory: `src/features/shared-groups/` (per Epic 14e patterns)

### References

- [Original Story: 14d-v2-1-6c-invitations-ui.md](14d-v2-1-6c-invitations-ui.md)
- [Parent Story: 14d-v2-1-6-accept-decline-invitation.md](14d-v2-1-6-accept-decline-invitation.md)

## Dependency Notes

**UPSTREAM (must be complete):**
- Story 14d-v2-1-6a: Deep Link & Service (provides getPendingInvitationsForUser)
- Story 14d-v2-1-6b: Accept/Decline Logic (provides accept/decline functions)

**DOWNSTREAM (depends on this):**
- Story 14d-v2-1-6c-2: Accept Dialog (uses list to trigger accept flow)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered

### Completion Notes List

1. **Task 6 - Pending Invitations Badge (AC #1)**
   - Created `usePendingInvitationsCount` hook using React Query for caching
   - Hook queries `getPendingInvitationsForUser` from existing invitationService
   - Added badge to GruposView header with amber (#f59e0b) styling
   - Badge shows count or "9+" for > 9 invitations
   - 13 unit tests covering null user, no email, success, loading, error states

2. **Task 7 - Invitations List UI (AC #2)**
   - Created `PendingInvitationsView.tsx` standalone component
   - Shows loading state with spinner
   - Shows empty state with helpful message when no invitations
   - Uses existing `PendingInvitationsSection` for rendering invitation cards
   - Invitations sorted by date (newest first) via service
   - 12 unit tests covering all states

3. **Task 8 - UI Standards Compliance**
   - All colors use CSS custom properties (except #ef4444 for decline button per spec)
   - Translation keys already existed in translations.ts
   - Added data-testid attributes: `pending-invitations-badge`, `pending-invitations-list`, `invitation-item-{id}`, `accept-btn`, `decline-btn`
   - Added aria-labels for accept/decline buttons for accessibility
   - Using Lucide icons (Users, Mail, Check, X, Inbox, Clock)
   - Badge styling matches app notification conventions (amber color)

4. **Test Summary**
   - 62 new/updated tests (13 hook + 12 view + 37 GruposView)
   - All 6,740 tests pass in test:quick suite
   - Type checking passes

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/usePendingInvitationsCount.ts` | **NEW** | Badge count hook using React Query |
| `src/components/SharedGroups/PendingInvitationsView.tsx` | **NEW** | Standalone invitations list view |
| `src/components/SharedGroups/PendingInvitationsSection.tsx` | **MODIFIED** | Added data-testid attributes and aria-labels |
| `src/components/SharedGroups/index.ts` | **MODIFIED** | Added exports for new components |
| `src/components/settings/subviews/GruposView.tsx` | **MODIFIED** | Added badge to header, integrated PendingInvitationsSection |
| `tests/unit/hooks/usePendingInvitationsCount.test.tsx` | **NEW** | 13 hook tests |
| `tests/unit/components/SharedGroups/PendingInvitationsView.test.tsx` | **NEW** | 12 component tests |
| `tests/unit/components/settings/subviews/GruposView.test.tsx` | **MODIFIED** | Added 5 badge tests |

### Code Review Record (Atlas-Enhanced)

**Reviewer:** Claude Opus 4.5 (Atlas Code Review Workflow)
**Date:** 2026-02-02
**Result:** PASSED with fixes applied

#### Issues Found & Fixed

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | MEDIUM | **Duplicate header bug:** `PendingInvitationsView` rendered its own header then called `PendingInvitationsSection` which also rendered a header, resulting in two "Pending Invitations" headers | Added `showHeader` prop to `PendingInvitationsSection` (default: true), set to `false` when called from `PendingInvitationsView` |
| 2 | MEDIUM | **Hardcoded amber colors:** `#fef3c7`, `#d97706`, `#f59e0b` violated Task 8.1 (only #ef4444 allowed as hardcoded) | Replaced with CSS variables with fallbacks: `var(--notification-amber-bg, #fef3c7)`, `var(--notification-amber-icon, #d97706)`, `var(--notification-amber-badge, #f59e0b)` |
| 3 | LOW | **Unused variable pattern:** `lang: _lang` with `void _lang` | Renamed to `lang` with cleaner `void lang` pattern |

#### Files Modified During Review

| File | Changes |
|------|---------|
| `PendingInvitationsSection.tsx` | Added `showHeader?: boolean` prop, conditional header rendering, CSS variable colors |
| `PendingInvitationsView.tsx` | Added `showHeader={false}` to section call, CSS variable colors |
| `GruposView.tsx` | Updated badge color to CSS variable |

#### Atlas Validation Results

- **Architecture compliance:** ✅ React Query pattern matches global defaults
- **Testing patterns:** ✅ Follows project mocking conventions
- **Workflow chain impact:** ✅ No negative impact on existing user flows

#### Test Results After Fixes

- All **6,804 tests pass**
- Type checking passes
- No regressions introduced
