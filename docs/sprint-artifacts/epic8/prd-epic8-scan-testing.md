# boletapp - Product Requirements Document

**Author:** Gabe
**Date:** 2025-12-10
**Version:** 1.0
**Scope:** Epic 8 - Scan Testing & Tuning Infrastructure

---

## Executive Summary

Boletapp's receipt scanning is the core value proposition - users photograph receipts and get structured expense data. But the current Gemini-powered scanning isn't delivering accurate results for Chilean receipts. Before building additional features, we must ensure the foundation works reliably.

Epic 8 creates a **developer testing infrastructure** to systematically evaluate, tune, and improve scan accuracy. This includes a test harness for running known receipt images through the scanner, comparing results against expected values, and iterating on prompts/configurations until accuracy meets acceptable thresholds.

### What Makes This Special

**Data-Driven Accuracy Improvement** - Instead of guessing why scans fail, we build tooling to measure and iterate:

1. **Reproducible Testing** - Same image → same expected result → measurable accuracy
2. **Prompt Engineering Feedback Loop** - Test changes to Gemini prompts against real receipts
3. **Foundation for ML Training** - Test images + expected outputs = future training data
4. **Chilean Market Expertise** - Deep understanding of local receipt formats (RUT, boleta electrónica, specific store chains)

---

## Project Classification

**Technical Type:** web_app (PWA)
**Domain:** general (expense tracking)
**Complexity:** low

This epic is a developer-focused infrastructure addition to enable systematic scan quality improvement. It does not change the user-facing application but creates tooling for developers to iterate on scan accuracy.

**Related Research Documents:**
- [docs/scan_model/custom_training|_dig_deeper.md](./scan_model/custom_training|_dig_deeper.md) - ML training architecture research
- [docs/scan_model/schema_and_costs.md](./scan_model/schema_and_costs.md) - Data schema and cost analysis
- [docs/scan_model/cost_analysis_v2.md](./scan_model/cost_analysis_v2.md) - Infrastructure cost projections

---

## Success Criteria

Success for Epic 8 means:

1. **Measurable Accuracy** - We can quantify current scan accuracy with specific thresholds per field
2. **Reproducible Tests** - Running the same test suite produces consistent results
3. **Fast Iteration** - Developer can modify prompt, run tests, see results in under 5 minutes
4. **Clear Failure Analysis** - When a scan fails, we see expected vs actual diff and understand WHY
5. **Accuracy Improvement** - By end of epic, demonstrate measurable improvement in scan accuracy for test set
6. **Test Data Foundation** - Have 20+ annotated test receipts covering common Chilean store types

### Accuracy Thresholds (Define Before Development)

| Field | Target Accuracy | Tolerance | Rationale |
|-------|-----------------|-----------|-----------|
| **Total** | 98% | Exact match | Financial accuracy is critical |
| **Date** | 95% | Exact match | Temporal accuracy important |
| **Merchant** | 90% | Fuzzy (0.8 similarity) | Normalization handles variations |
| **Items Count** | 85% | ±1 item | Some items may merge/split |
| **Item Prices** | 90% | Exact per item | Financial sub-accuracy |

### Root Cause Analysis (Five Whys)

The test harness isn't optional - it's the **prerequisite** for any improvement:

1. Scans fail → Gemini returns incorrect data for Chilean receipts
2. Incorrect data → Model doesn't recognize Chilean formats (RUT, boleta electrónica, local chains)
3. No recognition → Our prompt lacks Chilean context (no examples, no format hints)
4. No context → We don't know WHAT context is missing or WHETHER additions help
5. **Root Cause:** No test infrastructure exists to quantify accuracy or iterate with measurable feedback

**Implication:** Build measurement capability FIRST, then use it to guide prompt improvements.

---

## Product Scope

### MVP - Minimum Viable Product

**Test Image Repository**
- Dedicated folder for test receipt images (`/test-data/receipts/`)
- Expected results JSON files paired with each image
- Coverage of major Chilean store types (supermarkets, pharmacies, restaurants)

**Scan Test Harness**
- CLI or script-based tool to run scans against test images
- Compare actual results vs expected results
- Generate accuracy report (per-field and overall)
- Support for batch testing all images or single image

**Prompt Tuning Workflow**
- Easy way to modify Gemini prompts
- A/B comparison between prompt versions
- Document which prompts work best for which receipt types

**Accuracy Metrics Dashboard**
- Simple report showing:
  - Overall accuracy percentage
  - Per-field accuracy (merchant, date, total, items)
  - Per-store-type accuracy
  - Failure case details

### Growth Features (Post-MVP)

- Visual diff tool showing expected vs actual extraction
- Automated regression testing in CI pipeline
- Historical accuracy tracking over time
- Integration with correction data from production users
- Expand test set to 100+ images covering 80% of common Chilean stores
- A/B prompt comparison mode for systematic optimization
- Pluggable extractor architecture (test Gemini vs Cloud Vision vs other APIs)

### Vision (Future)

- Automated prompt optimization using test results
- Fine-tuning pipeline using validated test data
- Crowdsourced test image collection from users (with consent)
- Multi-region test suites (Chile, Colombia, Mexico)

