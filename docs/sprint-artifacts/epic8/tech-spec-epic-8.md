# Epic Technical Specification: Scan Testing & Tuning Infrastructure

Date: 2025-12-11
Author: Gabe
Epic ID: 8
Status: Draft

---

## Overview

Epic 8 creates **developer testing infrastructure** to systematically evaluate, tune, and improve Boletapp's receipt scanning accuracy for Chilean receipts. This is developer tooling—not user-facing features—that enables data-driven improvement of the Gemini-powered scanner.

The test infrastructure provides:
- **Reproducible Testing** - Same receipt image → same expected result → measurable accuracy
- **Prompt Engineering Feedback Loop** - Test changes to Gemini prompts against real receipts
- **Foundation for ML Training** - Test images + expected outputs = future training data
- **Chilean Market Expertise** - Deep understanding of local receipt formats (RUT, boleta electrónica, specific store chains)

The PRD identifies the root cause: **No test infrastructure exists to quantify accuracy or iterate with measurable feedback.** Epic 8 addresses this by building measurement capability first.

## Objectives and Scope

### In Scope (MVP)

- **Test Image Repository** - `/test-data/receipts/` with 20+ annotated test images across 6 store types
- **Scan Test Harness** - CLI-based tool (`npm run test:scan`) to run scans against test images
- **Accuracy Reporting** - Per-field and per-store-type metrics with weighted scoring
- **Prompt Management** - Shared prompts library in `shared/prompts/` with versioning
- **Developer Experience** - Zero-friction setup, progress indicators, failure diffs

### Out of Scope (Growth Features)

- Visual diff tool showing expected vs actual extraction
- Automated regression testing in CI pipeline
- Historical accuracy tracking over time
- Integration with correction data from production users
- Multi-region test suites (Chile, Colombia, Mexico)
- Automated prompt optimization using test results

## System Architecture Alignment

**Architecture Reference:** `docs/architecture-epic8.md`

### Components Referenced

| Component | Location | Purpose |
|-----------|----------|---------|
| **Shared Prompts Library** | `shared/prompts/` | Single source of truth for Gemini prompts |
| **Test Harness CLI** | `scripts/scan-test/` | Commands for run, generate, validate, analyze |
| **Test Data** | `test-data/receipts/` | Receipt images organized by store type |
| **Test Results** | `test-results/` | JSON output files (gitignored) |

### Architectural Constraints

1. **Production Path Testing** - Test harness calls the actual Cloud Function endpoint (not a mock)
2. **Corrections-Based Ground Truth** - Humans only correct AI mistakes, not rewrite everything (ADR-011)
3. **Cost Protection** - Default limit of 5 tests per run (ADR-012)
4. **Shared Prompts** - Single export controls production prompt (ADR-010)

### Modified Existing Files

- `functions/src/analyzeReceipt.ts` - Import prompt from `shared/prompts/`
- `package.json` - Add 5 new npm scripts
- `.gitignore` - Add `test-results/`

## Detailed Design

### Services and Modules

| Module | Location | Responsibility | Inputs | Outputs |
|--------|----------|----------------|--------|---------|
| **CLI Entry** | `scripts/scan-test/index.ts` | Command routing | CLI args | Dispatch to subcommand |
| **Run Command** | `scripts/scan-test/commands/run.ts` | Execute test suite | Flags, test data | Test results JSON |
| **Generate Command** | `scripts/scan-test/commands/generate.ts` | Create expected.json | Image path | Expected.json file |
| **Validate Command** | `scripts/scan-test/commands/validate.ts` | Schema validation | All expected.json | Validation report |
| **Analyze Command** | `scripts/scan-test/commands/analyze.ts` | Failure analysis | Results JSON | Analysis report |
| **Scanner** | `scripts/scan-test/lib/scanner.ts` | Call Cloud Function | Image buffer | AI extraction result |
| **Comparator** | `scripts/scan-test/lib/comparator.ts` | Compare actual vs expected | Two extractions | Field-by-field diff |
| **Ground Truth** | `scripts/scan-test/lib/ground-truth.ts` | Merge AI + corrections | TestCaseFile | Final expected |
| **Reporter** | `scripts/scan-test/lib/reporter.ts` | Generate reports | Test results | Console + JSON |
| **Analyzer** | `scripts/scan-test/lib/analyzer.ts` | Pattern detection | Failures | Structured analysis |
| **Schema** | `scripts/scan-test/lib/schema.ts` | Zod validators | Raw JSON | Typed objects |
| **Fuzzy** | `scripts/scan-test/lib/fuzzy.ts` | String similarity | Two strings | Similarity score |
| **Prompts Index** | `shared/prompts/index.ts` | Export active prompt | - | PromptConfig |

