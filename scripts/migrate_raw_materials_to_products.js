#!/usr/bin/env node
/**
 * Migration script: Migrate raw_materials from authDb to products table in main database
 * 
 * This script:
 * 1. Reads all raw_materials from authDb (../vaje-cafe-data/vaje-cafe.db)
 * 2. Inserts them into products table in main database (data/vaje-cafe.db)
 * 3. Migrates menu_ingredients from authDb to main database
 * 
 * Usage: node scripts/migrate_raw_materials_to_products.js [--dry-run]
 */

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Database paths
const authDbPath = path.join(process.cwd(), '..', 'vaje-cafe-data', 'vaje-cafe.db');
const mainDbPath = path.join(process.cwd(), 'data', 'vaje-cafe.db');

const isDryRun = process.argv.includes('--dry-run');

function main() {
  console.log('🔄 Starting migration: raw_materials → products\n');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Open databases
  let authDb, mainDb;
  try {
    authDb = new Database(authDbPath);
    authDb.pragma('journal_mode = WAL');
    console.log(`✅ Opened auth database: ${authDbPath}`);
  } catch (error) {
    console.error(`❌ Failed to open auth database: ${error.message}`);
    process.exit(1);
  }

  try {
    mainDb = new Database(mainDbPath);
    mainDb.pragma('journal_mode = WAL');
    mainDb.pragma('foreign_keys = ON');
    console.log(`✅ Opened main database: ${mainDbPath}\n`);
  } catch (error) {
    console.error(`❌ Failed to open main database: ${error.message}`);
    authDb.close();
    process.exit(1);
  }

  // Ensure products table exists
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('raw_material', 'packed_product')),
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      currentStock REAL DEFAULT 0,
      minStock REAL DEFAULT 0,
      price REAL DEFAULT 0,
      supplier TEXT,
      lastRestocked INTEGER,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS menu_ingredients (
      id TEXT PRIMARY KEY,
      menuItemId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(menuItemId, productId)
    )
  `);

  // Step 1: Migrate raw_materials to products
  console.log('📦 Step 1: Migrating raw_materials to products...');
  const rawMaterials = authDb.prepare('SELECT * FROM raw_materials').all();
  console.log(`   Found ${rawMaterials.length} raw materials`);

  const productIdMap = new Map(); // Maps old raw_material.id to new product.id

  for (const rm of rawMaterials) {
    // Check if product already exists (by name and type)
    const existing = mainDb.prepare(`
      SELECT id FROM products 
      WHERE name = ? AND type = 'raw_material'
    `).get(rm.name);

    if (existing) {
      console.log(`   ⚠️  Product "${rm.name}" already exists, skipping...`);
      productIdMap.set(rm.id, existing.id);
      continue;
    }

    const newProductId = uuidv4();
    productIdMap.set(rm.id, newProductId);

    if (!isDryRun) {
      const now = Math.floor(Date.now() / 1000);
      mainDb.prepare(`
        INSERT INTO products (
          id, name, type, category, unit, currentStock, minStock, 
          price, supplier, lastRestocked, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newProductId,
        rm.name,
        'raw_material',
        rm.category,
        rm.unit,
        rm.current_stock || 0,
        rm.min_stock || 0,
        rm.price || 0,
        rm.supplier || null,
        rm.last_restocked || null,
        Math.floor((rm.created_at || Date.now()) / 1000),
        Math.floor((rm.updated_at || Date.now()) / 1000)
      );
    }

    console.log(`   ✅ Migrated: ${rm.name} (${rm.id} → ${newProductId})`);
  }

  console.log(`\n✅ Step 1 complete: ${rawMaterials.length} raw materials processed\n`);

  // Step 2: Migrate menu_ingredients
  console.log('🔗 Step 2: Migrating menu_ingredients...');
  const menuIngredients = authDb.prepare(`
    SELECT * FROM menu_ingredients
  `).all();
  console.log(`   Found ${menuIngredients.length} menu ingredients`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const mi of menuIngredients) {
    const newProductId = productIdMap.get(mi.raw_material_id);
    
    if (!newProductId) {
      console.log(`   ⚠️  Skipping ingredient: raw_material_id ${mi.raw_material_id} not found in migrated products`);
      skippedCount++;
      continue;
    }

    // Check if ingredient already exists
    const existing = mainDb.prepare(`
      SELECT id FROM menu_ingredients 
      WHERE menuItemId = ? AND productId = ?
    `).get(mi.menu_item_id, newProductId);

    if (existing) {
      console.log(`   ⚠️  Ingredient already exists for menu_item ${mi.menu_item_id}, skipping...`);
      skippedCount++;
      continue;
    }

    if (!isDryRun) {
      const newIngredientId = uuidv4();
      const createdAt = Math.floor((mi.created_at || Date.now()) / 1000);
      
      mainDb.prepare(`
        INSERT INTO menu_ingredients (
          id, menuItemId, productId, quantity, unit, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        newIngredientId,
        mi.menu_item_id,
        newProductId,
        mi.quantity,
        mi.unit,
        createdAt
      );
    }

    migratedCount++;
  }

  console.log(`\n✅ Step 2 complete: ${migratedCount} ingredients migrated, ${skippedCount} skipped\n`);

  // Summary
  console.log('📊 Migration Summary:');
  console.log(`   Raw materials: ${rawMaterials.length} processed`);
  console.log(`   Menu ingredients: ${migratedCount} migrated, ${skippedCount} skipped`);
  
  if (isDryRun) {
    console.log('\n⚠️  This was a DRY RUN. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }

  // Close databases
  authDb.close();
  mainDb.close();
}

main();




