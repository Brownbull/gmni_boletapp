# Step 03: Classify Root Cause

Causation Analysis Steps 3-4 — Trace to skill, classify A through F.

<critical>Before classifying: is there any chance this is Type F? If the output was
correct and still something felt wrong, STOP and load cold tier (full Value Blocks +
PROJECT.md Intent Block) before classifying. Type F is the most expensive miss.</critical>

---

## Type F pre-screen

<action>Ask: "Was the output technically correct?"
  If YES → "Did it serve the person's actual need?"
  If UNCERTAIN → flag as potential Type F, load cold tier before proceeding.</action>

## Classification

<action>Using the failure chain from Step 02, classify:

| Type | Test | Match? |
|------|------|--------|
| **A) Doing** | Step wrong, reason is right | The skill reason is correct but the step didn't follow it |
| **B) Knowing** | Reason wrong or outdated | The skill reason itself is incorrect or stale |
| **C) Linking** | Wrong mapping | The linkage map connects the wrong skill to the step |
| **D) Gap** | Missing knowledge | No skill reason exists for this domain |
| **E) Drift** | World changed | The skill was correct when written but reality changed |
| **F) Alignment** | Output correct, purpose missed | All steps passed, all reasons held, wrong problem solved |

Select the FIRST type that matches (A is cheapest, F is most expensive).
</action>

## Determine loop type

<action>Map classification to loop:
  - A or C → **SINGLE LOOP** (fix step or linkage only)
  - B, D, or E → **DOUBLE LOOP** (fix skill → cascade to workflow steps)
  - F → **TRIPLE LOOP** (load cold tier → full alignment check → human judgment required)
</action>

<output>**Root Cause Classification**
  Type: {{type}} — {{type_name}}
  Loop: {{loop_type}}
  Fix target: {{fix_target}}
</output>

<check if="Type F classified">
  <output>**TRIPLE LOOP — Human Authority Required**
  Type F detected. Before proposing any fix:
  1. Load full Value Blocks + PROJECT.md Intent Block
  2. Run `kdbp-alignment-check` workflow
  3. Present findings to human — no autonomous fix allowed
  </output>
</check>
