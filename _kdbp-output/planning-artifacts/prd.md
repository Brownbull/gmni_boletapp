---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
projectType: web_app_pwa
domain: personal_finance
complexity: medium-high
context: brownfield
inputDocuments:
  - docs/architecture/project-overview.md
  - docs/architecture/architecture.md
  - docs/architecture/data-models.md
  - docs/sprint-artifacts/sprint-status.yaml
  - docs/architecture/proposals/SCAN-WORKFLOW-RESTRUCTURING-PROPOSAL.md
  - docs/sprint-artifacts/epic10/epic-10-insight-engine-brainstorm.md
  - docs/archive/analysis/brainstorming-session-2026-01-21.md
  - docs/sprint-artifacts/epic1/prd.md
  - _kdbp/behaviors/boletapp-dev/BEHAVIOR.md
workflowType: 'prd'
---

# Product Requirements Document - BoletApp

**Author:** Gabe
**Date:** 2026-03-05

## Executive Summary

BoletApp turns receipt photos into item-level spending awareness, revealing where your money actually goes — not just how much you spent. Built as a Progressive Web App for the Chilean market, it uses AI-powered receipt scanning (Google Gemini) to extract individual line items, categorize them, and surface spending patterns that users would never notice on their own.

**Target audience:** Individuals and households who lack financial visibility into their day-to-day spending. Starting with Chilean consumers, expanding to shared household and group expense tracking.

**Core value proposition:** While most expense trackers stop at transaction totals, BoletApp goes deeper — item-level categorization (group + subcategory) powers drill-down analytics that answer "why did I spend so much at the supermarket?" not just "how much did I spend?" Combined with an insight engine that detects patterns without judgment, BoletApp turns receipt scanning from a chore into a habit that builds genuine financial self-awareness.

**Current state:** Production application with 15+ epics delivered (~250+ stories), covering AI receipt scanning, smart data entry with alias/duplicate detection, hierarchical analytics with interactive charts, CSV exports, and a phase-based insight engine. The codebase has undergone two major refactoring epics (15 and 15b) totaling ~168 stories, resulting in a clean Feature-Sliced Design architecture with zero circular dependencies.

**Next phase:** Staging web deployment, scan workflow restructuring, credit card statement scanning, shared group expense tracking (multi-tenant with copy & bucket model), and subscription-based monetization.

---

## What Makes It Special

**Item-level visibility, not just totals.** The fundamental insight: knowing you spent $150 at the supermarket tells you nothing. Knowing $40 of that was unplanned snacks tells you everything. BoletApp's AI extracts every line item from receipt photos, categorizes each one (Fresh Food > Vegetables, Pantry > Canned Goods), and tracks patterns at the item level across time.

**Scan-first, friction-free capture.** The primary interaction is pointing your camera at a receipt. Gemini AI handles extraction, the alias system learns your merchants, and trusted merchants skip review entirely. The goal: easier than stuffing receipts in a drawer.

**Awareness without judgment.** The insight engine detects spending "black holes" — recurring patterns the user hasn't noticed — but frames them as discoveries, never as failures. Phase-based engagement starts playful (Week 1: quirky observations) and evolves to actionable (Week 3+: pattern detection and trends). No shame, no budgets-as-punishment.

**Shared group tracking (upcoming).** A "copy & bucket" model where group members copy transactions into a shared bucket — each posted transaction is a frozen snapshot of the original. Admins (up to 5) can delete within 30 days; after 30 days transactions become immutable. Up to 50 members per group. This answers "where does OUR money go?" without the real-time sync complexity that plagued earlier attempts.

---

## Project Classification

| Dimension | Value | Notes |
|-----------|-------|-------|
| **Project Type** | Web App (PWA) | React 18 SPA, Vite, installable, offline-capable |
| **Domain** | Personal Finance / Fintech-lite | Expense tracking & awareness, not money movement. No KYC/AML/PCI. |
| **Complexity** | Medium-High | AI integration (Gemini), multi-tenancy (shared groups), subscription model, Firestore real-time sync |
| **Context** | Brownfield | Production app, ~610 modules, Feature-Sliced Design architecture |
| **Market** | Chilean market first | CLP currency, Spanish primary, local store categories |
| **Monetization** | Subscription-based (planned) | Free tier + paid tiers for premium features (exports, shared groups) |
| **Team** | Solo developer, agent-augmented | BMAD/ECC/KDBP workflow frameworks |

**Key implications for development:**
- Multi-tenancy (shared groups) requires admin role model, admin deletion windows, and group-scoped Firestore security rules
- Subscription model requires payment integration (Mercado Pago for Chilean market) and feature gating
- AI dependency (Gemini) means Cloud Function pipeline must handle both receipt images and credit card statement images
- Solo developer constraint means aggressive automation (CI/CD, agent workflows) and strict scope control per story

---

## Success Criteria

### User Success

| Metric | Target | When Measurable |
|--------|--------|-----------------|
| **Scan-to-save time** | < 30 seconds for a single receipt (trusted merchant path) | Now |
| **Item extraction accuracy** | > 90% of line items correctly extracted and categorized | Now |
| **Weekly scanning habit** | User scans 3+ receipts/week after Week 2 | Now |
| **"Aha" moment** | User discovers a spending pattern within first 2 weeks | Now (insight engine) |
| **Statement scanning adoption** | 50% of active users try credit card statement scanning within 30 days of launch | After statement scanning ships |
| **Shared group engagement** | Groups with 3+ members post 5+ transactions/week | After shared groups ships |
| **Subscription conversion** | 10% paid conversion rate | After subscription system ships |
| **User acquisition** | 100 active weekly scanners | After invite-link registration system exists |

### Business Success

| Milestone | Target | Dependency |
|-----------|--------|------------|
| **Feature completeness** | Statement scanning + shared groups + subscription live | Growth phase delivery |
| **Invite-gated onboarding** | Capped registration via invite links, controlled rollout | Registration system |
| **Paid tier revenue** | Measurable MRR from Pro/Max subscriptions | Mercado Pago integration |
| **Group virality** | Users invite others to shared groups, driving organic growth | Shared groups + invite system |
| **Retention** | < 3% monthly churn on paid users | 3+ months post-subscription |

### Technical Success

| Metric | Target |
|--------|--------|
| **Test coverage** | Maintain 45%+ lines (CI-enforced) |
| **Zero circular dependencies** | Maintained (depcruise baseline) |
| **Cloud Function response** | < 8s receipt scan, < 15s statement scan |
| **File size discipline** | Zero files over 800 lines (hook-enforced) |
| **Category taxonomy** | Clean 4-level naming, zero overlaps, prompt-aligned |

---

## Product Scope

