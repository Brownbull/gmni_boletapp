# Story 10a.3: Nav Tab Rename - Receipts to Insights

**Story Points:** 1
**Status:** Ready for Development
**Dependencies:** None

---

## User Story

As a **user viewing the bottom navigation**,
I want **to see an "Insights" tab instead of "Receipts"**,
So that **I know where to find my insight history**.

---

## Acceptance Criteria

### AC1: Tab Icon Changed
**Given** I view the bottom navigation bar
**When** I look at the fourth tab (was Receipts)
**Then** I see a Lightbulb icon (not ListIcon)

### AC2: Tab Label Changed
**Given** I view the bottom navigation bar
**When** I look at the fourth tab
**Then** the label reads "Insights" (English) or "Ideas" (Spanish)

### AC3: Tab Navigation Works
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
- [ ] Nav renders Lightbulb icon for Insights tab
- [ ] Correct label displayed in EN/ES

### E2E Tests
- [ ] Tapping Insights tab navigates correctly

---

## Definition of Done
- [ ] All ACs verified
- [ ] Unit tests passing
- [ ] Code review approved
