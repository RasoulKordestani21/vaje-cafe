# API Patterns & Helpers Guide

This document outlines the standard patterns for API development in the Vaje Cafe project, including authentication, price handling, and Persian input processing.

## Authentication Pattern

### Admin API Authentication

All admin APIs should follow this authentication pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { initializeDatabase, getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize database connection
    initializeDatabase();
    
    // 2. Check admin authentication
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;
    
    // 3. Your API logic here
    const db = getDatabase();
    // ... database operations
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "خطا در پردازش درخواست" },
      { status: 500 }
    );
  }
}
```

### Authentication Methods Supported

The `requireAdminAccess` function supports two authentication methods:

1. **Session Cookie**: For logged-in admin users in the web interface
2. **API Token**: Using `x-access-token` header or `Authorization: Bearer <token>` header

### Super Admin Only APIs

For APIs that require super admin access:

```typescript
import { requireSuperAdminAccess } from "@/lib/adminApiAuth";

export async function DELETE(request: NextRequest) {
  const auth = requireSuperAdminAccess(request);
  if (!auth.authorized) return auth.error;
  
  // Super admin only operations
}
```

## Price Input & Parsing Pattern

### Frontend Price Input

Use the `PriceInput` component for consistent Persian price input handling:

```typescript
import { PriceInput } from "@/components/ui/PriceInput";

function MyComponent() {
  const [amount, setAmount] = useState('');

  return (
    <PriceInput
      label="مبلغ"
      value={amount}
      onChange={(value, numericValue) => {
        setAmount(value); // Raw string value for state
        // numericValue is the parsed integer
      }}
      required
      min={1}
      placeholder="۰"
    />
  );
}
```

### Backend Price Parsing

For API endpoints that receive price data, use this pattern:

```typescript
import { parsePersianPrice, validatePriceInput } from "@/utils/format";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    const body = await request.json();
    const { amount: amountInput, category, description } = body;

    // Parse and validate price input
    const amount = parsePersianPrice(amountInput);
    const validation = validatePriceInput(amountInput, 1); // min 1 toman
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Use the validated amount
    const db = getDatabase();
    // ... save amount to database
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "خطا در پردازش مبلغ" },
      { status: 500 }
    );
  }
}
```

## Utility Functions Reference

### Price Parsing & Validation

```typescript
import { 
  parsePersianPrice,
  validatePriceInput,
  formatPersianPriceInput,
  sanitizePriceInput
} from "@/utils/format";

// Parse Persian digits and return numeric value
const amount = parsePersianPrice("۱۰۰,۰۰۰"); // Returns: 100000

// Validate price input with constraints
const validation = validatePriceInput("۵۰,۰۰۰", 1000, 1000000);
// Returns: { isValid: true, value: 50000 }

// Format input for display (adds Persian commas)
const formatted = formatPersianPriceInput("50000"); // Returns: "۵۰,۰۰۰"

// Clean raw input (removes non-digits, converts Persian/Arabic digits)
const clean = sanitizePriceInput("۱۰۰,۰۰۰ تومان"); // Returns: "100000"
```

### Persian Digit Conversion

```typescript
import { toPersianDigits, toEnglishDigits } from "@/utils/format";

// Convert to Persian digits for display
const persian = toPersianDigits("123456"); // Returns: "۱۲۳۴۵۶"

// Convert to English digits for processing
const english = toEnglishDigits("۱۲۳۴۵۶"); // Returns: "123456"
```

### Price Display

```typescript
import { formatToman } from "@/utils/format";

// Format number as currency
const formatted = formatToman(50000); // Returns: "۵۰,۰۰۰ تومان"
```

## Complete API Example

Here's a complete example of an expense API endpoint following all patterns:

```typescript
// /app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";
import { parsePersianPrice, validatePriceInput } from "@/utils/format";
import { v4 as uuidv4 } from "uuid";

