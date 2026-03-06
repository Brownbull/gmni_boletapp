# Step 08: Cost Tracking, E2E Analysis, and Story Completion

Cost tracking, E2E coverage check, backend analysis, commit commands, and final status update.

<!-- Workflow signals collection: compile {{workflow_signals}} from observations during steps 1-7.
     Sources: test failures (count/type/files), scope growth (files reviewed > expected),
     cost anomalies (tokens >> median), pattern violations caught by hooks.
     Format: ⚑ signal-name (for ledger compatibility). Set "none" if nothing notable.
     The human can add/edit signals during [Y/E/S] ledger confirmation. -->

<step n="7" goal="Cost tracking, E2E analysis, and story status update" tag="completion">
  <critical>This is the FINAL step. Cost tracking is NEVER skippable.</critical>

  <!-- Cost Tracking (mandatory) -->
  <action>Execute this shell command using the Bash tool NOW (do NOT skip): `workflow-cost --csv --stats --workflow "kdbp-code-review" --story "{{story_key}}"`</action>
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
      <output>**All stories in epic complete.** Run `/kdbp-epic-checkpoint {{epic_name}}` for intent alignment review.</output>
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
    {{#if has_ui_changes and ui_missing_e2e and is_critical_path}}- **Recommend:** Run E2E tests — E2E gap on critical path{{/if}}
    {{#if new_status != "done"}}- Address remaining issues, re-run `/kdbp-code-review`{{/if}}
  </output>

  <!-- DBP: [GL] Ledger Entry (gated on dbp_active)
       Ledger format must match step-09-review-checkpoint.md -->
  <check if="{{dbp_active}}">
    <action>Draft ledger entry:
      | Date | Story | PM-Ref | Behavior | Outcome | Signals |
      | {{date}} | {{story_key}} | review | {{behavior_names}} | {{#if new_status == "done"}}✓ done{{else}}~ partial{{/if}} | {{workflow_signals}} |
    </action>
    <action>Append row to behaviors/trajectory/ledger.md (auto-write, no confirmation needed)</action>
    <output>**[GL] Ledger Entry Written:**
      | {{date}} | {{story_key}} | review | {{behavior_names}} | {{outcome}} | {{signals}} |
    </output>
  </check>
</step>
