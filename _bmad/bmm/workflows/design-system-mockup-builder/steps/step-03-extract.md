---
name: 'step-03-extract'
description: 'Extract design tokens and components from the design system source'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-03-extract.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-03b-capture-baselines.md'

# Design System Files
design_system_source: '{project-root}/docs/uxui/mockups/00_components/design-system-final.html'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 3: Extract Design System

## STEP GOAL:

To parse the design system source file and extract all design tokens and components into structured data for the reference file.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Extract EXACTLY what exists - no modifications
- ✅ Variable NAMES, not values (values go in reference for context)
- ✅ Spanish labels, camera icon patterns are CRITICAL to capture

### Step-Specific Rules:

- 🎯 Focus ONLY on extraction
- 🚫 FORBIDDEN to modify or "improve" components during extraction
- 💬 Show extraction progress and results
- 📋 Capture EXACT HTML/CSS snippets for copy-paste

## EXECUTION PROTOCOLS:

- 🎯 Parse :root for design tokens
- 📦 Extract each component type with exact HTML/CSS
- 🔍 Capture canonical icon SVG paths
- 🏷️ Note all Spanish labels
- 📋 Present extraction summary for review

## CONTEXT BOUNDARIES:

- Design system source validated in previous step
- Extract EVERYTHING, filter nothing
- Preserve exact formatting for copy-paste
- No interpretation or optimization

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Extraction Start

Display: "**Beginning Design System Extraction...**"

### 2. Load Design System Source

Read entire file: `{design_system_source}`

### 3. Extract Design Tokens

Parse the `:root { }` block and extract:

**Colors:**
- Primary colors (--primary, --primary-light, --primary-dark, --primary-hover)
- Background colors (--bg-primary, --bg-secondary, --bg-tertiary)
- Text colors (--text-primary, --text-secondary, --text-tertiary)
- Border colors (--border-light, --border-medium)
- Status colors (--success, --warning, --error)

**Spacing:**
- All --space-N variables

**Typography:**
- Font families (--font-family)
- Font sizes
- Font weights

**Border Radii:**
- All --radius-* variables

**Shadows:**
- All --shadow-* variables

Display token summary to user.

### 4. Extract Navigation Components

**Bottom Navigation:**
- Exact HTML structure
- CSS for .bottom-nav, .nav-item, .scan-center, .scan-btn
- CRITICAL: Capture nav labels (Inicio, Analíticas, Ideas, Ajustes)
- CRITICAL: Capture camera icon SVG path
- CRITICAL: Note margin-top: -56px for scan-center

**Top Bar:**
- Exact HTML structure
- CSS for .top-bar, .top-bar-logo, .top-bar-title, .top-bar-menu
- G logo styling (Baloo 2 font, gradient)

Display navigation component summary.

### 5. Extract Card Components

For each card type found:
- Component name
- CSS class names
- Exact HTML structure
- Associated styles

Types to look for:
- Summary cards
- Dashboard cards
- Info cards
- Stat cards

Display card component summary.

### 6. Extract Chart Components

For each chart type:
- SVG template structure
- CSS styling
- Color usage (should use CSS variables)

Types to look for:
- Donut/pie charts
- Bar charts
- Line charts
- Progress indicators

Display chart component summary.

### 7. Extract Icon Catalog

Create canonical icon mapping:

| Function | Icon Name | SVG Path (exact) |
|----------|-----------|------------------|
| Home/Inicio | house | [full path] |
| Analytics/Analíticas | chart-line | [full path] |
| Camera (CENTER) | camera | M14.5 4h-5L7 7H4... |
| Ideas | lightbulb | [full path] |
| Settings/Ajustes | sun | [full path] |
| Menu | hamburger | [full path] |

Display icon catalog.

### 8. Extraction Summary

Display:

"**Extraction Complete**

**Tokens Extracted:**
- Colors: [count]
- Spacing: [count]
- Typography: [count]
- Radii: [count]
- Shadows: [count]

**Components Extracted:**
- Navigation: [list]
- Cards: [list]
- Charts: [list]
- Other: [list]

**Icons Catalogued:** [count]

**Critical Items Verified:**
- ✅ Spanish nav labels: Inicio, Analíticas, Ideas, Ajustes
- ✅ Camera icon for center button
- ✅ scan-center margin-top: -56px

Review the extraction above. Ready to create reference file?"

### 9. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - always respond and then end with display again of the menu options

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask} - to think of alternative extraction approaches
- IF P: Execute {partyModeWorkflow} - to get other agent perspectives
- IF C: Proceed with extraction data, then load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#9-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN C is selected will you proceed to `step-04-create-reference.md` carrying the extracted data.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All design tokens extracted with variable names
- All components captured with exact HTML/CSS
- Spanish labels verified present
- Camera icon path captured
- Extraction summary shown to user
- User approved with 'C'

### ❌ SYSTEM FAILURE:

- Modifying components during extraction
- Missing Spanish label verification
- Missing camera icon verification
- Extracting hex values instead of variable names
- Proceeding without user approval

**Master Rule:** Extract EXACTLY what exists. No modifications, no improvements, no interpretation.
