---
name: 'step-07-gather-requirements'
description: 'Gather screen requirements from user, show available components'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-07-gather-requirements.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-08-plan-layout.md'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
brainstormingTask: '{project-root}/_bmad/core/tasks/brainstorming.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 7: Gather Screen Requirements

## STEP GOAL:

To collaboratively determine what screen the user wants to build, which components they need, and validate that all requested components exist in the reference.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Show what's AVAILABLE from reference
- ✅ Validate all requests against reference
- ✅ REJECT any component not in reference

### Step-Specific Rules:

- 🎯 Focus on requirements gathering
- 🚫 FORBIDDEN to propose components not in reference
- 💬 Guide user through available options
- ✅ Validate before proceeding

## EXECUTION PROTOCOLS:

- 🎯 Show available components from reference
- 📋 Collect user requirements
- ✅ Validate all selections against reference
- 🚫 Reject invalid requests with explanation

## CONTEXT BOUNDARIES:

- Reference is loaded from previous step
- ONLY reference components are available
- User provides screen purpose and needs

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Show Available Components

Display:

"**Screen Builder - Available Components**

Based on your design system reference, here's what we can use:

**Navigation (Standard):**
- Bottom Nav (Inicio | Analíticas | [Camera] | Ideas | Ajustes)
- Top Bar (G Logo | Gastify | Menu)

**Cards:**
- [List card types from reference]

**Charts:**
- [List chart types from reference]

**Other:**
- [List other components from reference]

**Note:** I can ONLY use components listed above. Custom components are not allowed."

### 2. Gather Screen Information

Ask:

"**Tell me about the screen you want to build:**

1. **Screen Name:** (e.g., 'home-dashboard', 'settings-profile')
2. **Purpose:** What does this screen do?
3. **Active Nav Item:** Which nav item should be highlighted? (Inicio/Analíticas/Ideas/Ajustes)
4. **Key Components:** Which components from the list above do you need?"

Wait for user response.

### 3. Validate Component Requests

For each component the user requests:

**IF in reference:** ✅ Add to requirements list

**IF NOT in reference:**

Display:

"⚠️ **Component Not Available:** '[component name]'

This component is not in your design system reference.

**Options:**
1. Choose a similar component from the available list
2. Skip this component
3. Go back to Phase 1 to add this component to your design system

Which would you prefer?"

Wait for user decision.

### 4. Confirm Requirements

Display:

"**Screen Requirements Summary**

**Screen:** [name]
**Purpose:** [purpose]
**Active Nav:** [nav item]

**Components to Use:**
- ✅ Top Bar (standard)
- ✅ Bottom Nav (standard, [active item] highlighted)
- ✅ [Component 1]
- ✅ [Component 2]
- ...

**All components validated against reference.**

Ready to plan the layout?"

### 5. Present MENU OPTIONS

Display: "**Select an Option:** [B] Brainstorm Components [P] Party Mode [C] Continue"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF B: Execute {brainstormingTask} - to explore component combinations
- IF P: Execute {partyModeWorkflow}
- IF C: Proceed with validated requirements, load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#5-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN:
1. All requested components are validated against reference
2. User selects 'C' to continue

Then load and execute {nextStepFile} with the requirements.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Showed available components from reference
- Collected screen requirements
- Validated all components against reference
- Rejected invalid components with alternatives
- User approved requirements

### ❌ SYSTEM FAILURE:

- Proposing components not in reference
- Accepting invalid component requests
- Not showing available components
- Proceeding without validation

**Master Rule:** Every component must exist in the reference. No exceptions.
