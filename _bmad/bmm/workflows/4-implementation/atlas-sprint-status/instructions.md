# Atlas Sprint Status - Multi-Mode Service with Workflow Chain Visualization

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Modes: interactive (default), validate, data</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES. Do NOT mention hours, days, weeks, or timelines.</critical>

## Atlas Integration

This workflow enhances standard sprint-status with:
- **Workflow Chain Visualization**: Shows story dependencies from Atlas memory
- **Feature Completion Mapping**: Tracks feature-to-story completion
- **Risk Analysis**: Atlas-informed risk assessment based on past lessons

<workflow>

<step n="0" goal="Determine execution mode and load Atlas">
  <action>Set mode = {{mode}} if provided by caller; otherwise mode = "interactive"</action>

  <check if="{atlas_index} exists">
    <action>Load {atlas_index} to identify relevant fragments</action>
    <action>Load {atlas_knowledge}/02-features.md for feature tracking</action>
    <action>Load {atlas_knowledge}/08-workflow-chains.md for dependencies</action>
    <action>Optionally load {atlas_knowledge}/06-lessons.md for risk patterns</action>
    <action>Set {{atlas_enabled}} = true</action>
  </check>

  <check if="{atlas_index} does NOT exist">
    <action>Set {{atlas_enabled}} = false</action>
  </check>

  <check if="mode == data">
    <action>Jump to Step 20</action>
  </check>

  <check if="mode == validate">
    <action>Jump to Step 30</action>
  </check>

  <check if="mode == interactive">
    <action>Continue to Step 1</action>
  </check>
</step>

<step n="1" goal="Locate sprint status file">
  <action>Try {sprint_status_file}</action>
  <check if="file not found">
    <output>❌ sprint-status.yaml not found.
Run `/bmad:bmm:workflows:atlas-sprint-planning` or `/bmad:bmm:workflows:sprint-planning` to generate it.</output>
    <action>Exit workflow</action>
  </check>
  <action>Continue to Step 2</action>
</step>

<step n="2" goal="Read and parse sprint-status.yaml with Atlas enrichment">
  <action>Read the FULL file: {sprint_status_file}</action>
  <action>Parse fields: generated, project, project_key, tracking_system, story_location</action>
  <action>Parse development_status map. Classify keys:</action>
  - Epics: keys starting with "epic-" (and not ending with "-retrospective")
  - Retrospectives: keys ending with "-retrospective"
  - Stories: everything else (e.g., 1-2-login-form)
  <action>Map legacy statuses and count all categories</action>

  <!-- ATLAS ENRICHMENT -->
  <check if="{{atlas_enabled}} == true">
    <action>Cross-reference stories with {{atlas_features}} to calculate feature completion</action>
    <action>Cross-reference with {{atlas_chains}} to identify dependency risks</action>
    <action>Build feature completion percentage map</action>
  </check>

  <action>Detect risks including Atlas-informed patterns:</action>
  - IF any story has status "review": suggest `/bmad:bmm:workflows:atlas-code-review`
  - IF any story has status "in-progress" AND no stories have status "ready-for-dev": recommend staying focused
  - IF all epics have status "backlog": prompt `/bmad:bmm:workflows:atlas-create-story`
  - IF {{atlas_enabled}} AND past lesson indicates similar pattern failure: warn based on lesson

</step>

<step n="3" goal="Select next action recommendation with Atlas context">
  <action>Pick the next recommended workflow using priority:</action>
  <note>When selecting "first" story: sort by epic number, then story number</note>
  1. If any story status == in-progress → recommend `atlas-dev-story` for the first in-progress story
  2. Else if any story status == review → recommend `atlas-code-review` for the first review story
  3. Else if any story status == ready-for-dev → recommend `atlas-dev-story`
  4. Else if any story status == backlog → recommend `atlas-create-story`
  5. Else if any retrospective status == optional → recommend `atlas-retrospective`
  6. Else → All implementation items done; suggest `atlas-deploy-story`

  <action>Store selected recommendation as: next_story_id, next_workflow_id</action>
</step>

<step n="4" goal="Display summary with Atlas insights">
  <output>