### MVP (Delivered)
The foundation — what's live in production today:
- AI receipt scanning with item-level extraction (Gemini 2.5 Flash)
- Smart data entry: aliases, duplicate detection, auto-categorization (36 store categories, 39 item categories)
- Hierarchical analytics: Year > Month > Category > Group > Subcategory (pie + bar charts)
- CSV data exports (basic for all users, premium analytics for paid tier)
- Phase-based insight engine (quirky > celebratory > actionable)
- Transaction history with full editing, paginated (20/page)
- Google Auth, Firestore real-time sync, PWA installable
- Spanish primary, English secondary; CLP + USD currencies

### Growth Features (Next Phase — Priority Order)

1. **Staging web deployment + scan workflow restructuring** (~22-28 pts)
   - Deploy PWA to staging URL for QA from any device, with new user registration blocked
   - Split `useScanStore.ts` into Zustand slices (currently 946 lines, blocked)
   - Unify dual state machine (merge overlay into Zustand)
   - Fix gallery selection bug (automatic after unification)
   - Break feature-level cycle (shared workflow store, event pattern)
   - Move legacy scan components into feature directory

2. **Category taxonomy rework**
   - Rename all 4 classification levels with clear, user-friendly Spanish labels:
     - Store Category Group (e.g., "Rubro" — industry/sector)
     - Store Category (e.g., "Negocio" / "Giro" — business type)
     - Item Category Group (e.g., "Familia" / "Pasillo" — product family/aisle)
     - Item Category (e.g., "Tipo de Producto" — product type)
   - Review and de-overlap categories within and across levels
   - Update Gemini prompt to use new naming and refined category lists
   - Update all UI labels, translations, analytics groupings

3. **Credit card statement scanning**
   - New `ScanMode: 'statement'` — multi-transaction extraction from single source
   - Support both image capture (camera/gallery) AND PDF upload
   - Batch review integration for statement results
   - Cloud Function pipeline extension (may require Cloud Run for PDF parsing)

4. **Shared groups (copy & bucket model)**
   - Groups as shared transaction spaces, up to 50 members
   - 1-5 admins per group with deletion authority (30-day window)
   - Members copy transactions into group bucket as frozen snapshots
   - Transactions become immutable after 30 days (admins can delete within window)
   - Group deletion: admin-only, irreversible, deletes all group data
   - Group-level analytics (updated on posting)
   - Firestore security rules for multi-tenant access
   - Admin role management (deletion authority, not approval authority)

5. **Subscription & payments**
   - Free/Pro/Max tier model
   - Mercado Pago integration (Chilean market)
   - Feature gating (premium exports, shared groups, advanced insights)
   - Invite-link registration system (capped new user onboarding)

### Vision (Future Backlog)
- Onboarding & progressive disclosure (time-to-value < 60 seconds)
- Tags & grouping (trip tracking, project expenses)
- Achievements & milestones (ethical gamification)
- Advanced features: goals system, learned thresholds, out-of-character detection, treemap, themes
- Mobile native app (iOS + Android)
- Insight avatars, cloud storage integration, scheduled reports
- AI conversational spending analysis (personalized financial narratives)
- Spending limits and budget goals (awareness-based, not punitive)

---

## User Journeys

### Journey 1: Camila — The Daily Scanner
**Who:** 32-year-old professional in Santiago, lives alone. Shops at the same 4-5 stores weekly. Has no idea where her money goes each month — she earns well but never has anything left.

**Opening Scene:** Camila gets home from the supermarket on a Tuesday evening. She drops the receipt on the kitchen counter with the growing pile. She's tried budgeting apps before but quit after a week because entering transactions manually was tedious.

**Rising Action:** Her friend shared a BoletApp invite link. She installs the PWA, signs in with Google, and points her phone camera at tonight's Jumbo receipt. In 4 seconds, Gemini extracts 23 items — each with a price and category. She sees "Snacks: $8,200" and "Beverages: $5,400" broken out from the $47,000 total. She taps Save.

**Climax:** Two weeks in, after scanning 9 receipts, the insight engine surfaces: *"You've spent $24,600 on Snacks this month — that's 18% of your supermarket spending. Last month was similar."* Camila didn't think of herself as a snack buyer. She literally didn't know. That's the V1 moment: she can see the items, not just the total.

**Resolution:** Camila doesn't stop buying snacks. But she's aware now. She starts noticing the pattern at the shelf. Over the next month, snack spending drops 30% — not from guilt, but from awareness. She starts scanning every receipt, even small ones. It takes less time than putting the receipt in the drawer.

**What could go wrong:**
- Scan fails (bad lighting, crumpled receipt) → error overlay with Retry/Dismiss
- Wrong merchant detected → alias system learns corrections
- Category wrong on an item → manual edit, mapping system learns for next time

---

### Journey 2: Diego — The Weekend Batch Scanner
**Who:** 40-year-old father of two in Valparaiso. Collects receipts in his wallet all week, scans them Sunday morning while drinking coffee.

**Opening Scene:** Diego has 7 receipts stuffed in his wallet from the week — supermarket, pharmacy, gas station, kids' school supplies, two restaurants, and a hardware store. He tried tracking expenses in a spreadsheet once. It lasted one month.

**Rising Action:** Sunday morning, he opens BoletApp and taps the camera FAB. He scans the first receipt — Jumbo, 31 items. While Gemini processes it in the background, he immediately scans the next one. The batch progress indicator shows "2/7 processing." He scans all 7 in under 3 minutes. The batch review screen shows all results.

**Climax:** He reviews each transaction — most merchants are already trusted (auto-approve). Two need alias corrections. The batch summary insight says: *"This week: $187,000 across 7 stores. Restaurant spending up 40% vs. your 4-week average."* He realizes the two restaurant dinners were both on weeknights when he was too tired to cook.

**Resolution:** Diego shares the insight with his wife. They agree to meal-prep on Sundays. He's now a reliable weekly scanner — the Sunday coffee ritual includes 5 minutes of receipt scanning. The insight engine moves him to Phase 3 (actionable insights) after 3 weeks.

**What could go wrong:**
- One receipt is too faded to scan → manual entry fallback
- Gallery selection bug after a failed scan → fixed by scan restructuring (Growth Feature 1)
- He forgets to scan for a week → streak-break insight gently welcomes him back, no shame

---

### Journey 3: Valentina — The Group Admin
**Who:** 28-year-old who shares an apartment with two roommates in Providencia. They split groceries and household expenses but constantly argue about who paid what.

**Opening Scene:** Valentina creates a shared group called "Depto Provi" in BoletApp. She adds her two roommates — Matias and Sofia — via invite links. She designates herself and Matias as admins (2 of max 5).

**Rising Action:** Throughout the week, all three roommates scan their shared-expense receipts and copy them to the group bucket. Sofia scans the $62,000 Lider receipt (groceries) and posts it to "Depto Provi." Matias posts the $15,000 cleaning supplies from Homecenter. Valentina posts the $8,000 pharmacy run. Each transaction appears immediately in the group feed as a frozen snapshot — the originals stay in each person's personal account.

