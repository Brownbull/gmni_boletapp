# Gastify - Habit Loop Implementation Guide

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Implementation Specification

---

## Overview

This document provides the complete implementation specification for Gastify's habit-forming mechanics. Based on Nir Eyal's Hook Model, adapted for ethical financial habit building.

**Core Principle:** Create habits around expense awareness, not app addiction. Every mechanic should pass the "Abuelita Test" - would this feel helpful to a Chilean grandmother managing household expenses?

---

## The Hook Model Framework

```
┌─────────────────────────────────────────────────────────────┐
│                     THE HABIT LOOP                          │
│                                                             │
│    ┌──────────┐      ┌──────────┐      ┌──────────────┐    │
│    │ TRIGGER  │ ───► │  ACTION  │ ───► │   VARIABLE   │    │
│    │          │      │          │      │    REWARD    │    │
│    └──────────┘      └──────────┘      └──────────────┘    │
│          ▲                                    │             │
│          │           ┌──────────────┐         │             │
│          └────────── │  INVESTMENT  │ ◄───────┘             │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

Each loop strengthens the next. The more users invest, the stronger their triggers become.

---

## 1. TRIGGERS

Triggers prompt users to take action. Gastify uses both external and internal triggers.

### 1.1 External Triggers (System-Initiated)

#### Trigger Type: Scan Complete Notification

**When:** Immediately after receipt processing finishes (2-5 seconds after scan)

**Implementation:**
```typescript
interface ScanCompleteNotification {
  type: 'scan_complete';
  merchant: string;
  amount: number;
  insight: InsightPayload;
  timestamp: Date;
}

