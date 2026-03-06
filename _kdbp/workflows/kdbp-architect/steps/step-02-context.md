# Step 02: Project Context Analysis

Analyze loaded project documents for architectural implications.

<critical>Facilitator role — reflect understanding back to user for validation.
Extract requirements, don't invent them.</critical>

---

## Requirements Extraction

<action>From loaded input documents, extract and organize:

  **Functional Requirements (FRs):**
  - List each FR with source document reference
  - Group by feature area

  **Non-Functional Requirements (NFRs):**
  - Performance targets, scalability needs
  - Security requirements, compliance
  - Availability, reliability

  **Technical Constraints:**
  - Existing systems to integrate with
  - Platform requirements
  - Budget/resource constraints
</action>

## UX Implications (if UX Design loaded)

<check if="UX Design document loaded">
  <action>Extract architectural implications:
    - Component complexity assessment
    - Real-time update needs
    - Accessibility standards
    - Performance expectations from UI patterns
  </action>
</check>

## Epic/Story Implications (if available)

<check if="epics/stories documents loaded">
  <action>Map epic structure to potential components:
    - Cross-cutting concerns across epics
    - Acceptance criteria with architectural implications
  </action>
</check>

## Project Scale Assessment

<action>Load {installed_path}/data/domain-complexity.csv for domain signal detection.
  Assess project scale: low | medium | high | enterprise
  Based on: domain complexity, FR count, NFR stringency, integration needs</action>

## Validate Understanding

<output>**Project Context Analysis:**

  **Requirements:** {{fr_count}} FRs | {{nfr_count}} NFRs | {{constraint_count}} constraints
  **Scale:** {{project_scale}}
  **Key Cross-Cutting Concerns:** {{cross_cutting_list}}

  {{requirements_summary}}</output>

<ask>Does this accurately capture the project context?
  [A] Advanced Elicitation (explore deeper)
  [P] Party Mode (multiple perspectives)
  [C] Continue to starter evaluation</ask>

<action>Append "## Project Context Analysis" section to architecture document.
  Update stepsCompleted: [1, 2]</action>
