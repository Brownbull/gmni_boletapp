# Tech Debt Story TD-14d-3: Extract GruposView Dialog Rendering

Status: ready-for-dev

> **Source:** ECC Code Review #4 (2026-02-03) on story 14d-v2-1-7e
> **Priority:** MEDIUM (file size exceeds 400-line guideline)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (straightforward extraction, no logic changes)

## Story

As a **developer**,
I want **the dialog rendering in GruposView.tsx to be extracted to a separate GruposViewDialogs.tsx file**,
So that **GruposView.tsx stays under the 400-line guideline and is easier to maintain**.

## Problem Statement

`GruposView.tsx` is currently 788 lines, significantly exceeding the 400-line guideline from the codebase conventions. Lines 654-782 contain dialog rendering JSX that can be cleanly extracted:

```typescript
// Current: GruposView.tsx (788 lines)
// Lines 654-782: Dialog rendering for 6 dialogs
{isCreateDialogOpen && <CreateGroupDialog ... />}
{isInviteDialogOpen && <InviteMembersDialog ... />}
{isAcceptDialogOpen && <AcceptInvitationDialog ... />}
{isLeaveDialogOpen && <LeaveGroupDialog ... />}
{isDeleteDialogOpen && <DeleteGroupDialog ... />}
{/* ... more dialogs */}
```

Extracting this to a separate component will:
- Reduce GruposView.tsx to ~660 lines (closer to guideline)
- Improve code organization and readability
- Make dialog management easier to test in isolation

## Acceptance Criteria

1. **Given** GruposView.tsx with 788 lines
   **When** dialog rendering is extracted
   **Then** GruposView.tsx should be under 700 lines

2. **Given** a new GruposViewDialogs.tsx component
   **When** it receives dialog props
   **Then** it should render all 6 dialogs with correct state

3. **Given** existing GruposView functionality
   **When** using the extracted dialogs component
   **Then** all dialog interactions should work identically

4. **Given** existing tests for GruposView
   **When** run after extraction
   **Then** all tests should pass unchanged

## Tasks / Subtasks

- [ ] **Task 1: Create GruposViewDialogs Component** (AC: #1, #2)
  - [ ] 1.1: Create `src/components/settings/subviews/GruposViewDialogs.tsx`
  - [ ] 1.2: Define props interface for dialog state and handlers
  - [ ] 1.3: Move dialog rendering JSX (lines 654-782) to new component
  - [ ] 1.4: Export component from index

- [ ] **Task 2: Update GruposView** (AC: #3)
  - [ ] 2.1: Import GruposViewDialogs component
  - [ ] 2.2: Replace inline dialog rendering with component
  - [ ] 2.3: Pass dialog state and handlers as props
  - [ ] 2.4: Verify TypeScript compiles

- [ ] **Task 3: Test Verification** (AC: #4)
  - [ ] 3.1: Run existing GruposView tests
  - [ ] 3.2: Run full test suite
  - [ ] 3.3: Manual verification of dialog flows

## Dev Notes

### Expected Component Structure

```typescript
// src/components/settings/subviews/GruposViewDialogs.tsx
import React from 'react';
import { CreateGroupDialog } from '@/features/shared-groups/components/CreateGroupDialog';
import { InviteMembersDialog } from '@/features/shared-groups/components/InviteMembersDialog';
// ... other imports

export interface GruposViewDialogsProps {
  // Dialog state
  dialogs: GroupDialogsState;

  // Handlers
  onCloseCreate: () => void;
  onCreateSuccess: () => void;
  onCloseInvite: () => void;
  // ... other handlers

  // Dependencies
  t: (key: string) => string;
  lang: 'en' | 'es';
  user: User | null;
  groups: SharedGroup[];
}

export const GruposViewDialogs: React.FC<GruposViewDialogsProps> = ({
  dialogs,
  onCloseCreate,
  onCreateSuccess,
  // ...
}) => {
  return (
    <>
      {dialogs.isCreateDialogOpen && (
        <CreateGroupDialog
          isOpen={dialogs.isCreateDialogOpen}
          onClose={onCloseCreate}
          onSuccess={onCreateSuccess}
          // ...
        />
      )}
      {/* ... other dialogs */}
    </>
  );
};
```

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/subviews/GruposViewDialogs.tsx` | **NEW** | Dialog rendering component |
| `src/components/settings/subviews/GruposView.tsx` | Modify | Use GruposViewDialogs |
| `src/components/settings/subviews/index.ts` | Modify | Export new component |

### Testing Strategy

- No new tests needed (existing tests should pass)
- Manual verification of all 6 dialog flows
- TypeScript compilation check

### Dependencies

- **TD-14d-1** (recommended): Zustand migration makes state passing cleaner

### References

- [14d-v2-1-7e](./14d-v2-1-7e-delete-ui-security-rules.md) - Source of this tech debt item (ECC Review #4)
- [GruposView.tsx](../../../../src/components/settings/subviews/GruposView.tsx) - Current implementation