---

## web_app Specific Requirements

### Development Environment

- Test harness runs locally (Node.js environment)
- Uses same Gemini API configuration as production
- Can optionally use Firebase emulators for isolated testing

### Test Data Management

- Git-tracked test images (or Git LFS for large files)
- JSON schema for expected results
- Version control for prompt variations

### Integration Points

- Reuses existing `gemini.ts` service for scan execution
- Same image preprocessing pipeline as production
- Results exportable for analysis

---

## User Experience Principles

This epic is developer-focused. The "user" is the development team.

### Developer Experience Goals

- **Zero Friction Setup** - `npm run test:scan` just works
- **Clear Output** - Immediately see what passed/failed
- **Actionable Insights** - Understand WHY a scan failed, not just that it failed
- **Fast Feedback** - Quick iteration cycle for prompt tuning

### Key Interactions

1. **Add New Test Case**
   - Developer adds receipt image to test folder
   - Creates expected.json with ground truth data (or uses generator CLI)
   - Runs validation, then single test to verify

2. **Run Full Test Suite**
   - Execute all test cases with progress indicator
   - See summary report first (accuracy metrics)
   - Drill into details with `--verbose`

3. **Tune Prompt**
   - Modify prompt in configuration
   - Run tests against specific store type
   - Use A/B mode to compare prompt versions

4. **Analyze Failure**
   - View expected vs actual side-by-side diff
   - See which fields mismatched and by how much
   - Review historical results in `test-results/`

### Developer Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEVELOPER TESTING JOURNEY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: Add Test Case                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Get      │ →  │ Place in │ →  │ Generate │ →  │ Validate │              │
│  │ receipt  │    │ folder   │    │ expected │    │ format   │              │
│  │ image    │    │          │    │ .json    │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│  FR35: Real      Organized       FR40: CLI       FR41: Auto                │
│  failed scans    by store type   generator       validation                │
│                                                                              │
│  STAGE 2: Run Tests                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Run      │ →  │ See      │ →  │ Read     │ →  │ Identify │              │
│  │ command  │    │ progress │    │ summary  │    │ failures │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│  FR6-8: CLI      FR42: Progress  FR43: Summary   FR44: Diffs               │
│  commands        indicator       first output    for failures              │
│                                                                              │
│  STAGE 3: Iterate on Prompt                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Edit     │ →  │ A/B      │ →  │ Compare  │ →  │ Review   │              │
│  │ prompt   │    │ compare  │    │ results  │    │ history  │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│  FR23-26:        FR45: Compare   FR17-22:        FR46: Save                │
│  Configurable    prompt mode     Accuracy        with timestamps           │
│                                  metrics                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### Test Data Structure

- FR1: Test images stored in dedicated `/test-data/receipts/` directory
- FR2: Each test image has corresponding `{filename}.expected.json` with ground truth
- FR3: Expected JSON schema matches Transaction type structure
- FR4: Test images organized by store type (supermarket, pharmacy, restaurant, etc.)
- FR5: Minimum 20 test images covering 5+ store types for MVP

### Test Harness Core

- FR6: CLI command to run all tests (`npm run test:scan`)
- FR7: CLI command to run single test (`npm run test:scan -- --image=jumbo-001.jpg`)
- FR8: CLI command to run by category (`npm run test:scan -- --type=supermarket`)
- FR9: Test harness loads image, calls Gemini API, compares to expected
- FR10: Test harness uses production Gemini configuration

### Result Comparison

- FR11: Compare extracted merchant name to expected (exact and fuzzy match)
- FR12: Compare extracted date to expected date
- FR13: Compare extracted total to expected total (within tolerance)
- FR14: Compare extracted items count to expected
- FR15: Per-item comparison: name similarity, price match
- FR16: Category extraction comparison when applicable

### Accuracy Reporting

- FR17: Overall accuracy percentage (tests passed / total tests)
- FR18: Per-field accuracy breakdown (merchant: 85%, date: 92%, etc.)
- FR19: Per-store-type accuracy breakdown
- FR20: List of failed tests with failure reasons
- FR21: Detailed diff output for each failed test
- FR22: Summary statistics (total tests, passed, failed, accuracy)

### Prompt Management

- FR23: Gemini prompt stored in configurable location (not hardcoded)
- FR24: Support for multiple prompt versions
- FR25: Ability to run tests with specific prompt version
- FR26: Document prompt version used in test results

### Test Data Annotation

- FR27: Schema for expected.json includes all extractable fields
- FR28: Optional confidence threshold per field
- FR29: Support for marking fields as "optional" (not all receipts have all fields)
- FR30: Metadata for test case (store chain, receipt type, difficulty level)

### Developer Workflow

- FR31: Clear documentation for adding new test cases
- FR32: Validation script for expected.json format
- FR33: Test results exportable to JSON for further analysis
- FR34: Support for "baseline" mode to establish accuracy benchmarks

### Test Data Quality (from Pre-mortem Analysis)

