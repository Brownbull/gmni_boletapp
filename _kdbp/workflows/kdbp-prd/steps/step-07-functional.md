# Step 07: Functional Requirements Synthesis

Synthesize ALL discovery into the capability contract.

<critical>THIS IS THE CAPABILITY CONTRACT FOR ALL DOWNSTREAM WORK.
- UX designers ONLY design what's listed here
- Architects ONLY support what's listed here
- Epics ONLY implement what's listed here
If a capability is missing, it will NOT exist in the final product.</critical>

---

## Capability Extraction

<action>Review ALL previous sections to extract capabilities:

  - Executive Summary → core differentiator capabilities
  - Success Criteria → success-enabling capabilities
  - User Journeys → journey-revealed capabilities
  - Domain Requirements → compliance capabilities (if applicable)
  - Innovation Analysis → innovative feature capabilities (if applicable)
  - Project-Type Requirements → technical capability needs
  - Scoping → MVP vs. post-MVP classification</action>

## FR Generation

<action>Organize by capability area (NOT by technology):
  - Good: "User Management" (not "Authentication System")
  - Good: "Content Discovery" (not "Search Algorithm")
  Target 5-8 capability areas, 20-50 FRs total.

  **Format per FR:**
  `FR#: [Actor] can [capability] [context/constraint]`

  **Altitude Check — each FR must be:**
  - WHAT capability exists, not HOW it's implemented
  - Testable: someone could verify it exists
  - Implementation-agnostic: could be built 5 different ways
  - No UI details, no performance numbers, no technology choices</action>

## Self-Validation

<action>Before presenting, validate:

  **Completeness:**
  - Did I cover EVERY MVP capability?
  - Could a UX designer read ONLY FRs and know what to design?
  - Could an Architect read ONLY FRs and know what to support?
  - Are there discussed capabilities with no FR?

  **Quality:**
  - Is each FR clear enough to test?
  - Is each FR independent?
  - No vague terms ("good", "fast", "easy") — those go in NFRs?</action>

<ask>
  [A] Advanced Elicitation (find missing capabilities)
  [P] Party Mode (challenge FR coverage)
  [C] Continue to non-functional requirements</ask>

<action>Append "## Functional Requirements" organized by capability areas.
  Each area has sequential FR numbers.
  Update stepsCompleted: [1, 2, 3, 4, 5, 6, 7]</action>
