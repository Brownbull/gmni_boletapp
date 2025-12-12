# UX Audit Workflow Instructions

<workflow name="ux-audit">

<critical>The workflow execution engine is governed by: {project-root}/.bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>This workflow uses PARTY MODE for multi-agent collaborative roasting</critical>
<critical>Communicate all responses in {communication_language}</critical>
<critical>Generate all documents in {document_output_language}</critical>
<critical>The goal is CRITICAL FEEDBACK leading to ACTIONABLE IMPROVEMENTS</critical>

## Workflow Overview

This workflow facilitates a "roast session" where multiple specialized agents review UX mockups or existing applications from their unique perspectives. The output is a structured audit document that identifies issues, captures stakeholder clarifications, and provides prioritized recommendations.

**Output Format:**
- Screen-by-screen audit with issues and recommendations
- New screens required (identified gaps)
- Priority matrix (P0 Critical → P3 Future)
- Key decisions documented
- Next steps for UX designer, architect, and PM

<step n="1" goal="Identify what to audit">
<action>Ask user what they want to audit</action>

<ask>Welcome to the UX Audit workflow!

This workflow brings together the full BMAD agent team to critically review your UX mockups or existing application screens.

**What would you like to audit?**

Please provide:
1. **File path(s)** to HTML mockups, screenshots, or images
2. **Flow name** (e.g., "consumer-flow", "provider-flow", "admin-panel")
3. **Brief context** about who the users are and what the app does

Example:
- `/docs/ux-mockups/consumer-flow.html` - Consumer water ordering flow for Chilean users with low tech literacy

What would you like to roast today?</ask>

<action>Store user input:
  - mockup_path: {{provided_path}}
  - flow_name: {{flow_name}}
  - context: {{user_context}}
</action>

<template-output>audit_target_identified</template-output>
</step>

<step n="2" goal="Load and review the mockups">
<action>Based on mockup_path, determine how to load:

  <check if="path ends with .html">
    <action>Use browser tool to navigate to file:// URL</action>
    <action>Capture screenshot of initial view</action>
    <action>Scroll through and capture all sections/screens</action>
    <action>Read page.md for structured content</action>
  </check>

  <check if="path is image (.png, .jpg, .gif)">
    <action>Read image file directly</action>
  </check>

  <check if="path is directory">
    <action>Glob for all mockup files in directory</action>
    <action>Process each file</action>
  </check>

</action>

<action>Document what screens/sections were found:
  - List all identified screens
  - Note navigation structure
  - Capture key UI elements
</action>

<output>I've loaded your {{flow_name}} mockups. Here's what I found:

**Screens identified:**
{{list_of_screens}}

**Navigation structure:**
{{nav_description}}

Ready to bring in the team for the roast?</output>

<template-output>mockups_loaded</template-output>
</step>

<step n="3" goal="Activate Party Mode for multi-agent roast">
<action>Load party mode configuration from: {project-root}/.bmad/core/workflows/party-mode/instructions.md</action>

<output>PARTY MODE ACTIVATED!

All agents are here for a group discussion!

**Participating agents:**
{{list_all_agents_with_emojis_and_specialties}}

**{{agent_count}} agents ready to roast your UX mockups!**

---

Let's begin the roast. Each agent will review from their unique perspective.</output>

<template-output>party_mode_activated</template-output>
</step>

<step n="4" goal="Conduct the multi-agent roast">
<critical>Each agent provides feedback from their specialty perspective</critical>
<critical>Keep feedback CONSTRUCTIVE - identify issues AND suggest solutions</critical>
<critical>Be SPECIFIC - reference exact screens, elements, flows</critical>

<action>For each major screen/section in the mockups, have agents provide feedback:

**UX Designer (Sally):** Focus on:
- Visual hierarchy and consistency
- Accessibility concerns (contrast, touch targets, ARIA)
- Information architecture
- User flow friction points
- Component patterns and design system alignment

**Product Manager (John):** Focus on:
- Value proposition clarity
- User journey completeness
- Business model alignment
- Feature prioritization questions
- Messaging and copy effectiveness

**Architect (Winston):** Focus on:
- Technical feasibility of UI patterns
- Data requirements implied by UI
- Integration points
- Performance implications
- State management complexity

**Business Analyst (Mary):** Focus on:
- Data display accuracy
- Business logic implied by UI
- Edge cases in data presentation
- Reporting/analytics needs
- Compliance requirements

**Developer (Amelia):** Focus on:
- Implementation complexity
- Component reusability
- Technical debt risks
- Animation/interaction feasibility
- Responsive considerations

**Scrum Master (Bob):** Focus on:
- Story slicing opportunities
- Acceptance criteria gaps
- Definition of done clarity
- Dependency identification
- Testability of features

**Test Architect (Murat):** Focus on:
- Missing error states
- Edge case coverage
- Testable vs untestable elements
- Accessibility testing needs
- Performance testing considerations

