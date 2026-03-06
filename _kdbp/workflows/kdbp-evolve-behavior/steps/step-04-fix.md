# Step 04: Apply Fix

Causation Analysis Step 5 — Apply fix per classification.

---

## Single Loop (Type A or C)

<check if="{{loop_type}} == SINGLE">

### Type A — Fix the workflow step

<action>
  1. Read the failing workflow step file
  2. Identify the specific instruction or logic that diverged from the skill reason
  3. Propose the minimal edit to align step with reason
  4. Update DEPENDENCY-MAP.md if linkage changed
</action>

### Type C — Fix linkage map entry

<action>
  1. Identify the incorrect mapping in DEPENDENCY-MAP.md
  2. Trace the correct skill reason for this step
  3. Update the linkage entry
  4. Check if the step's implementation matches the corrected reason
</action>

</check>

## Double Loop (Type B, D, or E)

<check if="{{loop_type}} == DOUBLE">

### Type B — Fix the skill reason

<action>
  1. Read the skill file containing the outdated/incorrect reason
  2. Identify what is wrong with the current reasoning
  3. Write the corrected skill content (Gabe Block if complex, prose if simple)
  4. CASCADE: find all workflow steps linked to this skill reason in DEPENDENCY-MAP.md
  5. For each linked step: verify it still aligns with the updated reason
  6. Fix any steps that no longer align
</action>

### Type D — Fill the knowledge gap

<action>
  1. Research the missing knowledge domain
  2. Create new skill file or add reason to existing skill file
  3. Add workflow step(s) that operationalize the new knowledge
  4. Update DEPENDENCY-MAP.md with new linkage entries
  5. Run orphan analysis — verify no new Type 2 orphans
</action>

### Type E — Update for world change

<action>
  1. Document what changed in the external world (law, API, tool)
  2. Update the skill reason to reflect current reality
  3. CASCADE: update all linked workflow steps
  4. Add a drift signal entry to ledger.md under ## Unresolved Drift Signals
     if the change may affect other behaviors
</action>

</check>

## Triple Loop (Type F)

<check if="{{loop_type}} == TRIPLE">

<output>**TRIPLE LOOP — Redirecting to Alignment Check**
Type F requires the full Alignment Check Protocol before any fix is proposed.
Redirecting to `kdbp-alignment-check` workflow.</output>

<action>Execute kdbp-alignment-check workflow with:
  - {{behavior}} as target
  - {{symptom}} as trigger context
  Present results to human before continuing.</action>

</check>

<output>**Fix Proposed**
  Type: {{type}} | Loop: {{loop_type}}
  Files modified: {{modified_files_list}}
  Cascade scope: {{cascade_count}} linked steps checked
</output>
