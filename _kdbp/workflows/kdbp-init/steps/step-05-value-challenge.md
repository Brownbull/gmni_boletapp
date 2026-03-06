# Step 05: Value Challenge

Stress-test every proposed value. Values that fail get demoted to skills (technical knowledge,
not human purpose). This is the filter that separates conviction from convention.

<critical>Every value must survive ALL challenge questions. Failed values become SKILLS, not values.</critical>
<critical>Evidence grounding [AR-5]: If you can't show 3 scenarios where this value changes a decision,
it's aspirational — not operational. Demote to skill.</critical>

---

## Challenge each value

<action>For each value in {{candidate_values}}, run these challenge questions:

### The Core Filter
1. **"Is this a VALUE or a CONVENTION?"**
   Values survive tech stack changes. "Files under 200 lines" dies when you switch languages.
   "Elderly users can track spending without confusion" survives anything.

2. **"What scenario makes this the WRONG priority?"**
   Every value has a context where it's counterproductive. If you can't name one,
   the value is too vague to be useful.

3. **"Would this survive a product pivot?"**
   If the product pivots from B2C to B2B, from mobile to web, from React to Go —
   does this value still matter? Values about PEOPLE survive pivots.
   Values about TECHNOLOGY don't.

### Evidence Grounding [AR-5]
4. **"Show me 3 recent stories, commits, or decisions where this value would have
   changed the outcome."**
   - If you can point to 3: the value is OPERATIONAL — it changes behavior.
   - If you can point to 1-2: the value is EMERGING — keep but flag.
   - If you can't point to any: the value is ASPIRATIONAL — demote to skill.

### Human Consequence Test
5. **"When this value is violated, who gets hurt and how?"**
   Name the person. Name the harm. If the answer is "code quality suffers" —
   that's a convention. If the answer is "an elderly person miscounts their
   spending and runs out of money" — that's a value.

Present each value's challenge results to the user.</action>

## Present challenge results

<output>**Value Challenge Results**

{{for each value}}
### {{value_name}}
- Convention vs. Value: {{result}}
- Wrong-priority scenario: {{scenario}}
- Survives pivot: {{yes_no_why}}
- Evidence (3 scenarios): {{evidence_count}} — {{evidence_status}}
- Human consequence: {{consequence}}
- **VERDICT: {{KEEP | DEMOTE_TO_SKILL | NEEDS_DISCUSSION}}**
{{end for}}

Values that passed: {{passed_list}}
Demoted to skills: {{demoted_list}}
Needs discussion: {{discussion_list}}</output>

## Offer advanced elicitation for stuck values [AR-13]

<check if="any values marked NEEDS_DISCUSSION">
  <output>Some values are ambiguous — hard to tell if they're values or conventions.
  We can explore deeper with structured methods.</output>

  <ask>
  **[E] Stress-test with advanced elicitation** — Challenge from Critical Perspective,
  Pre-mortem Analysis, Debate Club, What-If Scenarios
  **[D] Decide now** — you know enough to make the call
  **[S] Skip** — keep all as-is, refine later during first evolution cycle
  </ask>

  <check if="user chose [E] Stress-test with elicitation">
    <action>Load the advanced elicitation engine:
      Read `{collaboration.advanced_elicitation}` (the workflow.xml)
      Set elicitation context = "Stress-testing proposed behavioral values for {{behavior_name}}.
      Values under discussion: {{discussion_list_with_details}}.
      Challenge: Are these genuine human-purpose values or technical conventions dressed up as values?"

      The engine will present relevant methods (likely: Challenge from Critical Perspective,
      Pre-mortem Analysis, Debate Club Showdown, What If Scenarios).
      User picks and iterates until [x] proceed.</action>

    <action>After elicitation, re-evaluate each discussed value.
    Update verdicts in {{candidate_values}}.</action>
  </check>
</check>

<ask>
Review the results above.
**[C] Continue** with the surviving values
**[O] Override** — keep a demoted value anyway (your call — human authority)
</ask>

<check if="user chose [O] Override">
  <action>Ask which value to keep. Flag as "human override — evidence pending".
  Move back to {{candidate_values}} with override note.</action>
</check>

<action>Store surviving values as {{challenged_values}}.
Store demoted values as {{demoted_to_skills}}.</action>
