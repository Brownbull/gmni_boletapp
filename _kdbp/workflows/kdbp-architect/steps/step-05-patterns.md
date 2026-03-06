# Step 05: Implementation Patterns & Consistency Rules

Define patterns that prevent AI agent implementation conflicts.

<critical>This is the CORE PURPOSE of the architecture document.
Patterns must be specific enough that two AI agents reading them
would make the SAME implementation decision. No ambiguity.</critical>

---

## Conflict Point Identification

<action>Identify potential conflict points where agents could decide differently:

  **Naming Conflicts:**
  - Database tables, columns, indexes
  - API endpoints, query parameters
  - File/directory names, component names
  - Routes, state keys, event names

  **Structural Conflicts:**
  - Test file locations, component organization
  - Utility placement, config locations
  - Asset management, shared code

  **Format Conflicts:**
  - API response wrappers, error structures
  - Date formats, JSON naming (camelCase vs snake_case)
  - ID formats, pagination patterns

  **Communication Conflicts:**
  - Event naming conventions, payload structure
  - State management patterns, action naming
  - Logging format, metrics naming

  **Process Conflicts:**
  - Loading states, error recovery
  - Retry patterns, auth flow
  - Validation approach, form handling
</action>

## Pattern Decisions

<action>For each conflict category:
  1. Present the conflict scenario
  2. Show 2-3 options with concrete examples
  3. Get user decision
  4. Record with CORRECT and INCORRECT examples

  Format per pattern:
  **Pattern:** [name]
  **Rule:** [specific, unambiguous rule]
  **Correct:** [code example]
  **Incorrect:** [anti-pattern example]
</action>

<ask>
  [A] Advanced Elicitation (explore edge cases)
  [P] Party Mode (challenge patterns)
  [C] Continue to project structure</ask>

<action>Append "## Implementation Patterns & Consistency Rules" section.
  Include all 5 pattern categories with concrete examples + anti-patterns.
  Include Enforcement Guidelines section.
  Update stepsCompleted: [1, 2, 3, 4, 5]</action>
