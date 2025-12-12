# Architecture Document - Epic 8: Scan Testing & Tuning Infrastructure

**Version:** 1.0
**Date:** 2025-12-10
**Author:** Gabe (with AI facilitation)
**Scope:** Developer tooling for systematic scan accuracy improvement

---

## Executive Summary

Epic 8 creates a **developer testing infrastructure** to systematically evaluate, tune, and improve Boletapp's receipt scanning accuracy. This is developer tooling—not user-facing features—that enables data-driven improvement of the Gemini-powered scanner for Chilean receipts.

The architecture introduces a CLI-based test harness that:
- Runs receipt images through the production Cloud Function
- Compares AI results against human-corrected ground truth
- Reports per-field and per-store accuracy metrics
- Generates failure analysis reports to guide prompt improvements

**Key Architectural Decisions:**
- **Shared Prompts Library** - Single source of truth for prompts used by both production and testing
- **Corrections-Based Ground Truth** - Humans only correct AI mistakes, not rewrite everything
- **Cost-Protected by Default** - Limit of 5 tests per run to prevent API cost spikes

---

## Decision Summary

| # | Category | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Test Data Location | `/test-data/receipts/` | Separates binary test data from source code |
| 2 | Test Harness Architecture | CLI tool in `/scripts/scan-test/` | Unified interface with subcommands |
| 3 | Gemini Service Integration | Call Cloud Function endpoint | Tests exact production path |
| 4 | Expected Results Schema | Two-part (AI extraction + corrections) | Aligns with ML training schema, minimal human effort |
| 5 | Accuracy Calculation | Composite score with weighted fields | Matches PRD thresholds |
| 6 | Prompt Management | Separate files in `shared/prompts/` | Version control, easy A/B testing |
| 7 | Result Storage | JSON files in `test-results/` | Git-trackable history |
| 8 | CLI Interface | Commands with --folder and --limit support | Flexible, cost-protected |
| 9 | Shared Prompts Library | Extract to `shared/prompts/`, import everywhere | Single source of truth |

---

## Project Structure

```
boletapp/
├── shared/                              # NEW: Shared code between app and tools
│   └── prompts/
│       ├── index.ts                     # Exports ACTIVE_PROMPT + helpers
│       ├── types.ts                     # PromptConfig interface
│       ├── base.ts                      # Shared prompt parts (categories, format)
│       ├── v1-original.ts               # Current production prompt
│       └── v2-few-shot.ts               # Future: Chilean examples
│
├── scripts/                             # NEW: Developer tools
│   └── scan-test/
│       ├── index.ts                     # CLI entry point
│       ├── config.ts                    # Configuration (limits, thresholds)
│       ├── commands/
│       │   ├── run.ts                   # npm run test:scan
│       │   ├── generate.ts              # npm run test:scan:generate
│       │   ├── validate.ts              # npm run test:scan:validate
│       │   └── analyze.ts               # npm run test:scan:analyze
│       ├── lib/
│       │   ├── scanner.ts               # Calls Cloud Function
│       │   ├── comparator.ts            # Compares actual vs expected
│       │   ├── ground-truth.ts          # Merges AI extraction + corrections
│       │   ├── reporter.ts              # Generates accuracy reports
│       │   ├── analyzer.ts              # Failure pattern analysis
│       │   ├── schema.ts                # Validates expected.json
│       │   └── fuzzy.ts                 # Fuzzy string matching
│       ├── types.ts                     # Test harness types
│       └── __tests__/
│           ├── comparator.test.ts
│           ├── schema.test.ts
│           ├── cli.test.ts
│           └── fixtures/
│               └── mock-responses/
│
├── test-data/                           # NEW: Test fixtures
│   └── receipts/
│       ├── supermarket/
│       │   ├── jumbo-001.jpg
│       │   ├── jumbo-001.expected.json
│       │   ├── lider-001.jpg
│       │   └── lider-001.expected.json
│       ├── pharmacy/
│       ├── restaurant/
│       ├── gas-station/
│       ├── convenience/
│       └── other/
│
├── test-results/                        # NEW: Test output (gitignored except .gitkeep)
│   ├── .gitkeep
│   ├── 2025-01-15_103045_v1-original.json
│   └── analysis-2025-01-15_103045.json
│
├── functions/                           # EXISTING: Cloud Functions
│   └── src/
│       └── analyzeReceipt.ts            # MODIFIED: Import from shared/prompts
│
├── src/                                 # EXISTING: React app (no changes)
│   └── ...
│
└── package.json                         # MODIFIED: Add new npm scripts
```

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **CLI Framework** | Commander or Yargs | Latest | Command parsing |
| **TypeScript Runner** | tsx | Latest | Run TS directly without build |
| **Schema Validation** | Zod | Latest | Runtime validation of expected.json |
| **Fuzzy Matching** | string-similarity | Latest | Merchant name comparison |
| **Console Styling** | chalk | Latest | Colored CLI output |
| **HTTP Client** | node-fetch or built-in | Latest | Call Cloud Function |

