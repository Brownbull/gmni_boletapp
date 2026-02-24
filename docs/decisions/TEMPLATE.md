# ADR-[NUMBER]: [Title]

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | rejected | superseded
**Deciders:** [who needs to approve]

## Context

What is the problem or situation that requires a decision?
[2-3 sentences max]

## Gabe Decision Block

### What's Changing
[One sentence: the technical change being proposed]

### The Analogy
[Physical-system analogy that captures the key trade-off. This is not decoration — it's the primary reasoning tool. If the analogy feels wrong, the architecture is wrong.]

### Constraint Box
```
IS:     [what this decision actually does]
IS NOT: [what it might look like but isn't]
RISK:   [what perturbation could break this — the failure mode]
```

## Options Considered

### Option A: [Name]
- **How:** [1-2 sentences]
- **Pro:** [key advantage]
- **Con:** [key disadvantage]
- **Analogy:** [what this option looks like in the physical-system model]

### Option B: [Name]
- **How:** [1-2 sentences]
- **Pro:** [key advantage]
- **Con:** [key disadvantage]
- **Analogy:** [what this option looks like in the physical-system model]

## Decision

**Chosen:** Option [X]
**Reasoning:** [1-2 sentences — why this trade-off is correct for now]

## Consequences

- **What changes:** [files, patterns, dependencies affected]
- **What to watch:** [signals that this decision was wrong — the "too hot" indicators]
- **Revisit when:** [condition that should trigger re-evaluation]
