# Step 04: User Journey Mapping

Map ALL user types with narrative story-based journeys.

<critical>No journey = no functional requirements = product doesn't exist.
Map EVERY human interaction with the system, not just primary users.
Minimum: 3-4 compelling narratives covering different user types.</critical>

---

## User Type Discovery

<action>Identify all users who interact with the system:

  **If input docs have personas:** Leverage existing backstories + identify gaps.
  **If not:** Guide comprehensive discovery.

  Consider beyond primary users:
  - Admin / operations
  - Moderators / support staff
  - API consumers / developers
  - Internal ops / analytics

  For each user type, establish:
  - Name and personality (make them real)
  - Situation: what creates their need?
  - Goal: what do they desperately want?
  - Obstacle: what's standing in their way?</action>

## Story-Based Journey Mapping

<action>For each user type, create narrative journey:

  **Story Structure:**
  - **Opening Scene:** Where/how do we meet them? Current pain?
  - **Rising Action:** What steps do they take? What do they discover?
  - **Climax:** Critical moment where product delivers real value
  - **Resolution:** How does their situation improve? New reality?

  Include emotional arc, specific details, clear before/after contrast.

  **For each journey, explore:**
  - What happens at each step specifically?
  - What could go wrong? Recovery path?
  - What information do they need at each point?
  - Where does this journey succeed or fail?</action>

## Journey-to-Requirements Connection

<action>After all journeys, explicitly map:
  - Each journey reveals requirements for specific capability areas
  - Different journeys create different feature sets
  - Connect journey needs to concrete capabilities

  **Minimum Coverage:**
  1. Primary user — success path (core experience)
  2. Primary user — edge case (error recovery)
  3. Admin/operations user
  4. Support/troubleshooting user
  5. API/integration user (if applicable)</action>

<ask>
  [A] Advanced Elicitation (explore missing user types)
  [P] Party Mode (challenge journey assumptions)
  [C] Continue to advanced topics</ask>

<action>Append "## User Journeys" with all narratives +
  "### Journey Requirements Summary" connecting journeys to capabilities.
  Update stepsCompleted: [1, 2, 3, 4]</action>
