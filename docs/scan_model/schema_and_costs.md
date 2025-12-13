Perfecto, vamos a diseñar un schema robusto para training data y luego hacer un análisis detallado de costos de Vertex AI.

---

## Parte 1: Diseño del Schema de Firestore

### Arquitectura de Colecciones

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FIRESTORE SCHEMA PARA ML TRAINING                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /artifacts/{appId}/                                                     │
│       │                                                                  │
│       ├── /users/{userId}/                                               │
│       │       ├── /transactions/{txId}        ← Datos de usuario        │
│       │       ├── /corrections/{corrId}       ← Correcciones del usuario│
│       │       └── /consent                    ← Consentimiento ML       │
│       │                                                                  │
│       ├── /training_data/{dataId}             ← Dataset consolidado     │
│       │                                                                  │
│       ├── /merchants/{merchantId}             ← Base de merchants       │
│       │                                                                  │
│       └── /model_metadata/{modelId}           ← Versiones de modelos    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Schema Detallado por Colección

#### 1. Transactions (Actualizado)

```typescript
// types/transaction.ts - ENHANCED FOR ML

export interface TransactionItem {
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  // ML fields
  originalName?: string;        // What AI extracted
  normalizedName?: string;      // Standardized name
  confidence?: number;          // AI confidence 0-1
}

export interface Transaction {
  // Core fields (existing)
  id: string;
  merchant: string;
  date: string;                 // ISO format: "2025-01-15"
  total: number;
  category: string;
  alias?: string;
  items: TransactionItem[];
  
  // NEW: ML Training Fields
  ml: {
    // Image reference
    receiptImagePath?: string;  // Cloud Storage path
    receiptImageUrl?: string;   // Signed URL (temporary)
    
    // AI extraction metadata
    aiExtraction: {
      model: string;            // "gemini-2.0-flash" or "gastify-v1"
      modelVersion: string;     // "2025-01-15"
      rawResponse: string;      // Full JSON response
      processingTimeMs: number;
      extractedAt: Timestamp;
      
      // Original AI values (before any user edits)
      originalMerchant: string;
      originalDate: string;
      originalTotal: number;
      originalCategory: string;
      originalItems: TransactionItem[];
      
      // Confidence scores
      confidence: {
        overall: number;        // 0-1
        merchant: number;
        date: number;
        total: number;
        items: number;
      };
    };
    
    // Training eligibility
    training: {
      eligible: boolean;        // User gave consent
      exported: boolean;        // Already in training set
      exportedAt?: Timestamp;
      qualityScore?: number;    // 0-1, based on image quality
    };
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;            // userId
  region: 'CL' | 'CO' | 'MX' | 'AR';
}
```

#### 2. Corrections Collection (Nueva)

```typescript
// types/corrections.ts

export type CorrectionField = 
  | 'merchant' 
  | 'date' 
  | 'total' 
  | 'category' 
  | 'item_name' 
  | 'item_price' 
  | 'item_category'
  | 'item_added'
  | 'item_removed';

export interface Correction {
  id: string;
  
  // Reference
  transactionId: string;
  userId: string;
  
  // What changed
  field: CorrectionField;
  itemIndex?: number;           // For item-level corrections
  
  // Values
  originalValue: any;           // What AI said
  correctedValue: any;          // What user changed to
  
  // Context
  context: {
    receiptImagePath?: string;
    merchantType?: string;      // supermarket, pharmacy, etc.
    region: 'CL' | 'CO' | 'MX' | 'AR';
    aiModel: string;
    aiModelVersion: string;
  };
  
  // Metadata
  correctedAt: Timestamp;
  correctionSource: 'user_edit' | 'bulk_import' | 'admin';
  
  // Training
  usedInTraining: boolean;
  trainingBatchId?: string;
}

// Aggregated correction patterns (for quick lookups)
export interface CorrectionPattern {
  id: string;
  
  // Pattern
  field: CorrectionField;
  originalPattern: string;      // "JUMBO 1234" or regex
  correctedValue: string;       // "Jumbo"
  
  // Stats
  occurrences: number;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  
  // Auto-apply
  autoApply: boolean;           // Should we auto-correct this?
  confidence: number;           // Based on occurrences
  region: 'CL' | 'CO' | 'MX' | 'AR';
}
```

