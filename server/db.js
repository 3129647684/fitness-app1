// 数据库初始化与连接（适配精简后的5核心字段）
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

let db = null;

function initDb() {
  if (db) return db;

  // 确保数据目录存在
  const dataDir = path.dirname(config.DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new DatabaseSync(config.DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  createTables();
  ensureAdminUser();

  console.log('[db] 数据库初始化完成:', config.DB_PATH);
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      nickname TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 精简后的 body_record 表：仅5个核心指标
    CREATE TABLE IF NOT EXISTS body_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      record_date TEXT NOT NULL,
      weight REAL,
      bmi REAL,
      body_fat REAL,
      waist REAL,
      sleep_duration REAL,
      create_time TEXT DEFAULT (datetime('now')),
      update_time TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, record_date)
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      height REAL,
      weight REAL,
      gender TEXT,
      age INTEGER,
      target_weight REAL,
      create_time TEXT DEFAULT (datetime('now')),
      update_time TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_type TEXT NOT NULL,
      target_value REAL NOT NULL,
      start_value REAL,
      start_date TEXT,
      target_date TEXT,
      is_active INTEGER DEFAULT 1,
      create_time TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sync_data (
      user_id INTEGER PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_body_record_user_date ON body_record(user_id, record_date);
    CREATE INDEX IF NOT EXISTS idx_goal_user ON goal(user_id);
  `);
}

function ensureAdminUser() {
  const { hashPassword } = require('./utils/password');
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(config.ADMIN_USERNAME);

  if (existing) return;

  // 确定管理员密码
  let password = config.ADMIN_PASSWORD;
  let isGenerated = false;
  if (!password) {
    password = config.generateRandomPassword();
    isGenerated = true;
  }

  const { hash, salt } = hashPassword(password);
  db.prepare('INSERT INTO admins (username, password_hash, salt) VALUES (?, ?, ?)')
    .run(config.ADMIN_USERNAME, hash, salt);

  if (isGenerated) {
    console.log('========================================');
    console.log('  首次启动：已生成默认管理员账号');
    console.log(`  用户名: ${config.ADMIN_USERNAME}`);
    console.log(`  密码:   ${password}`);
    console.log('  请尽快通过环境变量 ADMIN_PASSWORD 修改');
    console.log('========================================');
  }
}

function getDb() {
  if (!db) initDb();
  return db;
}

module.exports = { initDb, getDb };