interface InsightPayload {
  type: 'merchant_total' | 'new_merchant' | 'biggest_purchase' | 'repeat_category' | 'category_frequency';
  message: string;
  emoji?: string;
}
```

**Notification Logic (Priority Order):**

| Priority | Condition | Message Template |
|----------|-----------|------------------|
| 1 | New merchant (first time) | "✓ Primera boleta de {merchant}. Categorizado como {category}" |
| 2 | Biggest purchase this week | "✓ Guardado. Es tu compra más grande de la semana" |
| 3 | Repeat category same day | "✓ {ordinal} boleta de {category} hoy" |
| 4 | Known merchant | "✓ Guardado. Llevas {monthTotal} en {merchant} este mes" |
| 5 | Default | "✓ Guardado en {category}" |

**Code Example:**
```typescript
function generateScanCompleteInsight(
  transaction: Transaction,
  userHistory: TransactionHistory
): InsightPayload {
  
  // Priority 1: New merchant
  const merchantHistory = userHistory.getByMerchant(transaction.merchant);
  if (merchantHistory.length === 0) {
    return {
      type: 'new_merchant',
      message: `Primera boleta de ${transaction.merchant}. Categorizado como ${transaction.category}`,
      emoji: '🆕'
    };
  }
  
  // Priority 2: Biggest purchase this week
  const weekPurchases = userHistory.getThisWeek();
  const isBiggest = transaction.total > Math.max(...weekPurchases.map(t => t.total));
  if (isBiggest && weekPurchases.length >= 3) {
    return {
      type: 'biggest_purchase',
      message: 'Es tu compra más grande de la semana',
      emoji: '📈'
    };
  }
  
  // Priority 3: Repeat category same day
  const todayInCategory = userHistory.getTodayByCategory(transaction.category);
  if (todayInCategory.length > 0) {
    const ordinal = getSpanishOrdinal(todayInCategory.length + 1);
    return {
      type: 'repeat_category',
      message: `${ordinal} boleta de ${transaction.category} hoy`,
      emoji: '🔄'
    };
  }
  
  // Priority 4: Known merchant running total
  const monthTotal = userHistory.getMonthTotalByMerchant(transaction.merchant);
  return {
    type: 'merchant_total',
    message: `Llevas ${formatCurrency(monthTotal)} en ${transaction.merchant} este mes`,
    emoji: '📊'
  };
}
```

---

#### Trigger Type: Weekly Digest

**When:** Sunday 7:00 PM or Monday 8:00 AM (user preference)

**Frequency:** Once per week, opt-in

**Implementation:**
```typescript
interface WeeklyDigestNotification {
  type: 'weekly_digest';
  weekStart: Date;
  weekEnd: Date;
  totalSpent: number;
  vsLastWeek: number; // percentage change
  topCategory: {
    name: string;
    amount: number;
    percentage: number;
  };
  transactionCount: number;
}
```

**Notification Message:**
```
"Tu semana en 3 segundos: {total} total. {topCategory} fue el rey {emoji}"
```

**Emoji Selection Logic:**
```typescript
const categoryEmojis: Record<string, string> = {
  'Supermercado': '🛒',
  'Restaurante': '🍽️',
  'Transporte': '🚗',
  'Entretenimiento': '🎬',
  'Salud': '💊',
  'Shopping': '🛍️',
  'Servicios': '📱',
  'Otro': '📦'
};
```

---

#### Trigger Type: Monthly Milestone

**When:** Last day of month, 6:00 PM

**Frequency:** Once per month

**Implementation:**
```typescript
interface MonthlyMilestoneNotification {
  type: 'monthly_milestone';
  month: string;
  year: number;
  totalSpent: number;
  vsLastMonth: number;
  topCategories: CategorySummary[];
  totalReceipts: number;
  insight: string;
}
```

**Notification Message:**
```
"Tu resumen de {month} está listo 📊"
```

**Celebration Logic:**
```typescript
function generateMonthlyInsight(current: MonthData, previous: MonthData): string {
  const percentChange = ((current.total - previous.total) / previous.total) * 100;
  
  if (percentChange < -10) {
    return `¡Felicitaciones! Gastaste ${Math.abs(percentChange).toFixed(0)}% menos que el mes pasado 🎉`;
  } else if (percentChange < 0) {
    return `Gastaste un poco menos que el mes pasado. ¡Vas bien! 👍`;
  } else if (percentChange < 10) {
    return `Tu gasto se mantuvo similar al mes pasado`;
  } else {
    return `Este mes gastaste más que el anterior. Revisa las categorías para entender por qué.`;
  }
}
```

---

### 1.2 Internal Triggers (User-Initiated)

Internal triggers develop over time as users associate moments with the app.

**Target Internal Triggers:**

| Moment | Desired Thought | How We Build This |
|--------|-----------------|-------------------|
| Leaving a store | "Debo escanear esta boleta" | Post-scan rewards, Quick Save mode |
| End of day | "¿Cuánto gasté hoy?" | Daily total visibility on dashboard |
| Payday | "Veamos cómo me fue este mes" | Monthly reports, trend visibility |
| Feeling anxious about money | "Voy a revisar mis gastos" | Empowering insights, no judgment |

**Building Internal Triggers:**

```typescript
// Track user behavior patterns to understand when triggers form
interface UserBehaviorMetrics {
  averageTimeBetweenScans: number; // in hours
  preferredScanTime: string; // "morning" | "afternoon" | "evening" | "night"
  scanDaysOfWeek: number[]; // 0-6
  dashboardViewsPerWeek: number;
  analyticsViewsPerWeek: number;
}

// Use this data to:
// 1. Optimize notification timing
// 2. Understand which triggers are forming
// 3. Identify users at churn risk (no internal triggers forming)
```

---

## 2. ACTION

The action must be simpler than the motivation. Reduce friction at every step.

### 2.1 Current Action Flow (Baseline)

```
Open App (3 sec) → Navigate to Scan (2 sec) → Take Photo (3 sec) → 
Wait for AI (3-5 sec) → Review 20+ items (30-60 sec) → Save (1 sec)
─────────────────────────────────────────────────────────────────
Total: 42-74 seconds
```

### 2.2 Optimized Action Flow (Phase 1)

**Quick Save Mode:**
```
Open App (3 sec) → Tap Scan (1 sec) → Take Photo (3 sec) → 
Wait for AI (3-5 sec) → See Summary Card (1 sec) → Tap Save (1 sec)
───────────────────────────────────────────────────────────────────
Total: 12-14 seconds (5x faster)
```

**Implementation:**
```typescript
interface QuickSaveCard {
  merchant: string;
  total: number;
  itemCount: number;
  category: string;
  confidence: number; // 0-1, AI confidence score
  showQuickSave: boolean; // true if confidence > 0.85
}

