# Forms Standards: React Hook Form + Zod

## Official Documentation

- **React Hook Form**: https://react-hook-form.com/
- **RHF TypeScript**: https://react-hook-form.com/ts
- **RHF API Reference**: https://react-hook-form.com/docs
- **Zod**: https://zod.dev/
- **@hookform/resolvers**: https://github.com/react-hook-form/resolvers
- **Testing RHF**: https://claritydev.net/blog/testing-react-hook-form-with-react-testing-library

## Core Setup

### Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

### Basic Pattern

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 1. Define schema
const schema = z.object({
  merchant: z.string().min(1, 'Ingresa el comercio'),
  total: z.number().positive('El monto debe ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido'),
})

// 2. Infer type from schema
type FormData = z.infer<typeof schema>

// 3. Use in component
function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      merchant: '',
      total: 0,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: FormData) => {
    // data is fully typed and validated
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

## Zod Schemas for Gastify

### Transaction Schema

```typescript
// src/entities/transaction/model/schema.ts
import { z } from 'zod'
import { STORE_CATEGORIES } from '@entities/category'

// Item schema
export const transactionItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  price: z
    .number()
    .int('El precio debe ser entero')
    .nonnegative('El precio no puede ser negativo'),
  quantity: z.number().int().positive().optional().default(1),
  category: z.string().optional(),
})

// Main transaction schema
export const transactionSchema = z.object({
  merchant: z
    .string()
    .min(1, 'Ingresa el comercio')
    .max(100, 'Nombre muy largo'),
  
  alias: z
    .string()
    .max(50, 'Alias muy largo')
    .optional(),
  
  total: z
    .number()
    .int('El total debe ser un número entero (CLP)')
    .positive('El total debe ser positivo')
    .max(999999999, 'Monto demasiado grande'),
  
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    }, 'Fecha inválida'),
  
  category: z.enum(
    Object.values(STORE_CATEGORIES) as [string, ...string[]],
    { errorMap: () => ({ message: 'Categoría inválida' }) }
  ),
  
  items: z
    .array(transactionItemSchema)
    .optional()
    .default([]),
})

export type TransactionFormData = z.infer<typeof transactionSchema>
export type TransactionItemFormData = z.infer<typeof transactionItemSchema>
```

### Settings Schema

```typescript
// src/features/settings/model/schema.ts
import { z } from 'zod'

export const settingsSchema = z.object({
  language: z.enum(['es', 'en'], {
    errorMap: () => ({ message: 'Idioma no soportado' }),
  }),
  
  currency: z.enum(['CLP', 'USD', 'COP', 'MXN', 'ARS'], {
    errorMap: () => ({ message: 'Moneda no soportada' }),
  }),
  
  theme: z.enum(['light', 'dark', 'system'], {
    errorMap: () => ({ message: 'Tema no válido' }),
  }),
  
  notifications: z.object({
    push: z.boolean(),
    email: z.boolean(),
    weeklyReport: z.boolean(),
  }),
})

export type SettingsFormData = z.infer<typeof settingsSchema>
```

### User Profile Schema (with RUT)

```typescript
// src/entities/user/model/schema.ts
import { z } from 'zod'
import { validateRut } from '@fdograph/rut-utilities'

export const userProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo'),
  
  email: z
    .string()
    .email('Email inválido'),
  
  rut: z
    .string()
    .min(8, 'RUT muy corto')
    .max(12, 'RUT muy largo')
    .refine((val) => validateRut(val), 'RUT inválido')
    .optional(),
  
  phone: z
    .string()
    .regex(/^\+?56?9?\d{8}$/, 'Formato: +56912345678')
    .optional(),
})

export type UserProfileFormData = z.infer<typeof userProfileSchema>
```

## Form Components

### Form Provider Pattern

```typescript
// src/shared/ui/Form.tsx
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface FormProps<T extends z.ZodType> {
  schema: T
  defaultValues?: Partial<z.infer<T>>
  onSubmit: (data: z.infer<T>) => void | Promise<void>
  children: React.ReactNode
  className?: string
}

export function Form<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
}: FormProps<T>) {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onBlur',
  })

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={methods.handleSubmit(onSubmit)}
        className={className}
      >
        {children}
      </form>
    </FormProvider>
  )
}
```

### Text Input

```typescript
// src/shared/ui/Input.tsx
import { useFormContext } from 'react-hook-form'

interface InputProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  disabled?: boolean
}

export function Input({
  name,
  label,
  type = 'text',
  placeholder,
  disabled,
}: InputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  return (
    <div className="space-y-1">
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={`
          block w-full rounded-md border px-3 py-2
          focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-green-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
      />
      {error && (
        <p className="text-sm text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  )
}
```

### Currency Input (CLP)

```typescript
// src/shared/ui/CurrencyInput.tsx
import { Controller, useFormContext } from 'react-hook-form'
import { parseCLP } from '@shared/lib/currency'

interface CurrencyInputProps {
  name: string
  label: string
  disabled?: boolean
}

export function CurrencyInput({ name, label, disabled }: CurrencyInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  return (
    <div className="space-y-1">
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              id={name}
              type="text"
              inputMode="numeric"
              disabled={disabled}
              className={`
                block w-full rounded-md border pl-7 pr-3 py-2
                focus:outline-none focus:ring-2
                ${error 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-green-500'
                }
              `}
              value={field.value ? formatWithDots(field.value) : ''}
              onChange={(e) => {
                const parsed = parseCLP(e.target.value)
                field.onChange(parsed ?? 0)
              }}
              onBlur={field.onBlur}
            />
          </div>
        )}
      />
      {error && (
        <p className="text-sm text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  )
}

function formatWithDots(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num)
}
```

### Select Input

```typescript
// src/shared/ui/Select.tsx
import { useFormContext } from 'react-hook-form'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  name: string
  label: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
}

export function Select({
  name,
  label,
  options,
  placeholder = 'Seleccionar...',
  disabled,
}: SelectProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  return (
    <div className="space-y-1">
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={`
          block w-full rounded-md border px-3 py-2
          focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-green-500'
          }
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  )
}
```

### Date Input

```typescript
// src/shared/ui/DateInput.tsx
import { useFormContext } from 'react-hook-form'

interface DateInputProps {
  name: string
  label: string
  min?: string
  max?: string
  disabled?: boolean
}

export function DateInput({
  name,
  label,
  min,
  max,
  disabled,
}: DateInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]

  return (
    <div className="space-y-1">
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={name}
        type="date"
        min={min}
        max={max ?? new Date().toISOString().split('T')[0]}
        disabled={disabled}
        {...register(name)}
        className={`
          block w-full rounded-md border px-3 py-2
          focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-green-500'
          }
        `}
      />
      {error && (
        <p className="text-sm text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  )
}
```

### Submit Button

```typescript
// src/shared/ui/SubmitButton.tsx
import { useFormContext } from 'react-hook-form'

interface SubmitButtonProps {
  children: React.ReactNode
  loadingText?: string
}

export function SubmitButton({ 
  children, 
  loadingText = 'Guardando...' 
}: SubmitButtonProps) {
  const { formState: { isSubmitting, isValid } } = useFormContext()

  return (
    <button
      type="submit"
      disabled={isSubmitting || !isValid}
      className={`
        w-full py-2 px-4 rounded-md font-medium
        transition-colors duration-200
        ${isSubmitting || !isValid
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
        }
      `}
    >
      {isSubmitting ? loadingText : children}
    </button>
  )
}
```

## Complete Form Example

### Transaction Form

```typescript
// src/features/edit-transaction/ui/TransactionForm.tsx
import { Form, Input, CurrencyInput, DateInput, Select, SubmitButton } from '@shared/ui'
import { transactionSchema, type TransactionFormData } from '@entities/transaction'
import { STORE_CATEGORIES } from '@entities/category'
import { useCreateTransaction, useUpdateTransaction } from '@entities/transaction'
import { useAuth } from '@entities/user'

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>
  transactionId?: string  // If editing
  onSuccess?: () => void
}

export function TransactionForm({
  initialData,
  transactionId,
  onSuccess,
}: TransactionFormProps) {
  const { user } = useAuth()
  const createMutation = useCreateTransaction(user!.uid)
  const updateMutation = useUpdateTransaction(user!.uid)

  const isEditing = !!transactionId

  const categoryOptions = Object.entries(STORE_CATEGORIES).map(([key, value]) => ({
    value: value,
    label: value,
  }))

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: transactionId, ...data })
      } else {
        await createMutation.mutateAsync(data)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  return (
    <Form
      schema={transactionSchema}
      defaultValues={{
        merchant: '',
        total: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Otros',
        items: [],
        ...initialData,
      }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        name="merchant"
        label="Comercio"
        placeholder="Ej: Líder, Jumbo, Copec"
      />

      <Input
        name="alias"
        label="Alias (opcional)"
        placeholder="Nombre personalizado"
      />

      <CurrencyInput
        name="total"
        label="Total"
      />

      <DateInput
        name="date"
        label="Fecha"
      />

      <Select
        name="category"
        label="Categoría"
        options={categoryOptions}
      />

      <SubmitButton>
        {isEditing ? 'Actualizar' : 'Guardar'}
      </SubmitButton>
    </Form>
  )
}
```

## Advanced Patterns

### Dynamic Field Arrays

```typescript
// For transaction items
import { useFieldArray, useFormContext } from 'react-hook-form'

function ItemsEditor() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Productos
      </label>
      
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Input name={`items.${index}.name`} label="" placeholder="Producto" />
          <CurrencyInput name={`items.${index}.price`} label="" />
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => append({ name: '', price: 0 })}
        className="text-green-600 hover:text-green-700 text-sm"
      >
        + Agregar producto
      </button>
    </div>
  )
}
```

### Conditional Validation

```typescript
const conditionalSchema = z.object({
  hasDiscount: z.boolean(),
  discountPercent: z.number().optional(),
}).refine(
  (data) => {
    if (data.hasDiscount && !data.discountPercent) {
      return false
    }
    return true
  },
  {
    message: 'Ingresa el porcentaje de descuento',
    path: ['discountPercent'],
  }
)
```

### Async Validation

```typescript
const asyncSchema = z.object({
  email: z
    .string()
    .email()
    .refine(async (email) => {
      // Check if email exists in database
      const exists = await checkEmailExists(email)
      return !exists
    }, 'Este email ya está registrado'),
})
```

### Form with Confirmation

```typescript
function DeleteConfirmForm({ onDelete }: { onDelete: () => void }) {
  const schema = z.object({
    confirmation: z.literal('ELIMINAR', {
      errorMap: () => ({ message: 'Escribe ELIMINAR para confirmar' }),
    }),
  })

  return (
    <Form
      schema={schema}
      onSubmit={onDelete}
      className="space-y-4"
    >
      <p className="text-gray-600">
        Escribe <strong>ELIMINAR</strong> para confirmar:
      </p>
      <Input name="confirmation" label="" placeholder="ELIMINAR" />
      <SubmitButton>Eliminar definitivamente</SubmitButton>
    </Form>
  )
}
```

## Error Messages (Spanish)

```typescript
// src/shared/lib/zodErrorMap.ts
import { z } from 'zod'

export const zodErrorMapES: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string') return { message: 'Texto requerido' }
      if (issue.expected === 'number') return { message: 'Número requerido' }
      return { message: 'Tipo inválido' }
    
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Mínimo ${issue.minimum} caracteres` }
      }
      if (issue.type === 'number') {
        return { message: `Debe ser mayor a ${issue.minimum}` }
      }
      return { message: 'Valor muy pequeño' }
    
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Máximo ${issue.maximum} caracteres` }
      }
      return { message: 'Valor muy grande' }
    
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'Email inválido' }
      if (issue.validation === 'url') return { message: 'URL inválida' }
      return { message: 'Formato inválido' }
    
    default:
      return { message: ctx.defaultError }
  }
}

// Apply globally
z.setErrorMap(zodErrorMapES)
```

## Testing Forms

```typescript
// src/features/edit-transaction/ui/TransactionForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionForm } from './TransactionForm'

describe('TransactionForm', () => {
  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    render(<TransactionForm onSuccess={vi.fn()} />)
    
    // Submit without filling
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/ingresa el comercio/i)).toBeInTheDocument()
    })
  })

  it('submits valid data', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<TransactionForm onSuccess={onSuccess} />)
    
    await user.type(screen.getByLabelText(/comercio/i), 'Líder')
    await user.type(screen.getByLabelText(/total/i), '45990')
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('validates CLP amounts as integers', async () => {
    const user = userEvent.setup()
    render(<TransactionForm onSuccess={vi.fn()} />)
    
    // Try to enter decimal
    await user.type(screen.getByLabelText(/total/i), '123.45')
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    
    // Should parse as 12345 (removing dots as thousand separators)
    // or show validation error depending on implementation
  })
})
```

## Best Practices Summary

| Do | Don't |
|----|-------|
| Use Zod schemas for all forms | Use inline validation |
| Infer types from schemas: `z.infer<typeof schema>` | Manually define duplicate types |
| Use `Controller` for custom inputs | Use `ref` with custom components |
| Show Spanish error messages | Show English errors in Chilean app |
| Validate CLP as integers | Allow decimal inputs for CLP |
| Use `mode: 'onBlur'` for better UX | Use `mode: 'onChange'` (too aggressive) |
| Disable submit while submitting | Allow double submissions |
| Test validation rules | Only test happy path |