**Climax:** Valentina opens the group view. She sees 3 posted transactions from this week. The items are listed, the totals match the receipts — all visible immediately. The group analytics update in real time: *"This month: $85,000 in shared expenses. Sofia contributed 73%, Matias 18%, Valentina 9%."* The conversation shifts from "who paid for what?" to visible, objective data.

**Resolution:** The monthly group summary shows spending by category. They discover they're spending $28,000/month on cleaning supplies — far more than expected. They switch to buying in bulk. No one argues about money anymore. When a roommate moves out, Valentina (as admin) can see the full history. Transactions older than 30 days are immutable — the record is trustworthy.

**What could go wrong:**
- Someone posts a wrong transaction → admin deletes it within 30 days, member re-posts the correct one
- Someone posts a personal expense to the group → admin deletes it (within 30-day window)
- Group grows past initial roommates (e.g., new roommate) → admin adds via invite, up to 50 members
- Admin wants to delete the entire group → irreversible deletion with confirmation, only admins can do it

---

### Journey 4: Roberto — The Statement Scanner
**Who:** 55-year-old small business owner in Temuco. Uses his personal credit card for everything — business and personal. Gets the PDF statement monthly from his bank.

**Opening Scene:** Roberto downloads his Banco Estado credit card statement PDF. 47 transactions for the month. He needs to separate personal from business expenses for his accountant, but the statement just shows merchant names and totals — no item-level detail.

**Rising Action:** He opens BoletApp and selects "Statement Scan." He uploads the PDF. The system processes it — extracting 47 transactions with dates, merchants, and amounts. It presents them in batch review mode, one by one. Roberto categorizes each as personal or business (via tags or groups). The Gemini AI recognizes merchant names and auto-suggests store categories.

**Climax:** In 10 minutes, Roberto has 47 categorized transactions — 31 personal, 16 business. The analytics instantly show: *"Business expenses: $340,000 this month. Personal: $580,000. Top personal category: Restaurant ($142,000)."* His accountant gets a clean CSV export of business expenses.

**Resolution:** Roberto now scans both receipts (for item-level detail) and monthly statements (for the complete picture). The statement fills in the transactions he forgot to scan. Together, they give him 100% coverage of his spending. He subscribes to Pro for the statement scanning feature.

**What could go wrong:**
- PDF format not recognized → fallback to image capture (photo of statement)
- Merchant name ambiguous → manual category assignment, system learns
- Duplicate detection catches receipts already scanned → warns before double-entry

---

### Journey 5: Francisca — The Invited New User
**Who:** 24-year-old university student. Her friend Camila sent her an invite link to BoletApp.

**Opening Scene:** Francisca taps the invite link on her phone. She sees a brief landing page explaining what BoletApp does. She taps "Sign in with Google" — one tap, she's in.

**Rising Action:** The app detects she's a new user with zero transactions. It offers a guided first scan: *"Point your camera at any receipt."* She scans her lunch receipt from a sandwich shop. 3 items appear — sandwich, drink, cookie. She sees the category breakdown and taps Save.

**Climax:** The first-scan insight appears: *"Welcome! Your first receipt: $4,500 at a restaurant. Every scan teaches BoletApp your spending patterns. After a few more, you'll start seeing insights you never expected."* It's encouraging without being pushy. She scans two more receipts that day.

**Resolution:** Within a week, Francisca has 12 receipts scanned. Camila invites her to a shared group for their weekend trips. Francisca is hooked — the friction was so low she didn't even notice she was building a habit.

**What could go wrong:**
- Invite link expired or cap reached → clear error message, option to request new invite
- Google sign-in fails → standard Firebase Auth error handling
- First receipt is crumpled/unreadable → graceful error with "Try another receipt" encouragement

---

### Journey 6: Manuel — The Credit-Conscious Scanner
**Who:** 35-year-old in Concepcion on the free tier. Scans most receipts but sometimes wants to log a purchase without spending a scan credit.

**Opening Scene:** Manuel just bought lunch at a food court — $6,500. He has the receipt and wants to track it, but he's low on scan credits this month and the receipt only has 2 items. Not worth a credit.

**Rising Action:** He opens BoletApp and taps "New Transaction." Instead of scanning, he selects "Manual Entry." He attaches the receipt photo as a reference image (stored but not processed by Gemini). He types: merchant "Patio de Comidas," date today, total $6,500. He adds 2 items manually — "Sandwich" ($4,000, Prepared Food) and "Juice" ($2,500, Beverages). The alias system suggests the store category "Restaurant."

**Climax:** The transaction is saved with the receipt image attached as proof — he can see the thumbnail in his history. It took 45 seconds instead of 4 seconds, but cost zero credits. His analytics are complete — no gap in his spending record.

**Resolution:** Manuel uses manual entry for small, simple receipts (1-3 items) and saves his scan credits for supermarket hauls with 20+ items where manual entry would be painful. He gets the full analytics picture either way.

**What could go wrong:**
- Forgets to attach image → transaction still saves, just no visual proof
- Miscategorizes an item → editable anytime, mapping system doesn't learn from manual entries
- Wants to scan later → can re-open transaction and trigger scan from attached image

---

### Journey 7: Camila — The Analytics Explorer
**Who:** Same Camila from Journey 1, now 2 months in with 60+ transactions. She opens BoletApp not to scan, but to understand.

**Opening Scene:** It's the last day of the month. Camila wants to know where her money went. She opens the Trends view.

**Rising Action:** She starts at the yearly view — a pie chart shows her spending distribution across store category groups. "Food & Dining" dominates at 62%. She taps into it. The monthly view shows a bar chart of the last 6 months — spending has been climbing. She taps into March. Now she sees individual store categories: Supermarket ($180,000), Restaurant ($95,000), StreetVendor ($22,000). She taps "Supermarket." Item category groups appear: Food-Fresh ($72,000), Food-Packaged ($58,000), Household ($32,000), Health-Personal ($18,000). She taps "Food-Packaged." Individual item categories: Snacks ($24,000), Pantry ($18,000), Frozen Foods ($12,000), Beverages ($4,000).

**Climax:** Five taps deep, Camila sees that $24,000 of her supermarket spending is snacks — and it's been growing month over month. The bar chart shows Jan: $16,000, Feb: $20,000, Mar: $24,000. She can see the trend at the item level, across time, without a spreadsheet. This is V1 in action: she sees the items, not just the total.

**Resolution:** Camila screenshots the snack trend chart and sends it to her friend. "Look at this — I had no idea." She starts checking Trends weekly instead of monthly. The drill-down becomes her primary way of understanding spending.

