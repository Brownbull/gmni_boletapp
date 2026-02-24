# Test Health Interpreter

Workflow step that reads test results and translates failures into Gabe Decision Blocks.
Silent when healthy, alarms when patterns detected.

## Classification System

| Classification | Trigger | Action |
|---|---|---|
| FLAKY | Test fails then passes on retry, or listed in known-flaky.yaml | Monitor; quarantine after 3 occurrences |
| REGRESSION | Previously-passing test now fails (not in known-flaky) | Fix before completing story |
| SYSTEMIC | 3+ failures with same error or in same module | Investigate root cause first |
| COVERAGE_DROP | Coverage decreased >5% in any module | Add tests for new/modified code |

## Emergency Threshold

If >20% of the test suite fails, the interpreter HALTs and asks the user before proceeding.

## Files

| File | Purpose | Written By |
|---|---|---|
| `known-flaky.yaml` | Quarantined tests excluded from regression detection | Manual (reviewed monthly) |
| `failure-log.csv` | Append-only history of classified failures | Step 06 in all workflows |
| `latest-run.json` | Most recent test run baseline for comparison | Step 06 in all workflows |

## Workflows Using This Step

- `ecc-dev-story` — Step 06 (after consolidated validation)
- `ecc-code-review` — Step 06 (after triage and debt tracking)
- `ecc-e2e` — Step 06 (after test run and verification)

## Gabe Decision Block Output

When SYSTEMIC or COVERAGE_DROP patterns are detected, the interpreter produces a Gabe Decision Block:

```
### What's Happening
[failure summary]

### The Analogy
[physical-system analogy for the failure pattern]

### Pattern Classification
**SYSTEMIC** (or COVERAGE_DROP)

### Your Call
[specific decision options, not rubber-stamp approval]
```

Brief report (1-3 failures): one-line summary without full Decision Block.
Clean run: single line confirmation, no output noise.

## Design Principles

- **Glass cockpit**: silence when flying, alarm when falling
- **Smoke detectors for patterns**: automated classification, not human triage
- **Not a hook**: runs as workflow step because it needs test output context
- **History-aware**: compares against latest-run.json baseline
