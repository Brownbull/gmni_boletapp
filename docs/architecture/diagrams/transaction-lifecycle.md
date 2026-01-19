# Transaction Lifecycle

> How transactions are created, processed, and persisted
> **Last Updated:** 2026-01-15

---

## Overview

Transactions in BoletApp can be created through three entry points, each following a distinct flow before converging at the persistence layer.

---

## Entry Points

```mermaid
flowchart TB
    subgraph Entry["Transaction Entry Points"]
        E1[📷 Receipt Scan]
        E2[✏️ Manual Entry]
        E3[📋 Quick Save]
    end

    subgraph Processing["Processing Layer"]
        P1[Cloud Function]
        P2[Local Form]
        P3[Auto-save]
    end

    subgraph Review["Review Phase"]
        R1[TransactionEditorView]
    end

    subgraph Persist["Persistence"]
        DB[(Firestore)]
    end

    E1 --> P1
    E2 --> P2
    E3 --> P3

    P1 --> R1
    P2 --> R1
    P3 -->|"High confidence"| DB
    P3 -->|"Low confidence"| R1

    R1 --> DB
```

---

## Receipt Scan Flow (Primary)

```mermaid
sequenceDiagram
    participant User
    participant App as ScanView
    participant CF as Cloud Function
    participant Gemini as Gemini AI
    participant Storage as Firebase Storage
    participant DB as Firestore

    User->>App: Capture/Upload image
    App->>App: Convert to base64
    App->>CF: analyzeReceipt(images)

    CF->>CF: Validate auth + rate limit
    CF->>CF: Resize image (1200x1600)
    CF->>Gemini: Send with prompt V3

    Gemini-->>CF: JSON response
    CF->>CF: Parse & validate

    par Upload images
        CF->>Storage: Upload full-size images
        CF->>Storage: Generate thumbnail (120x160)
    end

    CF-->>App: Transaction + URLs

    App->>App: Show in EditorView
    User->>App: Review & edit
    User->>App: Save

    App->>DB: addTransaction()
    DB-->>App: Success

    Note over App,DB: Transaction persisted with:<br/>- imageUrls[]<br/>- thumbnailUrl<br/>- promptVersion<br/>- merchantSource: 'scan'
```

---

## Manual Entry Flow

```mermaid
sequenceDiagram
    participant User
    participant App as EditView
    participant Mappings as Category Mappings
    participant DB as Firestore

    User->>App: Navigate to manual entry

    App->>Mappings: Load category mappings
    Mappings-->>App: Suggestions ready

    User->>App: Enter merchant name
    App->>Mappings: Check for learned category
    Mappings-->>App: Suggest category

    User->>App: Enter date, total, category
    User->>App: Add line items

    loop For each item
        User->>App: Enter item name + price
        App->>Mappings: Check for subcategory suggestion
    end

    User->>App: Save

    App->>DB: addTransaction()
    DB-->>App: Success

    Note over App,DB: Transaction persisted with:<br/>- No imageUrls<br/>- merchantSource: 'manual'
```

---

## Quick Save Flow

```mermaid
flowchart TB
    subgraph Scan["Scan Complete"]
        S1[Gemini returns result]
        S2{Confidence >= 80%?}
    end

    subgraph QuickSave["Quick Save Path"]
        Q1[Show QuickSave dialog]
        Q2{User choice?}
        Q3[Save immediately]
        Q4[Open editor]
    end

    subgraph Standard["Standard Path"]
        T1[Open TransactionEditorView]
    end

    S1 --> S2
    S2 -->|"Yes"| Q1
    S2 -->|"No"| T1

    Q1 --> Q2
    Q2 -->|"Quick Save"| Q3
    Q2 -->|"Review First"| Q4

    Q3 --> DB[(Firestore)]
    Q4 --> T1
    T1 --> DB

    style Q3 fill:#d1fae5
```

---

## Transaction Data Structure

