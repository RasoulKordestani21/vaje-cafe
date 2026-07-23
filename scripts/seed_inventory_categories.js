#!/usr/bin/env node

/**

 * Seed inventory categories from src/constants/inventoryCategoryTree.json.

 * Usage: node scripts/seed_inventory_categories.js

 */



const Database = require("better-sqlite3");

const path = require("path");

const { v4: uuidv4 } = require("uuid");



const INVENTORY_CATEGORY_TREE = require("../src/constants/inventoryCategoryTree.json");



const dbPath = path.join(process.cwd(), "..", "vaje-cafe-data", "vaje-cafe.db");



function main() {

  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");



  db.exec(`

    CREATE TABLE IF NOT EXISTS raw_material_categories (

      id TEXT PRIMARY KEY,

      name TEXT UNIQUE NOT NULL,

      description TEXT,

      color TEXT DEFAULT '#888888',

      parent_name TEXT,

      created_at INTEGER NOT NULL,

      updated_at INTEGER NOT NULL

    );

  `);



  try {

    db.exec(`ALTER TABLE raw_material_categories ADD COLUMN parent_name TEXT`);

  } catch (_) {

    // column may already exist

  }



  db.exec(`DELETE FROM raw_material_categories`);



  const insert = db.prepare(`

    INSERT INTO raw_material_categories (id, name, description, parent_name, created_at, updated_at)

    VALUES (?, ?, ?, ?, ?, ?)

  `);



  const now = Date.now();

  let count = 0;



  for (const { group, subcategories } of INVENTORY_CATEGORY_TREE) {

    for (const sub of subcategories) {

      insert.run(uuidv4(), sub, group, group, now, now);

      count++;

    }

  }



  console.log(`Seeded ${count} inventory subcategories across ${INVENTORY_CATEGORY_TREE.length} groups.`);

  db.close();

}



main();

