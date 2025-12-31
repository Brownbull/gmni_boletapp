---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
workflowComplete: true
---

# Workflow Creation Plan: design-system-mockup-builder

## Initial Project Context

- **Module:** bmm
- **Target Location:** _bmad/bmm/workflows/design-system-mockup-builder
- **Created:** 2025-12-27
- **Author:** Gabe

## Problem Statement

When building UI mockups, AI agents tend to invent new components and styles on the fly instead of using the established design system. This creates inconsistency and defeats the purpose of having a design system.

---

## Advanced Elicitation Insights

### From Pre-mortem Analysis

**Failure Scenarios Identified:**
| Failure | Root Cause | Prevention |
|---------|------------|------------|
| AI still invented components | Design system not in active context | Create persistent compact reference file |
| Colors hardcoded | AI copied hex values not variable names | Extract variable NAMES not values |
| Wrong icons used | Multiple options, AI picked wrong | Create canonical icon map |
| Spanish labels forgotten | AI defaulted to English | Hardcode label constants |
| Workflow too slow | Loading full HTML every time | Cache extraction, reuse output |
| Screens looked different | Same component, different implementation | Provide exact copy-paste snippets |
| Validation passed but looked wrong | Structural check only | Add visual comparison step |

**Key Insight:** Need a **persistent design system reference artifact** (~4000 tokens) that stays in context.

### From Architecture Decision Records

**ADR-001: Component-First Architecture**
- Decision: MUST load and extract design system BEFORE screen building
- Approach: Create `design-system-reference.md` artifact (Option B)
- Trade-off: Extra extraction step, but compact and reusable

**ADR-002: Validation Strategy**
- Decision: PRESCRIPTIVE rules, not intent-based
- Exact patterns required:
  ```
  MUST: var(--primary), var(--bg-secondary)
  MUST NOT: #0d9488, rgb(13, 148, 136)
  MUST: Inicio, Analíticas, Ideas, Ajustes
  MUST NOT: Home, Analytics, History, Settings
  MUST: Camera icon (M14.5 4h-5L7 7H4...)
  MUST NOT: Scan icon (M3 7V5...)
  ```

**ADR-003: Two-Phase Separation**
- Phase 1 = Creative (can add new components)
- Phase 2 = Restrictive (can ONLY use existing)
- Gate: Phase 2 cannot start until Phase 1 output exists

### From User Persona Focus Group

| Persona | Role | Key Need |
|---------|------|----------|
| Gabe | Project Owner | Visual consistency, trust in output |
| AI Agent | Builder | Explicit boundaries, copy-paste snippets |
| Future Designer | Extender | Component catalog, extension guidelines |
| Developer | Implementer | Production-ready HTML, consistent naming |

**Key Insight:** Produce a **component catalog** as Phase 1 artifact.

### From First Principles Analysis

**Fundamental Truths:**
1. Components must be DEFINED before USED → Phase 1 before Phase 2
2. AI context is limited → Reference must be compact (<4000 tokens)
3. AI takes shortcuts if allowed → Validation must be mandatory
4. Copy-paste > re-creation → Provide exact HTML snippets
5. Visual correctness ≠ structural correctness → Need visual verification

**Rebuilt 7-Step Flow:**
```
1. EXTRACT  → Parse design system into compact reference
2. CATALOG  → List available components with snippets
3. PLAN     → User selects components for screen
4. ASSEMBLE → Copy-paste components into screen
5. VALIDATE → Check against reference (structural)
6. VERIFY   → Visual comparison (optional)
7. SAVE     → Only if validation passes
```

### From Failure Mode Analysis

| Step | Failure Mode | Mitigation |
|------|--------------|------------|
| Load Design System | File too large | Chunked loading |
| Extract Components | Wrong values (hex vs var) | Pattern matching extraction |
| Build Screen | Invented component | Strict allowlist enforcement |
| Validation | False positive (bad passes) | Tighten prescriptive rules |
| Save | Overwrites existing | Timestamp filenames |

**#1 Risk:** AI invents components despite workflow

**Prevention Layers:**
1. Allowlist enforcement - only catalogued components
2. Pattern matching - detect non-variable colors
3. Snippet requirement - must use exact HTML
4. Human checkpoint - show plan before building

