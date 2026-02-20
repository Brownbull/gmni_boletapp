# Step 07: Cost Tracking, E2E Analysis, and Story Completion

Cost tracking, E2E coverage check, Firebase analysis, commit commands, and final status update.

<step n="7" goal="Cost tracking, E2E analysis, and story status update" tag="completion">
  <critical>This is the FINAL step. Cost tracking is NEVER skippable.</critical>

  <!-- Cost Tracking (mandatory) -->
  <action>Run: `workflow-cost --csv --stats --workflow "ecc-code-review" --story "{{story_key}}"`</action>
  <action>Store FULL terminal output as {{cost_report_output}} including COST NOTICE box</action>
  <output>💰 **Cost Tracking Complete** — {{cost_report_output}}</output>

  <!-- E2E Coverage Check -->
  <action>Check if {{files_to_review}} match UI patterns: "src/components/**/*.tsx" (excluding ui/), "src/hooks/*.ts", "src/stores/*.ts"</action>
  <action>Set {{has_ui_changes}} = true/false</action>

  <check if="{{has_ui_changes}}">
    <action>Extract data-testid values from changed .tsx files, search tests/e2e/*.spec.ts for coverage</action>
    <action>Set {{uncovered_testids}}, {{ui_missing_e2e}}</action>
    <action>Check if changes are on critical user path (auth, canvas, toolbox, inspector, YAML import/export)</action>
    <action>Set {{is_critical_path}} = true/false | Set {{critical_path_reason}} = brief explanation</action>
  </check>

  <!-- Firebase Backend Check -->
  <action>Check if {{files_to_review}} match: "firestore.rules", "firestore.indexes.json", "storage.rules", "functions/src/**"</action>
  <action>Set {{has_firebase_backend_changes}} = true/false | Set {{firebase_deploy_targets}} = list of targets</action>

  <!-- Build commit file list -->
  <action>Build {{review_changed_files}}: story file, sprint-status.yaml, new TD story files, source/test files from quick fixes</action>

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

  <output>**ECC Code Review Complete!**

    Story: {{story_key}} | Status: {{new_status}} | Classification: {{classification}}
    Triage: {{fixed_count}} fixed, {{td_story_count}} TD stories | Agents: {{review_agents}}

    {{#if has_ui_changes and ui_missing_e2e}}**E2E Gap:** {{uncovered_testids}}{{#if is_critical_path}} — CRITICAL PATH{{/if}}{{/if}}
    {{#if has_firebase_backend_changes}}**Firebase:** Changes to {{firebase_deploy_targets}} — use `/deploy-story` Step 5 to deploy.{{/if}}

    **Session Cost:** {{cost_report_output}}

    ---

    **Commit Commands:**
    ```bash
    {{#each review_changed_files}}git add {{file_path}}
    {{/each}}
    git commit -m "$(cat &lt;&lt;'EOF'
    Review {{story_key}}: {{overall_status}} {{overall_score}}/10{{#if td_story_count}}, create {{td_stories_list}}{{/if}}

    Co-Authored-By: Claude Opus 4.6 &lt;noreply@anthropic.com&gt;
    EOF
    )"
    ```

    **Next Steps:**
    - Run `/workflow-close` to verify tests, status files, and branch state
    {{#if new_status == "done"}}- Run `/deploy-story` to deploy{{/if}}
    {{#if has_ui_changes and ui_missing_e2e and is_critical_path}}- **Recommend:** Run `/ecc-e2e` — E2E gap on critical path{{/if}}
    {{#if new_status != "done"}}- Address remaining issues, re-run `/ecc-code-review`{{/if}}
  </output>
</step>
