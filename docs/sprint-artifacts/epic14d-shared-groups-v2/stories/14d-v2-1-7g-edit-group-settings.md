# Story 14d-v2.1.7g: Edit Group Settings

Status: review

> Part 7 of 7 - Added to Story 1.7 (Leave/Manage Group)
> Scope: Edit group name, icon, and color (owner-only)
> ECC Analysis: 2026-02-02 | Risk: LOW-MEDIUM | Complexity: MEDIUM

## Story

As a **group owner**,
I want **to edit my group's name, icon, and color**,
So that **I can personalize and update my group's appearance**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** I am a group owner
   **When** I open group settings
   **Then** I see edit options for name, icon, and color

2. **Given** I tap on the group name
   **When** I enter a new name (2-50 characters)
   **Then** the name is updated on the group document
   **And** all members see the updated name on their next sync

3. **Given** I tap on the group icon
   **When** I select an emoji from the picker
   **Then** the icon is updated on the group document
   **And** all members see the updated icon

4. **Given** I tap on the group color
   **When** I select a color from the palette
   **Then** the color is updated on the group document
   **And** the group card and header reflect the new color

5. **Given** I am NOT the group owner
   **When** I view group settings
   **Then** I can see name/icon/color but cannot edit them
   **And** edit buttons are hidden or disabled

6. **Given** validation fails (empty name, too short, too long)
   **When** I try to save
   **Then** an error message is shown
   **And** the change is not saved

### Architecture Compliance (Added 2026-02-03)

7. **Given** the EditGroupDialog component is created
   **When** I check the file location
   **Then** it is in `src/features/shared-groups/components/EditGroupDialog.tsx`
   **And** exported via feature barrel `src/features/shared-groups/index.ts`

8. **Given** tests for EditGroupDialog are created
   **When** I check the file location
   **Then** they are in `tests/unit/features/shared-groups/components/EditGroupDialog.test.tsx`

### Atlas-Suggested Additional Criteria

7. **Given** I successfully save changes
   **When** the update completes
   **Then** the current UI reflects changes immediately (optimistic update)
   **And** group cards in GruposView show the new name/icon/color

8. **Given** I have unsaved changes
   **When** I try to close the dialog
   **Then** a discard confirmation is shown
   **And** I can choose to discard or continue editing

## Tasks / Subtasks

