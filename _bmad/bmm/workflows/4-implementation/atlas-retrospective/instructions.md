# Atlas-Enhanced Retrospective - Epic Completion Review Instructions

<critical>The workflow execution engine is governed by: {project-root}/\_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/\_bmad/bmm/workflows/4-implementation/atlas-retrospective/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES - NEVER mention hours, days, weeks, months, or ANY time-based predictions. AI has fundamentally changed development speed - what once took teams weeks/months can now be done by one person in hours. DO NOT give ANY time estimates whatsoever.</critical>

<critical>🗺️ ATLAS-ENHANCED RETROSPECTIVE - Accumulate project wisdom!</critical>
<critical>This workflow extends standard retrospective with Atlas memory feeding and validation</critical>
<critical>Atlas provides: Historical lessons feeding, Process strategy updates, Pattern validation, Push alerts</critical>

<critical>
  DOCUMENT OUTPUT: Retrospective analysis. Concise insights, lessons learned, action items. User skill level ({user_skill_level}) affects conversation style ONLY, not retrospective content.

FACILITATION NOTES:

- Scrum Master facilitates this retrospective
- Psychological safety is paramount - NO BLAME
- Focus on systems, processes, and learning
- Everyone contributes with specific examples preferred
- Action items must be achievable with clear ownership
- Two-part format: (1) Epic Review + (2) Next Epic Preparation
- **ATLAS INTEGRATION**: Feed learnings back to Atlas memory for future reference

PARTY MODE PROTOCOL:

- ALL agent dialogue MUST use format: "Name (Role): dialogue"
- Example: Bob (Scrum Master): "Let's begin..."
- Example: {user_name} (Project Lead): [User responds]
- Create natural back-and-forth with user actively participating
- Show disagreements, diverse perspectives, authentic team dynamics
  </critical>

<workflow>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STEP 0: Atlas Initialization                                            -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<step n="0" goal="Initialize Atlas Integration">
<action>Check if Atlas agent is installed at {atlas_memory}</action>

<check if="Atlas memory file exists">
  <action>Load Atlas memory: {atlas_memory}</action>
  <action>Set {{atlas_enabled}} = true</action>
  <action>Load key sections for retrospective:
    - Section 6: Historical Lessons (to compare and extend)
    - Section 7: Process & Strategy (to update if process changes)
    - Section 4: Architectural Decisions (to validate against)
    - Section 5: Testing Patterns (to capture new patterns)
  </action>
  <output>🗺️ **Atlas Integration Active**

    Atlas will:
    - Compare lessons with existing Section 6 historical knowledge
    - Capture new process improvements in Section 7
    - Validate discoveries against documented architecture
    - Feed retrospective insights back to memory

    This retrospective's learnings will become part of the project's accumulated wisdom.
  </output>
</check>

<check if="Atlas memory file does NOT exist">
  <action>Set {{atlas_enabled}} = false</action>
  <output>ℹ️ Atlas not installed - running standard retrospective workflow.

    To enable Atlas integration and accumulate project wisdom, install Atlas agent at:
    `_bmad/agents/atlas/`
  </output>
</check>
</step>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STEPS 1-10: Standard Retrospective Flow (inherited)                     -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<note>
Steps 1-10 follow the standard retrospective workflow from:
{project-root}/_bmad/bmm/workflows/4-implementation/retrospective/instructions.md

The key steps are:
1. Epic Discovery - Find Completed Epic with Priority Logic
2. Deep Story Analysis - Extract Lessons from Implementation
3. Load and Integrate Previous Epic Retrospective
4. Preview Next Epic with Change Detection
5. Initialize Retrospective with Rich Context
6. Epic Review Discussion - What Went Well, What Didn't
7. Next Epic Preparation Discussion - Interactive and Collaborative
8. Synthesize Action Items with Significant Change Detection
9. Critical Readiness Exploration - Interactive Deep Dive
10. Retrospective Closure with Celebration and Commitment

IMPORTANT: Execute all standard retrospective steps, then proceed to Atlas-specific steps below.
</note>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STEP 11: Atlas Memory Feeding - Lessons Learned                         -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<step n="11" goal="Feed Atlas Memory with Retrospective Insights">
<critical>🗺️ ATLAS MEMORY FEEDING - Capture lessons for future teams!</critical>