#### 3. Training Data Collection (Consolidada)

```typescript
// types/training.ts

export interface TrainingDataPoint {
  id: string;
  
  // Source
  sourceTransactionId: string;
  sourceUserId: string;         // For audit, anonymized in export
  
  // Image
  image: {
    storagePath: string;        // gs://gastify-receipts/...
    width: number;
    height: number;
    format: 'jpeg' | 'png' | 'webp';
    sizeBytes: number;
    qualityScore: number;       // 0-1, computed
  };
  
  // Ground truth (after user corrections)
  groundTruth: {
    merchant: string;
    merchantNormalized: string;
    date: string;
    total: number;
    currency: 'CLP' | 'COP' | 'MXN' | 'ARS';
    category: string;
    items: Array<{
      name: string;
      price: number;
      category?: string;
    }>;
  };
  
  // AI comparison (for measuring improvement)
  aiPrediction: {
    model: string;
    merchant: string;
    date: string;
    total: number;
    category: string;
    items: Array<{name: string; price: number}>;
  };
  
  // Correction summary
  corrections: {
    hadCorrections: boolean;
    correctedFields: CorrectionField[];
    correctionCount: number;
  };
  
  // Classification
  metadata: {
    region: 'CL' | 'CO' | 'MX' | 'AR';
    storeType: 'supermarket' | 'pharmacy' | 'restaurant' | 'gas_station' | 'other';
    receiptType: 'thermal' | 'printed' | 'digital' | 'handwritten';
    difficulty: 'easy' | 'medium' | 'hard';  // Based on image quality
  };
  
  // Training management
  training: {
    split: 'train' | 'validation' | 'test';
    addedAt: Timestamp;
    batchId: string;
    version: number;            // Dataset version
  };
}

// Dataset metadata
export interface TrainingDataset {
  id: string;
  version: number;
  
  // Stats
  stats: {
    totalSamples: number;
    trainSamples: number;
    validationSamples: number;
    testSamples: number;
    
    byRegion: Record<string, number>;
    byStoreType: Record<string, number>;
    byDifficulty: Record<string, number>;
    
    correctionRate: number;     // % of samples with corrections
    avgCorrectionsPerSample: number;
  };
  
  // Timestamps
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
  
  // Export
  exportPath?: string;          // Cloud Storage path to JSONL
  exportedAt?: Timestamp;
}
```

#### 4. Merchants Database

```typescript
// types/merchants.ts

export interface Merchant {
  id: string;
  
  // Identification
  canonicalName: string;        // "Jumbo"
  displayName: string;          // "Jumbo Las Condes"
  
  // Matching patterns
  patterns: string[];           // ["JUMBO", "JUMBO SA", "JUMBO 1234"]
  regexPatterns?: string[];     // For complex matching
  
  // Classification
  category: string;             // Default category
  storeType: 'supermarket' | 'pharmacy' | 'restaurant' | 'gas_station' | 'other';
  chain?: string;               // "Cencosud"
  
  // Regional
  regions: Array<'CL' | 'CO' | 'MX' | 'AR'>;
  
  // Stats (updated periodically)
  stats: {
    transactionCount: number;
    lastSeen: Timestamp;
    avgTransactionAmount: number;
    commonItems: string[];      // Top 10 items
  };
  
  // Management
  verified: boolean;
  source: 'manual' | 'auto_extracted' | 'user_suggestion';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 5. User Consent

```typescript
// types/consent.ts

export interface UserConsent {
  // Document ID = always "ml_consent" under user
  
  // Consent status
  trainingConsent: boolean;
  consentVersion: string;       // "1.0", "1.1", etc.
  
