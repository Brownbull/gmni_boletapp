# Step 04: Neurons — Write L2 Neuron Files [DOCK POINT]

Write or update one neuron file per HIGH-confidence pattern. Each neuron = documented project-specific instance.

**DOCK POINT**: Safe to stop after this step. Resume at Step 5 (Gap Mapping).

<step n="4" goal="Write L2 neuron files from confirmed findings" tag="neurons">

  <!-- NEURON FILE TEMPLATE (keep each file <=120 lines) -->
  <!--
  # L2-00X: [Pattern Name]

  ## Gabe Lens
  **Problem:** [one-line: what went wrong]
  **Analogy:** [concrete physical analogy]
  **Map:** [3-step causal chain: trigger → mechanism → outcome]
  **Constraint:** [rule that prevents recurrence]
  **Handle:** "[memorable one-line phrase]"

  ## Evidence
  ### [Project Name] Instance
  **Date range:** [start] → [end]
  **Cost signal:** [sessions / commits / lines deleted / dollars]
  **Root cause:** [one paragraph]

  **Key commits:**
  - `[hash]` — [description] ([+/- lines])

  ## Gate
  **FF-A gate:** [hook name or workflow step that blocks this]
  **FF-B gate:** [semantic detection keywords for step-01/step-02]
  **FF-C signal:** [behavioral-health-snapshot metric + threshold]

  ## Recurrence Triggers
  - [condition that predicts this pattern emerging again]
  -->

  <action>For each pattern in {{active_patterns}}:
    1. Check if docs/02-understand/02-neurons/L2-00X-*.md already exists.
    2. If yes: append new project instance section (do NOT overwrite existing evidence).
    3. If no: create new file using template above.
    4. Use planner agent for synthesis quality — evidence is complex, judgment matters.</action>

  <action>For each novel pattern in {{novel_patterns}} (no existing L2 ID):
    Assign next available ID (L2-009, L2-010, ...).
    Create neuron file as above.
    Add to docs/02-understand/01-taxonomy/02-code-patterns.md as new entry.</action>

  <action>Update docs/02-understand/02-neurons/09-baseline.json.
    For each new/updated neuron, ensure entry exists:
    {
      "id": "L2-00X",
      "name": "[pattern name]",
      "ff_a_gate": "[hook/step name or null]",
      "ff_b_keywords": ["keyword1", "keyword2"],
      "ff_c_metric": "[metric_name >= threshold or null]",
      "last_updated": "[YYYY-MM-DD]"
    }</action>

  <output>**Neuron Files Written**

    {{active_patterns | map: "- docs/02-understand/02-neurons/L2-00X-[name].md"}}
    {{novel_patterns | map: "- docs/02-understand/02-neurons/L2-00X-[name].md (NEW)"}}

    **09-baseline.json updated.**

    ---
    **DOCK POINT REACHED.**
    L2 taxonomy complete for {{target_project_path | basename}}.
    Safe to stop here. Resume at Step 5 (Gap Mapping).</output>

</step>