---

## Refined Workflow Design

### Workflow Type
- **Primary:** Document Workflow (generates HTML mockup files)
- **Secondary:** Action Workflow (enforces validation)

### Instruction Style
- **PRESCRIPTIVE** - exact rules, no interpretation allowed

### Workflow Flow Pattern
- **Two-Phase with Gate:**
  - Phase 1: Linear (extract → catalog → save reference)
  - Phase 2: Looping (plan → build → validate → repeat until done)

---

## Detailed Workflow Steps

### Phase 1: Design System Extraction (Run Once)

**Step 1.1: Validate Design System Exists**
- Check: `docs/uxui/mockups/00_components/design-system-final.html`
- If missing: STOP, inform user

**Step 1.2: Extract Design Tokens**
- Parse CSS custom properties from :root
- Extract variable NAMES (not values): `--primary`, `--bg-secondary`, etc.
- Group by category: colors, spacing, typography, shadows, radii

**Step 1.3: Extract Component Catalog**
For each component type, extract:
- Component name
- CSS class names
- Exact HTML snippet (copy-paste ready)
- SVG icon paths (exact)
- Text content patterns (Spanish labels)

**Step 1.4: Create Reference Artifact**
- Output: `docs/uxui/mockups/00_components/design-system-reference.md`
- Format: Compact, <4000 tokens
- Content: Tokens + Component snippets

**Step 1.5: Validate Reference**
- Ensure all components extracted
- Ensure Spanish labels preserved
- Ensure camera icon (not scan) for center button

---

### Phase 2: Screen Building (Run Per Screen)

**Step 2.1: Load Reference (Mandatory)**
- Read: `design-system-reference.md`
- HALT if file missing (run Phase 1 first)

**Step 2.2: Gather Screen Requirements**
- Ask: Screen name/purpose
- Ask: Which components needed (show catalog)
- Validate: All requested components exist in reference

**Step 2.3: Plan Screen Layout**
- Show: Proposed component arrangement
- List: Exact components from reference to use
- WAIT: User approval before building

**Step 2.4: Assemble Screen**
- Copy-paste: Exact HTML snippets from reference
- Copy-paste: Exact CSS from reference
- Copy-paste: Exact SVG icons from reference
- NO modifications unless user specifies

**Step 2.5: Validate Against Reference**
Prescriptive checks:
- [ ] All colors use CSS variables (no hex)
- [ ] Nav labels: Inicio, Analíticas, Ideas, Ajustes
- [ ] Center button: Camera icon
- [ ] All class names match reference
- [ ] All HTML structure matches reference

**Step 2.6: Save Screen**
- If validation passes: Save to `docs/uxui/mockups/[screen-name].html`
- If validation fails: Show violations, fix, re-validate

**Step 2.7: Continue or Complete**
- Ask: Build another screen?
- If yes: Return to Step 2.2
- If no: Complete workflow

---

## Key Artifacts

| Artifact | Purpose | Location |
|----------|---------|----------|
| Design System Source | Master component definitions | `docs/uxui/mockups/00_components/design-system-final.html` |
| Design System Reference | Compact extraction for AI context | `docs/uxui/mockups/00_components/design-system-reference.md` |
| Screen Mockups | Individual screen outputs | `docs/uxui/mockups/[screen-name].html` |

