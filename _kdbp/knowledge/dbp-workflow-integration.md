# DBP Workflow Integration — Static Core + Dynamic Injection

How the Deep Behavior Protocol integrates with KDBP development workflows.

---

## Architecture: "The bones don't change. The nervous system adapts."

**Static core (ECC-based):** Dev, review, deploy, create-story workflows are structurally
identical across all projects. They don't need behavioral bookends.

**Dynamic injection (KDBP):** Project-specific knowledge and values modify behavior at
designated injection points. Not every project uses every injection — they activate based
on what's registered in `behaviors/`.

**On-demand introspection:** Human calls `/khujta-dbp EA` (alignment check) or
`/khujta-dbp SC` (story checkpoint) when they feel drift. Not automated.

---

## What's Automatic (Cheap, Every Workflow)

1. **Step 00 — Behavior Check:** Sets `{{dbp_active}}` flag (~0 tokens overhead).
   If no behaviors registered, all downstream DBP checks become no-ops.

2. **Ledger Recording [GL]:** In completion steps, gated on `{{dbp_active}}`.
   Auto-writes a one-line ledger entry (no confirmation needed). ~500 tokens.

3. **Cost Tracking:** Mandatory `workflow-cost` call at completion. Automatic.

---

## What's On-Demand (Expensive, Human-Triggered)

These are called via `/khujta-dbp` agent when the human decides:

| Protocol | Command | Cold-Tier Load | When to Use |
|----------|---------|----------------|-------------|
| **Alignment Check** | `/khujta-dbp EA` | Full Value Blocks | "Something feels off" |
| **Story Checkpoint** | `/khujta-dbp SC` | Full Values + story file | "Story done, evaluate" |
| **Epic Checkpoint** | `/khujta-dbp EC` | Full Values + epic + PROJECT.md | "Epic done, evaluate" |
| **Evolve Behavior** | `/khujta-dbp EB` | Warm (quick-ref) + targeted | "Something needs to change" |
| **Root Cause** | `/khujta-dbp RC` | Warm (quick-ref) | "Classify what went wrong" |

---

## Dynamic Injection Points

Workflows expose specific points where project-specific values/knowledge CAN activate.
The injection only fires if the project has relevant values/knowledge registered.

```
Static workflow step → Check: any active values/knowledge apply here?
  → NO: proceed (zero overhead)
  → YES: load relevant knowledge, evaluate, inject action
```

Examples of injection-ready steps (already in workflows):
- **dev-story step-04 (planning):** P4 self-inconsistency gate activates if framework knowledge exists
- **code-review step-03 (parallel-spawn):** Adversarial pattern IDs injected if patterns registered
- **create-epics step-03 (epic-design):** P5 growth bounds activate if growth knowledge exists
- **create-story step-05 (architect):** Design Quality Gate activates if design values exist

---

## Ledger Entry Format

```
| Date | Story | PM-Ref | Behavior | Outcome | Signals |
```

- **Outcome:** `✓ done` | `~ partial` | `✗ blocked`
- **Signals:** `⚑ drift-signal-name` (one per line) or `none`
- Auto-written to ledger (no confirmation needed)
- Recording only — no alignment evaluation happens at this point

---

## Values: Evaluated on Demand, Not During Workflow

Values are consulted at **human-triggered reflection points** (`/khujta-dbp EA`, SC, EC),
not during workflow execution. Workflows enforce *how we work*. Values guide *what we're
working toward* — but only when the human asks.

The Evolution Engine (triple loop) runs at reflection points:
- **Single loop:** Fix the workflow step
- **Double loop:** Fix the reasoning or skill
- **Triple loop:** Fix the value or direction

**Handle:** "Record everything, evaluate when it matters."