```mermaid
classDiagram
    class Transaction {
        +string id
        +string merchant
        +string date
        +number total
        +string category
        +TransactionItem[] items
        +string? time
        +string? currency
        +string? country
        +string? city
        +string[]? imageUrls
        +string? thumbnailUrl
        +string? promptVersion
        +string merchantSource
        +string[]? groupIds
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class TransactionItem {
        +string name
        +number price
        +string? category
        +string? subcategory
        +number? quantity
    }

    Transaction "1" --> "*" TransactionItem : items
```

### Field Categories

| Category | Fields | Source |
|----------|--------|--------|
| **Core** | merchant, date, total, category, items | All entry points |
| **V3 Extended** | time, currency, country, city | Scan only (auto-detected) |
| **Storage** | imageUrls, thumbnailUrl | Scan only |
| **Tracking** | promptVersion, merchantSource | All (different values) |
| **Organization** | groupIds | User-assigned |
| **Metadata** | createdAt, updatedAt | Auto-generated |

---

## Category Learning Flow

```mermaid
flowchart LR
    subgraph FirstScan["First Scan"]
        F1[User scans receipt]
        F2[AI assigns category]
        F3[User saves with category X]
    end

    subgraph Learning["Learning System"]
        L1[Store merchant → category mapping]
    end

    subgraph FutureScan["Future Scans"]
        S1[Same merchant detected]
        S2[Auto-apply category X]
        S3[User can override]
    end

    F3 --> L1
    L1 --> S2

    F1 --> F2 --> F3
    S1 --> S2 --> S3
```

---

## Cascade Delete Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB as Firestore
    participant CF as Cloud Function
    participant Storage as Firebase Storage

    User->>App: Delete transaction
    App->>DB: deleteDoc(transactionId)

    DB->>CF: onDelete trigger fires

    CF->>CF: Extract userId, transactionId
    CF->>Storage: Delete folder:<br/>users/{userId}/receipts/{transactionId}/

    Storage-->>CF: ✓ Images deleted
    CF-->>CF: Log completion

    Note over CF,Storage: Errors logged but don't fail<br/>Orphaned images acceptable<br/>(cleanup job can handle later)
```

---

## Storage Paths

```
Firebase Storage Structure:
├── users/
│   └── {userId}/
│       └── receipts/
│           └── {transactionId}/
│               ├── image-0.jpg      # Full-size (1200x1600)
│               ├── image-1.jpg      # Additional images
│               ├── image-2.jpg
│               └── thumbnail.jpg    # Preview (120x160)
```

```
Firestore Structure:
├── artifacts/
│   └── {appId}/
│       └── users/
│           └── {userId}/
│               ├── transactions/
│               │   └── {transactionId}
│               ├── categoryMappings/
│               ├── merchantMappings/
│               ├── subcategoryMappings/
│               ├── groups/
│               └── trustedMerchants/
```

---

## Validation Rules

```mermaid
flowchart TB
    subgraph Validation["Transaction Validation"]
        V1{Has merchant?}
        V2{Has date?}
        V3{Has total > 0?}
        V4{Has items with price > 0?}
    end

    V1 -->|"No"| Invalid[❌ Cannot Save]
    V1 -->|"Yes"| V2
    V2 -->|"No"| Invalid
    V2 -->|"Yes"| V3
    V3 -->|"No"| Invalid
    V3 -->|"Yes"| V4
    V4 -->|"No"| Invalid
    V4 -->|"Yes"| Valid[✅ Can Save]

    style Valid fill:#d1fae5
    style Invalid fill:#fee2e2
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/services/firestore.ts` | Transaction CRUD operations |
| `src/views/TransactionEditorView.tsx` | Edit/create form |
| `src/hooks/useTransactions.ts` | Real-time transaction subscription |
| `functions/src/analyzeReceipt.ts` | Receipt processing Cloud Function |
| `functions/src/deleteTransactionImages.ts` | Cascade delete trigger |

---

*Diagram illustrates core transaction flows as of Epic 14*
