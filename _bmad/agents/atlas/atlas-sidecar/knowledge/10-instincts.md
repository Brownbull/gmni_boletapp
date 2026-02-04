# Learned Instincts & Patterns

> Section 10 of Atlas Memory
> Last Updated: 2026-02-02
> Sources: Continuous learning from session observations (ECC-style)

## Overview

This fragment contains patterns learned through Atlas's continuous learning system. Instincts are confidence-weighted patterns detected from tool usage observations during development sessions.

### Confidence Scale
| Range | Level | Meaning |
|-------|-------|---------|
| 0.3-0.4 | Tentative | Newly detected, needs confirmation |
| 0.5-0.6 | Moderate | Confirmed 2-3 times |
| 0.7-0.8 | Strong | Consistently observed pattern |
| 0.8-0.9 | Evolution Ready | Candidate for permanent knowledge |

---

## Active Instincts

> Instincts are stored in `learning/instincts.json` and displayed here via `/atlas-instinct-status`

| ID | Pattern | Confidence | Context | First Seen | Last Confirmed |
|----|---------|------------|---------|------------|----------------|
| (populated by continuous learning system) |

---

## Evolved Patterns

Patterns that exceeded the evolution threshold (0.8 confidence) and were promoted to permanent knowledge through the `/atlas-evolve` workflow.

### Code Review Patterns
> Patterns related to code review workflows

(No evolved patterns yet)

### Testing Patterns
> Patterns related to testing and validation

(No evolved patterns yet)

### Git & Staging Patterns
> Patterns related to git operations and file staging

(No evolved patterns yet)

### Implementation Patterns
> Patterns related to code implementation approaches

(No evolved patterns yet)

### Workflow Patterns
> Patterns related to development workflow sequences

#### PARALLEL-001: Multi-Agent Parallel Execution
- **Pattern**: To achieve true parallelism with Task tool, issue ALL Task calls in a SINGLE message/response
- **Context**: ECC workflows (code-review, dev-story) require multiple reviewers
- **Confidence**: 0.9 (documented from Claude Code docs)
- **Evidence**:
  - ❌ Sequential: `Response1(Task1)` → `Response2(Task2)` = agents run one after another
  - ✅ Parallel: `Response1(Task1 + Task2 + Task3)` = all agents run simultaneously
- **Limit**: Max 7 agents can run in parallel
- **Evolved**: 2026-02-02 (from documentation research)

---

## Rejected Patterns

Patterns that were detected but proved unreliable (confidence dropped below 0.3 minimum threshold) or were explicitly rejected during review.

| Pattern | Reason | Date Rejected |
|---------|--------|---------------|
| (none yet) |

---

## Learning Statistics

> Updated by `/atlas-sync-observations` workflow

| Metric | Value |
|--------|-------|
| Total Observations Processed | 400+ |
| Active Instincts | 30+ |
| Evolved Patterns | 1 |
| Rejected Patterns | 0 |
| Last Evaluation | 2026-02-02 |

---

## Integration Notes

### How Patterns Are Detected

1. **Repeated Workflows**: Same tool sequence (2-4 tools) appearing 3+ times
2. **Error Resolutions**: Error followed by successful fix with same tool
3. **User Corrections**: When user overrides Claude's suggestion
4. **Preference Signals**: Frequently used tools/paths/patterns

### Knowledge Evolution Path

```
Observation (JSONL)
  -> Pattern Detection (evaluate-session.js)
    -> Instinct (instincts.json, confidence 0.3-0.8)
      -> Evolved Pattern (this fragment, permanent)
        -> Core Knowledge (06-lessons.md, after human review)
```

### Privacy

- Sensitive fields (passwords, tokens, keys) are redacted before logging
- Observations are project-local and excluded from git by default
- Learning can be disabled in `learning/config.json`

---

## Sync Notes

This fragment is automatically updated by the Atlas learning system. Manual edits to the "Active Instincts" and "Learning Statistics" sections should be avoided as they will be overwritten. The "Evolved Patterns" section is managed through the `/atlas-evolve` workflow.
