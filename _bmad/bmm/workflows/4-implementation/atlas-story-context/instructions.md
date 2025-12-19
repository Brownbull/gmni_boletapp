# Atlas Story Context - Story Context Assembly with Pattern Guidance

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language}</critical>
<critical>Generate all documents in {document_output_language}</critical>

## Atlas Integration

This workflow enhances standard story-context with:
- **Architectural Pattern Injection**: Include relevant patterns in context
- **Testing Standards Inclusion**: Add testing patterns and requirements
- **Feature Context**: Map story to feature inventory
- **Existing Code Analysis**: Atlas-guided code exploration

<workflow>

<step n="0" goal="Atlas initialization - Load implementation context">
  <action>Check if {atlas_index} exists</action>

  <check if="{atlas_index} exists">
    <action>Load {atlas_index} to identify relevant fragments</action>
    <action>Load {atlas_knowledge}/04-architecture.md for patterns</action>
    <action>Load {atlas_knowledge}/05-testing.md for testing standards</action>
    <action>Load {atlas_knowledge}/02-features.md for feature mapping (if exists)</action>
    <action>Set {{atlas_enabled}} = true</action>

    <output>**Atlas Knowledge Loaded for Story Context**
      - Architectural patterns: {{pattern_count}} available
      - Testing standards: {{testing_standard_count}} defined
      - Feature inventory: {{feature_count}} mapped
    </output>
  </check>

  <check if="{atlas_index} does NOT exist">
    <output>Atlas not configured - proceeding with standard story-context</output>
    <action>Set {{atlas_enabled}} = false</action>
  </check>
</step>

<step n="1" goal="Find drafted story and check for existing context" tag="sprint-status">
  <check if="{{story_path}} is provided">
    <action>Use {{story_path}} directly</action>
    <action>Read COMPLETE story file and parse sections</action>
    <action>Extract story_key from filename or story metadata</action>
    <action>Verify Status is "drafted" - if not, HALT with message</action>
  </check>

  <check if="{{story_path}} is NOT provided">
    <critical>MUST read COMPLETE sprint-status.yaml file</critical>
    <action>Load the FULL file: {{output_folder}}/sprint-status.yaml</action>
    <action>Parse the development_status section completely</action>
    <action>Find FIRST story with status "drafted"</action>

    <check if="no story with status 'drafted' found">
      <output>No drafted stories found in sprint-status.yaml

**Next Steps:**
1. Run `atlas-create-story` to draft more stories
2. Run `atlas-sprint-planning` to refresh story tracking
      </output>
      <action>HALT</action>
    </check>

    <action>Use the first drafted story found</action>
    <action>Find matching story file using story_key pattern</action>
    <action>Read the COMPLETE story file</action>
  </check>

  <action>Extract {{epic_id}}, {{story_id}}, {{story_title}}, {{story_status}}</action>
  <action>Parse sections: Story, Acceptance Criteria, Tasks/Subtasks, Dev Notes</action>

  <!-- Check if context file already exists -->
  <action>Check if file exists at {default_output_file}</action>

  <check if="context file already exists">
    <output>Context file already exists: {default_output_file}

      **What would you like to do?**
      1. **Replace** - Generate new context file
      2. **Verify** - Validate existing context file
      3. **Cancel** - Exit without changes
    </output>
    <ask>Choose action (replace/verify/cancel):</ask>
  </check>

  <action>Initialize output by writing template to {default_output_file}</action>
</step>

<step n="1.5" goal="Discover and load project documents">
  <invoke-protocol name="discover_inputs" />
</step>

<step n="2" goal="Collect relevant documentation with Atlas pattern enrichment" tag="atlas-enrich">
  <action>Review loaded content for items relevant to this story's domain</action>
  <action>Extract relevant sections from all loaded documents</action>

  <!-- ATLAS PATTERN ENRICHMENT -->
  <check if="{{atlas_enabled}} == true">
    <action>Identify applicable architectural patterns from {{atlas_architecture}}</action>
    <action>Extract relevant patterns for this story's implementation</action>

    <output>**Atlas Pattern Guidance**

      **Applicable Patterns:**
      {{applicable_patterns}}

      **Implementation Guidelines:**
      {{pattern_guidelines}}

      These patterns will be included in the context file.
    </output>

    <action>Add Atlas patterns to context file artifacts section</action>
  </check>

  <template-output file="{default_output_file}">
    Add artifacts.docs entries with {path, title, section, snippet}
  </template-output>
