# Chilean Fintech Standards

## Official Resources

- **RUT Utilities**: https://www.npmjs.com/package/@fdograph/rut-utilities
- **Chile RUT (alternative)**: https://github.com/cristiansantana/chile-rut
- **Khipu API**: https://docs.khipu.com/
- **Fintoc API**: https://docs.fintoc.com/
- **devsChile Community**: https://github.com/devschile

## Currency: Chilean Peso (CLP)

### Critical Rule: NO DECIMALS

Chilean Peso is one of the few currencies with **zero decimal places** (ISO 4217 exponent: 0).

```typescript
// ❌ WRONG - CLP doesn't have centavos
const amount = 1234.56
const total = 99.99

// ✅ CORRECT - Always integers
const amount = 1234
const total = 100
```

### Storage & Types

```typescript
// src/entities/transaction/model/types.ts

interface Transaction {
  id: string
  merchant: string
  date: string  // ISO: "2025-01-20"
  
  // CLP amounts are ALWAYS integers
  total: number       // e.g., 45990 (not 45990.00)
  
  items: TransactionItem[]
}

interface TransactionItem {
  name: string
  price: number       // Integer CLP
  quantity?: number
  category?: string
}
```

### Formatting for Display

```typescript
// src/shared/lib/currency.ts

type Currency = 'CLP' | 'USD' | 'COP' | 'MXN' | 'ARS'

interface CurrencyConfig {
  locale: string
  currency: Currency
  decimals: number
}

const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  CLP: { locale: 'es-CL', currency: 'CLP', decimals: 0 },
  USD: { locale: 'en-US', currency: 'USD', decimals: 2 },
  COP: { locale: 'es-CO', currency: 'COP', decimals: 0 },
  MXN: { locale: 'es-MX', currency: 'MXN', decimals: 2 },
  ARS: { locale: 'es-AR', currency: 'ARS', decimals: 2 },
}

export function formatCurrency(
  amount: number, 
  currency: Currency = 'CLP'
): string {
  const config = CURRENCY_CONFIG[currency]
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)
}

// Usage
formatCurrency(123456, 'CLP')      // "$123.456"
formatCurrency(123456, 'COP')      // "$ 123.456"
formatCurrency(1234.56, 'USD')     // "$1,234.56"
formatCurrency(1234.56, 'MXN')     // "$1,234.56"
```

### Input Parsing

```typescript
// src/shared/lib/currency.ts

/**
 * Parse a Chilean currency string to integer
 * Handles: "$123.456", "123456", "123.456", "$123,456"
 */
export function parseCLP(input: string): number | null {
  if (!input) return null
  
  // Remove currency symbol, spaces, and thousand separators
  const cleaned = input
    .replace(/[$\s]/g, '')      // Remove $ and spaces
    .replace(/\./g, '')          // Remove Chilean thousand separator (.)
    .replace(/,/g, '')           // Remove alternative thousand separator (,)
  
  const parsed = parseInt(cleaned, 10)
  
  if (isNaN(parsed)) return null
  if (parsed < 0) return null
  
  return parsed
}

// Usage
parseCLP('$123.456')    // 123456
parseCLP('123456')      // 123456
parseCLP('123.456')     // 123456
parseCLP('$1.234.567')  // 1234567
parseCLP('invalid')     // null
```

### Zod Schema for CLP

```typescript
// src/shared/lib/validation.ts
import { z } from 'zod'

export const clpAmountSchema = z
  .number()
  .int('El monto debe ser un número entero')
  .positive('El monto debe ser positivo')
  .max(999999999, 'El monto es demasiado grande')

export const clpStringSchema = z
  .string()
  .transform((val) => parseCLP(val))
  .refine((val) => val !== null, 'Monto inválido')
  .refine((val) => val! > 0, 'El monto debe ser positivo')

// For transaction forms
export const transactionSchema = z.object({
  merchant: z.string().min(1, 'Ingresa el comercio'),
  total: clpAmountSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  category: z.string(),
  items: z.array(z.object({
    name: z.string().min(1),
    price: clpAmountSchema,
  })).optional(),
})
```

### React Hook Form Currency Input