function shouldShowQuickSave(
  scanResult: ScanResult,
  merchantHistory: MerchantHistory
): boolean {
  // Show Quick Save if:
  // 1. AI confidence is high (>85%)
  // 2. Merchant has been scanned before with no edits
  // 3. All required fields are present
  
  const hasHighConfidence = scanResult.confidence > 0.85;
  const isTrustedMerchant = merchantHistory.editRate < 0.1; // <10% edit rate
  const hasAllFields = scanResult.merchant && scanResult.total && scanResult.date;
  
  return hasHighConfidence && (isTrustedMerchant || merchantHistory.count === 0) && hasAllFields;
}
```

### 2.3 Friction Reducers

#### Home Screen Widget (Phase 2)
```
Tap Widget → Camera Opens → Scan → Quick Save
──────────────────────────────────────────────
Total: 8-10 seconds
```

#### Batch Scanning Mode (Phase 2)
```
Open App → Tap Batch Mode → Scan 5 receipts → Review all summaries → Save all
──────────────────────────────────────────────────────────────────────────────
Total: 60 seconds for 5 receipts (12 sec each vs 42-74 sec each)
```

**Implementation:**
```typescript
interface BatchScanSession {
  id: string;
  receipts: PendingScan[];
  startedAt: Date;
  status: 'scanning' | 'processing' | 'reviewing' | 'complete';
}

interface PendingScan {
  imageBase64: string;
  scanResult?: ScanResult;
  status: 'pending' | 'processing' | 'ready' | 'saved' | 'error';
  quickSaveEligible: boolean;
}
```

---

## 3. VARIABLE REWARD

The reward must be unpredictable enough to create anticipation, but always positive.

### 3.1 Reward Types

#### Reward Category: Insights

Insights are the primary reward. They answer: "What did I learn?"

**Insight Generation Engine:**
```typescript
type InsightType = 
  | 'frequency'          // "3ra boleta de restaurante esta semana"
  | 'merchant_concentration' // "40% de tu gasto es en Líder"
  | 'day_pattern'        // "Gastas 3x más los fines de semana"
  | 'time_pattern'       // "Compras de noche cuestan 25% más"
  | 'category_growth'    // "Restaurante subió 40% vs mes pasado"
  | 'merchant_comparison' // "Jumbo vs Líder: 15% menos en Líder"
  | 'velocity'           // "Esta semana gastas más rápido"
  | 'milestone'          // "¡Primer mes completo!"
  | 'improvement';       // "Gastaste menos en X que el mes pasado"

interface Insight {
  type: InsightType;
  message: string;
  emoji: string;
  confidence: number; // Only show if >0.7
  dataPoints: number; // Minimum data points needed
  priority: number;   // For ranking when multiple insights available
}
```

**Insight Generation Rules:**
```typescript
const insightRules: InsightRule[] = [
  {
    type: 'frequency',
    condition: (ctx) => ctx.categoryCountThisWeek >= 3,
    generate: (ctx) => ({
      message: `${ordinal(ctx.categoryCountThisWeek)} boleta de ${ctx.category} esta semana`,
      emoji: '🔄',
      priority: 3
    }),
    minDataPoints: 3
  },
  {
    type: 'merchant_concentration',
    condition: (ctx) => ctx.merchantPercentage >= 0.35,
    generate: (ctx) => ({
      message: `El ${(ctx.merchantPercentage * 100).toFixed(0)}% de tu gasto es en ${ctx.topMerchant}`,
      emoji: '🎯',
      priority: 5
    }),
    minDataPoints: 10
  },
  {
    type: 'day_pattern',
    condition: (ctx) => ctx.weekendVsWeekdayRatio >= 2,
    generate: (ctx) => ({
      message: `Gastas ${ctx.weekendVsWeekdayRatio.toFixed(0)}x más en ${ctx.category} los fines de semana`,
      emoji: '📅',
      priority: 7
    }),
    minDataPoints: 20
  },
  {
    type: 'improvement',
    condition: (ctx) => ctx.monthOverMonthChange <= -0.1,
    generate: (ctx) => ({
      message: `¡Gastaste ${Math.abs(ctx.monthOverMonthChange * 100).toFixed(0)}% menos en ${ctx.category} que el mes pasado!`,
      emoji: '🎉',
      priority: 10 // Highest priority - always show wins
    }),
    minDataPoints: 15
  }
];

