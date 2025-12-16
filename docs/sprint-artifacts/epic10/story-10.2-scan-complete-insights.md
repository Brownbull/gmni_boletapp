# Story 10.2: Scan Complete Insights

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 3
**Dependencies:** Story 10.1 (Insight Engine Core)

---

## User Story

As a **user**,
I want **to see a meaningful insight after every receipt scan**,
So that **I immediately understand the context of my purchase**.

---

## Acceptance Criteria

- [ ] **AC #1:** Contextual insight toast appears after every successful save
- [ ] **AC #2:** Toast displays: insight message, emoji, total amount saved
- [ ] **AC #3:** Toast auto-dismisses after 4 seconds
- [ ] **AC #4:** User can tap toast to dismiss immediately
- [ ] **AC #5:** User can tap "Ver más" to see insight details (optional expansion)
- [ ] **AC #6:** Insight priority: new merchant → biggest purchase → repeat category → merchant total
- [ ] **AC #7:** Graceful fallback to generic positive message if no insight available
- [ ] **AC #8:** Toast respects `prefers-reduced-motion` for animations
- [ ] **AC #9:** Toast meets WCAG 2.1 AA contrast requirements

---

## Tasks / Subtasks

### Task 1: Create Scan Complete Toast Component (1.5h)
- [ ] Create `src/components/ScanCompleteToast.tsx`
- [ ] Design toast layout:
  ```
  ┌─────────────────────────────────────────┐
  │  ✓ Guardado                      $24.990│
  │                                         │
  │  🔄 3ra boleta de Restaurante esta sem. │
  │                                         │
  │     [Ver más]              [Cerrar]     │
  └─────────────────────────────────────────┘
  ```
- [ ] Use Tailwind for styling (match existing design system)
- [ ] Support dark mode
- [ ] Add enter/exit animations (fade + slide up)

### Task 2: Implement Toast State Management (0.5h)
- [ ] Add toast state to appropriate context (or create ToastContext)
- [ ] Create `useInsightToast` hook:
  ```typescript
  const { showToast, hideToast, isVisible, toastData } = useInsightToast();
  ```
- [ ] Auto-dismiss timer (4 seconds default, configurable)
- [ ] Cancel timer on manual dismiss

### Task 3: Integrate Insight Engine with Scan Save Flow (1h)
- [ ] Hook into `handleSave` in scan flow
- [ ] After successful save:
  1. Generate insight using InsightEngine
  2. Show toast with insight
  3. Log insight shown for analytics
- [ ] Pass transaction and history context to InsightEngine

### Task 4: Implement Insight Priority Logic (0.5h)
- [ ] Priority order for Scan Complete context:
  1. **New merchant** (first time scanning this merchant)
  2. **Biggest purchase** (largest this week, min 3 purchases)
  3. **Repeat category** (same category multiple times today)
  4. **Merchant total** (running total at this merchant this month)
  5. **Fallback** generic: "Guardado en {category}"
- [ ] Implement `getScanCompleteInsight(transaction, history)`

### Task 5: Create "Ver más" Expansion (Optional) (0.5h)
- [ ] When user taps "Ver más":
  - Show additional context (e.g., trend chart snippet)
  - Or navigate to Analytics with relevant filter
- [ ] Keep expansion simple for MVP
- [ ] Can be enhanced in future iterations

### Task 6: Add Fallback Generic Messages (0.5h)
- [ ] Create fallback messages when no specific insight available:
  ```typescript
  const fallbackMessages = [
    { message: 'Guardado en {category}', emoji: '✓' },
    { message: 'Boleta guardada exitosamente', emoji: '✓' },
    { message: '{category} actualizado', emoji: '📊' }
  ];
  ```
- [ ] Rotate fallback messages for variety
- [ ] Ensure always positive/neutral tone

### Task 7: Accessibility Implementation (0.5h)
- [ ] Add `role="alert"` for screen reader announcement
- [ ] Ensure contrast ratio >= 4.5:1 (AA)
- [ ] Support keyboard dismiss (Escape key)
- [ ] Respect `prefers-reduced-motion`:
  - Reduced motion: Instant appear/disappear
  - Normal: Animated transitions

### Task 8: Testing (0.5h)
- [ ] Unit tests for ScanCompleteToast component
- [ ] Unit tests for insight priority logic
- [ ] Integration test for full scan → save → toast flow
- [ ] Accessibility audit with axe

---

## Technical Summary

This story implements the "Variable Reward" component of the habit loop - the scan complete insight toast that appears after every successful save. The insight provides immediate, contextual feedback that makes expense tracking feel meaningful.

**Key Design Decisions:**
1. **Always show something:** Never leave the user with just "Saved" - always provide context
2. **Prioritize relevance:** New merchant insights are most interesting (novelty)
3. **Time-boxed:** Auto-dismiss after 4s to not block workflow
4. **Accessible:** Screen reader friendly, respects motion preferences

**Toast Lifecycle:**
```
Save Receipt → Generate Insight (InsightEngine) → Show Toast →
Auto-dismiss (4s) OR User tap dismiss → Log analytics
```

---

## Project Structure Notes

- **Files to create:**
  - `src/components/ScanCompleteToast.tsx`
  - `src/components/ScanCompleteToast.test.tsx`
  - `src/hooks/useInsightToast.ts` (or integrate with existing toast system)

- **Files to modify:**
  - `src/App.tsx` or relevant scan flow component
  - `src/utils/translations.ts` - Add toast strings

- **Expected test locations:**
  - `tests/unit/components/ScanCompleteToast.test.tsx`

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 10.1 (Insight Engine Core)

---

## Key Code References

**From habits loops.md - Notification Logic:**
```typescript
// Priority order for Scan Complete insights
const priorityOrder = [
  'new_merchant',      // Priority 1: First time
  'biggest_purchase',  // Priority 2: Largest this week
  'repeat_category',   // Priority 3: Same day repeat
  'merchant_total',    // Priority 4: Running total
  'default'            // Priority 5: Generic fallback
];
```

**Existing Toast Pattern (if any):**
```typescript
// Check existing toast implementation in codebase
// Reuse pattern if available
```

**Insight Interface (from Story 10.1):**
```typescript
interface Insight {
  type: InsightType;
  message: string;
  emoji: string;
  confidence: number;
  priority: number;
}
```

---

## UI Specifications

**Toast Dimensions:**
- Width: 90% of screen (max 400px)
- Position: Bottom of screen, 16px margin
- Padding: 16px

**Colors (Light Mode):**
- Background: `bg-white` with shadow-lg
- Text: `text-gray-900`
- Amount: `text-green-600` (for saved amount)
- Emoji: Native emoji

**Colors (Dark Mode):**
- Background: `bg-gray-800`
- Text: `text-white`
- Amount: `text-green-400`

**Animation:**
```css
/* Enter */
transform: translateY(100%);
opacity: 0;
→
transform: translateY(0);
opacity: 1;
transition: 300ms ease-out;

/* Exit */
opacity: 0;
transition: 200ms ease-in;
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR11-FR16
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 1.1 Scan Complete Notification

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] Toast appears after every successful save
- [ ] Auto-dismiss works correctly
- [ ] Insight priority logic verified
- [ ] Fallback messages work
- [ ] Accessibility audit passed
- [ ] Unit tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
