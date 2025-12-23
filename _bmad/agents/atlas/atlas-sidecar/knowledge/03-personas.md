# User Personas & Goals

> Section 3 of Atlas Memory
> Last Sync: 2025-12-22
> Sources: ux-design-specification.md, PRD documents, brainstorming-session-2025-12-22.md

## Primary Persona: Chilean Family

<!-- Synced from: ux-design-specification.md:22, habits loops.md:13 -->

> "Chilean families who reach end of month wondering where their money went - people who want spending insights without manual data entry."

- **Role:** Household budget manager
- **Demographics:** Urban professional, 25-45, smartphone-centric
- **Goals:**
  - Track family/household expenses without manual data entry
  - Answer "Where did my money go?" at end of month
  - Get insights immediately after scanning receipts
- **Pain Points:**
  - Paper receipts pile up
  - No time for manual expense entry
  - Reach end of month with no visibility into spending
- **Mental Model:** Simple, familiar apps (WhatsApp, Facebook) - NOT complex analytics tools
- **Devices:** Android primary, iOS secondary, PWA on mobile browsers
- **Market Context:** Life in Chile is getting expensive; families need visibility

### The "Abuelita Test"

<!-- Synced from: habits loops.md:13, good habits.md:99 -->

> "For every animation, ask: 'Would this feel manipulative to a Chilean grandmother managing her household budget?'"

- She should feel **informed**, not anxious
- Insights celebrate progress, never criticize spending (no shame mechanics)

## Secondary Persona: Small Business Owner

- **Role:** Expense categorization for tax/accounting
- **Goals:** Quick categorization, export capability for accountant handoff
- **Need:** CSV export, receipt images stored

## Detailed Personas (Epic 13+ Brainstorming Session)

<!-- Synced from: brainstorming-session-2025-12-22.md Phase 1 -->

### María - The Overwhelmed Parent (38, Santiago)
- **Profile:** Part-time worker, manages household budget
- **Question:** "¿Dónde se fue la plata?"
- **Key Discovery:** "Intentional or Accidental?" framework
- **Design Need:** Non-judgmental awareness - app observes without judging
- **Quote:** "Restaurants up 23% - birthday dinner?"

### Diego - The Young Professional (26, Santiago)
- **Profile:** Software developer, earns well but doesn't save
- **Goal:** Save for Japan trip
- **Key Discovery:** Savings GPS concept - "Arriving at your goal by [date]"
- **Design Need:** Trade-off visibility - "This week's coffee: $13,500 = 1 day further from Tokyo"

### Rosa - Abuelita (62, Valparaíso)
- **Profile:** Household guardian, 40 years of paper records
- **Context:** Grandson taught her the app
- **Key Discovery:** Simple visual language - arrows ↑↓→, "Subió harto" not "Incrementó 27%"
- **Design Need:** Validate her wisdom - "Tu instinto tiene razón - todo está más caro"

### Tomás - The "Out of Character" Spender (34, Concepción)
- **Profile:** Disciplined accountant, 8 months of history, drifting without realizing
- **Key Discovery:** Emotional Airlock pattern for uncomfortable insights
- **Design Need:** Curiosity → Playfulness → Reveal sequence to prepare emotionally

## Persona-Feature Mapping

| Persona | Primary Features | Secondary Features |
|---------|-----------------|-------------------|
| Chilean Family | Receipt Scanning, Analytics, Learning | History Filters, Export |
| Small Business | Receipt Scanning, Export, Categories | Analytics |
| María | Dynamic Polygon, Budget Alerts | Category Trends |
| Diego | Savings GPS, Goal Tracking | Trade-off Insights |
| Rosa | Simple Arrows, Weekly Summary | Plain Language |
| Tomás | Out-of-Character Detection | Emotional Airlock |

## User Goals Matrix

| User Goal | Supporting Features |
|-----------|---------------------|
| "I want to capture receipts quickly" | Scan flow, batch mode, quick save |
| "I want to understand my spending" | Analytics, category drill-down, insights |
| "I want to find past transactions" | History filters (time, category, location) |
| "I want my data to be portable" | CSV export (Premium) |
| "I want the app to learn my habits" | Merchant/category/subcategory learning |
| "I want to save toward a goal" | Savings GPS, goal-connected insights (Epic 15) |
| "I want to know if I'm drifting" | Out-of-character detection (Epic 15) |

## Behavioral Patterns

### Key Insight
> "Target users love simple, familiar apps - NOT complex analytics tools. They use WhatsApp, Facebook, Candy Crush - apps with minimal learning curves."

Source: ux-design-specification.md:126

### Usage Patterns
- **Proactive scanning** - Users scan receipts right after purchase
- **End-of-month review** - Analytics exploration to understand spending
- **Search for specific transaction** - History filters to find past purchases
- **Weekly batch scanning** - ~50% of users save receipts and scan later (Epic 12)

## The Boletapp Voice Principles

<!-- Synced from: brainstorming-session-2025-12-22.md -->

| Principle | Description | Example |
|-----------|-------------|---------|
| **Observes without judging** | State facts, not judgments | "Restaurants up 23%" not "You overspent" |
| **Reveals opportunity** | Show trade-offs | "This affects your Japan trip" |
| **Invites experimentation** | Suggest, don't command | "What if you tried...?" |
| **Celebrates progress** | Personal records, milestones | "Your lowest restaurant week!" |
| **Normalizes setbacks** | Playful, not punitive | "La vida es rara. Los datos también." |

---

## Sync Notes

- Primary persona well-documented in UX docs
- "Abuelita Test" is key UX principle for ethical design
- Secondary persona less detailed - primarily driven by export need
- 4 detailed personas added from brainstorming session (2025-12-22)
- Voice Principles guide all user-facing messaging (Epics 13-15)
