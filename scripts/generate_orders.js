/**
 * Generate 100 random orders for current month
 * Saves directly to SQLite database via API
 * Usage: node scripts/generate_orders.js
 */

const fs = require("fs");
const path = require("path");

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");

  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=");

    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

loadEnv();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

// Sample menu items
const MENU_ITEMS = [
  { name: "قهوه اسپرسو", price: 45000, category: "coffee" },
  { name: "قهوه آمریکانو", price: 50000, category: "coffee" },
  { name: "کاپوچینو", price: 65000, category: "coffee" },
  { name: "لاته", price: 65000, category: "coffee" },
  { name: "ماکیاتو", price: 60000, category: "coffee" },
  { name: "موکا", price: 70000, category: "coffee" },
  { name: "فلت وایت", price: 65000, category: "coffee" },
  { name: "کولد برو", price: 55000, category: "coffee" },
  { name: "قهوه یخ", price: 50000, category: "coffee" },
  { name: "لاته سرد", price: 60000, category: "coffee" },
  { name: "کروسان", price: 35000, category: "pastry" },
  { name: "دونات", price: 30000, category: "pastry" },
  { name: "کیک شکلاتی", price: 50000, category: "cake" },
  { name: "ساندویچ", price: 80000, category: "sandwich" },
  { name: "سالاد", price: 60000, category: "salad" }
];

/**
 * Get random item from array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random number between min and max
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random order
 */
function generateRandomOrder() {
  const itemCount = getRandomNumber(1, 5);
  const items = [];
  let totalPrice = 0;

  // Generate 1-5 random items
  for (let i = 0; i < itemCount; i++) {
    const menuItem = getRandomItem(MENU_ITEMS);
    const quantity = getRandomNumber(1, 3);
    const itemTotal = menuItem.price * quantity;

    items.push({
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantity,
      category: menuItem.category
    });

    totalPrice += itemTotal;
  }

  return {
    items,
    total: totalPrice,
    source: "manual",
    note: getRandomNumber(1, 10) > 8 ? "بدون شکر" : undefined
  };
}

/**
 * Main function
 */
async function generateOrders() {
  try {
    console.log("🚀 Starting order generation...");
    console.log(`📅 Current month: ${new Date().toLocaleDateString("fa-IR")}`);
    console.log(`🔗 API URL: ${APP_URL}\n`);

    if (!ADMIN_TOKEN) {
      console.warn("⚠️  NEXT_PUBLIC_ADMIN_TOKEN not set in .env.local");
      console.warn("⚠️  Manual orders require admin authentication\n");
    }

    const stats = {
      total: 100,
      successful: 0,
      failed: 0,
      byCategory: {},
      totalSales: 0,
      errors: []
    };

    // Generate and send 100 orders
    console.log("💾 Saving orders...");

    for (let i = 0; i < 100; i++) {
      const order = generateRandomOrder();

      try {
        const response = await fetch(`${APP_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": ADMIN_TOKEN
          },
          body: JSON.stringify({
            items: order.items,
            total: order.total,
            note: order.note,
            source: order.source
          })
        });

        if (response.ok) {
          stats.successful++;
          stats.totalSales += order.total;

          order.items.forEach(item => {
            stats.byCategory[item.category] =
              (stats.byCategory[item.category] || 0) + item.quantity;
          });

          if ((i + 1) % 10 === 0) {
            process.stdout.write(`\r  ${i + 1}/100 orders saved...`);
          }
        } else {
          const errorText = await response.text().catch(() => "Unknown error");
          stats.failed++;
          if (i === 0) {
            // Show first error in detail
            console.log(`\n❌ API Error: ${response.status}`);
            console.log(`Response: ${errorText.substring(0, 100)}`);
          }
          stats.errors.push(`Order ${i + 1}: ${response.status}`);
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Order ${i + 1}: ${error.message}`);
      }
    }

    console.log(`\r✅ Successfully saved ${stats.successful} orders\n`);

    if (stats.failed > 0) {
      console.warn(`⚠️  Failed to save ${stats.failed} orders\n`);
    }

    // Display statistics
    console.log("📊 STATISTICS");
    console.log("═".repeat(50));
    console.log(`Total Orders Generated: ${stats.total}`);
    console.log(`Successfully Saved: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log("");

    if (Object.keys(stats.byCategory).length > 0) {
      console.log("By Category:");
      Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} items`);
      });
      console.log("");
    }

    if (stats.totalSales > 0) {
      console.log(`Total Sales: ₹ ${stats.totalSales.toLocaleString("fa-IR")}`);
      console.log(
        `Average Order: ₹ ${Math.round(
          stats.totalSales / stats.successful
        ).toLocaleString("fa-IR")}`
      );
    }

    console.log("═".repeat(50));

    console.log("\n✨ Order generation complete!");
    console.log("📈 Your dashboard should now show activity.");
    console.log("🔄 Refresh your browser to see the new data.");

    process.exit(stats.successful > 0 ? 0 : 1);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run
generateOrders();
