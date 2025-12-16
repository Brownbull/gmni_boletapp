# Story 9.12: Subcategory Learning & Management

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** draft
**Story Points:** 5
**Dependencies:** Story 6.5 (Category Mappings UI), Story 9.7 (Merchant Mappings UI)

---

## User Story

As a **user**,
I want **to view, edit, and learn item subcategories during receipt scanning**,
So that **future scans automatically apply my preferred subcategory classifications**.

---

## Background

The AI already extracts `subcategory` for each item (e.g., "Dairy" for milk, "Produce" for apples). Currently:
- ✅ Subcategories are stored in Firestore with transactions
- ✅ Subcategories are displayed in CategoryBadge (read-only)
- ✅ Analytics uses subcategories for drill-down navigation
- ❌ Users cannot edit subcategories during scan/edit
- ❌ No subcategory learning/mapping system exists
- ❌ No Settings UI for managing subcategory mappings

This story adds the full subcategory lifecycle: display → edit → learn → auto-apply → manage.

---

## Acceptance Criteria

- [ ] **AC #1:** Subcategory displayed alongside category in EditView item list
- [ ] **AC #2:** Subcategory editable when editing an item (free-form text input)
- [ ] **AC #3:** Subcategory changes tracked with `subcategorySource` field (scan | learned | user)
- [ ] **AC #4:** Learning prompt asks to remember subcategory when user changes it
- [ ] **AC #5:** Learned subcategories auto-apply on subsequent scans (same item name)
- [ ] **AC #6:** "Learned Subcategories" section added to Settings
- [ ] **AC #7:** Settings UI allows view, edit, and delete of subcategory mappings
- [ ] **AC #8:** Subcategory mappings show usage count
- [ ] **AC #9:** Theme-aware styling (light/dark modes)
- [ ] **AC #10:** WCAG 2.1 Level AA accessibility compliance

---

## Tasks / Subtasks

### Phase 1: Data Model & Service Layer
- [ ] Add `subcategorySource?: CategorySource` to `TransactionItem` type
- [ ] Create `src/types/subcategoryMapping.ts` with `SubcategoryMapping` interface
- [ ] Create `src/services/subcategoryMappingService.ts` with CRUD operations
  - [ ] `saveSubcategoryMapping()`
  - [ ] `getSubcategoryMappings()`
  - [ ] `subscribeToSubcategoryMappings()`
  - [ ] `deleteSubcategoryMapping()`
  - [ ] `updateSubcategoryMappingTarget()`
  - [ ] `incrementSubcategoryMappingUsage()`
- [ ] Create `src/hooks/useSubcategoryMappings.ts` hook

