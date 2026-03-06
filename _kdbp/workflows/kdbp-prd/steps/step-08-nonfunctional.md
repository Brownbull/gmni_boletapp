# Step 08: Non-Functional Requirements

Define quality attributes — performance, security, scalability, accessibility.

<critical>SELECTIVE by relevance. Not every NFR category applies to every project.
Use project classification and domain to determine which categories matter.
Keep NFRs measurable: "response time < 200ms" not "fast".</critical>

---

## Category Selection

<action>Based on project classification and domain, determine relevant categories:

  **Always relevant:**
  - Performance (response times, throughput)
  - Security (authentication, authorization, data protection)

  **Conditional:**
  - Scalability — if growth projections are significant
  - Accessibility — if public-facing (WCAG level)
  - Reliability — if uptime is critical (SLA targets)
  - Integration — if connecting to external systems
  - Compliance — if regulated domain (overlap with domain requirements)
  - Internationalization — if multi-language/multi-region

  Skip categories that don't apply. Announce which you'll cover and why.</action>

## NFR Definition

<action>For each relevant category, define measurable requirements:

  **Performance:**
  - Page load time targets
  - API response time targets
  - Concurrent user capacity
  - Data processing throughput

  **Security:**
  - Authentication requirements
  - Authorization model
  - Data encryption (at rest, in transit)
  - API security (rate limiting, input validation)

  **Scalability:**
  - Expected growth trajectory
  - Horizontal vs. vertical scaling needs
  - Database scaling strategy

  **Accessibility:**
  - WCAG compliance level (A, AA, AAA)
  - Screen reader compatibility
  - Keyboard navigation
  - Color contrast requirements

  Per NFR: specific, measurable, testable.
  Format: `NFR#: [Category] — [Specific measurable requirement]`</action>

<ask>
  [A] Advanced Elicitation (explore edge cases)
  [P] Party Mode (challenge NFR priorities)
  [C] Continue to polish & completion</ask>

<action>Append "## Non-Functional Requirements" organized by category.
  Each category has sequential NFR numbers.
  Update stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]</action>