```typescript
// src/shared/ui/CurrencyInput.tsx
import { Controller, useFormContext } from 'react-hook-form'
import { formatCurrency, parseCLP } from '@shared/lib/currency'

interface CurrencyInputProps {
  name: string
  label: string
  currency?: 'CLP' | 'USD' | 'COP' | 'MXN'
}

export function CurrencyInput({ 
  name, 
  label, 
  currency = 'CLP' 
}: CurrencyInputProps) {
  const { control, formState: { errors } } = useFormContext()
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text"
              inputMode="numeric"
              className="pl-7 block w-full rounded-md border-gray-300"
              value={field.value ? formatNumber(field.value) : ''}
              onChange={(e) => {
                const parsed = parseCLP(e.target.value)
                field.onChange(parsed ?? 0)
              }}
              onBlur={field.onBlur}
            />
          </div>
          {errors[name] && (
            <p className="mt-1 text-sm text-red-600">
              {errors[name]?.message as string}
            </p>
          )}
        </div>
      )}
    />
  )
}

// Helper to format number with thousand separators
function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num)
}
```

## RUT Validation (Chilean National ID)

### Installation

```bash
npm install @fdograph/rut-utilities
```

### Usage

```typescript
// src/shared/lib/rut.ts
import { 
  validateRut, 
  formatRut, 
  deconstructRut,
  RutFormat 
} from '@fdograph/rut-utilities'

// Validation
validateRut('18585543-0')           // true
validateRut('18.585.543-0')         // true
validateRut('185855430')            // true
validateRut('12345678-9')           // false (invalid)

// Formatting
formatRut('185855430')                        // '18585543-0'
formatRut('185855430', RutFormat.DOTS_DASH)   // '18.585.543-0'
formatRut('18.585.543-0', RutFormat.DASH)     // '18585543-0'

// Deconstruct
deconstructRut('18.585.543-0')
// { digits: '18585543', verifier: '0' }
```

### Zod Schema for RUT

```typescript
// src/shared/lib/validation.ts
import { z } from 'zod'
import { validateRut, formatRut, RutFormat } from '@fdograph/rut-utilities'

export const rutSchema = z
  .string()
  .min(8, 'RUT muy corto')
  .max(12, 'RUT muy largo')
  .refine(
    (val) => validateRut(val),
    'RUT inválido'
  )
  .transform((val) => formatRut(val, RutFormat.DOTS_DASH))

// Usage in form
const userSchema = z.object({
  name: z.string().min(1),
  rut: rutSchema,
  email: z.string().email(),
})
```

### RUT Input Component

```typescript
// src/shared/ui/RutInput.tsx
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { formatRut, RutFormat } from '@fdograph/rut-utilities'

interface RutInputProps {
  name: string
  label?: string
}

export function RutInput({ name, label = 'RUT' }: RutInputProps) {
  const { control, formState: { errors } } = useFormContext()
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="12.345.678-9"
            className="mt-1 block w-full rounded-md border-gray-300"
            value={field.value || ''}
            onChange={(e) => {
              // Auto-format as user types
              const formatted = formatRut(e.target.value, RutFormat.DOTS_DASH)
              field.onChange(formatted)
            }}
            onBlur={field.onBlur}
          />
          {errors[name] && (
            <p className="mt-1 text-sm text-red-600">
              {errors[name]?.message as string}
            </p>
          )}
        </div>
      )}
    />
  )
}
```

## Chilean Date Formats

```typescript
// src/shared/lib/date.ts

/**
 * Format date for Chilean locale
 */
export function formatDateCL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// "21-01-2025" (Chilean format: DD-MM-YYYY)

/**
 * Format date with weekday
 */
export function formatDateLongCL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

// "martes, 21 de enero de 2025"

/**
 * Relative time in Spanish
 */
export function formatRelativeTimeCL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`
  return `hace ${Math.floor(diffDays / 365)} años`
}
```

## Chilean Store Categories

```typescript
// src/entities/category/model/constants.ts

