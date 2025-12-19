# Atlas Epic Tech Context - Technical Specification with Architectural Alignment

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language}</critical>
<critical>Generate all documents in {document_output_language}</critical>

## Atlas Integration

This workflow enhances standard epic-tech-context with:
- **Architectural Pattern Validation**: Ensure tech spec aligns with documented ADRs
- **Feature Traceability**: Map tech spec to feature inventory
- **Historical Lesson Consultation**: Learn from past tech spec issues
- **Memory Feeding**: Capture tech spec decisions for future reference

<workflow>

<step n="0" goal="Atlas initialization - Load architectural context">
  <action>Check if {atlas_index} exists</action>

  <check if="{atlas_index} exists">
    <action>Load {atlas_index} to identify relevant fragments</action>
    <action>Load {atlas_knowledge}/04-architecture.md for patterns</action>
    <action>Load {atlas_knowledge}/02-features.md for feature mapping</action>
    <action>Load {atlas_knowledge}/06-lessons.md for past issues (if exists)</action>
    <action>Set {{atlas_enabled}} = true</action>

    <output>**Atlas Knowledge Loaded for Tech Spec**
      - Architectural patterns: {{pattern_count}} ADRs tracked
      - Feature inventory: {{feature_count}} features mapped
      - Historical lessons: {{lesson_count}} available
    </output>
  </check>

  <check if="{atlas_index} does NOT exist">
    <output>Atlas not configured - proceeding with standard epic-tech-context</output>
    <action>Set {{atlas_enabled}} = false</action>
  </check>
</step>

<step n="1" goal="Collect inputs and discover next epic" tag="sprint-status">
  <action>Identify PRD and Architecture documents from recommended_inputs. Attempt to auto-discover at default paths.</action>
  <ask if="inputs are missing">ask the user for file paths. HALT and wait for docs to proceed</ask>

  <!-- Intelligent Epic Discovery -->
  <critical>MUST read COMPLETE {sprint-status} file to discover next epic</critical>
  <action>Read ALL development_status entries</action>
  <action>Find all epics with status "backlog" (not yet contexted)</action>
  <action>Identify the FIRST backlog epic as the suggested default</action>

  <check if="backlog epics found">
    <output>**Next Epic Suggested:** Epic {{suggested_epic_id}}: {{suggested_epic_title}}</output>
    <ask>Use this epic?
- [y] Yes, use {{suggested_epic_id}}
- [n] No, let me specify a different epic_id
    </ask>

    <check if="user selects 'n'">
      <ask>Enter the epic_id you want to context</ask>
      <action>Store user-provided epic_id as {{epic_id}}</action>
    </check>

    <check if="user selects 'y'">
      <action>Use {{suggested_epic_id}} as {{epic_id}}</action>
    </check>
  </check>

  <check if="no backlog epics found">
    <output>All epics are already contexted!

No epics with status "backlog" found in sprint-status.yaml.
    </output>
    <ask>Do you want to re-context an existing epic? Enter epic_id or [q] to quit:</ask>

    <check if="user enters epic_id">
      <action>Store as {{epic_id}}</action>
    </check>

    <check if="user enters 'q'">
      <action>HALT - No work needed</action>
    </check>
  </check>

  <action>Resolve output file path using workflow variables and initialize by writing the template.</action>
</step>

<step n="1.5" goal="Discover and load project documents">
  <invoke-protocol name="discover_inputs" />
  <note>After discovery: {prd_content}, {gdd_content}, {architecture_content}, {ux_design_content}, {epics_content} available</note>
  <action>Extract {{epic_title}} from {prd_content} or {epics_content} based on {{epic_id}}.</action>
</step>

<step n="2" goal="Validate epic exists in sprint status" tag="sprint-status">
  <action>Look for epic key "epic-{{epic_id}}" in development_status</action>
  <action>Get current status value if epic exists</action>

  <check if="epic not found">
    <output>Epic {{epic_id}} not found in sprint-status.yaml

This epic hasn't been registered in the sprint plan yet.
Run sprint-planning workflow to initialize epic tracking.
    </output>
    <action>HALT</action>
  </check>

  <check if="epic status == 'contexted'">
    <output>Epic {{epic_id}} already marked as contexted

Continuing to regenerate tech spec...
    </output>
  </check>
</step>

<step n="3" goal="Overview and scope with Atlas architectural alignment" tag="atlas-validate">
  <action>Read COMPLETE found {recommended_inputs}.</action>

  <!-- ATLAS ARCHITECTURAL ALIGNMENT -->
  <check if="{{atlas_enabled}} == true">
    <action>Cross-reference epic requirements with {{atlas_architecture}}</action>
    <action>Identify relevant ADRs for this epic</action>
    <action>Check for architectural constraint conflicts</action>

    <output>**Atlas Architectural Context**

      **Relevant ADRs:**
      {{relevant_adrs}}

      **Architectural Constraints:**
      {{constraints_for_epic}}

      **Feature Mapping:**
      {{features_in_epic}}
    </output>

    <check if="architectural conflicts detected">
      <output>**Atlas Architectural Alert**

        Potential conflicts with documented patterns:
        {{conflict_details}}

        Review and address in tech spec.
      </output>
    </check>
  </check>

  <template-output file="{default_output_file}">
    Replace {{overview}} with a concise 1-2 paragraph summary referencing PRD context and goals
    Replace {{objectives_scope}} with explicit in-scope and out-of-scope bullets
    Replace {{system_arch_alignment}} with a short alignment summary to the architecture
  </template-output>
