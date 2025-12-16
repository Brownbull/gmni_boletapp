# Story 9.16: Learning Prompt Loading State - Context

Status: drafted

## Story

As a **user**,
I want **the "Yes, Remember" button to show a loading state when pressed**,
So that **I don't accidentally create duplicate transactions by pressing the button multiple times**.

## Acceptance Criteria

1. **AC #1:** "Yes, Remember" button shows loading spinner when clicked
2. **AC #2:** Both "Yes, Remember" and "Skip" buttons are disabled during async operation
3. **AC #3:** Button text changes to "Saving..." (or equivalent i18n key) during loading
4. **AC #4:** Fix applies to both `CategoryLearningPrompt` and `SubcategoryLearningPrompt`
5. **AC #5:** Translations added for "saving" state in both EN and ES
6. **AC #6:** Existing tests pass

## Tasks / Subtasks

- [ ] Task 1: Add `isLoading` prop to CategoryLearningPrompt (AC: #1, #2, #4)
  - [ ] Add `isLoading?: boolean` prop to interface
  - [ ] Import `Loader2` icon from lucide-react
  - [ ] Show spinner on confirm button when loading
  - [ ] Disable both buttons when loading

- [ ] Task 2: Add `isLoading` prop to SubcategoryLearningPrompt (AC: #1, #2, #4)
  - [ ] Same changes as CategoryLearningPrompt
  - [ ] Maintain green color theme (vs blue for category)

- [ ] Task 3: Update button text during loading (AC: #3)
  - [ ] Change "Yes, Remember" to "Saving..." when `isLoading=true`
  - [ ] Use translation key `savingPreference`

- [ ] Task 4: Add translations (AC: #5)
  - [ ] Add `savingPreference: "Saving..."` to EN translations
  - [ ] Add `savingPreference: "Guardando..."` to ES translations

- [ ] Task 5: Update EditView to manage loading state (AC: #1, #2)
  - [ ] Add `savingMappings` state variable
  - [ ] Set `true` before calling async confirm handler
  - [ ] Set `false` after operation completes (success or error)
  - [ ] Pass `isLoading={savingMappings}` to both prompts

- [ ] Task 6: Verify all tests pass (AC: #6)
  - [ ] Run `npm run test:unit`
  - [ ] Run `npm run build`
  - [ ] Verify no regressions

## Dev Notes

### Root Cause Analysis

The bug occurs because:
1. User clicks "Yes, Remember" button
2. Async operation starts (saving mapping to Firestore)
3. Button remains clickable during async operation
4. User clicks button again (and again) before first operation completes
5. Each click triggers another full transaction save
6. Result: Multiple duplicate transactions created

### Existing Pattern to Follow

The `PWASettingsSection` component (if it exists) or other parts of the codebase show the pattern:

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

### Key Code Locations

**CategoryLearningPrompt.tsx (lines 251-257):**
```tsx
<button
  onClick={onConfirm}  // No loading state - THE BUG
  className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
  style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
>
  {t('learnCategoryConfirm')}
</button>
```

**SubcategoryLearningPrompt.tsx (lines 235-241):**
```tsx
<button
  onClick={onConfirm}  // Same bug
  className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
>
  {t('learnSubcategoryConfirm')}
</button>
```

### Implementation Approach

1. Add `isLoading` prop to both components
2. Update button JSX:
   ```tsx
   <button
     onClick={onConfirm}
     disabled={isLoading}
     className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
     style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
   >
     {isLoading ? (
       <>
         <Loader2 className="inline w-5 h-5 mr-2 animate-spin" />
         {t('savingPreference')}
       </>
     ) : (
       t('learnCategoryConfirm')
     )}
   </button>
   ```

3. In EditView, wrap async handlers:
   ```tsx
   const [savingMappings, setSavingMappings] = useState(false);

   const handleLearnConfirm = async () => {
     setSavingMappings(true);
     try {
       // existing confirm logic
     } finally {
       setSavingMappings(false);
     }
   };
   ```

### Project Structure Notes

**Files to modify:**
- `src/components/CategoryLearningPrompt.tsx`
- `src/components/SubcategoryLearningPrompt.tsx`
- `src/views/EditView.tsx`
- `src/utils/translations.ts`

**No new files needed** - this is a bug fix, not a new feature.

### References

- [Story 9.16 Definition](./story-9.16-learning-prompt-loading-state.md)
- [CategoryLearningPrompt.tsx](../../src/components/CategoryLearningPrompt.tsx)
- [SubcategoryLearningPrompt.tsx](../../src/components/SubcategoryLearningPrompt.tsx)
- [EditView.tsx](../../src/views/EditView.tsx)

### Learnings from Previous Stories

**From Story 6.3 (Category Learning Prompt):**
- The prompts are WCAG 2.1 AA compliant with focus trap
- Button styling uses CSS variables and gradients
- Translations required for both EN and ES

**From Story 9.15 (Subcategory Learning):**
- Green color theme (`#10b981`, `#059669`) for subcategory vs blue for category
- Both prompts follow the same structure and can share patterns

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Context file created | Claude Opus 4.5 |
