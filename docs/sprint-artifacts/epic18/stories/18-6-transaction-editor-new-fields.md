# Story 18-6: Transaction Editor — New Fields

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Give the editor new knobs — chargeType, installments, recurrence, and cardHolder all need to be editable"

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **Lock mechanism:** statementVerified=true → hard lock (all fields disabled, explicit unlock required)

## Story
As a user, I want to view and edit the new transaction fields (chargeType, installments, recurrenceFrequency, cardHolder) in the transaction editor, with statement-verified transactions fully locked until I explicitly unlock them, so that I can correct AI-extracted data or manually enrich any transaction while protecting verified data.

## Acceptance Criteria

### Functional
- **AC-1:** ChargeType dropdown in editor: shows all values with localized labels, editable for all transactions
- **AC-2:** Installment fields: current/total number inputs, shown when chargeType implies installments, hidden when absent
- **AC-3:** RecurrenceFrequency dropdown: weekly/biweekly/monthly/quarterly/semiannual/yearly, available for ALL transactions
- **AC-4:** RecurrenceFrequency can coexist with installments (e.g., monthly installment 3/12)
- **AC-5:** CardHolder section: type selector (titular/additional) + name input (shown for additional only)
- **AC-6:** **Hard lock mode:** when statementVerified=true, ALL editor fields are disabled with banner "Verified against credit card statement on {date}"
- **AC-7:** **Explicit unlock:** "Unlock and Break Verification" button with confirmation dialog — resets statementVerified/At/ImportId to null
- **AC-8:** Source badge: read-only indicator showing receipt_scan/statement_scan/manual (always visible, not editable)
- **AC-9:** All new fields in "Advanced" section of editor, collapsed by default

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

### Task 5: Hard Lock Mode (3 subtasks)
- [ ] 5.1: Detect statementVerified=true → disable ALL form fields, show lock banner with verification date
- [ ] 5.2: "Unlock and Break Verification" button — confirmation dialog: "This will break the statement verification. You'll need to re-match this transaction."
- [ ] 5.3: On unlock confirm: reset statementVerified=false, statementVerifiedAt=null, statementImportId=null, re-enable all fields

### Task 6: Source Badge + Integration (3 subtasks)
- [ ] 6.1: Source badge: small pill showing "Receipt" / "Statement" / "Manual" (always visible in header, read-only)
- [ ] 6.2: Add "Advanced" collapsible section to TransactionEditorView, place new fields inside
- [ ] 6.3: Place lock banner + source badge in header area, always visible regardless of collapsed state

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
