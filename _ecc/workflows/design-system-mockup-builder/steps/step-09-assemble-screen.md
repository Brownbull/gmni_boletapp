---
name: 'step-09-assemble-screen'
description: 'Assemble the screen by copying exact components from reference'

# Path Definitions
workflow_path: '{project-root}/_ecc/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-09-assemble-screen.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-10-validate-save.md'
screenTemplate: '{workflow_path}/templates/screen-mockup.template.html'

# Design System Files
design_system_reference: '{project-root}/docs/uxui/mockups/00_components/design-system-reference.md'
mockups_output_folder: '{project-root}/docs/uxui/mockups'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 9: Assemble Screen

## STEP GOAL:

To assemble the screen HTML file by COPYING exact HTML/CSS snippets from the reference. NO modifications unless explicitly requested.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ COPY EXACTLY from reference - character for character
- ✅ NO "improvements" or "optimizations"
- ✅ NO invented styles or components

### Step-Specific Rules:

- 🎯 Focus ONLY on assembly
- 🚫 FORBIDDEN to modify copied snippets
- 🚫 FORBIDDEN to add components not in layout plan
- 💬 Show what you're copying as you go

## EXECUTION PROTOCOLS:

- 🎯 Copy HTML structure from template
- 📋 Copy each component exactly from reference
- ✅ Assemble in order from layout plan
- 📄 Show assembled code for review

## CONTEXT BOUNDARIES:

- Layout plan approved from previous step
- Reference in context
- Copy-paste only - no creation

## CRITICAL PRESCRIPTIVE RULES (NON-NEGOTIABLE):

These rules MUST be followed during assembly:

```css
/* COLORS - Use variables ONLY */
color: var(--primary);           /* ✅ CORRECT */
color: #0d9488;                  /* ❌ FORBIDDEN */

/* SCAN CENTER POSITION */
margin-top: -56px;               /* ✅ CORRECT */
margin-top: -32px;               /* ❌ FORBIDDEN */
```

```html
<!-- NAV LABELS - Spanish ONLY -->
<span>Inicio</span>              <!-- ✅ CORRECT -->
<span>Home</span>                <!-- ❌ FORBIDDEN -->

<!-- CENTER ICON - Camera ONLY -->
<path d="M14.5 4h-5L7 7H4..."/> <!-- ✅ CORRECT (camera) -->
<path d="M3 7V5a2 2 0..."/>     <!-- ❌ FORBIDDEN (scan) -->
```

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Assembly Start

Display:

"**Assembling Screen: [screen-name]**

I will now copy components exactly from the reference.
NO modifications. NO improvements. EXACT copies."

### 2. Start with Base Template

Load template structure (if available) or create standard HTML5 document:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gastify - [Screen Name]</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Baloo+2:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Design Tokens - COPIED from reference */
        :root {
            [Exact token block from reference]
        }

        /* Component Styles - COPIED from reference */
        [Exact CSS blocks from reference]
    </style>
</head>
<body>
```

Display: "✅ Base template created"

### 3. Copy Design Tokens

From reference, copy ENTIRE :root block:

Display:

"**Copying Design Tokens...**
- Colors: var(--primary), var(--bg-secondary), etc.
- Spacing: var(--space-1) through var(--space-10)
- Radii: var(--radius-sm) through var(--radius-full)
- Shadows: var(--shadow-sm) through var(--shadow-xl)"

### 4. Copy Status Bar

From reference, copy status bar component exactly.

Display: "✅ Status bar copied"

### 5. Copy Top Bar

From reference, copy top bar component exactly.

Display:

"**Copying Top Bar...**
- G Logo with gradient
- Gastify title
- Menu button with hamburger icon
✅ Top bar copied"

### 6. Copy Content Components

For each component in the layout plan:

1. Locate in reference
2. Copy HTML exactly
3. Copy associated CSS exactly
4. Report completion

Display for each:

"**Copying [Component Name]...**
- Source: Reference section [X]
- HTML: [X] lines copied
- CSS: [X] lines copied
✅ [Component Name] copied"

### 7. Copy Bottom Navigation

From reference, copy bottom nav exactly.

Display:

"**Copying Bottom Navigation...**
- Labels: Inicio | Analíticas | [Camera] | Ideas | Ajustes
- Active item: [specified item] highlighted
- Center button: Camera icon (M14.5 4h-5L7 7H4...)
- Position: margin-top: -56px
✅ Bottom navigation copied"

### 8. Finalize Document

Close HTML structure:

```html
    </div><!-- phone-frame -->
</body>
</html>
```

### 9. Show Assembled Code

Display:

"**Assembly Complete**

**Screen:** [name]
**Components Assembled:**
- ✅ Design Tokens (from reference)
- ✅ Status Bar (from reference)
- ✅ Top Bar (from reference)
- ✅ [Component 1] (from reference)
- ✅ [Component 2] (from reference)
- ✅ Bottom Nav (from reference)

**Prescriptive Rules Applied:**
- ✅ All colors use CSS variables
- ✅ Spanish nav labels
- ✅ Camera icon for center
- ✅ scan-center: margin-top -56px

Ready for validation?"

### 10. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue to Validation"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask}
- IF P: Execute {partyModeWorkflow}
- IF C: Proceed with assembled screen, load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#10-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN:
1. All components copied from reference
2. Assembly summary shown
3. User selects 'C'

Then load and execute {nextStepFile} carrying the assembled HTML.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All components copied exactly from reference
- No modifications to copied code
- CSS variables used (no hex)
- Spanish labels preserved
- Camera icon for center button
- margin-top: -56px for scan-center

### ❌ SYSTEM FAILURE:

- Modifying copied components
- Adding components not in reference
- Using hex colors instead of variables
- Changing labels to English
- Using wrong icon for center
- Using wrong margin for scan-center

**Master Rule:** COPY EXACTLY. Do not improve, optimize, or modify. If it's in the reference, use it exactly as written.
