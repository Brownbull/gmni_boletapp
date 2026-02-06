# Tech Debt Story TD-14d-18: Dialog Focus Management Cleanup

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-9
> **Priority:** LOW (code quality improvement, prevents memory leaks)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (isolated change, well-tested pattern)

## Story

As a **developer**,
I want **consistent focus management cleanup across all dialog components**,
So that **memory leaks from orphaned timeouts are prevented and accessibility behavior is consistent**.

## Problem Statement

The RecoverySyncPrompt component (Story 14d-v2-1-9) uses `setTimeout(..., 0)` for focus management in two places:

1. **Opening focus (lines 83-85):** Properly cleaned up via `focusTimeoutRef` in the effect cleanup.

2. **Closing focus restoration (lines 99-101):** NOT cleaned up - if component unmounts before timeout fires, it could cause a "setState on unmounted component" warning or attempt to focus a removed element.

```typescript
// Line 99-101 - Missing cleanup
const handleClose = useCallback(() => {
    if (isSyncing) return;
    onClose();
    setTimeout(() => {  // ← No ref, no cleanup
        (previousActiveElement.current as HTMLElement)?.focus?.();
    }, 0);
}, [onClose, isSyncing]);
```

This pattern should be reviewed across all dialog components for consistency:
- `CreateGroupDialog`
- `InviteMembersDialog`
- `AcceptInvitationDialog`
- `LeaveGroupDialog`
- `TransferOwnershipDialog`
- `DeleteGroupDialog`

## Acceptance Criteria

### AC1: RecoverySyncPrompt Focus Cleanup
Given the RecoverySyncPrompt dialog is closing,
When the component unmounts before the focus timeout fires,
Then the timeout is cleared and no focus attempt is made.

### AC2: Consistent Pattern Across Dialogs
Given any shared-groups dialog component,
When it uses setTimeout for focus management,
Then the timeout is tracked via a ref and cleaned up on unmount.

## Tasks / Subtasks

### Task 1: RecoverySyncPrompt Fix (AC: 1)

- [ ] 1.1 Add `closeFocusTimeoutRef` to track the closing focus timeout
- [ ] 1.2 Clear timeout in cleanup effect or on new close
- [ ] 1.3 Verify no React warnings on rapid open/close

### Task 2: Dialog Audit (AC: 2)

- [ ] 2.1 Audit `CreateGroupDialog` for focus timeout cleanup
- [ ] 2.2 Audit `InviteMembersDialog` for focus timeout cleanup
- [ ] 2.3 Audit `AcceptInvitationDialog` for focus timeout cleanup
- [ ] 2.4 Audit other dialog components
- [ ] 2.5 Apply consistent pattern where needed

### Task 3: Extract Shared Hook (Optional)

- [ ] 3.1 Consider extracting `useFocusRestoration` hook for consistency
- [ ] 3.2 Document pattern in UI conventions

## Dev Notes

### Suggested Fix

```typescript
const closeFocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleClose = useCallback(() => {
    if (isSyncing) return;
    onClose();
    closeFocusTimeoutRef.current = setTimeout(() => {
        (previousActiveElement.current as HTMLElement)?.focus?.();
    }, 0);
}, [onClose, isSyncing]);

// Add cleanup
useEffect(() => {
    return () => {
        if (closeFocusTimeoutRef.current) {
            clearTimeout(closeFocusTimeoutRef.current);
        }
    };
}, []);
```

### Tradeoff Analysis

| Factor | Do Now | Defer to TD Story |
|--------|--------|-------------------|
| **Merge conflict risk** | Low - isolated change | Low - isolated work |
| **Context window fit** | Could extend current story | Clean separation |
| **Sprint capacity** | Minor time investment | Scheduled for later |
| **Accumulation risk** | Fixed immediately | Minimal - defensive code |
| **Dependency risk** | Blocks nothing | May prevent future bugs |
| **Batch opportunity** | Single component | Can audit all dialogs together |

**Recommendation:** DEFER - Can be batched with dialog pattern consistency sweep across all shared-groups dialogs.

### Dependencies

- None - can be implemented independently
- Opportunity to batch with other dialog improvements

### References

- [14d-v2-1-9-firestore-ttl-offline.md](./14d-v2-1-9-firestore-ttl-offline.md) - Source of this tech debt item
- ECC Review item: L1 (LOW)
