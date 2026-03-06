# Step 04: Design Directions & User Journey Flows

Generate visual direction mockups and design detailed user flows.

<critical>Two visualization-heavy activities:
1. Generate HTML design direction showcase for visual exploration
2. Create Mermaid flow diagrams for each critical user journey
Both produce artifacts alongside the specification document.</critical>

---

## Design Direction Mockups

<action>Generate 6-8 design direction variations exploring:
  - Different layout approaches and information hierarchy
  - Various interaction patterns and visual weights
  - Alternative color applications from visual foundation
  - Different density and spacing approaches
  - Various navigation and component arrangements

  Create HTML showcase at `{planning_artifacts}/ux-design-directions.html`
  with interactive states, side-by-side comparison, responsive demos.</action>

<action>Guide evaluation:
  - **Layout Intuitiveness** — which hierarchy matches priorities?
  - **Interaction Style** — which fits core experience?
  - **Visual Weight** — which density feels right?
  - **Navigation Approach** — which matches user expectations?
  - **Brand Alignment** — which supports emotional goals?

  Help user choose, combine elements, or iterate on a base direction.
  Document: chosen direction, key elements, rationale.</action>

## User Journey Flows

<action>Load user journeys from PRD (if available) as foundation.
  Identify critical journeys that need detailed flow design.

  For each critical journey:
  1. Define entry point and trigger
  2. Map information needs at each step
  3. Identify decision points and branches
  4. Design success and failure paths
  5. Plan error recovery mechanisms

  Create Mermaid flow diagrams showing complete journey mechanics.</action>

<action>Optimize flows:
  - Minimize steps to value
  - Reduce cognitive load at decision points
  - Provide clear feedback and progress indicators
  - Handle edge cases gracefully

  Extract common journey patterns (navigation, decision, feedback).</action>

<ask>
  [A] Advanced Elicitation (explore flow edge cases)
  [P] Party Mode (challenge design choices)
  [C] Continue to components</ask>

<action>Append two sections to document:
  "## Design Direction Decision" — directions explored, chosen direction,
    design rationale, implementation approach
  "## User Journey Flows" — journey flows with Mermaid diagrams,
    journey patterns, flow optimization principles
  Update stepsCompleted: [1, 2, 3, 4]</action>
