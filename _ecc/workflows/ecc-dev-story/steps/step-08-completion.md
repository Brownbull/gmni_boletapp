# Step 08: Story Completion + Cost Tracking

Cost tracking, E2E/backend analysis, final story status update, and summary.

<critical>Story completion is the FINAL step. This is NEVER skippable.</critical>

<!-- Cost Tracking (mandatory) -->
<action>Run cost analyzer: `workflow-cost --csv --stats --workflow "ecc-dev-story" --story "{{story_key}}"`</action>
<action>Store the FULL terminal output as {{cost_report_output}} — include the COST NOTICE box</action>
<output>**Cost Tracking Complete** — {{cost_report_output}}</output>

<!-- E2E Coverage Check -->
<action>Check if any files in {{progress_tracker}}.files_changed match UI component patterns:
  - "src/components/**/*.tsx" (excluding shared primitives)
  - "src/hooks/*.ts" (hooks that drive UI behavior)
  - "src/stores/*.ts" (state that drives UI)
</action>
<action>Set {{has_ui_changes}} = true/false | Set {{changed_ui_files}} = list of matching files</action>

<check if="{{has_ui_changes}}">
  <action>For each changed .tsx component, extract data-testid attributes from source</action>
  <action>Search tests/e2e/*.spec.ts for those testids</action>
  <action>Set {{uncovered_testids}} = testids NOT found in any E2E spec</action>
  <action>Set {{ui_missing_e2e}} = true if {{uncovered_testids}} is non-empty</action>
  <action>Evaluate if UI changes are on a critical user path (auth, primary views, data import/export)</action>
  <action>Set {{is_critical_path}} = true/false | Set {{critical_path_reason}} = brief explanation</action>
</check>

<!-- Integration Seam Gap Check (fires regardless of has_ui_changes — backend-only pipelines need this too) -->
<action>Check if any files in {{progress_tracker}}.files_changed touch a known async pipeline component (from {{pipeline_context}}):
  Cloud Functions (functions/), Firestore listeners (onSnapshot hooks), event emitters/handlers (mitt bus)</action>
<action>Set {{has_integration_gap}} = true if pipeline component changed but no integration test covers the seam</action>
<check if="{{has_integration_gap}}">
  <output>**INTEGRATION GAP:** Story touches async pipeline but no integration test covers the seam. Run `/ecc-code-review` before deploying, or create TD story for integration coverage.</output>
</check>

<!-- Backend Change Detection -->
<action>Check if any files in {{progress_tracker}}.files_changed match backend patterns
  (e.g., security rules, DB indexes, cloud functions, API routes)</action>
<action>Set {{has_backend_changes}} = true/false | Set {{backend_deploy_targets}} = list</action>

<!-- Git Staging Verification (MUST CHECK #1) -->
<critical>CODE REVIEW PATTERN #1: Untracked files WILL NOT be committed — verify before commit</critical>
<action>Run `git status --porcelain | grep "^??"` → check for untracked story/source files</action>
<check if="any NEW files from this story show as '??' (untracked)">
  <output>**GIT STAGING WARNING** — Untracked files will NOT be in the commit: {{untracked_files}}</output>
  <action>Stage all created files: `git add {{created_files_list}}`</action>
  <action>Confirm: `git status --porcelain | grep "^A "` — all story files show as staged</action>
</check>

<!-- P3 Usage Tracking: tag which L2 patterns were relevant this story (CX-03) -->
<action>Append to story completion output a CITED tag listing any L2 patterns that were
  detected, warned about, or actively guided decisions during this story.
  Format: `<!-- CITED: L2-004, L2-006 -->` (or CITED: none if no patterns applied).
  This is a passive tag — no extra analysis. Just record what was already encountered.
  Harvestable by: `grep -r "CITED:" docs/sprint-artifacts/`</action>

<!-- Intent alignment tag — only if story has ## Intent section -->
<check if="story file has ## Intent section">
  <action>Compare what was built (tasks completed, files changed, ACs satisfied) against
    the story's Intent Handle. Rate: aligned | drifted.
    If drifted, note WHY in <=10 words.
    Append: `<!-- INTENT: aligned -->` or `<!-- INTENT: drifted — [brief reason] -->`
    Passive tag. Harvestable by: `grep -r "INTENT:" docs/sprint-artifacts/`</action>
</check>

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

  **Commit Commands:**
  ```bash
  git add {{staged_files_list}}
  git commit -m "$(cat <<'EOF'
  {{story_key}}: {{one_line_summary}}

  {{what_changed_and_why}}

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

  **Next Steps:**
  - Run `/ecc-code-review` for external review
  {{#if has_ui_changes and ui_missing_e2e}}
  **E2E Gap:** {{uncovered_testids}} missing coverage
  {{#if is_critical_path}}**CRITICAL PATH** — run `/ecc-e2e` recommended.{{/if}}
  {{/if}}
  {{#if has_backend_changes}}
  - **Backend changes** ({{backend_deploy_targets}}) — use `/deploy-story` to deploy backend.
  {{/if}}
</output>

<check if="{{has_ui_changes}} AND {{ui_missing_e2e}} AND {{is_critical_path}}">
  <ask>E2E gap on critical path. How to proceed?
    [E] Run `/ecc-e2e` now | [S] Skip | [N] Note in Dev Notes:</ask>
  <check if="user chooses N">
    <action>Add to story Dev Notes: E2E Gap {{uncovered_testids}} deferred by user {date}, critical path: {{critical_path_reason}}</action>
  </check>
</check>
