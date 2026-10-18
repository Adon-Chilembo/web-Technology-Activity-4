require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, process.env.DB_PATH || './data/products.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create the table, then seed it only when empty (safe on every restart / redeploy)
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
if (n === 0) {
  db.exec(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
  console.log('Seeded sample products');
}

module.exports = db;
