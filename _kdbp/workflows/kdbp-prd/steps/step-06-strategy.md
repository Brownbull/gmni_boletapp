# Step 06: Project-Type Requirements & Scoping

Deep-dive into project-type specific needs and define MVP boundaries.

<critical>Two strategic planning activities:
1. CSV-driven project-type discovery (required_sections, key_questions)
2. Scoping exercise (MVP boundaries, phased delivery, risk-based prioritization)
Both feed into the functional requirements step.</critical>

---

## Project-Type Deep Dive

<action>Load project-type configuration from `{installed_path}/data/project-types.csv`.
  Match against classification from Step 02.

  **For the detected project type:**
  - Ask the `key_questions` defined in CSV
  - Generate `required_sections` content based on answers
  - Skip `skip_sections` as defined

  Adapt discovery to project context:
  - Web app → deployment, SEO, browser support
  - API → versioning, documentation, rate limiting
  - Mobile → app store, offline, push notifications
  - SaaS → multi-tenancy, billing, onboarding</action>

## Scoping Exercise

<action>Synthesize everything so far into scoping decisions:

  **Assess scope complexity** from vision + success + journeys.

  **MVP Strategy** — which approach fits best?
  - Problem-solving: Solve one problem perfectly
  - Experience: Deliver one delightful experience
  - Platform: Build the minimum viable platform
  - Revenue: Prove willingness to pay

  **Must-Have vs. Nice-to-Have Analysis:**
  - Must-have: without this, product doesn't work
  - Should-have: significantly improves experience
  - Could-have: nice but not essential for launch
  - Won't-have (yet): explicitly deferred

  **Phased Delivery:**
  - Phase 1 (MVP): prove the concept
  - Phase 2 (Growth): competitive features
  - Phase 3 (Expansion): vision features

  **Risk-Based Scoping:**
  - Technical risks → prototype early
  - Market risks → validate with MVP
  - Resource risks → prioritize ruthlessly</action>

<ask>
  [A] Advanced Elicitation (explore scoping trade-offs)
  [P] Party Mode (challenge priorities)
  [C] Continue to functional requirements</ask>

<action>Append two sections:
  "## [Project Type] Specific Requirements" — answers to key questions
  "## Project Scoping & Phased Development" — MVP strategy, feature
    prioritization, phased delivery, risk mitigation
  Update stepsCompleted: [1, 2, 3, 4, 5, 6]</action>
