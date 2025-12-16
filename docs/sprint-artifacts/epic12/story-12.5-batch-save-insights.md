# Story 12.5: Batch Save & Insights

**Epic:** Epic 12 - Batch Mode
**Status:** Draft
**Story Points:** 3
**Dependencies:** Story 12.3 (Batch Review Queue), Epic 10 Insight Engine

---

## User Story

As a **user who just saved a batch of receipts**,
I want **to see a summary insight about my batch**,
So that **I get immediate value and context from my batch entry**.

---

## Acceptance Criteria

- [ ] **AC #1:** "Guardar todo" saves all valid receipts atomically
- [ ] **AC #2:** Progress indicator during batch save
- [ ] **AC #3:** Aggregate batch insight shown after save
- [ ] **AC #4:** Insight shows: total amount, receipt count, top category
- [ ] **AC #5:** Insight integrates with Insight Engine (Epic 10)
- [ ] **AC #6:** "Ver detalles" option to see individual receipts
- [ ] **AC #7:** Celebration animation for large batches (5+)
- [ ] **AC #8:** Navigate to home after dismissing insight

---

## Tasks / Subtasks

### Task 1: Implement Batch Save Logic (1h)
- [ ] Save all receipts in transaction or batched writes
- [ ] Handle partial failures gracefully
- [ ] Track successful vs failed saves
- [ ] Deduct credits (from Story 12.4)
- [ ] Return save results

### Task 2: Create Save Progress UI (0.5h)
- [ ] Show saving progress: "Guardando... (3/5)"
- [ ] Progress bar or spinner
- [ ] Disable UI during save
- [ ] Handle cancellation (not recommended mid-save)

### Task 3: Create Batch Insight Component (1h)
- [ ] Create `src/components/BatchInsight.tsx`
- [ ] Design insight display:
  ```
  ┌─────────────────────────────────────────┐
  │                 🎉                       │
  │                                         │
  │  ¡5 boletas guardadas!                  │
  │                                         │
  │  Total: $123.450                        │
  │                                         │
  │  📊 Tu categoría top fue Supermercado   │
  │     con $78.990 (64%)                   │
  │                                         │
  │  💡 Tip: Revisa tu resumen semanal      │
  │     para ver tendencias.                │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │         Continuar               │    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │      [Ver boletas guardadas]            │
  └─────────────────────────────────────────┘
  ```
- [ ] Calculate aggregate statistics

### Task 4: Generate Batch-Specific Insights (0.5h)
- [ ] Extend Insight Engine for batch context:
  ```typescript
  interface BatchInsightContext {
    receipts: Transaction[];
    totalAmount: number;
    categories: CategoryBreakdown[];
  }
  ```
- [ ] Insight types for batches:
  - Total amount saved
  - Top category in batch
  - Largest single receipt
  - Category diversity

### Task 5: Implement Celebration Animation (0.5h)
- [ ] Confetti for 5+ receipts
- [ ] Respect `prefers-reduced-motion`
- [ ] Short duration: 1.5 seconds
- [ ] Non-blocking (user can dismiss)

### Task 6: Implement Navigation (0.25h)
- [ ] "Continuar" → Home view
- [ ] "Ver boletas guardadas" → Receipts view filtered to today
- [ ] Clear batch state after navigation

### Task 7: Testing (0.25h)
- [ ] Unit tests for batch save
- [ ] Unit tests for batch insight generation
- [ ] Test celebration animation trigger
- [ ] Test navigation after save

---

## Technical Summary

Batch Save & Insights completes the batch flow by providing aggregate feedback on the batch entry. This reinforces the value of batch processing and connects to the broader Insight Engine.

**Flow:**
```
Batch Review → "Guardar todo" →
  Save progress indicator →
  All saved successfully →
  Batch insight + celebration →
  "Continuar" → Home
```

**Batch Insight Generation:**
- Aggregate total from all saved receipts
- Identify top category by amount
- Generate contextual tip/insight
- Connect to weekly summary if available

---

## Project Structure Notes

- **Files to create:**
  - `src/components/BatchInsight.tsx`

- **Files to modify:**
  - `src/hooks/useBatchReview.ts` - Add save logic
  - `src/services/insightEngine.ts` - Add batch insight generation
  - `src/views/BatchReviewView.tsx` - Show insight after save

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 12.3, Epic 10 Insight Engine

---

## Key Code References

**Batch Insight Generation:**
```typescript
// src/services/insightEngine.ts
class InsightEngine {
  generateBatchInsight(context: BatchInsightContext): BatchInsight {
    const { receipts, totalAmount, categories } = context;

    const topCategory = categories.reduce((max, cat) =>
      cat.amount > max.amount ? cat : max
    );

    const insights: string[] = [];

    // Main insight: Top category
    insights.push(
      `Tu categoría top fue ${topCategory.name} con ${formatCurrency(topCategory.amount)} (${topCategory.percentage}%)`
    );

    // Secondary: Largest receipt
    const largest = receipts.reduce((max, r) =>
      r.total > max.total ? r : max
    );
    if (receipts.length > 1) {
      insights.push(
        `La boleta más grande fue ${largest.merchant} con ${formatCurrency(largest.total)}`
      );
    }

    return {
      title: `¡${receipts.length} boletas guardadas!`,
      totalAmount,
      primaryInsight: insights[0],
      secondaryInsight: insights[1],
      tip: 'Revisa tu resumen semanal para ver tendencias.',
      celebrationLevel: receipts.length >= 5 ? 'high' : 'low'
    };
  }
}
```

**Batch Save Function:**
```typescript
// In useBatchReview.ts
const saveAll = async (): Promise<SaveResult> => {
  setIsSaving(true);
  const validReceipts = receipts.filter(r => r.status !== 'error');
  const results: { success: boolean; receipt: BatchReceipt }[] = [];

  for (let i = 0; i < validReceipts.length; i++) {
    setSaveProgress((i + 1) / validReceipts.length);

    try {
      await saveTransaction(validReceipts[i].scanResult);
      results.push({ success: true, receipt: validReceipts[i] });
    } catch (error) {
      results.push({ success: false, receipt: validReceipts[i] });
    }
  }

  const successfulSaves = results.filter(r => r.success);

  // Deduct credits
  if (successfulSaves.length > 0) {
    await creditService.deductCredits(successfulSaves.length);
  }

  // Generate batch insight
  const insight = insightEngine.generateBatchInsight({
    receipts: successfulSaves.map(r => r.receipt.scanResult),
    totalAmount: successfulSaves.reduce((sum, r) => sum + r.receipt.scanResult.total, 0),
    categories: calculateCategories(successfulSaves)
  });

  setIsSaving(false);
  return { savedCount: successfulSaves.length, insight };
};
```

---

## UI Specifications

**Save Progress:**
- Modal overlay during save
- Spinner + "Guardando... (X/Y)"
- Non-dismissible during operation

**Batch Insight:**
- Full screen or modal
- Celebration emoji prominent
- Total amount in large font
- Primary insight with category emoji
- Secondary insight optional
- Tip in lighter gray text
- Primary action: "Continuar"
- Secondary action: "Ver boletas" link

**Celebration Animation:**
- Confetti: 20 particles, 1.5s duration
- Only for 5+ receipts
- Respect motion preferences

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 12 Batch Insights
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Reward systems

---

## Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Batch save completes successfully
- [ ] Progress indicator works
- [ ] Batch insight shows aggregate data
- [ ] Celebration for 5+ receipts
- [ ] Navigation works correctly
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
| 2025-12-16 | 1.0 | Story drafted from Epic 12 definition |
