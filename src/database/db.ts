// 数据库层（多用户版）：所有业务表按 user_id 隔离
// 精简设计：页面通过本文件函数访问数据库（无直接 SQL），因此多用户隔离集中在本层处理
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { BodyRecord, UserProfile, CustomTag, RecordTag, Goal, NutritionGoal } from './types';

const DB_NAME = 'bodydata.db';

// 单飞模式：并发调用 getDB() 时共享同一个初始化 Promise，
// 避免 web 端（OPFS Access Handle 互斥）因并发重复 openDatabaseAsync 触发 createSyncAccessHandle 冲突
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await initDB(db);
      return db;
    })();
  }
  return dbPromise;
}

// ───────────────────── 当前活跃用户（登录后设置） ─────────────────────
let activeUserId: number | null = null;
let orphanedAdopted = false;

export function setActiveUser(userId: number | null): void {
  activeUserId = userId;
  if (userId != null && !orphanedAdopted) {
    orphanedAdopted = true;
    adoptOrphanedData(userId).catch(console.error);
  }
}

export function getActiveUser(): number | null {
  return activeUserId;
}

// 未登录时调用数据库函数直接抛错（由页面守卫避免）
function uid(): number {
  if (activeUserId == null) throw new Error('未登录');
  return activeUserId;
}

// ───────────────────── 表结构与迁移 ─────────────────────
// body_record 建表语句（record_date 不带 UNIQUE：多用户下同一天各用户可各有一条）
const BODY_RECORD_SCHEMA = `
  CREATE TABLE IF NOT EXISTS body_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    record_date TEXT NOT NULL,
    weight REAL,
    body_fat REAL,
    muscle_mass REAL,
    water_rate REAL,
    bmr REAL,
    bmi REAL,
    chest REAL,
    waist REAL,
    hip REAL,
    upper_arm REAL,
    thigh REAL,
    calf REAL,
    neck REAL,
    heart_rate INTEGER,
    steps INTEGER,
    water_intake REAL,
    body_temperature REAL,
    mood INTEGER,
    sleep_duration REAL,
    sleep_score INTEGER,
    is_menstrual INTEGER DEFAULT 0,
    menstrual_day INTEGER,
    exercise_type TEXT DEFAULT 'none',
    exercise_duration INTEGER,
    exercise_note TEXT,
    body_status TEXT,
    food_list TEXT,
    sport_list TEXT,
    sport_json TEXT,
    sport_total_cal REAL,
    remark TEXT,
    create_time TEXT DEFAULT (datetime('now', 'localtime')),
    update_time TEXT DEFAULT (datetime('now', 'localtime'))
  );
`;

