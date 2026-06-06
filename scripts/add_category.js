#!/usr/bin/env node
// scripts/add_category.js
// Usage: node scripts/add_category.js "Category Name" "Description" "#color"

const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// By default the auth DB is in ../vaje-cafe-data/vaje-cafe.db (same as authDb.ts)
const dbPath = path.join(process.cwd(), '..', 'vaje-cafe-data', 'vaje-cafe.db');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/add_category.js "Category Name" "Description" "#color"');
    process.exit(1);
  }

  const name = args[0];
  const description = args[1] || null;
  const color = args[2] || '#888888';

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Ensure table exists (same schema as authDb.ts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_material_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#888888',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Check if category exists by name
  const existing = db.prepare('SELECT id FROM raw_material_categories WHERE name = ?').get(name);
  if (existing) {
    console.log(`Category already exists with id=${existing.id}`);
    db.close();
    process.exit(0);
  }

  const id = uuidv4();
  const now = Date.now();

  const insert = db.prepare('INSERT INTO raw_material_categories (id, name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  insert.run(id, name, description, color, now, now);

  console.log(`Inserted category '${name}' with id=${id}`);
  db.close();
}

main();
