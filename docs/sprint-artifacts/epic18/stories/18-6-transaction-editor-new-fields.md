# Story 18-6: Transaction Editor — New Fields

## Status: backlog

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Give the editor new knobs — chargeType, installments, recurrence, and cardHolder all need to be editable"

## Story
As a user, I want to view and edit the new transaction fields (chargeType, installments, recurrenceFrequency, cardHolder) in the transaction editor, so that I can correct AI-extracted data or manually enrich any transaction.

## Acceptance Criteria

### Functional
- **AC-1:** ChargeType dropdown in editor: shows all values with localized labels, editable for all transactions
- **AC-2:** Installment fields: current/total number inputs, shown when chargeType implies installments, hidden when absent
- **AC-3:** RecurrenceFrequency dropdown: weekly/biweekly/monthly/quarterly/semiannual/yearly, available for ALL transactions
- **AC-4:** RecurrenceFrequency can coexist with installments (e.g., monthly installment 3/12)
- **AC-5:** CardHolder section: type selector (titular/additional) + name input (shown for additional only)
- **AC-6:** StatementVerified badge: read-only indicator shown when statementVerified=true (not editable)
- **AC-7:** Source badge: read-only indicator showing receipt_scan/statement_scan/manual (not editable)
- **AC-8:** All new fields in "Advanced" section of editor, collapsed by default

### Architectural
- **AC-ARCH-1:** New field components in `src/features/transaction-editor/components/`
- **AC-ARCH-2:** Reuses CategoryCombobox pattern for dropdowns
- **AC-ARCH-3:** All strings via translations, dark mode supported

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| ChargeType selector | `src/features/transaction-editor/components/ChargeTypeSelector.tsx` | NEW |
| Installment fields | `src/features/transaction-editor/components/InstallmentFields.tsx` | NEW |
| Recurrence selector | `src/features/transaction-editor/components/RecurrenceSelector.tsx` | NEW |
| CardHolder section | `src/features/transaction-editor/components/CardHolderSection.tsx` | NEW |
| Statement badge | `src/features/transaction-editor/components/StatementVerifiedBadge.tsx` | NEW |
| Editor view | `src/features/transaction-editor/components/TransactionEditorView.tsx` | MODIFY (add advanced section) |
| Editor form hook | `src/features/transaction-editor/hooks/useTransactionForm.ts` | MODIFY (new fields) |
| Translations | `src/utils/translations.ts` | MODIFY |

## Tasks

### Task 1: ChargeType Selector (2 subtasks)
- [ ] 1.1: Create ChargeTypeSelector: dropdown using CategoryCombobox pattern, all ChargeType values with labels
- [ ] 1.2: Wire to form state, save to Firestore

### Task 2: Installment Fields (2 subtasks)
- [ ] 2.1: Create InstallmentFields: current (number input) + total (number input), display "Cuota X de Y"
- [ ] 2.2: Auto-show when chargeType is set or when values exist, hide otherwise

### Task 3: Recurrence Selector (2 subtasks)
- [ ] 3.1: Create RecurrenceSelector: dropdown with frequency options, localized labels
- [ ] 3.2: Available for ALL transactions regardless of source

### Task 4: CardHolder Section (2 subtasks)
- [ ] 4.1: Create CardHolderSection: type radio (titular/additional) + name text input (conditional)
- [ ] 4.2: Name input shown only when type='additional'

### Task 5: Read-Only Badges (2 subtasks)
- [ ] 5.1: Create StatementVerifiedBadge: green checkmark when statementVerified=true, hidden otherwise
- [ ] 5.2: Source badge: small pill showing "Receipt" / "Statement" / "Manual"

### Task 6: Integration + Layout (3 subtasks)
- [ ] 6.1: Add "Advanced" collapsible section to TransactionEditorView
- [ ] 6.2: Place new fields in Advanced section: chargeType, installments, recurrence, cardHolder
- [ ] 6.3: Place badges (verified, source) in header area of editor, always visible

### Task 7: Tests (2 subtasks)
- [ ] 7.1: Unit tests for each new component (render, select, form binding)
- [ ] 7.2: Integration test: editor with all new fields populated, save, verify Firestore output

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 7
- **Subtasks:** 15
- **Files:** ~8

## Dependencies
- 18-2 type extensions (fields must exist in Transaction type)

## Risk Flags
- EDITOR_COMPLEXITY (TransactionEditorView is already substantial — adding new section)
- FORM_STATE (useTransactionForm hook needs new field bindings)