**No new cloud infrastructure required** - uses existing Cloud Function endpoint.

---

## CLI Commands

```bash
# Core commands
npm run test:scan                           # Run tests (default limit=5)
npm run test:scan -- --image=jumbo-001.jpg  # Run single test
npm run test:scan -- --type=supermarket     # Run by store type
npm run test:scan -- --folder=/path/to/imgs # Run on arbitrary folder
npm run test:scan -- --limit=20             # Override limit
npm run test:scan -- --limit=all            # Run ALL tests (no limit)

# Generation & validation
npm run test:scan:generate -- --image=jumbo-001.jpg  # Generate expected.json
npm run test:scan:generate -- --folder=/path/to/imgs # Generate for folder
npm run test:scan:validate                           # Validate all expected.json

# Analysis
npm run test:scan:analyze                            # Analyze most recent results
npm run test:scan:analyze -- --result=path/to/file   # Analyze specific file

# Output control
npm run test:scan -- --verbose              # Detailed output with diffs
npm run test:scan -- --quiet                # Only final pass/fail
npm run test:scan -- --json                 # Machine-readable JSON output
npm run test:scan -- --dry-run              # Show what would run, no API calls

# Prompt testing
npm run test:scan -- --prompt=v2-few-shot   # Use specific prompt
npm run test:scan -- --compare=v1,v2        # A/B comparison mode

# Self-testing
npm run test:scan:self-test                 # Run test harness's own tests
```

---

## Expected Results Schema

The schema uses a **two-part structure** aligned with the ML training infrastructure from `docs/scan_model/`:

```typescript
interface TestCaseFile {
  // === METADATA (required, human fills once) ===
  metadata: {
    testId: string;                    // "jumbo-001"
    storeType: "supermarket" | "pharmacy" | "restaurant" | "gas_station" | "convenience" | "other";
    difficulty: "easy" | "medium" | "hard";
    region: "CL" | "CO" | "MX" | "AR";
    source: "production-failure" | "manual-collection" | "user-provided";
    addedAt: string;                   // ISO date
    addedBy?: string;
    notes?: string;
  };

  // === AI EXTRACTION (auto-populated by generate command) ===
  aiExtraction?: {
    merchant: string;
    date: string;
    total: number;
    category: string;
    items: Array<{
      name: string;
      price: number;
      category?: string;
    }>;
    model: string;
    modelVersion: string;
    extractedAt: string;
    confidence?: {
      overall?: number;
      merchant?: number;
      date?: number;
      total?: number;
    };
  };

  // === HUMAN CORRECTIONS (only fields that need fixing) ===
  corrections?: {
    merchant?: string;                 // Only if AI got it wrong
    date?: string;
    total?: number;
    category?: string;
    items?: {
      [index: number]: {
        name?: string;
        price?: number;
        category?: string;
        delete?: boolean;              // AI hallucinated this item
      };
    };
    addItems?: Array<{                 // AI missed these items
      name: string;
      price: number;
      category?: string;
    }>;
    correctedAt?: string;
    correctedBy?: string;
    reviewNotes?: string;
  };

  // === ACCURACY THRESHOLDS (optional per-test overrides) ===
  thresholds?: {
    merchantSimilarity?: number;       // Default 0.8
    totalTolerance?: number;           // Default 0 (exact)
    dateTolerance?: "exact" | "day" | "month";
  };
}
```

**Ground Truth Calculation:**
```
groundTruth.field = corrections.field ?? aiExtraction.field
```

---

## Accuracy Calculation

**Composite Score** with weighted fields per PRD thresholds:

| Field | Target Accuracy | Weight | Comparison Method |
|-------|-----------------|--------|-------------------|
| **Total** | 98% | 25% | Exact match |
| **Date** | 95% | 15% | Exact match |
| **Merchant** | 90% | 20% | Fuzzy similarity ≥ 0.8 |
| **Items Count** | 85% | 15% | Within ±1 tolerance |
| **Item Prices** | 90% | 25% | Per-item exact match |

**Per-Test Score:**
```typescript
testScore = (
  (totalCorrect ? 1 : 0) * 0.25 +
  (dateCorrect ? 1 : 0) * 0.15 +
  (merchantSimilarity >= 0.8 ? 1 : 0) * 0.20 +
  (itemsCountCorrect ? 1 : 0) * 0.15 +
  itemPricesAccuracy * 0.25
) * 100
```

---

## Shared Prompts Architecture

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

// shared/prompts/index.ts
export { PROMPT_V1 } from './v1-original';
export { PROMPT_V2 } from './v2-few-shot';

// ⭐ THE ACTIVE PROMPT - change this one line to switch production
export { PROMPT_V1 as ACTIVE_PROMPT } from './v1-original';

// Helpers for test harness
export function getPrompt(versionId: string): PromptConfig { ... }
export function listPrompts(): PromptConfig[] { ... }
```

**Production Integration:**
```typescript
// functions/src/analyzeReceipt.ts
import { ACTIVE_PROMPT } from '../../shared/prompts';

const prompt = ACTIVE_PROMPT.prompt
  .replace('{{currency}}', data.currency)
  .replace('{{today}}', todayStr);
```

---

## Data Flow Diagrams

### Test Creation Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Add image  │ →  │   Generate   │ →  │   Human      │ →  │   Validate   │
│   to folder  │    │   expected   │    │   reviews    │    │   schema     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       ↓                   ↓                   ↓                   ↓
  test-data/          Calls Cloud       Fills metadata      Checks required
  receipts/           Function,         + corrections       fields present
  {type}/{id}.jpg     saves JSON        only for errors
```

### Test Execution Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TEST EXECUTION FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Load test cases from test-data/receipts/                             │
│                    ↓                                                      │
│  2. Apply limit (default=5)                                              │
│                    ↓                                                      │
│  3. For each test case:                                                  │
│     ┌─────────────────────────────────────────────────────────────────┐  │
│     │ a. Load image + expected.json                                    │  │
│     │ b. Compute ground truth (aiExtraction + corrections)            │  │
│     │ c. Call Cloud Function with image                               │  │
│     │ d. Compare result vs ground truth                               │  │
│     │ e. Calculate weighted field scores                              │  │
│     └─────────────────────────────────────────────────────────────────┘  │
│                    ↓                                                      │
│  4. Generate summary report (console)                                    │
│                    ↓                                                      │
│  5. Save to test-results/{timestamp}_{prompt}.json                       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Prompt Improvement Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Run tests   │ →  │   Analyze    │ →  │  Human/LLM   │ →  │   A/B test   │
│              │    │   failures   │    │   improves   │    │   prompts    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       ↓                   ↓                   ↓                   ↓
  test:scan           test:scan:analyze   Creates new         --compare=v1,v2
  generates           groups failures,    prompt version      validates
  result JSON         saves analysis      in shared/prompts/  improvement
                                                                   │
                                                                   ↓
                                                          Update ACTIVE_PROMPT
                                                          firebase deploy
