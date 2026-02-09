# Story: TD-CONSOLIDATED-13: Dialog Focus Management

## Status: ready-for-dev
## Epic: Epic 14d-v2 Shared Groups (Tech Debt - Tier 5)

> **Consolidated from:** TD-14d-17, TD-14d-18
> **Priority:** LOW (nice to have)
> **Estimated Effort:** 3-4 hours
> **Story Points:** 3 (MEDIUM)
> **Risk:** LOW
> **Dependencies:** None

## Overview

As a **developer**,
I want **consistent focus management across all dialog components**,
So that **accessibility is maintained, timeout leaks are prevented, and focus traps work correctly**.

### Problem Statement

Dialog components across the codebase use 4 different focus management patterns, creating inconsistency and potential memory leaks:

| Pattern | Dialogs Using It | Issue |
|---------|-----------------|-------|
| **setTimeout + ref + cleanup** | TransferOwnershipDialog, DeleteGroupDialog, MemberSelectorDialog, OwnerLeaveWarningDialog, RemoveMemberDialog | Best pattern - has proper cleanup |
| **setTimeout without cleanup** | EditGroupDialog, AcceptInvitationDialog, CreateGroupDialog, TransactionSharingOptInDialog | **Memory leak** - setTimeout not tracked for cleanup |
| **Direct focus (no setTimeout)** | RecoverySyncPrompt, LeaveGroupDialog, JoinGroupDialog | May fail during animation transitions |
| **No focus management** | InviteMembersDialog, InviteMembersPrompt | Missing initial focus entirely |

Additionally, RecoverySyncPrompt lacks error state + focus management test coverage (original TD-14d-17).

### Approach

Create a shared `useDialogFocus` hook in `src/shared/hooks/` (alongside existing `useFocusTrap.ts`) that encapsulates the correct focus pattern: save previous focus on open, set initial focus via setTimeout with cleanup ref, restore previous focus on close. Migrate shared-groups dialogs to use it, then add RecoverySyncPrompt test coverage.

## Functional Acceptance Criteria

- [ ] AC-1: Shared `useDialogFocus` hook saves the previously-focused element on open and restores it on close
- [ ] AC-2: Hook uses `setTimeout(..., 0)` for initial focus with tracked ref and cleanup on unmount
- [ ] AC-3: All 7 priority shared-groups dialogs use `useDialogFocus` instead of inline focus logic
- [ ] AC-4: RecoverySyncPrompt has test coverage for error state rendering and focus management
- [ ] AC-5: No regressions in existing dialog accessibility behavior
- [ ] AC-6: All existing tests pass (`npm run test:story`)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] AC-ARCH-LOC-1: `useDialogFocus` hook at `src/shared/hooks/useDialogFocus.ts` alongside existing `useFocusTrap.ts` and `useEscapeKey.ts`
- [ ] AC-ARCH-LOC-2: Re-export from `src/shared/hooks/index.ts` barrel file
- [ ] AC-ARCH-LOC-3: Hook unit tests at `tests/unit/shared/hooks/useDialogFocus.test.ts`
- [ ] AC-ARCH-LOC-4: RecoverySyncPrompt tests at existing `tests/unit/features/shared-groups/components/RecoverySyncPrompt.test.tsx` (extend, don't create new file)

### Pattern Requirements

- [ ] AC-ARCH-PATTERN-1: Hook signature: `useDialogFocus(isOpen: boolean, targetRef: RefObject<HTMLElement | null>)` — isOpen boolean triggers save/restore, targetRef receives initial focus
- [ ] AC-ARCH-PATTERN-2: Uses `useRef<ReturnType<typeof setTimeout> | null>(null)` for timeout tracking (same pattern as existing `focusTimeoutRef` in TransferOwnershipDialog)
- [ ] AC-ARCH-PATTERN-3: Cleanup effect clears timeout and restores previous focus: `clearTimeout(ref.current); previousElement?.focus()`
- [ ] AC-ARCH-PATTERN-4: Previous focus saved via `document.activeElement as HTMLElement | null` at the moment `isOpen` transitions to `true`
- [ ] AC-ARCH-PATTERN-5: Hook is composable with existing `useFocusTrap` and `useEscapeKey` — they handle different concerns (initial focus vs. tab wrapping vs. escape dismiss)
- [ ] AC-ARCH-PATTERN-6: Test uses `vi.useFakeTimers()` and `vi.advanceTimersByTime(0)` for setTimeout assertions

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] AC-ARCH-NO-1: Hook must NOT import or couple to any specific dialog component — it's a generic utility
- [ ] AC-ARCH-NO-2: Must NOT use `autoFocus` HTML attribute — it fires before React refs are attached
- [ ] AC-ARCH-NO-3: Must NOT merge `useFocusTrap` and `useDialogFocus` into one hook — they're separate WCAG concerns (2.4.3 Focus Order vs. initial focus placement)
- [ ] AC-ARCH-NO-4: Must NOT remove existing inline `useFocusTrap` usage from dialogs — only replace the setTimeout focus logic
- [ ] AC-ARCH-NO-5: Must NOT change dialog open/close APIs or props — hook is internal implementation detail

