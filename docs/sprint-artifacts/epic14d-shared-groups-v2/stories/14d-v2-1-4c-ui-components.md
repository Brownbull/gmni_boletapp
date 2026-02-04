# Story 14d-v2.1.4c: UI Components

Status: split

> Part 3 of 4 - Split from Story 14d-v2-1-4 (Create Shared Group)
> Split reason: Original story exceeded sizing limits (8 tasks, 42 subtasks, 8 files)
> Split strategy: by_layer (Architectural Layer)
>
> **SPLIT 2026-02-01:** This story was proactively split into 2 sub-stories:
> - [14d-v2-1-4c-1-core-dialog.md](14d-v2-1-4c-1-core-dialog.md) - Core Dialog & Entry Point (2 tasks, 7 subtasks)
> - [14d-v2-1-4c-2-enhanced-features.md](14d-v2-1-4c-2-enhanced-features.md) - Enhanced Features & Limits (2 tasks, 8 subtasks)
> Split reason: Subtasks at 15-limit ceiling, proactive risk reduction
> Split strategy: by_feature (Core vs Enhanced)

## Story

As a **user**,
I want **to create a new shared expense group through a dialog**,
So that **I can share expenses with family, roommates, or friends**.

## Acceptance Criteria

### From Original Story (AC: #1, #4, #5, #6, #7, #8)

1. **Given** I am logged in
   **When** I tap "Create Group" and enter a name
   **Then** I see a creation flow that includes:
   - Group name input (required)
   - **Transaction sharing prompt**: "Would you like to allow transaction sharing in this group?"
   - Helper text explaining sharing options

2. **Given** I already have 5 groups (as owner or member)
   **When** I try to create another group
   **Then** I see an error message: "You've reached the maximum of 5 groups"
   **And** the button is disabled with tooltip (BC-1 enforcement)

3. **Given** the group name input
   **When** I enter a name
   **Then** validation enforces:
   - Minimum length: 2 characters
   - Maximum length: 50 characters
   - Trimmed of leading/trailing whitespace
   - Error displayed for invalid names

4. **Given** I complete group creation
   **When** the creation succeeds
   **Then** I see a success toast: "Group '[name]' created!"
   **And** I am automatically navigated to the newly created group view

5. **Given** group creation fails (network error)
   **When** the error occurs
   **Then** I see an error toast with retry option
   **And** my input is preserved for retry

6. **Given** I am in the group creation flow
   **When** I tap outside the dialog or press back
   **Then** I am prompted if I have unsaved changes: "Discard group creation?"

## Tasks / Subtasks

- [ ] **Task 1: Create Group Creation Dialog UI** (AC: #1, #3, #4, #5, #6)
  - [ ] 1.1: Create `src/components/SharedGroups/CreateGroupDialog.tsx`
  - [ ] 1.2: Implement group name input with validation
  - [ ] 1.3: Implement transaction sharing toggle with helper text
  - [ ] 1.4: Add loading state during creation
  - [ ] 1.5: Add success/error toast notifications
  - [ ] 1.6: Add discard confirmation dialog
  - [ ] 1.7: Implement navigation to new group on success
  - [ ] 1.8: Add unit tests for dialog component

- [ ] **Task 2: Add Entry Point** (AC: #1)
  - [ ] 2.1: Add "Create Group" button to Settings view or header menu
  - [ ] 2.2: Wire up dialog open/close state
  - [ ] 2.3: Consider FAB long-press option (future enhancement note)

- [ ] **Task 3: BC-1 Limit Enforcement UI** (AC: #2)
  - [ ] 3.1: Query user's group count before showing create option
  - [ ] 3.2: Disable button if limit reached
  - [ ] 3.3: Show tooltip explaining limit when disabled
  - [ ] 3.4: Double-check in service layer before creation (defense in depth)

## Dev Notes

### Sizing Metrics

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 3 | ≤4 | ✅ OK |
| Subtasks | 15 | ≤15 | ⚠️ AT LIMIT |
| Files | 2-3 | ≤8 | ✅ OK |

**Classification:** LARGE (3 tasks, 15 subtasks, 2-3 files) - at capacity but acceptable

### UI Design Notes

**Create Group Dialog:**
- Modal dialog (not full screen)
- Step 1: Group name input with character counter
- Step 2: Transaction sharing toggle with explanation
- Buttons: [Cancel] [Create Group]
- Loading spinner during creation
- Success: Auto-close + navigate to group

**Transaction Sharing Explanation:**
```
"When enabled, members can choose to share their individual
transaction details with the group. Statistics (totals,
breakdowns by category and member) are always shared
regardless of this setting."
```

### Component Structure

```typescript
// CreateGroupDialog.tsx
interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (group: SharedGroup) => void;
}

// Internal state
const [name, setName] = useState('');
const [transactionSharingEnabled, setTransactionSharingEnabled] = useState(true);
const [hasChanges, setHasChanges] = useState(false);
const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

// Validation
const nameError = useMemo(() => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be 50 characters or less';
  return null;
}, [name]);
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/CreateGroupDialog.tsx` | CREATE | Creation UI |
| `tests/unit/components/SharedGroups/CreateGroupDialog.test.tsx` | CREATE | UI tests |
| `src/views/SettingsView.tsx` (or Settings menu) | MODIFY | Add entry point |

### Dependencies

- **Depends on:** Story 14d-v2-1-4b (needs useCreateGroup hook)
- **Blocks:** Story 14d-v2-1-4d (Integration testing)

### Testing Standards

- **Component tests:** React Testing Library
- **Coverage target:** 80%+ for new code
- **Test scenarios:**
  - Happy path creation
  - Validation errors (short name, long name)
  - BC-1 limit reached state
  - Network error handling
  - Discard confirmation

### References

- [Original Story: 14d-v2-1-4-create-shared-group.md]
- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-14]
- [Layered Visibility Model: epics.md lines 23-48]
- [FR-19 Requirement: epics.md line 69]

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
