# Step 05: Domain Requirements & Innovation Analysis

Explore domain-specific constraints and innovative aspects of the product.

<critical>BOTH SECTIONS ARE CONDITIONAL:
- Domain requirements: skip if complexity=LOW and no compliance concerns
- Innovation analysis: skip if no genuine innovation signals detected
If both skip → auto-proceed to Step 06 with brief note.</critical>

---

## Entry Gate

<action>Check classification from Step 02 frontmatter:
  - If complexity=LOW AND no compliance requirements → offer skip for Domain
  - Scan conversation history for innovation signals → offer skip if none found

  If both blocks would skip:
  "No domain-specific requirements or innovation patterns detected.
  [S] Skip to Strategy & Scope | [D] Explore anyway"
  If user selects S → update stepsCompleted and proceed to Step 06.</action>

## Domain Requirements (if complexity not LOW)

<action>Load domain data from `{installed_path}/data/domain-complexity.csv`
  for the detected domain. Explore:

  **Compliance & Regulatory:**
  - What regulations apply? (HIPAA, GDPR, PCI-DSS, SOC2, etc.)
  - Certification requirements?
  - Audit trail needs?

  **Technical Constraints:**
  - Data residency requirements?
  - Integration with existing systems?
  - Performance constraints specific to domain?

  **Risk Mitigation:**
  - What domain-specific risks must be addressed?
  - Liability considerations?
  - Data sensitivity classifications?</action>

## Innovation Analysis (if signals detected)

<action>Check for innovation signals (from conversation + project-types.csv):
  - Novel interaction patterns or approaches
  - AI/ML integration points
  - New market category creation
  - Unusual technology combinations

  If detected, explore:
  - What specifically is innovative?
  - Market context — is this truly novel or well-timed?
  - Validation approach — how to prove it works?
  - Risk mitigation — what if the innovation doesn't land?</action>

<ask>
  [A] Advanced Elicitation (explore domain edge cases)
  [P] Party Mode (challenge innovation claims)
  [C] Continue to strategy & scope</ask>

<action>Append sections as applicable:
  "## Domain Requirements" (if explored) — compliance, constraints, risks
  "## Innovation Analysis" (if explored) — areas, context, validation, risks
  Update stepsCompleted: [1, 2, 3, 4, 5]</action>
