# Story 12.4: Credit Warning System

**Epic:** Epic 12 - Batch Mode
**Status:** Draft
**Story Points:** 3
**Dependencies:** Story 12.1 (Batch Capture UI)

---

## User Story

As a **user preparing to process a batch**,
I want **to see how many credits will be used before processing**,
So that **I can make an informed decision and avoid running out of credits**.

---

## Acceptance Criteria

- [ ] **AC #1:** Pre-batch warning shows credit cost before processing
- [ ] **AC #2:** Warning format: "Este lote usará X créditos. Tienes Y disponibles."
- [ ] **AC #3:** Processing blocked if insufficient credits
- [ ] **AC #4:** Clear indication when batch will exhaust remaining credits
- [ ] **AC #5:** "Continuar" and "Cancelar" options on warning dialog
- [ ] **AC #6:** Credits deducted per receipt on successful save (not on processing start)
- [ ] **AC #7:** Warning appears after "Procesar lote" but before actual processing

---

## Tasks / Subtasks

### Task 1: Create Credit Status Service (0.5h)
- [ ] Create `src/services/creditService.ts` (if not exists)
- [ ] Implement credit check:
  ```typescript
  interface CreditService {
    getAvailableCredits(): Promise<number>;
    checkSufficientCredits(required: number): Promise<boolean>;
    deductCredits(amount: number): Promise<void>;
  }
  ```
- [ ] Read from user's subscription/credit document

### Task 2: Create Credit Warning Dialog (1h)
- [ ] Create `src/components/CreditWarningDialog.tsx`
- [ ] Design warning UI:
  ```
  ┌─────────────────────────────────────────┐
  │  ⚠️ Uso de Créditos                     │
  │                                         │
  │  Este lote de 5 boletas usará:          │
  │                                         │
  │           5 créditos                    │
  │                                         │
  │  Créditos disponibles: 12               │
  │  Después del lote: 7 créditos           │
  │                                         │
  │  ┌─────────────┐  ┌─────────────┐      │
  │  │  Continuar  │  │   Cancelar  │      │
  │  └─────────────┘  └─────────────┘      │
  └─────────────────────────────────────────┘
  ```
- [ ] Localize strings

### Task 3: Implement Insufficient Credits State (0.5h)
- [ ] Different dialog when credits insufficient:
  ```
  ┌─────────────────────────────────────────┐
  │  ❌ Créditos Insuficientes              │
  │                                         │
  │  Necesitas 5 créditos pero solo         │
  │  tienes 3 disponibles.                  │
  │                                         │
  │  Puedes procesar hasta 3 boletas        │
  │  o comprar más créditos.                │
  │                                         │
  │  ┌─────────────┐  ┌─────────────┐      │
  │  │ Reducir lote│  │   Cancelar  │      │
  │  └─────────────┘  └─────────────┘      │
  │                                         │
  │       [Obtener más créditos]            │
  └─────────────────────────────────────────┘
  ```
- [ ] Link to credit purchase (if applicable)

### Task 4: Integrate Warning into Batch Flow (0.5h)
- [ ] "Procesar lote" triggers credit check first
- [ ] Show warning dialog before processing starts
- [ ] "Continuar" → begin parallel processing
- [ ] "Cancelar" → return to batch capture

### Task 5: Implement Credit Deduction on Save (0.5h)
- [ ] Deduct credits only on successful save
- [ ] One credit per receipt saved
- [ ] Failed/discarded receipts don't use credits
- [ ] Atomic transaction for save + deduct

### Task 6: Testing (0.5h)
- [ ] Unit tests for credit service
- [ ] Test warning dialog display
- [ ] Test insufficient credits blocking
- [ ] Test credit deduction on save
- [ ] Test partial batch (some fail) credit handling

---

## Technical Summary

The Credit Warning System ensures users are informed about credit usage before batch processing. Credits are only deducted on successful save, protecting users from losing credits on failed extractions.

**Credit Flow:**
```
"Procesar lote" →
  Check available credits →
  Show warning dialog →
    Sufficient: "Continuar" → Process batch
    Insufficient: Block or reduce batch size
→ Process batch →
→ Review queue →
→ "Guardar todo" → Deduct credits per saved receipt
```

**Credit Rules:**
- 1 credit = 1 receipt processed and saved
- Credits deducted on save (not on scan)
- Failed scans don't use credits
- Discarded receipts don't use credits

---

## Project Structure Notes

- **Files to create:**
  - `src/components/CreditWarningDialog.tsx`
  - `src/services/creditService.ts` (if not exists)

- **Files to modify:**
  - `src/views/ScanView.tsx` - Trigger credit check before batch
  - `src/hooks/useBatchReview.ts` - Deduct credits on save

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 12.1 (Batch Capture UI)

---

## Key Code References

**Credit Service:**
```typescript
// src/services/creditService.ts
export class CreditService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getAvailableCredits(): Promise<number> {
    const userDoc = await getDoc(doc(db, 'users', this.userId));
    return userDoc.data()?.credits || 0;
  }

  async checkSufficientCredits(required: number): Promise<{
    sufficient: boolean;
    available: number;
    required: number;
  }> {
    const available = await this.getAvailableCredits();
    return {
      sufficient: available >= required,
      available,
      required
    };
  }

  async deductCredits(amount: number): Promise<void> {
    const userRef = doc(db, 'users', this.userId);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentCredits = userDoc.data()?.credits || 0;

      if (currentCredits < amount) {
        throw new Error('Insufficient credits');
      }

      transaction.update(userRef, {
        credits: currentCredits - amount,
        lastCreditUsage: serverTimestamp()
      });
    });
  }
}
```

**Batch Save with Credit Deduction:**
```typescript
// In useBatchReview.ts saveAll function
const saveAll = async () => {
  const validReceipts = receipts.filter(r => r.status !== 'error');

  // Save receipts
  let savedCount = 0;
  for (const receipt of validReceipts) {
    try {
      await saveTransaction(receipt.scanResult);
      savedCount++;
    } catch (error) {
      // Handle individual save error
    }
  }

  // Deduct credits only for successfully saved receipts
  if (savedCount > 0) {
    await creditService.deductCredits(savedCount);
  }

  return savedCount;
};
```

---

## UI Specifications

**Warning Dialog:**
- Width: 300px
- Modal with dimmed background
- Icon: ⚠️ Amber for warning, ❌ Red for insufficient
- Primary button: Green "Continuar"
- Secondary button: Gray outline "Cancelar"

**Credit Display:**
- Available credits: Bold, larger font
- After batch calculation: Regular font
- Low credits warning: Amber text

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 12 Credit Warning System

---

## Definition of Done

- [ ] All 7 acceptance criteria verified
- [ ] Warning shows before batch processing
- [ ] Insufficient credits blocked
- [ ] Credits deducted only on save
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
