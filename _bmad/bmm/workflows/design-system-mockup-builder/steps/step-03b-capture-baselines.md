---
name: 'step-03b-capture-baselines'
description: 'Capture baseline screenshots of each base component for visual validation'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/design-system-mockup-builder'

# File References
thisStepFile: '{workflow_path}/steps/step-03b-capture-baselines.md'
workflowFile: '{workflow_path}/workflow.md'
nextStepFile: '{workflow_path}/steps/step-04-create-reference.md'

# Design System Files
design_system_source: '{project-root}/docs/uxui/mockups/00_components/design-system-final.html'
baselines_folder: '{project-root}/docs/uxui/mockups/00_components/baselines'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/tasks/advanced-elicitation.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 3b: Capture Component Baselines

## STEP GOAL:

To capture baseline screenshots of each base component from design-system-final.html using Playwright. These baselines will be used in Phase 2 for visual validation to detect deviations from the design system.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Role Reinforcement:

- ✅ You are a Design System Guardian & UI Mockup Builder
- ✅ Capture accurate component screenshots
- ✅ Use consistent viewport and settings
- ✅ Document each baseline for traceability

### Step-Specific Rules:

- 🎯 Focus ONLY on screenshot capture
- 🚫 FORBIDDEN to modify the design system source
- 💬 Report progress for each component
- 📸 Use Playwright for consistent captures

## EXECUTION PROTOCOLS:

- 🎯 Open design-system-final.html in browser
- 📸 Screenshot each component section
- 💾 Save to baselines folder with naming convention
- 📋 Create manifest of captured baselines

## CONTEXT BOUNDARIES:

- Extraction from step-03 is complete
- Component inventory is known
- This prepares for visual validation in Phase 2

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Baseline Capture

Display:

"**Capturing Component Baselines for Visual Validation**

I will now screenshot each base component from the design system.
These screenshots serve as the 'ground truth' for Phase 2 visual validation."

### 2. Create Baselines Folder

Ensure folder exists: `{baselines_folder}`

If folder doesn't exist, create it.

### 3. Open Design System in Browser

Use Playwright to:
1. Open `{design_system_source}` in a browser
2. Set viewport to mobile dimensions (375x812 for iPhone X)
3. Wait for fonts and styles to load

### 4. Identify Component Sections

Based on extraction data from step-03, identify all component sections:

- **Navigation Components**
  - Status Bar
  - Top Bar
  - Bottom Navigation

- **Content Components**
  - Card variants
  - Transaction list items
  - Chart components
  - Summary blocks

- **Interactive Elements**
  - Buttons
  - Icons
  - Form elements

### 5. Capture Each Component

For each component section:

1. Scroll to component
2. Wait for render completion
3. Capture screenshot with padding
4. Save with naming convention: `{component-name}.png`

Display progress:

"**Capturing: [Component Name]**
- Scrolled to section
- Screenshot captured
- Saved as: `{baselines_folder}/[component-name].png`
✅ [X]/[Total] complete"

### 6. Capture Prescriptive Elements

Ensure these CRITICAL elements are captured with clear labels:

**Spanish Navigation Labels:**
- `baseline-nav-inicio.png`
- `baseline-nav-analiticas.png`
- `baseline-nav-camera.png`
- `baseline-nav-ideas.png`
- `baseline-nav-ajustes.png`

**Camera Icon (Center Button):**
- `baseline-camera-icon.png`

**Scan Center Position:**
- `baseline-scan-center.png`

### 7. Create Baseline Manifest

Create a manifest file at `{baselines_folder}/manifest.md`:

```markdown
# Component Baselines Manifest

Generated: [timestamp]
Source: design-system-final.html

## Captured Components

### Navigation (5)
- [x] baseline-nav-inicio.png
- [x] baseline-nav-analiticas.png
- [x] baseline-nav-camera.png
- [x] baseline-nav-ideas.png
- [x] baseline-nav-ajustes.png

### Icons (N)
- [x] baseline-camera-icon.png
- [x] [other icons...]

### Content Components (N)
- [x] baseline-[component].png
...

## Validation Thresholds

- **Pass:** <10% pixel difference
- **Warn:** 10-30% pixel difference
- **Fail:** >30% pixel difference

## Usage

These baselines are used by step-11-visual-validation.md
to compare built mockups against source components.
```

### 8. Report Baseline Summary

Display:

"✅ **Baseline Capture Complete**

**Summary:**
- Total components: [N]
- Screenshots captured: [N]
- Manifest created: `{baselines_folder}/manifest.md`

**Captured Categories:**
- Navigation: [X] screenshots
- Icons: [X] screenshots
- Content: [X] screenshots
- Layout: [X] screenshots

**Ready for visual validation in Phase 2!**"

### 9. Present MENU OPTIONS

Display: "**Select an Option:** [A] Advanced Elicitation [P] Party Mode [C] Continue to Reference Creation"

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu
- User can chat or ask questions - respond then redisplay menu

#### Menu Handling Logic:

- IF A: Execute {advancedElicitationTask} - review baseline completeness
- IF P: Execute {partyModeWorkflow}
- IF C: Proceed to reference creation, load, read entire file, then execute {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#9-present-menu-options)

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN:
1. All components have been screenshotted
2. Manifest file created
3. User selects 'C'

Then load and execute {nextStepFile} to continue with reference creation.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All identified components captured
- Consistent viewport and settings used
- Prescriptive elements clearly captured
- Manifest file created
- Baselines folder organized

### ❌ SYSTEM FAILURE:

- Skipping components
- Inconsistent capture settings
- Missing prescriptive element baselines
- No manifest created
- Modifying source file

**Master Rule:** Baselines must be accurate captures of the source design system. These are the ground truth for visual validation.