async function initDB(db: SQLite.SQLiteDatabase) {
  // web 端 expo-sqlite 使用 wa-sqlite（OPFS Access Handle），不支持 WAL（需要额外的 -wal/-shm 文件句柄，会触发 createSyncAccessHandle 冲突），
  // 因此 web 平台回退到默认 DELETE 日志模式；Android/iOS 原生端保持 WAL 提升并发写入性能。
  const journalMode = Platform.OS === 'web' ? 'DELETE' : 'WAL';
  await db.execAsync(`
    PRAGMA journal_mode = ${journalMode};

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      height REAL,
      weight REAL,
      gender TEXT,
      age INTEGER,
      target_weight REAL,
      target_waist REAL,
      create_time TEXT DEFAULT (datetime('now', 'localtime')),
      update_time TEXT DEFAULT (datetime('now', 'localtime'))
    );

    ${BODY_RECORD_SCHEMA}

    CREATE TABLE IF NOT EXISTS record_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      user_id INTEGER,
      tag_name TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES body_record(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_name TEXT NOT NULL,
      user_id INTEGER,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS record_image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      user_id INTEGER,
      local_image_path TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES body_record(id) ON DELETE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS nutrition_goal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      daily_calorie REAL,
      daily_protein REAL,
      daily_carb REAL,
      daily_fat REAL
    );

    CREATE INDEX IF NOT EXISTS idx_body_record_date ON body_record(record_date);
    CREATE INDEX IF NOT EXISTS idx_record_tag_record ON record_tag(record_id);
  `);

  // 迁移：旧版本（单用户）库缺少 user_id 列时补齐（须在依赖 user_id 的索引/查询之前完成）
  const ensureColumn = async (table: string, column: string, type: string) => {
    const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!cols.some((c) => c.name === column)) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  };
  await ensureColumn('user_profile', 'user_id', 'INTEGER');
  await ensureColumn('body_record', 'user_id', 'INTEGER');
  await ensureColumn('record_tag', 'user_id', 'INTEGER');
  await ensureColumn('custom_tag', 'user_id', 'INTEGER');
  await ensureColumn('record_image', 'user_id', 'INTEGER');
  await ensureColumn('goal', 'user_id', 'INTEGER');
  await ensureColumn('nutrition_goal', 'user_id', 'INTEGER');

  // 依赖 user_id 的索引（须在 ensureColumn 之后创建）
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_body_record_user_date ON body_record(user_id, record_date);
  `);

  // 旧版（单用户）库的 record_date 带全局 UNIQUE 约束，多用户下无法删除该约束，需重建表
  const idxList = await db.getAllAsync<{ name: string; sql: string | null }>('PRAGMA index_list(body_record)');
  const hasUniqueDate = idxList.some((i) => (i.sql || '').toUpperCase().includes('UNIQUE'));
  if (hasUniqueDate) {
    await rebuildBodyRecordWithoutUnique(db);
  }

  await migrateDB(db);
}

// 重建 body_record 表：去掉 record_date 的 UNIQUE 约束并保留原有数据
async function rebuildBodyRecordWithoutUnique(db: SQLite.SQLiteDatabase) {
  const copyCols =
    'id, record_date, weight, body_fat, muscle_mass, water_rate, bmr, bmi, chest, waist, hip, upper_arm, thigh, calf, ' +
    'neck, heart_rate, steps, water_intake, body_temperature, mood, sleep_duration, sleep_score, is_menstrual, menstrual_day, ' +
    'exercise_type, exercise_duration, exercise_note, body_status, food_list, sport_list, sport_json, sport_total_cal, remark, ' +
    'create_time, update_time';
  await db.execAsync(`
    ALTER TABLE body_record RENAME TO body_record_old;
    ${BODY_RECORD_SCHEMA}
    INSERT INTO body_record (${copyCols}) SELECT ${copyCols} FROM body_record_old;
    DROP TABLE body_record_old;
  `);
  console.log('[db] body_record rebuilt (removed UNIQUE on record_date)');
}

// 旧数据收养：App 升级前是"单用户"，把 user_id 为空的历史数据归给第一个登录用户，避免数据丢失
async function adoptOrphanedData(userId: number): Promise<void> {
  try {
    const db = await getDB();
    const tables = ['body_record', 'record_tag', 'custom_tag', 'record_image', 'goal'];
    for (const t of tables) {
      await db.runAsync(`UPDATE ${t} SET user_id = ? WHERE user_id IS NULL`, userId);
    }
    await db.runAsync(
      `UPDATE user_profile SET user_id = ? WHERE user_id IS NULL AND id = (SELECT MIN(id) FROM user_profile WHERE user_id IS NULL)`,
      userId
    );
    await db.runAsync(
      `UPDATE nutrition_goal SET user_id = ? WHERE user_id IS NULL AND id = (SELECT MIN(id) FROM nutrition_goal WHERE user_id IS NULL)`,
      userId
    );
    console.log('[db] orphaned data adopted to user', userId);
  } catch (e) {
    console.warn('[db] adoptOrphanedData failed', e);
  }
}

async function migrateDB(db: SQLite.SQLiteDatabase) {
  const bodyCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(body_record)');
  const existingBody = new Set(bodyCols.map((c) => c.name));

  const bodyNewColumns: { name: string; type: string }[] = [
    { name: 'neck', type: 'REAL' },
    { name: 'heart_rate', type: 'INTEGER' },
    { name: 'steps', type: 'INTEGER' },
    { name: 'water_intake', type: 'REAL' },
    { name: 'body_temperature', type: 'REAL' },
    { name: 'mood', type: 'INTEGER' },
    { name: 'food_list', type: 'TEXT' },
    { name: 'sport_list', type: 'TEXT' },
    { name: 'sport_json', type: 'TEXT' },
    { name: 'sport_total_cal', type: 'REAL' },
  ];

  for (const col of bodyNewColumns) {
    if (!existingBody.has(col.name)) {
      await db.execAsync(`ALTER TABLE body_record ADD COLUMN ${col.name} ${col.type}`);
    }
  }

  const profileCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_profile)');
  const existingProfile = new Set(profileCols.map((c) => c.name));
  if (!existingProfile.has('weight')) {
    await db.execAsync('ALTER TABLE user_profile ADD COLUMN weight REAL');
  }
}

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getTodayRecord(): Promise<BodyRecord | null> {
  const db = await getDB();
  const record = await db.getFirstAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE record_date = ? AND user_id = ?',
    todayStr(),
    uid()
  );
  return record ?? null;
}

export async function getRecordByDate(date: string): Promise<BodyRecord | null> {
  const db = await getDB();
  const record = await db.getFirstAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE record_date = ? AND user_id = ?',
    date,
    uid()
  );
  return record ?? null;
}

export async function getRecordById(id: number): Promise<BodyRecord | null> {
  const db = await getDB();
  const record = await db.getFirstAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE id = ? AND user_id = ?',
    id,
    uid()
  );
  return record ?? null;
}

export async function saveRecord(record: Partial<BodyRecord> & { record_date: string }): Promise<number> {
  const db = await getDB();
  const userId = uid();
  const existing = await getRecordByDate(record.record_date);

  const fields: (keyof BodyRecord)[] = [
    'weight', 'body_fat', 'muscle_mass', 'water_rate', 'bmr', 'bmi',
    'chest', 'waist', 'hip', 'upper_arm', 'thigh', 'calf',
    'neck', 'heart_rate', 'steps', 'water_intake', 'body_temperature', 'mood',
    'sleep_duration', 'sleep_score', 'is_menstrual', 'menstrual_day',
    'exercise_type', 'exercise_duration', 'exercise_note', 'body_status', 'remark',
    'food_list', 'sport_list', 'sport_json', 'sport_total_cal'
  ];

  const values = fields.map((f) => (record as any)[f] ?? null);

  if (existing && existing.id) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    await db.runAsync(
      `UPDATE body_record SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
    return existing.id;
  } else {
    const placeholders = fields.map(() => '?').join(', ');
    const result = await db.runAsync(
      `INSERT INTO body_record (record_date, user_id, ${fields.join(', ')}) VALUES (?, ?, ${placeholders})`,
      record.record_date, userId, ...values
    );
    return result.lastInsertRowId as number;
  }
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDB();
  const userId = uid();
  await db.runAsync('DELETE FROM body_record WHERE id = ? AND user_id = ?', id, userId);
  await db.runAsync('DELETE FROM record_tag WHERE record_id = ? AND user_id = ?', id, userId);
  await db.runAsync('DELETE FROM record_image WHERE record_id = ? AND user_id = ?', id, userId);
}