export const STORE_CATEGORIES = {
  // Supermercados chilenos
  GROCERIES: 'Supermercado',
  
  // Restaurantes y comida
  RESTAURANT: 'Restaurante',
  FAST_FOOD: 'Comida Rápida',
  CAFE: 'Cafetería',
  
  // Transporte
  TRANSPORT: 'Transporte',
  FUEL: 'Combustible',
  
  // Servicios
  UTILITIES: 'Servicios Básicos',
  HEALTHCARE: 'Salud',
  
  // Retail
  SHOPPING: 'Tiendas',
  PHARMACY: 'Farmacia',
  
  // Entretenimiento
  ENTERTAINMENT: 'Entretenimiento',
  
  // Otros
  OTHER: 'Otros',
} as const

export type StoreCategory = typeof STORE_CATEGORIES[keyof typeof STORE_CATEGORIES]

// Chilean supermarket chains for auto-categorization
export const CHILEAN_SUPERMARKETS = [
  'Líder', 'Jumbo', 'Santa Isabel', 'Unimarc', 
  'Tottus', 'Acuenta', 'Super Bodega', 'OK Market',
  'Cencosud', 'Walmart Chile'
]

export const CHILEAN_PHARMACIES = [
  'Cruz Verde', 'Salcobrand', 'Ahumada', 'Dr. Simi'
]

export const CHILEAN_FAST_FOOD = [
  'Doggis', 'Juan Maestro', 'Telepizza', 'Domino\'s',
  'McDonald\'s', 'Burger King', 'KFC', 'Subway'
]
```

## Chilean API Integrations

### Khipu (Payment Processing)

```typescript
// src/shared/api/khipu.ts
// Reference: https://docs.khipu.com/

interface KhipuPaymentRequest {
  subject: string
  amount: number  // Integer CLP
  currency: 'CLP'
  transaction_id: string
  return_url: string
  cancel_url: string
  notify_url: string
}

// Note: Khipu integration requires server-side implementation
// for security. This is just the type definition for reference.
```

### Fintoc (Open Banking)

```typescript
// src/shared/api/fintoc.ts
// Reference: https://docs.fintoc.com/

// Fintoc widget integration for bank connections
// Note: Requires Fintoc API keys and server-side validation

interface FintocConfig {
  publicKey: string
  holderType: 'individual' | 'business'
  product: 'movements' | 'payments'
  country: 'cl' | 'mx'
}
```

## Localization (i18n)

```typescript
// src/shared/lib/translations.ts

export const translations = {
  es: {
    // Navigation
    'nav.dashboard': 'Inicio',
    'nav.scan': 'Escanear',
    'nav.history': 'Historial',
    'nav.analytics': 'Análisis',
    'nav.settings': 'Ajustes',
    
    // Transaction
    'transaction.merchant': 'Comercio',
    'transaction.total': 'Total',
    'transaction.date': 'Fecha',
    'transaction.category': 'Categoría',
    'transaction.items': 'Productos',
    
    // Actions
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.delete': 'Eliminar',
    'action.edit': 'Editar',
    'action.scan': 'Escanear Boleta',
    
    // Messages
    'message.saved': '¡Guardado!',
    'message.deleted': 'Eliminado',
    'message.error': 'Ocurrió un error',
    'message.scanning': 'Analizando boleta...',
    
    // Currency
    'currency.clp': 'Peso Chileno',
    'currency.symbol': '$',
    
    // Time
    'time.today': 'Hoy',
    'time.yesterday': 'Ayer',
    'time.this_week': 'Esta semana',
    'time.this_month': 'Este mes',
  },
  en: {
    'nav.dashboard': 'Home',
    'nav.scan': 'Scan',
    // ... English translations
  }
}

export type TranslationKey = keyof typeof translations.es
```

## Best Practices Summary

| Area | Do | Don't |
|------|-----|-------|
| **CLP Storage** | Store as integer: `45990` | Store with decimals: `45990.00` |
| **CLP Display** | Use `Intl.NumberFormat('es-CL')` | Manual string formatting |
| **RUT Validation** | Use `@fdograph/rut-utilities` | Regex-only validation |
| **Dates** | ISO storage, Chilean display | Mixed formats |
| **Categories** | Chilean terminology | English-only categories |
| **Error Messages** | Spanish: "Monto inválido" | English: "Invalid amount" |
