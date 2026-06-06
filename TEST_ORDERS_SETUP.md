# Test Order Generation - Setup Complete

## 📋 Summary

✅ Created `scripts/generate_orders.js` - A script to generate 100 random test orders for your dashboard

### Key Changes:

1. **No Firebase Dependency** - Script uses your existing API routes (SQLite database)
2. **Direct API Integration** - Sends orders via POST `/api/orders`
3. **Automatic Statistics** - Shows sales breakdown by category

---

## 🚀 Quick Start

### Step 1: Start Your Dev Server

```bash
cd d:/projects/vaje-project/vaje-cafe
npm run dev
```

Wait for message: `ready - started server on 0.0.0.0:3002`

### Step 2: Generate Orders (in another terminal)

```bash
cd d:/projects/vaje-project/vaje-cafe
node scripts/generate_orders.js
```

### Step 3: View in Dashboard

- Open: `http://localhost:3002/dashboard`
- Login with your admin credentials
- Go to **Dashboard** tab → See charts with data
- Go to **Orders** tab → See all 100 orders

---

## 📊 What Gets Generated

**100 Random Orders** with:

- Random menu items (coffee, pastry, cake, sandwich, salad)
- Random quantities (1-3 of each item)
- Automatic price calculation
- Manual source (generated via script)
- Optional customer notes

**Example Statistics**:

```
Total Orders: 100
Total Sales: ₹ 4,250,000
Average Order: ₹ 42,500

By Category:
  coffee: 120 items
  pastry: 24 items
  cake: 15 items
  sandwich: 18 items
  salad: 12 items
```

---

## 💾 Database

Orders are saved to: **`data/database.db`** (SQLite)

**Tables Used**:

- `orders` - Main order records
- `order_items` - Items within each order

---

## 🔧 How It Works

1. **Reads environment** from `.env.local`
2. **Generates orders** with random data
3. **Sends via API** to `POST /api/orders`
4. **Server validates** and saves to SQLite
5. **Shows statistics** of what was saved

---

## ⚠️ Common Issues

### ❌ Connection Refused

```
Order 1: ECONNREFUSED
```

**Fix**: Start dev server first with `npm run dev`

### ❌ All Orders Failed

```
Failed to save 100 orders
```

**Fix**:

- Check if server is running at `http://localhost:3002`
- Check `NEXT_PUBLIC_ADMIN_TOKEN` in `.env.local`
- Check browser console and server logs

### ❌ Orders Don't Appear in Dashboard

**Fix**: Refresh your browser page

---

## 📁 Files Modified/Created

```
scripts/
├── generate_orders.js  ✅ NEW - Order generation script
├── README.md          ✅ UPDATED - Script documentation
├── create_admin.js    (existing)
└── generate_token.js  (existing)
```

---

## 📚 Documentation

Complete information in:

- **`scripts/README.md`** - Detailed script documentation
- **`DOCUMENTATION.md`** - Full system documentation

---

## ✅ Ready to Test

Your script is now ready to generate test data!

**Next Steps**:

1. Start dev server: `npm run dev`
2. Generate orders: `node scripts/generate_orders.js`
3. View dashboard: `http://localhost:3002/dashboard`
4. Test your charts and statistics features

---

**Last Updated**: December 9, 2025
