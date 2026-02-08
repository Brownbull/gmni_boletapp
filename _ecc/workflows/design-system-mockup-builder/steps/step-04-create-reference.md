---
name: 'step-04-create-reference'
description: 'Create the design-system-reference.md file from extracted data'

# Path Definitions
workflow_path: '{project-root}/_ecc/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-04-create-reference.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-05-validate-reference.md'
referenceTemplate: '{workflow_path}/templates/design-system-reference.template.md'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 4: Create Reference File

## STEP GOAL:

To create the design-system-reference.md file from the extracted tokens and components, ensuring it stays under 4000 tokens for AI context efficiency.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 Show draft before saving

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Create COMPACT but COMPLETE reference
- ✅ Prioritize copy-paste ready snippets
- ✅ Include all prescriptive rules

### Step-Specific Rules:

- 🎯 Focus on creating the reference file
- 🚫 FORBIDDEN to add components not in extraction
- 💬 Use <details> tags for large snippets
- 📏 Target under 4000 tokens

## EXECUTION PROTOCOLS:

- 🎯 Structure reference for maximum utility
- 📏 Use collapsible sections for code snippets
- ✅ Include validation rules section
- 💾 Save to {design_system_reference}

## CONTEXT BOUNDARIES:

- Extraction data from previous step
- Template structure for guidance
- No new extraction - use what was gathered
- Focus on organization and format

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Reference Creation

Display: "**Creating Design System Reference...**"

### 2. Load Template (Optional Reference)

If exists, read: `{referenceTemplate}`

Use as structural guide, fill with extracted data.

### 3. Create Reference Document

Build the reference file with this structure:

```markdown
# Gastify Design System Reference
<!-- Generated from design-system-final.html -->
<!-- Size target: <4000 tokens -->
<!-- Generated: [date] -->

## Design Tokens

### Colors (Use Variable Names)
| Category | Variables |
|----------|-----------|
| Primary | --primary, --primary-light, --primary-dark, --primary-hover |
| Background | --bg-primary, --bg-secondary, --bg-tertiary |
| Text | --text-primary, --text-secondary, --text-tertiary |
| Border | --border-light, --border-medium |
| Status | --success, --warning, --error |

### Spacing
--space-1 through --space-10

### Border Radii
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl, --radius-full

### Shadows
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

### Typography
- Body: 'Outfit', sans-serif (var(--font-family))
- Logo: 'Baloo 2', sans-serif

---

## Navigation Components

### Bottom Navigation
**Labels:** Inicio | Analíticas | [Camera] | Ideas | Ajustes
**Center Position:** margin-top: -56px

<details>
<summary>HTML (copy-paste)</summary>

[Exact HTML from extraction]

</details>

<details>
<summary>CSS (copy-paste)</summary>

[Exact CSS from extraction]

</details>

### Top Bar
**Structure:** G Logo (left) | Gastify (center) | Menu (right)

<details>
<summary>HTML (copy-paste)</summary>

[Exact HTML from extraction]

</details>

---

## Cards

[Each card type with HTML/CSS in <details>]

---

## Charts

[Each chart type with SVG template in <details>]

---

## Canonical Icons

| Function | SVG Path |
|----------|----------|
| Inicio (house) | `m3 9 9-7 9 7v11...` |
| Analíticas (chart) | `M3 3v18h18...` |
| Camera (CENTER) | `M14.5 4h-5L7 7H4...` + `circle cx=12 cy=13 r=3` |
| Ideas (lightbulb) | `M9.663 17h4.673...` |
| Ajustes (sun) | `circle cx=12 cy=12 r=3` + `M12 1v2...` |

---

## Prescriptive Validation Rules

### MUST Use
- CSS variables for ALL colors: `var(--name)`
- Spanish labels: Inicio, Analíticas, Ideas, Ajustes
- Camera icon for center button
- margin-top: -56px for .scan-center

### MUST NOT Use
- Hardcoded hex colors (#0d9488)
- English labels (Home, Analytics, etc.)
- Scan/barcode icon for center
- margin-top: -32px for scan-center

---

## Quick Reference

### Color Usage
```css
/* CORRECT */
color: var(--primary);
background: var(--bg-secondary);

/* FORBIDDEN */
color: #0d9488;
```

### Nav Labels
```
Inicio | Analíticas | [Camera] | Ideas | Ajustes
```
```

### 4. Estimate Token Count

Rough estimate of reference size.

Display:

"**Reference File Draft Created**

Estimated size: ~[X] tokens (target: <4000)

Structure:
- Design Tokens section
- Navigation Components (with HTML/CSS)
- Cards section
- Charts section
- Canonical Icons table
- Validation Rules

Ready to review the draft?"

### 5. Show Draft Preview

Display key sections of the reference for user review.

### 6. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask}
- IF P: Execute {partyModeWorkflow}
- IF C: Save reference to {design_system_reference}, then load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#6-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN C is selected:
1. Save the reference file to {design_system_reference}
2. Load and execute {nextStepFile}

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Reference file created with all extracted data
- Size under 4000 tokens
- All components have copy-paste snippets
- Validation rules section included
- User reviewed and approved

### ❌ SYSTEM FAILURE:

- Adding components not in extraction
- Reference too large (>4000 tokens)
- Missing HTML/CSS snippets
- No validation rules section
- Saving without user approval

**Master Rule:** The reference file is the single source of truth for Phase 2. It must be complete and compact.
