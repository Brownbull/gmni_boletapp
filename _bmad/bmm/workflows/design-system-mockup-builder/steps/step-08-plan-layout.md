---
name: 'step-08-plan-layout'
description: 'Plan the screen layout with component arrangement for user approval'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-08-plan-layout.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-09-assemble-screen.md'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 8: Plan Screen Layout

## STEP GOAL:

To create a visual layout plan showing how the validated components will be arranged on the screen. User MUST approve this plan before assembly begins.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Plan ONLY with validated components
- ✅ Show clear visual arrangement
- ✅ Get user buy-in before building

### Step-Specific Rules:

- 🎯 Focus on layout planning
- 🚫 FORBIDDEN to build anything in this step
- 💬 Present options if multiple layouts possible
- ✅ User must approve before proceeding

## EXECUTION PROTOCOLS:

- 🎯 Create ASCII/text layout diagram
- 📋 List exact components in each position
- ✅ Highlight any layout decisions to make
- ⏸️ HALT for user approval

## CONTEXT BOUNDARIES:

- Requirements validated from previous step
- Reference still in context
- Layout planning only - no code

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Layout Planning

Display: "**Planning Screen Layout...**"

### 2. Create Layout Diagram

Based on requirements, create a text-based layout diagram:

```
╔════════════════════════════════════════╗
║            STATUS BAR                   ║
║            (9:41)                       ║
╠════════════════════════════════════════╣
║            TOP BAR                      ║
║   [G]        Gastify           [≡]     ║
╠════════════════════════════════════════╣
║                                        ║
║         MAIN CONTENT AREA              ║
║                                        ║
║   ┌────────────────────────────┐       ║
║   │     [Component 1]          │       ║
║   └────────────────────────────┘       ║
║                                        ║
║   ┌────────────────────────────┐       ║
║   │     [Component 2]          │       ║
║   └────────────────────────────┘       ║
║                                        ║
║   [Additional components...]           ║
║                                        ║
╠════════════════════════════════════════╣
║           BOTTOM NAV                   ║
║  Inicio  Analíticas  [📷]  Ideas  Ajustes ║
║                      ^^^                ║
║              [active: ???]              ║
╚════════════════════════════════════════╝
```

### 3. Detail Component Placement

Display:

"**Component Placement Plan**

**Fixed Elements (Standard):**
- Status Bar: Time (9:41), signal, battery
- Top Bar: G logo + Gastify title + Menu button
- Bottom Nav: Standard 5 items, [active item] highlighted

**Content Area Components:**

| Position | Component | Source |
|----------|-----------|--------|
| 1 | [Component name] | reference section [X] |
| 2 | [Component name] | reference section [Y] |
| ... | ... | ... |

**Active Navigation:** [Specified nav item]

**Notes:**
- [Any layout-specific notes]
- [Spacing or alignment decisions]"

### 4. Identify Layout Options (if any)

If multiple valid arrangements exist:

Display:

"**Layout Options:**

**Option A:** [Description]
[Pros/cons]

**Option B:** [Description]
[Pros/cons]

Which option do you prefer?"

Wait for selection before proceeding.

### 5. Confirm Layout Plan

Display:

"**Layout Plan Confirmed**

**Screen:** [name]
**Structure:**
1. Status Bar (standard)
2. Top Bar (standard)
3. Content: [Component list in order]
4. Bottom Nav (standard, [active] highlighted)

**Components from Reference:**
- [Each component with reference section]

**Ready to assemble this screen?**

⚠️ Once I start assembling, I will:
- Copy exact HTML/CSS from reference
- Use only CSS variables (no hex colors)
- Apply Spanish labels
- Use camera icon for center button"

### 6. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue to Assembly"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask}
- IF P: Execute {partyModeWorkflow} - get perspectives on layout
- IF C: Proceed with approved layout, load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#6-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN:
1. Layout plan is created and shown
2. User approves with 'C'

Then load and execute {nextStepFile} with the layout plan.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Clear layout diagram created
- All components from validated requirements
- Component sources from reference identified
- User approved layout
- No building started in this step

### ❌ SYSTEM FAILURE:

- Adding components not in requirements
- Starting to build without approval
- No visual layout shown
- Proceeding without user confirmation

**Master Rule:** The user must see and approve the layout before any building starts.
