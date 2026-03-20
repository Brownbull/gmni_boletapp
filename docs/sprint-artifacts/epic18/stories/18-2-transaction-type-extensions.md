# Story 18-2: Transaction Type Extensions

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Widen the pipe — the Transaction type needs new slots before data can flow through"

## Story
As a developer, I want to extend the Transaction type with new fields (chargeType, installments, recurrence, source, cardHolder, sourceDocumentUrl, statementVerified), so that statement-scanned transactions can carry their full metadata alongside existing receipt-scanned transactions.

## Acceptance Criteria

### Functional
- **AC-1:** Transaction type includes all new optional fields: chargeType, installmentCurrent, installmentTotal, recurrenceFrequency, source, sourceDocumentUrl, cardHolderType, cardHolderName, statementVerified, statementVerifiedAt, statementImportId
- **AC-2:** ChargeType enum defined in separate file with ES/EN labels and display utilities
- **AC-3:** All new fields are optional — existing transactions unchanged (backward compatible)
- **AC-4:** TypeScript compiles clean (tsc --noEmit passes)
- **AC-5:** No Firestore migration required — all fields use undefined-as-default pattern

### Architectural
- **AC-ARCH-1:** ChargeType in `shared/schema/chargeTypes.ts` (NOT in categories.ts)
- **AC-ARCH-2:** New types follow existing pattern: optional fields, no nested objects
- **AC-ARCH-3:** Translation strings added for all new field labels and enum values

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **Firestore rules (MVP-1):** New fields must be validated in hasValidFieldBounds

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Transaction type | `src/types/transaction.ts` | MODIFY |
| ChargeType schema | `shared/schema/chargeTypes.ts` | NEW |
| Categories barrel | `shared/schema/index.ts` | MODIFY (export chargeTypes) |
| Translations | `src/utils/translations.ts` | MODIFY |
| ChargeType display util | `src/entities/transaction/utils/chargeTypeUtils.ts` | NEW |
| Firestore rules | `firestore.rules` | MODIFY (validate new fields in hasValidFieldBounds) |

## Tasks

### Task 1: Create ChargeType Schema (3 subtasks)
- [ ] 1.1: Create `shared/schema/chargeTypes.ts` with ChargeType union type: purchase, interest, fee, insurance, transfer, adjustment, other
- [ ] 1.2: Add CHARGE_TYPE_LABELS map (EN + ES) and CHARGE_TYPE_FROM_STATEMENT map (cargo→purchase, interes→interest, etc.)
- [ ] 1.3: Export from `shared/schema/index.ts`

### Task 2: Extend Transaction Type (3 subtasks)
- [ ] 2.1: Add fields to Transaction interface: chargeType?, installmentCurrent?, installmentTotal?, recurrenceFrequency?, source?, sourceDocumentUrl?, cardHolderType?, cardHolderName?
- [ ] 2.2: Add statement reconciliation fields: statementVerified?, statementVerifiedAt?, statementImportId?
- [ ] 2.3: Add type definitions: RecurrenceFrequency, TransactionSource, CardHolderType

### Task 3: Create Display Utilities (2 subtasks)
- [ ] 3.1: Create chargeTypeUtils.ts: getChargeTypeLabel(type, lang), getChargeTypeIcon(type), isChargeTypeEditable()
- [ ] 3.2: Add installment display: formatInstallment(current, total) → "Cuota 3 de 6" / "Installment 3 of 6"

### Task 4: Add Translations (2 subtasks)
- [ ] 4.1: Add ES/EN translations for all chargeType values, installment labels, recurrence options, source labels
- [ ] 4.2: Add translations for statementVerified status labels ("Verificado por estado de cuenta" / "Statement verified")

### Task 5: Firestore Rules — New Field Validation (2 subtasks)
- [ ] 5.1: Add chargeType enum validation to hasValidFieldBounds: `data.chargeType in ['purchase','interest','fee','insurance','transfer','adjustment','other']`
- [ ] 5.2: Add source, cardHolderType enum validation + installmentCurrent/installmentTotal number bounds (0-999)

### Task 6: Tests (2 subtasks)
- [ ] 6.1: Unit tests for chargeTypeUtils (labels, icons, mapping)
- [ ] 6.2: Unit tests for installment formatting (edge cases: undefined, 1/1 omit, 0/6)

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 14
- **Files:** ~6

## Dependencies
- 18-5 prompt v2 (should be done first so we know which fields the prompt produces)

## Risk Flags
- TYPE_SURFACE_AREA (new fields touch the core Transaction type — many files import it)
- All fields optional so backward compatible, but need to verify tsc compiles clean
