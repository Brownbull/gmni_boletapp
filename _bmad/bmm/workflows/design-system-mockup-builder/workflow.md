---
name: design-system-mockup-builder
description: "Build HTML mockup screens using ONLY components from the design system. Enforces design system compliance through a two-phase workflow: Phase 1 extracts components into a compact reference, Phase 2 builds screens using only those components."
web_bundle: false
---

# Design System Mockup Builder

**Goal:** Build HTML mockup screens using ONLY components from the established design system, preventing AI agents from inventing new components.

**Your Role:** In addition to your name, communication_style, and persona, you are also a **Design System Enforcer** collaborating with a **product designer or developer**. This is a partnership, not a client-vendor relationship. You bring expertise in component extraction and compliance validation, while the user brings domain knowledge about their app's UX requirements. Work together as equals.

## WORKFLOW ARCHITECTURE

### Core Principles

- **Micro-file Design**: Each step of the overall goal is a self contained instruction file that you will adhere to 1 file as directed at a time
- **Just-In-Time Loading**: Only 1 current step file will be loaded, read, and executed to completion - never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **State Tracking**: Document progress in output file frontmatter using `stepsCompleted` array when a workflow produces a document
- **Append-Only Building**: Build documents by appending content as directed to the output file
- **Design System Compliance**: All mockup screens MUST use components from the extracted reference - zero invented components

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: If the step has a menu with Continue as an option, only proceed to next step when user selects 'C' (Continue)
5. **SAVE STATE**: Update `stepsCompleted` in frontmatter before loading next step
6. **LOAD NEXT**: When directed, load, read entire file, then execute the next step file

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 💾 **ALWAYS** update frontmatter of output files when writing the final output for a specific step
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **ALWAYS** halt at menus and wait for user input
- 📋 **NEVER** create mental todo lists from future steps
- 🎨 **NEVER** invent new components - use ONLY what's in the design system reference

---

## Overview

This workflow enforces design system compliance through a **two-phase architecture**:

- **Phase 1:** Extract and catalog the design system into a compact reference (+ capture baselines)
- **Phase 2:** Build screens using ONLY components from that reference (+ visual validation)

## The Problem This Solves

AI agents tend to invent new components and styles on the fly instead of using established design systems. This workflow prevents that by:

1. Creating a persistent, compact reference file (~4000 tokens)
2. Capturing baseline screenshots of each component for visual comparison
3. Loading that reference before every screen build
4. Validating all output against prescriptive rules
5. Running visual validation to catch deviations

## Key Artifacts

| Artifact | Purpose | Location |
|----------|---------|----------|
| Design System Source | Master component definitions | `{design_system_source}` |
| Design System Reference | Compact extraction for AI context | `{design_system_reference}` |
| Component Baselines | Screenshots of each base component | `{baselines_folder}/` |
| Screen Mockups | Individual screen outputs | `{mockups_output_folder}/[screen-name].html` |

## Workflow Phases

### Phase 1: Design System Extraction (Run Once)

1. **Init** - Check for existing reference, route accordingly
1b. **Continue** - User decides to use existing or rebuild
2. **Validate Source** - Ensure design-system-final.html exists
3. **Extract** - Parse tokens and components
3b. **Capture Baselines** - Screenshot each base component
4. **Create Reference** - Generate design-system-reference.md
5. **Validate Reference** - Confirm all components captured

### Phase 2: Screen Building (Run Per Screen)

6. **Load Reference** - Mandatory gate, halts if missing
7. **Gather Requirements** - User specifies screen needs
8. **Plan Layout** - Show component arrangement for approval
9. **Assemble Screen** - Copy-paste exact components
10. **Validate & Save** - Check compliance, loop or complete
11. **Visual Validation** - Compare screenshots against baselines

## Prescriptive Rules (Non-Negotiable)

### Navigation Labels (Spanish)
```
Inicio | Analíticas | [Camera] | Ideas | Ajustes
```

### Center Button Icon (Camera, NOT Scan)
```svg
<svg viewBox="0 0 24 24">
  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
  <circle cx="12" cy="13" r="3"/>
</svg>
```

### Color Usage
```css
/* CORRECT */
color: var(--primary);
background: var(--bg-secondary);

/* FORBIDDEN */
color: #0d9488;
background: #f8fafc;
```

### Scan Center Position
```css
.scan-center {
  margin-top: -56px; /* CORRECT */
  /* NOT -32px */
}
```

## Success Criteria

1. **Zero invented components** in Phase 2 screens
2. **100% CSS variable usage** for colors
3. **Spanish labels** on all navigation
4. **Camera icon** on center button
5. **Visual match** to design system reference
6. **Reusable reference** stays under 4000 tokens
7. **Visual validation passes** with <10% diff threshold

## Related Resources

### Historical Patterns (from Atlas Migration)
When building interactive mockups with JavaScript (dropdowns, modals, animations), reference these patterns:
- **Pattern #31:** Unique Animation Keyframe Names
- **Pattern #32:** JavaScript Style Reset Must Restore Defaults
- **Pattern #33:** Nested Background Contrast with Border
- **Pattern #34:** Centered Modal vs Bottom Sheet Patterns

Location: `docs/architecture/component-patterns.md` (migrated from Atlas 2026-02-05)

## Tool Integration

- **Advanced Elicitation** - Phase 1 Step 5 (validate extraction)
- **Party-Mode** - Phase 2 Step 8 (plan layout)
- **Brainstorming** - Phase 2 Step 7 (gather requirements)
- **Playwright** - Phase 1 Step 3b (baselines) + Phase 2 Step 11 (visual validation)
- **File I/O** - Throughout for reading/writing files

---

## INITIALIZATION SEQUENCE

### 1. Module Configuration Loading

Load and read full config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `output_folder`, `user_name`, `communication_language`, `document_output_language`

### 2. Path Variables

```yaml
# Config values
config_source: "{project-root}/_bmad/bmm/config.yaml"
output_folder: "{config_source}:output_folder"

# Workflow components
workflow_path: "{project-root}/_bmad/bmm/workflows/design-system-mockup-builder"
validation: "{workflow_path}/checklist.md"

# Design System Source (the master component definitions)
design_system_source: "{project-root}/docs/uxui/mockups/00_components/design-system-final.html"

# Output artifacts
design_system_reference: "{project-root}/docs/uxui/mockups/00_components/design-system-reference.md"
mockups_output_folder: "{project-root}/docs/uxui/mockups"
baselines_folder: "{project-root}/docs/uxui/mockups/00_components/baselines"

# Task References
advancedElicitationTask: "{project-root}/_bmad/core/tasks/advanced-elicitation.xml"
partyModeWorkflow: "{project-root}/_bmad/core/workflows/party-mode/workflow.md"
brainstormingTask: "{project-root}/_bmad/core/tasks/brainstorming.xml"
```

---

## EXECUTION

Load and execute `steps/step-01-init.md` to begin the workflow.
