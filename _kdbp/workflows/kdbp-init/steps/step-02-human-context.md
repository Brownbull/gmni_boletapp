# Step 02: Human Context Discovery

Understand the people behind and served by this project. Direct questions first, then offer
advanced elicitation to go deeper.

<critical>Values come from HUMAN context, not technical context. This step discovers the humans.</critical>
<critical>Direct questions produce surface answers. Always offer advanced elicitation [AR-13].</critical>

---

## Seed questions

<ask>I need to understand the human side of this project. Please answer what you can:

1. **Who builds this?** Solo dev? Team? What's the org like?
2. **Who uses this?** Who are the actual people this software serves?
3. **What stage are you in?** Prototype, MVP, growth, mature?
4. **What matters most about how this software serves people?**
   (Not "what features" — what would make you proud or ashamed of how it treats its users?)
5. **What's the biggest risk to the people who depend on this?**
   (Data loss? Wrong information? Wasted time? Broken trust?)
</ask>

<action>Capture answers as {{human_context_draft}}</action>

## Integrate project scan signals

<action>Combine {{human_context_draft}} with:
  - {{human_signals_from_docs}} (from Step 01)
  - {{proto_value_signals}} (from Step 01, if any)
  Present any contradictions or gaps to the user.</action>

<check if="contradictions exist between user answers and existing docs">
  <output>**I noticed some tensions:**
  {{contradiction_list}}
  These might be outdated docs or real disagreements worth exploring.</output>
</check>

## Offer advanced elicitation [AR-13]

<output>I have your initial context. We can proceed with this, or dig deeper using structured
exploration methods — Stakeholder Round Tables, First Principles Analysis, Socratic
Questioning, User Persona Focus Groups, and more (50 methods available).</output>

<ask>
**[E] Explore deeper** with advanced elicitation — structured methods to uncover hidden context
**[P] Proceed** with current context — good enough to propose values
</ask>

<check if="user chose [E] Explore deeper">
  <action>Load the advanced elicitation engine:
    Read `{collaboration.advanced_elicitation}` (the workflow.xml)
    Set elicitation context = "Discovering human values and purposes behind the {{project_name}} project.
    We know: {{human_context_draft_summary}}. We want to uncover: deeper user needs, hidden stakeholders,
    unspoken assumptions about who this software serves and what 'success' means for them."

    The engine will present 5 context-relevant methods. Let the user pick and iterate
    until they choose [x] proceed.</action>

  <action>After elicitation completes, merge insights into {{human_context_draft}}</action>
</check>

## Finalize human context

<action>Store final human context as {{human_context}}</action>

<output>**Human Context Captured**

  Builder: {{builder_summary}}
  Users served: {{users_summary}}
  What matters: {{core_concerns}}
  Biggest risk: {{risk_summary}}

  This is the raw material for value discovery. Next: naming the behavior.</output>
