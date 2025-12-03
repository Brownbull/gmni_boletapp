# Story 6.3: Category Learning Prompt

**Epic:** Epic 6 - Smart Category Learning
**Status:** Done
**Story Points:** 2

---

## User Story

As a **user editing a transaction's scanned data**,
I want **to be asked if I want the app to remember my corrections**,
So that **future similar items are automatically categorized correctly**.

---

## Acceptance Criteria

- [x] **AC #1:** When user changes any scanned data (category, merchant, item names), a prompt appears
- [x] **AC #2:** Prompt shows item name and current category clearly
- [x] **AC #3:** "Yes, Remember" button saves the category mapping
- [x] **AC #4:** "Not Now" button dismisses without saving
- [x] **AC #5:** Success toast confirms "Got it! I'll remember this"
- [x] **AC #6:** Prompt is accessible (focus trap, keyboard navigation)
- [x] **AC #7:** Translations added for English and Spanish
- [x] **AC #8:** Item prices, add/remove items, alias, date, and total changes do NOT trigger the prompt

---

## Tasks / Subtasks

- [x] Create `src/components/CategoryLearningPrompt.tsx` (AC: #1, #2, #3, #4)
  - [x] Modal with item name and category display
  - [x] "Yes, Remember" button with save action
  - [x] "Not Now" button with dismiss action
  - [x] Proper focus management (AC: #6)
- [x] Modify `src/views/EditView.tsx` (AC: #1, #8)
  - [x] Add state for showing prompt
  - [x] Track original values: category, merchant, items (names/prices)
  - [x] Trigger prompt when any tracked field changes
  - [x] Do NOT trigger on alias or date changes
  - [x] Pass item name and category to prompt
- [x] Add success toast on save (AC: #5)
- [x] Add translations to `src/utils/translations.ts` (AC: #7)
- [x] Create `tests/integration/category-learning.test.tsx`
- [x] Run all tests and verify passing

---

## Technical Summary

This story adds the UI for category learning with expanded triggers:

1. **Prompt Component:**
   - Simple modal with clear message
   - Two action buttons (confirm/skip)
   - Accessible with focus trap

2. **Change Detection (Expanded Scope):**
   - **TRIGGERS prompt:** category, merchant, item names
   - **DOES NOT trigger:** item prices, add/remove items, alias, date, total
   - Uses ref to track original values on mount
   - Compares current values against original on save

3. **User Flow:**
   - Edit transaction → Change scanned data → Save
   - Prompt: "Remember [item] as [category]?"
   - Confirm → mapping saved, toast shown
   - Skip → no action, prompt closes

---

## Project Structure Notes

- **Files to create:**
  - `src/components/CategoryLearningPrompt.tsx`
  - `tests/integration/category-learning.test.tsx`
- **Files to modify:**
  - `src/views/EditView.tsx`
  - `src/utils/translations.ts`
  - `src/App.tsx`
- **Expected test locations:** `tests/integration/`
- **Estimated effort:** 2 story points
- **Prerequisites:** Story 6.1 (useCategoryMappings hook)

---

## Key Code References

**Existing Patterns:**
- `src/components/UpgradePromptModal.tsx` - Modal pattern from Epic 5
- `src/views/EditView.tsx` - Edit flow integration point
- `src/utils/translations.ts` - i18n pattern

**Translation Keys (from Tech-Spec):**
```typescript
learnCategoryTitle: 'Learn This Category?',
learnCategoryMessage: 'Remember "{item}" as {category} for future receipts?',
learnCategoryConfirm: 'Yes, Remember',
learnCategorySkip: 'Not Now',
learnCategorySuccess: 'Got it! I\'ll remember this.',
```

---

## Context References

**Tech-Spec:** [tech-spec.md](./tech-spec.md) - Primary context document containing:
- ADR-015: Category Override Capture Strategy
- UI prompt pattern specification
- Translation keys for EN/ES

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A - Clean implementation

### Completion Notes
- Implementation used EditView.tsx instead of TransactionDetailView.tsx (per actual codebase structure)
- **Scope expanded** per user request: Prompt now triggers on scanned data modification (category, merchant, item names), NOT just category changes
- Change detection uses useRef to track original values: `{ category, merchant, itemNames: string[] }`
- Item prices, add/remove items, alias, date, and total changes intentionally excluded from triggers
- Followed UpgradePromptModal.tsx accessibility patterns exactly
- App.tsx integrated useCategoryMappings hook and passes saveMapping to EditView
- All 40 integration tests pass covering all 8 acceptance criteria

### Files Modified
- `src/components/CategoryLearningPrompt.tsx` (created)
- `src/views/EditView.tsx` (modified - added prompt integration with expanded triggers)
- `src/App.tsx` (modified - added useCategoryMappings hook and props)
- `src/utils/translations.ts` (modified - added EN/ES translations)
- `tests/integration/category-learning.test.tsx` (created - 40 tests including expanded trigger coverage)
- `docs/sprint-artifacts/sprint-status.yaml` (modified - status updates)

### Test Results
- Unit tests: 184 passed
- Integration tests: 207 passed (includes 40 new category-learning tests)
- E2E tests: 31 passed, 9 failed (failures are pre-existing auth emulator issues, not related to Story 6.3)

---

## Senior Developer Review (AI)

**Reviewer:** Gabe
**Date:** 2025-12-03
**Outcome:** ✅ **APPROVE**

### Summary

Story 6.3 is a complete, well-implemented feature. All 8 acceptance criteria are verified with code evidence, all 16 tasks marked complete have been verified, and the implementation follows the Epic 6 tech-spec exactly. The code demonstrates excellent accessibility practices, proper error handling, and comprehensive test coverage (40 integration tests).

### Key Findings

**No HIGH severity issues found.**
**No MEDIUM severity issues found.**

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | Prompt appears on scanned data change | ✅ IMPLEMENTED | `EditView.tsx:120-168` |
| AC #2 | Shows item name and category | ✅ IMPLEMENTED | `CategoryLearningPrompt.tsx:163-218` |
| AC #3 | "Yes, Remember" saves mapping | ✅ IMPLEMENTED | `CategoryLearningPrompt.tsx:223-227`, `EditView.tsx:172-185` |
| AC #4 | "Not Now" dismisses without saving | ✅ IMPLEMENTED | `CategoryLearningPrompt.tsx:230-234`, `EditView.tsx:188-190` |
| AC #5 | Success toast confirms | ✅ IMPLEMENTED | `EditView.tsx:176-179`, `translations.ts:44,88` |
| AC #6 | Accessible (focus trap, keyboard) | ✅ IMPLEMENTED | `CategoryLearningPrompt.tsx:74-152` |
| AC #7 | EN/ES translations | ✅ IMPLEMENTED | `translations.ts:39-44,83-88` |
| AC #8 | Exclusions (prices, add/remove, alias, date, total) | ✅ IMPLEMENTED | `EditView.tsx:120-149`, tested lines 686-950 |

**Summary: 8 of 8 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| Create CategoryLearningPrompt.tsx | [x] | ✅ VERIFIED | File exists, 242 lines |
| Modal with item/category display | [x] | ✅ VERIFIED | Lines 163-218 |
| "Yes, Remember" button | [x] | ✅ VERIFIED | Lines 223-227 |
| "Not Now" button | [x] | ✅ VERIFIED | Lines 230-234 |
| Focus management | [x] | ✅ VERIFIED | Lines 74-140 |
| Modify EditView.tsx | [x] | ✅ VERIFIED | Lines 66-190 |
| Add prompt state | [x] | ✅ VERIFIED | Lines 69-71 |
| Track original values | [x] | ✅ VERIFIED | Lines 76-93 |
| Trigger on tracked field changes | [x] | ✅ VERIFIED | Lines 120-149 |
| Exclude alias/date triggers | [x] | ✅ VERIFIED | Lines 120-149 (only checks category, merchant, itemNames) |
| Pass props to prompt | [x] | ✅ VERIFIED | Lines 366-374 |
| Add success toast | [x] | ✅ VERIFIED | Lines 176-179 |
| Add translations | [x] | ✅ VERIFIED | EN: lines 39-44, ES: lines 83-88 |
| Create integration tests | [x] | ✅ VERIFIED | 952 lines, 40 tests |
| Run all tests passing | [x] | ✅ VERIFIED | 40/40 pass, 207 total integration tests pass |

**Summary: 16 of 16 tasks verified complete, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- **Integration Tests:** 40 tests covering all ACs ✅
- **Test Areas:** Prompt rendering, confirm/dismiss, accessibility, focus trap, keyboard nav, translations, toast
- **Expanded Trigger Tests:** Merchant change, item name change ✅
- **Non-Trigger Tests:** Price, add/remove items, alias, date, total ✅
- **No test gaps identified**

### Architectural Alignment

- ✅ Follows UpgradePromptModal.tsx accessibility patterns
- ✅ useCategoryMappings hook integrated in App.tsx (line 51)
- ✅ saveMapping function passed to EditView (line 455)
- ✅ Translation keys match tech-spec exactly
- ✅ useRef pattern for tracking original values (per React best practices)

### Security Notes

- ✅ No innerHTML or eval usage
- ✅ User auth required before saving (useCategoryMappings.ts:67-69)
- ✅ Firestore rules enforce user isolation (per ADR-014)
- ✅ Display-only component, no user-controlled HTML rendering

### Best-Practices and References

- WCAG 2.1 Level AA compliance for modal dialogs
- React focus management patterns
- Firestore security rules for user data isolation

### Action Items

**Code Changes Required:**
(None - all requirements met)

**Advisory Notes:**
- Note: Consider adding E2E tests for the full learning flow in a future story (login → edit → learn → verify saved)
- Note: The findMatch function in useCategoryMappings is a basic implementation; Story 6.2 will add full fuse.js fuzzy matching

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-03 | 1.0 | Story drafted |
| 2025-12-03 | 1.1 | Dev implementation complete - 40 integration tests passing |
| 2025-12-03 | 1.2 | Senior Developer Review (AI) - **APPROVED** |
