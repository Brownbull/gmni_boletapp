# Story 9.16: Learning Prompt Loading State (Bug Fix)

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** done
**Story Points:** 1
**Dependencies:** None

---

## User Story

As a **user**,
I want **the "Yes, Remember" button to show a loading state when pressed**,
So that **I don't accidentally create duplicate transactions by pressing the button multiple times**.

---

## Problem Description

When saving a transaction with changed categories/subcategories, the learning prompt appears. If the user presses "Yes, Remember" multiple times while the async operation is in progress, multiple transactions can be saved (user reported creating 7 duplicate transactions).

**Root Cause:** The `CategoryLearningPrompt` and `SubcategoryLearningPrompt` components have no loading/disabled state on the confirm button during the async save operation.

---

## Acceptance Criteria

- [x] **AC #1:** "Yes, Remember" button shows loading spinner when clicked
- [x] **AC #2:** Both "Yes, Remember" and "Skip" buttons are disabled during async operation
- [x] **AC #3:** Button text changes to "Saving..." (or equivalent i18n key) during loading
- [x] **AC #4:** Fix applies to both `CategoryLearningPrompt` and `SubcategoryLearningPrompt`
- [x] **AC #5:** Translations added for "saving" state in both EN and ES
- [x] **AC #6:** Existing tests pass

---

## Tasks / Subtasks

- [x] Add `isLoading` prop to `CategoryLearningPrompt` component
- [x] Add `isLoading` prop to `SubcategoryLearningPrompt` component
- [x] Implement loading state on confirm button (spinner + "Saving..." text)
- [x] Disable both confirm and skip buttons during loading
- [x] Add `saving` translation key in EN and ES
- [x] Update `EditView.tsx` to pass loading state and manage it during async operations
- [x] Verify no duplicate saves can occur

---

## Technical Summary

**Files to modify:**
1. `src/components/CategoryLearningPrompt.tsx`
   - Add `isLoading?: boolean` prop
   - Show `Loader2` spinner when loading
   - Disable buttons when loading

2. `src/components/SubcategoryLearningPrompt.tsx`
   - Same changes as CategoryLearningPrompt

3. `src/views/EditView.tsx`
   - Add `savingMappings` state
   - Set true before calling onConfirm, set false after
   - Pass to learning prompt components

4. `src/utils/translations.ts`
   - Add `savingPreference: "Saving..."` (EN)
   - Add `savingPreference: "Guardando..."` (ES)

**Pattern Reference:**
The existing "Check for Updates" button in `PWASettingsSection.tsx` shows the pattern:
- Button has `disabled={checking}`
- Shows `Loader2` spinner with `animate-spin` class
- Text changes during loading state

---

## Key Code References

**Existing Pattern (PWASettingsSection.tsx):**
```tsx
<button
  onClick={async () => { /* async operation */ }}
  disabled={checking}
  className="..."
>
  <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
  {checking ? t('checking') : t('checkUpdates')}
</button>
```

**Current Problem (CategoryLearningPrompt.tsx:251-257):**
```tsx
<button
  onClick={onConfirm}  // No loading state - can be clicked multiple times
  className="..."
>
  {t('learnCategoryConfirm')}
</button>
```

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**Related Stories:** Story 6.3 (CategoryLearningPrompt), Story 9.15 (SubcategoryLearningPrompt)

---

## Dev Agent Record

### Debug Log
**2025-12-16:** Story 9.16 implementation plan:
1. Add `isLoading` prop to CategoryLearningPrompt component with Loader2 icon
2. Add `isLoading` prop to SubcategoryLearningPrompt component with same pattern
3. Add `savingPreference` translation key in both EN and ES
4. Add `savingMappings` state in EditView.tsx
5. Update confirm handlers to set/clear loading state
6. Pass isLoading to both prompt components

### Completion Notes
**2025-12-16:** Story 9.16 completed successfully.

**Implementation Details:**
- Added `isLoading` prop (default false) to both learning prompt components
- Imported `Loader2` from lucide-react in both components
- Confirm button now shows spinner + "Saving..." text when loading
- Both buttons disabled during loading with proper visual feedback (opacity + cursor)
- Added `savingMappings` state to EditView.tsx
- Wrapped async operations in setSavingMappings(true/false) with try/finally
- Translation keys added: `savingPreference: "Saving..."` (EN), `savingPreference: "Guardando..."` (ES)

**Testing:**
- All 857 unit tests pass
- Build succeeds without TypeScript errors

---

## File List

