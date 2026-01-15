# Tech Stack Overview

> Technology layers and integrations in BoletApp
> **Last Updated:** 2026-01-15

---

## Architecture Layers

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        PWA["PWA (Progressive Web App)"]
        React["React 18.3"]
        RQ["@tanstack/react-query"]
        Router["React Router"]
    end

    subgraph Build["Build Layer"]
        Vite["Vite 5.4.0"]
        TS["TypeScript 5.3"]
        ESLint["ESLint + Prettier"]
    end

    subgraph Backend["Backend Layer"]
        CF["Cloud Functions (Node 18)"]
        Gemini["Gemini 2.0 Flash"]
    end

    subgraph Firebase["Firebase Services"]
        Auth["Firebase Auth"]
        FS["Cloud Firestore"]
        Storage["Firebase Storage"]
        Hosting["Firebase Hosting"]
    end

    Client --> Build
    Client --> Backend
    Client --> Firebase
    Backend --> Firebase
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **UI Framework** | React | 18.3 | Component-based UI |
| **Type System** | TypeScript | 5.3 | Static typing |
| **Build Tool** | Vite | 5.4.0 | Fast HMR, optimized builds |
| **State Management** | React Query | 5.x | Cache + async state |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Animation** | Framer Motion | - | Page transitions |
| **Charts** | ECharts + Custom | - | Data visualization |
| **Backend** | Cloud Functions | Node 18 | Serverless compute |
| **AI** | Gemini | 2.0 Flash | Receipt OCR |
| **Database** | Firestore | - | Real-time NoSQL |
| **Storage** | Firebase Storage | - | Receipt images |
| **Auth** | Firebase Auth | - | Google OAuth |
| **Hosting** | Firebase Hosting | - | Global CDN |
| **Testing** | Vitest + Playwright | - | Unit + E2E |

---

## Client Architecture

```mermaid
flowchart TB
    subgraph Views["Views (Pages)"]
        V1[DashboardView]
        V2[ScanView]
        V3[HistoryView]
        V4[TrendsView]
        V5[SettingsView]
        V6[InsightsView]
    end

    subgraph Components["Components"]
        C1[analytics/]
        C2[batch/]
        C3[charts/]
        C4[history/]
        C5[insights/]
        C6[scan/]
        C7[settings/]
    end

    subgraph Hooks["Hooks (49 files)"]
        H1[useAuth]
        H2[useTransactions]
        H3[useScanStateMachine]
        H4[useAnalyticsNavigation]
        H5[useHistoryFilters]
        H6["...more"]
    end

    subgraph Services["Services (25 files)"]
        S1[firestore.ts]
        S2[gemini.ts]
        S3[creditService.ts]
        S4[categoryMappingService.ts]
        S5["...more"]
    end

    subgraph Utils["Utils"]
        U1[translations.ts]
        U2[currency.ts]
        U3[date.ts]
        U4[historyFilterUtils.ts]
    end

    Views --> Components
    Views --> Hooks
    Hooks --> Services
    Services --> Utils
```

---

## Firebase Architecture

```mermaid
flowchart LR
    subgraph Client["Client"]
        App[React App]
    end

    subgraph Firebase["Firebase"]
        subgraph Auth["Authentication"]
            GA[Google OAuth]
        end

        subgraph Database["Firestore"]
            Users[(users)]
            Transactions[(transactions)]
            Mappings[(mappings)]
            SharedGroups[(sharedGroups)]
        end

        subgraph Storage["Storage"]
            Images[Receipt Images]
            Thumbnails[Thumbnails]
        end

        subgraph Functions["Cloud Functions"]
            AR[analyzeReceipt]
            OTD[onTransactionDeleted]
        end
    end

    subgraph External["External"]
        Gemini[Gemini AI]
    end

    App --> Auth
    App --> Database
    App --> Functions
    Functions --> Storage
    Functions --> Gemini
    Functions --> Database
```

---

## Data Flow Architecture

```mermaid
flowchart TB
    subgraph User["User Actions"]
        U1[📷 Scan Receipt]
        U2[✏️ Edit Transaction]
        U3[📊 View Analytics]
    end

    subgraph Processing["Processing"]
        P1[Cloud Function]
        P2[Local State]
        P3[Computed Values]
    end

    subgraph Cache["Caching Layer"]
        RQ[React Query Cache]
        LS[localStorage]
    end

    subgraph Persistence["Persistence"]
        FS[(Firestore)]
        ST[Firebase Storage]
    end

    U1 --> P1
    P1 --> ST
    P1 --> FS

    U2 --> P2
    P2 --> RQ
    RQ --> FS

    U3 --> P3
    P3 --> RQ
    RQ --> FS
```

---

## Testing Pyramid

