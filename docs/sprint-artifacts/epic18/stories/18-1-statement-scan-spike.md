# Story 18-1: Statement Scanning Spike -- Gemini PDF Feasibility

## Status: ready-for-dev

## Intent
**Epic Handle:** "One statement in, many transactions out"
**Story Handle:** "This story builds the loading dock by testing whether the dock can handle the boxes we're about to receive"

## Story
As a developer, I want to validate that Gemini can reliably extract transactions from Chilean bank statement images/PDFs, so that we can commit to the PDF-direct approach or pivot to Cloud Run.

## Acceptance Criteria

### Functional
- **AC-1:** Given 5+ real Chilean bank statement samples (BancoEstado, Banco de Chile, Santander), when sent to Gemini, then transactions are extracted with >= 85% accuracy (merchant, date, amount)
- **AC-2:** Given a multi-page statement (3-5 pages), when processed, then all pages are handled (no data loss)
- **AC-3:** Given both image and PDF formats, when tested, then both formats produce usable results
- **AC-4:** Given the spike results, when documented, then a go/no-go decision is recorded for Gemini PDF direct vs Cloud Run fallback

### Architectural
- **AC-ARCH-LOC-1:** Spike results at `docs/architecture/proposals/statement-scanning-spike.md`
- **AC-ARCH-NO-1:** No production code changes -- spike/prototype only

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Spike results doc | `docs/architecture/proposals/statement-scanning-spike.md` | Architecture doc | NEW |
| Prototype script | `scripts/statement-scan-spike/` (temporary) | Script | NEW (temporary) |

## Tasks

### Task 1: Gather Test Data (2 subtasks)
- [ ] 1.1: Collect 5+ Chilean bank statement samples (anonymized) -- mix of BancoEstado, Banco de Chile, Santander
- [ ] 1.2: Include variety: 1-page, 3-page, 5-page; image captures, PDF files

### Task 2: Test Gemini PDF Direct (3 subtasks)
- [ ] 2.1: Write prototype script that sends statement image/PDF to Gemini with extraction prompt
- [ ] 2.2: Define expected output format: `{ transactions: [{ date, merchant, amount, currency }] }`
- [ ] 2.3: Test all samples, record accuracy (correct/total transactions per statement)

### Task 3: Document Results and Decision (2 subtasks)
- [ ] 3.1: Document accuracy results, edge cases, failure modes
- [ ] 3.2: Record go/no-go decision: Gemini PDF direct (if >= 85%) or Cloud Run fallback (if < 85%)

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 3
- **Subtasks:** 7
- **Files:** ~2 (temporary)

## Dependencies
- None (first story -- validates the approach before building)

## Risk Flags
- DATA_PIPELINE (AI extraction accuracy is the key risk)

## Dev Notes
- Architecture decision 3a says "Gemini PDF direct, Cloud Run fallback." This spike validates that decision.
- Chilean bank statements have specific formatting: RUT numbers, CLP amounts with dots, Spanish merchant names.
- Gemini 2.5 Flash supports PDF input natively. Test with the same model used for receipt scanning.
- Key edge cases: merged lines, partial page scans, watermarked statements, credit vs debit ambiguity.
- NFR-1.2 requires < 15s for 50-transaction statement. Measure latency during spike.