```

---

## Failure Analysis Report

The `test:scan:analyze` command generates a structured JSON file for human review or LLM-assisted prompt improvement:

```json
{
  "generatedAt": "2025-01-15T10:30:45Z",
  "promptVersion": "v2-few-shot",
  "promptFile": "shared/prompts/v2-few-shot.ts",

  "summary": {
    "totalTests": 20,
    "failedTests": 5,
    "overallAccuracy": 75
  },

  "byField": {
    "total": {
      "failureCount": 2,
      "failureRate": 0.10,
      "affectedTests": ["cruz-verde-001", "copec-001"],
      "patterns": [
        {
          "description": "AI picked subtotal instead of final total",
          "occurrences": 2,
          "examples": [
            { "testId": "cruz-verde-001", "expected": 15990, "actual": 13440 }
          ]
        }
      ]
    }
  },

  "byStoreType": {
    "pharmacy": { "failureCount": 3, "tests": 4, "failureRate": 0.75 },
    "supermarket": { "failureCount": 1, "tests": 10, "failureRate": 0.10 }
  },

  "failures": [ /* detailed per-test data */ ],

  "_meta": {
    "usage": {
      "manual": "Review 'byField' and 'patterns' to identify prompt improvements",
      "withLLM": {
        "instructions": "Use this file as context along with the prompt file",
        "suggestedPrompt": "I need help improving my receipt scanning prompt..."
      }
    }
  }
}
```

---

## Cross-Cutting Concerns

### Error Handling

| Error Type | Behavior | Exit Code |
|------------|----------|-----------|
| User input error | Clear message | 2 |
| API error | Retry once, then mark as "error" | 2 |
| Rate limit | Wait 30s, retry | (continues) |
| Test failure | Report in summary | 1 |
| All tests pass | Success | 0 |

### Logging

| Mode | Flag | Output |
|------|------|--------|
| Default | (none) | Progress, summary, failed tests |
| Verbose | `--verbose` | + per-test details, diffs |
| Quiet | `--quiet` | Only pass/fail |
| JSON | `--json` | Machine-readable |

### Cost Management

| Protection | Implementation |
|------------|----------------|
| **Default limit** | 5 tests per run (always) |
| **Override** | `--limit=N` or `--limit=all` |
| **Dry run** | `--dry-run` shows plan, no API calls |
| **Cost tracking** | `apiCost` field in result files |

### Configuration

```typescript
// scripts/scan-test/config.ts
export const CONFIG = {
  testDataDir: 'test-data/receipts',
  resultsDir: 'test-results',
  promptsDir: 'shared/prompts',

  defaultLimit: 5,
  defaultPrompt: 'ACTIVE_PROMPT',

  cloudFunctionUrl: process.env.CLOUD_FUNCTION_URL || 'auto-detect',

  thresholds: {
    total: { target: 0.98, weight: 0.25 },
    date: { target: 0.95, weight: 0.15 },
    merchant: { target: 0.90, weight: 0.20, fuzzyThreshold: 0.8 },
    itemsCount: { target: 0.85, weight: 0.15, tolerance: 1 },
    itemPrices: { target: 0.90, weight: 0.25 },
  },

  estimatedCostPerScan: 0.01,
};
```

---

## Implementation Patterns

### Naming Conventions

| What | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `ground-truth.ts` |
| Types | PascalCase | `TestCaseFile` |
| Functions | camelCase | `computeGroundTruth()` |
| Constants | SCREAMING_SNAKE | `DEFAULT_LIMIT` |
| Test files | `*.test.ts` | `comparator.test.ts` |
| Expected JSON | `{id}.expected.json` | `jumbo-001.expected.json` |
| Result files | `{timestamp}_{prompt}.json` | `2025-01-15_103045_v2.json` |

### Console Output

```typescript
import chalk from 'chalk';

