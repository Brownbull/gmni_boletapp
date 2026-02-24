# Step 02: Evidence Review — Human Validates Raw Findings

Human validates the raw evidence before classification. Most important gate — bad data produces bad neurons.

<step n="2" goal="Human validates raw findings before classification" tag="evidence-review">

  <action>Display the complete behavioral health snapshot from Step 1.</action>

  <action>For each evidence file in {{analysis_output_dir}}, present a 3-line summary:
    What the data shows | Count/magnitude | Highest-signal item</action>

  <action>Cross-reference {{prior_concerns}} from docs/00-state/01-concerns/:
    List any concern that appears confirmed or denied by the evidence.</action>

  <output>**Evidence Summary**

    **Commit Health:**
    - Fix:feat ratio: {{fix_feat_ratio}} (concern threshold: >0.9)
    - Total reverts: {{revert_count}} | Estimated wasted sessions: {{wasted_sessions}}
    - Largest blast event: {{max_blast_files}} files in one PR

    **Churn Signals:**
    {{churn_top10}}

    **Prior Concerns vs Evidence:**
    {{concern_matches}}

    ---
    **Gabe Decision Block — Evidence Quality**

    > The evidence is deterministic (grep + git log). The interpretation is judgment.
    > High fix:feat + high churn + large blast = classic instability pattern.
    > BUT: a single spike event can skew all three metrics.
    > Before classifying, flag any outlier you think distorts the picture.
    > Rule: if one month accounts for >40% of total fixes, investigate that month first.

    ---</output>

  <ask>Does this evidence look accurate?
    Flag any outliers or data quality issues.
    Which findings feel most significant?
    [Continue] or [describe outlier/issue]</ask>

  <action>Record flagged outliers -> {{flagged_outliers}}</action>
  <action>Record user-highlighted findings -> {{key_findings}}</action>

  <output>**Review Complete.**
    Key findings confirmed: {{key_findings}}
    Flagged outliers: {{flagged_outliers}}
    Proceeding to Step 3: Classify.</output>

</step>