</step>

<step n="3" goal="Analyze existing code with Atlas guidance" tag="atlas-code">
  <action>Search source tree for modules, files, and symbols matching story intent</action>

  <!-- ATLAS CODE EXPLORATION -->
  <check if="{{atlas_enabled}} == true">
    <action>Use {{atlas_architecture}} to guide code exploration</action>
    <action>Identify code patterns that align with documented standards</action>
    <action>Flag any code that deviates from patterns</action>

    <output>**Atlas Code Analysis**

      **Pattern-Compliant Code:**
      {{compliant_code}}

      **Interfaces to Reuse:**
      {{reusable_interfaces}}

      **Deviation Warnings:**
      {{deviation_warnings}}
    </output>
  </check>

  <action>Identify existing interfaces/APIs the story should reuse</action>
  <action>Extract development constraints from Dev Notes and architecture</action>

  <template-output file="{default_output_file}">
    Add artifacts.code entries with {path, kind, symbol, lines, reason}
    Populate interfaces with API/interface signatures
    Populate constraints with development rules
  </template-output>
</step>

<step n="4" goal="Gather dependencies and frameworks">
  <action>Detect dependency manifests and frameworks in the repo</action>
  <template-output file="{default_output_file}">
    Populate artifacts.dependencies with keys for detected ecosystems
  </template-output>
</step>

<step n="5" goal="Testing standards with Atlas testing context" tag="atlas-test">
  <!-- ATLAS TESTING CONTEXT -->
  <check if="{{atlas_enabled}} == true">
    <action>Load testing standards from {{atlas_testing}}</action>
    <action>Identify testing patterns applicable to this story</action>

    <output>**Atlas Testing Context**

      **Testing Standards:**
      {{testing_standards}}

      **Applicable Test Patterns:**
      {{test_patterns}}

      **Coverage Requirements:**
      {{coverage_requirements}}
    </output>

    <action>Include Atlas testing context in context file</action>
  </check>

  <action>Extract testing standards from Dev Notes, architecture, existing tests</action>

  <template-output file="{default_output_file}">
    Populate tests.standards with a concise paragraph
    Populate tests.locations with directories or glob patterns
    Populate tests.ideas with initial test ideas mapped to acceptance criteria
  </template-output>
</step>

<step n="6" goal="Validate and save">
  <invoke-task>Validate against checklist at {installed_path}/checklist.md</invoke-task>
</step>

<step n="7" goal="Update story file and mark ready for dev" tag="sprint-status">
  <action>Open {{story_path}}</action>
  <action>Update story file: Change Status to "ready-for-dev"</action>
  <action>Under 'Dev Agent Record' add context reference</action>
  <action>Save the story file</action>

  <!-- Update sprint status -->
  <action>Load the FULL file: {{output_folder}}/sprint-status.yaml</action>
  <action>Update development_status[{{story_key}}] = "ready-for-dev"</action>
  <action>Save file, preserving ALL comments and structure</action>

  <output>**Story context generated successfully, {user_name}!**

**Story Details:**
- Story: {{epic_id}}.{{story_id}} - {{story_title}}
- Story Key: {{story_key}}
- Context File: {default_output_file}
- Status: drafted -> ready-for-dev

{{#if atlas_enabled}}
**Atlas Enhancements Applied:**
- Architectural patterns included
- Testing standards referenced
- Code exploration guided by patterns
{{/if}}

**Context Includes:**
- Documentation artifacts and references
- Existing code and interfaces
- Dependencies and frameworks
- Testing standards and ideas
- Development constraints

**Next Steps:**
1. Review the context file: {default_output_file}
2. Run `atlas-dev-story` to implement the story
  </output>
</step>

</workflow>
