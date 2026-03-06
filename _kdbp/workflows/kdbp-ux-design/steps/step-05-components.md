# Step 05: Components, Patterns & Responsive Design

Define component library, UX consistency patterns, and multi-device strategy.

<critical>Three specification activities in one step:
1. Component strategy (gap analysis + custom components)
2. UX consistency patterns (buttons, feedback, forms, nav, states)
3. Responsive design + accessibility compliance
All three feed into the same implementation specification.</critical>

---

## Component Strategy

<action>Analyze design system coverage vs. product needs:

  **Gap Analysis:**
  - Components available from chosen design system
  - Components needed for the product (from user journeys)
  - Gap = custom components to design

  **For each custom component, define:**
  - Purpose and content
  - Actions and states (default, hover, active, disabled, error)
  - Variants and usage guidelines
  - Accessibility requirements

  **Implementation Roadmap:**
  Phase 1 (core): essential for MVP
  Phase 2 (supporting): enhance experience
  Phase 3 (enhancement): delight features</action>

## UX Consistency Patterns

<action>Establish patterns for common UX situations:

  **Button Hierarchy:** primary, secondary, tertiary, destructive actions
  **Feedback Patterns:** success, error, warning, info — visual + timing
  **Form Patterns:** validation approach, error display, field grouping
  **Navigation Patterns:** primary nav, breadcrumbs, back, context switching
  **Modal/Overlay Patterns:** when to use, dismissal, nested handling
  **Empty States:** first-time, no results, error states — all need design
  **Loading States:** skeleton, spinner, progressive, optimistic updates
  **Search & Filtering:** input patterns, result display, filter UI

  Per pattern: when to use, visual design, behavior, accessibility, mobile.</action>

## Responsive Design & Accessibility

<action>Define multi-device strategy:

  **Responsive Breakpoints:**
  - Mobile: 320–767px (bottom nav, single column)
  - Tablet: 768–1023px (touch-optimized, adaptive layout)
  - Desktop: 1024px+ (multi-column, side nav)

  **Adaptation Strategy per breakpoint:**
  - Navigation changes, layout reflows, content prioritization
  - Touch target sizing (44×44px minimum)

  **Accessibility Compliance:**
  - WCAG level target (A, AA, or AAA)
  - Contrast ratios, keyboard navigation, screen reader support
  - Focus indicators, color blindness considerations

  **Testing Strategy:**
  - Responsive devices + browsers
  - Accessibility tools (automated + screen readers)
  - Color blindness testing</action>

<ask>
  [A] Advanced Elicitation (explore component edge cases)
  [P] Party Mode (challenge pattern choices)
  [C] Continue to completion</ask>

<action>Append three sections to document:
  "## Component Strategy" — gap analysis, custom components, implementation roadmap
  "## UX Consistency Patterns" — all pattern categories with specifications
  "## Responsive Design & Accessibility" — responsive strategy, breakpoints,
    accessibility requirements, testing strategy
  Update stepsCompleted: [1, 2, 3, 4, 5]</action>
