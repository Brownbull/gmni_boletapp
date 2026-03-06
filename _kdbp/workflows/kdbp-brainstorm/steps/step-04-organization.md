# Step 04: Idea Organization & Action Planning

Convert ideation chaos into organized, actionable outcomes.

<critical>You are an IDEA SYNTHESIZER. Organize systematically. Facilitate convergent thinking.
FORBIDDEN: completing workflow without action planning.</critical>

---

## Review Creative Output

<action>Celebrate achievement: "{{ideas_count}} ideas across {{techniques_count}} techniques!"
  List totals, techniques used, session focus.</action>

## Theme Identification

<action>Analyze all ideas to identify natural themes:
  - Theme 1: [Focus] — Ideas: [...] — Pattern Insight: [...]
  - Theme 2: [Focus] — Ideas: [...] — Pattern Insight: [...]
  - Theme 3: [Focus] — Ideas: [...] — Pattern Insight: [...]
  - Cross-cutting ideas, breakthrough concepts, implementation-ready items
</action>

<output>**Organized Themes:**
  {{themes_display}}
</output>

<ask>Which themes or specific ideas stand out as most valuable?</ask>

## Prioritization

<action>Facilitate quick prioritization exercise:
  **Criteria:** Impact | Feasibility | Innovation | Alignment

  Ask user to identify:
  1. Top 3 High-Impact Ideas
  2. Easiest Quick Wins
  3. Most Innovative Approaches
</action>

## Action Plans

<action>For each top-priority idea, develop:
  - **Immediate Next Steps** (this week)
  - **Resource Requirements**
  - **Potential Obstacles**
  - **Success Metrics**

  Format per idea:
  **Idea:** [name]
  **Why It Matters:** [impact]
  **Next Steps:** 1. [...] 2. [...] 3. [...]
  **Resources:** [needs]
  **Timeline:** [estimate]
  **Success Indicators:** [measurable outcomes]
</action>

## Session Documentation

<action>Compile final session document:
  1. Session Overview (context, goals, approach)
  2. Complete Idea Inventory (all concepts by theme)
  3. Prioritization Results (top ideas + rationale)
  4. Action Plans (concrete next steps)
  5. Session Insights (key learnings + breakthroughs)
</action>

<output>**Session Complete!**
  {{ideas_count}} ideas → {{themes_count}} themes → {{priority_count}} prioritized → {{action_count}} action plans

  Session document: {output_folder}/brainstorming/brainstorming-session-{{date}}.md</output>

## Completion

<action>Update frontmatter:
  stepsCompleted: [1, 2, 3, 4]
  session_active: false
  workflow_completed: true
</action>

<ask>[C] Complete session | [E] Explore more ideas | [D] Deep dive on specific action plan</ask>
