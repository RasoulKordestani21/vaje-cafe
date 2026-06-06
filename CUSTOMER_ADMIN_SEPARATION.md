# Customer and Admin Authentication Separation

## Overview

The application now has **separate authentication systems** for customers and admins:

- **Admin Authentication**: Email/password login → `/login` → Dashboard access
- **Customer Authentication**: OTP via SMS → `/customer/login` → Menu/Order access

## Authentication Systems

### Admin Authentication

**Route**: `/login`  
**Cookie**: `auth_token`  
**Context**: `MenuContext` (via `useMenu()` hook)  
**Session Storage**: `vaje_auth`, `vaje_role`  
**Protected Routes**: `/dashboard`, `/(admin)/*`

**Flow**:
1. Admin enters email/password at `/login`
2. Server validates credentials
3. Creates admin session → sets `auth_token` cookie
4. `MenuContext` checks session on mount
5. Redirects to `/dashboard` if authenticated

**API Endpoints**:
- `POST /api/auth/login` - Admin login
- `GET /api/auth/validate` - Validate admin session
- `POST /api/auth/logout` - Admin logout

### Customer Authentication

**Route**: `/customer/login`  
**Cookie**: `customer_auth_token`  
**Context**: `CustomerContext` (via `useCustomer()` hook)  
**Session Storage**: `vaje_customer_auth`, `vaje_customer_data`  
**Protected Routes**: None (menu is public, but customer context tracks logged-in customers)

**Flow**:
1. Customer enters phone number at `/customer/login`
2. Server generates OTP (currently hardcoded `1234` for testing)
3. Customer enters OTP
4. Server validates OTP → creates customer session → sets `customer_auth_token` cookie
5. `CustomerContext` checks session on mount
6. Redirects to `/menu` if authenticated

**API Endpoints**:
- `POST /api/customer/auth/request-otp` - Request OTP
- `POST /api/customer/auth/verify-otp` - Verify OTP and login
- `GET /api/customer/auth/validate` - Validate customer session
- `POST /api/customer/auth/logout` - Customer logout

## Key Differences

| Feature | Admin | Customer |
|---------|-------|----------|
| **Login Method** | Email/Password | Phone/OTP |
| **Cookie Name** | `auth_token` | `customer_auth_token` |
| **Session Duration** | 5 hours | 30 days |
| **Context Hook** | `useMenu()` | `useCustomer()` |
| **Session Storage** | `vaje_auth` | `vaje_customer_auth` |
| **Database Table** | `sessions` | `customer_sessions` |
| **Protected Routes** | `/dashboard`, `/(admin)/*` | None (menu is public) |

## Database Tables

### Admin Sessions
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

### Customer Sessions
```sql
CREATE TABLE customer_sessions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

## Middleware Protection

The `middleware.ts` file only protects **admin routes**:
- `/dashboard/*`
- `/(admin)/*`

Customer routes (`/customer/*`, `/menu`) are **not protected by middleware**. They use client-side authentication checks via `CustomerContext`.

## Usage Examples

### Admin Login Check
```tsx
import { useMenu } from "@/context/MenuContext";

function AdminComponent() {
  const { isAuthenticated, userRole } = useMenu();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return <div>Welcome, {userRole}</div>;
}
```

### Customer Login Check
```tsx
import { useCustomer } from "@/context/CustomerContext";

function CustomerComponent() {
  const { customer, isAuthenticated, logout } = useCustomer();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      Welcome, {customer?.name || customer?.phoneNumber}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Testing

### Admin Login
1. Go to `/login`
2. Enter admin email/password
3. Should redirect to `/dashboard`

### Customer Login
1. Go to `/customer/login`
2. Enter phone number (e.g., `09123456789`)
3. Enter OTP: `1234` (test code)
4. Should redirect to `/menu`

## Notes

- **No Conflict**: Admin and customer sessions are completely separate
- **Different Cookies**: `auth_token` vs `customer_auth_token`
- **Different Contexts**: `MenuContext` vs `CustomerContext`
- **Different Storage**: Different sessionStorage keys
- **Different Tables**: `sessions` vs `customer_sessions`

This ensures that:
- Admins can't accidentally access customer sessions
- Customers can't access admin routes
- Both can be logged in simultaneously (different browsers/tabs)