### Data Models and Contracts

#### TestCaseFile Schema (Zod)

```typescript
// scripts/scan-test/lib/schema.ts
import { z } from 'zod';

const MetadataSchema = z.object({
  testId: z.string(),
  storeType: z.enum(['supermarket', 'pharmacy', 'restaurant', 'gas_station', 'convenience', 'other']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  region: z.enum(['CL', 'CO', 'MX', 'AR']).default('CL'),
  source: z.enum(['production-failure', 'manual-collection', 'user-provided']),
  addedAt: z.string(),
  addedBy: z.string().optional(),
  notes: z.string().optional(),
});

const AIExtractionSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  total: z.number(),
  category: z.string(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    category: z.string().optional(),
  })),
  model: z.string(),
  modelVersion: z.string(),
  extractedAt: z.string(),
  confidence: z.object({
    overall: z.number().optional(),
    merchant: z.number().optional(),
    date: z.number().optional(),
    total: z.number().optional(),
  }).optional(),
});

const CorrectionsSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  category: z.string().optional(),
  items: z.record(z.string(), z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    category: z.string().optional(),
    delete: z.boolean().optional(),
  })).optional(),
  addItems: z.array(z.object({
    name: z.string(),
    price: z.number(),
    category: z.string().optional(),
  })).optional(),
  correctedAt: z.string().optional(),
  correctedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
});

export const TestCaseFileSchema = z.object({
  metadata: MetadataSchema,
  aiExtraction: AIExtractionSchema.optional(),
  corrections: CorrectionsSchema.optional(),
  thresholds: z.object({
    merchantSimilarity: z.number().default(0.8),
    totalTolerance: z.number().default(0),
    dateTolerance: z.enum(['exact', 'day', 'month']).default('exact'),
  }).optional(),
});

export type TestCaseFile = z.infer<typeof TestCaseFileSchema>;
```

#### PromptConfig Type

```typescript
// shared/prompts/types.ts
export interface PromptConfig {
  id: string;                    // "v2-few-shot"
  name: string;                  // "Few-Shot Chilean"
  description: string;           // "Includes 3 Chilean receipt examples"
  version: string;               // "2.0.0"
  createdAt: string;             // "2025-01-15"
  prompt: string;                // The actual prompt text
  fewShotExamples?: string[];    // Optional examples to append
}
```

#### TestResult Type

```typescript
// scripts/scan-test/types.ts
export interface TestResult {
  testId: string;
  passed: boolean;
  score: number;
  fields: {
    total: { expected: number; actual: number; match: boolean };
    date: { expected: string; actual: string; match: boolean };
    merchant: { expected: string; actual: string; similarity: number; match: boolean };
    itemsCount: { expected: number; actual: number; match: boolean };
    itemPrices: { accuracy: number; details: ItemComparison[] };
  };
  apiCost: number;
  duration: number;
  error?: string;
}
```

### APIs and Interfaces

#### Cloud Function (Existing - Called by Test Harness)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `analyzeReceipt` | POST | `{ imageBase64: string, userId: string, currency: string }` | `{ merchant, date, total, items[], category }` |

