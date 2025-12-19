# Atlas Story Ready - Story Readiness with Dependency Validation

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language}</critical>
<critical>Generate all documents in {document_output_language}</critical>

## Atlas Integration

This workflow enhances standard story-ready with:
- **Dependency Validation**: Check if story dependencies are met
- **Pattern Pre-Validation**: Identify patterns needed for implementation
- **Blocking Issue Detection**: Warn about potential blockers

<workflow>

<step n="0" goal="Atlas initialization - Load dependency context">
  <action>Check if {atlas_index} exists</action>

  <check if="{atlas_index} exists">
    <action>Load {atlas_index} to identify relevant fragments</action>
    <action>Load {atlas_knowledge}/08-workflow-chains.md for dependencies</action>
    <action>Load {atlas_knowledge}/04-architecture.md for patterns (if exists)</action>
    <action>Set {{atlas_enabled}} = true</action>

    <output>**Atlas Knowledge Loaded**
      - Workflow chains: {{chain_count}} tracked
      - Architectural patterns: {{pattern_count}} available
    </output>
  </check>

  <check if="{atlas_index} does NOT exist">
    <output>Atlas not configured - proceeding with standard story-ready</output>
    <action>Set {{atlas_enabled}} = false</action>
  </check>
</step>

<step n="1" goal="Find drafted story to mark ready" tag="sprint-status">
  <action>If {{story_path}} is provided -> use it directly; extract story_key</action>

  <critical>MUST read COMPLETE {sprint_status} file</critical>
  <action>Load the FULL file: {sprint_status}</action>
  <action>Parse the development_status section completely</action>

  <action>Find ALL stories with status "drafted"</action>
  <action>Collect up to 10 drafted story keys in order</action>

  <check if="no drafted stories found">
    <output>No drafted stories found in {sprint_status}

All stories are either still in backlog or already marked ready/in-progress/done.

**Options:**
1. Run `atlas-create-story` to draft more stories
2. Run `atlas-sprint-planning` to refresh story tracking
    </output>
    <action>HALT</action>
  </check>

  <action>Display available drafted stories</action>
  <ask>Select the drafted story to mark as Ready (enter story key or number):</ask>
  <action>Resolve selected story_key from user input</action>
  <action>Find matching story file using story_key pattern</action>
</step>

<step n="2" goal="Atlas Dependency Validation" tag="atlas-validate">
  <check if="{{atlas_enabled}} == true">
    <action>Check {{atlas_chains}} for story dependencies</action>
    <action>Identify any blocking stories that are not complete</action>

    <check if="blocking dependencies found">
      <output>**Atlas Dependency Alert**

        This story has unmet dependencies:
        {{blocking_dependencies}}

        These stories should be completed first.
      </output>
      <ask>Mark ready anyway? [Y/N]</ask>
      <check if="user says N">
        <output>Story not marked ready. Complete dependencies first.</output>
        <action>HALT</action>
      </check>
    </check>

    <check if="no blocking dependencies">
      <output>**Atlas Dependency Check: PASSED**

        All dependencies met. Story is ready for development.
      </output>
    </check>
  </check>
</step>

<step n="3" goal="Atlas Pattern Pre-Validation" tag="atlas-patterns">
  <check if="{{atlas_enabled}} == true">
    <action>Identify patterns this story will need from {{atlas_architecture}}</action>

    <output>**Atlas Pattern Preview**

      **Patterns Likely Needed:**
      {{pattern_preview}}

      **Implementation Guidance Available:** Yes
    </output>
  </check>
</step>

<step n="4" goal="Mark story ready for dev">
  <action>Read the story file from resolved path</action>
  <action>Extract story_id and story_title from the file</action>
  <action>Update story file: Change Status to "ready-for-dev"</action>
  <action>Save the story file</action>
</step>

<step n="5" goal="Update sprint status to ready-for-dev" tag="sprint-status">
  <action>Load the FULL file: {sprint_status}</action>
  <action>Find development_status key matching {{story_key}}</action>
  <action>Update development_status[{{story_key}}] = "ready-for-dev"</action>
  <action>Save file, preserving ALL comments and structure</action>
</step>

<step n="6" goal="Confirm completion to user">
  <output>**Story Marked Ready for Development, {user_name}!**

Story file updated: `{{story_file}}` -> Status: ready-for-dev
Sprint status updated: drafted -> ready-for-dev
{{#if atlas_enabled}}
Atlas dependency validation: PASSED
{{/if}}

**Story Details:**
- **ID:** {{story_id}}
- **Key:** {{story_key}}
- **Title:** {{story_title}}
- **Status:** ready-for-dev

**Next Steps:**

1. **Recommended:** Run `atlas-story-context` workflow to generate implementation context
   - This creates a comprehensive context XML for the DEV agent
   - Includes relevant architecture, dependencies, and existing code

2. **Alternative:** Skip context generation and go directly to `atlas-dev-story` workflow
   - Faster, but DEV agent will have less context

**To proceed:**
- For context generation: Run `atlas-story-context` workflow
- For direct implementation: Run `atlas-dev-story` workflow
  </output>
</step>

</workflow>
