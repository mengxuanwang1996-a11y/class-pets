import pg from 'pg';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'data.db');
const DATABASE_URL = process.env.DATABASE_URL;

let db = null;
let sqlDb = null;

// PostgreSQL Client
class PostgresClient {
  constructor(pool) {
    this.pool = pool;
  }

  query(sql, params = []) {
    return this.pool.query(sql, params);
  }

  prepare(sql) {
    return {
      bind: (params) => {
        this.pendingSql = sql;
        this.pendingParams = params;
        return this;
      },
      step: () => {
        this.pendingResult = this.pendingSql.includes('RETURNING')
          ? null
          : this.pool.query(this.pendingSql, this.pendingParams);
        return this.pendingResult && this.pendingResult.rows.length > 0;
      },
      getAsObject: () => {
        if (this.pendingResult && this.pendingResult.rows.length > 0) {
          return this.pendingResult.rows[0];
        }
        return null;
      },
      free: () => {}
    };
  }

  run(sql, params = []) {
    return this.pool.query(sql, params);
  }
}

// SQL.js Client (fallback)
class SqlJsClient {
  constructor(db) {
    this.db = db;
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      bind: (params) => {
        stmt.bind(params);
        return stmt;
      },
      step: () => stmt.step(),
      getAsObject: () => stmt.getAsObject(),
      free: () => stmt.free()
    };
  }

  run(sql, params = []) {
    this.db.run(sql, params);
  }
}

export async function initDb() {
  if (DATABASE_URL) {
    // Use PostgreSQL
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test connection
    const client = await pool.connect();

    // Create tables if not exist
    await createTables(pool);

    db = new PostgresClient(pool);
    console.log('Using PostgreSQL database');
  } else {
    // Use sql.js with file persistence
    const SQL = await initSqlJs();

    let data = null;
    if (existsSync(DB_PATH)) {
      data = readFileSync(DB_PATH);
    }

    sqlDb = new SQL.Database(data);
    createTablesSqlJs(sqlDb);
    db = new SqlJsClient(sqlDb);
    console.log('Using sql.js database (file: ' + DB_PATH + ')');
  }

  return db;
}

async function createTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      badges INTEGER DEFAULT 5,
      pet_type TEXT,
      level INTEGER DEFAULT 1,
      current_food INTEGER DEFAULT 0,
      group_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS point_history (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      points INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups_table (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL REFERENCES groups_table(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      PRIMARY KEY (group_id, student_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS point_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      icon TEXT NOT NULL,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS level_config (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      level INTEGER NOT NULL,
      food_required INTEGER NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      badges_required INTEGER NOT NULL,
      stock INTEGER DEFAULT -1
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exchange_history (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_id, key)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pick_history (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      picked_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

function createTablesSqlJs(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      badges INTEGER DEFAULT 5,
      pet_type TEXT,
      level INTEGER DEFAULT 1,
      current_food INTEGER DEFAULT 0,
      group_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS point_history (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      points INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS groups_table (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      PRIMARY KEY (group_id, student_id),
      FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS point_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      icon TEXT NOT NULL,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS level_config (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      food_required INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS store_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      badges_required INTEGER NOT NULL,
      stock INTEGER DEFAULT -1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_history (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES store_items(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pick_history (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      picked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);
}

export function saveDb() {
  if (sqlDb) {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

export function getDb() {
  return db;
}