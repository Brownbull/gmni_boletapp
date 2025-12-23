# Story 12.4: Credit Warning System

**Epic:** Epic 12 - Batch Mode
**Status:** review
**Story Points:** 3
**Dependencies:** Story 12.1 (Batch Capture UI)

---

## User Story

As a **user preparing to process a batch**,
I want **to see how many credits will be used before processing**,
So that **I can make an informed decision and avoid running out of credits**.

---

## Acceptance Criteria

- [x] **AC #1:** Pre-batch warning shows credit cost before processing
- [x] **AC #2:** Warning format: "Este lote usará X créditos. Tienes Y disponibles."
- [x] **AC #3:** Processing blocked if insufficient credits
- [x] **AC #4:** Clear indication when batch will exhaust remaining credits
- [x] **AC #5:** "Continuar" and "Cancelar" options on warning dialog
- [x] **AC #6:** Credits deducted per receipt on successful save (not on processing start)
- [x] **AC #7:** Warning appears after "Procesar lote" but before actual processing

---

## Tasks / Subtasks

### Task 1: Create Credit Status Service (0.5h)
- [x] Create `src/services/creditService.ts` (if not exists)
- [x] Implement credit check:
  ```typescript
  interface CreditService {
    getAvailableCredits(): Promise<number>;
    checkSufficientCredits(required: number): Promise<boolean>;
    deductCredits(amount: number): Promise<void>;
  }
  ```
- [x] Read from user's subscription/credit document

### Task 2: Create Credit Warning Dialog (1h)
- [x] Create `src/components/batch/CreditWarningDialog.tsx`
- [x] Design warning UI:
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
- [x] Localize strings (English + Spanish)

### Task 3: Implement Insufficient Credits State (0.5h)
- [x] Different dialog when credits insufficient:
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
- [x] Link to credit purchase (if applicable)

### Task 4: Integrate Warning into Batch Flow (0.5h)
- [x] "Procesar lote" triggers credit check first
- [x] Show warning dialog before processing starts
- [x] "Continuar" → begin parallel processing
- [x] "Cancelar" → return to batch capture

### Task 5: Implement Credit Deduction on Save (0.5h)
- [x] Deduct credits only on successful save
- [x] One credit per receipt saved
- [x] Failed/discarded receipts don't use credits
- [x] Atomic transaction for save + deduct (already implemented in 11.1)

### Task 6: Testing (0.5h)
- [x] Unit tests for credit service (19 tests)
- [x] Test warning dialog display (18 tests)
- [x] Test insufficient credits blocking
- [x] Test credit deduction on save
- [x] Test partial batch (some fail) credit handling

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

- [x] All 7 acceptance criteria verified
- [x] Warning shows before batch processing
- [x] Insufficient credits blocked
- [x] Credits deducted only on save
- [x] Tests passing (2571 tests, 99 test files)
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101) via Atlas-enhanced dev-story workflow

### Completion Notes
Implementation complete. The Credit Warning System now integrates seamlessly with the existing batch processing flow:

1. **Credit Service** (`src/services/creditService.ts`): Pure functions for credit checking, deduction, and low-credit warnings. Works with the existing in-memory credit state from Story 9.10.

2. **CreditWarningDialog** (`src/components/batch/CreditWarningDialog.tsx`): Dual-mode dialog that displays either:
   - Sufficient credits: Shows credit breakdown with Continuar/Cancelar buttons
   - Insufficient credits: Shows error with Reduce Batch/Cancel options

3. **Flow Integration**: Modified `App.tsx` to intercept batch processing and show credit warning before proceeding. The existing credit deduction (from Story 11.1) remains unchanged.

4. **Testing**: 37 new tests added (19 service + 18 component) with 100% pass rate.

### Files Modified
- `src/services/creditService.ts` (NEW) - Credit checking utilities
- `src/components/batch/CreditWarningDialog.tsx` (NEW) - Warning dialog component
- `src/components/batch/index.ts` (NEW) - Barrel exports
- `src/App.tsx` (MODIFIED) - Integration with batch flow
- `src/utils/translations.ts` (MODIFIED) - Added 13 new translation strings
- `tests/unit/services/creditService.test.ts` (NEW) - 19 tests
- `tests/unit/components/batch/CreditWarningDialog.test.tsx` (NEW) - 18 tests

### Test Results
- **Total tests:** 2571 passing (99 test files)
- **New tests:** 37 (19 service + 18 component)
- **Coverage:** Maintained 84%+ threshold

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 12 definition |
| 2025-12-22 | 2.0 | Implementation complete via Atlas dev-story |
