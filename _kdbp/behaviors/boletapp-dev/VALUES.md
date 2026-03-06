# Values: boletapp-dev

Version: 1.0.0
Last Updated: 2026-03-05

---

## V1: Actionable Resolution

### THE INTENT
Every feature that shows spending data must reach item level. Store-level totals are not enough — the user needs to see what they bought, not just where they bought it.

### THE ANALOGY
A microscope vs. binoculars. Binoculars show you the mountain; the microscope shows you the cells. BoletApp is the microscope for spending — if you can't see individual items, you can't see the pattern.

### ANALOGY LIMITS
Not every view needs maximum zoom. Summary views are valid as long as drill-down to item level is always available.

### CONSTRAINT BOX
IS:     Every spending feature reaches item-level granularity
IS NOT: A mandate that every screen shows items (summaries are fine if drill-down exists)
RISK:   Over-indexing on item detail at the cost of usability

### ONE-LINE HANDLE
"Can they see the items, not just the total?"

### ALIGNMENT TESTS
1. Does this feature show spending data? If yes, can the user reach individual items?
2. Would removing item-level detail from this feature reduce the user's ability to spot patterns?
3. Is the item data accurate enough to be actionable (V2 cross-check)?

### EVALUATION ALTITUDE
Story level — check on every story that touches spending display.

---

## V2: Truthful Data

### THE INTENT
When speed conflicts with accuracy, protect accuracy. The user must be able to trust every number they see. A wrong number is worse than a slow number.

### THE ANALOGY
A scale that's always right vs. a scale that's fast. If you step on a scale and it shows your weight instantly but it's off by 5kg, you'll never trust it again. BoletApp's data must be the scale you'd bet money on.

### ANALOGY LIMITS
Perfection isn't the goal — reasonable accuracy is. OCR will have errors. The system should surface uncertainty rather than hide it.

### CONSTRAINT BOX
IS:     Accuracy over speed; surface uncertainty; duplicate detection
IS NOT: Perfection mandate (OCR errors are expected — flag them, don't hide them)
RISK:   Over-validating to the point of friction (slowing the user down for marginal accuracy)

### ONE-LINE HANDLE
"Would you bet money on this number?"

### ALIGNMENT TESTS
1. If this number is wrong, would the user make a bad financial decision?
2. Does the system surface its confidence level when uncertain?
3. Are duplicates detected and flagged before they corrupt totals?

### EVALUATION ALTITUDE
Session level — check every session that touches data accuracy or processing.

---

## V3: Financial Sovereignty

### THE INTENT
The user's financial data belongs to them. Default is closed. Sharing is copy-based (the receiver gets a copy, not access to the original). Privacy breach is existential risk.

### THE ANALOGY
A safe deposit box. The bank holds it, but only you have the key. You can photocopy a document and give the copy to someone, but they never get access to the box itself.

### ANALOGY LIMITS
Unlike a physical safe, digital copies are perfect. The system must be clear about what "sharing a copy" means in practice.

### CONSTRAINT BOX
IS:     Default closed; copy-based sharing; user controls all access
IS NOT: A ban on sharing (sharing is supported, but always user-initiated and copy-based)
RISK:   Making sharing so restricted that household use cases (V7) become impractical

### ONE-LINE HANDLE
"Your money story is yours to tell"

### ALIGNMENT TESTS
1. Is the default for this feature CLOSED until the user explicitly opens it?
2. Does sharing create a copy, or does it grant access to the original?
3. Could a privacy failure in this feature cause users to abandon the app?

### EVALUATION ALTITUDE
Story level — check on every story touching multi-user or shared data.

---

## V4: Gravitational Detection

### THE INTENT
The system detects spending gravity centers — places where money pools, recurs, or accelerates abnormally. It ranks them by magnitude. It never judges whether they're good or bad. The user classifies each detection as expected or not expected, and optionally sets limits. That's it.

### THE ANALOGY
A gravitational wave detector. It scans the spending surface looking for mass concentrations — irregularities in what should be a smooth surface. When it finds a black hole (money sink), it flags it. The detector doesn't care what the black hole is made of, only that it pulls.

### ANALOGY LIMITS
Gravity is neutral in physics; in spending, users may have emotional reactions to detections. The system stays neutral, but the UI must present detections without alarm or shame.

### CONSTRAINT BOX
IS:     Detection and ranking of spending anomalies; user classification (expected/not expected)
IS NOT: Advice, coaching, recommendations, or judgment about spending patterns
RISK:   Detection that feels like judgment (tone, framing, frequency of notifications)

### ONE-LINE HANDLE
"Detect the black holes, don't judge them"

### ALIGNMENT TESTS
1. Does this feature detect a pattern, or prescribe a response?
2. Can the user dismiss the detection as "expected" with one action?
3. Is the system silent about what the user SHOULD DO about it?

### EVALUATION ALTITUDE
Story level — check on every analytics or pattern-detection feature.

---

## V5: Effortless Path to Awareness

### THE INTENT
The effort required to get financial visibility must be radically lower than manual alternatives. If scanning a receipt takes more effort than stuffing it in a drawer, users will stuff it in a drawer.

### THE ANALOGY
A toll-free highway vs. a dirt road. Both get you to visibility, but the toll-free highway removes every possible friction point. No stopping, no manual gates, no re-entry.

### ANALOGY LIMITS
"Effortless" doesn't mean zero effort — it means the effort is proportional to the value. Scanning 50 receipts will never be instant, but it should be as close to "point and done" as possible.

### CONSTRAINT BOX
IS:     Radical friction reduction for data entry (scanning, categorization, review)
IS NOT: Dumbing down the product (power features stay, but the default path is simple)
RISK:   Optimizing for speed at the cost of accuracy (V2 cross-check)

### ONE-LINE HANDLE
"Easier than the receipt drawer"

### ALIGNMENT TESTS
1. Is this workflow faster than the manual alternative?
2. Could a less tech-savvy user complete this without help?
3. Does reducing friction here compromise data accuracy (V2)?

### EVALUATION ALTITUDE
Story level — check on every story touching scanning, data entry, or onboarding.

---

## V7: Collective Financial Clarity

### THE INTENT
Households need shared financial visibility. A single-user expense tracker doesn't serve families where spending is collective. Shared groups are a deal-breaker feature for household adoption.

### THE ANALOGY
A shared dashboard in a car. Both driver and passenger can see the speedometer. Neither controls the other's driving, but both see the same reality. The dashboard doesn't choose who sees what — the users decide.

### ANALOGY LIMITS
Household finances are more complex than a dashboard — there are power dynamics, privacy needs, and asymmetric access. When shared features conflict with privacy (V3), privacy wins.

### CONSTRAINT BOX
IS:     Shared financial visibility for households and groups
IS NOT: A social network for finances (no feeds, no comments, no public sharing)
RISK:   Privacy erosion through shared features (V3 takes precedence when they conflict)

### ONE-LINE HANDLE
"Where does OUR money go?"

### ALIGNMENT TESTS
1. Does this shared feature preserve individual privacy (V3 cross-check)?
2. Can each participant control what they share and what they see?
3. Does the shared view reach item-level granularity (V1 cross-check)?

### EVALUATION ALTITUDE
Epic level — check at epic planning when shared/group features are scoped.