export async function getRecords(limit?: number, offset?: number): Promise<BodyRecord[]> {
  const db = await getDB();
  let sql = 'SELECT * FROM body_record WHERE user_id = ? ORDER BY record_date DESC';
  const params: any[] = [uid()];
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }
  return await db.getAllAsync<BodyRecord>(sql, ...params);
}

export async function getRecordsByDateRange(startDate: string, endDate: string): Promise<BodyRecord[]> {
  const db = await getDB();
  return await db.getAllAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE user_id = ? AND record_date >= ? AND record_date <= ? ORDER BY record_date ASC',
    uid(), startDate, endDate
  );
}

export async function getRecentRecords(days: number): Promise<BodyRecord[]> {
  const db = await getDB();
  return await db.getAllAsync<BodyRecord>(
    `SELECT * FROM body_record WHERE user_id = ? AND record_date >= date('now', '-${days} days', 'localtime') ORDER BY record_date ASC`,
    uid()
  );
}

export async function searchRecords(query: string): Promise<BodyRecord[]> {
  const db = await getDB();
  const userId = uid();
  return await db.getAllAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE user_id = ? AND (remark LIKE ? OR body_status LIKE ?) ORDER BY record_date DESC',
    userId, `%${query}%`, `%${query}%`
  );
}

export async function getRecordTags(recordId: number): Promise<RecordTag[]> {
  const db = await getDB();
  return await db.getAllAsync<RecordTag>(
    'SELECT * FROM record_tag WHERE record_id = ? AND user_id = ?',
    recordId, uid()
  );
}

