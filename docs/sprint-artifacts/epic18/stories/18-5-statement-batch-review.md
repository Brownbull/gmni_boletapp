# Story 18-5: Statement Batch Review Integration

## Status: ready-for-dev

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "This story builds the loading dock by connecting the unpacked items to the review conveyor belt"

## Story
As a user, I want to review statement-extracted transactions in batch, correcting categories and merchants before saving, so that the data is accurate.

## Acceptance Criteria

### Functional
- **AC-1:** Given statement processing completes with N transactions, when batch review opens, then all N transactions are displayed for review
- **AC-2:** Given a statement transaction in review, when user edits merchant/category/amount, then changes are reflected in the transaction
- **AC-3:** Given all statement transactions are reviewed, when user confirms, then all are saved to Firestore
- **AC-4:** Given some transactions are unwanted (e.g., payments/credits), when user deselects them, then only selected transactions are saved
- **AC-5:** Given batch review, when user navigates between statement transactions, then navigation is smooth (< 500ms transitions)

### Architectural
- **AC-ARCH-PATTERN-1:** Reuses existing batch review infrastructure (from scan feature) with statement-specific adaptations
- **AC-ARCH-PATTERN-2:** Statement transactions go through the same save pipeline as receipt transactions
- **AC-ARCH-NO-1:** No changes to receipt batch review behavior
- **AC-ARCH-NO-2:** No credit/debit transactions saved without user confirmation

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Statement review adapter | `src/features/batch-review/hooks/useStatementReviewAdapter.ts` | Feature hook | NEW |
| Batch review view | `src/features/batch-review/views/BatchReviewView.tsx` | FSD view | MODIFIED |
| Statement review card | `src/features/batch-review/components/StatementTransactionCard.tsx` | FSD component | NEW |
| Tests | `tests/unit/features/batch-review/useStatementReviewAdapter.test.ts` | Vitest | NEW |

## Tasks

### Task 1: Create Statement Review Adapter (3 subtasks)
- [ ] 1.1: Create adapter hook that transforms `StatementTransaction[]` into batch review format
- [ ] 1.2: Handle credit/debit distinction -- show indicator, allow deselect for credits (payments)
- [ ] 1.3: Pre-populate merchant mappings and category mappings from learned data (FR-3.1, FR-3.2)

### Task 2: Statement Transaction Card (2 subtasks)
- [ ] 2.1: Create `StatementTransactionCard.tsx` -- shows date, merchant, amount, debit/credit indicator
- [ ] 2.2: Editable fields: merchant (text), category (dropdown), amount (number)

### Task 3: Integrate with Batch Review (2 subtasks)
- [ ] 3.1: Update `BatchReviewView.tsx` to handle statement mode -- show statement cards instead of receipt cards
- [ ] 3.2: Wire "Save All" and "Save Selected" actions through existing transaction save pipeline

### Task 4: Hardening (2 subtasks)
- [ ] 4.1: **PURE_COMPONENT:** Handle empty extraction (0 transactions found) -- show helpful message
- [ ] 4.2: **E2E_TESTING:** Add data-testid to statement review elements

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run `npm run test:quick` -- all tests pass

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 10
- **Files:** ~4

## Dependencies
- **18-3** (Cloud Function returns extracted transactions)
- **18-4** (capture UI hands off results)

## Risk Flags
- PURE_COMPONENT (empty/error states)
- E2E_TESTING (data-testid coverage)

## Dev Notes
- The batch review infrastructure from Epic 16 (shared workflow store + events) makes this integration clean: statement capture emits `statement:extracted` event, batch review subscribes.
- Statement transactions differ from receipt transactions: no items array (just totals), credit/debit flag, statement period metadata.
- Smart data learning (FR-3.1-3.4) should apply: if merchant "STARBUCKS" was corrected to alias "Coffee" before, the statement extraction should pre-apply that.
- The "Save Selected" pattern is new -- receipt batch review saves all. Statement review needs selection toggles because credits/payments shouldn't be saved as expenses.
