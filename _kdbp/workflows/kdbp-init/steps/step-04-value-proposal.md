# Step 04: Value Proposal

Propose 3-5 candidate values based on human context. Each value is a Gabe Lens Value Block
per PROTOCOL-v2 §4. Reference `{protocol_source}` §4 for the canonical Value Block format.

<critical>Values are HUMAN purposes — "serve elderly people tracking spending", NOT technical rules
like "files under 200 lines". Technical constraints belong in hooks and workflows.</critical>

<critical>Each value must answer: "What goes wrong for the PERSON served when this value is violated?"
If you can't answer that with a human consequence, it's a convention, not a value.</critical>

---

## Generate candidate values

<action>From {{human_context}}, identify 3-5 things that matter most about HOW this software
serves its users. For each, create a Value Block (PROTOCOL-v2 §4 format):

For each candidate value, produce:

┌─── VALUE BLOCK: [Value Name] ─────────────────────────┐
│                                                        │
│  THE INTENT                                            │
│  [1-2 sentences: what goes wrong for the PERSON when   │
│   this value is violated?]                             │
│                                                        │
│  THE ANALOGY                                           │
│  [Physical system mapping. What "aligned" FEELS like   │
│   vs. what "misaligned" FEELS like.]                   │
│                                                        │
│  CONSTRAINT BOX                                        │
│    IS:      [what this value IS]                       │
│    IS NOT:  [what it is NOT]                           │
│    DECIDES: [what it resolves when things conflict]    │
│                                                        │
│  ONE-LINE HANDLE                                       │
│  [5-10 words. Must survive compaction and fatigue.]    │
│                                                        │
│  ALIGNMENT TESTS                                       │
│  [2-3 questions to check if this value is being served]│
│                                                        │
│  ANALOGY LIMITS                                        │
│  [Where does this analogy break? 2-3 sentences.]       │
│                                                        │
│  EVALUATION ALTITUDE                                   │
│  [Session | Story | Epic | Project]                    │
│                                                        │
└────────────────────────────────────────────────────────┘
</action>

## Self-check before presenting

<action>For each proposed value, verify:
  1. Does it name a HUMAN consequence? (not "code quality" but "user gets wrong data")
  2. Is the analogy physical and grounded? (not abstract metaphors)
  3. Does the handle survive reading it at 2 AM after 8 hours of coding?
  4. Are the alignment tests askable about a real output?

  If any value fails these checks, revise it before presenting.</action>

## Present candidates

<output>**Proposed Values for `{{behavior_name}}`**

  Based on your human context, here are {{value_count}} candidate values.
  These are PROPOSALS — you'll challenge, edit, and curate them in the next steps.

  {{value_blocks_formatted}}

  These will be stress-tested next. Some may not survive — that's the point.</output>

<ask>
Before we stress-test, any immediate reactions?
**[C] Continue** to challenge phase
**[A] Add** another value you think is missing
**[R] Remove** one that feels wrong already
</ask>

<check if="user chose [A] Add">
  <action>Ask user to describe the value. Generate a Value Block for it.
  Add to {{candidate_values}}. Re-present.</action>
</check>

<check if="user chose [R] Remove">
  <action>Ask which to remove. Remove from {{candidate_values}}. Re-present.</action>
</check>
