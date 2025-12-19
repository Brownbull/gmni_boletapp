# User Personas & Goals

> Section 3 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: ux-design-specification.md, PRD documents

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

## Persona-Feature Mapping

| Persona | Primary Features | Secondary Features |
|---------|-----------------|-------------------|
| Chilean Family | Receipt Scanning, Analytics, Learning | History Filters, Export |
| Small Business | Receipt Scanning, Export, Categories | Analytics |

## User Goals Matrix

| User Goal | Supporting Features |
|-----------|---------------------|
| "I want to capture receipts quickly" | Scan flow, batch mode (future) |
| "I want to understand my spending" | Analytics, category drill-down, insights |
| "I want to find past transactions" | History filters (time, category, location) |
| "I want my data to be portable" | CSV export (Premium) |
| "I want the app to learn my habits" | Merchant/category/subcategory learning |

## Behavioral Patterns

### Key Insight
> "Target users love simple, familiar apps - NOT complex analytics tools. They use WhatsApp, Facebook, Candy Crush - apps with minimal learning curves."

Source: ux-design-specification.md:126

### Usage Patterns
- **Proactive scanning** - Users scan receipts right after purchase
- **End-of-month review** - Analytics exploration to understand spending
- **Search for specific transaction** - History filters to find past purchases

---

## Sync Notes

- Primary persona well-documented in UX docs
- "Abuelita Test" is key UX principle for ethical design
- Secondary persona less detailed - primarily driven by export need