function selectInsight(context: InsightContext): Insight | null {
  const eligibleInsights = insightRules
    .filter(rule => rule.condition(context))
    .filter(rule => context.totalTransactions >= rule.minDataPoints)
    .map(rule => rule.generate(context))
    .sort((a, b) => b.priority - a.priority);
  
  return eligibleInsights[0] || null;
}
```

### 3.2 Reward Timing

**Immediate Rewards (0-5 seconds after action):**
- Scan complete confirmation
- One micro-insight
- Animation feedback

**Delayed Rewards (hours/days later):**
- Weekly digest with accumulated insights
- Monthly milestone celebration
- Pattern discoveries

**Unpredictable Element:**
The specific insight shown is unpredictable (variable), but the fact that there WILL be an insight is predictable (reliable). This creates healthy anticipation without anxiety.

### 3.3 Reward Presentation

**Visual Hierarchy:**
```
┌─────────────────────────────────────────┐
│  ✓ Guardado                             │  ← Confirmation (always)
│                                         │
│  💡 Llevas $47.200 en Líder este mes   │  ← Insight (variable)
│                                         │
│     [Ver más]              [Cerrar]     │
└─────────────────────────────────────────┘
```

**Animation Specification:**
```typescript
interface RewardAnimation {
  type: 'success' | 'insight' | 'celebration';
  duration: number; // milliseconds
  elements: AnimationElement[];
}

const successAnimation: RewardAnimation = {
  type: 'success',
  duration: 300,
  elements: [
    { type: 'checkmark', fadeIn: 100, scale: [0.8, 1.1, 1] },
    { type: 'text', fadeIn: 200, slideUp: 10 }
  ]
};

const celebrationAnimation: RewardAnimation = {
  type: 'celebration',
  duration: 1500,
  elements: [
    { type: 'confetti', particles: 20, spread: 60 },
    { type: 'emoji', content: '🎉', bounce: true },
    { type: 'text', fadeIn: 300, emphasis: true }
  ]
};
```

---

## 4. INVESTMENT

Investment increases the user's stake in the product, making future triggers more effective.

### 4.1 Data Investment

Every interaction makes the app more valuable:

```typescript
interface UserInvestment {
  // Transaction data
  totalTransactions: number;
  monthsOfHistory: number;
  
  // Correction data (improves AI)
  merchantCorrections: number;
  categoryCorrections: number;
  itemCorrections: number;
  
  // Personalization
  trustedMerchants: string[];
  customCategories: string[];
  
  // Computed value
  investmentScore: number; // 0-100
}

function calculateInvestmentScore(investment: UserInvestment): number {
  const dataScore = Math.min(investment.totalTransactions / 100, 1) * 30;
  const historyScore = Math.min(investment.monthsOfHistory / 6, 1) * 25;
  const correctionScore = Math.min(
    (investment.merchantCorrections + investment.categoryCorrections) / 50, 1
  ) * 25;
  const personalizationScore = Math.min(
    (investment.trustedMerchants.length + investment.customCategories.length) / 10, 1
  ) * 20;
  
  return dataScore + historyScore + correctionScore + personalizationScore;
}
```

### 4.2 Correction Learning System

User corrections improve AI accuracy, creating tangible investment:

```typescript
interface CorrectionEvent {
  transactionId: string;
  field: 'merchant' | 'category' | 'total' | 'date' | 'item';
  originalValue: string | number;
  correctedValue: string | number;
  timestamp: Date;
}

// Store corrections for ML training
async function recordCorrection(event: CorrectionEvent): Promise<void> {
  await firestore.collection('corrections').add({
    ...event,
    userId: currentUser.uid,
    receiptImage: event.receiptImageRef // For future model training
  });
  
  // Update merchant trust score
  if (event.field === 'merchant' || event.field === 'category') {
    await updateMerchantTrustScore(event.originalValue, -0.1);
  }
}

// Show user their impact
function generateInvestmentInsight(corrections: number): string {
  if (corrections >= 50) {
    return "Tus correcciones han mejorado la precisión de escaneo un 23%";
  } else if (corrections >= 20) {
    return "Gastify aprende de tus correcciones. Ya enseñaste ${corrections} mejoras.";
  }
  return null;
}
```

### 4.3 Trust Merchant System

Building personalized trust accelerates the habit loop:

```typescript
interface TrustedMerchant {
  merchantName: string;
  normalizedName: string;
  scanCount: number;
  editCount: number;
  editRate: number;
  lastScan: Date;
  autoSaveEnabled: boolean;
  suggestedAt?: Date;
  confirmedAt?: Date;
}

