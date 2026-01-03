# Build Mockup Screen - Workflow Instructions

```xml
<critical>The workflow execution engine is governed by: {project_root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>This workflow builds HTML mockup screens using ONLY components from the design system.</critical>

<principle>
  DESIGN SYSTEM FIRST: Before writing ANY HTML/CSS for a screen, you MUST:
  1. Load the design system file completely
  2. Extract all available components, tokens, and patterns
  3. Reference ONLY these extracted components when building screens
  4. NEVER invent new components or styles on the fly
</principle>

<workflow>

  <step n="0" goal="Validate Design System Exists">
    <action>Check if {{design_system_source}} exists</action>
    <check if="file does not exist">
      <action>STOP and inform user: "No design system found. Please create one first at {{design_system_source}}"</action>
      <action>Offer to help create design system components first</action>
    </check>
  </step>

  <step n="1" goal="Load and Parse Design System">
    <critical>This is the MOST IMPORTANT step - do NOT skip or abbreviate</critical>
    <action>Read the ENTIRE {{design_system_source}} file</action>
    <action>Extract and document ALL of the following:

    ## CSS Custom Properties (Design Tokens)
    Extract all :root variables including:
    - Colors (--primary, --secondary, --accent, etc.)
    - Background colors (--bg-primary, --bg-secondary, etc.)
    - Text colors (--text-primary, --text-secondary, etc.)
    - Border colors (--border-light, --border-medium, etc.)
    - Shadows (--shadow-sm, --shadow-md, etc.)
    - Spacing (--space-1 through --space-10)
    - Border radii (--radius-sm through --radius-full)
    - Transitions (--transition-fast, --transition-normal, etc.)
    - Font family (--font-family)

    ## Theme Variations
    List all [data-theme="X"] variations and their overrides

    ## Component Classes
    Extract all reusable component classes:
    - Navigation: .bottom-nav, .nav-item, .scan-center, .scan-btn, .top-bar, etc.
    - Cards: card classes, dashboard cards, summary cards
    - Buttons: button styles, icon buttons
    - Charts: donut charts, bar charts, line charts
    - Forms: inputs, selectors, tabs
    - Typography: header styles, label styles

    ## Component HTML Patterns
    For each component, extract the EXACT HTML structure:
    - Element hierarchy
    - Required classes
    - Required attributes
    - SVG icons used (extract the exact path data)
    - Text content patterns (Spanish labels like "Inicio", "Analíticas", etc.)
    </action>

    <action>Create a mental "Design System Reference" that you will use for ALL subsequent building</action>
  </step>

  <step n="2" goal="Present Design System Summary to User">
    <action>Show user a summary of available components:</action>
    <action>Format:
      ## Available Components

      ### Navigation
      - Bottom Navigation (with camera center button)
        - Labels: Inicio, Analíticas, Ideas, Ajustes
        - Center button: Camera icon with gradient
      - Top Bar (G logo + Gastify wordmark + menu)

      ### Cards
      - Summary Cards
      - Dashboard Cards
      - etc.

      ### Charts
      - Donut Chart
      - Bar Chart
      - Line Chart
      - etc.

      ### Buttons & Controls
      - Primary Button
      - Period Selector Tabs
      - etc.
    </action>
    <action>Ask: "What screen would you like to build using these components?"</action>
    <action>WAIT for user response</action>
  </step>

  <step n="3" goal="Gather Screen Requirements" elicit="true">
    <action>Ask user for:
      1. Screen name/purpose
      2. Which components from the design system they want to use
      3. Layout preferences (single column, grid, etc.)
      4. Any specific content (charts, cards, navigation)
    </action>
    <action>VALIDATE that all requested components exist in the design system</action>
    <check if="user requests a component NOT in design system">
      <action>WARN: "That component doesn't exist in the design system. Would you like to:
        A) Add it to the design system first
        B) Use an existing similar component
        C) Skip that component"
      </action>
      <action>WAIT for selection</action>
    </check>
  </step>

  <step n="4" goal="Plan Screen Structure">
    <action>Create a screen plan showing:
      - Header section (which top bar variant)
      - Main content area (which components, in what order)
      - Bottom navigation (which nav style)
    </action>
    <action>List EXACT components from design system that will be used</action>
    <action>Show plan to user, confirm before proceeding</action>
  </step>

  <step n="5" goal="Build Screen HTML">
    <critical>Use ONLY components extracted in Step 1</critical>
    <critical>Copy CSS classes EXACTLY as defined in design system</critical>
    <critical>Copy HTML structure EXACTLY as defined in design system</critical>
    <critical>Copy SVG icons EXACTLY as defined in design system</critical>
    <critical>Use Spanish labels as defined: Inicio, Analíticas, Ideas, Ajustes</critical>

    <action>Build the HTML file structure:
      1. DOCTYPE and html tag
      2. Head with:
         - Font imports (copy from design system)
         - CSS custom properties (copy from design system)
         - Component CSS (copy from design system)
      3. Body with:
         - Phone frame container (if mockup)
         - Status bar
         - Top bar (from design system)
         - Main content area with components
         - Bottom navigation (from design system)
    </action>

    <substep>For each component:
      - Look up the EXACT HTML in design system
      - Look up the EXACT CSS in design system
      - Look up the EXACT SVG paths in design system
      - Copy verbatim - NO modifications unless specified by user
    </substep>
  </step>

  <step n="6" goal="Validate Against Design System">
    <invoke-task>Validate against {{validation}}</invoke-task>

    <action>Check each element:
      - [ ] Top bar matches design system exactly
      - [ ] Bottom nav labels are Spanish (Inicio, Analíticas, Ideas, Ajustes)
      - [ ] Center button uses camera icon (not scan/barcode)
      - [ ] Colors use CSS variables from design system
      - [ ] Font family uses --font-family variable
      - [ ] Spacing uses --space-X variables
      - [ ] Border radii use --radius-X variables
      - [ ] No inline colors (all via variables)
      - [ ] No invented component styles
    </action>

    <check if="validation fails">
      <action>List specific violations</action>
      <action>Fix each violation by replacing with design system component</action>
      <action>Re-validate</action>
    </check>
  </step>

  <step n="7" goal="Save and Confirm">
    <action>Save file to {{mockups_output_folder}}/[screen-name].html</action>
    <action>Confirm with user: "Screen saved. Open in browser to preview."</action>
    <action>Ask if any adjustments needed (using ONLY design system components)</action>
  </step>

</workflow>
```

