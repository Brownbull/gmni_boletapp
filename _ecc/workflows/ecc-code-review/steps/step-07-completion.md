# Step 07: Cost Tracking, E2E Analysis, and Story Completion

Cost tracking, E2E coverage check, backend analysis, commit commands, and final status update.

<step n="7" goal="Cost tracking, E2E analysis, and story status update" tag="completion">
  <critical>This is the FINAL step. Cost tracking is NEVER skippable.</critical>

  <!-- Cost Tracking (mandatory) -->
  <action>Run: `workflow-cost --csv --stats --workflow "ecc-code-review" --story "{{story_key}}"`</action>
  <action>Store FULL terminal output as {{cost_report_output}} including COST NOTICE box</action>
  <output>**Cost Tracking Complete** — {{cost_report_output}}</output>

  <!-- E2E Coverage Check -->
  <action>Check if {{files_to_review}} match UI patterns: "src/components/**/*.tsx", "src/hooks/*.ts", "src/stores/*.ts"</action>
  <action>Set {{has_ui_changes}} = true/false</action>

  <check if="{{has_ui_changes}}">
    <action>Extract data-testid values from changed .tsx files, search tests/e2e/*.spec.ts for coverage</action>
    <action>Set {{uncovered_testids}}, {{ui_missing_e2e}}</action>
    <action>Check if changes are on critical user path (auth, primary views, data import/export)</action>
    <action>Set {{is_critical_path}} = true/false | Set {{critical_path_reason}} = brief explanation</action>
  </check>

  <!-- Integration Seam Gap Check (fires regardless of has_ui_changes — backend-only pipelines need this too) -->
  <action>Grep TDD agent output for "<!-- INTEGRATION_SEAM_CHECK:" tag</action>
  <action>Set {{has_integration_gap}} = true if tag shows FAIL</action>
  <action>Set {{integration_seam_check}} = full tag value (for reporting)</action>
  <action>Check if integration gap was resolved in triage: search {{fixed_items}} and {{td_items}} for findings
    tagged "Integration Gap". If found in either list, set {{integration_gap_resolved}} = true</action>
  <check if="{{has_integration_gap}} and NOT {{integration_gap_resolved}}">
    <output>**BLOCKING: INTEGRATION GAP** — Story has untested handoffs between components. This is the #1 source of post-deploy bugs (see Epic 18 post-mortem). Create TD story for integration test coverage before marking done.</output>
    <action>Set {{new_status}} = "in-progress" (do NOT mark done)</action>
  </check>

  <!-- Backend Change Detection -->
  <action>Check if {{files_to_review}} match backend patterns (e.g., security rules, DB indexes, cloud functions)</action>
  <action>Set {{has_backend_changes}} = true/false | Set {{backend_deploy_targets}} = list of targets</action>

  <!-- Git Staging Verification (MUST CHECK #1) -->
  <critical>CODE REVIEW PATTERN #1: Untracked files WILL NOT be committed — verify before commit</critical>
  <action>Run `git status --porcelain | grep "^??"` → check for untracked new TD story files or quick-fix files</action>
  <check if="any new files show as '??' (untracked)">
    <output>**GIT STAGING WARNING** — Untracked files will NOT be in the commit: {{untracked_files}}</output>
    <action>Stage all new files: `git add {{created_files_list}}`</action>
  </check>

  <!-- Build commit file list -->
  <action>Build {{review_changed_files}}: story file, sprint-status.yaml, new TD story files, source/test files from quick fixes</action>

  <!-- P3 Usage Tracking: tag which L2 patterns were relevant in review (CX-03) -->
  <action>Append to review output a CITED tag listing any L2 patterns detected during review.
    Format: `<!-- CITED: L2-004, L2-008 -->` (or CITED: none).
    Passive tag — no extra analysis. Record what was already encountered.
    Harvestable by: `grep -r "CITED:" docs/sprint-artifacts/`</action>

  <!-- Story Status Update -->
  <check if="no CRITICAL or HIGH issues OR all fixed">
    <action>Update story Status to "done" | Set {{new_status}} = "done"</action>
  </check>
  <check if="CRITICAL or HIGH issues remain">
    <action>Update story Status to "in-progress" | Set {{new_status}} = "in-progress"</action>
  </check>
  <check if="{{sprint_status}} file exists">
    <action>Update sprint-status.yaml: {{story_key}} → {{new_status}}</action>
  </check>
  <action>Add "Senior Developer Review (ECC)" section to story: date, agents, outcome, action items count</action>

  <!-- Epic completion checkpoint suggestion -->
  <check if="{{new_status}} == 'done'">
    <action>Check sprint-status.yaml: are all stories in this epic now 'done'?</action>
    <check if="all stories in epic are done">
      <output>**All stories in epic complete.** Run `/ecc-epic-checkpoint {{epic_name}}` for intent alignment review.</output>
    </check>
  </check>

  <output>**ECC Code Review Complete!**

    Story: {{story_key}} | Status: {{new_status}} | Classification: {{classification}}
    Triage: {{fixed_count}} fixed, {{td_story_count}} TD stories | Agents: {{review_agents}}

    {{#if has_ui_changes and ui_missing_e2e}}**E2E Gap:** {{uncovered_testids}}{{#if is_critical_path}} — CRITICAL PATH{{/if}}{{/if}}
    {{#if has_backend_changes}}**Backend:** Changes to {{backend_deploy_targets}} — use `/deploy-story` to deploy.{{/if}}

    **Session Cost:** {{cost_report_output}}

    ---

    **Commit Commands:**
    ```bash
    {{#each review_changed_files}}git add {{file_path}}
    {{/each}}
    git commit -m "$(cat <<'EOF'
    Review {{story_key}}: {{overall_status}} {{overall_score}}/10{{#if td_story_count}}, create {{td_stories_list}}{{/if}}

    Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
    EOF
    )"
    ```

    **Next Steps:**
    - Run `/workflow-close` to verify tests, status files, and branch state
    {{#if new_status == "done"}}- Run `/deploy-story` to deploy{{/if}}
    {{#if has_ui_changes and ui_missing_e2e and is_critical_path}}- **BLOCKING:** E2E gap on critical path ({{critical_path_reason}}). Create TD story for E2E coverage before deploy.{{/if}}
    {{#if has_integration_gap}}- **BLOCKING:** Integration seam gap unresolved ({{integration_seam_check}}). Create TD story or add integration test.{{/if}}
    {{#if new_status != "done"}}- Address remaining issues, re-run `/ecc-code-review`{{/if}}
  </output>
</step>