<check if="{{atlas_enabled}} == true">
  <output>
    **🗺️ Atlas Memory Integration**

    Bob (Scrum Master): "Before we fully close, let's capture what we learned for future reference."

    Bob (Scrum Master): "{user_name}, Atlas can preserve the insights from this retrospective so future development cycles benefit from what we learned."
  </output>

  <!-- Generate Section 6: Historical Lessons Nugget -->
  <action>Generate Historical Lessons nugget from retrospective insights:</action>

  <output>
    **Nugget to add to Section 6 (Historical Lessons):**
    ```
    ### Retrospective - Epic {{epic_number}}: {{epic_title}} - {date}

    **Summary:** {{retrospective_summary}}

    **What Worked Well:**
    {{#each successes}}
    - {{success_item}}
    {{/each}}

    **What to Avoid:**
    {{#each challenges}}
    - {{challenge_item}}: {{lesson_learned}}
    {{/each}}

    **Key Insights:**
    {{#each key_insights}}
    - {{insight}}
    {{/each}}

    **Process Changes Adopted:**
    {{#each process_changes}}
    - {{change_description}}
    {{/each}}

    **Workflow Implications:**
    - Testing patterns: {{testing_lessons}}
    - Development patterns: {{dev_lessons}}
    - Collaboration patterns: {{collab_lessons}}

    **Source:** {{retrospective_file}}
    ```
  </output>

  <!-- Check for process/strategy changes -->
  <check if="significant process changes identified in retrospective">
    <output>
      **Nugget to add to Section 7 (Process & Strategy):**
      ```
      ### Process Update - Epic {{epic_number}} Retrospective - {date}

      **Summary:** {{process_change_summary}}

      **Previous Approach:** {{previous_approach}}

      **New Approach:** {{new_approach}}

      **Rationale:** {{rationale_for_change}}

      **Workflow Implications:**
      - Development: {{dev_workflow_impact}}
      - Testing: {{test_workflow_impact}}
      - Review: {{review_workflow_impact}}

      **Source:** Epic {{epic_number}} Retrospective
      ```
    </output>
  </check>

  <!-- Check for architectural learnings -->
  <check if="architectural discoveries or validations made">
    <output>
      **Nugget to add to Section 4 (Architectural Decisions):**
      ```
      ### Architecture Insight - Epic {{epic_number}} - {date}

      **Discovery:** {{architectural_discovery}}

      **Impact on Architecture:**
      {{architectural_impact}}

      **Recommendations:**
      {{architectural_recommendations}}

      **Source:** Epic {{epic_number}} Retrospective
      ```
    </output>
  </check>

  <!-- Check for testing pattern learnings -->
  <check if="testing patterns discovered or validated">
    <output>
      **Nugget to add to Section 5 (Testing Patterns):**
      ```
      ### Testing Pattern - Epic {{epic_number}} - {date}

      **Pattern:** {{testing_pattern_name}}

      **Description:** {{testing_pattern_description}}

      **When to Apply:** {{when_to_apply}}

      **Evidence from Epic:** {{evidence}}

      **Source:** Epic {{epic_number}} Retrospective
      ```
    </output>
  </check>

  <!-- User approval for Atlas updates -->
  <ask>
    Bob (Scrum Master): "{user_name}, shall I update Atlas memory with these insights?"

    1. **Update all sections** - Add all nuggets to Atlas memory
    2. **Review individually** - Let me approve each nugget separately
    3. **Skip Atlas update** - Don't feed insights to Atlas

    Choose [1], [2], or [3]:
  </ask>

  <check if="user chooses 1">
    <action>Append Historical Lessons nugget to Atlas memory Section 6</action>
    <check if="process changes exist">
      <action>Append Process Update nugget to Atlas memory Section 7</action>
    </check>
    <check if="architectural insights exist">
      <action>Append Architecture Insight nugget to Atlas memory Section 4</action>
    </check>
    <check if="testing patterns exist">
      <action>Append Testing Pattern nugget to Atlas memory Section 5</action>
    </check>
    <action>Update Atlas Sync History table with retrospective sync</action>
    <output>✅ Atlas memory updated with Epic {{epic_number}} retrospective insights

      Sections updated:
      - Section 6: Historical Lessons ✅
      {{#if process_changes}}- Section 7: Process & Strategy ✅{{/if}}
      {{#if architectural_insights}}- Section 4: Architectural Decisions ✅{{/if}}
      {{#if testing_patterns}}- Section 5: Testing Patterns ✅{{/if}}

      These insights will inform future development cycles.
    </output>
  </check>

  <check if="user chooses 2">
    <action>Present each nugget individually for approval</action>
    <action>For each approved nugget, append to appropriate Atlas section</action>
    <action>Update Atlas Sync History table</action>
    <output>✅ Atlas memory selectively updated with approved insights</output>
  </check>

  <check if="user chooses 3">
    <output>ℹ️ Atlas memory update skipped. Insights preserved in retrospective document only.</output>
  </check>
</check>

<check if="{{atlas_enabled}} == false">
  <note>Atlas not enabled - skip memory feeding</note>
</check>
</step>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STEP 12: Atlas Continuity Check                                          -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<step n="12" goal="Atlas Continuity and Pattern Validation">
<check if="{{atlas_enabled}} == true">
  <output>
    **🗺️ Atlas Pattern Validation**

    Bob (Scrum Master): "One more thing - let me check if this epic's learnings align with or contradict our documented patterns."
  </output>

  <action>Compare retrospective insights against Atlas memory:
    1. Check Section 6: Do new lessons contradict previous lessons?
    2. Check Section 4: Do discoveries align with architectural decisions?
    3. Check Section 5: Do testing patterns match documented standards?
  </action>

  <check if="contradictions found">
    <output>
      ⚠️ **ATLAS PUSH ALERT: Pattern Contradiction Detected**

      Bob (Scrum Master): "Interesting - I found some contradictions between what we learned this epic and what's documented in Atlas."

      **Contradictions:**
      {{#each contradictions}}
      - **{{area}}**: Previous lesson said "{{previous_lesson}}", but Epic {{epic_number}} found "{{new_finding}}"
      {{/each}}

      Bob (Scrum Master): "{user_name}, this could mean our documented patterns are outdated, or this was an edge case. How should we handle it?"

      **Options:**
      1. **Update Atlas** - The new finding supersedes the old pattern
      2. **Add nuance** - Both are valid in different contexts
      3. **Keep old** - This was an edge case, don't update pattern
    </output>

    <ask>How should we handle these contradictions? [1], [2], or [3]:</ask>

    <check if="user chooses 1">
      <action>Update Atlas memory with new pattern, noting it supersedes previous</action>
      <output>✅ Atlas patterns updated with new learnings</output>
    </check>

    <check if="user chooses 2">
      <action>Add nuanced context to existing Atlas entries</action>
      <output>✅ Atlas patterns enriched with contextual nuance</output>
    </check>

    <check if="user chooses 3">
      <output>ℹ️ Atlas patterns unchanged - Epic {{epic_number}} noted as edge case</output>
    </check>
  </check>

  <check if="no contradictions">
    <output>
      ✅ **Atlas Validation Passed**

      Bob (Scrum Master): "Good news - Epic {{epic_number}}'s learnings align well with our documented patterns. No contradictions found."

      Charlie (Senior Dev): "That's reassuring - our project knowledge is consistent."
    </output>
  </check>
</check>
</step>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STEP 13: Save Retrospective and Update Sprint Status                    -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<step n="13" goal="Save Retrospective and Update Sprint Status">

<action>Ensure retrospectives folder exists: {retrospectives_folder}</action>
<action>Create folder if it doesn't exist</action>

<action>Generate comprehensive retrospective summary document including:</action>

- Epic summary and metrics
- Team participants
- Successes and strengths identified
- Challenges and growth areas
- Key insights and learnings
- Previous retro follow-through analysis (if applicable)
- Next epic preview and dependencies
- Action items with owners and timelines
- Preparation tasks for next epic
- Critical path items
- Significant discoveries and epic update recommendations (if any)
- Readiness assessment
- Commitments and next steps
- **Atlas Integration Summary** (if enabled)

<action>Format retrospective document as readable markdown with clear sections</action>
<action>Set filename: {retrospectives_folder}/epic-{{epic_number}}-retro-{date}.md</action>
<action>Save retrospective document</action>

<output>
✅ Retrospective document saved: {retrospectives_folder}/epic-{{epic_number}}-retro-{date}.md
</output>

<action>Update {sprint_status_file} to mark retrospective as completed</action>

<action>Load the FULL file: {sprint_status_file}</action>
<action>Find development_status key "epic-{{epic_number}}-retrospective"</action>
<action>Verify current status (typically "optional" or "pending")</action>
<action>Update development_status["epic-{{epic_number}}-retrospective"] = "done"</action>
<action>Save file, preserving ALL comments and structure including STATUS DEFINITIONS</action>

<check if="update successful">
  <output>
✅ Retrospective marked as completed in {sprint_status_file}

Retrospective key: epic-{{epic_number}}-retrospective
Status: {{previous_status}} → done
</output>
</check>

<check if="retrospective key not found">
  <output>
⚠️ Could not update retrospective status: epic-{{epic_number}}-retrospective not found in {sprint_status_file}

Retrospective document was saved successfully, but {sprint_status_file} may need manual update.
</output>
</check>

</step>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- STEP 14: Final Summary with Atlas Integration                           -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<step n="14" goal="Final Summary and Handoff">

<output>
**✅ Atlas-Enhanced Retrospective Complete, {user_name}!**

**Epic Review:**

- Epic {{epic_number}}: {{epic_title}} reviewed
- Retrospective Status: completed
- Retrospective saved: {retrospectives_folder}/epic-{{epic_number}}-retro-{date}.md

{{#if atlas_enabled}}
**🗺️ Atlas Integration:**

- Historical Lessons: {{section_6_status}}
- Process Updates: {{section_7_status}}
- Architecture Insights: {{section_4_status}}
- Testing Patterns: {{section_5_status}}
- Pattern Validation: {{validation_status}}

The insights from this retrospective are now part of the project's accumulated wisdom and will inform future development cycles.
{{/if}}

**Commitments Made:**

- Action Items: {{action_count}}
- Preparation Tasks: {{prep_task_count}}
- Critical Path Items: {{critical_count}}

**Next Steps:**

1. **Review retrospective summary**: {retrospectives_folder}/epic-{{epic_number}}-retro-{date}.md

2. **Execute preparation sprint** (Est: {{prep_days}} days)
   - Complete {{critical_count}} critical path items
   - Execute {{prep_task_count}} preparation tasks
   - Verify all action items are in progress

3. **Review action items in next standup**
   - Ensure ownership is clear
   - Track progress on commitments
   - Adjust timelines if needed

{{#if epic_update_needed}} 4. **IMPORTANT: Schedule Epic {{next_epic_num}} planning review session**

- Significant discoveries from Epic {{epic_number}} require epic updates
- Review and update affected stories
- Align team on revised approach
- Do NOT start Epic {{next_epic_num}} until review is complete
  {{else}}

4. **Begin Epic {{next_epic_num}} when ready**
   - Start creating stories with `atlas-create-story` (Atlas-enhanced)
   - Epic will be marked as `in-progress` automatically when first story is created
   - Ensure all critical path items are done first
     {{/if}}

{{#if atlas_enabled}}
5. **Future retrospectives will benefit from:**
   - The lessons captured from Epic {{epic_number}}
   - Updated process patterns
   - Validated architectural decisions
   - Enhanced testing patterns
{{/if}}

**Team Performance:**
Epic {{epic_number}} delivered {{completed_stories}} stories with {{velocity_summary}}. The retrospective surfaced {{insight_count}} key insights and {{significant_discovery_count}} significant discoveries. {{#if atlas_enabled}}Atlas memory was enriched with project wisdom that will guide future development.{{/if}}

{{#if significant_discovery_count > 0}}
⚠️ **REMINDER**: Epic update required before starting Epic {{next_epic_num}}
{{/if}}

---

Bob (Scrum Master): "Great session today, {user_name}. The team did excellent work."

{{#if atlas_enabled}}
Bob (Scrum Master): "And Atlas now has a richer understanding of our project - those lessons won't be lost."
{{/if}}

Alice (Product Owner): "See you at epic planning!"

Charlie (Senior Dev): "Time to knock out that prep work."

</output>

</step>

</workflow>

<facilitation-guidelines>
<guideline>PARTY MODE REQUIRED: All agent dialogue uses "Name (Role): dialogue" format</guideline>
<guideline>Scrum Master maintains psychological safety throughout - no blame or judgment</guideline>
<guideline>Focus on systems and processes, not individual performance</guideline>
<guideline>Create authentic team dynamics: disagreements, diverse perspectives, emotions</guideline>
<guideline>User ({user_name}) is active participant, not passive observer</guideline>
<guideline>Encourage specific examples over general statements</guideline>
<guideline>Balance celebration of wins with honest assessment of challenges</guideline>
<guideline>Ensure every voice is heard - all agents contribute</guideline>
<guideline>Action items must be specific, achievable, and owned</guideline>
<guideline>Forward-looking mindset - how do we improve for next epic?</guideline>
<guideline>Intent-based facilitation, not scripted phrases</guideline>
<guideline>Deep story analysis provides rich material for discussion</guideline>
<guideline>Previous retro integration creates accountability and continuity</guideline>
<guideline>Significant change detection prevents epic misalignment</guideline>
<guideline>Critical verification prevents starting next epic prematurely</guideline>
<guideline>Document everything - retrospective insights are valuable for future reference</guideline>
<guideline>Two-part structure ensures both reflection AND preparation</guideline>
<guideline>ATLAS INTEGRATION: Capture and feed learnings to Atlas memory for accumulated wisdom</guideline>
<guideline>Validate new learnings against existing patterns - highlight contradictions</guideline>
<guideline>Make knowledge accumulation a visible, valuable part of the retrospective</guideline>
</facilitation-guidelines>