</step>

<step n="4" goal="Detailed design with pattern validation">
  <action>Derive concrete implementation specifics from all {recommended_inputs}</action>

  <!-- ATLAS PATTERN VALIDATION -->
  <check if="{{atlas_enabled}} == true">
    <action>For each proposed design element, validate against {{atlas_architecture}}</action>
    <action>Ensure consistency with documented patterns</action>
  </check>

  <template-output file="{default_output_file}">
    Replace {{services_modules}} with a table or bullets listing services/modules
    Replace {{data_models}} with normalized data model definitions
    Replace {{apis_interfaces}} with API endpoint specs or interface signatures
    Replace {{workflows_sequencing}} with sequence notes or diagrams-as-text
  </template-output>
</step>

<step n="5" goal="Non-functional requirements">
  <template-output file="{default_output_file}">
    Replace {{nfr_performance}} with measurable targets
    Replace {{nfr_security}} with authn/z requirements, data handling
    Replace {{nfr_reliability}} with availability, recovery, and degradation behavior
    Replace {{nfr_observability}} with logging, metrics, tracing requirements
  </template-output>
</step>

<step n="6" goal="Dependencies and integrations">
  <action>Scan repository for dependency manifests</action>
  <template-output file="{default_output_file}">
    Replace {{dependencies_integrations}} with a structured list of dependencies
  </template-output>
</step>

<step n="7" goal="Acceptance criteria and traceability with Atlas feature mapping" tag="atlas-trace">
  <action>Extract acceptance criteria from PRD; normalize into atomic, testable statements</action>

  <!-- ATLAS FEATURE TRACEABILITY -->
  <check if="{{atlas_enabled}} == true">
    <action>Map acceptance criteria to {{atlas_features}}</action>
    <action>Identify feature coverage gaps</action>

    <output>**Atlas Feature Traceability**

      **Features Covered:**
      {{features_covered}}

      **Coverage Gaps:**
      {{coverage_gaps}}

      **Dependencies:**
      {{feature_dependencies}}
    </output>
  </check>

  <template-output file="{default_output_file}">
    Replace {{acceptance_criteria}} with a numbered list of testable acceptance criteria
    Replace {{traceability_mapping}} with a table mapping: AC -> Spec Section(s) -> Component(s)
  </template-output>
</step>

<step n="8" goal="Risks and test strategy">
  <template-output file="{default_output_file}">
    Replace {{risks_assumptions_questions}} with explicit list with mitigation
    Replace {{test_strategy}} with a brief plan
  </template-output>
</step>

<step n="9" goal="Atlas Memory Feeding - Capture Tech Spec Decisions" tag="atlas-feed">
  <check if="{{atlas_enabled}} == true">
    <action>Prepare tech spec knowledge nugget for Atlas memory</action>

    <output>**Atlas Memory Update**

      Preparing to feed tech spec decisions to Atlas:

      **Epic:** {{epic_id}} - {{epic_title}}
      **Architectural Decisions:**
      {{tech_spec_decisions}}
      **Pattern Applications:**
      {{patterns_applied}}
      **Feature Coverage:**
      {{feature_coverage_summary}}

      Would you like to capture these decisions in Atlas memory?
    </output>

    <ask>Update Atlas memory? [Y/N]</ask>

    <check if="user confirms">
      <action>Update {atlas_knowledge}/04-architecture.md with new decisions if applicable</action>
      <action>Update {atlas_knowledge}/09-sync-history.md with sync entry</action>
      <output>Atlas memory updated with tech spec decisions</output>
    </check>
  </check>
</step>

<step n="10" goal="Validate and mark epic contexted" tag="sprint-status">
  <invoke-task>Validate against checklist at {installed_path}/checklist.md</invoke-task>

  <!-- Mark epic as contexted -->
  <action>Load the FULL file: {sprint_status}</action>
  <action>Find development_status key "epic-{{epic_id}}"</action>
  <action>Update development_status["epic-{{epic_id}}"] = "contexted"</action>
  <action>Save file, preserving ALL comments and structure</action>

  <output>**Tech Spec Generated Successfully, {user_name}!**

**Epic Details:**
- Epic ID: {{epic_id}}
- Epic Title: {{epic_title}}
- Tech Spec File: {{default_output_file}}
- Epic Status: contexted (was backlog)
{{#if atlas_enabled}}
**Atlas Insights Applied:**
- Architectural patterns validated
- Feature traceability mapped
- Decisions captured in memory
{{/if}}

**Next Steps:**
1. Run `atlas-create-story` to begin implementing the first story under this epic.
  </output>
</step>

</workflow>
