# Step 04: Cross-Epic Hardening Analysis

Runs ONCE after all epics are processed. Analyzes the full story set for cross-cutting concerns.

<step n="4" goal="Analyze full story set for cross-epic concerns" tag="cross-epic-analysis">

  <output>**Running Cross-Epic Hardening Analysis...**</output>

  <ecc-spawn agent="architect">
    <task-call>
      subagent_type: "everything-claude-code:architect"
      model: "opus"
      description: "Cross-epic hardening analysis"
      prompt: |
        ## Cross-Epic Hardening Analysis

        **All Epics and Stories:** {{all_stories_summary}}
        **Hardening Patterns Applied Per Story:** {{hardening_applied_summary}}

        ## Task
        Analyze the complete story set across ALL epics for cross-cutting concerns:

        1. **Schema Evolution** — do later epics modify schemas created in earlier epics?
           - If yes: flag migration story needed
           - Check: Zod schemas, Firestore collections, YAML schema versions

        2. **Shared Infrastructure** — do multiple epics need the same:
           - Test fixtures, mock patterns, or test utilities?
           - Shared UI components (error boundaries, loading states)?
           - Common services (logging, analytics, error reporting)?
           - If yes: recommend a shared infrastructure story in the earliest relevant epic

        3. **Performance Accumulation** — does the combined feature set create:
           - Bundle size concerns (many new dependencies)?
           - Render performance bottlenecks?
           - Data loading waterfall issues?

        4. **Security Surface Growth** — does the cumulative attack surface require:
           - Additional input validation beyond individual stories?
           - Rate limiting on new user-facing endpoints?
           - Content Security Policy updates?

        5. **Production Logging Consistency** — is error reporting consistent across epics?

        ## Required Output
        ```
        CROSS-EPIC FINDINGS:
        - Finding 1: {description}
          Action: {new story or modify existing}
          Epic: {which epic to add it to}

        ADDITIONAL STORIES RECOMMENDED: {count}
        {list with titles and rationale}

        NO ISSUES FOUND: {list of categories with no concerns}
        ```
    </task-call>
  </ecc-spawn>

  <action>Collect output as {{cross_epic_findings}}</action>

  <check if="additional stories recommended">
    <output>**Cross-Epic Analysis Found {{additional_story_count}} Additional Stories:**
      {{cross_epic_findings_summary}}</output>
    <action>Generate story files for additional stories (same process as Step 3d)</action>
    <action>Append to relevant epic sections in {{epics_file}}</action>
  </check>

  <check if="no additional stories needed">
    <output>**Cross-Epic Analysis: No Additional Stories Needed**
      All cross-cutting concerns are covered by existing stories.</output>
  </check>
</step>
