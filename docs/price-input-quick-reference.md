# Persian Price Input - Quick Reference

## 🚀 Quick Start

### Frontend Component
```tsx
import { PriceInput } from "@/components/ui/PriceInput";

<PriceInput
  label="مبلغ"
  value={amount}
  onChange={(value, numericValue) => setAmount(value)}
  required
  min={1}
/>
```

### Backend API Pattern
```typescript
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { parsePersianPrice, validatePriceInput } from "@/utils/format";

export async function POST(request: NextRequest) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;
  
  const { amount: amountInput } = await request.json();
  const amount = parsePersianPrice(amountInput);
  const validation = validatePriceInput(amountInput, 1);
  
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  // Use validated `amount` (number)
}
```

## 📚 Available Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `parsePersianPrice(input)` | Convert any price input to number | `parsePersianPrice("۱۰۰,۰۰۰")` → `100000` |
| `validatePriceInput(input, min, max?)` | Validate with constraints | `validatePriceInput("۵۰۰۰", 1000)` |
| `formatPersianPriceInput(input)` | Format for display | `formatPersianPriceInput("50000")` → `"۵۰,۰۰۰"` |
| `sanitizePriceInput(input)` | Clean raw input | `sanitizePriceInput("۱۰۰,۰۰۰ تومان")` → `"100000"` |
| `formatToman(number)` | Display currency | `formatToman(50000)` → `"۵۰,۰۰۰ تومان"` |
| `toPersianDigits(input)` | Convert digits to Persian | `toPersianDigits("123")` → `"۱۲۳"` |
| `toEnglishDigits(input)` | Convert digits to English | `toEnglishDigits("۱۲۳")` → `"123"` |

## 🔧 Common Patterns

### Form State Management
```typescript
const [amount, setAmount] = useState('');

// In PriceInput onChange
onChange={(value, numericValue) => {
  setAmount(value);        // Store raw string for form state
  console.log(numericValue); // Use number for calculations
}}
```

### API Request
```typescript
// Send raw string to API
fetch('/api/expenses', {
  method: 'POST',
  body: JSON.stringify({ amount: formData.amount }) // Raw string
});
```

### Display Price
```typescript
// For display in UI
<span>{formatToman(price)}</span> // Shows: "۵۰,۰۰۰ تومان"
```

## 📝 PriceInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label text |
| `value` | `string \| number` | - | Current value |
| `onChange` | `(value: string, numeric: number) => void` | - | Change handler |
| `min` | `number` | `0` | Minimum allowed value |
| `max` | `number` | - | Maximum allowed value |
| `required` | `boolean` | `false` | Mark as required |
| `placeholder` | `string` | `"۰"` | Placeholder text |
| `showValidation` | `boolean` | `true` | Show validation errors |
| `showCurrency` | `boolean` | `true` | Show "تومان" suffix |

## ⚡ Input Support

The system accepts and automatically converts:
- **Persian digits**: `۱۲۳۴۵۶۷۸۹۰`
- **Arabic digits**: `٠١٢٣٤٥٦٧٨٩`
- **English digits**: `0123456789`
- **With commas**: `۱۰۰,۰۰۰`
- **With currency**: `۵۰,۰۰۰ تومان`
- **Mixed formats**: `50,۰۰۰ تومان`

## 🛡️ Validation Messages

Standard Persian validation messages:
- `"مبلغ الزامی است"` - Required field empty
- `"مبلغ باید بیشتر از صفر باشد"` - Below minimum
- `"مبلغ نباید بیشتر از ... تومان باشد"` - Above maximum

## 🔗 Authentication Pattern

All admin APIs use this pattern:
```typescript
const auth = requireAdminAccess(request);
if (!auth.authorized) return auth.error;
```

Supports both:
- Session cookies (web interface)
- API tokens (`x-access-token` header)