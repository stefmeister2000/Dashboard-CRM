import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Custom dbRun that returns the result with lastID
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

// Initialize database schema
export async function initDatabase() {
  // Enable foreign keys
  await dbRun('PRAGMA foreign_keys = ON');

  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'new',
      source TEXT DEFAULT 'website',
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notes table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      note_text TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Events table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Businesses table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      country TEXT,
      tax_id TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add business_id to clients table if it doesn't exist
  try {
    // Check if column exists first
    const tableInfo = await dbAll("PRAGMA table_info(clients)");
    const hasBusinessId = tableInfo.some(col => col.name === 'business_id');
    if (!hasBusinessId) {
      await dbRun('ALTER TABLE clients ADD COLUMN business_id INTEGER');
    }
  } catch (error) {
    // Column might already exist, ignore error
    console.log('Note: business_id column may already exist');
  }

  // Create indexes
  await dbRun('CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id)');
  await dbRun('CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id)');

  // Create default admin user if no users exist
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await dbRun(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      ['admin@example.com', hashedPassword, 'admin']
    );
    console.log('Default admin user created: admin@example.com / admin123');
  }

  console.log('Database initialized successfully');
}

export { db, dbRun, dbGet, dbAll };

