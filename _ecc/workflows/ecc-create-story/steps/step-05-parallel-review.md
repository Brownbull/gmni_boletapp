# Step 05: Parallel Technical Review + Dependency Notes

COMPLEX only: spawn database-reviewer and/or security-reviewer in parallel.
Also handles cross-cutting dependency notes for all classifications.

<step n="4" goal="Optional parallel technical review for COMPLEX stories + dependency notes">

  <check if="{{classification}} != 'COMPLEX'">
    <action>Set {{technical_notes}} = "No specialized technical review required"</action>
    <output>**{{classification}} classification** — skipping parallel technical review</output>
  </check>

  <check if="{{classification}} == 'COMPLEX' AND ('database-reviewer' in {{pipeline_agents}} OR 'security-reviewer' in {{pipeline_agents}})">
    <parallel-execution-rule>
      If BOTH database-reviewer AND security-reviewer are needed,
      you MUST issue BOTH Task tool invocations in your NEXT SINGLE RESPONSE.
    </parallel-execution-rule>

    <output>**Spawning Parallel Technical Reviewers...**
      Story involves specialized areas — running additional analysis.</output>

    <ecc-parallel-spawn>
      <task-call id="db_review" condition="'database-reviewer' in {{pipeline_agents}}">
        subagent_type: "everything-claude-code:database-reviewer"
        model: "sonnet"
        max_turns: 3
        description: "Database analysis for {{story_key}}"
        prompt: |
          Analyze database requirements for story: {{story_key}}
          **Architect Design:** {{architect_design}}
          **IMPORTANT: Do NOT read files yourself. Use provided context only.**
          **Check:** Schema design, index requirements, query optimization, security rules
          **Output (max 40 lines):** Database considerations for Dev Notes
          ---
          **CODEBASE CONTEXT:** {{codebase_context}}
      </task-call>

      <task-call id="security_review" condition="'security-reviewer' in {{pipeline_agents}}">
        subagent_type: "everything-claude-code:security-reviewer"
        model: "sonnet"
        max_turns: 3
        description: "Security analysis for {{story_key}}"
        prompt: |
          Analyze security requirements for story: {{story_key}}
          **Requirements:** {{story_requirements}}
          **IMPORTANT: Do NOT read files yourself. Use provided context only.**
          **Check:** Authentication, authorization, input validation, security testing
          **Output (max 40 lines):** Security considerations for Dev Notes
          ---
          **CODEBASE CONTEXT:** {{codebase_context}}
      </task-call>
    </ecc-parallel-spawn>

    <action>Merge technical review outputs into {{technical_notes}}</action>
  </check>

  <!-- Dependency notes (all classifications) -->
  <action>From architect output (or orchestrator analysis), extract any cross-feature dependencies</action>
  <action>Add DEPENDS tags to story if it touches shared modules</action>
  <action>If story has significant cross-cutting impact, recommend running `ecc-impact-analysis` after story creation</action>
</step>