**What could go wrong:**
- Too few transactions for meaningful analytics → minimum data thresholds, show "need more data" gracefully
- Category overlap confuses drill-down (e.g., "Bakery" as store vs. "Bakery" as item) → taxonomy rework (Growth #2) resolves naming confusion
- Time period comparison feels off → period comparison helpers show % change with context

---

### Journey 8: Diego — The AI Insight Seeker
**Who:** Same Diego from Journey 2, now 3 months in. He's been diligent about scanning but wants deeper analysis — patterns he can't see by manually browsing charts.

**Opening Scene:** Diego opens the Insights tab. He's past the quirky phase (Week 1) and the celebratory phase (Weeks 2-3). The engine is now in mature mode — serving actionable insights.

**Rising Action:** Today's insight card says: *"Your pharmacy spending has tripled since January — from $12,000 to $38,000/month. This is mostly driven by 'Supplements' ($22,000 in March)."* Diego hadn't connected the dots — he started buying vitamins in bulk after a doctor's visit but didn't realize the cumulative impact.

**Climax (Future — AI Deep Analysis):** Diego taps "Ask AI about my spending." He types: *"Why is my spending going up every month?"* The AI analyzes his transaction history and responds: *"Your total spending increased 15% over the last 3 months. The main drivers are: (1) Restaurant spending on weekday evenings (+40%), (2) Pharmacy/Supplements — new recurring expense since February, (3) Gas Station — 2 extra fill-ups in March. Your supermarket spending has actually decreased 8%."* It's a personalized financial narrative — not a chart, but a story.

**Resolution:** Diego uses the AI chat-style insight feature monthly to get a "spending story" that connects patterns across categories and time. The insights area becomes his financial advisor — not judgmental, just observant. He shares the monthly summary with his wife.

**What could go wrong:**
- AI hallucination about spending → all numbers grounded in actual transaction data, never fabricated
- Insight feels generic → personalization based on actual history, not templates
- User asks question outside scope → graceful boundary: "I can only analyze your BoletApp spending data"

---

### Journey 9: Sofia — The Activity Checker
**Who:** 26-year-old roommate from Valentina's group (Journey 3). Opens BoletApp several times a day just to check recent activity.

**Opening Scene:** Sofia is at the office after lunch. She opens BoletApp to the Dashboard — the landing view that shows her recent activity at a glance.

**Rising Action:** The dashboard shows:
- **Today:** 1 transaction — Lunch at "Cafe Altura," $5,800
- **This week:** 8 transactions, $127,000 total
- **Most expensive this week:** Jumbo supermarket, $62,000 (the shared groceries)
- **Spending pace:** "You're tracking 12% below your monthly average"

She scrolls down to Recent Scans — thumbnails of her last 5 receipts with merchant names and totals. She taps the Jumbo one to see the item breakdown.

**Climax:** The dashboard's "spending pace" indicator tells her she's under her usual rate. She feels good — no need to dig into analytics. A quick glance confirmed everything is on track.

**Resolution:** Sofia checks the dashboard 2-3 times a week. She doesn't need deep analytics — the dashboard's at-a-glance summary is enough. She only drills into Trends when something looks unusual.

**What could go wrong:**
- Dashboard feels stale (same data as yesterday) → show temporal context ("no new transactions since Tuesday")
- "Most expensive" feels judgmental → frame as observation, not warning ("Your biggest purchase this week")
- Spending pace calculation is wrong early in the month → use daily run rate, not total-to-date

---

### Journey 10: Matias — The Behavioral Nudge Recipient
**Who:** 30-year-old roommate from Valentina's group. Passive user — scans receipts but rarely checks analytics. Relies on the app to tell him things.

**Opening Scene:** Matias opens BoletApp after scanning a gas station receipt. The insight card appears.

**Rising Action:** The insights area shows a stack of "nuggets" — small, actionable observations:
- *"You've visited 3 different gas stations this month. GasStation A is consistently $40/liter cheaper."* (price comparison insight)
- *"You haven't scanned a receipt in 5 days. Your monthly average is every 2 days."* (habit nudge — not guilt, just observation)
- *"Your Restaurant spending is 28% of total this month. That's your highest category."* (awareness nudge)

**Climax:** One nugget catches his eye: *"Tip: You can mark 'Copec' as a trusted merchant. Next time, scanning will skip the review step — saving 10 seconds per fill-up."* He taps it, Copec becomes trusted. The app just taught him a feature through context, not a tutorial.

**Resolution:** Matias never reads documentation. But the insight nuggets teach him features gradually — trusted merchants, aliases, category corrections. The insights area is both a financial awareness tool AND a progressive feature discovery mechanism. This is V5 in action: it's easier than thinking about it.

**What could go wrong:**
- Too many nudges → fatigue. Limit to 3 active nuggets, rotate weekly
- Nudge feels pushy → always optional, dismissible, no repeat for 2 weeks after dismiss
- Feature tip is irrelevant → contextual triggering only (e.g., trusted merchant tip only after 3+ visits to same merchant)

---

### Journey 11: Camila — The Budget Setter
**Who:** Same Camila, now 4 months in. She's aware of her spending patterns and wants to set limits.

**Opening Scene:** Camila knows she spends $24,000/month on snacks. She doesn't want to eliminate them — she wants to cap them at $15,000. She also wants to limit restaurant spending to $80,000/month.

**Rising Action:** She opens Settings > Spending Limits (or a dedicated Goals section). She creates two limits:
- "Snacks" (item category) → $15,000/month
- "Restaurant" (store category) → $80,000/month

The system doesn't block purchases — it observes. When she's at 60%, 80%, and 100% of a limit, the insight engine surfaces awareness nudges. No alarms, no red warnings — just: *"You've used 80% of your Snacks budget with 10 days left in the month."*

**Climax:** End of month: Snacks came in at $16,500 — slightly over but way down from $24,000. Restaurant at $72,000 — under budget. The monthly summary celebrates the restaurant win: *"Nice — you came in $8,000 under your restaurant limit this month."* The snack overage gets a gentle observation: *"Snacks was $1,500 over your target. Still a big improvement from your 3-month average of $22,000."*

**Resolution:** Camila adjusts her snack limit to $17,000 — more realistic. The system learns from her behavior, not from rigid rules. V4 in action: detect the black holes, don't judge them. Limits are awareness tools, not punishment.

**What could go wrong:**
- User sets unrealistic limit → suggest based on historical average: "Your 3-month average is $22,000. A 30% reduction would be $15,400."
- Limit crossed mid-month with no nudge → ensure the 60/80/100% thresholds are checked after each transaction save
- Too many limits → suggest starting with 2-3 max. "Focus on the categories you want to change."

---

### Journey Requirements Summary

| Journey | Key Capabilities Required | Status |
|---------|--------------------------|--------|
| **1. Camila (Daily Scanner)** | Receipt scanning, item extraction, alias learning, insight engine, trusted merchants | Delivered |
| **2. Diego (Batch Scanner)** | Batch scanning, background processing, batch review, batch summary insights | Delivered |
| **3. Valentina (Group Admin)** | Shared groups, copy & bucket posting, group analytics, member management | Growth #4 |
| **4. Roberto (Statement Scanner)** | PDF + image upload, multi-transaction extraction, batch categorization, CSV export | Growth #3 |
| **5. Francisca (New User)** | Invite-link registration, guided first scan, cold-start insights | Growth #5 / Vision |
| **6. Manuel (Credit-Conscious)** | Manual entry with image attachment, zero-credit path | Delivered (partially) |
| **7. Camila (Analytics Explorer)** | Hierarchical drill-down, period comparison, trend visualization | Delivered |
| **8. Diego (AI Insight Seeker)** | AI conversational spending analysis, personalized narratives | Vision |
| **9. Sofia (Activity Checker)** | Dashboard at-a-glance, spending pace, recent scans, most expensive | Delivered |
| **10. Matias (Nudge Recipient)** | Insight nuggets, feature tips, contextual behavioral nudges | Partial / Vision |
| **11. Camila (Budget Setter)** | Spending limits by category, threshold alerts, monthly summaries | Vision (Goals system) |

| Capability Area | Journeys | Status |
|----------------|----------|--------|
| Receipt scanning + item extraction | 1, 2, 4, 5 | Delivered |
| Manual entry with image attachment | 6 | Needs verification |
| Batch scanning + review | 2, 4 | Delivered |
| Hierarchical analytics drill-down | 7 | Delivered |
| Dashboard at-a-glance | 9 | Delivered |
| Insight engine (phase-based) | 1, 2, 5, 10 | Delivered |
| AI conversational analysis | 8 | Vision |
| Behavioral nudges + feature tips | 10 | Partial / Vision |
| Spending limits / goals | 11 | Vision |
| Staging web deployment | all (QA) | Growth #1 |
| Scan workflow restructuring | 2 (gallery bug), all | Growth #1 |
| Category taxonomy rework | 7 (naming clarity) | Growth #2 |
| Statement scanning (image + PDF) | 4 | Growth #3 |
| Shared groups (copy & bucket) | 3 | Growth #4 |
| Subscription & payments | 4, 3 | Growth #5 |
| Invite-link registration | 5 | Growth #5 |
| Onboarding / guided first scan | 5 | Vision |

---

## Domain Requirements

### Compliance & Regulatory

| Regulation | Applicability | Notes |
|------------|--------------|-------|
| **PCI-DSS** | Not applicable | No payment card data stored or processed. Credit card statements are scanned for transaction extraction, not card numbers. |
| **KYC/AML** | Not applicable | No money movement, no funds transfer, no financial intermediation. |
| **Chilean Data Protection (Ley 19.628)** | Applicable | Personal financial data (spending habits) is sensitive. User consent required. Data stored per-user in isolated Firestore paths. |
| **GDPR** | Not directly applicable | Chilean market first, but good practice. Data portability already exists (CSV export). Right to deletion: Factory Reset feature exists. |
| **Google OAuth / Firebase ToS** | Applicable | Must comply with Google's Terms of Service for Auth and Firestore usage. No reselling of user data. |
| **App Store / PWA guidelines** | Applicable | If distributing via Play Store (TWA), must comply with Google Play policies. PWA has no store compliance. |

### Technical Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| **Gemini API rate limits** | Scan throughput capped per minute/day | Credit system already manages user-level throttling. Statement scanning (multi-page) may need batched API calls. |
| **Firestore document size** | 1 MB max per document | Transactions with 50+ items are safe. Statement scans creating 47+ transactions are individual documents, not one. |
| **Firestore security rules complexity** | Shared groups require cross-user read/write rules | Must maintain user isolation for personal data while allowing group-scoped access. Two distinct rule sets. |
| **PDF parsing** | Gemini can process images but PDF handling varies | May need Cloud Run for server-side PDF-to-image conversion before Gemini processing. |
| **Chilean currency (CLP)** | Integer-only, no decimals, large numbers (e.g., $187,000) | Already handled — all amounts stored as integers. Display formatting uses dot separators ($187.000). |
| **Offline capability** | PWA must handle intermittent connectivity | Service worker caches app shell. Firestore offline persistence handles data. Scans require network (Gemini API). |

### Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Receipt image data privacy** | High | Images stored in user-isolated Firebase Storage paths. Security rules enforce `auth.uid == userId`. Images deleted on transaction deletion (cascade trigger). |
| **AI extraction errors** | Medium | User review step before save. Trusted merchants skip review (user opted in). Mapping system learns corrections over time. |
| **Multi-tenant data leakage (shared groups)** | High | Group membership enforced by Firestore security rules. Members can read all posted transactions. Admins can delete within 30 days. No cross-group access. Personal transactions never visible to group. |
| **Subscription payment fraud** | Medium | Mercado Pago handles payment security. BoletApp only stores subscription tier status, not payment details. |
| **Invite link abuse** | Low | Capped registration links with expiration. Rate limiting on invite generation. |

---

## Innovation Analysis

### Innovation Area 1: Item-Level AI Extraction
**What's innovative:** Most expense trackers capture transaction totals. BoletApp uses Gemini AI to extract individual line items with categories from receipt photos — turning an unstructured image into structured spending data at the item level.

**Market context:** Receipt scanning apps exist (e.g., Expensify, Wave) but focus on business expense reporting — merchant + total + tax. Consumer-facing item-level extraction is rare, especially in the Latin American market where receipt formats vary widely.

**Validation:** Already validated — production app with 15+ epics. Item extraction accuracy > 90% with the Gemini 2.5 Flash model. The V3 prompt (Epic 14) significantly improved categorization accuracy.

**Risk:** Gemini API pricing changes could impact unit economics. Mitigated by the credit system (users have a scan budget) and manual entry fallback (Journey 6).

### Innovation Area 2: Phase-Based Insight Engine
**What's innovative:** Instead of showing the same type of insights from day one, BoletApp adapts its communication style to user maturity — quirky observations for new users (building trust), celebratory milestones for growing users (building habit), actionable pattern detection for mature users (delivering value).

**Market context:** Most analytics tools are static — same charts, same reports regardless of user tenure. BoletApp's progressive engagement model is borrowed from gaming (progressive difficulty) applied to personal finance.

**Validation:** Architecture designed and implemented (Epic 10). The sprinkle distribution system (33/66 ratio) prevents insight fatigue. Cooldown rules prevent repetition.

**Risk:** Phase transitions may feel abrupt. Mitigated by blended ratios (never 100% one type) and user-controlled silencing ("Silenciar 4h" for batch scanning sessions).

### Innovation Area 3: AI Conversational Spending Analysis (Future)
**What's innovative:** Journey 8 describes a chat-style interface where users ask questions about their spending and get personalized narratives grounded in their actual transaction data. Not a generic chatbot — a financial narrator that connects patterns across categories and time.

**Market context:** AI financial advisors exist but typically require connecting bank accounts (Mint, Cleo). BoletApp's approach is privacy-preserving — all data comes from user-scanned receipts, no bank integration required.

**Validation:** Not yet built. Requires careful prompt engineering to prevent hallucination (all numbers must be grounded in actual data). The existing insight engine provides a foundation — conversational analysis extends it from push (system-initiated insights) to pull (user-initiated questions).

**Risk:** Users may ask questions the AI can't answer well. Mitigated by clear scope boundaries ("I can only analyze your BoletApp spending data") and grounding all responses in actual transaction records.

### Innovation Area 4: Copy & Bucket Shared Groups
**What's innovative:** Rather than real-time sync (which failed in Epic 14c due to delta sync, caching, and cost issues), shared groups use an intentionally simple model: copy transaction → frozen snapshot in group bucket → immutable after 30 days. Admins can delete within a 30-day window. This trades real-time for reliability and trust.

**Market context:** Splitwise and similar apps track who owes whom. BoletApp's shared groups track where the group's money goes — analytics, not debt splitting. The frozen-snapshot model ensures data integrity while the 30-day admin deletion window handles mistakes.

**Validation:** The failure of the complex approach (Epic 14c: ~16,000 lines removed) validated the need for simplicity. The "copy & bucket" model has no sync, no delta detection, no cache invalidation — just a frozen copy and a time window.

**Risk:** Accidental or malicious posts linger past 30-day deletion window. Mitigated by admin notifications on new posts and prominent deletion controls during the window.

---

## Web App (PWA) + SaaS Specific Requirements

### Web App Requirements

| Question | Answer |
|----------|--------|
| **SPA or MPA?** | Single-Page Application — React 18, Vite 5.4, client-side routing. No SSR needed (app behind auth). |
| **Browser support?** | Modern evergreen browsers (Chrome, Safari, Firefox, Edge). PWA install on Chrome/Android and Safari/iOS. No IE11. |
| **SEO needed?** | No. App is behind authentication. Landing page (if any) would be a separate static site. |
| **Real-time?** | Yes, via Firestore real-time listeners. Transactions update immediately after scan. No custom WebSocket server. |
| **Accessibility?** | WCAG 2.1 AA target. Not yet audited. Camera capture + touch review need accessible alternatives. |

### SaaS / Multi-Tenant Requirements

| Question | Answer |
|----------|--------|
| **Multi-tenant?** | Hybrid. Personal data is user-isolated (`/artifacts/{appId}/users/{userId}/`). Shared groups add group-scoped collections. Personal transactions never exposed to groups — users explicitly post to groups. |
| **Permission model?** | Two-tier: (1) Personal = full CRUD, Firestore rules enforce `auth.uid == userId`. (2) Groups = members post (copy) + read all; admins (1-5) delete within 30 days; after 30 days = immutable. |
| **Subscription tiers?** | Planned. Free tier: limited scans/month (credit system exists). Paid tier: higher scan limits + shared groups + statement scanning. Payment via Mercado Pago. |
| **Integrations?** | Gemini AI (scanning), Google OAuth (auth), Firebase (data + hosting), Mercado Pago (planned payments). No bank integrations — privacy-by-design. |
| **Compliance?** | Chilean Ley 19.628, Google ToS. No PCI-DSS (no card data stored). See Domain Requirements. |

### Deployment & Environments

| Environment | Status | Access |
|-------------|--------|--------|
| **Production** | Live | Firebase Hosting, auto-deploy from `main` branch |
| **Staging (backend)** | Live | Separate Firebase project with staging data. Currently accessed via `npm run dev:staging` (local app pointing to staging backend). |
| **Staging (web)** | Planned (Growth #1) | Deploy PWA to staging URL (e.g., Firebase Hosting preview channel or dedicated staging domain). Same codebase pointed at staging Firebase project. Registration blocked — no new users. Enables QA from any device, E2E testing, and demo access without running local dev server. |

---

## Project Scoping & Phased Development

### MVP Strategy
BoletApp is post-MVP. The core product (receipt scanning → item-level extraction → spending analytics) is delivered and in production. Scoping now focuses on the Growth phase — competitive features that expand the user base and enable monetization.

**Strategy: Platform** — build the minimum viable platform features (groups, payments, statement scanning) that transform BoletApp from a single-user tool into a monetizable multi-user platform.

### MoSCoW Prioritization

**Must-Have (Growth Phase — without these, can't monetize):**

| Feature | Rationale | Phase |
|---------|-----------|-------|
| Staging web deployment | Infrastructure prerequisite. Enables QA from any device, E2E testing, demo access. Backend already ready — just frontend hosting + auth lockdown. | Growth #1 |
| Scan workflow restructuring | Prerequisite for all growth work. Fixes gallery bug, unblocks statement scanning architecture. | Growth #1 |
| Category taxonomy rework | Spanish naming (Rubro → Negocio → Familia → Tipo), cleaner hierarchy. Needed before groups (shared vocabulary). | Growth #2 |
| Credit card statement scanning | Image + PDF upload → multi-transaction extraction. Major value-add that justifies paid tier. | Growth #3 |
| Shared groups (copy & bucket) | Multi-user capability. Admin workflow. Group analytics. Drives subscription conversion. | Growth #4 |
| Subscription & payments (Mercado Pago) | Revenue enablement. Free/paid tier differentiation. Invite-link registration. | Growth #5 |

**Should-Have (significantly improves experience):**

| Feature | Rationale |
|---------|-----------|
| Onboarding / guided first scan | Reduces drop-off for invite-link registrants (Journey 5) |
| Manual entry verification | Confirm zero-credit path works end-to-end (Journey 6) |
| Spending limits / goals system | High user demand, builds engagement (Journey 11) |
| Insight nuggets expansion | Behavioral nudges + feature tips (Journey 10) |

**Could-Have (nice but not essential):**

| Feature | Rationale |
|---------|-----------|
| AI conversational analysis | Vision feature, high complexity, requires careful grounding (Journey 8) |
| Achievement system | Gamification layer, engagement booster |
| Advanced analytics dashboard | Power user feature, low urgency |
| Mobile native (TWA/Capacitor) | App store presence, but PWA works well enough |

**Won't-Have (explicitly deferred):**

| Feature | Rationale |
|---------|-----------|
| Bank account integration | Against privacy-by-design principle |
| Multi-currency support | Chile-only for now (CLP integer math) |
| Business expense reporting | Consumer product, not enterprise |
| Social features (leaderboards) | Against V3 "your money story is yours" |

### Phased Delivery

**Phase 1 — Foundation Repair (Growth #1-2):**
- Staging web deployment (hosting config + auth lockdown)
- Scan workflow restructuring (split store, merge overlay, fix gallery bug)
- Category taxonomy rework (4-level Spanish naming, migration)
- Estimated: ~18-25 stories

**Phase 2 — Platform Expansion (Growth #3-4):**
- Credit card statement scanning (image + PDF)
- Shared groups (copy & bucket model)
- Estimated: ~20-30 stories

**Phase 3 — Monetization (Growth #5):**
- Subscription system (Mercado Pago integration)
- Invite-link registration
- Free/paid tier differentiation
- Estimated: ~10-15 stories

**Phase 4 — Vision Features:**
- Spending limits / goals
- AI conversational analysis
- Advanced onboarding
- Achievement system

### Risk-Based Scoping

| Risk Type | Specific Risk | Mitigation |
|-----------|--------------|------------|
| **Technical** | Scan store split (946 lines, dual state machine) | Prototype first in Tier 1. Detailed proposal already exists. |
| **Technical** | PDF parsing for statement scanning | Spike: test Gemini PDF capabilities vs. Cloud Run pre-processing |
| **Market** | Will users pay for shared groups? | Ship groups first (free during beta), add paywall after validation |
| **Market** | Invite-only limits growth | Intentional — quality over quantity. Expand invites per paying user. |
| **Resource** | Solo developer, ambitious roadmap | Strict story sizing (8 tasks max). Ship Growth #1-2 before committing to #3-4. |

---

## Functional Requirements

### 1. Receipt Capture & Processing

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-1.1** | User can capture a receipt image via device camera and have it processed by AI to extract merchant, date, total, and individual line items with categories | Delivered |
| **FR-1.2** | User can select one or more receipt images from device gallery for AI processing | Delivered |
| **FR-1.3** | User can scan multiple receipts in sequence, with each processing in the background while the next is captured | Delivered |
| **FR-1.4** | User can review AI-extracted data before saving, correcting merchant name, categories, item names, or prices | Delivered |
| **FR-1.5** | User can dismiss a failed scan and return to capture without losing the ability to select new images | Growth #1 (gallery bug) |
| **FR-1.6** | User can upload a credit card statement (image or PDF) and have it processed to extract multiple transactions with dates, merchants, and amounts | Growth #3 |
| **FR-1.7** | User can review statement-extracted transactions in batch, categorizing and confirming each before saving | Growth #3 |
| **FR-1.8** | User can create a transaction manually — entering merchant, date, total, and line items — without consuming a scan credit | Delivered (needs verification) |
| **FR-1.9** | User can attach a receipt image to a manually-created transaction as visual reference without triggering AI processing | Delivered (needs verification) |

### 2. Transaction Management

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-2.1** | User can view a paginated list of all their transactions, ordered by date | Delivered |
| **FR-2.2** | User can edit any field of a saved transaction (merchant, date, total, category, items) | Delivered |
| **FR-2.3** | User can delete a transaction, which also removes associated images | Delivered |
| **FR-2.4** | User can view the full item breakdown of any transaction, including item name, quantity, price, and category | Delivered |
| **FR-2.5** | System detects potential duplicate transactions (same merchant, date, total) and warns the user before saving | Delivered |
| **FR-2.6** | User can export their transaction data as CSV, with basic export available to all users and premium analytics export for paid tier | Delivered |

### 3. Smart Data Learning

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-3.1** | System learns merchant name corrections (aliases) and auto-applies them to future scans of the same merchant | Delivered |
| **FR-3.2** | System learns item category corrections and auto-applies them to matching items in future scans | Delivered |
| **FR-3.3** | System learns store category assignments and auto-suggests them for recognized merchants | Delivered |
| **FR-3.4** | User can mark a merchant as "trusted," which skips the review step for future scans from that merchant | Delivered |
| **FR-3.5** | System normalizes legacy and translated category names to the current standard taxonomy when reading stored data | Delivered |

### 4. Category Taxonomy

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-4.1** | System classifies stores using a 2-level hierarchy: Store Category Group (8 groups) → Store Category (36 categories) | Delivered |
| **FR-4.2** | System classifies items using a 2-level hierarchy: Item Category Group (7 groups) → Item Category (39 categories) | Delivered |
| **FR-4.3** | All 4 classification levels have clear, user-facing Spanish labels (Rubro, Negocio/Giro, Familia/Pasillo, Tipo de Producto) with no overlapping names across levels | Growth #2 |
| **FR-4.4** | AI scan prompt uses the current taxonomy to categorize extracted items and merchants consistently | Delivered (prompt update in Growth #2) |

### 5. Spending Analytics

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-5.1** | User can view spending distribution across store category groups for any time period (year, month) via interactive charts | Delivered |
| **FR-5.2** | User can drill down from category group → category → item group → item category to see progressively detailed spending breakdowns | Delivered |
| **FR-5.3** | User can compare spending across time periods (month-over-month, year-over-year) with percentage change indicators | Delivered |
| **FR-5.4** | User can view a dashboard showing at-a-glance metrics: today's spending, weekly total, most expensive transaction, and spending pace vs. monthly average | Delivered |
| **FR-5.5** | User can view trend charts showing spending evolution over time at any taxonomy level | Delivered |

### 6. Insight Engine

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-6.1** | System generates spending insights that adapt to user maturity — quirky observations for new users, celebratory milestones for growing users, actionable patterns for mature users | Delivered |
| **FR-6.2** | System limits active insights to prevent fatigue, with cooldown rules to avoid repetition | Delivered |
| **FR-6.3** | User can silence insights temporarily (e.g., during batch scanning sessions) | Delivered |
| **FR-6.4** | System surfaces contextual feature tips as insight nuggets (e.g., trusted merchant suggestion after repeated visits) | Partial |
| **FR-6.5** | User can set spending limits by category, and the system surfaces awareness nudges at 60%, 80%, and 100% thresholds | Vision |
| **FR-6.6** | User can ask natural-language questions about their spending and receive personalized narratives grounded in their actual transaction data | Vision |

### 7. Shared Groups

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-7.1** | User can create a shared group with a name and invite members via invite links, up to 50 members per group | Growth #4 |
| **FR-7.2** | Group creator can designate 1-5 admins with deletion authority (30-day window) | Growth #4 |
| **FR-7.3** | Group member can post a transaction to the group (copy from personal or scan directly to group) | Growth #4 |
| **FR-7.4** | Group admin can delete any group transaction within 30 days of posting | Growth #4 |
| **FR-7.5** | Group transactions become immutable after 30 days and cannot be deleted | Growth #4 |
| **FR-7.6** | Group admin can delete the entire group, which is irreversible and removes all group data | Growth #4 |
| **FR-7.7** | Group members can view group-level analytics (spending by category, member contribution, trends) for all posted transactions | Growth #4 |
| **FR-7.8** | Personal transactions are never visible to any group — users must explicitly post to share | Growth #4 |

### 8. User Management & Platform

| ID | Requirement | Status |
|----|-------------|--------|
| **FR-8.1** | User can sign in via Google OAuth and have their data isolated in a personal data space | Delivered |
| **FR-8.2** | User has a scan credit balance that is consumed per AI scan and replenished on a defined schedule | Delivered |
| **FR-8.3** | New users can only register via invite links with caps and expiration | Growth #5 |
| **FR-8.4** | User can subscribe to a paid tier via Mercado Pago, unlocking higher scan limits, shared groups, and statement scanning | Growth #5 |
| **FR-8.5** | System gates premium features based on subscription tier | Growth #5 |
| **FR-8.6** | User can reset all their data (Factory Reset) for right-to-deletion compliance | Delivered |
| **FR-8.7** | Application is installable as a PWA with offline app shell caching and Firestore offline data persistence | Delivered |
| **FR-8.8** | Application is deployed to a staging web URL accessible from any device, using staging backend data, with new user registration blocked | Growth #1 |
| **FR-8.9** | New user receives a guided first-scan experience that demonstrates core value within 60 seconds | Vision |

### FR Coverage Validation

| Source | Covered By |
|--------|------------|
| Journey 1 (Daily Scanner) | FR-1.1, 1.4, 3.1-3.4, 6.1 |
| Journey 2 (Batch Scanner) | FR-1.2, 1.3, 1.5, 6.1-6.3 |
| Journey 3 (Group Admin) | FR-7.1-7.8 |
| Journey 4 (Statement Scanner) | FR-1.6, 1.7, 2.6 |
| Journey 5 (New User) | FR-8.3, 8.9 |
| Journey 6 (Manual Entry) | FR-1.8, 1.9 |
| Journey 7 (Analytics Explorer) | FR-4.1-4.3, 5.1-5.3, 5.5 |
| Journey 8 (AI Insight Seeker) | FR-6.6 |
| Journey 9 (Activity Checker) | FR-5.4 |
| Journey 10 (Nudge Recipient) | FR-6.4 |
| Journey 11 (Budget Setter) | FR-6.5 |
| Domain: data privacy | FR-7.8, 8.1, 8.6 |
| Scoping: staging deployment | FR-8.8 |

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Notes |
|----|-------------|-------|
| **NFR-1.1** | Single receipt scan completes (capture → AI response → review screen) in < 8 seconds on 4G connection | Current target, Gemini 2.5 Flash |
| **NFR-1.2** | Statement scan completes (upload → all transactions extracted) in < 15 seconds for a 50-transaction statement | Growth #3 target |
| **NFR-1.3** | App shell loads in < 2 seconds on first visit, < 1 second on repeat visit (service worker cache) | PWA performance |
| **NFR-1.4** | Analytics drill-down transitions render in < 500ms (chart redraws, data filtering) | Perceived performance |
| **NFR-1.5** | Transaction list pagination loads next 20 items in < 1 second | Firestore query + render |
| **NFR-1.6** | Batch scan of 7 receipts completes all background processing within 60 seconds total | Journey 2 target |
| **NFR-1.7** | Insight engine computation (sprinkle selection + phase detection) completes in < 2 seconds after transaction save | Non-blocking, can be async |

### Security

| ID | Requirement | Notes |
|----|-------------|-------|
| **NFR-2.1** | All user data is isolated by `auth.uid` in Firestore security rules — no user can read or write another user's personal data | Enforced at database level |
| **NFR-2.2** | All data in transit uses TLS 1.2+ (Firebase default) | Already enforced |
| **NFR-2.3** | Receipt images are stored in user-isolated Firebase Storage paths with security rules enforcing `auth.uid == userId` | Already enforced |
| **NFR-2.4** | Group data access is enforced by Firestore security rules: members read all posted, admins delete within 30-day window, no cross-group access | Growth #4 |
| **NFR-2.5** | All user-facing input is sanitized via `sanitizeInput()` with appropriate maxLength before storage | Hook-enforced |
| **NFR-2.6** | Auth check and data mutation occur in the same Firestore transaction (TOCTOU prevention) | Security rule |
| **NFR-2.7** | No secrets, API keys, or credentials are committed to the repository (gitleaks pre-commit + CI scan) | Already enforced |
| **NFR-2.8** | Firestore batch operations are chunked at 500 operations maximum per batch | Already enforced |
| **NFR-2.9** | Subscription tier status is stored server-side; client-side feature gating is backed by server-side verification | Growth #5 |

### Accessibility

| ID | Requirement | Notes |
|----|-------------|-------|
| **NFR-3.1** | Application targets WCAG 2.1 Level AA compliance for all interactive elements | Not yet audited |
| **NFR-3.2** | All interactive elements are keyboard-navigable with visible focus indicators | Standard requirement |
| **NFR-3.3** | Color contrast ratios meet 4.5:1 minimum for normal text, 3:1 for large text | AA standard |
| **NFR-3.4** | Camera capture provides an alternative input method (gallery selection) for users who cannot use the live camera | Already delivered |
| **NFR-3.5** | All charts and visualizations have text alternatives or tabular fallbacks for screen readers | Needs implementation |

### Reliability

| ID | Requirement | Notes |
|----|-------------|-------|
| **NFR-4.1** | Application functions offline for browsing existing data (cached transactions, analytics from last sync) via Firestore offline persistence | Already delivered |
| **NFR-4.2** | Scan failures (network, AI error) display clear error state with retry option and do not corrupt application state | Growth #1 (gallery bug fix) |
| **NFR-4.3** | Application availability matches Firebase Hosting SLA (99.95%) — no custom infrastructure to manage | Firebase-dependent |
| **NFR-4.4** | Data loss is prevented by Firestore's built-in replication; no single point of failure for stored data | Firebase guarantee |
| **NFR-4.5** | Transaction save is atomic — partial saves (merchant saved but items lost) must not occur | Firestore batch/transaction |

### Integration

| ID | Requirement | Notes |
|----|-------------|-------|
| **NFR-5.1** | Gemini AI integration handles API errors gracefully: timeout → retry once, rate limit → queue with backoff, model error → fallback to manual entry | Partially delivered |
| **NFR-5.2** | Google OAuth handles sign-in failures with user-facing error messages and retry capability | Delivered |
| **NFR-5.3** | Mercado Pago integration processes payments server-side (Cloud Function); client never handles payment credentials | Growth #5 |
| **NFR-5.4** | All external API calls have timeout limits (Gemini: 30s, Mercado Pago: 15s) and do not block the UI | Partially delivered |
| **NFR-5.5** | External service outages (Gemini, Mercado Pago) degrade gracefully — core app functionality (viewing data, analytics) remains available | Design principle |

### Internationalization

| ID | Requirement | Notes |
|----|-------------|-------|
| **NFR-6.1** | All user-facing strings are externalized via translation system (`translations.ts`), supporting Spanish (primary) and English (secondary) | Delivered |
| **NFR-6.2** | Currency display follows Chilean convention: CLP with dot separator ($187.000), USD with standard format | Delivered |
| **NFR-6.3** | Date display follows Chilean convention (DD/MM/YYYY) with locale-aware formatting | Delivered |
| **NFR-6.4** | Category taxonomy labels support Spanish display names mapped to English canonical keys for data consistency | Delivered (normalizer) |