## 📊 Sprint Status

- Project: {{project}} ({{project_key}})
- Tracking: {{tracking_system}}
- Status file: {sprint_status_file}

**Stories:** backlog {{count_backlog}}, ready-for-dev {{count_ready}}, in-progress {{count_in_progress}}, review {{count_review}}, done {{count_done}}

**Epics:** backlog {{epic_backlog}}, in-progress {{epic_in_progress}}, done {{epic_done}}

**Next Recommendation:** /bmad:bmm:workflows:{{next_workflow_id}} ({{next_story_id}})

{{#if atlas_enabled}}
🗺️ **Atlas Insights:**
- Feature Completion: {{feature_completion}}%
- Workflow Dependencies: {{dependency_warnings}}
- Historical Patterns: {{lesson_insights}}
{{/if}}

{{#if risks}}
**Risks:**
{{#each risks}}
- {{this}}
{{/each}}
{{/if}}

  </output>
</step>

<step n="5" goal="Offer actions with Atlas options">
  <ask>Pick an option:
1) Run recommended workflow now
2) Show all stories grouped by status
{{#if atlas_enabled}}
3) Show workflow chain dependencies (Atlas)
4) Show feature completion breakdown (Atlas)
{{/if}}
5) Show raw sprint-status.yaml
6) Exit
Choice:</ask>

  <check if="choice == 1">
    <output>Run `/bmad:bmm:workflows:{{next_workflow_id}}`.
If the command targets a story, set `story_key={{next_story_id}}` when prompted.</output>
  </check>

  <check if="choice == 2">
    <output>
### Stories by Status
- In Progress: {{stories_in_progress}}
- Review: {{stories_in_review}}
- Ready for Dev: {{stories_ready_for_dev}}
- Backlog: {{stories_backlog}}
- Done: {{stories_done}}
    </output>
  </check>

  <check if="choice == 3 AND {{atlas_enabled}} == true">
    <output>
### 🗺️ Workflow Chain Dependencies

{{workflow_chain_visualization}}

**Blocked Stories:** Stories waiting on dependencies
**Ready Stories:** Stories with all dependencies met
    </output>
  </check>

  <check if="choice == 4 AND {{atlas_enabled}} == true">
    <output>
### 🗺️ Feature Completion Breakdown

{{feature_completion_table}}

**Complete Features:** {{complete_feature_count}}
**In Progress Features:** {{in_progress_feature_count}}
**Not Started Features:** {{not_started_feature_count}}
    </output>
  </check>

  <check if="choice == 5">
    <action>Display the full contents of {sprint_status_file}</action>
  </check>

  <check if="choice == 6">
    <action>Exit workflow</action>
  </check>
</step>

<!-- Data mode -->
<step n="20" goal="Data mode output">
  <action>Load and parse {sprint_status_file} same as Step 2</action>
  <action>Compute recommendation same as Step 3</action>
  <template-output>next_workflow_id = {{next_workflow_id}}</template-output>
  <template-output>next_story_id = {{next_story_id}}</template-output>
  <template-output>count_backlog = {{count_backlog}}</template-output>
  <template-output>count_ready = {{count_ready}}</template-output>
  <template-output>count_in_progress = {{count_in_progress}}</template-output>
  <template-output>count_review = {{count_review}}</template-output>
  <template-output>count_done = {{count_done}}</template-output>
  <template-output>feature_completion = {{feature_completion}}</template-output>
  <action>Return to caller</action>
</step>

<!-- Validate mode -->
<step n="30" goal="Validate sprint-status file">
  <action>Check that {sprint_status_file} exists</action>
  <check if="missing">
    <template-output>is_valid = false</template-output>
    <template-output>error = "sprint-status.yaml missing"</template-output>
    <template-output>suggestion = "Run sprint-planning to create it"</template-output>
    <action>Return</action>
  </check>

  <action>Read and parse {sprint_status_file}</action>
  <action>Validate required metadata fields and all status values</action>

  <template-output>is_valid = true</template-output>
  <template-output>message = "sprint-status.yaml valid"</template-output>
</step>

</workflow>