#### CLI Commands

```bash
# npm run test:scan [subcommand] [options]

# Run tests
npm run test:scan                           # Default: 5 tests, active prompt
npm run test:scan -- --image=jumbo-001.jpg  # Single test
npm run test:scan -- --type=supermarket     # Filter by store type
npm run test:scan -- --folder=/path         # Custom folder
npm run test:scan -- --limit=20             # Override limit
npm run test:scan -- --limit=all            # All tests
npm run test:scan -- --prompt=v2-few-shot   # Specific prompt
npm run test:scan -- --compare=v1,v2        # A/B comparison
npm run test:scan -- --verbose              # Detailed output
npm run test:scan -- --dry-run              # No API calls

# Generate expected.json
npm run test:scan:generate -- --image=file.jpg
npm run test:scan:generate -- --folder=/path

# Validate all expected.json
npm run test:scan:validate

# Analyze failures
npm run test:scan:analyze
npm run test:scan:analyze -- --result=path/to/file
```

### Workflows and Sequencing

#### Test Execution Flow

```
1. CLI parses args → Determine mode (run/generate/validate/analyze)
2. Load test cases from test-data/receipts/
3. Apply --limit filter (default=5)
4. For each test case:
   a. Load image + expected.json
   b. Compute ground truth = aiExtraction + corrections
   c. Call Cloud Function with image (unless --dry-run)
   d. Compare result vs ground truth using Comparator
   e. Calculate weighted field scores
5. Generate summary report (console)
6. Save full results to test-results/{timestamp}_{prompt}.json
7. Exit with code 0 (all pass) or 1 (failures) or 2 (error)
```

#### Test Case Creation Flow

```
1. Developer adds receipt image to test-data/receipts/{type}/
2. Run: npm run test:scan:generate -- --image=filename.jpg
3. CLI calls Cloud Function, gets AI extraction
4. CLI creates {filename}.expected.json with:
   - metadata: { testId, storeType: (from folder), difficulty: "medium", ... }
   - aiExtraction: { ...AI result... }
   - corrections: {} (empty - human fills if needed)
5. Human reviews, fills metadata.difficulty, adds corrections for errors
6. Run: npm run test:scan:validate (checks schema)
7. Run: npm run test:scan -- --image=filename.jpg (verify pass)
```

#### Prompt Improvement Flow

```
1. Run: npm run test:scan -- --limit=all
2. Review failures in console output
3. Run: npm run test:scan:analyze
4. Review analysis report (patterns, byField, byStoreType)
5. Create new prompt version in shared/prompts/v{N}.ts
6. A/B test: npm run test:scan -- --compare=current,new
7. If improved, update shared/prompts/index.ts: export ACTIVE_PROMPT
8. Deploy: firebase deploy --only functions
```

## Non-Functional Requirements

### Performance

| Requirement | Target | Source |
|-------------|--------|--------|
| Single test execution | < 10 seconds | NFR1 |
| Full test suite (20 images) | < 5 minutes | NFR2 |
| No network access beyond Gemini API | Required | NFR3 |

**Implementation Notes:**
- Sequential test execution (no parallelism) to respect rate limits
- Progress indicator updates after each test
- Cached results option for comparison-only runs

### Security

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | Firebase user token (local) or service account (CI) |
| **Data Protection** | Test images must not contain production user receipts without consent |
| **API Key Protection** | Uses existing GEMINI_API_KEY from environment |
| **Results Privacy** | test-results/ is gitignored |

**Authentication Flow:**
```typescript
async function getAuthToken(): Promise<string> {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return getServiceAccountToken(); // CI
  }
  return getUserToken(); // Local: firebase login
}
```

### Reliability/Availability

| Scenario | Behavior | Exit Code |
|----------|----------|-----------|
| API error (recoverable) | Retry once, then mark "error" | 2 |
| Rate limit | Wait 30s, retry | (continues) |
| Test failure | Report in summary | 1 |
| All tests pass | Success | 0 |
| User input error | Clear message | 2 |

