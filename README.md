# Vaje Cafe - Admin Dashboard & Menu Management System

A modern Next.js-based café management system with admin dashboard, order management, and real-time analytics.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Configure environment**:

```bash
cp .env.local.example .env.local
# Edit .env.local with your Gmail credentials
```

3. **Create admin user**:

```bash
node scripts/create_admin.js
```

4. **Start development server**:

```bash
npm run dev
# Open http://localhost:3002
```

## 📚 Documentation

For complete documentation including:

- Authentication system
- API endpoints
- Database schema
- Environment setup
- Deployment checklist
- Troubleshooting

See: **[DOCUMENTATION.md](./DOCUMENTATION.md)**

## 🎯 Features

✅ **Admin Dashboard**

- Real-time statistics and analytics
- Dark/light theme support
- Responsive design

✅ **Menu Management**

- Create, edit, delete menu items
- Image upload with automatic compression
- Category management
- Availability control

✅ **Order Management**

- Real-time order tracking
- Status management (pending, completed, cancelled)
- Order filtering and pagination
- Manual order creation

✅ **Authentication**

- Session-based login
- Password reset via email OTP
- Admin password management
- Secure token storage

✅ **Security**

- bcryptjs password hashing
- Cryptographically secure tokens
- HTTP-only cookies
- CSRF protection
- Input validation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite (authentication), Firebase (menu/orders)
- **Email**: Nodemailer (Gmail, Outlook, Custom SMTP)
- **Authentication**: Session tokens + HTTP-only cookies

## 📁 Project Structure

```
src/
├── app/                    # Next.js pages & layouts
│   ├── (admin)/           # Protected admin routes
│   ├── (auth)/            # Login & password recovery
│   └── (user)/            # Public user pages
├── components/            # Reusable React components
├── context/               # Global state (MenuContext)
├── lib/                   # Core business logic
├── services/              # Database & external services
└── utils/                 # Utility functions
```

## 🔑 Key Files

| File                                 | Purpose                       |
| ------------------------------------ | ----------------------------- |
| `src/lib/authService.ts`             | Core authentication logic     |
| `src/lib/authMiddleware.ts`          | Session validation            |
| `src/context/MenuContext.tsx`        | Global state management       |
| `src/app/(admin)/dashboard/page.tsx` | Admin dashboard               |
| `src/app/api/auth/*/`                | Authentication endpoints      |
| `DOCUMENTATION.md`                   | Complete system documentation |

## 📖 Common Tasks

### Create Menu Item

```typescript
const { addItem } = useMenu();
await addItem(
  {
    name: "Coffee",
    description: "Espresso",
    price: 50000,
    category: "coffee",
    available: true
  },
  imageFile
);
```

### Update Order Status

```typescript
const { updateOrderStatus } = useMenu();
await updateOrderStatus(orderId, "completed");
```

### Logout

```typescript
const { logout } = useMenu();
logout(); // Clears session + redirects to login
```

## 🔒 Security Notes

- Passwords are hashed with bcryptjs (12 salt rounds)
- Sessions expire after 5 hours
- OTP codes are single-use and expire in 10 minutes
- All cookies are HTTP-only and secure
- Input validation on all API endpoints

## 🐛 Troubleshooting

**Session lost on page reload**

- Check `/api/auth/validate` endpoint
- Verify sessionStorage isn't blocked by browser

**OTP not arriving**

- Ensure Gmail is configured correctly
- Check spam folder
- Run: `curl http://localhost:3002/api/auth/test-email`

**Can't login**

- Verify user exists in database
- Check email format
- Create new admin: `node scripts/create_admin.js`

See [DOCUMENTATION.md](./DOCUMENTATION.md#troubleshooting) for more help.

## 📞 Support

For detailed information:

1. Read [DOCUMENTATION.md](./DOCUMENTATION.md)
2. Check API endpoint specifications
3. Review source code comments
4. Check browser console for errors

## 📝 Database

**SQLite Database**: `data/auth.db`

Tables:

- `admin_users` - User accounts
- `sessions` - Active sessions
- `password_reset_otp` - OTP codes

**Firebase**: Menu items and orders (configured in `.env.local`)

## 🚢 Deployment

1. Update `.env.local` with production values
2. Run: `npm run build`
3. Run: `npm run start`

See [DOCUMENTATION.md](./DOCUMENTATION.md#deployment-checklist) for complete checklist.

---

**Last Updated**: December 9, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
