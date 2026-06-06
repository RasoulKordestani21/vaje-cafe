# Vaje Cafe - Complete Documentation

**Last Updated**: December 9, 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Authentication System](#authentication-system)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Implementation](#frontend-implementation)
6. [Environment Setup](#environment-setup)
7. [File Structure](#file-structure)
8. [Security Features](#security-features)
9. [Deployment Checklist](#deployment-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Vaje Cafe** is a Next.js-based cafe management system with:

- Admin dashboard for menu management
- Order management system
- Real-time statistics and analytics
- Email-based password recovery
- Session-based authentication

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with WAL mode
- **Email**: Nodemailer (Gmail, Outlook, Custom SMTP)
- **Authentication**: Session tokens + HTTP-only cookies
- **OTP**: 6-digit codes with expiration

---

## Authentication System

### Overview

The authentication system uses **session-based tokens** stored in HTTP-only cookies with sessionStorage fallback for client-side state management.

### Authentication Flow

```
1. LOGIN PAGE
   └─> User enters email & password
       └─> POST /api/auth/login
           ├─> Validate credentials
           ├─> Create session in DB
           ├─> Set auth_token cookie (5 hours)
           └─> Return user data

2. LOGIN RESPONSE
   └─> Set sessionStorage.vaje_auth = "true"
       └─> Redirect to /dashboard

3. ADMIN LAYOUT
   └─> MenuContext initializes
       ├─> Check sessionStorage.vaje_auth
       ├─> If not found → Call /api/auth/validate
       ├─> Verify cookie + restore sessionStorage
       ├─> Set authChecked = true
       └─> Guard route (redirect if not authenticated)

4. DASHBOARD
   └─> Render admin interface
       └─> User can logout (clears session + cookie)
```

### Session Check on Page Reload

**What Happens**:

1. Page reload → MenuContext mounts
2. MenuContext checks `sessionStorage.vaje_auth`
3. If not found → Calls `/api/auth/validate` endpoint
4. Endpoint verifies cookie validity
5. If valid → Sets sessionStorage + isAuthenticated = true
6. If invalid → Redirects to login

### Key Difference: Menu Context Auth vs useAuth Hook

| Feature                | MenuContext                      | useAuth Hook                         |
| ---------------------- | -------------------------------- | ------------------------------------ |
| **Used In**            | Admin dashboard, Menu management | Not currently used                   |
| **Storage**            | sessionStorage + cookie          | React state (volatile)               |
| **Persists on Reload** | ✅ Yes                           | ❌ No                                |
| **Status**             | ✅ Active                        | ⚠️ Legacy (available for future use) |

**Note**: The app uses `MenuContext` for authentication. The `useAuth` hook exists but is not used.

---

## Database Schema

### Tables

#### 1. `admin_users`

```sql
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### 2. `sessions`

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

#### 3. `password_reset_otp`

```sql
CREATE TABLE password_reset_otp (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  used BOOLEAN DEFAULT 0
);
```

#### 4. `menu` (Firebase/External)

```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  available: boolean,
  image: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 5. `orders` (Firebase/External)

```javascript
{
  id: string,
  items: OrderItem[],
  totalAmount: number,
  status: "pending" | "completed" | "cancelled",
  source: "website" | "manual",
  createdAt: timestamp,
  completedAt?: timestamp,
  customerNote?: string
}
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`

**Login user**

```
Request:
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}

Response (200):
{
  "success": true,
  "message": "ورود موفق",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name"
  },
  "expiresAt": 1735689600000
}

Response (401):
{
  "error": "ایمیل یا رمز عبور اشتباه است"
}
```

#### POST `/api/auth/logout`

**Logout user (clears session)**

```
Response (200):
{
  "success": true,
  "message": "خروج موفق"
}
```

#### GET `/api/auth/validate`

**Validate current session (used by MenuContext on reload)**

```
Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name"
  }
}

Response (401):
{
  "error": "شما وارد سیستم نشده‌اید"
}
```

#### POST `/api/auth/request-reset`

**Request password reset (sends OTP)**

```
Request:
{
  "email": "admin@example.com"
}

Response (200):
{
  "success": true,
  "message": "کد بازیابی به ایمیل ارسال شد"
}
```

#### POST `/api/auth/reset-password`

**Reset password with OTP**

```
Request:
{
  "email": "admin@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123"
}

Response (200):
{
  "success": true,
  "message": "رمز عبور با موفقیت تغییر کرد"
}
```

#### POST `/api/auth/change-password`

**Change password (authenticated users)**

```
Request:
{
  "currentPassword": "CurrentPassword123",
  "newPassword": "NewPassword123"
}

Response (200):
{
  "success": true,
  "message": "رمز عبور با موفقیت تغییر کرد"
}

Response (401):
{
  "error": "شما وارد سیستم نشده‌اید"
}
```

#### POST `/api/auth/admin/change-password`

**Admin change another user's password**

```
Request:
{
  "userId": "uuid",
  "newPassword": "NewPassword123"
}

Response (200):
{
  "success": true,
  "message": "رمز عبور کاربر با موفقیت تغییر کرد"
}
```

### Menu Endpoints

#### GET `/api/menu`

**Get all menu items**

```
Response (200):
[
  {
    "id": "uuid",
    "name": "قهوه اسپرسو",
    "description": "...",
    "price": 50000,
    "category": "coffee",
    "available": true,
    "image": "/uploads/image.webp"
  }
]
```

#### POST `/api/menu`

**Create menu item (requires auth)**

```
Request (FormData):
{
  "name": "قهوه جدید",
  "description": "توضیح",
  "price": 60000,
  "category": "coffee",
  "available": true,
  "image": <File>
}

Response (201):
{
  "success": true,
  "data": { ...menu item }
}
```

#### PUT `/api/menu/[id]`

**Update menu item**

```
Request (FormData):
{
  "name": "نام بروزرسانی شده",
  "description": "...",
  "price": 65000,
  "category": "coffee",
  "available": true,
  "image": <File> (optional)
}

Response (200):
{
  "success": true,
  "data": { ...updated menu item }
}
```

#### DELETE `/api/menu/[id]`

**Delete menu item**

```
Response (200):
{
  "success": true,
  "message": "آیتم حذف شد"
}
```

### Orders Endpoints

#### GET `/api/orders`

**Get all orders**

```
Response (200):
[
  {
    "id": "uuid",
    "items": [...],
    "totalAmount": 150000,
    "status": "pending",
    "source": "website",
    "createdAt": timestamp
  }
]
```

#### POST `/api/orders`

**Create order**

```
Request:
{
  "items": [
    { "itemId": "uuid", "quantity": 2, "price": 50000 }
  ],
  "customerNote": "بدون شکر"
}

Response (201):
{
  "success": true,
  "data": { ...order }
}
```

#### PATCH `/api/orders/[id]`

**Update order status**

```
Request:
{
  "status": "completed" | "pending" | "cancelled"
}

Response (200):
{
  "success": true,
  "data": { ...updated order }
}
```

### Statistics Endpoints

#### GET `/api/stats`

**Get dashboard statistics**

```
Query params:
- startDate (optional): timestamp
- endDate (optional): timestamp

Response (200):
{
  "visits": 1250,
  "menuViews": 3420,
  "totalSales": 5000000,
  "orders": 150,
  "dailyData": [
    { "date": "1403/09/18", "orders": 5, "sales": 250000 }
  ],
  "categoryBreakdown": [
    { "name": "coffee", "value": 50, "itemCount": 8 }
  ]
}
```

#### PATCH `/api/stats`

**Record statistics event**

```
Request:
{
  "action": "visit" | "menuView" | "order",
  "data": { ...event data }
}

Response (200):
{
  "success": true
}
```

---

## Frontend Implementation

### Components

#### Dashboard Page (`src/app/(admin)/dashboard/page.tsx`)

Main admin interface with three tabs:

- **Dashboard**: Statistics, charts, analytics
- **Menu**: Create, edit, delete menu items
- **Orders**: View and manage orders

Features:

- Real-time statistics (updates every 10 seconds)
- Dark/light theme toggle
- Pagination for orders
- Date range filtering
- Image upload with compression

#### Admin Layout (`src/app/(admin)/layout.tsx`)

Protection layer that:

1. Waits for `authChecked` flag from MenuContext
2. Checks `isAuthenticated` status
3. Redirects to login if not authenticated
4. Shows loading spinner while checking

#### Login Page (`src/app/(auth)/login/page.tsx`)

User login interface with:

- Email input validation
- Password input
- Error message display
- Link to password reset
- Sets sessionStorage on successful login

#### MenuContext (`src/context/MenuContext.tsx`)

Global state manager handling:

- Menu items (CRUD operations)
- Orders (creation, status updates)
- Authentication state (isAuthenticated, authChecked)
- QR code URL management

Authentication initialization:

```typescript
useEffect(() => {
  // 1. Check sessionStorage
  const auth = sessionStorage.getItem("vaje_auth");
  if (auth === "true") {
    setIsAuthenticated(true);
  } else {
    // 2. Verify via /api/auth/validate
    fetch("/api/auth/validate", { credentials: "include" }).then(res => {
      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem("vaje_auth", "true");
      }
    });
  }
  setAuthChecked(true);
}, []);
```

---

## Environment Setup

### 1. Email Configuration

Create `.env.local`:

```bash
# Gmail (Recommended)
SMTP_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_EMAIL=your-email@gmail.com

# Other providers (Outlook, Zoho, Custom)
# See detailed guide below
```

#### Gmail Setup (Step-by-Step)

1. Go to Google Account → Security
2. Enable "2-Step Verification"
3. Generate "App Password" for Gmail
4. Copy the 16-character password
5. Paste into `.env.local`

#### Outlook Setup

```bash
SMTP_SERVICE=outlook
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
SMTP_FROM_EMAIL=your-email@outlook.com
```

#### Custom SMTP

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@example.com
```

### 2. Database Configuration

Already configured at: `data/auth.db` (SQLite with WAL)

### 3. Server Port

Default: `3002`

Edit in `.env.local`:

```bash
PORT=3002
```

### 4. Create Admin User

```bash
node scripts/create_admin.js
```

---

## File Structure

```
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx         # Auth guard for admin routes
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Main admin dashboard
│   │   └── change-password/
│   │       └── page.tsx       # Change password page
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   ├── forgot-password/
│   │   │   └── page.tsx       # Password reset page
│   │   └── reset-password/
│   │       └── page.tsx       # OTP verification & reset
│   ├── (user)/
│   │   ├── layout.tsx         # User-facing layout
│   │   ├── page.tsx           # Home page
│   │   └── menu/
│   │       └── page.tsx       # Menu browsing page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── validate/      # NEW: Session validation
│   │   │   ├── change-password/
│   │   │   ├── request-reset/
│   │   │   ├── reset-password/
│   │   │   └── test-email/
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── stats/
│   │   └── assets/
│   ├── layout.tsx             # Root layout with providers
│   ├── providers.tsx          # MenuProvider + ThemeProvider
│   └── globals.css
├── components/
│   ├── AdminCharts.tsx        # Dashboard charts
│   ├── AuthComponents.tsx     # Auth UI components (legacy)
│   ├── ManualOrderForm.tsx    # Order form
│   ├── OrdersTable.tsx        # Orders display
│   ├── Navbar.tsx             # Navigation bar
│   ├── Footer.tsx             # Footer
│   ├── JalaliDatePicker.tsx   # Persian date picker
├── context/
│   └── MenuContext.tsx        # Global state + auth
├── hooks/
│   ├── useAuth.ts            # Auth hook (legacy - not used)
│   └── useVisit.ts           # Visit tracking
├── lib/
│   ├── authService.ts        # Core auth functions
│   ├── authMiddleware.ts     # Session validation
│   ├── authDb.ts             # Database initialization
│   ├── emailService.ts       # Email sending
│   ├── firebase.ts           # Firebase config
│   ├── database.ts           # Menu/order DB
│   ├── imageService.ts       # Image compression
│   └── auth.ts               # Misc auth utilities
├── services/
│   ├── dbService.ts          # Database operations
│   ├── storageService.ts     # Firebase storage
│   └── visitService.ts       # Visit tracking
├── types/
│   ├── jalaali-js.d.ts       # Jalaali types
│   └── index.ts              # Type definitions
├── utils/
│   ├── dateConverter.ts      # Date conversion
│   ├── dateFormatter.ts      # Date formatting
│   ├── format.ts             # Text formatting
│   ├── jalaliDateUtils.ts    # Jalali utilities
│   ├── pagination.ts         # Pagination logic
│   └── passwordValidation.ts # Password validation
├── constants.ts              # App constants
└── types.ts                  # Type definitions

middleware.ts                  # Next.js middleware (route protection)
```

---

## Security Features

### 1. Password Security

- **Hashing**: bcryptjs with 12 salt rounds
- **Validation**: Minimum 8 characters, complexity checks
- **Strength Scoring**: Feedback on password quality

### 2. Token Security

- **Generation**: Cryptographically secure 256-bit random tokens
- **Storage**: HTTP-only, Secure, SameSite cookies
- **Expiration**: 5 hours for sessions, 10 minutes for OTP
- **Validation**: Server-side verification on every request

### 3. Request Security

- **Input Validation**: Email format, OTP format, password length
- **SQL Injection**: Parameterized queries with prepared statements
- **CSRF**: SameSite cookie policy
- **Rate Limiting**: OTP attempt limiting (max 5 attempts)

### 4. Session Security

- **One-Time OTP**: Each code can only be used once
- **Token Uniqueness**: Every login generates new token
- **Automatic Expiration**: Old sessions auto-delete
- **Cookie Cleanup**: Logout clears both cookie and session

### 5. Best Practices Implemented

- ✅ HTTPS in production (enforced)
- ✅ HTTPOnly cookies (no JS access)
- ✅ Secure flag in production
- ✅ SameSite=Strict for CSRF protection
- ✅ Password reset via email (not SMS)
- ✅ No sensitive data in logs
- ✅ Error messages don't leak user info

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update `.env.local` with production values
- [ ] Set `NODE_ENV=production`
- [ ] Configure email service (Gmail/Outlook/Custom)
- [ ] Create admin user: `node scripts/create_admin.js`
- [ ] Test all auth flows in staging
- [ ] Verify HTTPS certificate

### Production Configuration

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Email
SMTP_SERVICE=gmail
SMTP_USER=production-email@example.com
SMTP_PASSWORD=xxxxx
SMTP_FROM_EMAIL=production-email@example.com

# Database
DATABASE_PATH=/path/to/secure/data/auth.db
```

### Monitoring

- Monitor login failures (potential attacks)
- Check OTP attempt rates
- Review session expiration logs
- Monitor email delivery failures

### After Deployment

- [ ] Test login with real email
- [ ] Verify password reset sends email
- [ ] Confirm secure cookie attributes
- [ ] Monitor error logs for issues
- [ ] Test session persistence across reloads

---

## Troubleshooting

### Login Issues

#### "ایمیل یا رمز عبور اشتباه است" (Wrong email/password)

**Solution**:

- Verify credentials in database
- Check email format
- Ensure user exists: `SELECT * FROM admin_users;`

#### Session lost on reload

**Solution**:

- Check browser allows sessionStorage
- Verify `/api/auth/validate` returns 200
- Check cookie attributes in DevTools

#### Redirect to login on page reload

**Solution**:

- Ensure MenuContext's `authChecked` flag is set
- Check `/api/auth/validate` endpoint
- Verify sessionStorage isn't cleared

### Email Issues

#### OTP not arriving

**Solution**:

- Check spam/promotions folder
- Verify SMTP credentials in `.env.local`
- Check Gmail "App passwords" is enabled
- Test with: `curl http://localhost:3002/api/auth/test-email`

#### "Gmail SMTP error" or "535 error"

**Solution**:

- Generate new App Password
- Remove spaces from password when copying
- Enable 2-Step Verification on Gmail

#### "Failed to send email"

**Solution**:

- Verify `SMTP_USER` matches actual Gmail
- Check `SMTP_FROM_EMAIL` is valid
- Test connection: `node scripts/test-email.js`

### Database Issues

#### SQLite locked error

**Solution**:

- Close all DB connections
- Remove `data/auth.db-wal` and `data/auth.db-shm`
- Restart server

#### "table admin_users does not exist"

**Solution**:

- Delete `data/auth.db`
- Restart server (recreates DB)
- Run: `node scripts/create_admin.js`

### Authentication Debugging

#### Enable debug logging

```bash
DEBUG=vaje-cafe:* npm run dev
```

#### Check browser DevTools

1. Open DevTools → Storage → Cookies
2. Verify `auth_token` cookie exists
3. Check `sessionStorage` has `vaje_auth=true`
4. Check Network tab for 401 responses

#### Test API directly

```bash
# Test login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test validation
curl http://localhost:3002/api/auth/validate \
  -b "auth_token=YOUR_TOKEN"
```

---

## Additional Resources

### Related Files

- Authentication implementation: `src/lib/authService.ts`
- Database schema: `src/lib/authDb.ts`
- Email configuration: `src/lib/emailService.ts`
- API routes: `src/app/api/auth/*/`
- Components: `src/components/`

### Scripts

- Create admin: `node scripts/create_admin.js`
- Generate token: `node scripts/generate_token.js`
- Test email: `curl http://localhost:3002/api/auth/test-email`

### Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm test           # Run tests
```

---

**Support**: For issues or questions, review the relevant section above or check source code comments.
