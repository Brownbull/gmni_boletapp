# Step 00: Project Knowledge Loading

Load project knowledge ONCE at session start, pass to ECC agents.

<step n="0" goal="Load project knowledge for story creation context" tag="knowledge-init">

  <action>Load and cache {project-root}/_kdbp/knowledge/code-review-patterns.md -> {{cached_review_patterns}}</action>
  <action>Load and cache {project-root}/docs/architecture/firestore-patterns.md -> {{cached_firestore}}</action>
  <action>Load and cache {project-root}/docs/architecture/state-management.md -> {{cached_state_mgmt}}</action>
  <action>Load and cache {project-root}/docs/architecture/component-patterns.md -> {{cached_components}}</action>
  <action>Load and cache {project-root}/.claude/rules/testing.md -> {{cached_testing_guidelines}}</action>
  <action>Combine cached knowledge into {{project_patterns}} for ECC agents</action>

  <output>**ECC Orchestrator Initialized for Story Creation**

    Project knowledge loaded:
    - Review patterns, architecture (firestore, state, components), testing guidelines

    Ready for story identification and classification.
  </output>
</step>
