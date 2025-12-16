# Story 9.7: Merchant Mappings Management UI

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** review
**Story Points:** 2
**Dependencies:** Story 9.4, 9.5, 9.6

---

## User Story

As a **user**,
I want **to view and manage my merchant name mappings**,
So that **I can edit or delete incorrect mappings**.

---

## Acceptance Criteria

- [x] **AC #1:** "Merchant Mappings" section added to Settings view
- [x] **AC #2:** List shows all merchant mappings (original → corrected)
- [x] **AC #3:** Each mapping shows usage count
- [x] **AC #4:** Delete button removes mapping with confirmation
- [x] **AC #5:** Edit functionality allows updating target merchant name
- [x] **AC #6:** Empty state message when no mappings exist
- [x] **AC #7:** Follows Category Mappings UI pattern

---

## Tasks / Subtasks

- [x] Create `src/components/MerchantMappingsList.tsx` (AC: #1, #2, #3, #6, #7)
  - [x] Follow `CategoryMappingsList.tsx` pattern
  - [x] List all mappings with original → target display
  - [x] Show usage count for each mapping
  - [x] Empty state: "No merchant mappings yet. Edit a merchant name and choose to remember it."
- [x] Add delete functionality (AC: #4)
  - [x] Delete button on each mapping
  - [x] Confirmation dialog before deletion
  - [x] Call `deleteMerchantMapping()` on confirm
- [x] Add edit functionality (AC: #5)
  - [x] Edit button with modal dialog
  - [x] Allow changing targetMerchant
  - [x] Save updates mapping, preserves normalizedMerchant
- [x] Integrate into SettingsView (AC: #1)
  - [x] Add "Merchant Mappings" section
  - [x] Position after Category Mappings section
- [x] Add unit tests for component
- [x] Run all tests and verify passing

---

## Technical Summary

This story adds Settings UI for managing merchant mappings:

1. **List View:** Show all mappings with original → corrected format
2. **Usage Count:** Display how many times each mapping was auto-applied
3. **Edit/Delete:** Standard management actions
4. **Pattern:** Follow CategoryMappingsList from Epic 6

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ Merchant Mappings                           │
├─────────────────────────────────────────────┤
│ SUPERMERC JUMBO → Jumbo Supermarket  (5x)   │
│                              [Edit] [Delete] │
├─────────────────────────────────────────────┤
│ UBER EATS → Uber Eats              (12x)    │
│                              [Edit] [Delete] │
└─────────────────────────────────────────────┘
```

---

## Project Structure Notes

- **Files created:**
  - `src/components/MerchantMappingsList.tsx`
  - `tests/unit/components/MerchantMappingsList.test.tsx`
- **Files modified:**
  - `src/views/SettingsView.tsx` - Add merchant mappings section
  - `src/hooks/useMerchantMappings.ts` - Add updateMapping function
  - `src/services/merchantMappingService.ts` - Add updateMerchantMappingTarget function
  - `src/App.tsx` - Wire up merchant mappings props to SettingsView
  - `src/utils/translations.ts` - Add EN/ES translations for merchant mappings UI
- **Expected test locations:** `tests/unit/components/`
- **Prerequisites:** Stories 9.4-9.6 (mappings infrastructure and learning)

---

## Key Code References

**Existing Patterns:**
- `src/components/CategoryMappingsList.tsx` - Pattern followed
- `src/hooks/useMerchantMappings.ts` - Hook for data access

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**Architecture:** [architecture-epic9.md](./architecture-epic9.md)

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Implemented the Merchant Mappings Management UI following the existing CategoryMappingsList pattern:

1. **MerchantMappingsList Component** (`src/components/MerchantMappingsList.tsx`):
   - Displays all merchant mappings with original → target format
   - Shows usage count for each mapping
   - Delete functionality with confirmation modal
   - Edit functionality with modal dialog for changing target merchant
   - Empty state with helpful message
   - Theme-aware styling (light/dark modes)
   - WCAG 2.1 Level AA compliant with keyboard navigation and focus management

2. **Service Layer Updates**:
   - Added `updateMerchantMappingTarget()` to `merchantMappingService.ts`
   - Added `updateMapping()` to `useMerchantMappings.ts` hook

3. **Integration**:
   - Added "Learned Merchants" section to SettingsView
   - Positioned after "Learned Categories" section
   - Wired up through App.tsx with all required props

4. **Translations**:
   - Added EN/ES translations for all new UI strings

5. **Tests**:
   - 34 unit tests covering all acceptance criteria
   - Tests for rendering, delete, edit, empty state, loading, themes, accessibility

### Files Modified
- `src/components/MerchantMappingsList.tsx` (NEW)
- `src/views/SettingsView.tsx`
- `src/hooks/useMerchantMappings.ts`
- `src/services/merchantMappingService.ts`
- `src/App.tsx`
- `src/utils/translations.ts`
- `tests/unit/components/MerchantMappingsList.test.tsx` (NEW)
- `docs/sprint-artifacts/sprint-status.yaml`

### Test Results
- All 34 new unit tests passing
- Full test suite: 1584 tests passing across 60 test files
- No regressions

---

## Review Notes
See "Senior Developer Review (AI)" section below.

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-12 | 1.0 | Story drafted |
| 2025-12-13 | 1.1 | Implementation complete |
| 2025-12-13 | 1.2 | Senior Developer Review notes appended |

---

## Senior Developer Review (AI)

### Reviewer
Gabe

### Date
2025-12-13

### Outcome
**✅ APPROVE**

All 7 acceptance criteria are fully implemented with evidence. All 13 tasks verified complete. No HIGH or MEDIUM severity findings. The implementation follows established patterns and maintains code quality standards.

---

### Summary

Story 9.7 successfully implements the Merchant Mappings Management UI in Settings, allowing users to view, edit, and delete learned merchant mappings. The implementation closely follows the CategoryMappingsList pattern established in Epic 6, ensuring consistency across the application.

Key achievements:
- Complete MerchantMappingsList component with edit/delete modals
- WCAG 2.1 Level AA accessibility compliance
- Full i18n support (EN/ES)
- 34 unit tests covering all acceptance criteria
- Proper integration through App.tsx and SettingsView

---

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity:**
- [ ] [Low] `onKeyPress` is deprecated in favor of `onKeyDown` [file: src/components/MerchantMappingsList.tsx:326]

---

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | "Merchant Mappings" section added to Settings view | ✅ IMPLEMENTED | src/views/SettingsView.tsx:265-281 |
| AC #2 | List shows all merchant mappings (original → corrected) | ✅ IMPLEMENTED | src/components/MerchantMappingsList.tsx:549-562 |
| AC #3 | Each mapping shows usage count | ✅ IMPLEMENTED | src/components/MerchantMappingsList.tsx:559-561 |
| AC #4 | Delete button removes mapping with confirmation | ✅ IMPLEMENTED | src/components/MerchantMappingsList.tsx:578-587, 45-212 |
| AC #5 | Edit functionality allows updating target merchant name | ✅ IMPLEMENTED | src/components/MerchantMappingsList.tsx:568-576, 226-422 |
| AC #6 | Empty state message when no mappings exist | ✅ IMPLEMENTED | src/components/MerchantMappingsList.tsx:520-534 |
| AC #7 | Follows Category Mappings UI pattern | ✅ IMPLEMENTED | Component structure mirrors CategoryMappingsList.tsx |

**Summary: 7 of 7 acceptance criteria fully implemented.**

---

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Create MerchantMappingsList.tsx | [x] | ✅ VERIFIED | src/components/MerchantMappingsList.tsx (615 lines) |
| Follow CategoryMappingsList pattern | [x] | ✅ VERIFIED | Structure, modals, state management all match |
| List mappings original → target | [x] | ✅ VERIFIED | Lines 549-562 |
| Show usage count | [x] | ✅ VERIFIED | formatUsageCount() at lines 502-504 |
| Empty state message | [x] | ✅ VERIFIED | Lines 520-534 |
| Delete button with confirmation | [x] | ✅ VERIFIED | DeleteConfirmModal component |
| Edit button with modal | [x] | ✅ VERIFIED | EditMerchantModal component |
| Integrate into SettingsView | [x] | ✅ VERIFIED | SettingsView.tsx:265-281 |
| Add updateMapping to hook | [x] | ✅ VERIFIED | useMerchantMappings.ts:138-163 |
| Add updateMerchantMappingTarget to service | [x] | ✅ VERIFIED | merchantMappingService.ts:150-163 |
| Wire up in App.tsx | [x] | ✅ VERIFIED | App.tsx:559-564 |
| Add EN/ES translations | [x] | ✅ VERIFIED | translations.ts:118-125 (EN), 243-250 (ES) |
| Unit tests | [x] | ✅ VERIFIED | 34 tests in MerchantMappingsList.test.tsx |

**Summary: 13 of 13 tasks verified complete. 0 falsely marked complete.**

---

### Test Coverage and Gaps

**Unit Tests:** 34 tests covering:
- Rendering (AC #1, #2, #7)
- Usage count display (AC #3)
- Delete functionality with confirmation (AC #4)
- Edit functionality with modal (AC #5)
- Empty state (AC #6)
- Loading state
- Light/dark theme support
- Accessibility (ARIA labels, keyboard navigation, focus management)
- Edge cases (long names, special characters, missing IDs)

**No test gaps identified.**

---

### Architectural Alignment

✅ **Tech-spec compliance:** Implementation follows tech-spec-epic-9.md patterns
✅ **Architecture alignment:** Follows architecture-epic9.md MerchantMapping data model
✅ **Pattern consistency:** Mirrors CategoryMappingsList from Epic 6 exactly
✅ **File organization:** Proper placement in src/components/, src/services/, src/hooks/

---

### Security Notes

No security concerns identified:
- Component delegates to service layer for Firestore operations
- No direct sensitive data handling
- Proper Firestore security rules in place (user-scoped collection)

---

### Best-Practices and References

- React 18.x patterns: useState, useEffect, useCallback, useRef
- WCAG 2.1 Level AA: Focus management, keyboard navigation, aria-labels
- TypeScript strict mode compliance
- Tailwind CSS styling with theme-aware classes
- lucide-react icons (Trash2, Edit2, Store, X, Check)

---

### Action Items

**Code Changes Required:**
- [ ] [Low] Replace deprecated `onKeyPress` with `onKeyDown` [file: src/components/MerchantMappingsList.tsx:326]

**Advisory Notes:**
- Note: The `onKeyPress` deprecation is minor and can be addressed in a future cleanup sprint