## File Specification

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| useDialogFocus hook | `src/shared/hooks/useDialogFocus.ts` | Shared hook | AC-1, AC-2, AC-ARCH-LOC-1, AC-ARCH-PATTERN-1/2/3/4 |
| Barrel export | `src/shared/hooks/index.ts` | Re-export | AC-ARCH-LOC-2 |
| Hook tests | `tests/unit/shared/hooks/useDialogFocus.test.ts` | Unit test | AC-ARCH-LOC-3, AC-ARCH-PATTERN-6 |
| EditGroupDialog | `src/features/shared-groups/components/EditGroupDialog.tsx` | Migration | AC-3 |
| AcceptInvitationDialog | `src/features/shared-groups/components/AcceptInvitationDialog.tsx` | Migration | AC-3 |
| CreateGroupDialog | `src/features/shared-groups/components/CreateGroupDialog.tsx` | Migration | AC-3 |
| TransactionSharingOptInDialog | `src/features/shared-groups/components/TransactionSharingOptInDialog.tsx` | Migration | AC-3 |
| LeaveGroupDialog | `src/features/shared-groups/components/LeaveGroupDialog.tsx` | Migration | AC-3 |
| JoinGroupDialog | `src/features/shared-groups/components/JoinGroupDialog.tsx` | Migration | AC-3 |
| RecoverySyncPrompt | `src/features/shared-groups/components/RecoverySyncPrompt.tsx` | Migration + test | AC-3, AC-4 |
| RecoverySyncPrompt tests | `tests/unit/features/shared-groups/components/RecoverySyncPrompt.test.tsx` | Test extension | AC-4, AC-ARCH-LOC-4 |

## Tasks / Subtasks

### Task 1: Create `useDialogFocus` Hook

**Files:** `src/shared/hooks/useDialogFocus.ts`, `src/shared/hooks/index.ts`, `tests/unit/shared/hooks/useDialogFocus.test.ts`

- [ ] 1.1 Write unit tests first (TDD): test save/restore focus, setTimeout cleanup on unmount, no-op when isOpen=false, re-focus on targetRef change
- [ ] 1.2 Implement `useDialogFocus` hook with `useEffect` watching `isOpen`:
  - On `isOpen=true`: save `document.activeElement`, `setTimeout(() => targetRef.current?.focus(), 0)` with tracked ref
  - On `isOpen=false` or unmount: `clearTimeout`, restore previous element focus
- [ ] 1.3 Add re-export to `src/shared/hooks/index.ts` barrel
- [ ] 1.4 Run `npx vitest run tests/unit/shared/hooks/useDialogFocus.test.ts` to verify tests pass

### Task 2: Migrate Priority Dialogs

**Files:** 7 dialog components (see File Specification)

