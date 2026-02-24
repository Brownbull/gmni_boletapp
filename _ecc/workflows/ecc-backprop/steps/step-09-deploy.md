# Step 09: Deploy — Apply _template/ to Target Project(s)

Human approves deployment scope. Copy updated gates to target project(s).

<step n="9" goal="Deploy _template/ changes to target project(s)" tag="deploy">

  <action>Identify what changed in _template/ during this session:
    Run: git diff HEAD -- _template/ --stat -> {{template_changes}}</action>

  <action>List candidate projects from known project list:
    Check {backprop_root}/docs/00-state/02-context/ for known projects -> {{candidate_projects}}</action>

  <output>**Changes to deploy:**
    {{template_changes}}

    **Primary target:** {{target_project_path}}
    **Other candidates:** {{candidate_projects}}

    ---
    **Gabe Decision Block — Deploy Scope**

    > Copying hooks: low risk. Hook runs on every edit — wrong output is immediately visible.
    > Copying workflow steps: medium risk. Wrong logic = bad story generation, not a crash.
    > Copying to multiple projects at once: higher risk. One wrong assumption, many broken setups.
    > Recommendation: deploy to ONE project first. Run one full epic/story workflow session.
    > Verify gates fire correctly on real use. Then expand to other projects.

    ---</output>

  <ask>Confirm deployment scope:
    [1] Deploy to {{target_project_path}} only (recommended)
    [2] Deploy to multiple: {{candidate_projects}}
    [3] Skip — I'll apply manually</ask>

  <check if="user chose [1] or [2]">
    <action>For each selected project, copy:
      - Updated hooks:          {project}/.claude/hooks/
      - Updated workflow steps: {project}/_ecc/workflows/ (step files only — not instructions.xml or workflow.yaml unless changed)
      - Updated scripts:        {project}/scripts/ (only if scripts were modified)
      Log: "Backprop deploy {{date}}" appended to {project}/docs/03-act/01-prevention/04-action-items.md</action>

    <output>**Deployed to:**
      {{deployed_projects}}

      **Next step per project:** Run one full `/ecc-create-epics-and-stories` session
      to verify gates fire correctly on real story creation.</output>
  </check>

  <action>Update {backprop_root}/docs/execution-plan.md:
    Mark current phase as "executed".
    Set next phase to "pending".</action>

  <output>**Backprop cycle complete.**

    **Neurons created/updated:** {{active_patterns | count}}
    **Gates implemented:** {{approved_count}}
    **Projects updated:** {{deployed_projects | count}}

    **When to rerun:** after 3+ more epics ship.
    **Signal:** fix:feat ratio climbs above 0.9, OR new blast event >100 files,
    OR behavioral-health-snapshot exits with code 2 (alert).</output>

</step>
