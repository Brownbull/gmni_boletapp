# Atlas Correct Course - Sprint Change Management with Impact Analysis

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

## Atlas Integration

This workflow enhances correct-course with:
- **Workflow Chain Impact Analysis**: Visualize downstream effects of changes
- **Architectural Constraint Validation**: Check changes against documented patterns
- **Historical Lesson Consultation**: Learn from past course corrections
- **Memory Feeding**: Capture lessons from this correction for future reference

<workflow>

<step n="0" goal="Atlas initialization - Load impact analysis context">
<action>Check if {atlas_index} exists</action>

<check if="{atlas_index} exists">
  <action>Load {atlas_index} to identify relevant fragments</action>
  <action>Load {atlas_knowledge}/04-architecture.md for architectural constraints</action>
  <action>Load {atlas_knowledge}/08-workflow-chains.md for impact dependencies</action>
  <action>Load {atlas_knowledge}/06-lessons.md for past correction outcomes</action>
  <action>Set {{atlas_enabled}} = true</action>

  <output>🗺️ **Atlas Knowledge Loaded for Impact Analysis**
    - Architectural constraints: {{constraint_count}} patterns tracked
    - Workflow chains: {{chain_count}} dependencies mapped
    - Historical corrections: {{lesson_count}} past lessons available
  </output>
</check>

<check if="{atlas_index} does NOT exist">
  <output>ℹ️ Atlas not configured - proceeding with standard correct-course</output>
  <action>Set {{atlas_enabled}} = false</action>
</check>
</step>

<step n="1" goal="Initialize Change Navigation with Atlas Context">
  <action>Confirm change trigger and gather user description of the issue</action>
  <action>Ask: "What specific issue or change has been identified that requires navigation?"</action>

  <!-- ATLAS HISTORICAL CHECK -->
  <check if="{{atlas_enabled}} == true">
    <action>Search {{atlas_lessons}} for similar past corrections</action>
    <check if="similar correction found">
      <output>🗺️ **Atlas Historical Context**

        A similar correction was made previously:
        - **When:** {{past_correction_date}}
        - **Issue:** {{past_correction_issue}}
        - **Outcome:** {{past_correction_outcome}}
        - **Lessons Learned:** {{past_correction_lessons}}

        This context may help guide the current correction.
      </output>
    </check>
  </check>

  <action>Verify access to required project documents</action>
  <action>Ask user for mode preference: Incremental (recommended) or Batch</action>
  <action>Store mode selection for use throughout workflow</action>
</step>

<step n="0.5" goal="Discover and load project documents">
  <invoke-protocol name="discover_inputs" />
  <note>After discovery: {prd_content}, {epics_content}, {architecture_content}, {ux_design_content}, {tech_spec_content} available</note>
</step>

<step n="2" goal="Execute Change Analysis with Atlas Validation">
  <action>Load and execute the systematic analysis from: {checklist}</action>

  <!-- ATLAS ARCHITECTURAL VALIDATION -->
  <check if="{{atlas_enabled}} == true">
    <action>For each proposed change, validate against {{atlas_architecture}}</action>
    <action>Identify any architectural constraint violations</action>

    <check if="constraint violations detected">
      <output>🗺️ **Atlas Architectural Alert**

        The proposed change may violate documented patterns:
        {{constraint_violations}}

        **Recommendations:**
        {{atlas_recommendations}}
      </output>
      <ask>Proceed with awareness [P], Adjust approach [A], or Consult architecture [C]?</ask>
    </check>
  </check>

  <action>Work through each checklist section interactively with the user</action>
  <action>Record status for each checklist item</action>
</step>

<step n="3" goal="Workflow Chain Impact Analysis" tag="atlas-impact">
  <!-- ATLAS WORKFLOW CHAIN ANALYSIS -->
  <check if="{{atlas_enabled}} == true">
    <action>Map proposed changes to {{atlas_chains}}</action>
    <action>Identify all upstream and downstream dependencies</action>
    <action>Calculate ripple effect scope</action>

    <output>🗺️ **Atlas Workflow Chain Impact**

      **Directly Affected:**
      {{direct_impacts}}

      **Downstream Ripple Effects:**
      {{downstream_impacts}}

      **Upstream Dependencies:**
      {{upstream_dependencies}}

      **Impact Scope:** {{impact_scope}} (Minor/Moderate/Major)
    </output>
  </check>

  <action>Based on analysis, create explicit edit proposals for each identified artifact</action>
  <action>For Story, PRD, Architecture, and UI/UX changes, show old → new format</action>

  <check if="mode is Incremental">
    <action>Present each edit proposal individually</action>
    <ask>Review and refine this change? Options: Approve [a], Edit [e], Skip [s]</ask>
  </check>
</step>

<step n="4" goal="Generate Sprint Change Proposal with Atlas Annotations">
  <action>Compile comprehensive Sprint Change Proposal with all sections</action>

  <check if="{{atlas_enabled}} == true">
    <action>Include Atlas Impact Analysis section in proposal</action>
    <action>Include architectural constraint validation results</action>
    <action>Include historical lesson references</action>
  </check>

  <action>Present complete Sprint Change Proposal to user</action>
  <action>Write Sprint Change Proposal document to {default_output_file}</action>
  <ask>Review complete proposal. Continue [c] or Edit [e]?</ask>
</step>

<step n="5" goal="Finalize and Route for Implementation">
  <action>Get explicit user approval for complete proposal</action>
  <ask>Do you approve this Sprint Change Proposal for implementation? (yes/no/revise)</ask>

  <check if="yes the proposal is approved by the user">
    <action>Finalize Sprint Change Proposal document</action>
    <action>Determine change scope classification: Minor, Moderate, or Major</action>
    <action>Provide appropriate handoff based on scope</action>
  </check>
</step>

<step n="6" goal="Atlas Memory Feeding - Capture Correction Lessons" tag="atlas-feed">
  <check if="{{atlas_enabled}} == true">
    <action>Prepare knowledge nugget for Atlas memory</action>

    <output>🗺️ **Atlas Memory Update**

      Preparing to feed correction lessons to Atlas:

      **Correction Type:** {{correction_type}}
      **Root Cause:** {{root_cause}}
      **Resolution Approach:** {{resolution_approach}}
      **Impact Scope:** {{impact_scope}}
      **Key Lessons:**
      {{lesson_points}}

      Would you like to capture these lessons in Atlas memory?
    </output>

    <ask>Update Atlas memory? [Y/N]</ask>

    <check if="user confirms">
      <action>Update {atlas_knowledge}/06-lessons.md with correction lessons</action>
      <action>Update {atlas_knowledge}/09-sync-history.md with sync entry</action>
      <output>✅ Atlas memory updated with correction lessons</output>
    </check>
  </check>

  <action>Summarize workflow execution</action>
  <action>Report workflow completion to user</action>
</step>

</workflow>