**Degradation:** If Cloud Function is unavailable, CLI exits with code 2 and clear error message.

### Observability

| Signal | Implementation |
|--------|----------------|
| **Progress** | Console progress bar during test runs |
| **Logging** | Chalk-colored output (✓/✗/⚠/●) |
| **Results** | JSON file in test-results/ with timestamp |
| **Cost Tracking** | `apiCost` field in each test result |
| **Timing** | `duration` field per test |

**Output Modes:**
- Default: Progress + summary + failed tests
- `--verbose`: + per-test details, diffs
- `--quiet`: Only final pass/fail
- `--json`: Machine-readable JSON

## Dependencies and Integrations

### New Dependencies (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| `commander` or `yargs` | Latest | CLI argument parsing |
| `tsx` | Latest | Run TypeScript directly without build |
| `zod` | ^3.x | Runtime schema validation |
| `string-similarity` | Latest | Fuzzy merchant name matching |
| `chalk` | ^5.x | Colored console output |

### Existing Dependencies Used

| Package | Purpose |
|---------|---------|
| `firebase-admin` | Service account authentication |
| `vitest` | Test harness self-tests |

### Integration Points

| Integration | Type | Notes |
|-------------|------|-------|
| **Cloud Function** | HTTP POST | Test harness calls `analyzeReceipt` endpoint |
| **Firebase Auth** | Token | User token or service account for authentication |
| **Gemini API** | Via Cloud Function | No direct API calls from test harness |
| **shared/prompts/** | Import | Cloud Function imports ACTIVE_PROMPT |

### npm Scripts (Add to package.json)

```json
{
  "scripts": {
    "test:scan": "tsx scripts/scan-test/index.ts run",
    "test:scan:generate": "tsx scripts/scan-test/index.ts generate",
    "test:scan:validate": "tsx scripts/scan-test/index.ts validate",
    "test:scan:analyze": "tsx scripts/scan-test/index.ts analyze",
    "test:scan:self-test": "vitest run scripts/scan-test/__tests__"
  }
}
```

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `CLOUD_FUNCTION_URL` | No | Auto-detect from firebase.json | Cloud Function endpoint |
| `GOOGLE_APPLICATION_CREDENTIALS` | CI only | - | Service account for CI |
| `GEMINI_API_KEY` | Inherited | - | Passed through Cloud Function |

## Acceptance Criteria (Authoritative)

### AC1: Shared Prompts Library
- [ ] `shared/prompts/` directory exists with index.ts, types.ts, base.ts, v1-original.ts
- [ ] ACTIVE_PROMPT is exported from index.ts
- [ ] `functions/src/analyzeReceipt.ts` imports and uses ACTIVE_PROMPT
- [ ] Cloud Function deploys and works with shared prompt
- [ ] getPrompt(id) returns specific prompt version
- [ ] listPrompts() returns all available prompts

### AC2: Test Data Structure
- [ ] `test-data/receipts/` directory exists with subdirectories for each store type
- [ ] At least 10 test images included with expected.json files
- [ ] TestCaseFile schema validates all expected.json files
- [ ] Each expected.json has metadata (testId, storeType, difficulty, source)
- [ ] Store type coverage: supermarket (4+), pharmacy (2+), restaurant (2+), other (2+)

### AC3: CLI Scaffold & Run Command
- [ ] `npm run test:scan` executes without errors
- [ ] Default limit of 5 tests applied
- [ ] `--image=filename` runs single test
- [ ] `--type=storetype` filters by store type
- [ ] `--limit=N` overrides default limit
- [ ] `--verbose` shows detailed output
- [ ] `--dry-run` shows plan without API calls
- [ ] Exit code 0 for all pass, 1 for failures, 2 for errors

### AC4: Comparator & Reporter
- [ ] Total comparison: exact match
- [ ] Date comparison: exact match
- [ ] Merchant comparison: fuzzy similarity ≥ 0.8
- [ ] Items count: within ±1 tolerance
- [ ] Item prices: per-item exact match
- [ ] Weighted composite score calculated per PRD thresholds
- [ ] Console output colorized (green/red/yellow)
- [ ] Results saved to test-results/{timestamp}_{prompt}.json

### AC5: Generate & Validate Commands
- [ ] `npm run test:scan:generate -- --image=file.jpg` creates expected.json
- [ ] Generated file includes aiExtraction populated from Cloud Function
- [ ] Generated file has empty corrections object for human review
- [ ] `npm run test:scan:validate` checks all expected.json against schema
- [ ] Validation errors clearly indicate which file and field failed

### AC6: Analyze Command & A/B Mode
- [ ] `npm run test:scan:analyze` generates analysis JSON
- [ ] Analysis includes byField breakdown (failure count, patterns)
- [ ] Analysis includes byStoreType breakdown
- [ ] `--compare=v1,v2` runs both prompts and compares results
- [ ] A/B comparison shows side-by-side accuracy metrics

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC1 | Services/Modules: Prompts Index | `shared/prompts/*`, `functions/src/analyzeReceipt.ts` | Unit: export tests; Integration: deploy and scan |
| AC2 | Data Models: TestCaseFile | `test-data/receipts/*`, `schema.ts` | Validation: schema parse all files |
| AC3 | Workflows: Test Execution | `commands/run.ts`, `scanner.ts` | E2E: run with --dry-run and real |
| AC4 | Data Models: TestResult | `comparator.ts`, `reporter.ts`, `fuzzy.ts` | Unit: comparison edge cases |
| AC5 | Workflows: Test Case Creation | `commands/generate.ts`, `commands/validate.ts` | E2E: generate and validate cycle |
| AC6 | Workflows: Prompt Improvement | `commands/analyze.ts`, `analyzer.ts` | E2E: analyze real failure set |

### PRD → Tech Spec Coverage

| PRD FR Group | FR Count | Covered By |
|--------------|----------|------------|
| Test Data Structure (FR1-5) | 5 | AC2 |
| Test Harness Core (FR6-10) | 5 | AC3 |
| Result Comparison (FR11-16) | 6 | AC4 |
| Accuracy Reporting (FR17-22) | 6 | AC4 |
| Prompt Management (FR23-26) | 4 | AC1 |
| Test Data Annotation (FR27-34) | 8 | AC2, AC5 |
| Test Data Quality (FR35-38) | 4 | AC2 |
| Developer Experience (FR39-46) | 8 | AC3, AC5, AC6 |
| Coverage & Architecture (FR47-48) | 2 | AC2, AC6 |

**Total FR Coverage:** 48/48 (100%)

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R1: Test image collection effort** | High | Medium | Include 10 starter images; collect from production failures |
| **R2: Cloud Function modification breaks production** | Medium | High | Careful deployment sequence; shared prompts is backwards-compatible |
| **R3: API cost spikes during testing** | Medium | Low | Default limit of 5 tests (ADR-012); `--dry-run` mode |
| **R4: Accuracy thresholds unrealistic** | Medium | Low | Defined upfront in PRD; adjust based on baseline measurement |
| **R5: Authentication complexity** | Low | Medium | User token fallback to service account; clear error messages |

### Assumptions

| Assumption | Impact if Wrong | Validation |
|------------|-----------------|------------|
| **A1:** Cloud Function endpoint is stable | Test harness unusable | Verified in Epic 4.5 |
| **A2:** Gemini API latency < 10s per image | Tests timeout | Adjust timeout if needed |
| **A3:** tsx can import from shared/prompts/ | Build config needed | Test during Story 8.1 |
| **A4:** Test images don't require Git LFS | Repo bloat | Monitor; add LFS if > 50MB |

### Open Questions

| Question | Owner | Blocking? | Resolution Path |
|----------|-------|-----------|-----------------|
| **Q1:** Where to source test images? | Gabe | No | Production failures, manual collection |
| **Q2:** Should we use Git LFS for images? | Dev | No | Decide based on total size after 10 images |
| **Q3:** CI integration in MVP? | PM | No | Growth feature; skip for MVP |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Unit Tests** | comparator.ts, schema.ts, fuzzy.ts | Vitest | 80% |
| **Integration Tests** | CLI commands, Cloud Function calls | Vitest + mocks | 60% |
| **E2E Tests** | Full workflow with real API | Manual + `npm run test:scan:self-test` | Smoke only |

### Test Locations

```
scripts/scan-test/__tests__/
├── comparator.test.ts      # Field comparison logic
├── schema.test.ts          # Zod validation
├── cli.test.ts             # Command parsing
├── ground-truth.test.ts    # Merge AI + corrections
└── fixtures/
    └── mock-responses/     # Canned API responses
```

### AC Test Matrix

| AC | Test Type | Test Script | Pass Criteria |
|----|-----------|-------------|---------------|
| AC1 | Integration | Deploy + scan | Cloud Function uses shared prompt |
| AC2 | Validation | `npm run test:scan:validate` | All 10+ expected.json pass schema |
| AC3 | E2E | `npm run test:scan -- --dry-run` | CLI executes, shows plan |
| AC4 | Unit | `comparator.test.ts` | Edge cases pass |
| AC5 | E2E | Generate then validate cycle | File created and valid |
| AC6 | E2E | `npm run test:scan:analyze` | Analysis JSON generated |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Image file not found | Clear error, exit 2 |
| Invalid expected.json | Schema error with field details |
| API timeout | Retry once, then mark error |
| Rate limit hit | Wait 30s, retry |
| Zero test images | Clear message, exit 2 |
| All tests pass | Exit 0, green summary |
| Some tests fail | Exit 1, red failures listed |

---

## Story Breakdown (Suggested)

Based on the acceptance criteria and architectural dependencies:

### Story 8.1: Shared Prompts Library (Foundation)
**Points:** 3
**Covers:** AC1
- Create `shared/prompts/` structure
- Extract current prompt from `analyzeReceipt.ts`
- Update Cloud Function imports
- Deploy and verify

### Story 8.2: Test Data Structure (Foundation)
**Points:** 3
**Covers:** AC2
- Create `/test-data/receipts/` directories
- Define TestCaseFile schema with Zod
- Add 10 starter test images with expected.json
- Document test data format

### Story 8.3: CLI Scaffold & Run Command (Core)
**Points:** 5
**Covers:** AC3 (partial)
- Create `/scripts/scan-test/` structure
- Implement CLI with Commander/Yargs
- Basic `npm run test:scan` with limit
- Connect to Cloud Function

### Story 8.4: Comparator & Reporter (Core)
**Points:** 5
**Covers:** AC4
- Implement comparison logic for all fields
- Fuzzy matching for merchant
- Weighted scoring per PRD thresholds
- Colorized console output
- JSON result file generation

### Story 8.5: Generate & Validate Commands (DX)
**Points:** 3
**Covers:** AC5
- `npm run test:scan:generate` implementation
- `npm run test:scan:validate` implementation
- Human correction workflow documentation

### Story 8.6: Analyze Command & A/B Mode (Advanced)
**Points:** 3
**Covers:** AC6
- `npm run test:scan:analyze` implementation
- `--compare` flag for A/B testing
- Failure pattern analysis

### Story 8.99: Epic Release Deployment
**Points:** 1
- Final testing of all workflows
- Documentation review
- Deploy to production

**Total Estimated Points:** 23

---

_Generated by BMAD Epic Tech Context Workflow v6-alpha_
_Date: 2025-12-11_
_Epic: 8 - Scan Testing & Tuning Infrastructure_
