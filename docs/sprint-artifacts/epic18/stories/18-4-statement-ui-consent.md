# Story 18-4: Statement Upload UI + Consent Modal

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Build the front door — where the user walks in with a PDF and walks out with a list of transactions to review"

## Story
As a user, I want to upload a credit card statement PDF, provide a password if needed, see a consent disclosure, watch processing progress, and review extracted transactions before saving, so that I can import my statement spending into the app.

## Acceptance Criteria

### Functional
- **AC-1:** Upload flow: file picker → consent modal (first time) → password prompt (if encrypted) → processing → review
- **AC-2:** First-time consent modal: disclosure about PDF being sent to Google AI, stored consent in user settings
- **AC-3:** Password prompt shown only when PDF is encrypted (server returns encryption error)
- **AC-4:** Processing shows ScanOverlay-pattern progress (uploading → processing → ready)
- **AC-5:** Review screen shows list of extracted transactions as TransactionCard-pattern cards
- **AC-6:** Each transaction card shows: merchant, amount, date, chargeType badge, installment info
- **AC-7:** Confidence warning shown if metadata.confidence < 0.7
- **AC-8:** Total verification warning if sum deviation > 5%
- **AC-9:** Save action creates Transaction[] via transformer and saves to Firestore

### Architectural
- **AC-ARCH-1:** All modals use ConfirmationDialog pattern + ModalManager registry
- **AC-ARCH-2:** UI components in `src/features/statement-scan/components/`
- **AC-ARCH-3:** All strings via translations (ES primary, EN secondary)
- **AC-ARCH-4:** All colors via CSS variables, dark mode supported
- **AC-ARCH-5:** UI patterns ref: `_kdbp/knowledge/ui-patterns.md`

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Upload view | `src/features/statement-scan/components/StatementUploadView.tsx` | NEW |
| Consent dialog | `src/features/statement-scan/components/StatementConsentDialog.tsx` | NEW |
| Password dialog | `src/features/statement-scan/components/StatementPasswordDialog.tsx` | NEW |
| Processing overlay | `src/features/statement-scan/components/StatementProcessingOverlay.tsx` | NEW |
| Review list | `src/features/statement-scan/components/StatementReviewList.tsx` | NEW |
| Statement card | `src/features/statement-scan/components/StatementTransactionCard.tsx` | NEW |
| Statement store | `src/features/statement-scan/store/useStatementScanStore.ts` | NEW |
| Consent service | `src/features/statement-scan/services/consentService.ts` | NEW |
| Modal registry | `src/managers/ModalManager/ModalManager.tsx` | MODIFY (register new modals) |
| Translations | `src/utils/translations.ts` | MODIFY |
| Feature barrel | `src/features/statement-scan/index.ts` | MODIFY |

## Tasks

### Task 1: Statement Scan Store (3 subtasks)
- [ ] 1.1: Create Zustand store: phases (idle → uploading → processing → review → saving → done → error)
- [ ] 1.2: Store state: pdfBase64, password, statementResult, transformedTransactions, confidence, deviation
- [ ] 1.3: Actions: upload, setPassword, setResult, save, reset

### Task 2: Consent Flow (3 subtasks)
- [ ] 2.1: Create consentService: checkConsent(userId) → boolean, saveConsent(userId, type, version)
- [ ] 2.2: Create StatementConsentDialog using ConfirmationDialog pattern
- [ ] 2.3: Register in ModalManager, trigger on first upload

### Task 3: Upload + Password Flow (3 subtasks)
- [ ] 3.1: Create StatementUploadView: file picker (accept=".pdf"), 7MB size check, trigger upload
- [ ] 3.2: Create StatementPasswordDialog: password input, submit, show on encryption error
- [ ] 3.3: Wire upload → Cloud Function call → handle success/error/encryption-needed

### Task 4: Processing Overlay (2 subtasks)
- [ ] 4.1: Create StatementProcessingOverlay following ScanOverlay pattern (circular progress, state text)
- [ ] 4.2: Show phase transitions: "Uploading..." → "Analyzing statement..." → "Ready"

### Task 5: Review Screen (4 subtasks)
- [ ] 5.1: Create StatementReviewList: scrollable list of StatementTransactionCard items
- [ ] 5.2: Create StatementTransactionCard: merchant, amount, date, chargeType badge, installment pill
- [ ] 5.3: Show confidence warning banner if < 0.7
- [ ] 5.4: Show total deviation warning if > 5%

### Task 6: Save Flow (2 subtasks)
- [ ] 6.1: Save button: batch create transactions in Firestore (respect 500 batch limit)
- [ ] 6.2: Set source='statement_scan', sourceDocumentUrl, apply transformer output

### Task 7: Translations + Tests (3 subtasks)
- [ ] 7.1: Add all UI strings to translations (consent text, button labels, status messages, warnings)
- [ ] 7.2: Unit tests for store (phase transitions, actions)
- [ ] 7.3: Unit tests for consent service

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 7
- **Subtasks:** 20
- **Files:** ~11

**Sizing note:** 11 files is within the 12-file limit. 20 subtasks within 40 limit. 7 tasks within 8 limit. Fits.

## Dependencies
- 18-3 transformer + PDF storage (provides transformer and storage services)

## Risk Flags
- UI_COMPLEXITY (6 new components, but all follow existing patterns per ui-patterns.md)
- CONSENT_DESIGN (first feature with explicit consent flow — sets precedent)