export async function setRecordTags(recordId: number, tags: string[]): Promise<void> {
  const db = await getDB();
  const userId = uid();
  await db.runAsync('DELETE FROM record_tag WHERE record_id = ? AND user_id = ?', recordId, userId);
  for (const tag of tags) {
    await db.runAsync('INSERT INTO record_tag (record_id, user_id, tag_name) VALUES (?, ?, ?)', recordId, userId, tag);
  }
}

export async function getAllTags(): Promise<CustomTag[]> {
  const db = await getDB();
  return await db.getAllAsync<CustomTag>('SELECT * FROM custom_tag WHERE user_id = ? ORDER BY tag_name', uid());
}

export async function addTag(tagName: string, color?: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR IGNORE INTO custom_tag (tag_name, user_id, color) VALUES (?, ?, ?)',
    tagName, uid(), color ?? null
  );
}

export async function deleteTag(tagName: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM custom_tag WHERE tag_name = ? AND user_id = ?', tagName, uid());
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDB();
  const profile = await db.getFirstAsync<UserProfile>(
    'SELECT * FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1',
    uid()
  );
  return profile ?? null;
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const db = await getDB();
  const userId = uid();
  const fields: (keyof UserProfile)[] = ['height', 'weight', 'gender', 'age', 'target_weight', 'target_waist'];
  const values = fields.map((f) => (profile as any)[f] ?? null);

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1',
    userId
  );
  if (existing) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    await db.runAsync(
      `UPDATE user_profile SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
  } else {
    await db.runAsync(
      `INSERT INTO user_profile (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
      userId, ...values
    );
  }
}

export async function getActiveGoals(): Promise<Goal[]> {
  const db = await getDB();
  return await db.getAllAsync<Goal>(
    'SELECT * FROM goal WHERE user_id = ? AND is_active = 1 ORDER BY create_time DESC',
    uid()
  );
}

export async function saveGoal(goal: Partial<Goal> & { goal_type: string; target_value: number }): Promise<void> {
  const db = await getDB();
  const userId = uid();
  await db.runAsync('UPDATE goal SET is_active = 0 WHERE user_id = ? AND goal_type = ?', userId, goal.goal_type);
  await db.runAsync(
    `INSERT INTO goal (user_id, goal_type, target_value, start_value, start_date, target_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    userId, goal.goal_type, goal.target_value, goal.start_value ?? null,
    goal.start_date ?? todayStr(), goal.target_date ?? null
  );
}

export async function getNutritionGoal(): Promise<NutritionGoal | null> {
  const db = await getDB();
  const result = await db.getFirstAsync<NutritionGoal>(
    'SELECT * FROM nutrition_goal WHERE user_id = ? ORDER BY id LIMIT 1',
    uid()
  );
  return result ?? null;
}

export async function saveNutritionGoal(goal: Partial<NutritionGoal>): Promise<void> {
  const db = await getDB();
  const userId = uid();
  const fields: (keyof NutritionGoal)[] = ['daily_calorie', 'daily_protein', 'daily_carb', 'daily_fat'];
  const values = fields.map((f) => (goal as any)[f] ?? null);

  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM nutrition_goal WHERE user_id = ? ORDER BY id LIMIT 1',
    userId
  );
  if (existing) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    await db.runAsync(
      `UPDATE nutrition_goal SET ${setClause} WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
  } else {
    await db.runAsync(
      `INSERT INTO nutrition_goal (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
      userId, ...values
    );
  }
}

export async function getAllRecordsCount(): Promise<number> {
  const db = await getDB();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM body_record WHERE user_id = ?',
    uid()
  );
  return result?.count ?? 0;
}

export async function getDatesWithRecords(year: number, month: number): Promise<string[]> {
  const db = await getDB();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const results = await db.getAllAsync<{ record_date: string }>(
    'SELECT record_date FROM body_record WHERE user_id = ? AND record_date >= ? AND record_date <= ?',
    uid(), startDate, endDate
  );
  return results.map((r) => r.record_date);
}