function shouldSuggestTrust(merchant: TrustedMerchant): boolean {
  return (
    merchant.scanCount >= 3 &&
    merchant.editRate < 0.1 &&
    !merchant.autoSaveEnabled &&
    !merchant.suggestedAt
  );
}

// Prompt shown after 3rd successful scan with no edits
const trustPrompt = {
  title: "¿Confiar en {merchant}?",
  body: "Las próximas boletas de {merchant} se guardarán automáticamente",
  confirmText: "Sí, confiar",
  cancelText: "No, revisar siempre"
};
```

### 4.4 Investment Visibility

Show users what they've built:

```typescript
interface InvestmentDashboard {
  // Stats to display
  totalReceipts: number;
  totalAmount: number;
  monthsTracked: number;
  insightsGenerated: number;
  
  // Milestones
  milestones: Milestone[];
  nextMilestone: Milestone;
  progressToNext: number;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: number;
  achieved: boolean;
  achievedAt?: Date;
}

const milestones: Milestone[] = [
  { id: 'first_scan', name: 'Primera Boleta', description: 'Escaneaste tu primera boleta', requirement: 1 },
  { id: 'week_complete', name: 'Semana Completa', description: '7 días seguidos con datos', requirement: 7 },
  { id: 'month_complete', name: 'Mes Completo', description: 'Un mes completo de tracking', requirement: 30 },
  { id: 'hundred_club', name: 'Club de los 100', description: '100 boletas escaneadas', requirement: 100 },
  { id: 'year_tracker', name: 'Tracker del Año', description: 'Un año completo de datos', requirement: 365 }
];
```

---

## 5. LOOP REINFORCEMENT

How each cycle strengthens the next.

### 5.1 Progressive Disclosure

Reveal features as investment increases:

```typescript
interface FeatureGating {
  feature: string;
  requiredInvestment: number;
  unlockMessage: string;
}

const gatedFeatures: FeatureGating[] = [
  {
    feature: 'weekly_digest',
    requiredInvestment: 5, // transactions
    unlockMessage: "¡Nuevo! Ahora recibirás un resumen semanal"
  },
  {
    feature: 'category_insights',
    requiredInvestment: 15,
    unlockMessage: "¡Nuevo! Ya tienes suficientes datos para ver patrones por categoría"
  },
  {
    feature: 'month_comparison',
    requiredInvestment: 30,
    unlockMessage: "¡Nuevo! Ahora puedes comparar con el mes pasado"
  },
  {
    feature: 'predictions',
    requiredInvestment: 60,
    unlockMessage: "¡Nuevo! Gastify ahora puede predecir tu gasto mensual"
  }
];
```

### 5.2 Habit Strength Tracking

Monitor habit formation per user:

```typescript
interface HabitStrength {
  userId: string;
  
  // Frequency metrics
  scansLast7Days: number;
  scansLast30Days: number;
  averageScansPerWeek: number;
  
  // Consistency metrics
  longestStreak: number; // days with at least one scan
  currentStreak: number;
  weeklyConsistency: number; // weeks with 3+ scans / total weeks
  
  // Engagement depth
  analyticsViewsPerWeek: number;
  averageSessionDuration: number;
  insightInteractionRate: number; // clicks on insights / insights shown
  
  // Computed score
  habitScore: number; // 0-100
  habitStage: 'new' | 'forming' | 'established' | 'strong';
}

function calculateHabitScore(metrics: HabitStrength): number {
  const frequencyScore = Math.min(metrics.averageScansPerWeek / 5, 1) * 35;
  const consistencyScore = Math.min(metrics.weeklyConsistency, 1) * 35;
  const engagementScore = Math.min(metrics.insightInteractionRate, 1) * 30;
  
  return frequencyScore + consistencyScore + engagementScore;
}

function getHabitStage(score: number): string {
  if (score < 25) return 'new';
  if (score < 50) return 'forming';
  if (score < 75) return 'established';
  return 'strong';
}
```

### 5.3 Churn Prevention

Identify and intervene with at-risk users:

```typescript
interface ChurnRisk {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  suggestedIntervention: Intervention;
}

interface Intervention {
  type: 'notification' | 'email' | 'in_app';
  message: string;
  timing: 'immediate' | 'next_session' | 'scheduled';
}

