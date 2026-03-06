# KDBP Framework — How It Works

KDBP = Khujta Deep Behavior Protocol. An alternative development suite to `_ecc/`
that wraps the same dev workflows with behavioral tracking at the boundaries.

**The one-line analogy:** _A factory floor with the same machines (ECC),
but now there's a shift log at the door — sign in with your values,
sign out with what happened, and the floor manager only interrupts
if something drifts._

**Critical points details:** See [CRITICAL-POINTS.md](CRITICAL-POINTS.md)

---

## Architecture Diagram

```
                     ┌─────────────────────────────────────┐
                     │           USER (Gabe)                │
                     │  runs: /kdbp-dev-story               │
                     └──────────────┬──────────────────────┘
                                    │
                     ┌──────────────▼──────────────────────┐
                     │         COMMAND (.md)                │
                     │  loads workflow.xml engine            │
                     │  passes workflow.yaml as config       │
                     └──────────────┬──────────────────────┘
                                    │
              ┌─────────────────────▼────────────────────────┐
              │              workflow.xml (BMAD engine)       │
              │  reads workflow.yaml → loads instructions.xml │
              │  routes to step files in sequence             │
              └─────────────────────┬────────────────────────┘
                                    │
       ┌────────────────────────────▼────────────────────────────┐
       │                   instructions.xml                       │
       │  XML router: step list + critical rules + progress       │
       └────┬───────────┬───────────┬──────────┬─────────┬───────┘
            │           │           │          │         │
     ┌──────▼──┐ ┌──────▼──┐ ┌─────▼───┐ ┌───▼────┐ ┌──▼──────┐
     │ step-00 │ │ step-01 │ │step-02..│ │step-N-1│ │ step-N  │
     │ [LB]    │ │ (core)  │ │ (core)  │ │ (core) │ │[GL][SC] │
     │ BEHAVIOR│ │ dev     │ │ dev     │ │ dev    │ │ LEDGER  │
     │ LOAD    │ │ logic   │ │ logic   │ │ logic  │ │ CHECK   │
     └─────────┘ └─────────┘ └─────────┘ └────────┘ └─────────┘
         ▲                                               │
         │           HOOKS fire on EVERY tool call       │
         │  ┌──────────────────────────────────────┐     │
         │  │  PreToolUse:Edit  → pre-edit-guard   │     │
         │  │  PreToolUse:Write → pre-write-guard  │     │
         │  │  PostToolUse:Edit → post-edit-warn   │     │
         │  │  PostToolUse:Edit → post-edit-type   │     │
         │  │  PostToolUse:Read → post-read-tracker│     │
         │  │  PostToolUse:Bash → bash-script-guard│     │
         │  │  PostToolUse:W|E  → memory-notify    │     │
         │  │  SessionStart     → session-start    │     │
         │  │  PreCompact       → session-budget   │     │
         │  │  Stop             → session-stop     │     │
         │  └──────────────────────────────────────┘     │
         │                                               │
         ▼                                               ▼
    ┌──────────────────────────────────────────────────────────┐
    │                    behaviors/                             │
    │  REGISTRY.md → {name}/BEHAVIOR.md → Value Manifest       │
    │  trajectory/ledger.md → session-by-session log           │
    │  trajectory/stories/active/ → stories being tracked      │
    │  trajectory/epics/active/   → epics being tracked        │
    └──────────────────────────────────────────────────────────┘
```

**Read the diagram:** A command starts the engine. The engine routes through steps.
Step 0 opens the shift log (behaviors). Steps 1–N-1 are the actual work (unchanged
from ECC). The final step closes the shift log (ledger). Hooks fire on every tool
call regardless — they're the floor sensors, not part of the workflow.

---

## The Bookend Pattern (core innovation)

The only thing KDBP adds to ECC workflows is **boundary behavior**:

```
  ┌─ [LB] ──────────── WORKFLOW BODY ──────────── [GL] ─┐
  │  Load         unchanged ECC logic:             Ledger │
  │  Behavior     TDD, review, validation,         Entry  │
  │  Values       planning, design...              Draft  │
  │               (no DBP inside)                         │
  │                                           [SC] or [EC]│
  └───────────────────────────────────────────────────────┘

  [LB] = Load Behavior    — Step 00 (all 8 workflows)
  [GL] = Session Ledger    — final step (all 8 workflows)
  [SC] = Story Checkpoint  — only when story completes (dev-story)
  [EC] = Epic Checkpoint   — only when epic completes (create-epics)
  [WI] = Intent Block      — when creating stories/epics (create-story, create-epics)
```

