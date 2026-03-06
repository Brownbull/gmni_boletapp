# Step 03: Starter Template Evaluation

Discover technical preferences and evaluate starter template options.

<critical>VERIFY CURRENT VERSIONS via web search — never hardcode versions.
Present options adapted to {{user_skill_level}}.</critical>

---

## Technical Preferences Discovery

<check if="existing preferences in project context">
  <action>Extract and confirm existing technical preferences</action>
</check>

<check if="no existing preferences">
  <ask>**Quick technical preferences:**
    1. **Languages:** TypeScript, Python, Go, Rust, other?
    2. **Frameworks:** Any preference or starting fresh?
    3. **Database:** PostgreSQL, MongoDB, MySQL, Firebase, other?
    4. **Cloud provider:** AWS, GCP, Azure, Vercel, other?
    5. **Experience level** with chosen stack: beginner/intermediate/expert</ask>
</check>

## Technology Domain Identification

<action>Load {installed_path}/data/project-types.csv for project type detection.
  Identify primary domain:
  - Web application → Next.js, Vite, Remix
  - Mobile app → React Native, Expo, Flutter
  - API/Backend → NestJS, Express, Fastify
  - CLI tool, Full-stack, Desktop</action>

## Starter Template Investigation

<action>Web search for current top starter templates in identified domain.
  MANDATORY: verify current versions and CLI commands via web search.
  For each option, analyze:
  - Technology decisions provided
  - Architectural patterns included
  - Development experience features
  - Community/maintenance status</action>

## Present Options

<output>**Starter Template Options:**
  {{starter_options_table}}

  **Recommended:** {{recommended_starter}} — {{recommendation_reason}}</output>

<ask>Which starter template works for you?
  [A] Advanced Elicitation (explore trade-offs deeper)
  [P] Party Mode (debate the options)
  [C] Continue with selection</ask>

## Record Decision

<action>Append "## Starter Template Evaluation" section to architecture document:
  - Primary Technology Domain
  - Starter Options Considered
  - Selected Starter
  - Architectural Decisions Provided by Starter (language, styling, build, testing, etc.)
  Update stepsCompleted: [1, 2, 3]</action>
