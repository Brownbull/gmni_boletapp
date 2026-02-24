# ECC Backprop Command

Run the behavioral retrospective + forward propagation workflow.

## Usage

```
/ecc-backprop [target-project-path]
```

## What it does

Analyzes a project's git history for behavioral anti-patterns, classifies them against
the L2 taxonomy, and propagates improvements back into `_template/`.

## Phases

1. **Observe** — run analysis scripts, populate `docs/01-observe/`
2. **Classify** — match findings to L2 taxonomy (8 patterns)
3. **Propagate** — implement gates in `_template/`, deploy to target projects

## DOCK POINTS (safe session stops)

- After Step 1: raw data collected
- After Step 4: L2 neurons written
- Between Step 7 items: each gate implemented

## When to run

- After 3+ epics have shipped on a project
- When fix:feat ratio exceeds 0.9
- When `behavioral-health-snapshot.sh` exits with code 2 (alert)
- When a revert event >500 lines occurs

## Prerequisites

- `scripts/analyze-commits.sh` must exist in `{backprop_root}/scripts/`
- `scripts/build-l2-baseline.py` must exist
- `scripts/behavioral-health-snapshot.sh` must exist
- `docs/00-state/` must be initialized (concerns, context, sessions)

## Output

- `docs/01-observe/` — raw evidence
- `docs/02-understand/02-neurons/` — L2 neuron files
- `docs/03-act/01-prevention/04-action-items.md` — approved gate queue
- `_template/` — updated hooks + workflow steps

---

Runs workflow: `_ecc/workflows/ecc-backprop/`
