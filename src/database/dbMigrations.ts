import type { ExecResult } from './dbDriver.interface';

export type MigrationExecutor = <T = any>(sql: string, params?: any[]) => Promise<ExecResult<T>>;

// 精简后的 body_record 表：仅 5 个核心指标
export const BODY_RECORD_SCHEMA = `
  CREATE TABLE IF NOT EXISTS body_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    record_date TEXT NOT NULL,
    weight REAL,
    bmi REAL,
    body_fat REAL,
    waist REAL,
    sleep_duration REAL,
    create_time TEXT DEFAULT (datetime('now', 'localtime')),
    update_time TEXT DEFAULT (datetime('now', 'localtime'))
  );
`;

export async function runMigrations(exec: { exec: MigrationExecutor }): Promise<void> {
  const { exec: query } = exec;

  await query(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      height REAL,
      weight REAL,
      gender TEXT,
      age INTEGER,
      target_weight REAL,
      create_time TEXT DEFAULT (datetime('now', 'localtime')),
      update_time TEXT DEFAULT (datetime('now', 'localtime'))
    );

    ${BODY_RECORD_SCHEMA}

    CREATE TABLE IF NOT EXISTS goal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      goal_type TEXT NOT NULL,
      target_value REAL NOT NULL,
      start_value REAL,
      start_date TEXT,
      target_date TEXT,
      is_active INTEGER DEFAULT 1,
      create_time TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_body_record_date ON body_record(record_date);
    CREATE INDEX IF NOT EXISTS idx_body_record_user_date ON body_record(user_id, record_date);
  `);

  // 兼容旧库：确保 user_id 列存在
  const ensureColumn = async (table: string, column: string, type: string) => {
    const cols = await query<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!cols.rows.some((c) => c.name === column)) {
      await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  };
  await ensureColumn('user_profile', 'user_id', 'INTEGER');
  await ensureColumn('body_record', 'user_id', 'INTEGER');
  await ensureColumn('goal', 'user_id', 'INTEGER');

  // 如果旧库有 UNIQUE 约束，重建表移除
  const idxList = await query<{ name: string; sql: string | null }>('PRAGMA index_list(body_record)');
  const hasUniqueDate = idxList.rows.some((i) => (i.sql || '').toUpperCase().includes('UNIQUE'));
  if (hasUniqueDate) {
    await rebuildBodyRecord(query);
  }
}

async function rebuildBodyRecord(query: MigrationExecutor): Promise<void> {
  const copyCols = 'id, user_id, record_date, weight, bmi, body_fat, waist, sleep_duration, create_time, update_time';
  await query(`
    ALTER TABLE body_record RENAME TO body_record_old;
    ${BODY_RECORD_SCHEMA}
    INSERT INTO body_record (${copyCols}) SELECT ${copyCols} FROM body_record_old;
    DROP TABLE body_record_old;
  `);
  console.log('[db] body_record rebuilt (slim schema)');
}
