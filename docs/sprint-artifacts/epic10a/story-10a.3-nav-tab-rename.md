# Story 10a.3: Nav Tab Rename - Receipts to Insights

**Story Points:** 1
**Status:** Done
**Dependencies:** None

---

## User Story

As a **user viewing the bottom navigation**,
I want **to see an "Insights" tab instead of "Receipts"**,
So that **I know where to find my insight history**.

---

## Acceptance Criteria

### AC1: Tab Icon Changed ✅
**Given** I view the bottom navigation bar
**When** I look at the fourth tab (was Receipts)
**Then** I see a Lightbulb icon (not ListIcon)

### AC2: Tab Label Changed ✅
**Given** I view the bottom navigation bar
**When** I look at the fourth tab
**Then** the label reads "Insights" (English) or "Ideas" (Spanish)

### AC3: Tab Navigation Works ✅
**Given** I tap the Insights tab
**When** the view changes
**Then** I navigate to the InsightsView (not HistoryView)

---

## Technical Notes

### Files to Modify
- `src/components/Nav.tsx` - Icon and label change
- `src/utils/translations.ts` - Add 'insights' translation key
- `src/App.tsx` - Update view routing (list → insights)

### Implementation Steps
1. In Nav.tsx, change `ListIcon` to `Lightbulb` import from lucide-react
2. Change `t('receipts')` to `t('insights')`
3. Change `setView('list')` to `setView('insights')`
4. Add translation key: `insights: { en: 'Insights', es: 'Ideas' }`
5. In App.tsx, update View type and routing

### Icon Reference
```tsx
import { Lightbulb } from 'lucide-react';
// ...
<Lightbulb size={24} strokeWidth={2} />
```

---

## Testing Requirements

### Unit Tests
- [x] Nav renders Lightbulb icon for Insights tab
- [x] Correct label displayed in EN/ES

### E2E Tests
- [ ] Tapping Insights tab navigates correctly

---

## Definition of Done
- [x] All ACs verified
- [x] Unit tests passing
- [x] Code review approved

---

## Tasks/Subtasks

- [x] Update Nav.tsx - change ListIcon to Lightbulb, update label and view
- [x] Add 'insights' translation key in translations.ts (EN: 'Insights', ES: 'Ideas')
- [x] Update App.tsx - change View type from 'list' to 'insights', update routing
- [x] Write unit tests for Nav component

---

## Dev Agent Record

### Implementation Plan
- Simple icon/label/routing change following existing Nav.tsx patterns
- Red-green-refactor: Write tests first, then implement

### Completion Notes
✅ **Implementation Complete (2025-12-21)**
- Changed `ListIcon` to `Lightbulb` import in Nav.tsx
- Updated tab to call `setView('insights')` instead of `setView('list')`
- Updated `getNavItemStyle` to check for 'insights' view
- Added translation key `insights` with EN: 'Insights', ES: 'Ideas'
- Updated App.tsx View type from 'list' to 'insights'
- Updated all routing references from 'list' to 'insights'
- Created comprehensive unit test suite (16 tests) covering:
  - AC#1: Lightbulb icon rendering
  - AC#2: EN/ES label display
  - AC#3: Navigation to 'insights' view
  - Active state styling

### Test Results
- **Unit Tests:** 1348 passing (including 16 new Nav tests)
- **Integration Tests:** 332 passing
- **TypeScript:** No errors

---

## File List

### Modified Files
- `src/components/Nav.tsx` - Icon change (ListIcon → Lightbulb), label change (receipts → insights), view change (list → insights)
- `src/utils/translations.ts` - Added 'insights' key (EN: 'Insights', ES: 'Ideas')
- `src/App.tsx` - Updated View type, changed all 'list' references to 'insights'

### New Files
- `tests/unit/components/Nav.test.tsx` - Unit tests for Nav component

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-21 | Implementation complete - icon, label, routing updated | AI Agent |
| 2025-12-21 | Unit tests added (16 tests) | AI Agent |
| 2025-12-21 | Status changed to Review | AI Agent |
| 2025-12-21 | Code review APPROVED - Status changed to Done | AI Agent |