export const log = {
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  fail: (msg: string) => console.log(chalk.red('✗'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  info: (msg: string) => console.log(chalk.blue('●'), msg),
  header: (msg: string) => {
    console.log(chalk.bold(`\n${msg}`));
    console.log('━'.repeat(40));
  },
};
```

### Schema Validation

```typescript
import { z } from 'zod';

const MetadataSchema = z.object({
  testId: z.string(),
  storeType: z.enum(['supermarket', 'pharmacy', 'restaurant', 'gas_station', 'convenience', 'other']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  region: z.enum(['CL', 'CO', 'MX', 'AR']),
  source: z.string(),
  addedAt: z.string(),
});

export function validateTestCase(data: unknown): TestCaseFile {
  return TestCaseFileSchema.parse(data);
}
```

---

## Security Considerations

### Authentication

The test harness authenticates to the Cloud Function using:
- **Local development:** Firebase user token from `firebase login`
- **CI environment:** Service account credentials

```typescript
async function getAuthToken(): Promise<string> {
  // Try service account first (CI)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return getServiceAccountToken();
  }
  // Fall back to user token (local dev)
  return getUserToken();
}
```

### Data Protection

- Test images may contain sensitive receipt data
- `test-data/` should not contain production user receipts without consent
- `test-results/` is gitignored (except `.gitkeep`)

---

## npm Scripts

Add to `package.json`:

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

---

## Files Changed Summary

| Status | Files/Folders |
|--------|---------------|
| 🆕 **NEW** | `shared/prompts/*` |
| 🆕 **NEW** | `scripts/scan-test/*` |
| 🆕 **NEW** | `test-data/receipts/*` |
| 🆕 **NEW** | `test-results/.gitkeep` |
| ✏️ **MODIFIED** | `functions/src/analyzeReceipt.ts` (import prompt) |
| ✏️ **MODIFIED** | `package.json` (npm scripts) |
| ✏️ **MODIFIED** | `.gitignore` (add test-results/) |
| ✅ **UNCHANGED** | `src/*` (React app) |

---

## Developer Workflow

### Adding a New Test Case

```bash
# 1. Add image
cp ~/Downloads/receipt.jpg test-data/receipts/supermarket/jumbo-003.jpg

# 2. Generate expected.json (calls Gemini, creates file with AI results)
npm run test:scan:generate -- --image=jumbo-003.jpg

# 3. Review and correct (edit the generated file)
# - Fill metadata.storeType, metadata.difficulty
# - Add corrections for any AI mistakes

# 4. Validate
npm run test:scan:validate

# 5. Run test
npm run test:scan -- --image=jumbo-003.jpg
```

### Improving Prompts

```bash
# 1. Run tests
npm run test:scan

# 2. Analyze failures
npm run test:scan:analyze

# 3. Review analysis or use LLM (see suggested prompt in output)

# 4. Create new prompt version
# Edit: shared/prompts/v3-improved.ts

# 5. A/B test
npm run test:scan -- --compare=v2-few-shot,v3-improved

# 6. If improved, promote to production
# Edit: shared/prompts/index.ts → export PROMPT_V3 as ACTIVE_PROMPT

# 7. Deploy
firebase deploy --only functions
```

---

## Architecture Decision Records (ADRs)

### ADR-010: Shared Prompts Library

**Decision:** Extract prompts from hardcoded Cloud Function to shared library
**Context:** Need single source of truth for prompts used by production and test harness
**Date:** 2025-12-10 (Epic 8)

**Consequences:**
- ✅ Test harness tests exact production prompts
- ✅ Easy A/B testing between prompt versions
- ✅ One-line change to promote new prompt
- ✅ Full git history for prompt evolution
- ⚠️ Requires rebuild/redeploy to change active prompt

**Status:** Accepted

---

### ADR-011: Corrections-Based Ground Truth

**Decision:** Expected.json uses AI extraction + corrections, not full rewrite
**Context:** Reduce human effort in creating test cases; align with ML training schema
**Date:** 2025-12-10 (Epic 8)

**Consequences:**
- ✅ Humans only correct mistakes, not rewrite everything
- ✅ Aligns with `Correction` type from scan_model research
- ✅ Can track what AI got wrong vs right
- ✅ Supports incremental review workflow
- ⚠️ More complex merge logic than simple expected values

**Status:** Accepted

---

### ADR-012: Default Test Limit of 5

**Decision:** CLI defaults to running maximum 5 tests per invocation
**Context:** Each test costs ~$0.01 API call; prevent accidental cost spikes
**Date:** 2025-12-10 (Epic 8)

**Consequences:**
- ✅ Safe default prevents runaway costs
- ✅ Override available with `--limit=N` or `--limit=all`
- ✅ Encourages focused testing
- ⚠️ Full suite requires explicit `--limit=all`

**Status:** Accepted

---

## Future Considerations

### Short-Term (Post-MVP)

- Visual diff tool showing expected vs actual extraction
- Automated regression testing in CI pipeline
- Historical accuracy tracking over time

### Medium-Term

- Integration with correction data from production users
- Expand test set to 100+ images
- Pluggable extractor architecture (test different AI models)

### Long-Term

- Automated prompt optimization using test results
- Fine-tuning pipeline using validated test data
- Multi-region test suites (Chile, Colombia, Mexico)

---

## Conclusion

Epic 8's architecture provides a solid foundation for systematic scan accuracy improvement:

- **Measurable:** Quantified accuracy metrics per field and store type
- **Reproducible:** Same tests produce consistent results
- **Cost-Protected:** Default limits prevent API cost spikes
- **Iterative:** Clear workflow from failure analysis to prompt improvement
- **Future-Ready:** Schema aligns with ML training infrastructure

The test harness is developer tooling that enables data-driven improvement of Boletapp's core value proposition—accurate receipt scanning for Chilean expenses.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-12-10_
_For: Gabe_
