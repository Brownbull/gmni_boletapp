# Step 07: Cost Tracking + Story Completion

Cost tracking is MANDATORY and NEVER skippable. Then update sprint status and finalize.

<step n="7" goal="Cost tracking (MANDATORY) + sprint status update + completion" tag="completion">

  <!-- Cost Tracking (MANDATORY) -->
  <critical>MANDATORY STEP — You MUST execute this bash command and capture its output.
    Do NOT skip it. Do NOT proceed without running this command first.</critical>

  <action>Run cost analyzer: `workflow-cost --csv --stats --workflow "ecc-create-story" --story "{{story_key}}"`</action>
  <action>Store the FULL terminal output as {{cost_report_output}} — include the COST NOTICE box</action>
  <output>**Cost Tracking Complete** — {{cost_report_output}}</output>

  <!-- Sprint Status Update -->
  <check if="{{sprint_status}} file exists">
    <action>Add {{story_key}}: ready-for-dev to sprint-status.yaml</action>
  </check>

  <!-- Final Summary -->
  <output>**ECC Story Creation Complete!**

    **Story:** {{story_key}}
    **Status:** ready-for-dev
    **File:** {story_dir}/{{story_key}}.md
    **Classification:** {{classification}}

    **ECC Analysis:**
    - Risk Level: {{risk_level}}
    - Tasks: {{task_count}}
    - Complexity: {{complexity_estimate}}
    - Pipeline: {{pipeline_agents_summary}}

    **Session Cost:**
    {{cost_report_output}}

    ---

    **Next Steps:**
    - Run `/ecc-dev-story` to implement with ECC agents
    - Run `/ecc-e2e` after implementation for E2E test coverage</output>
</step>