---

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
  margin-top: -56px; /* CORRECT: top-aligned */
  /* NOT -32px */
}
```

---

## Success Criteria

1. **Zero invented components** in Phase 2 screens
2. **100% CSS variable usage** for colors
3. **Spanish labels** on all navigation
4. **Camera icon** on center button
5. **Visual match** to design system reference
6. **Reusable reference** stays under 4000 tokens

---

## Users

- Gabe (project owner)
- AI agents building UI mockups for Boletapp/Gastify

---

## Tools Configuration

### Core BMAD Tools

| Tool | Included | Integration Points |
|------|----------|-------------------|
| **Advanced Elicitation** | ✅ Yes | Phase 1 Step 1.5 - After component extraction, to ensure all components captured |
| **Party-Mode** | ✅ Yes | Phase 2 Step 2.3 - During screen planning, for multiple perspectives on layout |
| **Brainstorming** | ✅ Yes | Phase 2 Step 2.2 - When deciding which components to include in a screen |

### LLM Features

| Feature | Included | Use Case |
|---------|----------|----------|
| **File I/O** | ✅ Yes | Read design system HTML, write reference file, create screen mockups |
| **Web-Browsing** | ❌ No | Not needed - all content is local |
| **Sub-Agents** | ❌ No | Single workflow, no delegation needed |
| **Sub-Processes** | ❌ No | Sequential execution sufficient |

### Memory Systems

| System | Included | Purpose |
|--------|----------|---------|
| **Sidecar File** | ✅ Yes | `design-system-reference.md` serves as persistent state that Phase 2 loads |

### External Integrations

- None required - workflow operates on local files only

### Installation Requirements

- No external installations required
- All tools are built-in BMAD capabilities

---

## Tool Integration Map

```
PHASE 1: Design System Extraction
┌─────────────────────────────────────────────────────────┐
│ Step 1.1: Validate DS exists                            │
│ Step 1.2: Extract tokens              [File I/O]        │
│ Step 1.3: Extract components          [File I/O]        │
│ Step 1.4: Create reference            [File I/O]        │
│ Step 1.5: Validate reference          [Adv. Elicit] ◄── │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              design-system-reference.md
                    [Sidecar File]
                         │
                         ▼
PHASE 2: Screen Building (Loop)
┌─────────────────────────────────────────────────────────┐
│ Step 2.1: Load reference              [File I/O]        │
│ Step 2.2: Gather requirements         [Brainstorm] ◄──  │
│ Step 2.3: Plan layout                 [Party-Mode] ◄──  │
│ Step 2.4: Assemble screen             [File I/O]        │
│ Step 2.5: Validate                                      │
│ Step 2.6: Save                        [File I/O]        │
│ Step 2.7: Continue? ──► Loop or Exit                    │
└─────────────────────────────────────────────────────────┘
```

---

## Output Format Design

### Format Type
Both outputs are **Strict Template** - must follow exact formats with specific structure.

### Output 1: design-system-reference.md

**Document Type:** Component catalog / AI context file
**File Format:** Markdown
**Frequency:** Generated once per design system update (Phase 1)
**Size Constraint:** <4000 tokens for AI context efficiency

**Template Structure:**

```markdown
# Gastify Design System Reference
<!-- Generated from design-system-final.html -->
<!-- Size target: <4000 tokens -->

## Design Tokens

### Colors (Variable Names Only)
| Category | Variables |
|----------|-----------|
| Primary | --primary, --primary-light, --primary-dark, --primary-hover |
| Background | --bg-primary, --bg-secondary, --bg-tertiary |
| Text | --text-primary, --text-secondary, --text-tertiary |
| Border | --border-light, --border-medium |
| Status | --success, --warning, --error |

### Spacing
--space-1 (4px) through --space-10 (40px)

### Border Radii
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl, --radius-full

### Shadows
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

### Typography
--font-family: 'Outfit', sans-serif
Logo font: 'Baloo 2', sans-serif

---

## Navigation Components

### Bottom Navigation
**Labels:** Inicio | Analíticas | [Camera] | Ideas | Ajustes
**Active Style:** nav-glow (background + icon glow)
**Center Position:** margin-top: -56px

<details>
<summary>HTML Snippet (copy-paste)</summary>

[Exact HTML here]

</details>

<details>
<summary>CSS (copy-paste)</summary>

[Exact CSS here]

</details>

### Top Bar
**Structure:** G Logo (left) | Gastify (center) | Menu (right)
**Logo:** 28px, gradient, Baloo 2 font
**Menu:** 36x36px, rounded, hamburger icon

<details>
<summary>HTML Snippet (copy-paste)</summary>

[Exact HTML here]

</details>

---

## Cards & Containers

### Summary Card
[HTML + CSS snippets]

### Dashboard Card
[HTML + CSS snippets]

---

## Charts

### Donut Chart
[SVG template]

### Bar Chart
[SVG template]

---

## Canonical Icons