- FR35: Test images MUST include real failed scans from production (user-provided)
- FR36: Expected.json requires validation/review before acceptance into test suite
- FR37: Define accuracy thresholds BEFORE development begins (see Success Criteria)
- FR38: Support difficulty tagging (easy/medium/hard) with separate reporting per difficulty

### Developer Experience (from Journey Mapping)

- FR39: Include 10 starter test images with epic delivery
- FR40: Provide expected.json generator CLI (`npm run test:scan:generate`)
- FR41: Validation command for expected.json format (`npm run test:scan:validate`)
- FR42: Show progress indicator during test runs
- FR43: Summary-first output with `--verbose` flag for detailed results
- FR44: Show expected vs actual side-by-side diff for failed tests
- FR45: A/B prompt comparison mode (`--compare-prompt=v2`)
- FR46: Save test results to `test-results/` directory with timestamps

### Coverage and Architecture (from Devil's Advocate)

- FR47: Track "store coverage" metric - which chains are represented in test suite
- FR48: Pluggable extractor architecture - support testing Gemini vs other APIs

---

## Non-Functional Requirements

### Performance

- NFR1: Single test execution completes in under 10 seconds
- NFR2: Full test suite (20 images) completes in under 5 minutes
- NFR3: Test harness does not require network access beyond Gemini API

### Developer Experience

- NFR4: Test harness installable with standard `npm install`
- NFR5: No additional runtime dependencies beyond existing project
- NFR6: Clear, colorized console output for pass/fail
- NFR7: Exit codes indicate success (0) or failure (non-zero) for CI integration

### Maintainability

- NFR8: Test harness code follows project coding standards
- NFR9: Test data format documented in README
- NFR10: Prompt versions tracked in version control

### Cost Management

- NFR11: Test runs against Gemini API incur real costs - document expected costs
- NFR12: Option to use cached results for comparison-only runs
- NFR13: Rate limiting to prevent accidental API cost spikes

---

## Test Data Requirements

### Initial Test Set (MVP)

| Store Type | Examples | Test Cases |
|------------|----------|------------|
| Supermarket | Jumbo, Líder, Santa Isabel, Unimarc, Tottus | 8 |
| Pharmacy | Cruz Verde, Salcobrand, Ahumada | 4 |
| Restaurant | Various | 3 |
| Gas Station | Copec, Shell | 2 |
| Convenience | OK Market, Big John | 2 |
| Other | Miscellaneous | 1 |
| **Total** | | **20** |

### Test Image Quality Requirements

- Clear, readable receipt images
- Representative of real user uploads
- Mix of photo quality (good lighting, poor lighting)
- Mix of receipt conditions (clean, crumpled, partial)

### Expected Data Requirements

For each test image, the expected.json must include:
- `merchant`: Canonical merchant name
- `date`: ISO date string
- `total`: Number (Chilean pesos)
- `items`: Array of {name, price} objects
- `category`: Expected category classification
- `metadata`: Store type, difficulty, notes

---

## Dependencies

### Existing Infrastructure

- Gemini API integration (`src/services/gemini.ts`)
- Image preprocessing (if any)
- TypeScript types for Transaction

### Required Setup

- Gemini API key with sufficient quota for testing
- Node.js development environment
- Git LFS (optional, for large image files)

### External Dependencies

- Google Gemini 2.0 Flash API availability
- No new cloud infrastructure required

---

## Implementation Considerations

### Prompt Engineering Focus Areas

Based on the scan_model research, key areas to tune:
1. **Few-shot examples** - Include Chilean receipt examples in prompt
2. **Merchant normalization** - Post-process against known merchant database
3. **Confidence thresholds** - When to flag for user verification
4. **Regional specifics** - RUT format, boleta electrónica structure

### Future Integration Points

This test infrastructure will later support:
- ML fine-tuning dataset generation
- Automated regression testing in CI
- Accuracy monitoring in production

---

## Summary

**Epic 8 delivers developer tooling to systematically improve scan accuracy:**

| Component | Purpose |
|-----------|---------|
| Test Image Repository | Ground truth data for accuracy measurement |
| Scan Test Harness | Automated execution and comparison |
| Accuracy Reporting | Quantified metrics for improvement tracking |
| Prompt Management | Systematic prompt engineering workflow |
| Developer Experience | Fast iteration with clear feedback |

**Total Functional Requirements:** 48
**Total Non-Functional Requirements:** 13

### Elicitation Methods Applied

| Method | Key Insight |
|--------|-------------|
| **Five Whys** | Root cause is lack of measurement infrastructure - test harness is prerequisite |
| **Pre-mortem** | Must use real failed scans, define thresholds upfront, tag difficulty |
| **First Principles** | Different fields have different accuracy tolerances |
| **Journey Mapping** | Developer pain points → generator CLI, progress, diffs, history |
| **Devil's Advocate** | Validated approach; added pluggable architecture for API comparison |

This infrastructure is foundational for building boletapp's competitive moat - without accurate scanning, there's no user corrections to train on, and no data advantage to build.

---

_This PRD captures the requirements for Epic 8 - Scan Testing & Tuning Infrastructure. It enables data-driven improvement of the core receipt scanning capability._

_Created through collaborative discovery between Gabe and AI facilitator._