- [ ] 2.1 Migrate EditGroupDialog: replace inline `setTimeout(() => closeButtonRef.current?.focus(), 0)` with `useDialogFocus(isOpen, closeButtonRef)`
- [ ] 2.2 Migrate AcceptInvitationDialog: same pattern replacement
- [ ] 2.3 Migrate CreateGroupDialog: same pattern replacement
- [ ] 2.4 Migrate TransactionSharingOptInDialog: same pattern replacement
- [ ] 2.5 Migrate LeaveGroupDialog: replace direct `closeButtonRef.current?.focus()` with hook
- [ ] 2.6 Migrate JoinGroupDialog: replace direct focus + ensure timeout cleanup added
- [ ] 2.7 Migrate RecoverySyncPrompt: replace `closeTimeoutRef` + direct focus with hook
- [ ] 2.8 Run `npm run test:quick` to verify no regressions after each migration

### Task 3: RecoverySyncPrompt Test Coverage + Final Verification

**Files:** `tests/unit/features/shared-groups/components/RecoverySyncPrompt.test.tsx`

- [ ] 3.1 Add test: error state renders correctly (error message visible, retry button present)
- [ ] 3.2 Add test: focus moves to close button when prompt opens
- [ ] 3.3 Add test: focus restores to previous element when prompt closes
- [ ] 3.4 Run `npm run test:story` to verify all tests pass

## Dev Notes

### Architecture Guidance

**Hook contract:**
```typescript
export function useDialogFocus(
  isOpen: boolean,
  targetRef: RefObject<HTMLElement | null>
): void;
```

The hook is intentionally minimal — it handles ONLY initial focus placement and restoration. Tab wrapping is handled by the existing `useFocusTrap` hook, and escape-to-close by `useEscapeKey`. These three hooks compose independently:

```tsx
function MyDialog({ isOpen, onClose }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useDialogFocus(isOpen, closeButtonRef);     // Initial focus + restore
  useFocusTrap(containerRef, isOpen);          // Tab wrapping
  useEscapeKey(onClose, isOpen);               // Escape dismiss

  return <div ref={containerRef}>...</div>;
}
```

**Migration pattern per dialog:**
Remove the inline `setTimeout` + `focusTimeoutRef` + cleanup logic, add `useDialogFocus(isOpen, closeButtonRef)` import. The `closeButtonRef` (or `inputRef` for input-focused dialogs) already exists in each component.

**Deferred dialogs (not in scope):**
The following dialogs already use the correct `focusTimeoutRef + cleanup` pattern and don't need migration:
- TransferOwnershipDialog, DeleteGroupDialog, MemberSelectorDialog, OwnerLeaveWarningDialog, RemoveMemberDialog

These CAN be migrated to `useDialogFocus` in a follow-up for DRY, but they're not leaking timeouts so they're lower priority.

**Non-shared-groups dialogs (out of scope):**
Dialogs in `src/components/dialogs/`, `src/components/settings/`, etc. are not part of Epic 14d-v2 scope. They can adopt `useDialogFocus` opportunistically when touched.

### Technical Notes

No specialized technical review required — straightforward React hook extraction.

### E2E Testing

E2E coverage not critical — focus management is tested via unit tests with JSDOM. Manual verification that dialogs open/close correctly is sufficient.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Low-Medium
- **Sizing:** MEDIUM (3 pts) — 3 tasks, 15 subtasks, 12 files
- **Agents consulted:** Planner, Architect

## Cross-References

- **Original stories:**
  - [TD-14d-17](TD-ARCHIVED/TD-14d-17-recovery-prompt-test-coverage.md) - RecoverySyncPrompt test coverage
  - [TD-14d-18](TD-ARCHIVED/TD-14d-18-dialog-focus-cleanup.md) - Dialog focus cleanup
- **Related hooks:** `src/shared/hooks/useFocusTrap.ts`, `src/shared/hooks/useEscapeKey.ts`
- **Sources:** ECC Parallel Review (2026-02-04) on story 14d-v2-1-9
- **Patterns:** `docs/architecture/component-patterns.md`
