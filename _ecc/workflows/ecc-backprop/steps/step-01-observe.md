# Step 01: Observe — Run Analysis Scripts [DOCK POINT]

Run the three analysis scripts. Populate docs/01-observe/. Produces raw data only — no interpretation yet.

**DOCK POINT**: Safe to stop after this step. Resume at Step 2 (Evidence Review).

<step n="1" goal="Run analysis scripts and populate docs/01-observe/" tag="observe">

  <action>Verify scripts exist:
    - {backprop_root}/scripts/analyze-commits.sh
    - {backprop_root}/scripts/build-l2-baseline.py
    - {backprop_root}/scripts/behavioral-health-snapshot.sh</action>

  <check if="any script missing">
    <output>**ERROR: Required script not found in {backprop_root}/scripts/.**
      Scripts are part of the backprop template — check _template/scripts/.</output>
    <ask>Copy scripts from _template/scripts/ first? [Y] or provide alternate path? [N + path]</ask>
  </check>

  <action>Run: bash scripts/analyze-commits.sh {{target_project_path}} {{analysis_output_dir}}
    Capture stdout -> {{commit_analysis_output}}
    Capture exit code -> {{commit_exit_code}}</action>

  <check if="{{commit_exit_code}} != 0">
    <output>**WARNING: analyze-commits.sh returned non-zero.**
      Output: {{commit_analysis_output}}
      Possible cause: no git history, insufficient commits (&lt;20), or path error.</output>
    <ask>Continue with partial data? [Y] or fix the issue first? [N]</ask>
  </check>

  <action>Run: python3 scripts/build-l2-baseline.py \
      docs/02-understand/02-neurons docs/02-understand/02-neurons/09-baseline.json
    Refreshes FF-B baseline JSON from current canonical neurons.
    Note: neurons are named 01-*.md (not L2-*.md) — script needs glob pattern fix if it fails.
    On failure: skip, baseline.json from previous run is still valid.</action>

  <action>Run: bash scripts/behavioral-health-snapshot.sh {{target_project_path}} backprop-snapshot
    Capture output -> {{health_snapshot}}
    Note: non-zero exit means health signals detected — continue, treat as data not error.</action>

  <action>Read all generated files in {{analysis_output_dir}} and summarize:
    - Churn map: top 10 files by edit frequency -> {{churn_top10}}
    - Blast radius: largest single-PR change events -> {{blast_events}}
    - Revert log: reverted commits + estimated cost -> {{reverts}}
    - Monthly velocity: commit volume + fix:feat ratio -> {{velocity}}</action>

  <output>**Observation Complete**

    **Behavioral Health Snapshot:**
    {{health_snapshot}}

    **Top Churn Files (5):**
    {{churn_top10 | first_5}}

    **Blast Events (>50 files):**
    {{blast_events}}

    **Reverts found:** {{reverts | count}}

    ---
    **DOCK POINT REACHED.**
    Raw data populated in {{analysis_output_dir}}.
    Safe to stop here. Resume at Step 2 (Evidence Review).</output>

</step>
