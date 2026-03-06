# Step 09: Story Completion + Cost Tracking + Behavioral Ledger

Cost tracking, E2E/backend analysis, behavioral ledger, final story status update, and summary.

<critical>Story completion is the FINAL step. This is NEVER skippable.</critical>

<!-- ADVERSARIAL REVIEW GATE — must confirm before any completion work runs (F-003) -->
<!-- Report finding: Claude skipped self-review step and proceeded directly to completion. -->
<critical>REVIEW GATE: Self-review (Step 7) is NON-OPTIONAL. Confirm it completed before proceeding.</critical>
<ask>Before marking this story done, confirm:
  [Y] Step 7 (self-review) completed — HIGH severity issues resolved, review score recorded
  [N] Step 7 not done yet — stop here, return to Step 7 now

  If [N]: load and execute step-08-review.md, then return to this step.</ask>

<!-- Cost Tracking (mandatory) -->
<action>Execute this shell command using the Bash tool NOW (do NOT skip): `workflow-cost --csv --stats --workflow "kdbp-dev-story" --story "{{story_key}}"`</action>
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

<!-- P2 ORDERING audit tag — derived from step-08 code-reviewer output -->
<action>Copy {{p2_ordering_verdict}} from Step 08 code-reviewer output.
  Append: `<!-- ORDERING: {{p2_ordering_verdict}} -->`
  Passive tag. Harvestable by: `grep -r "ORDERING:" docs/sprint-artifacts/`</action>

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
  - Run `/kdbp-code-review` for external review
  {{#if has_ui_changes and ui_missing_e2e}}
  **E2E Gap:** {{uncovered_testids}} missing coverage
  {{#if is_critical_path}}**CRITICAL PATH** — run `/kdbp-e2e` recommended.{{/if}}
  {{/if}}
  {{#if has_backend_changes}}
  - **Backend changes** ({{backend_deploy_targets}}) — use `/kdbp-deploy` to deploy backend.
  {{/if}}
</output>

<check if="{{has_ui_changes}} AND {{ui_missing_e2e}} AND {{is_critical_path}}">
  <ask>E2E gap on critical path. How to proceed?
    [E] Run `/kdbp-e2e` now | [S] Skip | [N] Note in Dev Notes:</ask>
  <check if="user chooses N">
    <action>Add to story Dev Notes: E2E Gap {{uncovered_testids}} deferred by user {date}, critical path: {{critical_path_reason}}</action>
  </check>
</check>

<!-- [GL] Generate Behavioral Ledger Entry -->
<check if="{{dbp_active}}">
  <action>Draft ledger entry:
    Date: {{date}}
    Story: {{story_key}}
    PM-Ref: (extract from story file or "none")
    Behavior: {{behavior_names}}
    Outcome: ✓ done | ~ partial | ✗ blocked (infer from story status)
    Signals: {{drift_signals_from_session}} (or "none")</action>

  <action>Append row to `behaviors/trajectory/ledger.md` (auto-write, no confirmation needed)</action>
  <action>If story tracking file exists in trajectory: update Session Log + increment sessions count</action>
  <output>**[GL] Ledger Entry Written:**
    `| {{date}} | {{story_key}} | {{pm_ref}} | {{behavior_names}} | {{outcome}} | {{signals}} |`</output>
</check>
