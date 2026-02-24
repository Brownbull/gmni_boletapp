# Step 01: Story Discovery

Find next story from epics, pre-load codebase context for agents.

<step n="1" goal="Identify next story and pre-load codebase context" tag="story-discovery">

  <action>Search {epics_dir} for epic files</action>
  <action>Check {sprint_status} for stories already created</action>
  <action>Find next uncreated story from epic requirements</action>

  <check if="no epics found">
    <output>No epic files found in {epics_dir}

      **Options:**
      1. Create epics first with `/create-epics-and-stories`
      2. Provide story requirements manually</output>
    <ask>Choose [1] or [2], or describe the story you want to create:</ask>
  </check>

  <check if="next story identified">
    <action>Extract {{story_requirements}} from epic</action>
    <action>Extract {{acceptance_criteria}} from epic</action>
    <action>Set {{story_key}} from epic naming convention</action>

    <!-- PRE-LOAD CODEBASE CONTEXT: Read relevant files ONCE for agents -->
    <critical>Read relevant source files NOW — agents MUST NOT read files themselves</critical>
    <action>Identify source directories affected by story requirements</action>
    <action>Read epic file in full</action>
    <action>Read relevant src/ files (feature directories, existing components/services touched by story)</action>
    <action>Run `dust src/features/ -d 2` for context budgeting</action>
    <action>Store all pre-loaded content as {{codebase_context}} for agent prompts</action>

    <output>**Next Story Identified**

      Story: {{story_key}}
      Epic: {{epic_name}}
      Requirements: {{story_requirements_summary}}
      Codebase context pre-loaded for agents.</output>
  </check>
</step>
