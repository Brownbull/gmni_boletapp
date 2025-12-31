---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/ux-design-specification.md
  - docs/sprint-artifacts/sprint-status.yaml
  - docs/sprint-artifacts/epic10-11-retro-2025-12-22.md
  - docs/uxui/research/good habits.md
  - docs/uxui/research/habits loops.md
  - docs/uxui/research/animated data visualization.md
  - docs/uxui/research/reddit_post.md
  - docs/uxui/research/some ui options.md
  - docs/uxui/research/options for trends.md
  - docs/uxui/research/screen adapt.md
session_topic: 'Epic 13 Expansion: Full Application UX Redesign - From Reactive to Alive'
session_goals:
  - Define the complete Epic 13 scope with expanded application-wide focus
  - Document critical user use cases for E2E testing with Claude Code Chrome extension
  - Establish positive feedback loops and habit-forming patterns
  - Plan mockup-first workflow before implementation
  - Revise upcoming epics roadmap as needed
selected_approach: 'progressive-flow'
techniques_used:
  - 'Phase 1: Role Playing + What If Scenarios'
  - 'Phase 2: Mind Mapping + Ecosystem Thinking'
  - 'Phase 3: SCAMPER + Trait Transfer'
  - 'Phase 4: Decision Tree Mapping + Resource Constraints'
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Gabe
**Date:** 2025-12-22

## Session Overview

**Topic:** Epic 13 Expansion - Full Application UX Redesign

**Goals:**
1. Complete Epic 13 story list with expanded whole-app scope
2. Critical use cases documented for E2E testing
3. UX principles and feedback loop patterns defined
4. Mockup-first workflow established
5. Revise epic roadmap as needed

### Context Guidance

The session builds on:
- **Epic 10/10a/11 retrospective** highlighting the transformation from "static" to "proactive" app
- **Extensive UX research** on habits, feedback loops, ethical animations, and Latin American design patterns
- **Existing Insight Engine** with 13 generators, phase-based selection, and hybrid storage
- **Current infrastructure** for animations, drill-down navigation, and PWA viewport handling

### Session Setup

**Core Transformation Goal:** From "reactive data entry tool" to "alive financial awareness companion"

**Key Insight from Gabe:**
> "The user needs to drill down every section, explore by himself. This is good for power users, but what we want is that the application gives us more information than what we expect. We have already the nuggets - we can go further and make the person feel that it's not only updating information like in Excel, but actually having someone on the other side who is tracking behavior, detecting patterns, and helping spend less."

**The Vision:**
- App proactively surfaces information user didn't know to ask for
- Radar/octagon charts comparing expected vs actual spending by category
- Behavioral pattern detection ("out of character" alerts)
- Positive feedback loops encouraging healthy spending habits
- Someone "on the other side" - not just a data store

---

## Phase 1: Role Playing + What If Scenarios (Complete)

### Persona Explorations

#### Persona 1: María - The Overwhelmed Parent (38, Santiago)

**Profile:** Part-time worker, manages household budget, wonders "¿Dónde se fue la plata?"

**Key Discoveries:**

1. **"Intentional or Accidental?" Framework**
   - Non-judgmental awareness: "Restaurants up 23% - birthday dinner?"
   - User decides the meaning, app just observes

2. **Dynamic Spending Polygon**
   - 3-6 sided shape based on trending categories
   - Only consistent spending categories qualify (not one-time purchases)
   - Dual versions: merchant categories + item groups

3. **Inverted Metaphor: "Expanding Lava"**
   - Inner polygon = spending (lava/contamination)
   - Outer polygon = budget (green pastures)
   - Goal: Keep lava contained, protect the green
   - Themeable skins for Chilean market (cats/dogs)

4. **Budget Proximity Alerts**
   - Thresholds: Explicit (user-set) or Learned (app suggests based on history)
   - Alert at 75%, 90%, 100% of category/week/month budgets

5. **The Boletapp Voice Principles:**
   - Observes without judging
   - Reveals opportunity
   - Invites experimentation
   - Celebrates progress
   - Normalizes setbacks

---

#### Persona 2: Diego - The Young Professional (26, Santiago)

**Profile:** Software developer, earns well but doesn't save, wants Japan trip

