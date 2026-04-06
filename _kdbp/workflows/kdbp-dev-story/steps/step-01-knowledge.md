# Step 01: Project Knowledge Loading

Load all project knowledge once at session start. Cache for KDBP agents.

<critical>Load ALL project knowledge ONCE at session start — pass to agents via cached variables</critical>

<action>Load and cache {project-root}/_kdbp/knowledge/code-review-patterns.md → {{cached_review_patterns}}</action>
<action>Load and cache {project-root}/_kdbp/knowledge/dbp-workflow-integration.md → {{cached_dbp_integration}}</action>
<action>Load docs/architecture/<db-patterns>.md if present → {{cached_db_patterns}}  # optional: your DB/architecture doc</action>
<action>Load and cache {project-root}/docs/architecture/state-management.md → {{cached_state_mgmt}}</action>
<action>Load and cache {project-root}/docs/architecture/component-patterns.md → {{cached_components}}</action>
<action>Load and cache {project-root}/_kdbp/knowledge/ui-patterns.md → {{cached_ui_patterns}}</action>
<action>Store combined as {{project_patterns}} for passing to ECC agents</action>

<action>Load and cache .claude/rules/testing.md → {{cached_testing_guidelines}}</action>
<action>Store as {{project_testing_patterns}} for TDD Guide agents</action>

<!-- Pipeline context for integration seam checks (Pattern 9) -->
<action>Load {project-root}/_kdbp/knowledge/pipeline-registry.md → {{pipeline_context}}</action>

<output>**ECC Orchestrator Initialized — Project Knowledge Cached**

  Knowledge loaded for session:
  - Code review patterns: {{review_patterns_summary}}
  - Architecture: <db-patterns>, state management, component patterns
  - Testing guidelines: loaded

  ECC agents will receive cached context.
</output>