| Function | Icon Name | SVG Path |
|----------|-----------|----------|
| Home/Inicio | house | m3 9 9-7 9 7v11... |
| Analytics/Analíticas | chart-line | M3 3v18h18... |
| Camera (CENTER) | camera | M14.5 4h-5L7 7H4... + circle cx=12 cy=13 r=3 |
| Ideas | lightbulb | M9.663 17h4.673... |
| Settings/Ajustes | sun | circle cx=12 cy=12 r=3 + M12 1v2... |
| Menu | hamburger | lines at y=6,12,18 |

---

## Validation Rules

### MUST Use
- CSS variables for all colors
- Spanish labels: Inicio, Analíticas, Ideas, Ajustes
- Camera icon for center button
- margin-top: -56px for scan-center

### MUST NOT Use
- Hardcoded hex colors
- English labels
- Scan/barcode icon for center
- margin-top: -32px for scan-center
```

---

### Output 2: [screen-name].html

**Document Type:** HTML mockup screen
**File Format:** HTML
**Frequency:** One per screen (Phase 2, looping)

**Template Structure:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gastify - [Screen Name]</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Baloo+2:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        /* =============================================
           DESIGN TOKENS (from design-system-reference.md)
           ============================================= */
        :root {
            /* Colors - USE THESE, NOT HEX VALUES */
            --primary: #0d9488;
            --primary-light: #ccfbf1;
            /* ... all tokens from reference ... */
        }

        /* =============================================
           COMPONENT STYLES (from design-system-reference.md)
           ============================================= */

        /* Top Bar */
        .top-bar { /* exact CSS from reference */ }

        /* Bottom Navigation */
        .bottom-nav { /* exact CSS from reference */ }
        .nav-item { /* exact CSS from reference */ }
        .scan-center { margin-top: -56px; /* MUST be -56px */ }

        /* Screen-specific styles */
        /* ... */
    </style>
</head>
<body>
    <!-- Phone Frame Container -->
    <div class="phone-frame">

        <!-- Status Bar -->
        <div class="status-bar">
            <span class="status-bar-time">9:41</span>
            <div class="status-bar-icons"><!-- signal, battery --></div>
        </div>

        <!-- Top Bar (from reference - COPY EXACTLY) -->
        <div class="top-bar">
            <div class="top-bar-logo"><span>G</span></div>
            <span class="top-bar-title">Gastify</span>
            <button class="top-bar-menu"><!-- hamburger icon --></button>
        </div>

        <!-- Main Content Area -->
        <div class="screen-content">
            <!-- Screen-specific components from reference -->
        </div>

        <!-- Bottom Navigation (from reference - COPY EXACTLY) -->
        <div class="bottom-nav">
            <div class="nav-item"><!-- Inicio --></div>
            <div class="nav-item active"><!-- Analíticas --></div>
            <div class="nav-item scan-center"><!-- Camera button --></div>
            <div class="nav-item"><!-- Ideas --></div>
            <div class="nav-item"><!-- Ajustes --></div>
        </div>

    </div>
</body>
</html>
```

---

### Template Source
- **Created by:** AI-proposed based on design-system-final.html analysis
- **Validation:** Against prescriptive rules in this plan

### Special Considerations
- Reference file must stay <4000 tokens for AI context
- HTML snippets must be copy-paste ready (no placeholders except content)
- All validation is prescriptive, not intent-based

---

## Workflow Structure Design

### Step Structure (10 Steps Total)

#### Phase 1: Design System Extraction (5 steps)

| Step | File | Goal | Type |
|------|------|------|------|
| 1.1 | step-01-init.md | Initialize, check for existing reference | Init |
| 1.1b | step-01b-continue.md | Handle continuation if reference exists | Continue |
| 1.2 | step-02-validate-source.md | Validate design-system-final.html exists | Auto-proceed |
| 1.3 | step-03-extract.md | Extract tokens and components | Work + Menu |
| 1.4 | step-04-create-reference.md | Create design-system-reference.md | Work + Menu |
| 1.5 | step-05-validate-reference.md | Validate extraction with Adv. Elicitation | Menu |

#### Phase 2: Screen Building (5 steps, looping)

