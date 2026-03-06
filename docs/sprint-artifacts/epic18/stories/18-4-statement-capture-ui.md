# Story 18-4: Statement Capture UI -- Mode Selector and Image/PDF Upload

## Status: ready-for-dev

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "This story builds the loading dock by adding the wide intake door -- camera, gallery, or PDF file picker"

## Story
As a user, I want to capture statement pages via camera, gallery, or PDF upload, so that I can get my credit card transactions into BoletApp.

## Acceptance Criteria

### Functional
- **AC-1:** Given the scan FAB menu, when user selects "Statement", then a capture UI appears supporting camera, gallery, and PDF file picker
- **AC-2:** Given statement capture, when user takes/selects up to 5 images, then each page is added to the statement scan
- **AC-3:** Given statement capture, when user selects a PDF file, then the PDF is accepted (max 5 pages, max 10MB)
- **AC-4:** Given pages are captured, when user taps "Process", then the Cloud Function is called and a processing indicator shows
- **AC-5:** Given processing completes, when results arrive, then user transitions to batch review (18-5)

### Architectural
- **AC-ARCH-LOC-1:** Statement capture at `src/features/scan/components/StatementCapture.tsx`
- **AC-ARCH-LOC-2:** Mode selector update at `src/features/scan/components/ModeSelectorSheet.tsx`
- **AC-ARCH-PATTERN-1:** PDF handled via browser FileReader API -- no server-side conversion
- **AC-ARCH-PATTERN-2:** data-testid on all interactive elements
- **AC-ARCH-NO-1:** No changes to normal/batch scan capture behavior

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Statement capture | `src/features/scan/components/StatementCapture.tsx` | FSD component | NEW |
| Mode selector | `src/features/scan/components/ModeSelectorSheet.tsx` | FSD component | MODIFIED |
| Scan FAB | `src/features/scan/components/ScanFAB.tsx` | FSD component | MODIFIED |
| PDF handler utility | `src/features/scan/utils/pdfHandler.ts` | Utility | NEW |
| Tests | `tests/unit/features/scan/StatementCapture.test.tsx` | Vitest/RTL | NEW |

## Tasks

### Task 1: Update Mode Selector (2 subtasks)
- [ ] 1.1: Add "Statement" option to ModeSelectorSheet -- icon + label
- [ ] 1.2: Update ScanFAB to show statement icon when statement mode is active

### Task 2: Build Statement Capture Component (4 subtasks)
- [ ] 2.1: Create `StatementCapture.tsx` -- camera button, gallery button, PDF upload button
- [ ] 2.2: Page list: show captured pages with thumbnails, allow remove/reorder
- [ ] 2.3: PDF upload: file input accepting `.pdf`, validate size (< 10MB) and page count (< 5)
- [ ] 2.4: "Process" button: calls Cloud Function with captured pages/PDF

### Task 3: Hardening (2 subtasks)
- [ ] 3.1: **INPUT_SANITIZATION:** Validate file type (only image/jpeg, image/png, application/pdf), file size limits
- [ ] 3.2: **ERROR_RESILIENCE:** Show clear error if PDF is too large or has too many pages

### Task 4: Tests (2 subtasks)
- [ ] 4.1: Unit test: component renders mode options, handles page add/remove
- [ ] 4.2: Unit test: PDF validation (size, type, page count)

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run `npm run test:quick` -- all tests pass

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~5

## Dependencies
- **18-2** (statement store must exist)
- **18-3** (Cloud Function must exist to call)

## Risk Flags
- INPUT_SANITIZATION (file uploads)
- PURE_COMPONENT (empty state, loading state)
- E2E_TESTING (data-testid on all elements)

## Dev Notes
- PDF handling: use FileReader to read PDF as base64, send to Cloud Function. No client-side PDF parsing.
- Max 5 images OR 1 PDF per statement scan -- not both. UI should enforce this.
- The processing indicator reuses the scan overlay pattern (now unified in Zustand from Epic 16).
- data-testid attributes: `statement-camera-btn`, `statement-gallery-btn`, `statement-pdf-btn`, `statement-process-btn`, `statement-page-{n}`
