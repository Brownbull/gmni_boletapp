# Story 18-8: Single Scan Prompt Spike — Quantity/Price/Total Accuracy

## Status: backlog

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Sharpen the microscope — the existing receipt scan needs better math before statement matching adds more numbers"

## Story
As a developer, I want to spike improvements to the single receipt scan prompt's quantity/unit price/total calculation accuracy, so that V2 truthful data holds across both receipt scans and statement matching.

## Acceptance Criteria

### Functional
- **AC-1:** Identify top 5 accuracy failure modes in current receipt scan (analyze recent scan results)
- **AC-2:** Propose prompt changes to address each failure mode
- **AC-3:** Test improved prompt against 10+ diverse receipts, document accuracy delta
- **AC-4:** Document go/no-go decision for prompt update deployment

### Architectural
- **AC-ARCH-1:** Spike results at `docs/architecture/proposals/single-scan-prompt-spike.md`
- **AC-ARCH-2:** No production code changes unless go decision is clear

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Spike results | `docs/architecture/proposals/single-scan-prompt-spike.md` | NEW |
| Test results | `scripts/receipt-scan-spike/results/` | NEW (if spike proceeds) |

## Tasks

### Task 1: Analyze Current Failures (2 subtasks)
- [ ] 1.1: Review recent scan results for quantity/price/total mismatches
- [ ] 1.2: Categorize top 5 failure modes (e.g., multi-line items, bundled prices, tax inclusion)

### Task 2: Propose + Test Improvements (2 subtasks)
- [ ] 2.1: Draft prompt improvements targeting each failure mode
- [ ] 2.2: Test against 10+ receipts, document accuracy before/after

### Task 3: Document Decision (1 subtask)
- [ ] 3.1: Write spike results doc with go/no-go decision

## Sizing
- **Points:** 2 (SMALL)
- **Tasks:** 3
- **Subtasks:** 5
- **Files:** ~2

## Dependencies
- None (independent, can run in parallel with other stories)

## Risk Flags
- PROMPT_ITERATION (spike may require multiple rounds)