| File | Status | Description |
|------|--------|-------------|
| src/components/CategoryLearningPrompt.tsx | Modified | Added isLoading prop, Loader2 import, button loading state |
| src/components/SubcategoryLearningPrompt.tsx | Modified | Added isLoading prop, Loader2 import, button loading state |
| src/views/EditView.tsx | Modified | Added savingMappings state, loading handlers, pass isLoading to prompts |
| src/utils/translations.ts | Modified | Added savingPreference translation key (EN + ES) |

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted - Bug fix for duplicate transaction creation |
| 2025-12-16 | 1.1 | Story completed - All ACs satisfied, tests pass |
| 2025-12-16 | 1.2 | Senior Developer Review (AI) - APPROVED |

---

## Senior Developer Review (AI)

### Reviewer: Gabe
### Date: 2025-12-16
### Outcome: **APPROVE** ✅

This bug fix implementation is well-executed, follows established patterns, and completely addresses the reported issue of duplicate transactions from rapid button clicks.

---

### Summary

The implementation adds a loading state to the "Yes, Remember" buttons in both `CategoryLearningPrompt` and `SubcategoryLearningPrompt` components to prevent duplicate saves during async operations. The fix uses the standard pattern (Loader2 spinner + disabled buttons) consistent with the rest of the codebase.

---

### Key Findings

**No blocking issues found.** Implementation is clean and complete.

---

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | "Yes, Remember" button shows loading spinner when clicked | IMPLEMENTED | CategoryLearningPrompt.tsx:261-265, SubcategoryLearningPrompt.tsx:245-249 |
| AC #2 | Both buttons disabled during async operation | IMPLEMENTED | CategoryLearningPrompt.tsx:257,274 - Both have `disabled={isLoading}` |
| AC #3 | Button text changes to "Saving..." during loading | IMPLEMENTED | CategoryLearningPrompt.tsx:264, SubcategoryLearningPrompt.tsx:248 |
| AC #4 | Fix applies to both prompts | IMPLEMENTED | Both components have identical loading patterns |
| AC #5 | Translations in EN and ES | IMPLEMENTED | translations.ts:195 (EN), :390 (ES) |
| AC #6 | Existing tests pass | IMPLEMENTED | All 857 unit tests pass, TypeScript compiles |

**Summary: 6 of 6 acceptance criteria fully implemented**

---

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Add `isLoading` prop to CategoryLearningPrompt | [x] | ✅ VERIFIED | CategoryLearningPrompt.tsx:39, :75 |
| Add `isLoading` prop to SubcategoryLearningPrompt | [x] | ✅ VERIFIED | SubcategoryLearningPrompt.tsx:39, :59 |
| Implement loading state (spinner + text) | [x] | ✅ VERIFIED | CategoryLearningPrompt.tsx:261-268 |
| Disable both buttons during loading | [x] | ✅ VERIFIED | CategoryLearningPrompt.tsx:257,274 |
| Add translation key (EN + ES) | [x] | ✅ VERIFIED | translations.ts:195, :390 |
| Update EditView.tsx with loading state | [x] | ✅ VERIFIED | EditView.tsx:165, :425-439, :459-474, :1046, :1058 |
| Verify no duplicate saves | [x] | ✅ VERIFIED | Buttons disabled + try/finally pattern |

**Summary: 7 of 7 completed tasks verified, 0 questionable, 0 falsely marked**

---

### Test Coverage and Gaps

- ✅ All 857 unit tests pass
- ✅ TypeScript type-check passes
- ⚠️ **Advisory:** No specific unit tests for the loading state behavior were added (existing tests cover basic functionality)

---

### Architectural Alignment

- ✅ Follows existing button loading pattern (e.g., PWASettingsSection)
- ✅ Uses established Lucide React `Loader2` icon
- ✅ Proper i18n via translation keys
- ✅ TypeScript typing with optional props and defaults

---

### Security Notes

- ✅ No security concerns - UI-only bug fix
- ✅ No new attack vectors introduced
- ✅ No API changes or user input handling modifications

---

### Best-Practices and References

- [React Loading Button Pattern](https://react.dev/reference/react/useState) - Standard useState for loading state
- [Lucide React Icons](https://lucide.dev/icons/loader-2) - Loader2 with animate-spin
- [WCAG 2.1 - Disabled Controls](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html) - Proper visual feedback for disabled state

---

### Action Items

**Code Changes Required:**
_None - all requirements met_

**Advisory Notes:**
- Note: Consider adding specific unit tests for loading state behavior in future testing improvements (not blocking)
- Note: The same loading pattern could be applied to LearnMerchantDialog if needed in future stories
