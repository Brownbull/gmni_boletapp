# Story 14d-v2.1.4c-1: Core Dialog & Entry Point

Status: done

> Part 1 of 2 - Split from Story 14d-v2-1-4c (UI Components)
> Split reason: Proactive sizing reduction (original at 15 subtask limit)
> Split strategy: by_feature (Core vs Enhanced)

## Story

As a **user**,
I want **to create a new shared expense group through a dialog**,
So that **I can share expenses with family, roommates, or friends**.

## Acceptance Criteria

### From Original Story (AC: #1, #3 partial)

1. **Given** I am logged in
   **When** I tap "Create Group" and enter a name
   **Then** I see a creation flow that includes:
   - Group name input (required)
   - **Transaction sharing prompt**: "Would you like to allow transaction sharing in this group?"
   - Helper text explaining sharing options

2. **Given** the group name input
   **When** I enter a name
   **Then** validation enforces:
   - Minimum length: 2 characters
   - Maximum length: 50 characters
   - Trimmed of leading/trailing whitespace
   - Error displayed for invalid names

3. **Given** I am creating a group
   **When** the operation is in progress
   **Then** I see a loading indicator

## Tasks / Subtasks

- [x] **Task 1: Core Dialog Structure** (AC: #1, #2, #3)
  - [x] 1.1: Create `src/components/SharedGroups/CreateGroupDialog.tsx`
  - [x] 1.2: Implement group name input with validation
  - [x] 1.3: Implement transaction sharing toggle with helper text
  - [x] 1.4: Add loading state during creation

- [x] **Task 2: Add Entry Point** (AC: #1)
  - [x] 2.1: Add "Create Group" button to Settings view or header menu
  - [x] 2.2: Wire up dialog open/close state
  - [x] 2.3: Consider FAB long-press option (future enhancement note)

## Dev Notes

### Sizing Metrics

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 2 | ≤4 | ✅ OK |
| Subtasks | 7 | ≤15 | ✅ OK |
| Files | 2 | ≤8 | ✅ OK |

**Classification:** MEDIUM (2 tasks, 7 subtasks, 2 files)

### UI Design Notes

**Create Group Dialog (Core):**
- Modal dialog (not full screen)
- Step 1: Group name input with character counter
- Step 2: Transaction sharing toggle with explanation
- Buttons: [Cancel] [Create Group]
- Loading spinner during creation

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
const [isLoading, setIsLoading] = useState(false);

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
| `src/components/SharedGroups/CreateGroupDialog.tsx` | CREATE | Core dialog UI |
| `src/views/SettingsView.tsx` (or Settings menu) | MODIFY | Add entry point |

### Dependencies

- **Depends on:** Story 14d-v2-1-4b (needs useCreateGroup hook)
- **Blocks:** Story 14d-v2-1-4c-2 (Enhanced Features & Limits)

### Testing Standards

- **Component tests:** React Testing Library
- **Coverage target:** 80%+ for new code
- **Test scenarios:**
  - Dialog renders with name input and toggle
  - Validation errors (short name, long name)
  - Loading state displayed during creation
  - Dialog closes on cancel

### References

- [Original Story: 14d-v2-1-4c-ui-components.md]
- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-14]
- [Layered Visibility Model: epics.md lines 23-48]
- [FR-19 Requirement: epics.md line 69]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (atlas-dev-story workflow)

### Debug Log References

No debug sessions required.

### Completion Notes List

1. **CreateGroupDialog component created** (Task 1)
   - Modal dialog with backdrop, close button, and proper z-index (9999)
   - Group name input with real-time validation (2-50 chars, trimmed)
   - Character counter showing current/max length
   - Transaction sharing toggle with helper text explanation
   - Loading state with spinner and disabled inputs/buttons
   - Accessible: ARIA labels, keyboard navigation (Escape to close), focus management
   - Prevents body scroll when open, restores on close
   - Uses CSS custom properties for theming (--surface, --text-primary, etc.)

2. **GruposView updated with entry point** (Task 2)
   - Added "Create Group" button in header
   - Empty state with call-to-action button
   - Loading state while fetching groups
   - Groups list displays existing groups with icon/color/member count
   - Integrated with useCreateGroup mutation (async with error handling)
   - Toast notifications on success/error
   - FAB long-press option documented as future enhancement (comment in code)

3. **Test suite created** (31 tests)
   - AC #1: Basic rendering (dialog, input, toggle, buttons)
   - AC #2: Name validation (min/max length, whitespace-only, character counter)
   - AC #3: Loading state (spinner, disabled inputs, blocked close)
   - Interaction tests (create, cancel, backdrop click, Escape key, toggle)
   - Accessibility tests (ARIA attributes, focus management, body scroll)

### File List

| File | Action | Lines |
|------|--------|-------|
| `src/components/SharedGroups/CreateGroupDialog.tsx` | CREATE | 371 |
| `src/components/SharedGroups/index.ts` | MODIFY | +2 (exports) |
| `src/components/settings/subviews/GruposView.tsx` | MODIFY | Complete rewrite (302 lines) |
| `src/features/shared-groups/services/groupService.ts` | MODIFY | +3 (sanitization) |
| `tests/unit/components/SharedGroups/CreateGroupDialog.test.tsx` | CREATE | 373 |
| `tests/unit/components/settings/subviews/GruposView.test.tsx` | CREATE | 324 |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-01 | Story implemented - CreateGroupDialog + GruposView entry point | Claude Opus 4.5 |
| 2026-02-01 | Code review fixes: staged files, added GruposView tests (20), added sanitization | Claude Opus 4.5 |
