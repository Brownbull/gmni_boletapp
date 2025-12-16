# Story 9.16: Learning Prompt Loading State (Bug Fix)

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** Drafted
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

- [ ] **AC #1:** "Yes, Remember" button shows loading spinner when clicked
- [ ] **AC #2:** Both "Yes, Remember" and "Skip" buttons are disabled during async operation
- [ ] **AC #3:** Button text changes to "Saving..." (or equivalent i18n key) during loading
- [ ] **AC #4:** Fix applies to both `CategoryLearningPrompt` and `SubcategoryLearningPrompt`
- [ ] **AC #5:** Translations added for "saving" state in both EN and ES
- [ ] **AC #6:** Existing tests pass

---

## Tasks / Subtasks

- [ ] Add `isLoading` prop to `CategoryLearningPrompt` component
- [ ] Add `isLoading` prop to `SubcategoryLearningPrompt` component
- [ ] Implement loading state on confirm button (spinner + "Saving..." text)
- [ ] Disable both confirm and skip buttons during loading
- [ ] Add `saving` translation key in EN and ES
- [ ] Update `EditView.tsx` to pass loading state and manage it during async operations
- [ ] Verify no duplicate saves can occur

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

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted - Bug fix for duplicate transaction creation |