### Phase 2: EditView Integration
- [ ] Add subcategory display in EditView item cards (AC: #1)
- [ ] Add subcategory input field in item edit form (AC: #2)
- [ ] Track subcategory changes for learning prompt
- [ ] Update CategoryBadge to show subcategorySource indicator

### Phase 3: Learning Prompt
- [ ] Extend CategoryLearningPrompt to handle subcategories (AC: #4)
  - Option A: Combined prompt for category + subcategory
  - Option B: Separate prompt for subcategory only
- [ ] Save subcategory mappings when user confirms learning
- [ ] Auto-apply learned subcategories during scan processing (AC: #5)

### Phase 4: Settings UI
- [ ] Create `src/components/SubcategoryMappingsList.tsx` (AC: #6, #7, #8)
  - [ ] Follow MerchantMappingsList pattern
  - [ ] Display: `"item" → Subcategory` format
  - [ ] Show usage count
  - [ ] Edit and delete buttons with modals
- [ ] Add "Learned Subcategories" section to SettingsView
- [ ] Wire up through App.tsx

### Phase 5: Translations & Testing
- [ ] Add EN/ES translations for all new UI strings
- [ ] Create unit tests for `subcategoryMappingService.ts`
- [ ] Create unit tests for `useSubcategoryMappings.ts`
- [ ] Create unit tests for `SubcategoryMappingsList.tsx`
- [ ] Update EditView tests for subcategory editing
- [ ] Run full test suite and verify

---

## Technical Summary

### Data Model

**SubcategoryMapping (Firestore: `subcategory_mappings`):**
```typescript
interface SubcategoryMapping {
  id: string;
  originalItem: string;      // e.g., "LECHE ENTERA"
  normalizedItem: string;    // e.g., "leche entera"
  targetSubcategory: string; // e.g., "Dairy"
  confidence: number;        // 1.0 for user, 0.8 for AI
  source: 'user' | 'ai';
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Extended TransactionItem:**
```typescript
interface TransactionItem {
  // ... existing fields
  category?: ItemCategory | string;
  subcategory?: string;
  categorySource?: CategorySource;
  subcategorySource?: CategorySource; // NEW
}
```

### UI Layout

**EditView Item Card (expanded):**
```
┌─────────────────────────────────────────────────┐
│ LECHE ENTERA                          $1,290   │
│ [Dairy & Eggs] [Dairy] [Learned ✓]             │
│   ↑ category     ↑ subcategory   ↑ indicator   │
└─────────────────────────────────────────────────┘
```

**EditView Item Edit Form:**
```
┌─────────────────────────────────────────────────┐
│ Name:     [LECHE ENTERA               ]        │
│ Price:    [$1,290                     ]        │
│ Category: [Dairy & Eggs          ▼   ]        │
│ Subcategory: [Dairy              ▼   ]  ← NEW │
└─────────────────────────────────────────────────┘
```

**Settings - Learned Subcategories:**
```
┌─────────────────────────────────────────────────┐
│ 📑 Learned Subcategories                        │
├─────────────────────────────────────────────────┤
│ "LECHE ENTERA" → Dairy              (5x)       │
│                              [Edit] [Delete]    │
├─────────────────────────────────────────────────┤
│ "MANZANAS" → Produce                (3x)       │
│                              [Edit] [Delete]    │
└─────────────────────────────────────────────────┘
```

### Integration Points

1. **Scan Flow:** After AI extraction, check for learned subcategory mappings
2. **Edit Flow:** Track subcategory changes, prompt to learn
3. **Settings:** Full CRUD management for subcategory mappings
4. **Analytics:** Subcategory already used in drill-down (no changes needed)

---

## Project Structure Notes

- **Files created:**
  - `src/types/subcategoryMapping.ts`
  - `src/services/subcategoryMappingService.ts`
  - `src/hooks/useSubcategoryMappings.ts`
  - `src/components/SubcategoryMappingsList.tsx`
  - `tests/unit/subcategoryMappingService.test.ts`
  - `tests/unit/components/SubcategoryMappingsList.test.tsx`
- **Files modified:**
  - `src/types/transaction.ts` - Add subcategorySource
  - `src/views/EditView.tsx` - Add subcategory edit field
  - `src/views/SettingsView.tsx` - Add subcategory mappings section
  - `src/App.tsx` - Wire up subcategory mappings
  - `src/utils/translations.ts` - Add translations
  - `src/components/CategoryBadge.tsx` - Update to show subcategorySource
  - `src/components/CategoryLearningPrompt.tsx` - Extend for subcategory learning

---

## Key Code References

**Existing Patterns to Follow:**
- `src/types/categoryMapping.ts` - Data model pattern
- `src/services/categoryMappingService.ts` - Service layer pattern
- `src/hooks/useCategoryMappings.ts` - Hook pattern
- `src/components/CategoryMappingsList.tsx` - Settings UI pattern
- `src/components/MerchantMappingsList.tsx` - Updated pattern with edit

---

## Design Decisions

### Q: Should category and subcategory be learned together or separately?

**Recommendation: Separately**

Reasoning:
- Users may want to change subcategory without changing category
- Different items may have same category but different subcategories
- Simpler UX - one learning prompt per change type
- Follows existing pattern (category learning is separate from merchant learning)

### Q: Should subcategory be free-form or from a predefined list?

**Recommendation: Free-form with suggestions**

Reasoning:
- AI already returns free-form subcategories
- Users may have custom subcategory names
- Provide autocomplete suggestions from previously used subcategories
- This matches how ItemCategory is currently implemented (string union or free-form)

### Q: Where should "Learned Subcategories" appear in Settings?

**Recommendation: After "Learned Groups" (Categories), before "Learned Merchants"**

Layout:
1. Learned Groups (Categories)
2. Learned Subcategories ← NEW
3. Learned Merchants

This follows the hierarchy: Store Category → Item Category → Subcategory → Merchant

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**Architecture:** [architecture-epic9.md](./architecture-epic9.md)
**Related Stories:**
- Story 6.5 (Category Mappings UI)
- Story 9.7 (Merchant Mappings UI)
- Story 9.2 (TransactionItem category fields)

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-13 | 1.0 | Story drafted |