initializeDatabase();

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const auth = requireAdminAccess(request);
    if (!auth.authorized) return auth.error;

    // 2. Parse request body
    const body = await request.json();
    const { category, amount: amountInput, description, date } = body;

    // 3. Validate required fields
    if (!category || !amountInput || !date) {
      return NextResponse.json(
        { error: "دسته‌بندی، مبلغ و تاریخ الزامی است" },
        { status: 400 }
      );
    }

    // 4. Parse and validate price
    const amount = parsePersianPrice(amountInput);
    const validation = validatePriceInput(amountInput, 1);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 5. Validate category
    if (!["rent", "bills", "staff_salaries", "other"].includes(category)) {
      return NextResponse.json(
        { error: "دسته‌بندی نامعتبر است" },
        { status: 400 }
      );
    }

    // 6. Database operations
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);
    const expenseId = uuidv4();

    db.prepare(`
      INSERT INTO expenses (id, category, amount, description, date, created_by, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expenseId,
      category,
      amount, // Use validated amount
      description || null,
      date,
      auth.userId,
      now,
      now
    );

    const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(expenseId);

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد هزینه" },
      { status: 500 }
    );
  }
}
```

## Frontend Form Example

Complete form example with Persian price handling:

```tsx
"use client";

import { useState } from "react";
import { PriceInput } from "@/components/ui/PriceInput";
import { Button } from "@/components/ui/button";
import { parsePersianPrice } from "@/utils/format";

export function ExpenseForm() {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send raw amount string to API (API will parse it)
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': localStorage.getItem('adminToken') || ''
        },
        body: JSON.stringify({
          category: formData.category,
          amount: formData.amount, // Raw string
          description: formData.description,
          date: Math.floor(Date.now() / 1000)
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'خطا در ارسال');
      }

      // Success handling
      console.log('Expense created:', result.expense);
      
    } catch (error) {
      console.error('Form error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PriceInput
        label="مبلغ هزینه"
        value={formData.amount}
        onChange={(value, numericValue) => 
          setFormData(prev => ({ ...prev, amount: value }))
        }
        required
        min={1}
        placeholder="مبلغ را وارد کنید"
      />
      
      <Button 
        type="submit" 
        disabled={loading || !formData.amount}
      >
        {loading ? "در حال ارسال..." : "ثبت هزینه"}
      </Button>
    </form>
  );
}
```

## Error Handling Best Practices

### API Error Responses

Always return Persian error messages:

```typescript
// Bad
return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

// Good
return NextResponse.json({ error: "مبلغ نامعتبر است" }, { status: 400 });
```

### Common Error Messages

```typescript
const ERROR_MESSAGES = {
  UNAUTHORIZED: "شما مجاز به انجام این عمل نیستید",
  INVALID_PRICE: "مبلغ وارد شده نامعتبر است",
  PRICE_TOO_LOW: "مبلغ باید بیشتر از صفر باشد",
  PRICE_TOO_HIGH: "مبلغ وارد شده بیش از حد مجاز است",
  REQUIRED_FIELDS: "لطفاً تمام فیلدهای الزامی را پر کنید",
  SERVER_ERROR: "خطا در سرور، لطفاً مجدداً تلاش کنید"
};
```

## Testing Price APIs

Example test for price parsing:

```typescript
// Test Persian digit input
const testCases = [
  { input: "۱۰۰,۰۰۰", expected: 100000 },
  { input: "٥٠٠٠٠", expected: 50000 }, // Arabic digits
  { input: "50000", expected: 50000 },   // English digits
  { input: "۱۰۰,۰۰۰ تومان", expected: 100000 }, // With currency
];

testCases.forEach(({ input, expected }) => {
  const result = parsePersianPrice(input);
  console.assert(result === expected, `Failed for ${input}`);
});
```

This pattern ensures consistent handling of Persian price inputs across all APIs and frontend components in the Vaje Cafe application.