## Key Enforcement Rules

### NEVER Do These:
- Create new CSS classes not in design system
- Use hardcoded colors instead of CSS variables
- Invent new icon SVGs
- Use English labels when Spanish is defined
- Modify component structure without adding to design system first
- Use different nav labels than: Inicio, Analíticas, Ideas, Ajustes

### ALWAYS Do These:
- Load design system FIRST before any building
- Copy component HTML exactly
- Copy component CSS exactly
- Copy SVG paths exactly
- Reference design tokens via CSS variables
- Validate against design system before saving

## Design System Reference Format

When extracting the design system, create a reference like this:

```markdown
# Design System Reference

## Tokens
- --primary: #0d9488
- --bg-primary: #ffffff
- etc.

## Navigation Components

### Bottom Nav
HTML:
```html
<div class="bottom-nav">
  <div class="nav-item">
    <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    <span>Inicio</span>
  </div>
  <div class="nav-item active">
    <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    <span>Analíticas</span>
  </div>
  <div class="nav-item scan-center">
    <button class="scan-btn">
      <svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
    </button>
  </div>
  <div class="nav-item">
    <svg viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
    <span>Ideas</span>
  </div>
  <div class="nav-item">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m17.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.73 0l-1.41-1.41M6.34 6.34L4.93 4.93"/></svg>
    <span>Ajustes</span>
  </div>
</div>
```

CSS:
```css
.bottom-nav {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 8px 12px 24px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-light);
}
/* ... full CSS ... */
```

### Top Bar
[Same format...]
```

This reference becomes your ONLY source of truth when building screens.