  // Timestamps
  consentedAt?: Timestamp;
  revokedAt?: Timestamp;
  
  // Granular options (future)
  options: {
    allowImageStorage: boolean;
    allowAnonymizedAnalytics: boolean;
    allowModelTraining: boolean;
  };
  
  // Audit
  history: Array<{
    action: 'granted' | 'revoked' | 'updated';
    timestamp: Timestamp;
    version: string;
  }>;
}
```

### Índices de Firestore

```javascript
// firestore.indexes.json

{
  "indexes": [
    // Corrections by user and date
    {
      "collectionGroup": "corrections",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "correctedAt", "order": "DESCENDING"}
      ]
    },
    // Corrections by field type (for pattern analysis)
    {
      "collectionGroup": "corrections",
      "fields": [
        {"fieldPath": "field", "order": "ASCENDING"},
        {"fieldPath": "region", "order": "ASCENDING"},
        {"fieldPath": "correctedAt", "order": "DESCENDING"}
      ]
    },
    // Training data by region and split
    {
      "collectionGroup": "training_data",
      "fields": [
        {"fieldPath": "metadata.region", "order": "ASCENDING"},
        {"fieldPath": "training.split", "order": "ASCENDING"}
      ]
    },
    // Merchants by pattern matching
    {
      "collectionGroup": "merchants",
      "fields": [
        {"fieldPath": "regions", "arrayContains": true},
        {"fieldPath": "verified", "order": "ASCENDING"}
      ]
    }
  ]
}
```

### Security Rules Actualizadas

```javascript
// firestore.rules

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // User data - only owner can access
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Training data - read only for authenticated users (anonymized)
    // Write only for admin/cloud functions
    match /artifacts/{appId}/training_data/{dataId} {
      allow read: if request.auth != null;
      allow write: if false; // Only via Cloud Functions
    }
    
    // Merchants - public read, admin write
    match /artifacts/{appId}/merchants/{merchantId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.token.admin == true;
    }
    
    // Model metadata - public read
    match /artifacts/{appId}/model_metadata/{modelId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Parte 2: Implementación del Schema

### Services para Corrections

```typescript
// services/corrections.ts

import { 
  collection, addDoc, query, where, getDocs, 
  Timestamp, orderBy, limit 
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Correction, CorrectionField } from '../types/corrections';
import { User } from 'firebase/auth';

/**
 * Log a user correction for ML training
 */
export async function logCorrection(
  user: User,
  transactionId: string,
  field: CorrectionField,
  originalValue: any,
  correctedValue: any,
  context: {
    itemIndex?: number;
    receiptImagePath?: string;
    merchantType?: string;
    region: 'CL' | 'CO' | 'MX' | 'AR';
    aiModel: string;
    aiModelVersion: string;
  }
): Promise<string> {
  const correctionsRef = collection(
    db,
    `artifacts/${appId}/users/${user.uid}/corrections`
  );

  const correction: Omit<Correction, 'id'> = {
    transactionId,
    userId: user.uid,
    field,
    itemIndex: context.itemIndex,
    originalValue,
    correctedValue,
    context: {
      receiptImagePath: context.receiptImagePath,
      merchantType: context.merchantType,
      region: context.region,
      aiModel: context.aiModel,
      aiModelVersion: context.aiModelVersion,
    },
    correctedAt: Timestamp.now(),
    correctionSource: 'user_edit',
    usedInTraining: false,
  };

  const docRef = await addDoc(correctionsRef, correction);
  return docRef.id;
}

/**
 * Get correction statistics for a user
 */
export async function getUserCorrectionStats(
  user: User
): Promise<{
  totalCorrections: number;
  byField: Record<CorrectionField, number>;
  recentCorrections: Correction[];
}> {
  const correctionsRef = collection(
    db,
    `artifacts/${appId}/users/${user.uid}/corrections`
  );

  const snapshot = await getDocs(correctionsRef);
  const corrections = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Correction[];

  const byField: Record<string, number> = {};
  corrections.forEach(c => {
    byField[c.field] = (byField[c.field] || 0) + 1;
  });

  return {
    totalCorrections: corrections.length,
    byField: byField as Record<CorrectionField, number>,
    recentCorrections: corrections
      .sort((a, b) => b.correctedAt.toMillis() - a.correctedAt.toMillis())
      .slice(0, 10),
  };
}

/**
 * Detect if this correction creates a pattern we should auto-apply
 */
export async function detectCorrectionPattern(
  correction: Correction
): Promise<boolean> {
  // Query for similar corrections across all users
  const patternsRef = collection(
    db,
    `artifacts/${appId}/correction_patterns`
  );

  const q = query(
    patternsRef,
    where('field', '==', correction.field),
    where('originalPattern', '==', correction.originalValue),
    where('region', '==', correction.context.region)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // First time seeing this pattern - create it
    await addDoc(patternsRef, {
      field: correction.field,
      originalPattern: correction.originalValue,
      correctedValue: correction.correctedValue,
      occurrences: 1,
      firstSeen: correction.correctedAt,
      lastSeen: correction.correctedAt,
      autoApply: false,
      confidence: 0.1,
      region: correction.context.region,
    });
    return false;
  } else {
    // Pattern exists - increment and check threshold
    const pattern = snapshot.docs[0];
    const data = pattern.data();
    const newOccurrences = data.occurrences + 1;
    
    // Auto-apply if seen 5+ times with same correction
    const shouldAutoApply = newOccurrences >= 5 && 
                            data.correctedValue === correction.correctedValue;

    await pattern.ref.update({
      occurrences: newOccurrences,
      lastSeen: correction.correctedAt,
      autoApply: shouldAutoApply,
      confidence: Math.min(0.95, newOccurrences / 10),
    });

    return shouldAutoApply;
  }
}
```

### Hook Actualizado para EditView

```typescript
// hooks/useTransactionEditor.ts

import { useState, useCallback } from 'react';
import { Transaction } from '../types/transaction';
import { logCorrection } from '../services/corrections';
import { User } from 'firebase/auth';

interface UseTransactionEditorProps {
  user: User;
  originalTransaction: Transaction;
  region: 'CL' | 'CO' | 'MX' | 'AR';
}

export function useTransactionEditor({
  user,
  originalTransaction,
  region,
}: UseTransactionEditorProps) {
  const [transaction, setTransaction] = useState(originalTransaction);
  const [pendingCorrections, setPendingCorrections] = useState<any[]>([]);

  const updateField = useCallback((
    field: keyof Transaction,
    value: any
  ) => {
    const originalValue = originalTransaction.ml?.aiExtraction
      ? (originalTransaction.ml.aiExtraction as any)[`original${capitalize(field)}`]
      : originalTransaction[field];

    // Track correction if value differs from AI extraction
    if (originalValue !== undefined && originalValue !== value) {
      setPendingCorrections(prev => [
        ...prev.filter(c => c.field !== field),
        {
          field,
          originalValue,
          correctedValue: value,
        }
      ]);
    }

    setTransaction(prev => ({ ...prev, [field]: value }));
  }, [originalTransaction]);

  const saveWithCorrections = useCallback(async () => {
    // Log all corrections
    for (const correction of pendingCorrections) {
      await logCorrection(
        user,
        transaction.id,
        correction.field,
        correction.originalValue,
        correction.correctedValue,
        {
          receiptImagePath: transaction.ml?.receiptImagePath,
          merchantType: transaction.category,
          region,
          aiModel: transaction.ml?.aiExtraction?.model || 'gemini-2.0-flash',
          aiModelVersion: transaction.ml?.aiExtraction?.modelVersion || 'unknown',
        }
      );
    }

    // Clear pending corrections
    setPendingCorrections([]);

    return transaction;
  }, [user, transaction, pendingCorrections, region]);

  return {
    transaction,
    updateField,
    saveWithCorrections,
    hasCorrections: pendingCorrections.length > 0,
    correctionCount: pendingCorrections.length,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

---

## Parte 3: Evaluación de Costos Vertex AI

### Opciones de Modelos en Vertex AI

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERTEX AI MODEL OPTIONS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. GEMINI API (Pay-per-use)                                            │
│     └── gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash          │
│                                                                          │
│  2. GEMINI FINE-TUNING (Supervised Tuning)                              │
│     └── Custom adapter on gemini-1.5-flash                              │
│                                                                          │
│  3. CUSTOM TRAINING (Bring your own model)                              │
│     └── Train open-source models on Vertex AI infrastructure            │
│                                                                          │
│  4. MODEL GARDEN (Pre-trained models)                                   │
│     └── PaLI, Imagen, specialized vision models                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Escenarios de Uso para Gastify

| Escenario | Usuarios | Escaneos/Mes | Imágenes Almacenadas |
|-----------|----------|--------------|----------------------|
| **Alpha** | 50 | 500 | 500 |
| **Beta** | 500 | 5,000 | 5,000 |
| **Launch** | 2,000 | 20,000 | 20,000 |
| **Growth** | 10,000 | 100,000 | 100,000 |
| **Scale** | 50,000 | 500,000 | 500,000 |

### Desglose de Costos por Componente

#### 1. Gemini API (Inference)

**Precios actuales (Diciembre 2024):**

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) | Imagen |
|--------|----------------------|------------------------|--------|
| **gemini-2.0-flash** | $0.075 | $0.30 | ~750 tokens |
| **gemini-1.5-flash** | $0.075 | $0.30 | ~750 tokens |
| **gemini-1.5-pro** | $1.25 | $5.00 | ~750 tokens |

**Cálculo por escaneo de recibo:**

```
Tokens por escaneo típico:
- Imagen: ~750 tokens
- Prompt: ~200 tokens
- Output JSON: ~300 tokens

Total input: ~950 tokens
Total output: ~300 tokens

Costo por escaneo (gemini-2.0-flash):
- Input: 950 / 1,000,000 × $0.075 = $0.00007
- Output: 300 / 1,000,000 × $0.30 = $0.00009
- Total: ~$0.00016 por escaneo
```

**Costos mensuales de inference:**

| Escenario | Escaneos | Costo Flash | Costo Pro |
|-----------|----------|-------------|-----------|
| Alpha (500) | 500 | $0.08 | $1.50 |
| Beta (5K) | 5,000 | $0.80 | $15 |
| Launch (20K) | 20,000 | $3.20 | $60 |
| Growth (100K) | 100,000 | $16 | $300 |
| Scale (500K) | 500,000 | $80 | $1,500 |

#### 2. Gemini Fine-Tuning (Supervised Tuning)

**Precios de fine-tuning:**

| Concepto | Precio |
|----------|--------|
| **Training** | $4.00 por 1M tokens de entrada |
| **Inference (tuned)** | 2x precio del modelo base |
| **Storage** | Incluido por 1 año |

**Cálculo de fine-tuning:**

```
Dataset de 10,000 recibos:
- ~1,000 tokens por ejemplo (imagen + texto)
- Total: 10M tokens de training

Costo de training:
- 10M × $4.00 / 1M = $40 por epoch
- 3-5 epochs típicos = $120 - $200 total

Inference post-tuning (flash):
- Input: $0.15 / 1M tokens (2x)
- Output: $0.60 / 1M tokens (2x)
- ~$0.00032 por escaneo
```

**Costos mensuales con modelo fine-tuned:**

| Escenario | Escaneos | Training (one-time) | Inference Mensual |
|-----------|----------|---------------------|-------------------|
| Beta (5K) | 5,000 | $150 | $1.60 |
| Launch (20K) | 20,000 | $150 | $6.40 |
| Growth (100K) | 100,000 | $150 | $32 |
| Scale (500K) | 500,000 | $150 | $160 |

#### 3. Cloud Storage (Imágenes de Recibos)

**Precios Cloud Storage:**

| Tier | Precio/GB/mes | Uso |
|------|---------------|-----|
| Standard | $0.020 | Acceso frecuente |
| Nearline | $0.010 | Acceso mensual |
| Coldline | $0.004 | Acceso trimestral |
| Archive | $0.0012 | Training data histórico |

**Cálculo de storage:**

```
Tamaño promedio de imagen: 500KB (comprimida JPEG)

Por escenario:
- Alpha (500 imgs): 250MB = $0.005/mes
- Beta (5K imgs): 2.5GB = $0.05/mes
- Launch (20K imgs): 10GB = $0.20/mes
- Growth (100K imgs): 50GB = $1.00/mes
- Scale (500K imgs): 250GB = $5.00/mes

Estrategia de tiering:
- Últimos 30 días: Standard
- 30-90 días: Nearline
- 90+ días: Coldline/Archive
```

#### 4. Firestore (Datos Estructurados)

**Precios Firestore:**

| Operación | Precio |
|-----------|--------|
| Document reads | $0.036 / 100K |
| Document writes | $0.108 / 100K |
| Document deletes | $0.012 / 100K |
| Storage | $0.108 / GB |

**Cálculo de Firestore:**

```
Por transacción guardada:
- 1 write (transaction): $0.00000108
- 1 write (correction avg): $0.00000108
- Storage (~2KB): negligible

Reads mensuales estimados (app usage):
- 50 reads por sesión
- 10 sesiones por usuario por mes
- 500 reads por usuario por mes

Por escenario mensual:
- Alpha (50 users): 25K reads = $0.009
- Beta (500 users): 250K reads = $0.09
- Launch (2K users): 1M reads = $0.36
- Growth (10K users): 5M reads = $1.80
- Scale (50K users): 25M reads = $9.00
```

#### 5. Cloud Functions (Procesamiento)

**Precios Cloud Functions (2nd gen):**

| Recurso | Precio |
|---------|--------|
| Invocations | $0.40 / 1M |
| CPU | $0.0000100 / GHz-second |
| Memory | $0.0000025 / GB-second |

**Cálculo de Functions:**

```
Por escaneo de recibo:
- 1 invocation
- ~2 segundos de processing
- 512MB memory, 1 CPU

Costo por invocation:
- Invocation: $0.0000004
- CPU (2s × 1GHz): $0.00002
- Memory (2s × 0.5GB): $0.0000025
- Total: ~$0.00003 por escaneo

Por escenario mensual:
- Alpha (500): $0.015
- Beta (5K): $0.15
- Launch (20K): $0.60
- Growth (100K): $3.00
- Scale (500K): $15.00
```

### Tabla Consolidada de Costos Mensuales

#### Sin Fine-Tuning (Gemini Flash directo)

| Escenario | Gemini API | Storage | Firestore | Functions | **Total/Mes** |
|-----------|------------|---------|-----------|-----------|---------------|
| **Alpha** | $0.08 | $0.01 | $0.01 | $0.02 | **$0.12** |
| **Beta** | $0.80 | $0.05 | $0.10 | $0.15 | **$1.10** |
| **Launch** | $3.20 | $0.20 | $0.40 | $0.60 | **$4.40** |
| **Growth** | $16 | $1.00 | $2.00 | $3.00 | **$22** |
| **Scale** | $80 | $5.00 | $10.00 | $15.00 | **$110** |

#### Con Fine-Tuning (después de training inicial de $150)

| Escenario | Gemini Tuned | Storage | Firestore | Functions | **Total/Mes** |
|-----------|--------------|---------|-----------|-----------|---------------|
| **Alpha** | $0.16 | $0.01 | $0.01 | $0.02 | **$0.20** |
| **Beta** | $1.60 | $0.05 | $0.10 | $0.15 | **$1.90** |
| **Launch** | $6.40 | $0.20 | $0.40 | $0.60 | **$7.60** |
| **Growth** | $32 | $1.00 | $2.00 | $3.00 | **$38** |
| **Scale** | $160 | $5.00 | $10.00 | $15.00 | **$190** |

### Comparativa: Vertex AI vs Alternativas

```
┌─────────────────────────────────────────────────────────────────────────┐
│           COSTO POR 100,000 ESCANEOS MENSUALES                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Vertex AI (Gemini Flash)         $16/mes                               │
│  ████████                                                                │
│                                                                          │
│  Vertex AI (Gemini Fine-tuned)    $32/mes + $150 one-time              │
│  ████████████████                                                        │
│                                                                          │
│  OpenAI GPT-4V                    $200/mes                              │
│  ████████████████████████████████████████████████████████████████████   │
│                                                                          │
│  Modal (Qwen2-VL self-hosted)     $50/mes                               │
│  █████████████████████████                                               │
│                                                                          │
│  AWS Textract + Bedrock           $150/mes                              │
│  ██████████████████████████████████████████████████████████████         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recomendación por Fase

| Fase | Recomendación | Costo Estimado | Justificación |
|------|---------------|----------------|---------------|
| **Alpha** | Gemini Flash directo | ~$1/mes | Mínimo viable, colectar datos |
| **Beta** | Gemini Flash + prompts mejorados | ~$2/mes | Iterar en prompts, seguir colectando |
| **Launch** | Evaluar fine-tuning | $150 + $8/mes | Si accuracy es problema |
| **Growth** | Fine-tuned model | ~$40/mes | ROI claro en accuracy |
| **Scale** | Hybrid (fine-tuned + open source) | ~$100/mes | Optimizar costos |

### Break-Even Analysis: Fine-Tuning

```
¿Cuándo conviene fine-tuning?

Costo de training: $150 (one-time)
Incremento en inference: 2x ($0.00016 → $0.00032)

Si accuracy mejora de 80% → 95%:
- Menos correcciones manuales
- Mejor retención de usuarios
- Valor intangible alto

Break-even en costos puros:
- No hay break-even directo (modelo tuned es más caro)
- Pero: valor está en ACCURACY, no en costo

Recomendación:
- Fine-tune cuando tengas 10K+ receipts
- El costo de $150 es trivial comparado con el valor
- La mejora en accuracy justifica el 2x en inference
```

---

## Plan de Implementación Sugerido

### Fase 1: Fundación (Ahora - Semana 4)

```
Semana 1-2:
├── Implementar schema de corrections en Firestore
├── Agregar Cloud Storage para imágenes
└── Actualizar Transaction type con campos ML

Semana 3-4:
├── Crear hook useTransactionEditor con tracking
├── Implementar logCorrection service
└── Agregar consent flow en settings

Costo estimado: $0 adicional (dentro de free tier)
```

### Fase 2: Acumulación (Mes 2-3)

```
Mes 2:
├── Alcanzar 1,000 recibos con correcciones
├── Analizar patrones de corrección
└── Construir merchant database inicial

Mes 3:
├── Alcanzar 5,000 recibos
├── Implementar auto-corrections para patrones frecuentes
└── Evaluar accuracy actual vs correcciones

Costo estimado: ~$5/mes
```

### Fase 3: Fine-Tuning (Mes 4-5)

```
Mes 4:
├── Exportar dataset de training (10K+ receipts)
├── Fine-tune Gemini en Vertex AI
├── Evaluar accuracy en test set

Mes 5:
├── Deploy modelo fine-tuned
├── A/B test vs modelo base
└── Medir impacto en correcciones

Costo estimado: $150 training + ~$10/mes inference
```

---

¿Te gustaría que profundicemos en algún aspecto específico? Puedo:
1. Escribir el código completo para el consent flow
2. Crear el Cloud Function para exportar training data
3. Diseñar el dashboard de métricas de ML
4. Preparar el script de fine-tuning en Vertex AI