**Key Discoveries:**

1. **Savings GPS Concept**
   - Like Google Maps: "Arriving at your goal by [date]"
   - Real-time updates based on spending behavior
   - Shows alternate routes: "Save 10% more = arrive 2 months sooner"

2. **Custom Goals System**
   - Fully custom: name, emoji, amount, currency
   - Examples: 🗾 Japan Trip, 💻 New MacBook, 🚨 Emergency Fund
   - Default currency from user settings

3. **Income Approach: Hybrid (Option C)**
   - Default: Smart Mode (estimates from spending patterns)
   - Optional: Precision GPS Mode (add income for accuracy)
   - Income stored locally only, never uploaded

4. **Goal-Connected Insights**
   - "This week's coffee: $13,500 = 1 day further from Tokyo"
   - Trade-off visibility without judgment

---

#### Persona 3: Rosa - Abuelita (62, Valparaíso)

**Profile:** Household guardian, 40 years of paper records, grandson taught her the app

**Key Discoveries:**

1. **Respect Her Wisdom**
   - App confirms what she already knows: "Tu instinto tiene razón - todo está más caro"
   - Validates experience, doesn't lecture

2. **Simple Visual Language**
   - Arrows ↑↓→ instead of complex charts
   - "Subió harto" not "Incrementó 27%"
   - Weekly summary like her paper notebook

3. **Group-Level Trends (Within Data Model)**
   - Track item groups: Verduras, Frutas, Pescados, Carnes
   - Week-over-week comparisons
   - Same-item price change detection

4. **Rosa-Friendly Weekly Summary**
   - Simple totals with directional arrows
   - Playful guesses: "Carnes subió harto. ¿Asado familiar?"

---

#### Persona 4: Tomás - The "Out of Character" Spender (34, Concepción)

**Profile:** Disciplined accountant, 8 months of history, drifting without realizing

**Key Discoveries:**

1. **Emotional Airlock Pattern**
   - Sequence: Curiosity → Playfulness → Reveal
   - Prepares user emotionally for uncomfortable truth

2. **Step 1: Curiosity Gate**
   - "¿Sabías que el 73% de las personas subestiman cuánto gastan en delivery?"
   - Normalizes the blind spot

3. **Step 2: Playful Brace**
   - Absurdist fact: "Los pulpos tienen 3 corazones y sangre azul..."
   - "La vida es rara. Los datos también."
   - Disarms defensiveness

4. **Step 3: The Reveal**
   - "Tu Espejo Honesto" - mirror, not judge
   - "Eso es diferente para ti" - not wrong, just different
   - Options: "Fue intencional" / "No me había dado cuenta"

---

### Phase 1 Summary: Key Patterns Discovered

| Pattern | Application |
|---------|-------------|
| **Intentional or Accidental?** | All personas - non-judgmental awareness |
| **Dynamic Polygon** | Visual spending health (María, Diego) |
| **Savings GPS** | Goal tracking (Diego) |
| **Simple Language** | Accessibility (Rosa) |
| **Emotional Airlock** | Difficult insights (Tomás) |
| **Themeable Visuals** | Chilean market appeal (cats/dogs) |

---

## Phase 2: Mind Mapping + Ecosystem Thinking (Complete)

### Feature Clusters Identified

**Cluster 1: Visual Health Dashboard**
- Dynamic Spending Polygon (3-6 sides)
- Expanding Lava metaphor (inverted visual)
- Themeable skins (cats/dogs for Chilean market)
- Simple arrows ↑↓→ (accessibility)
- Budget proximity indicators

**Cluster 2: Goal & Progress System**
- Custom goals (name, emoji, amount, currency)
- Savings GPS visualization
- Hybrid income mode (Smart/Precision)
- Goal-connected insights
- Trade-off messaging

**Cluster 3: Intelligent Insights**
- "Intentional or accidental?" framework
- Out-of-character detection
- Emotional Airlock pattern
- Group-level trending
- Pattern-based reminders

**Cluster 4: Periodic Reports**
- Weekly summary (simple format)
- Monthly milestone celebrations
- Polygon progression over time
- Goal progress in reports

