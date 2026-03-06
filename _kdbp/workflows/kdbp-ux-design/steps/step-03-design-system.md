# Step 03: Design System & Visual Foundation

Choose design system, define core interaction mechanics, and establish visual tokens.

<critical>Three interdependent decisions: system choice → interaction design → visual tokens.
Each decision constrains the next. Present all three before A/P/C.</critical>

---

## Design System Choice

<action>Present 3 approaches adapted to project context:

  **1. Custom Design System** — complete uniqueness, higher investment
  **2. Established System** (Material Design, Ant Design) — fast, proven, less unique
  **3. Themeable System** (MUI, Chakra, Tailwind) — customizable + proven foundation

  **Decision factors:** speed vs. uniqueness, brand requirements, team expertise,
  timeline, maintenance needs.

  Guide user to decision with rationale.</action>

## Defining Core Experience

<action>Define THE interaction that makes the product special.

  **Famous examples:** Tinder=swipe, Snapchat=disappearing, Spotify=instant play

  Explore:
  - User's mental model — how do they currently solve this?
  - Novel vs. established patterns — innovate or use proven UX?
  - If novel: what familiar metaphors can teach it?

  **Experience Mechanics:**
  1. **Initiation** — how does the user start?
  2. **Interaction** — what do they actually do?
  3. **Feedback** — how do they know it's working?
  4. **Completion** — how do they know they're done?</action>

## Visual Foundation

<action>Establish visual design tokens:

  **Color System:**
  - Check for existing brand guidelines
  - If none: generate color theme visualizer HTML at
    `{planning_artifacts}/ux-color-themes.html`
  - Define semantic mapping: primary, secondary, success, warning, error
  - Verify accessibility contrast ratios

  **Typography System:**
  - Choose primary/secondary typefaces
  - Establish type scale (h1–body), line heights
  - Consider readability + accessibility

  **Spacing & Layout:**
  - Base spacing unit (4px, 8px, 12px?)
  - Grid system (columns, gutters)
  - Density approach (dense/airy)</action>

<ask>
  [A] Advanced Elicitation (explore trade-offs)
  [P] Party Mode (challenge visual choices)
  [C] Continue to design directions</ask>

<action>Append three sections to document:
  "## Design System Foundation" — choice, rationale, implementation, customization
  "## Core User Experience (Detail)" — defining experience, mental model,
    success criteria, novel patterns, experience mechanics
  "## Visual Design Foundation" — color system, typography, spacing, accessibility
  Update stepsCompleted: [1, 2, 3]</action>