- [ ] **Task 1: Update Group Service** (AC: #1, #2, #3, #4, #6)
  - [ ] 1.1: Create `updateGroup(db, groupId, userId, updates): Promise<void>` in `groupService.ts`
  - [ ] 1.2: Validate name length (2-50 chars), sanitize input with `sanitizeInput()`
  - [ ] 1.3: Verify caller is group owner before update
  - [ ] 1.4: Validate icon using whitelist from ICON_CATEGORIES
  - [ ] 1.5: Validate color using whitelist from GROUP_COLORS
  - [ ] 1.6: Update `updatedAt` timestamp with `serverTimestamp()`
  - [ ] 1.7: Add unit tests for update scenarios (success, validation, authorization)

- [ ] **Task 2: Add useUpdateGroup Hook** (AC: #7)
  - [ ] 2.1: Create `useUpdateGroup` mutation hook in `useGroups.ts`
  - [ ] 2.2: Implement optimistic updates to group cache
  - [ ] 2.3: Implement rollback on error
  - [ ] 2.4: Invalidate queries on success
  - [ ] 2.5: Export from feature index
  - [ ] 2.6: Add hook unit tests

- [ ] **Task 3: Create EditGroupDialog Component** (AC: #1, #2, #3, #4, #6, #7, #8)
  - [ ] 3.1: Create `src/features/shared-groups/components/EditGroupDialog.tsx` with name, icon, color inputs
  - [ ] 3.2: Pre-fill current group values on open
  - [ ] 3.3: Reuse existing `EmojiPicker` component
  - [ ] 3.4: Reuse existing `ColorPicker` component
  - [ ] 3.5: Validate name (same rules as CreateGroupDialog)
  - [ ] 3.6: Track changes to show discard confirmation
  - [ ] 3.7: Show loading state during save
  - [ ] 3.8: Handle success/error states
  - [ ] 3.9: Export from feature barrel `src/features/shared-groups/index.ts`
  - [ ] 3.10: Add component unit tests in `tests/unit/features/shared-groups/components/`

- [ ] **Task 4: Integrate into GruposView** (AC: #1, #5, #7)
  - [ ] 4.1: Add Settings/Edit icon button to group cards (owner-only)
  - [ ] 4.2: Add state for `isEditDialogOpen` and `editingGroup`
  - [ ] 4.3: Add `handleOpenEditDialog(group)` callback
  - [ ] 4.4: Add `handleUpdate(updates)` handler using useUpdateGroup
  - [ ] 4.5: Integrate EditGroupDialog with callbacks
  - [ ] 4.6: Add success toast on update completion
  - [ ] 4.7: Add integration tests

- [ ] **Task 5: Security Rules Verification** (AC: #5)
  - [ ] 5.1: Verify existing `isGroupOwner()` rule covers name/icon/color updates
  - [ ] 5.2: Add security rules tests for edit scenarios
  - [ ] 5.3: Test non-owner cannot update these fields

- [ ] **Task 6: Translations** (AC: all)
  - [ ] 6.1: Add English translations (editGroup, editGroupTitle, updateGroup, etc.)
  - [ ] 6.2: Add Spanish translations

## Dev Notes

### ECC Analysis Summary

| Agent | Finding | Risk Level |
|-------|---------|------------|
| **Planner** | Reuse existing EmojiPicker, ColorPicker; follow CreateGroupDialog patterns | LOW |
| **Architect** | Separate EditGroupDialog component (SRP); optimistic updates with rollback | LOW |
| **Database Reviewer** | Existing `UpdateSharedGroupInput` type sufficient; no new indexes needed | LOW |
| **Security Reviewer** | Double-gate security (service + rules); whitelist validation preferred | MEDIUM |

### Implementation Approach

**Service Layer Pattern:**
```typescript
// src/features/shared-groups/services/groupService.ts

export async function updateGroup(
    db: Firestore,
    groupId: string,
    userId: string,
    updates: UpdateSharedGroupInput
): Promise<void> {
    // 1. Input validation
    if (!groupId || !userId) {
        throw new Error('Group ID and user ID are required');
    }

    // 2. Fetch and verify ownership
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        throw new Error('Group not found');
    }

    const group = groupSnap.data() as SharedGroup;

    if (group.ownerId !== userId) {
        throw new Error('Only the group owner can update settings');
    }

    // 3. Build update object with validation
    const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) {
        const sanitizedName = sanitizeInput(updates.name, { maxLength: 50 });
        if (sanitizedName.length < 2) {
            throw new Error('Group name must be at least 2 characters');
        }
        updateData.name = sanitizedName;
    }

    if (updates.icon !== undefined) {
        // Whitelist validation
        updateData.icon = updates.icon;
    }

    if (updates.color !== undefined) {
        if (!GROUP_COLORS.includes(updates.color)) {
            throw new Error('Invalid color selection');
        }
        updateData.color = updates.color;
    }

    await updateDoc(groupRef, updateData);
}
```

### Data Model

```typescript
// Update input type (already exists in src/types/sharedGroup.ts line 247)
export type UpdateSharedGroupInput = Partial<Pick<SharedGroup, 'name' | 'color' | 'icon'>>;

// Firestore update object
{
    name?: string,       // 2-50 chars, sanitized
    icon?: string,       // Single emoji from whitelist
    color?: string,      // Hex color from GROUP_COLORS whitelist
    updatedAt: serverTimestamp()
}
```

### Preset Colors Palette

```typescript
// Use these EXACT colors for whitelist validation
const GROUP_COLORS = [
    '#10b981', // Emerald (default)
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#a855f7', // Violet
];
```

### Icon Categories

```typescript
// Whitelist of allowed emojis
const ICON_CATEGORIES = {
    home: ['🏠', '🏡', '🏢', '🏬', '🏭'],
    people: ['👥', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👫', '🤝'],
    money: ['💰', '💵', '💳', '🏦', '💸'],
    food: ['🍕', '🍔', '🥗', '🛒', '🍽️'],
    travel: ['✈️', '🚗', '🚌', '⛽', '🏖️'],
    entertainment: ['🎮', '🎬', '🎵', '📺', '🎉'],
    health: ['💊', '🏥', '🏃', '💪', '🧘'],
    education: ['📚', '🎓', '✏️', '💻', '📝'],
};
```

### Security Considerations

1. **Double-gate authorization:**
   - Service layer: `group.ownerId !== userId` check
   - Firestore rules: `isGroupOwner()` function at line 44-47

2. **Input sanitization:**
   - Name: Use `sanitizeInput()` from `src/utils/sanitize.ts`
   - Color: Whitelist validation against `GROUP_COLORS`
   - Icon: Whitelist validation against `ICON_CATEGORIES`

3. **Existing Firestore rule (line 108):**
   ```javascript
   allow update: if isGroupOwner() || isUserJoining() || isUserLeaving();
   ```
   This ALREADY covers owner-only updates. No rule changes needed.

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/features/shared-groups/services/groupService.ts` | Modify | Add `updateGroup` function |
| `src/features/shared-groups/services/index.ts` | Modify | Export `updateGroup` |
| `src/features/shared-groups/hooks/useGroups.ts` | Modify | Add `useUpdateGroup` mutation hook |
| `src/features/shared-groups/hooks/index.ts` | Modify | Export `useUpdateGroup` |
| `src/features/shared-groups/components/EditGroupDialog.tsx` | **NEW** | Edit settings dialog (FSD compliant) |
| `src/features/shared-groups/components/index.ts` | Modify | Export `EditGroupDialog` |
| `src/features/shared-groups/index.ts` | Modify | Export new service/hook/component |
| `src/components/settings/subviews/GruposView.tsx` | Modify | Add edit button + dialog integration |
| `src/utils/translations.ts` | Modify | Add edit group translations |
| `tests/unit/features/shared-groups/services/groupService.test.ts` | Modify | Add updateGroup tests |
| `tests/unit/features/shared-groups/components/EditGroupDialog.test.tsx` | **NEW** | Component tests (FSD compliant) |
| `tests/integration/firestore-rules.test.ts` | Modify | Add edit permission tests |

### Component Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `EmojiPicker` | `src/components/SharedGroups/EmojiPicker.tsx` | Icon selection |
| `ColorPicker` | `src/components/SharedGroups/ColorPicker.tsx` | Color selection |
| `CreateGroupDialog` | `src/components/SharedGroups/CreateGroupDialog.tsx` | Pattern reference for validation |

### Translations to Add

```typescript
// English
editGroup: "Edit Group",
editGroupTitle: "Edit Group",
groupUpdatedSuccess: "Group updated",
updateGroup: "Update",
updating: "Updating...",
discardGroupEdit: "Discard changes?",

// Spanish
editGroup: "Editar Grupo",
editGroupTitle: "Editar Grupo",
groupUpdatedSuccess: "Grupo actualizado",
updateGroup: "Actualizar",
updating: "Actualizando...",
discardGroupEdit: "¿Descartar cambios?",
```

### Testing Strategy

**Unit Tests (groupService.test.ts):**
- `updateGroup()` with valid inputs returns void
- `updateGroup()` with invalid name throws validation error
- `updateGroup()` by non-owner throws authorization error
- `updateGroup()` sanitizes XSS from name

**Component Tests (EditGroupDialog.test.tsx):**
- Renders with pre-filled values
- Shows validation error for name < 2 chars
- Shows validation error for name > 50 chars
- Save button disabled when form invalid
- Shows loading spinner when isPending
- Calls onClose when backdrop clicked
- Shows discard confirmation when closing with changes

**Security Rules Tests (firestore-rules.test.ts):**
- Owner can update name/icon/color
- Non-owner member cannot update
- Non-member cannot update

### References

- [Story 1.7: Leave/Manage Group](14d-v2-1-7-leave-manage-group.md) - Parent story
- [Story 1.4c-1: CreateGroupDialog](14d-v2-1-4c-1-core-dialog.md) - Pattern reference
- [Security Rules](../../../../firestore.rules) - isGroupOwner() at lines 44-47
- [EmojiPicker](../../../../src/components/SharedGroups/EmojiPicker.tsx) - Reuse
- [ColorPicker](../../../../src/components/SharedGroups/ColorPicker.tsx) - Reuse

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Create Shared Group (1.4)** | Upstream - provides initial group settings to edit |
| **View Mode Switcher (1.10)** | Displays group with updated name/icon/color |
| **GruposView Settings** | Entry point for edit functionality |
| **Changelog Sync (2.x)** | Members see updated metadata on sync |

### Upstream Dependencies

```
Story 1.4: Create Shared Group (provides group structure)
Story 1.4b: Group service layer (patterns to follow)
Story 14d-v2-0: Architecture alignment (Zustand patterns)
```

### Downstream Effects

- **All members:** See updated name/icon/color on next sync
- **View Mode Switcher:** Displays updated group appearance
- **Group Cards:** Reflect changes immediately for owner

### Workflow Chain Visualization

```
UPSTREAM:
[Create Shared Group (1.4)] → [Group Service Layer (1.4b)]
                                        ↓
CURRENT STORY:                [THIS STORY: Edit Settings (1.7g)]
                                        ↓
DOWNSTREAM:
                    ┌───────────────────┴───────────────────┐
                    ↓                                       ↓
          [View Mode Switcher (1.10)]            [Changelog Sync (2.x)]
                    ↓                                       ↓
          [Updated group display]              [Members see changes]
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) via ECC-enhanced workflow

### Completion Notes List

1. **TOCTOU Vulnerability Fixed (HIGH)**: Changed `updateGroup` from `getDoc + updateDoc` to `runTransaction` for atomic ownership verification
2. **Missing Translations Added (HIGH)**: Added 10 translation keys for EN/ES (editGroup, editGroupTitle, groupUpdatedSuccess, etc.)
3. **Test Mocks Updated**: Updated unit tests to mock `runTransaction` instead of `getDoc + updateDoc`
4. **Unused Import Removed**: Removed `updateDoc` import after transaction refactor
5. **All Tests Pass**: 8,435 tests passing, 78 skipped (expected)
6. **ECC Parallel Review Score**: Code Review 7.5/10, Security Review 7.5/10

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/features/shared-groups/services/groupService.ts` | Modified | Added `updateGroup`, `GROUP_COLORS`, `GROUP_ICONS` with transaction-based TOCTOU fix |
| `src/features/shared-groups/services/index.ts` | Modified | Export updateGroup, GROUP_COLORS, GROUP_ICONS |
| `src/features/shared-groups/hooks/useGroups.ts` | Modified | Added `useUpdateGroup` mutation hook with optimistic updates |
| `src/features/shared-groups/hooks/index.ts` | Modified | Export useUpdateGroup hook |
| `src/features/shared-groups/components/EditGroupDialog.tsx` | Created | Edit settings dialog with name/icon/color editing |
| `src/features/shared-groups/components/index.ts` | Modified | Export EditGroupDialog component |
| `src/features/shared-groups/store/useGroupDialogsStore.ts` | Modified | Added edit dialog state (isEditDialogOpen, editingGroup, isUpdating) |
| `src/features/shared-groups/index.ts` | Modified | Export new service/hook/component |
| `src/components/settings/subviews/GruposView.tsx` | Modified | Added edit button (owner-only) + EditGroupDialog integration |
| `src/utils/translations.ts` | Modified | Added EN/ES translations for edit group feature |
| `tests/unit/features/shared-groups/services/groupService.test.ts` | Modified | Added updateGroup tests (23 tests), updated mocks for transaction |
| `tests/unit/features/shared-groups/components/EditGroupDialog.test.tsx` | Created | Component tests (26 tests) |
| `tests/unit/features/shared-groups/hooks/useUpdateGroup.test.tsx` | Created | Hook tests for optimistic updates |

### Change Log

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-02 | Atlas/ECC | Created story with full ECC analysis (Planner + Architect + DB + Security reviews) |
| 2026-02-02 | Atlas | Updated status to ready-for-dev with comprehensive Dev Notes |
| 2026-02-03 | ECC TDD Guide | Implemented all 6 tasks via TDD approach (49 tests for story) |
| 2026-02-03 | ECC Code/Security Review | Parallel review - both scored 7.5/10, identified TOCTOU + translations |
| 2026-02-03 | Atlas | Fixed HIGH severity issues, updated to review status |
