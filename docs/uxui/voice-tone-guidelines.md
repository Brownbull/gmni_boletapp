# Boletapp Voice & Tone Guidelines

> **Document Version:** 1.0
> **Created:** 2025-12-23
> **Epic:** 13 - UX Design & Mockups
> **Story:** 13.2 - Voice & Tone Guidelines

---

## Executive Summary

Boletapp's voice is that of a **wise, non-judgmental friend** who observes your spending patterns without criticism, reveals opportunities without guilt, and celebrates your progress without condescension. The app speaks with **curiosity rather than authority**, using Chilean Spanish naturally and accessibly.

**Core Philosophy:** "Mirror, not judge" - We reflect what the data shows; the user decides what it means.

---

## The 5 Voice Principles

### 1. Observes Without Judging

**Philosophy:** State facts, not opinions. Let the user assign meaning.

| Do | Don't |
|----|-------|
| "Restaurants up 23%" | "You overspent on restaurants" |
| "Three Uber Eats orders this week" | "You're ordering too much takeout" |
| "Coffee spending doubled since October" | "Your coffee habit is getting expensive" |
| "First time at this store" | "Another new store?" |

**Example Messages:**

1. **Insight Card:** "Restaurantes: +23% vs. semana pasada"
2. **Alert:** "Esta categoría está 15% más alta que tu promedio"
3. **Observation:** "3 compras en supermercados diferentes esta semana"

**Implementation Note:** Never use words like "overspent," "too much," "expensive," or "should" when describing user behavior.

---

### 2. Reveals Opportunity

**Philosophy:** Show trade-offs without guilt. Connect spending to goals.

| Do | Don't |
|----|-------|
| "This week's coffee = 1 day further from Tokyo" | "You could have saved this money" |
| "Restaurant spending this month = 2 weeks closer to new MacBook" | "You wasted money on restaurants" |
| "Uber trips = 3% of your Japan fund" | "Stop taking Uber" |

**Example Messages:**

1. **Goal Connection:** "Cafecitos de esta semana: $13.500 = 1 día más lejos de Tokio"
2. **Trade-off:** "Delivery este mes = 5% de tu fondo de emergencia"
3. **Perspective:** "Lo que gastaste en apps = el equivalente a 2 meses de streaming"

**Implementation Note (Epic 15):** Goal-connected insights require the user to have an active goal. Without goals, use comparative framing (vs. last month, vs. average).

---

### 3. Invites Experimentation

**Philosophy:** Suggest possibilities, don't prescribe solutions.

| Do | Don't |
|----|-------|
| "What if you tried...?" | "You should try..." |
| "Some users find it helpful to..." | "The best approach is..." |
| "Curious what would happen if...?" | "You need to change..." |
| "Ever considered...?" | "The problem is..." |

**Example Messages:**

1. **Suggestion:** "¿Qué pasaría si probaras cocinar una noche más por semana?"
2. **Invitation:** "Algunos usuarios agrupan sus compras de supermercado. ¿Curioso?"
3. **Exploration:** "¿Te has preguntado cuánto gastarías si...?"

**Implementation Note (Epic 15):** Experimental suggestions appear only after 4+ weeks of data. Never suggest behavioral changes during the first month.

---

### 4. Celebrates Progress

**Philosophy:** Highlight wins, however small. Acknowledge effort.

| Do | Don't |
|----|-------|
| "Your lowest restaurant week in 3 months!" | Generic "Good job!" |
| "First week under $50k in groceries since September" | "You did okay" |
| "3 consecutive days without delivery orders" | "Keep it up!" |
| "You've tracked 15 receipts this month - new record!" | "Nice work" |

**Example Messages:**

1. **Personal Record:** "Tu semana más baja en restaurantes en 3 meses"
2. **Milestone:** "Primera semana bajo $50k en supermercado desde septiembre"
3. **Streak:** "3 días seguidos sin delivery - eso es nuevo"
4. **Engagement:** "15 boletas escaneadas este mes - récord personal"
5. **Goal Progress:** "3 días más cerca de Japón que la semana pasada"

**Implementation Note (Epic 14):** Celebrations must be specific and data-backed. No generic praise. Personal records require 8+ weeks of historical data for comparison.

---

### 5. Normalizes Setbacks

**Philosophy:** Life happens. Data reflects reality, not failure.

| Do | Don't |
|----|-------|
| "La vida es rara. Los datos también." | "You failed to meet your goal" |
| "Eso es diferente para ti" (unusual, not wrong) | "You went over budget" |
| "December is expensive for everyone" | "You lost control of spending" |
| "Holidays look different" | "You overspent during holidays" |

**Example Messages:**

