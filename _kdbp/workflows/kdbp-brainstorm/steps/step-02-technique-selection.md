# Step 02: Technique Selection

Load techniques from library and facilitate selection based on user's chosen approach.

<critical>Load techniques on-demand from {installed_path}/data/brain-methods.csv.
62 techniques across 10 categories. Present adapted to {{selected_approach}}.</critical>

---

## Load Technique Library

<action>Read {installed_path}/data/brain-methods.csv → {{techniques_library}}
  Parse: category, technique_name, description, prompts, best_for, energy_level, duration</action>

## Route by Approach

<check if="{{selected_approach}} == 1 (Browse & Choose)">
  <action>Present technique categories (10 categories from CSV) with brief descriptions</action>
  <ask>Select a category [1-10] to browse techniques:</ask>
  <action>Show 3-5 techniques from selected category: Name, Duration, Energy, Description</action>
  <ask>Select technique(s) by name/number. Options: [Details] [Categories] [Back]</ask>
  <action>Confirm selection, explain session plan</action>
</check>

<check if="{{selected_approach}} == 2 (AI Match)">
  <action>Analyze session context for technique matching:
    - Goal type: Innovation → creative/wild | Problem-solving → deep/structured | Team → collaborative
    - Complexity: Complex → deep/structured | Familiar → creative/wild
    - Time: <30min → 1-2 focused | 30-60min → 2-3 complementary | >60min → multi-phase
  </action>
  <action>Generate 3-phase recommendation:
    Phase 1: Foundation Setting (1 technique)
    Phase 2: Idea Generation (1 technique)
    Phase 3: Refinement (1 technique, if time allows)
    Include "Why this fits" for each</action>
  <ask>Does this approach work? [C] Continue | [Modify] | [Details] | [Back]</ask>
</check>

<check if="{{selected_approach}} == 3 (Random)">
  <action>Randomly select 3 techniques from DIFFERENT categories for variety.
    Ensure no conflicts. Present with enthusiasm:
    Phase 1: Exploration — {{random_technique_1}}
    Phase 2: Connection — {{random_technique_2}}
    Phase 3: Synthesis — {{random_technique_3}}</action>
  <ask>[C] Continue | [Shuffle] new combination | [Details] | [Back]</ask>
</check>

<check if="{{selected_approach}} == 4 (Progressive Flow)">
  <action>Design 4-phase creative journey:
    Phase 1: EXPANSIVE EXPLORATION (divergent) → creative/wild technique
    Phase 2: PATTERN RECOGNITION (analytical) → deep/structured technique
    Phase 3: IDEA DEVELOPMENT (convergent) → structured/collaborative technique
    Phase 4: ACTION PLANNING (implementation) → structured/analytical technique
    Show timing, energy levels, and transitions</action>
  <ask>Journey map ready. [C] Continue | [Modify] phases | [Back]</ask>
</check>

## Confirm and Proceed

<action>Update frontmatter:
  selected_approach: '{{approach_name}}'
  techniques_used: [{{selected_techniques}}]
  stepsCompleted: [1, 2]
</action>

<action>Append technique selection section to session document</action>
<action>Continue to step-03-technique-execution.md</action>
