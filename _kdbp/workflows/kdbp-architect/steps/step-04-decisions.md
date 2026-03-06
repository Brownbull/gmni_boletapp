# Step 04: Core Architectural Decisions

Facilitate collaborative architectural decision making across 5 categories.

<critical>Review what's ALREADY decided by starter template — don't re-decide.
Verify technology versions via web search. Record rationale for every decision.</critical>

---

## Decision Inventory

<action>Review starter template decisions from Step 03.
  Identify REMAINING critical decisions (skip what's already determined).
  Organize by priority:
  - **Critical** (block implementation)
  - **Important** (shape architecture)
  - **Deferrable** (post-MVP)</action>

## Decision Categories

<action>For each remaining category, present options + trade-offs, get user input:

  **1. Data Architecture:**
  - Database choice + modeling approach
  - Validation strategy (Zod, Yup, etc.)
  - Migration strategy
  - Caching approach

  **2. Authentication & Security:**
  - Auth method (OAuth, JWT, session, etc.)
  - Authorization model (RBAC, ABAC)
  - API security (rate limiting, CORS)

  **3. API & Communication:**
  - REST vs GraphQL vs tRPC
  - Error handling patterns
  - Real-time (WebSocket, SSE, polling)

  **4. Frontend Architecture:**
  - State management (Redux, Zustand, Context, etc.)
  - Component patterns (atomic, feature-based)
  - Routing strategy
  - Performance (lazy loading, ISR, etc.)

  **5. Infrastructure & Deployment:**
  - Hosting (Vercel, AWS, GCP, Railway)
  - CI/CD pipeline
  - Environment management
  - Monitoring + observability
</action>

## Per-Decision Flow

<action>For each decision:
  1. Present 2-3 options with trade-offs
  2. Get user input (or make recommendation at {{user_skill_level}})
  3. Handle cascading implications
  4. Record decision + rationale
</action>

<ask>After all decisions:
  [A] Advanced Elicitation (explore specific decision deeper)
  [P] Party Mode (stress-test decisions)
  [C] Continue to implementation patterns</ask>

<action>Append "## Core Architectural Decisions" section to architecture document.
  Include: Decision Priority Analysis + all 5 categories + Decision Impact Analysis.
  Update stepsCompleted: [1, 2, 3, 4]</action>
