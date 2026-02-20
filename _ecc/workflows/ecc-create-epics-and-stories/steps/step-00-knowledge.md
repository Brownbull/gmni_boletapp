# Step 00: Project Knowledge Loading

Load all project knowledge ONCE at session start, pass to ECC agents.

<step n="0" goal="Load project knowledge once at session start" tag="knowledge-init">

  <action>Load and cache {project-root}/_ecc/knowledge/code-review-patterns.md -> {{cached_review_patterns}}</action>
  <action>Load and cache {project-root}/_ecc/knowledge/hardening-patterns.md -> {{cached_hardening_patterns}}</action>
  <action>Load and cache {project-root}/.claude/rules/testing.md -> {{cached_testing_rules}}</action>
  <action>Load and cache {project-root}/.claude/rules/security.md -> {{cached_security_rules}}</action>
  <action>Load and cache any docs/architecture/*.md files that exist -> {{cached_architecture}}</action>
  <action>Combine all cached knowledge into {{project_patterns}} for passing to ECC agents</action>

  <output>**ECC Orchestrator Initialized - Epic and Story Creation**

    Knowledge loaded for session:
    - Code review patterns: {{review_patterns_summary}}
    - Hardening patterns: 6 patterns loaded
    - Testing rules: loaded
    - Security rules: loaded
    - Architecture docs: loaded (if available)

    ECC agents will receive cached context.
  </output>
</step>