1. **Normalization:** "Diciembre es caro para todos. Tus datos reflejan la realidad."
2. **Neutral Observation:** "Esta semana fue diferente a tu patrón normal"
3. **Life Happens:** "Los pulpos tienen 3 corazones y sangre azul. La vida es rara. Los datos también."
4. **Reframe:** "El mes terminó distinto a lo planeado. ¿Fue intencional?"
5. **Compassion:** "Las emergencias no piden permiso. Tus datos simplemente lo muestran."

**Implementation Note:** Setback messages never assign blame. They acknowledge reality and invite reflection.

---

## Message Categories & Templates

### Insight Messages

Pattern observations, trade-off notifications, and trend alerts.

| Type | Template | Example |
|------|----------|---------|
| **Trend Up** | "[Category] subió [X]% esta semana" | "Restaurantes subió 23% esta semana" |
| **Trend Down** | "[Category] bajó [X]% - tu semana más baja en [Y] meses" | "Supermercado bajó 15% - tu semana más baja en 2 meses" |
| **Pattern Detected** | "Detectamos que [pattern]" | "Detectamos que tus domingos son para delivery" |
| **Trade-off** | "[Spending] = [goal impact]" | "Café de la semana = 2 días más lejos de tu meta" |
| **New Merchant** | "Primera vez en [merchant]. ¿Nueva favorita?" | "Primera vez en Jumbo. ¿Nueva favorita?" |
| **Unusual Hour** | "Compra a las [time]. ¿Noche de antojo?" | "Compra a las 23:45. ¿Noche de antojo?" |

---

### Alert Messages

Budget proximity and out-of-character spending.

| Type | Template | Example (75%) | Example (90%) | Example (100%) |
|------|----------|---------------|---------------|----------------|
| **Budget Proximity** | "Llevas [X]% de tu límite en [category]" | "Llevas 75% de tu límite en restaurantes" | "Llevas 90% de tu límite - casi al tope" | "Alcanzaste tu límite en restaurantes" |
| **Out-of-Character** | "Esto es diferente para ti: [observation]" | N/A | N/A | "Esto es diferente para ti: 3x más en entretenimiento que tu promedio" |
| **Velocity Alert** | "A este ritmo, alcanzarás el límite en [X] días" | "A este ritmo, alcanzarás el límite en 5 días" | "A este ritmo, el límite se alcanza mañana" | N/A |

**Progressive Disclosure for Alerts:**

1. **75%:** Soft reminder, observational tone
2. **90%:** More prominent, still neutral
3. **100%:** Factual statement, no judgment

---

### Celebration Messages

Personal records, goal milestones, and consistency streaks.

| Type | Template | Example |
|------|----------|---------|
| **Personal Record** | "¡Tu [metric] más [low/high] en [X] meses!" | "¡Tu semana más baja en restaurantes en 3 meses!" |
| **Goal Milestone** | "[X]% más cerca de [goal]" | "5% más cerca de Japón" |
| **Streak** | "[X] días/semanas consecutivos de [behavior]" | "3 semanas consecutivas bajo tu promedio" |
| **First Time** | "Primera vez que [achievement]" | "Primera vez que todas las categorías están bajo el promedio" |
| **Engagement** | "[X] boletas este mes - récord personal" | "20 boletas este mes - récord personal" |

**Celebration Intensity Scale:**

- **Small win:** Text-only acknowledgment
- **Medium win:** Text + subtle animation
- **Big win:** Text + confetti + haptic feedback (optional)

---

### Setback Messages

Budget exceeded, goal delayed, and pattern disruption.

| Type | Template | Example |
|------|----------|---------|
| **Budget Exceeded** | "Pasaste el límite en [category]. La vida sigue." | "Pasaste el límite en restaurantes. La vida sigue." |
| **Goal Delayed** | "Tu meta se movió [X] días. ¿Fue intencional?" | "Tu meta de Japón se movió 5 días. ¿Fue intencional?" |
| **Pattern Disruption** | "Esta semana fue diferente. A veces pasa." | "Esta semana fue muy diferente a tu patrón. A veces pasa." |
| **Emergency Spending** | "Gasto inesperado registrado. Las emergencias no avisan." | "Gasto grande registrado. Las emergencias no avisan." |

**Setback Response Options:**

