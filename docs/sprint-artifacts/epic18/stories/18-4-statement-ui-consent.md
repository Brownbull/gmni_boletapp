# Story 18-4: Statement Upload UI + Consent Modal (Async Client)

## Status: drafted

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Build the front door — user uploads a PDF, watches progress via Firestore listener, and reviews extracted transactions"

## Story
As a user, I want to upload a credit card statement PDF to Storage, provide a password if needed, see a consent disclosure (first time), watch async processing progress via Firestore listener, and review extracted transactions before proceeding to matching, so that I can import my statement spending into the app without worrying about network drops.

## Architecture Reference
- **V5 Plan:** `docs/architecture/proposals/implemented/EPIC-18-CREDIT-CARD-STATEMENT-SCANNING.md`
- **Receipt async client (template):** 18-13b (Firestore listener, pending detection, resolution)

## Acceptance Criteria

### Functional
- **AC-1:** Upload flow: file picker → consent modal (first time) → upload PDF to Storage → password prompt (if encrypted) → queueStatementScan callable → Firestore listener → review
- **AC-2:** First-time consent modal: disclosure about PDF being sent to Google AI, stored consent in Firestore
- **AC-3:** PDF uploaded to Firebase Storage (`users/{uid}/statements/{sha256}.pdf`) BEFORE calling queue function
- **AC-4:** Re-import fast path: if PDF hash already exists in Storage, show "Already imported — import again?" prompt
- **AC-5:** Password prompt shown only when processStatementScan returns encryption error
- **AC-6:** Processing progress via Firestore `onSnapshot` listener on pending_statement_scans/{scanId}
- **AC-7:** Review screen shows list of pre-transformed transactions as TransactionCard-pattern cards
- **AC-8:** Each transaction card shows: merchant, amount, date, chargeType badge, installment info, cardHolder
- **AC-9:** Confidence warning shown if metadata.confidence < 0.7
- **AC-10:** Total verification warning if sum deviation > 5%
- **AC-11:** Transaction limit disclaimer: "Statements with more than ~150 transactions may have reduced accuracy"
- **AC-12:** Review leads to matching phase (18-10a/b), NOT direct save. "Continue to Matching" button.
- **AC-13:** Survives network drops, app restarts, background/foreground transitions (pending scan detection on app load)

### Architectural
- **AC-ARCH-1:** All modals use ConfirmationDialog pattern + ModalManager registry
- **AC-ARCH-2:** UI components in `src/features/statement-scan/components/`
- **AC-ARCH-3:** All strings via translations (ES primary, EN secondary)
- **AC-ARCH-4:** All colors via CSS variables, dark mode supported
- **AC-ARCH-5:** UI patterns ref: `_kdbp/knowledge/ui-patterns.md`
- **AC-ARCH-6:** Firestore listener pattern from 18-13b (usePendingScanListener hook)

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
| PDF upload service | `src/features/statement-scan/services/pdfUploadService.ts` | NEW |
| Statement scan hook | `src/features/statement-scan/hooks/useStatementScanListener.ts` | NEW |
| Feature barrel | `src/features/statement-scan/index.ts` | NEW |
| Modal registry | `src/managers/ModalManager/ModalManager.tsx` | MODIFY (register new modals) |
| Translations | `src/utils/translations.ts` | MODIFY |

## Tasks

### Task 1: Statement Scan Store (3 subtasks)
- [ ] 1.1: Create Zustand store: phases (idle → uploading → queued → processing → review → matching → saving → done → error)
- [ ] 1.2: Store state: pdfFile, pdfHash, password, scanId, importId, transformedTransactions, confidence, deviation, statementInfo
- [ ] 1.3: Actions: startUpload, setPassword, setScanId, setResult, proceedToMatching, reset

### Task 2: Consent Flow (3 subtasks)
- [ ] 2.1: Create consentService: checkConsent(userId) → boolean, saveConsent(userId, type, version) — Firestore path: `artifacts/{appId}/users/{userId}/consents/statement_ai_processing`
- [ ] 2.2: Create StatementConsentDialog using ConfirmationDialog pattern — disclosure: "Your statement PDF will be sent to Google AI for processing"
- [ ] 2.3: Register in ModalManager, trigger on first upload

### Task 3: PDF Upload + Queue Flow (4 subtasks)
- [ ] 3.1: Create pdfUploadService: computeHash(file) → sha256, uploadToStorage(userId, file, hash) → storageUrl, checkExists(userId, hash) → boolean
- [ ] 3.2: Create StatementUploadView: file picker (accept=".pdf"), 7MB client-side size check
- [ ] 3.3: Re-import detection: if hash exists in Storage, show "Already imported" confirmation prompt
- [ ] 3.4: Wire upload → call queueStatementScan callable → receive {scanId, importId} → start listener

### Task 4: Firestore Listener + Processing Overlay (3 subtasks)
- [ ] 4.1: Create useStatementScanListener hook (mirrors useReceiptScanListener from 18-13b): listen to pending_statement_scans/{scanId}
- [ ] 4.2: Create StatementProcessingOverlay following ScanOverlay pattern: "Uploading..." → "Analyzing statement..." → "Ready"
- [ ] 4.3: Handle encryption error from processStatementScan: show StatementPasswordDialog → re-queue with password

### Task 5: Review Screen (3 subtasks)
- [ ] 5.1: Create StatementReviewList: virtualized scrollable list (react-window or similar for 80+ transactions)
- [ ] 5.2: Create StatementTransactionCard: merchant, amount, date, chargeType badge, installment pill, cardHolder indicator
- [ ] 5.3: Show confidence warning banner (<0.7), total deviation warning (>5%), transaction count disclaimer (>150)

### Task 6: Navigation + Pending Detection (2 subtasks)
- [ ] 6.1: Add "Credit Card Statement" option to scan button long-press menu (alongside Single Scan and Batch Scan)
- [ ] 6.2: Pending statement detection on app load: if pending_statement_scans doc exists for user, resume flow

### Task 7: Translations + Tests (3 subtasks)
- [ ] 7.1: Add all UI strings to translations (consent text, button labels, status messages, warnings, disclaimer)
- [ ] 7.2: Unit tests for store (phase transitions, actions)
- [ ] 7.3: Unit tests for consent service + pdfUploadService (hash, exists check)

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 7
- **Subtasks:** 21
- **Files:** ~13

**Sizing note:** 13 files is 1 over the 12-file limit. pdfUploadService could be merged into consentService to reduce file count, but they have distinct responsibilities. Accept the minor overshoot.

## Dependencies
- 18-3 async statement backend (provides queueStatementScan, processStatementScan, pending doc schema)
- 18-13b receipt async client (template for Firestore listener pattern — reuse, not duplicate)

## Risk Flags
- UI_COMPLEXITY (6 new components, but all follow existing patterns per ui-patterns.md)
- CONSENT_DESIGN (first feature with explicit consent flow — sets precedent)
- VIRTUALIZATION (80+ transaction cards need react-window or similar for mobile performance)
- PENDING_DETECTION (app load must check for abandoned pending scans — mirrors receipt pattern)