**Analogy:** The shift log at the factory door. Workers don't think about it
while operating the machines. They check in, do their work, check out.
The floor manager only reviews the log if something looks off.

---

## Command Table

Each command loads the workflow.xml engine and passes its workflow.yaml config.

| # | Command | Steps | DBP Protocols | Feed-Forward | Cost | Key Output |
|---|---------|-------|---------------|--------------|------|------------|
| 1 | `/kdbp-dev-story` | 12 | [LB] [GL] [SC] | FF-B (step-02) | Yes | Story implementation (TDD) |
| 2 | `/kdbp-code-review` | 10 | [LB] [GL] | — | Yes | Review findings + triage |
| 3 | `/kdbp-create-story` | 10 | [LB] [WI] [GL] | FF-B (step-03) | Yes | Story file + Intent Block |
| 4 | `/kdbp-create-epics` | 13 | [LB] [WI] [GL] [EC] | FF-B (02), FF-C (08) | — | Epics + stories + Intent Blocks |
| 5 | `/kdbp-brainstorm` | 6 | [LB] [GL] | — | — | 100-idea target, organized themes |
| 6 | `/kdbp-architect` | 8 | [LB] [GL] | — | — | Architecture + decision templates |
| 7 | `/kdbp-ux-design` | 7 | [LB] [GL] | — | — | UX spec + design system |
| 8 | `/kdbp-prd` | 10 | [LB] [GL] | — | — | PRD + capability contract (FRs) |
| 9 | `/kdbp-init` | 9 | — | — | — | One-time onboarding: discover, propose, challenge values |
| 10 | `/khujta-dbp` | — | All 20 | — | — | Behavior management agent |
| 10a | `/khujta-dbp reflect` | — | EA SC EC EB RC | — | — | Focused reflection menu (5 items) |

**Cost column:** Workflows marked "Yes" run `workflow-cost --csv --stats` at completion
and present the full cost report (token usage, estimated cost) in the final output.
See [CRITICAL-POINTS.md](CRITICAL-POINTS.md) section 7 for details.

### DBP Protocol Legend

| Protocol | Name | When It Fires |
|----------|------|---------------|
| [LB] | Load Behavior | Step 00 — cache value handles in hot tier |
| [GL] | Session Ledger | Final step — draft ledger row → human confirms → write |
| [SC] | Story Checkpoint | Only when story status = done (cold tier eval) |
| [EC] | Epic Checkpoint | Only when epic completes (cold tier eval) |
| [WI] | Intent Block | Story/epic creation — what person receives + analogy + done-when |

---

## ECC vs. KDBP — When to Use Which

| Dimension | `_ecc/` | `_kdbp/` |
|-----------|---------|----------|
| Behavioral tracking | None | Full (bookend pattern) |
| Hooks | Same 11 | Same 11 |
| Dev workflows | 4 | 4 (same core + DBP bookends) |
| Planning workflows | 0 | 4 (brainstorm, architect, ux-design, prd) |
| Agent | None | khujta-dbp (20 protocols) |
| Context overhead | Zero | <1,500 tokens (hot tier only) |
| Setup required | None | `behaviors/REGISTRY.md` + at least 1 BEHAVIOR.md |
| Graceful without setup | N/A | Yes — warns and continues |

**Reflection philosophy:** Values are the compass, not guardrails. Workflows enforce
how we work. At reflection points ([SC], [EC], `/khujta-dbp reflect`), we compare what
happened to our values and adapt values, skills, or workflows. We never enforce values
during workflow execution.

**Choose `_ecc/`** when: No behavioral tracking needed, or project too small.
**Choose `_kdbp/`** when: You want values, ledger, intent blocks, reflection checkpoints.

**Credit:** Advanced elicitation methods adapted from the
[BMAD Framework](https://github.com/bmadcode/BMAD-METHOD).
