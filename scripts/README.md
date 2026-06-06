# Scripts Directory

Utility scripts for managing and testing the Vaje Cafe system.

## Available Scripts

### 1. `create_admin.js` - Create Admin User

**Purpose**: Create a new admin user for the authentication system.

**Usage**:

```bash
node scripts/create_admin.js
```

**Interactive Prompts**:

- Email address
- Password (with validation)
- Full name

**Output**:

```
✅ Admin user created successfully
📧 Email: admin@example.com
👤 Name: Admin Name
🔐 Password: [secured]
```

**Database**: Saves to `data/auth.db` in `admin_users` table

---

### 2. `generate_token.js` - Generate Server Token

**Purpose**: Generate a server token for admin API endpoints (optional, for advanced security).

**Usage**:

```bash
node scripts/generate_token.js
```

**Output**:

```
🔐 Generated Server Token
TOKEN: abc123def456...
HASH: xyz789uvw456...

Add to .env.local:
SERVER_TOKEN_SECRET=...
SERVER_TOKEN_HASH=...
```

**Use Case**: If you want to protect certain endpoints with an additional server token.

---

### 3. `generate_orders.js` - Generate Test Orders (NEW)

**Purpose**: Generate 100 random orders for the current month to test dashboard charts and statistics.

**Prerequisites**:

- Next.js development server must be running: `npm run dev`
- Server running at `http://localhost:3002` (or set `NEXT_PUBLIC_APP_URL` in `.env.local`)

**Usage**:

```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Run the order generation script
node scripts/generate_orders.js
```

**What It Does**:

- ✅ Generates 100 random orders via API
- ✅ Each order has 1-5 random menu items
- ✅ Random quantities (1-3 of each item)
- ✅ Calculates total price automatically
- ✅ Saves directly to SQLite database via `/api/orders`
- ✅ No Firebase dependency

**Sample Output**:

```
🚀 Starting order generation...
📅 Current month: ۱۴۰۴/۹/۱۸
🔗 API URL: http://localhost:3002

💾 Saving orders...
✅ Successfully saved 100 orders

📊 STATISTICS
==================================================
Total Orders Generated: 100
Successfully Saved: 100
Failed: 0

By Category:
  coffee: 120 items
  pastry: 24 items
  cake: 15 items
  sandwich: 18 items
  salad: 12 items

Total Sales: ₹ 4,250,000
Average Order: ₹ 42,500
==================================================

✨ Order generation complete!
📈 Your dashboard should now show activity.
🔄 Refresh your browser to see the new data.
```

**Database**: Orders saved to SQLite (`data/database.db`) via API

**How It Works**:

1. Reads `.env.local` for API URL and admin token
2. Generates 100 random orders with menu items
3. Sends each order via POST `/api/orders`
4. Server validates and saves to SQLite database
5. Displays statistics of generated orders

**If Orders Fail to Save**:

❌ **Connection refused error**:

```
Order 1: ECONNREFUSED
```

**Solution**: Start the development server first: `npm run dev`

❌ **401 Unauthorized error**:

```
Order 1: 401
```

**Solution**: Ensure `NEXT_PUBLIC_ADMIN_TOKEN` is set in `.env.local`

❌ **500 Server error**:

```
Order 1: 500
```

**Solution**: Check server logs for database errors

**Testing Dashboard**:
After running the script:

1. Open admin dashboard: `http://localhost:3002/dashboard`
2. Go to **Dashboard** tab
3. You should see:
   - 📊 Order statistics updated
   - 📈 Charts with data
   - 💰 Total sales calculated
4. Go to **Orders** tab
5. See all generated orders with pagination and filtering

**Troubleshooting**:

| Error                            | Solution                                                 |
| -------------------------------- | -------------------------------------------------------- |
| `.env.local not found`           | Run from project root: `cd vaje-cafe`                    |
| `Connection refused`             | Start dev server: `npm run dev`                          |
| `Failed to save 100 orders`      | Check if API is responding at `http://localhost:3002`    |
| Orders don't appear in dashboard | Refresh browser page                                     |
| Only some orders saved           | Check `.env.local` for correct `NEXT_PUBLIC_ADMIN_TOKEN` |

---

## Quick Start Example

### Test the Entire System

```bash
# 1. Create admin user
node scripts/create_admin.js
# Follow prompts, use: admin@test.com / TestPass123!

# 2. Start development server
npm run dev
# Visit http://localhost:3002

# 3. Login with credentials created above

# 4. Generate test orders
node scripts/generate_orders.js

# 5. Refresh dashboard to see new data
```

---

## Environment Setup

Make sure `.env.local` is configured:

```bash
# For generate_orders.js to work, you need Firebase:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

Or use Firebase key file: `firebase-key.json`

---

## Troubleshooting

### "Firebase not initialized"

**Solution**:

- Ensure Firebase credentials are in `.env.local`
- Or place `firebase-key.json` in project root

### "Permission denied" when generating orders

**Solution**:

- Check Firebase Firestore rules allow writes to `orders` collection
- Verify Firebase credentials have write permissions

### No data appears in dashboard after generating

**Solution**:

- Refresh browser page
- Check browser console for errors
- Verify orders are in Firestore: Firebase Console → Firestore → orders collection

### Database locked error

**Solution**:

- Close all connections to `data/auth.db`
- Delete `data/auth.db-wal` and `data/auth.db-shm` files
- Restart the server

---

## Notes

- ✅ All scripts are idempotent (safe to run multiple times)
- ✅ Orders are generated with realistic data
- ✅ Dates are spread across current month for better statistics
- ✅ Order amounts vary (₹30,000 - ₹200,000+)
- ✅ Mix of completed, pending, and cancelled orders

---

**Last Updated**: December 9, 2025