Always offer two non-judgmental options:
1. "Fue intencional" (I meant to do this)
2. "No me había dado cuenta" (I didn't realize)

**Implementation Note: "Intentional or Accidental?" Pattern Scope**

The "Fue intencional" / "No me había dado cuenta" response pattern applies to:
- **Setback Messages**: When limits are exceeded
- **Trend Alerts**: When significant changes detected (e.g., Weekly Health Check "Restaurants up 23%")
- **Out-of-Character Detection**: Via Emotional Airlock flow (Epic 15)

Not used for: Celebrations, System Messages, or neutral observations.

---

### System Messages

Loading, error, and empty states.

| Type | Standard Version | Rosa-Friendly Version |
|------|------------------|----------------------|
| **Loading** | "Procesando tu boleta..." | "Un momentito..." |
| **Processing** | "Analizando los detalles..." | "Leyendo tu boleta..." |
| **Success** | "¡Listo! Boleta guardada." | "¡Guardado!" |
| **Error - Generic** | "Algo salió mal. Intenta de nuevo." | "Ups, algo falló. ¿Lo intentamos de nuevo?" |
| **Error - Network** | "Sin conexión. Se guardará cuando vuelvas online." | "Sin internet. Cuando vuelvas, se guarda solito." |
| **Error - Image** | "No pudimos leer esta imagen. ¿Otra foto?" | "No se ve bien. ¿Otra foto?" |
| **Empty State - First** | "Tu primera boleta te espera" | "Escanea tu primera boleta" |
| **Empty State - No Data** | "Sin transacciones este período" | "Nada que mostrar por ahora" |
| **Empty State - Filtered** | "Sin resultados para estos filtros" | "Nada con estos filtros" |

---

## Rosa-Friendly Alternatives

### Technical Message Translations

Rosa (62, Valparaíso) represents users who prefer simple, direct language over technical terms.

| Technical/Standard | Rosa-Friendly |
|--------------------|---------------|
| "Análisis completo disponible" | "Listo para ver" |
| "Sincronizando con el servidor" | "Guardando en la nube" |
| "Procesando imagen con IA" | "Leyendo tu boleta" |
| "Exportar datos a CSV" | "Descargar lista" |
| "Configuración de notificaciones" | "Avisos" |
| "Autenticación requerida" | "Inicia sesión de nuevo" |
| "Transacción duplicada detectada" | "Esta boleta ya existe" |
| "Categoría sin asignar" | "¿Qué tipo de gasto es?" |
| "Umbral de presupuesto" | "Límite de gasto" |
| "Patrón de comportamiento" | "Tu costumbre" |

### Visual Simplifications for Rosa

| Complex | Simple |
|---------|--------|
| Percentage changes | Arrows: ↑ subió, ↓ bajó, → igual |
| "Incrementó 27%" | "Subió harto" |
| "Decrementó 15%" | "Bajó un poco" |
| Multi-series charts | Single comparison |
| "Análisis de tendencias" | "Cómo viene el mes" |

---

## Chilean Spanish Language Adaptation

### Regional Expressions

| Standard Spanish | Chilean Adaptation | When to Use |
|------------------|-------------------|-------------|
| "Incrementó 27%" | "Subió harto" | Casual insight messages |
| "Decreció 15%" | "Bajó un poco" | Casual insight messages |
| "¿Fue intencional?" | "¿Lo tenías planeado?" | Reflection prompts |
| "Excelente trabajo" | "¡La hiciste!" | Celebrations |
| "Continuar" | "Dale" | Button labels |
| "Cancelar" | "Mejor no" | Button labels (casual) |
| "Configuración" | "Ajustes" | Navigation |
| "Procesando" | "Un momento..." | Loading states |

### Playful Guesses

When the app makes educated guesses based on patterns:

| Context | Playful Guess |
|---------|---------------|
| Meat spending up | "¿Asado familiar?" |
| Weekend restaurant spending | "¿Junta de amigos?" |
| December spending spike | "¿Regalos de Navidad?" |
| Pharmacy purchase | "¿Todo bien?" (concerned, not prying) |
| Multiple grocery stores | "¿Buscando ofertas?" |

### Words to Avoid

These words create negative emotional associations:

| Avoid | Use Instead |
|-------|-------------|
| "Gastaste" (wasted/spent - ambiguous) | "Registramos" (recorded) |
| "Exceso" (excess) | "Más de lo usual" (more than usual) |
| "Problema" (problem) | "Algo diferente" (something different) |
| "Deuda" (debt) | "Pendiente" (pending) |
| "Malo" (bad) | "Diferente" (different) |
| "Error tuyo" (your mistake) | "Algo pasó" (something happened) |

---

## Tone by Context

### Tone Spectrum

```
Formal ←──────────────────────────────────→ Casual
         Settings   Alerts   Insights   Celebrations
```

| Context | Tone | Example |
|---------|------|---------|
| **Settings/Legal** | Professional, clear | "Tu información se guarda de forma segura" |
| **Onboarding** | Warm, encouraging | "¡Bienvenido! Esto será fácil, prometido." |
| **Daily Insights** | Conversational, curious | "Lunes de pizza, ¿tradición nueva?" |
| **Celebrations** | Enthusiastic, genuine | "¡Semana récord! 🎉" |
| **Setbacks** | Compassionate, matter-of-fact | "Semana diferente. La vida es así." |
| **Errors** | Calm, helpful | "Algo falló, pero lo resolvemos juntos." |
| **Alerts** | Neutral, informative | "Llevas 80% de tu límite mensual" |

### Emoji Usage Guidelines

| Use Case | Emoji Policy | Example |
|----------|--------------|---------|
| Celebrations | Allowed, sparingly | "¡Récord! 🎉" |
| Categories | Category icons only | "🍕 Delivery" |
| Alerts | No emojis | "Límite alcanzado" |
| Errors | No emojis | "Algo falló" |
| Buttons | No emojis | "Guardar" |
| Goal visuals | Goal emoji only | "🗾 Japón" |

---

## Emotional Airlock Pattern

For delivering potentially uncomfortable truths (out-of-character spending).

### The 3-Step Sequence

**Step 1: Curiosity Gate** (Normalize the blind spot)
> "¿Sabías que el 73% de las personas subestiman cuánto gastan en delivery?"

**Step 2: Playful Brace** (Disarm defensiveness)
> "Los pulpos tienen 3 corazones y sangre azul. La vida es rara. Los datos también."

**Step 3: The Reveal** (Mirror, not judge)
> "Tu Espejo Honesto: Esta semana gastaste 3x más en entretenimiento que tu promedio. Eso es diferente para ti."

### Response Options

Always provide two non-judgmental options:

| Option | Meaning | Next Action |
|--------|---------|-------------|
| "Fue intencional" | User is aware, intentional decision | Acknowledge, no follow-up |
| "No me había dado cuenta" | User wants awareness | Offer tracking/reminder |

---

## Writing Checklist

Before finalizing any user-facing text, verify:

- [ ] **No judgment words** (overspent, wasted, problem, bad, failure)
- [ ] **Observational tone** (facts, not opinions)
- [ ] **Rosa-friendly option available** (simple alternative exists)
- [ ] **Chilean Spanish natural** (not textbook Spanish)
- [ ] **Specific, not generic** (data-backed, not "good job")
- [ ] **Appropriate tone for context** (see tone spectrum)
- [ ] **Emoji usage follows guidelines**
- [ ] **Response options are non-judgmental**

---

## Quick Reference Card

### The 5 Principles at a Glance

| Principle | Key Phrase | Never Say |
|-----------|------------|-----------|
| Observes without judging | "The data shows..." | "You overspent..." |
| Reveals opportunity | "This equals..." | "You should have..." |
| Invites experimentation | "What if...?" | "You need to..." |
| Celebrates progress | "Your [specific] record!" | "Good job" |
| Normalizes setbacks | "Life is like that" | "You failed to..." |

### Most Common Message Patterns

| Situation | Template |
|-----------|----------|
| Category trend up | "[Category] subió [X]% esta semana" |
| Personal record | "¡Tu [metric] más baja en [X] meses!" |
| Goal connection | "[Spending] = [X] días [closer/further] de [goal]" |
| Setback | "[Observation]. ¿Fue intencional?" |
| Celebration | "¡[Specific achievement]!" |

---

## Use Case Mapping

This table maps voice guidelines to the critical use cases documented in [use-cases-e2e.md](./use-cases-e2e.md):

| Use Case | Status | Relevant Message Categories |
|----------|--------|----------------------------|
| UC1: First Scan | 🟢 CURRENT | System Messages, Celebration Messages |
| UC2: Weekly Health Check | 🟡 FUTURE | Insight Messages, Alert Messages, "Intentional?" pattern |
| UC3: Goal Progress | 🟡 FUTURE | Insight Messages (Trade-off), Celebration Messages |
| UC4: Simple Summary | 🟡 FUTURE | All Rosa-friendly alternatives, Simple arrows |
| UC5: Out-of-Character Alert | 🟡 FUTURE | Emotional Airlock pattern, Setback Messages |
| UC6: Batch Scan | 🟢 CURRENT | System Messages, Celebration Messages |
| UC7: Trust Merchant | 🟢 CURRENT | System Messages (confirmations) |
| UC8: Insight Discovery | 🟢 CURRENT | Insight Messages, Celebration Messages |

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-23 | 1.0 | Initial creation based on Epic 13 brainstorming session |
| 2025-12-23 | 1.1 | Atlas Code Review - Added epic context to implementation notes, use case mapping, pattern scope clarification, CLP formatting fix |

---

## Related Documents

- [UX Design Specification - Section 10.2](../ux-design-specification.md#102-the-boletapp-voice)
- [Brainstorming Session 2025-12-22](../analysis/brainstorming-session-2025-12-22.md)
- [Critical Use Cases E2E](./use-cases-e2e.md)