function assessChurnRisk(user: UserMetrics): ChurnRisk {
  const riskFactors: string[] = [];
  
  if (user.daysSinceLastScan > 7) {
    riskFactors.push('inactive_week');
  }
  if (user.totalScans < 10 && user.daysActive > 14) {
    riskFactors.push('low_adoption');
  }
  if (user.habitScore < 25 && user.daysActive > 21) {
    riskFactors.push('habit_not_forming');
  }
  
  const riskLevel = riskFactors.length >= 2 ? 'high' : 
                    riskFactors.length === 1 ? 'medium' : 'low';
  
  return {
    userId: user.id,
    riskLevel,
    riskFactors,
    suggestedIntervention: getIntervention(riskFactors)
  };
}

const interventions: Record<string, Intervention> = {
  'inactive_week': {
    type: 'notification',
    message: "¿Tienes boletas pendientes? 📄 Un escaneo rápido y listo.",
    timing: 'scheduled' // Send at user's typical active time
  },
  'low_adoption': {
    type: 'in_app',
    message: "Tip: Con 3 boletas más desbloqueas el resumen semanal 📊",
    timing: 'next_session'
  },
  'habit_not_forming': {
    type: 'notification',
    message: "Tu resumen de {lastMonth} está listo. ¿Quieres verlo?",
    timing: 'immediate'
  }
};
```

---

## 6. IMPLEMENTATION PHASES

### Phase 1: Foundation (Current Sprint)

| Component | Implementation | Priority |
|-----------|----------------|----------|
| Scan Complete Insight | Show one insight after every save | P0 |
| Quick Save Mode | Summary card with one-tap save | P0 |
| Basic Insight Engine | 3-4 insight types | P1 |
| Investment Tracking | Store correction data | P1 |

### Phase 1.5: Reinforcement (Next Sprint)

| Component | Implementation | Priority |
|-----------|----------------|----------|
| Weekly Digest View | In-app summary accessible anytime | P0 |
| Scan Complete Notification | Push notification with insight | P1 |
| Trust Merchant Prompt | Suggest auto-save after 3 scans | P1 |
| Insight Cards on Analytics | 1-2 rotating insights | P1 |

### Phase 2: Optimization

| Component | Implementation | Priority |
|-----------|----------------|----------|
| Weekly Digest Notification | Push notification + deep link | P0 |
| Monthly Milestone | Celebration + summary | P0 |
| Habit Score Tracking | Internal metrics | P1 |
| Churn Prevention | At-risk interventions | P1 |
| Batch Scanning | Multi-receipt mode | P2 |

---

## 7. SUCCESS METRICS

### Habit Formation Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Week 1 Retention | >60% | Users who scan in week 2 |
| Week 4 Retention | >40% | Users who scan in week 4 |
| Average Scans/Week | >3 | Among active users |
| Quick Save Adoption | >50% | Quick save / total saves |
| Insight Interaction Rate | >30% | Insight taps / insights shown |
| Trust Merchant Adoption | >40% | Users with 1+ trusted merchant |

### Loop Health Metrics

| Metric | Healthy Range | Warning Sign |
|--------|---------------|--------------|
| Time to First Scan | <5 minutes | >24 hours |
| Scans per Session | 1-3 | 0 or >10 |
| Days Between Scans | 1-3 | >7 |
| Edit Rate | 5-15% | >30% |
| Session Duration | 30s-3min | <10s or >10min |

---

## 8. ETHICAL GUARDRAILS

### What We Will NEVER Do

1. **Punitive Mechanics**
   - No "streak" systems that shame users for missing days
   - No "you're falling behind" messaging
   - No loss aversion triggers

2. **Anxiety-Inducing Patterns**
   - No urgent/FOMO notifications
   - No countdown timers
   - No "others are doing better" comparisons

3. **Manipulative Rewards**
   - No random slot-machine rewards
   - No artificial scarcity
   - No variable ratio reinforcement schedules

### Ethical Review Checklist

Before implementing any habit mechanic:

- [ ] Does this pass the Abuelita Test?
- [ ] Does this create value for the user, not just engagement?
- [ ] Would we be proud to explain this mechanic publicly?
- [ ] Does this respect the user's time and attention?
- [ ] Does this help users achieve their goals (expense awareness)?

---

*This document serves as the implementation specification for Gastify's habit-forming mechanics. All implementations should reference this document and adhere to the ethical guardrails defined herein.*