**Cluster 5: Voice & Emotional Design**
- Non-judgmental observation tone
- Playful language ("Subió harto")
- Celebration of progress
- Normalization of setbacks
- "Mirror not judge" framing

### Feedback Loops Identified

1. **Scan → Insight → Awareness → Behavior**
2. **Goal → Trade-off Visibility → Motivation**
3. **Pattern → Airlock → Self-Awareness**

### New Elements Added in Phase 2

**Drill-Down Filters System:**
- Time, Location, Transaction Date, Scan Date, Categories
- View-specific filter availability

**Chart Exploration:**
- Dynamic Polygon (health overview)
- Sankey Diagram (flow visualization)
- Treemap (proportional breakdown)
- Enhanced existing charts (Pie, Bar, Stacked Bar)

**Motion Design System: "Everything Breathes"**
- Navigation transitions (staggered entry)
- Screen-specific entry animations
- Settings = exception (instant load)

**New Scan Flow: Overlay Processing**
- Grayed-out edit view during processing
- Overlay shows progress + ETA
- Non-blocking (can navigate elsewhere)
- Progressive item reveal on completion
- Quick Save vs Edit path

### Epic Structure Decision: S3 (Three Epics)

| Epic | Focus | Points |
|------|-------|--------|
| **13** | Mockups & Design | ~28 |
| **14** | Core Implementation | ~45 |
| **15** | Advanced Features | ~35 |
| **Total** | | ~108 |

---

## Phase 3: SCAMPER + Trait Transfer (Complete)

### Approved Refinements

**S - Substitute (All Approved)**
- Static numbers → Animated count-up
- Text-based insights → Visual + text combo
- Linear progress bars → Curved/circular progress
- "Error" messages → "Opportunity" reframes
- Date pickers → Swipe gestures for time travel

**C - Combine (Selected)**
- Polygon + Weekly Report → Single "Health Check" view
- Insight card + Goal progress → "This affects your Japan trip"

**A - Adapt / Trait Transfer (Selected)**

From Duolingo:
- Celebration animations (confetti on savings milestones)

From Copilot Money:
- Living charts (polygon that "breathes" subtly)
- Swipe time navigation (left/right to change week/month)
- Gradient backgrounds (category colors as subtle gradients)

From Headspace:
- Progress circles (circular goal progress instead of bars)
- Session completion ("Great check-in today" after reviewing reports)
- Breathing animations (subtle pulse on polygon)

From Strava:
- Personal records ("Your lowest restaurant week in 3 months!")
- Year in review (annual spending story - future)
- Segment comparisons ("You vs. last month" overlays)
- Kudos (self-kudos: "Nice restraint this week!")

**M - Modify/Magnify (All Approved)**
- Insight cards → Larger, more visual, swipeable carousel
- Polygon → Full-screen mode for deep exploration
- Celebrations → Sound + haptics + visuals (multi-sensory)
- Weekly summary → Story format (swipeable cards like Instagram)
- Goal progress → Animated journey visualization

**P - Put to Other Uses (All Approved)**
- Insight Engine → Power the Emotional Airlock detection
- Transaction history → Feed personal records
- Category detection → Auto-suggest budget thresholds
- Scan timestamps → Detect shopping patterns (time-of-day)
- Polygon data → Generate shareable "spending personality" image

**E - Eliminate (Selected)**
- Complex chart options → Smart defaults, power user toggle
- Separate budget setup → Learned thresholds offered in-context
- Long form reports → Card-based summaries
- Settings clutter → Progressive disclosure

**R - Reverse/Rearrange (All Approved)**
- Scan → Edit → Save → **Scan → Quick Save → Edit if needed**
- View data → Get insight → **Insight first → Data supports it**
- Set goal → Track progress → **Track patterns → Suggest goal**
- Monthly budget → Track → **Track spending → Suggest monthly limits**

---

## Phase 4: Action Planning (Complete)

### Final Epic Structure

#### Epic 13: UX Design & Mockups (~34 points)