**Brainstormer (Carson):** Focus on:
- Missing features that would add value
- Innovation opportunities
- Future enhancement ideas
- User delight possibilities
- Competitive features to consider

**Problem Solver (Dr. Quinn):** Focus on:
- Root causes of UX issues
- Systematic problems across screens
- Conflicting patterns
- User model mismatches
- Flow logic problems

**Innovation Strategist (Victor):** Focus on:
- Competitive differentiation
- Unique value not highlighted
- Missing verification/trust signals
- Business model opportunities
- Moat-building features

**Design Thinking (Maya):** Focus on:
- User emotional journey
- Empathy gaps
- User motivation alignment
- Delight moments missing
- Friction points in journey

**Storyteller (Sophia):** Focus on:
- Narrative consistency
- Promise vs delivery alignment
- Onboarding story arc
- Messaging coherence
- User communication gaps

**Presentation Expert (Caravaggio):** Focus on:
- Visual hierarchy problems
- CTA clarity and prominence
- Information density issues
- Whitespace usage
- Visual flow and scanning patterns

</action>

<action>After each agent's feedback, PAUSE for user clarification:

<ask>**Agent {{agent_name}} raised:**
{{summary_of_key_points}}

Do you have any clarifications, context, or decisions to share about these points?

- Type your response to address the feedback
- Or type "next" to continue to the next agent
- Or type "discuss {{topic}}" to explore a specific point deeper</ask>

</action>

<action>Document all clarifications and decisions made during discussion:
  - Original issue raised
  - User clarification/context
  - Decision made (if any)
  - Impact on audit findings
</action>

<template-output>roast_feedback_collected</template-output>
</step>

<step n="5" goal="Synthesize findings into structured audit document">
<critical>Transform roast discussion into actionable audit document</critical>

<action>Create audit document using template: {template}</action>

<action>Organize findings:

**1. Executive Summary**
- What was audited
- Key strengths identified
- Critical issues count by priority
- Recommended next steps

**2. Key Clarifications from Session**
- Table of important context/decisions captured during roast
- Business model decisions
- User model clarifications
- Technical constraints confirmed

**3. Screen-by-Screen Audit**
For each screen:
- Screenshot/description
- Issues identified (with agent attribution)
- Recommendations
- Priority (P0-P3)

**4. New Screens Required**
- Screens identified as missing during roast
- Purpose and requirements for each
- Priority

**5. Priority Matrix**
| Priority | Issue | Screen | Effort |
|----------|-------|--------|--------|
| P0 (Critical) | ... | ... | ... |
| P1 (High) | ... | ... | ... |
| P2 (Medium) | ... | ... | ... |
| P3 (Future) | ... | ... | ... |

**6. Key Decisions Documented**
- Business model decisions
- Technical decisions
- UX pattern decisions
- Scope decisions

**7. Next Steps**
- For UX Designer
- For Architect
- For PM
- For Development Team

</action>

<action>Save audit document to: {audit_output_pattern}</action>

<output>UX Audit document created!

**Saved to:** {{output_path}}

**Summary:**
- {{issue_count}} issues identified
- {{critical_count}} critical (P0)
- {{high_count}} high priority (P1)
- {{new_screen_count}} new screens required
- {{decision_count}} key decisions documented

Ready for the next step?</output>

<template-output>audit_document_created</template-output>
</step>

<step n="6" goal="Offer follow-up workflows">
<ask>The UX Audit is complete!

**Your audit document:** {{output_path}}

**What would you like to do next?**

1. **Audit another flow** - Run another roast session on different mockups
2. **Create epics from audit** - Generate epics.md from the audit findings
3. **Update PRD** - Incorporate audit findings into Product Requirements
4. **Architecture review** - Have architect review for technical implications
5. **Exit** - End the workflow

What's next?</ask>

<check if="user_choice == 'audit_another'">
  <action>Loop back to Step 1</action>
</check>

<check if="user_choice == 'create_epics'">
  <output>Great choice! The audit findings can be transformed into epics.

You can:
- Run the `create-epics-and-stories` workflow
- Or manually extract from the Priority Matrix in your audit document

The audit document is structured to feed directly into epic planning.</output>
</check>

<check if="user_choice == 'update_prd'">
  <output>The audit findings should inform PRD updates.

Key sections to update:
- User flows (based on journey issues found)
- Requirements (based on missing features identified)
- Constraints (based on technical decisions made)

Run the `prd` workflow with the audit document as input.</output>
</check>

<check if="user_choice == 'architecture'">
  <output>Good call! Technical implications from the audit should be reviewed.

Run the `architecture` workflow and reference:
- Technical feasibility issues from Winston
- Data requirements from Mary
- Implementation complexity from Amelia

The audit document contains all the context needed.</output>
</check>

<template-output>workflow_complete</template-output>
</step>

</workflow>