| Step | File | Goal | Type |
|------|------|------|------|
| 2.1 | step-06-load-reference.md | Load reference file (mandatory gate) | Auto-proceed |
| 2.2 | step-07-gather-requirements.md | Gather screen requirements | Brainstorm + Menu |
| 2.3 | step-08-plan-layout.md | Plan layout with Party-Mode | Party-Mode + Menu |
| 2.4 | step-09-assemble-screen.md | Assemble screen from components | Work + Menu |
| 2.5 | step-10-validate-save.md | Validate, save, loop or complete | Menu |

### Continuation Support

- **Enabled:** Yes
- **Trigger:** If `design-system-reference.md` exists on init
- **Options:** Rebuild reference or use existing (skip to Phase 2)

### File Structure

```
_bmad/bmm/workflows/design-system-mockup-builder/
├── workflow.yaml                    # Workflow configuration
├── instructions.md                  # Main workflow instructions
├── checklist.md                     # Validation checklist
├── steps/
│   ├── step-01-init.md
│   ├── step-01b-continue.md
│   ├── step-02-validate-source.md
│   ├── step-03-extract.md
│   ├── step-04-create-reference.md
│   ├── step-05-validate-reference.md
│   ├── step-06-load-reference.md
│   ├── step-07-gather-requirements.md
│   ├── step-08-plan-layout.md
│   ├── step-09-assemble-screen.md
│   └── step-10-validate-save.md
└── templates/
    ├── design-system-reference.template.md
    └── screen-mockup.template.html
```

### Interaction Patterns

| Step | User Input | Menu Options |
|------|------------|--------------|
| 1.1 Init | None | Auto-proceed or route to 1b |
| 1.1b Continue | Choice | [R] Rebuild [U] Use existing |
| 1.2 Validate | None | Auto-proceed |
| 1.3 Extract | Review | [A] [P] [C] |
| 1.4 Create Ref | Review | [A] [P] [C] |
| 1.5 Validate | Confirm | [A] [P] [C] |
| 2.1 Load Ref | None | Auto-proceed (halt if missing) |
| 2.2 Requirements | Input | [B] Brainstorm [C] |
| 2.3 Plan | Approve | [P] Party-Mode [C] |
| 2.4 Assemble | Review | [A] [P] [C] |
| 2.5 Save | Decision | [N] New Screen [D] Done |

### Data Flow

```
PHASE 1:
design-system-final.html
        │
        ▼
[Extract Tokens] → tokens
        │
        ▼
[Extract Components] → catalog
        │
        ▼
design-system-reference.md (sidecar)

PHASE 2 (Loop):
design-system-reference.md
        │
        ▼
User requirements → selected components
        │
        ▼
[Assemble] → screen HTML
        │
        ▼
[Validate] → prescriptive checks
        │
        ▼
[screen-name].html
        │
        ▼
Loop? → Yes: Return to requirements
      → No: Complete
```

### Role Definition

- **Role:** Design System Guardian & UI Mockup Builder
- **Expertise:** HTML/CSS, design system enforcement, mobile UI patterns
- **Style:** Direct instructions, shows copy-paste snippets, strict on rules
- **Tone:** Professional, firm on compliance, helpful within constraints

### Validation Checklist

**CRITICAL:**
- [ ] Nav labels: Inicio, Analíticas, Ideas, Ajustes (Spanish)
- [ ] Center button: Camera icon (not scan)
- [ ] Colors: CSS variables only (no hex)
- [ ] scan-center: margin-top -56px

**HIGH:**
- [ ] All components from reference
- [ ] HTML structure matches exactly
- [ ] CSS classes match exactly
- [ ] SVG paths from canonical icons

**MEDIUM:**
- [ ] Typography uses --font-family
- [ ] Logo uses Baloo 2 font

### Special Features

- **Phase Gate:** Phase 2 requires reference file
- **Looping:** Phase 2 loops for multiple screens
- **Conditional:** Init routes to rebuild or reuse

---

## Next Steps

1. ✅ Design workflow step files (completed)
2. Create design-system-reference.md template
3. Build validation checklist
4. Test with analytics-options.html screen