| ID | Story | Points |
|----|-------|--------|
| 13.1 | Critical Use Cases Document (E2E scenarios) | 3 |
| 13.2 | Voice & Tone Guidelines | 2 |
| 13.3 | Motion Design System Spec | 3 |
| 13.4 | Mockup: Home Dashboard (breathing polygon) | 3 |
| 13.5 | Mockup: Analytics (Sankey, Treemap exploration) | 5 |
| 13.6 | Mockup: Transaction List + Filters | 3 |
| 13.7 | Mockup: Scan Overlay Flow | 3 |
| 13.8 | Mockup: Goals + Savings GPS | 3 |
| 13.9 | Mockup: Weekly/Monthly Reports (story format) | 3 |
| 13.10 | Mockup: Insights Redesign (carousel, Airlock) | 3 |
| 13.11 | Mockup: Settings (progressive disclosure) | 2 |
| 13.12 | Design Review & Approval Gate | 1 |

#### Epic 14: Core Implementation (~48 points)

| ID | Story | Points |
|----|-------|--------|
| 14.1 | Animation Framework | 5 |
| 14.2 | Screen Transition System | 3 |
| 14.3 | Scan Overlay Flow | 5 |
| 14.4 | Quick Save Path | 3 |
| 14.5 | Dynamic Polygon Component | 5 |
| 14.6 | Polygon Dual Mode | 3 |
| 14.7 | Expanding Lava Visual | 3 |
| 14.8 | Enhanced Existing Charts | 3 |
| 14.9 | Swipe Time Navigation | 3 |
| 14.10 | Weekly Report (Story Format) | 5 |
| 14.11 | "Intentional or Accidental?" Pattern | 2 |
| 14.12 | Celebration System | 3 |
| 14.13 | Personal Records Detection | 3 |
| 14.14 | Session Completion Messaging | 2 |

#### Epic 15: Advanced Features (~46 points)

| ID | Story | Points |
|----|-------|--------|
| 15.1 | Custom Goals CRUD | 3 |
| 15.2 | Savings GPS Visualization | 5 |
| 15.3 | Hybrid Income Mode | 3 |
| 15.4 | Goal-Connected Insights | 3 |
| 15.5 | Learned Budget Thresholds | 3 |
| 15.6 | Threshold Proximity Alerts | 2 |
| 15.7 | Out-of-Character Detection | 5 |
| 15.8 | Emotional Airlock Flow | 3 |
| 15.9 | Sankey Diagram Implementation | 5 |
| 15.10 | Treemap Implementation | 5 |
| 15.11 | Monthly Milestone View | 3 |
| 15.12 | Shareable Spending Personality | 3 |
| 15.13 | Themeable Skins Infrastructure | 3 |

### Critical Use Cases (E2E Testing)

| ID | Use Case | Persona | Key Flow |
|----|----------|---------|----------|
| UC1 | First Scan Experience | New user | Scan → Progressive reveal → Quick Save → Celebration |
| UC2 | Weekly Health Check | María | Breathing polygon → Swipe story → "Intentional?" prompt |
| UC3 | Goal Progress | Diego | Check GPS → "3 days closer" → Trade-off insight |
| UC4 | Simple Summary | Rosa | Arrows ↑↓→ → "Carnes subió harto" → Confirm |
| UC5 | Out-of-Character Alert | Tomás | Airlock → Curiosity → Reveal → Response |
| UC6 | Batch Scan Session | Power user | Scan 5 → Batch summary → Quick Save all → Aggregate insight |

### Future Backlog Items

| Epic | Focus | Source |
|------|-------|--------|
| F-Annual | Year in review story | Strava trait |
| F-Family | Household combined tracking | Research |
| F-Themes | Cats, dogs, seasonal themes | Chilean market |

---

## Session Summary

**Total Ideas Generated:** 40+
**Epics Defined:** 3 (13, 14, 15)
**Total Story Points:** ~128
**Personas Explored:** 4 (María, Diego, Rosa, Tomás)
**Key Innovations:**
- Dynamic Spending Polygon with "Expanding Lava" metaphor
- Savings GPS with goal-connected insights
- Emotional Airlock for difficult truths
- "Everything Breathes" motion design system
- "Intentional or Accidental?" non-judgmental framework

**Session Duration:** ~90 minutes
**Brainstorming Approach:** Progressive Flow (Role Playing → Mind Mapping → SCAMPER → Action Planning)
