# Step 08: Story Completion

Cost tracking, E2E/Firebase analysis, final story status update, and summary.

<critical>Story completion is the FINAL step. This is NEVER skippable.</critical>

<!-- Cost Tracking (mandatory) -->
<action>Run cost analyzer: `workflow-cost --csv --stats --workflow "ecc-dev-story" --story "{{story_key}}"`</action>
<action>Store the FULL terminal output as {{cost_report_output}} — include the COST NOTICE box</action>
<output>**Cost Tracking Complete** — {{cost_report_output}}</output>

<!-- E2E Coverage Check -->
<action>Check if any files in {{progress_tracker}}.files_changed match UI component patterns:
  - "src/components/**/*.tsx" (excluding ui/ — those are shadcn primitives)
  - "src/hooks/*.ts" (hooks that drive UI behavior)
  - "src/stores/*.ts" (state that drives UI)
</action>
<action>Set {{has_ui_changes}} = true/false | Set {{changed_ui_files}} = list of matching files</action>

<check if="{{has_ui_changes}}">
  <action>For each changed .tsx component, extract data-testid attributes from source</action>
  <action>Search tests/e2e/*.spec.ts for those testids</action>
  <action>Set {{uncovered_testids}} = testids NOT found in any E2E spec</action>
  <action>Set {{ui_missing_e2e}} = true if {{uncovered_testids}} is non-empty</action>
  <action>Evaluate if UI changes are on a critical user path (auth, main canvas, toolbox, component placement, YAML import/export)</action>
  <action>Set {{is_critical_path}} = true/false | Set {{critical_path_reason}} = brief explanation</action>
</check>

<!-- Firebase Backend Check -->
<action>Check if any files in {{progress_tracker}}.files_changed match Firebase backend patterns:
  - "firestore.rules" → firestore:rules | "firestore.indexes.json" → firestore:indexes
  - "storage.rules" → storage | "functions/src/**" → functions
</action>
<action>Set {{has_firebase_backend_changes}} = true/false | Set {{firebase_deploy_targets}} = list</action>

<!-- Story Completion -->
<action>Verify ALL tasks marked [x] complete</action>
<action>Verify ALL functional acceptance criteria satisfied</action>
<action>Verify ALL architectural acceptance criteria satisfied (validated per-task in Step 4)</action>
<action>Update story Status to "review"</action>

<check if="{{sprint_status}} file exists">
  <action>Update sprint-status.yaml: {{story_key}} → review</action>
</check>

<output>**Story Implementation Complete**

  Story: {{story_key}} | Status: Ready for review | Tasks: {{task_count}} | Coverage: {{coverage_percentage}}%

  **ECC Agents Used:** Planner → TDD Guide → Build Resolver (if needed) → Code Reviewer

  **Architectural Validation:**
  - File Location ACs: {{file_location_passed}}/{{file_location_total}}
  - Pattern ACs: {{pattern_passed}}/{{pattern_total}}
  - Anti-Pattern ACs: {{antipattern_passed}}/{{antipattern_total}}

  **Session Cost:** {{cost_report_output}}

  ---

  **Next Steps:**
  - Run `/ecc-code-review` for external review
  {{#if has_ui_changes and ui_missing_e2e}}
  **E2E Gap:** {{uncovered_testids}} missing coverage
  {{#if is_critical_path}}**CRITICAL PATH** — run `/ecc-e2e` recommended.{{/if}}
  {{/if}}
  {{#if has_firebase_backend_changes}}
  - **Firebase changes** ({{firebase_deploy_targets}}) — use `/deploy-story` to deploy backend.
  {{/if}}
</output>

<check if="{{has_ui_changes}} AND {{ui_missing_e2e}} AND {{is_critical_path}}">
  <ask>E2E gap on critical path. How to proceed?
    [E] Run `/ecc-e2e` now | [S] Skip | [N] Note in Dev Notes:</ask>
  <check if="user chooses N">
    <action>Add to story Dev Notes: E2E Gap {{uncovered_testids}} deferred by user {date}, critical path: {{critical_path_reason}}</action>
  </check>
</check>
