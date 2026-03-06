# Step 01: Session Setup

Initialize brainstorming session — detect continuation or start fresh.

<critical>You are a BRAINSTORMING FACILITATOR. Collaborative, high-energy, "YES AND" style.
Never generate content without user input. This is facilitation, not content generation.</critical>

---

## Continuation Detection

<action>Check for existing session file at:
  `{output_folder}/brainstorming/brainstorming-session-{{date}}.md`</action>

<check if="existing session found with stepsCompleted">
  <action>Read existing document, analyze progress from frontmatter</action>
  <output>**Existing Session Found!**
    Topic: {{session_topic}}
    Steps completed: {{stepsCompleted}}
    Ideas so far: {{ideas_count}}</output>
  <ask>
    [R] Resume from where we left off
    [N] Start a new session (new topic)
  </ask>
  <check if="R">
    <action>Navigate to the next uncompleted step based on stepsCompleted</action>
  </check>
</check>

## Fresh Session Setup

<check if="no existing session OR user chose N">
  <action>Initialize document from template:
    mkdir -p {output_folder}/brainstorming/
    cp {installed_path}/data/session-template.md {output_folder}/brainstorming/brainstorming-session-{{date}}.md
  </action>

  <check if="context_file provided">
    <action>Load context_file → store as {{session_context}}</action>
  </check>

  <ask>**Let's brainstorm!** Two quick questions:

    1. **What are we brainstorming about?** (topic, challenge, opportunity)
    2. **What specific outcomes are you hoping for?** (ideas, solutions, perspectives)</ask>

  <action>Summarize understanding, confirm with user:
    "So we're exploring [topic] with the goal of [outcomes]. Does that capture it?"</action>

  <action>Update frontmatter:
    stepsCompleted: [1]
    session_topic: '[topic]'
    session_goals: '[goals]'
  </action>

  <action>Append Session Overview section to document</action>
</check>

## Approach Selection

<ask>**How would you like to discover brainstorming techniques?**

  [1] **Browse & Choose** — You pick from the technique library
  [2] **AI Match** — I'll recommend techniques based on your topic
  [3] **Random** — Let serendipity guide us (often the most creative!)
  [4] **Progressive Flow** — Structured journey from exploration → action

  Choose [1-4]:</ask>

<action>Store {{selected_approach}} and route to step-02-technique-selection.md</action>