```mermaid
flowchart TB
    subgraph Pyramid["Testing Strategy"]
        E2E["E2E Tests<br/>Playwright<br/>~50 tests"]
        INT["Integration Tests<br/>Vitest + Emulators<br/>~200 tests"]
        UNIT["Unit Tests<br/>Vitest<br/>~3,000 tests"]
    end

    subgraph Coverage["Coverage"]
        COV["84%+ Line Coverage"]
    end

    E2E --> INT
    INT --> UNIT
    UNIT --> Coverage

    style E2E fill:#e0f2fe
    style INT fill:#bae6fd
    style UNIT fill:#7dd3fc
```

---

## CI/CD Pipeline

```mermaid
flowchart LR
    subgraph Trigger["Trigger"]
        PR[Pull Request]
        Push[Push to main]
    end

    subgraph Jobs["Parallel Jobs"]
        GL[gitleaks]
        UN1[test-unit-1]
        UN2[test-unit-2]
        UN3["...unit-8"]
        INT[test-integration]
        E2E[test-e2e]
        SEC[security]
    end

    subgraph Gate["Quality Gate"]
        ALL[All Tests Pass]
    end

    subgraph Deploy["Deploy"]
        FB[Firebase Hosting]
    end

    Trigger --> Jobs
    Jobs --> Gate
    Gate --> Deploy
```

---

## Security Architecture

```mermaid
flowchart TB
    subgraph Client["Client Security"]
        HTTPS["HTTPS Only"]
        CSP["Content Security Policy"]
        NoSecrets["No secrets in code"]
    end

    subgraph Firebase["Firebase Security"]
        Rules["Firestore Rules"]
        StorageRules["Storage Rules"]
        RateLimit["Rate Limiting"]
    end

    subgraph Auth["Authentication"]
        OAuth["Google OAuth 2.0"]
        JWT["Firebase JWT Tokens"]
    end

    Client --> Auth
    Auth --> Firebase
```

### Firestore Rules Summary

```
/artifacts/{appId}/users/{userId}/**
  → User can only access own data

/sharedGroups/{groupId}
  → Members can read
  → Owner can write
  → User can add self (accepting invite)

/pendingInvitations/{invitationId}
  → Invited user can read/update status
  → Creator can create
```

---

## Prompt System Architecture

```mermaid
flowchart TB
    subgraph Versions["Prompt Versions"]
        V1["V1: Original<br/>Single currency"]
        V2["V2: Multi-currency<br/>Receipt types"]
        V3["V3: Current<br/>Category standardization"]
    end

    subgraph Selection["Version Selection"]
        S1{Context?}
        S2[Production → V3]
        S3[Development → Any]
    end

    V1 --> V2
    V2 --> V3
    V3 --> S1
    S1 --> S2
    S1 --> S3
```

---

## Environment Configuration

```mermaid
flowchart TB
    subgraph Env["Environment Variables"]
        E1["VITE_FIREBASE_*<br/>Firebase config"]
        E2["VITE_GEMINI_*<br/>AI config"]
    end

    subgraph Build["Build Time"]
        B1["import.meta.env<br/>Vite injection"]
    end

    subgraph Runtime["Runtime"]
        R1["Client config"]
        R2["Functions config"]
    end

    Env --> Build
    Build --> Runtime
```

---

## Key Integration Points

```mermaid
flowchart LR
    subgraph External["External Services"]
        G[Google OAuth]
        GM[Gemini AI]
    end

    subgraph Firebase["Firebase Services"]
        AUTH[Auth]
        FS[Firestore]
        ST[Storage]
        CF[Functions]
        HOST[Hosting]
    end

    subgraph App["BoletApp"]
        CLIENT[React Client]
    end

    G --> AUTH
    AUTH --> CLIENT
    CLIENT --> FS
    CLIENT --> CF
    CF --> GM
    CF --> ST
    CLIENT --> HOST
```

---

## File Organization

```
boletapp/
├── src/                    # React application
│   ├── components/         # UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks (49)
│   ├── services/          # Business logic (25)
│   ├── utils/             # Pure functions
│   ├── views/             # Page components
│   ├── config/            # Configuration
│   ├── types/             # TypeScript types
│   └── lib/               # Query client
├── functions/             # Cloud Functions
│   └── src/
│       ├── prompts/       # AI prompts V1-V3
│       └── *.ts           # Function handlers
├── tests/                 # Test files
│   ├── unit/              # ~170 files
│   ├── integration/       # ~25 files
│   └── e2e/              # 7 specs
└── docs/                  # Documentation
    └── architecture/
        └── diagrams/      # This folder
```

---

## Performance Characteristics

| Aspect | Metric | Notes |
|--------|--------|-------|
| **Build Time** | ~30s | Vite production build |
| **Bundle Size** | 2.92 MB | Needs optimization |
| **First Load** | 2-3s | Fresh data fetch |
| **Navigation** | < 100ms | Cached routes |
| **Scan Latency** | 3-5s | Gemini processing |
| **CI Pipeline** | ~8 min | 8 parallel shards |

---

*Diagram provides tech stack overview as of Epic 14*
