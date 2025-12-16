# Story 11.2: Quick Save Card Component

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Draft
**Story Points:** 5
**Dependencies:** Story 11.1 (One Image = One Transaction)

---

## User Story

As a **user**,
I want **to see a summary card after scanning with Accept/Edit options**,
So that **I can save my receipt in under 15 seconds when the AI is accurate**.

---

## Acceptance Criteria

- [ ] **AC #1:** Quick Save Card appears after successful scan completion
- [ ] **AC #2:** Card displays: merchant name, total amount, item count, detected category
- [ ] **AC #3:** Primary button "✓ Guardar" saves immediately with insight toast
- [ ] **AC #4:** Secondary button "Editar →" navigates to full Edit view
- [ ] **AC #5:** Quick Save shown when AI confidence >= 85%
- [ ] **AC #6:** Lower confidence scans go directly to Edit view
- [ ] **AC #7:** Card is dismissible (cancel scan)
- [ ] **AC #8:** Card shows category emoji matching detected category
- [ ] **AC #9:** Save completes in <2 seconds from button tap

---

## Tasks / Subtasks

### Task 1: Create Quick Save Card Component (1.5h)
- [ ] Create `src/components/QuickSaveCard.tsx`
- [ ] Design card layout:
  ```
  ┌─────────────────────────────────────────┐
  │  🛒 Líder                               │
  │                                         │
  │  $24.990           12 items             │
  │  Supermercado                           │
  │                                         │
  │  ┌─────────────┐  ┌─────────────┐      │
  │  │ ✓ Guardar   │  │  Editar →   │      │
  │  └─────────────┘  └─────────────┘      │
  │                                         │
  │           [Cancelar]                    │
  └─────────────────────────────────────────┘
  ```
- [ ] Style with Tailwind (match app design system)
- [ ] Support dark mode

### Task 2: Implement Confidence Check Logic (0.5h)
- [ ] Create `shouldShowQuickSave(scanResult)` function
- [ ] Threshold: confidence >= 0.85
- [ ] Additional check: all required fields present (merchant, total)
- [ ] Return false if any validation fails

### Task 3: Integrate Quick Save into Scan Flow (1h)
- [ ] After scan completion, evaluate confidence
- [ ] High confidence: show Quick Save Card
- [ ] Low confidence: navigate to Edit view
- [ ] Wire up "Guardar" button to save flow
- [ ] Wire up "Editar" button to Edit view navigation

### Task 4: Implement Quick Save Action (1h)
- [ ] "Guardar" button triggers immediate save
- [ ] Save transaction to Firestore
- [ ] Show insight toast (from Epic 10)
- [ ] Return to home/receipts view
- [ ] Handle save errors gracefully

### Task 5: Implement Cancel Action (0.25h)
- [ ] "Cancelar" discards scan result
- [ ] Return to scan view or home
- [ ] Optional: confirm discard for filled data

### Task 6: Category Emoji Display (0.25h)
- [ ] Map category to emoji (reuse existing mapping)
- [ ] Display emoji next to category name
- [ ] Handle unknown categories gracefully

### Task 7: Accessibility & Localization (0.5h)
- [ ] Add aria labels to buttons
- [ ] Add translations to translations.ts
- [ ] Support keyboard navigation
- [ ] Test with screen reader

### Task 8: Testing (0.5h)
- [ ] Unit tests for QuickSaveCard component
- [ ] Unit tests for confidence check logic
- [ ] Integration test for Quick Save → save flow
- [ ] Test low confidence → Edit view routing

---

## Technical Summary

The Quick Save Card is the centerpiece of the scan flow optimization. It reduces the 42-74 second flow to 12-14 seconds by allowing users to accept accurate scans with a single tap.

**Flow:**
```
Scan → AI Processing → Confidence Check →
  ≥85%: Show Quick Save Card
  <85%: Go to Edit View

Quick Save Card →
  "Guardar": Save → Insight Toast → Home
  "Editar": Navigate to Edit View
  "Cancelar": Discard → Home/Scan
```

**Confidence Scoring:**
- AI returns confidence score with scan result
- Score reflects: merchant extraction accuracy, total parsing, field completeness
- 85% threshold balances speed vs accuracy

---

## Project Structure Notes

- **Files to create:**
  - `src/components/QuickSaveCard.tsx`
  - `src/components/QuickSaveCard.test.tsx`
  - `src/utils/confidenceCheck.ts`

- **Files to modify:**
  - `src/views/ScanView.tsx` - Route to Quick Save Card
  - `src/App.tsx` - Add Quick Save Card state management
  - `src/utils/translations.ts` - Add Quick Save strings

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 11.1 (single image flow)

---

## Key Code References

**From habits loops.md - Quick Save Mode:**
```typescript
interface QuickSaveCard {
  merchant: string;
  total: number;
  itemCount: number;
  category: string;
  confidence: number; // 0-1, AI confidence score
  showQuickSave: boolean; // true if confidence > 0.85
}

function shouldShowQuickSave(
  scanResult: ScanResult,
  merchantHistory: MerchantHistory
): boolean {
  const hasHighConfidence = scanResult.confidence > 0.85;
  const isTrustedMerchant = merchantHistory.editRate < 0.1;
  const hasAllFields = scanResult.merchant && scanResult.total && scanResult.date;

  return hasHighConfidence && (isTrustedMerchant || merchantHistory.count === 0) && hasAllFields;
}
```

---

## UI Specifications

**Card Dimensions:**
- Width: 100% with 16px horizontal margins
- Max width: 400px
- Padding: 24px

**Buttons:**
- Primary (Guardar): `bg-green-600 text-white`, full width
- Secondary (Editar): `border border-gray-300`, full width
- Cancel: Text link, centered below

**Typography:**
- Merchant name: 20px, font-semibold
- Total: 32px, font-bold
- Item count: 14px, text-gray-500
- Category: 14px, with emoji

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 11 Quick Save scope
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 2.2 Quick Save Mode

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] Quick Save Card renders correctly
- [ ] High confidence triggers Quick Save
- [ ] Low confidence routes to Edit
- [ ] Save action completes in <2s
- [ ] Insight toast appears after save
- [ ] Tests passing
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

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
