import * as SQLite from 'expo-sqlite';
import { BodyRecord, UserProfile, CustomTag, RecordTag, Goal, NutritionGoal } from './types';

const DB_NAME = 'bodydata.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initDB(dbInstance);
  }
  return dbInstance;
}

async function initDB(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      height REAL,
      gender TEXT,
      age INTEGER,
      target_weight REAL,
      target_waist REAL,
      create_time TEXT DEFAULT (datetime('now', 'localtime')),
      update_time TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS body_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date TEXT UNIQUE NOT NULL,
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
      sleep_duration REAL,
      sleep_score INTEGER,
      is_menstrual INTEGER DEFAULT 0,
      menstrual_day INTEGER,
      exercise_type TEXT DEFAULT 'none',
      exercise_duration INTEGER,
      exercise_note TEXT,
      body_status TEXT,
      remark TEXT,
      create_time TEXT DEFAULT (datetime('now', 'localtime')),
      update_time TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS record_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      tag_name TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES body_record(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_name TEXT UNIQUE NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS record_image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      local_image_path TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES body_record(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_type TEXT NOT NULL,
      target_value REAL NOT NULL,
      start_value REAL,
      start_date TEXT,
      target_date TEXT,
      is_active INTEGER DEFAULT 1,
      create_time TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS nutrition_goal (
      id INTEGER PRIMARY KEY DEFAULT 1,
      daily_calorie REAL,
      daily_protein REAL,
      daily_carb REAL,
      daily_fat REAL
    );

    CREATE INDEX IF NOT EXISTS idx_body_record_date ON body_record(record_date);
    CREATE INDEX IF NOT EXISTS idx_record_tag_record ON record_tag(record_id);
  `);

  const profile = await db.getFirstAsync('SELECT id FROM user_profile WHERE id = 1');
  if (!profile) {
    await db.runAsync('INSERT INTO user_profile (id, height) VALUES (1, NULL)');
  }
  const nGoal = await db.getFirstAsync('SELECT id FROM nutrition_goal WHERE id = 1');
  if (!nGoal) {
    await db.runAsync('INSERT INTO nutrition_goal (id) VALUES (1)');
  }

  await migrateDB(db);
}

async function migrateDB(db: SQLite.SQLiteDatabase) {
  const bodyCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(body_record)');
  const existingBody = new Set(bodyCols.map(c => c.name));

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
  const existingProfile = new Set(profileCols.map(c => c.name));
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
    'SELECT * FROM body_record WHERE record_date = ?',
    todayStr()
  );
  return record ?? null;
}

export async function getRecordByDate(date: string): Promise<BodyRecord | null> {
  const db = await getDB();
  const record = await db.getFirstAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE record_date = ?',
    date
  );
  return record ?? null;
}

export async function getRecordById(id: number): Promise<BodyRecord | null> {
  const db = await getDB();
  const record = await db.getFirstAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE id = ?',
    id
  );
  return record ?? null;
}

export async function saveRecord(record: Partial<BodyRecord> & { record_date: string }): Promise<number> {
  const db = await getDB();
  const existing = await getRecordByDate(record.record_date);

  const fields: (keyof BodyRecord)[] = [
    'weight', 'body_fat', 'muscle_mass', 'water_rate', 'bmr', 'bmi',
    'chest', 'waist', 'hip', 'upper_arm', 'thigh', 'calf',
    'neck', 'heart_rate', 'steps', 'water_intake', 'body_temperature', 'mood',
    'sleep_duration', 'sleep_score', 'is_menstrual', 'menstrual_day',
    'exercise_type', 'exercise_duration', 'exercise_note', 'body_status', 'remark',
    'food_list', 'sport_list', 'sport_json', 'sport_total_cal'
  ];

  const values = fields.map(f => (record as any)[f] ?? null);

  if (existing && existing.id) {
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    await db.runAsync(
      `UPDATE body_record SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = ?`,
      ...values, existing.id
    );
    return existing.id;
  } else {
    const placeholders = fields.map(() => '?').join(', ');
    const result = await db.runAsync(
      `INSERT INTO body_record (record_date, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
      record.record_date, ...values
    );
    return result.lastInsertRowId as number;
  }
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM body_record WHERE id = ?', id);
  await db.runAsync('DELETE FROM record_tag WHERE record_id = ?', id);
  await db.runAsync('DELETE FROM record_image WHERE record_id = ?', id);
}

export async function getRecords(limit?: number, offset?: number): Promise<BodyRecord[]> {
  const db = await getDB();
  let sql = 'SELECT * FROM body_record ORDER BY record_date DESC';
  const params: any[] = [];
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
    'SELECT * FROM body_record WHERE record_date >= ? AND record_date <= ? ORDER BY record_date ASC',
    startDate, endDate
  );
}

export async function getRecentRecords(days: number): Promise<BodyRecord[]> {
  const db = await getDB();
  return await db.getAllAsync<BodyRecord>(
    `SELECT * FROM body_record WHERE record_date >= date('now', '-${days} days', 'localtime') ORDER BY record_date ASC`
  );
}

export async function searchRecords(query: string): Promise<BodyRecord[]> {
  const db = await getDB();
  return await db.getAllAsync<BodyRecord>(
    'SELECT * FROM body_record WHERE remark LIKE ? OR body_status LIKE ? ORDER BY record_date DESC',
    `%${query}%`, `%${query}%`
  );
}

export async function getRecordTags(recordId: number): Promise<RecordTag[]> {
  const db = await getDB();
  return await db.getAllAsync<RecordTag>(
    'SELECT * FROM record_tag WHERE record_id = ?',
    recordId
  );
}

export async function setRecordTags(recordId: number, tags: string[]): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM record_tag WHERE record_id = ?', recordId);
  for (const tag of tags) {
    await db.runAsync('INSERT INTO record_tag (record_id, tag_name) VALUES (?, ?)', recordId, tag);
  }
}

export async function getAllTags(): Promise<CustomTag[]> {
  const db = await getDB();
  return await db.getAllAsync<CustomTag>('SELECT * FROM custom_tag ORDER BY tag_name');
}

export async function addTag(tagName: string, color?: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('INSERT OR IGNORE INTO custom_tag (tag_name, color) VALUES (?, ?)', tagName, color ?? null);
}

export async function deleteTag(tagName: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM custom_tag WHERE tag_name = ?', tagName);
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const db = await getDB();
  const profile = await db.getFirstAsync<UserProfile>('SELECT * FROM user_profile WHERE id = 1');
  return profile ?? null;
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const db = await getDB();
  const fields: (keyof UserProfile)[] = ['height', 'weight', 'gender', 'age', 'target_weight', 'target_waist'];
  const values = fields.map(f => (profile as any)[f] ?? null);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.runAsync(
    `UPDATE user_profile SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = 1`,
    ...values
  );
}

export async function getActiveGoals(): Promise<Goal[]> {
  const db = await getDB();
  return await db.getAllAsync<Goal>('SELECT * FROM goal WHERE is_active = 1 ORDER BY create_time DESC');
}

export async function saveGoal(goal: Partial<Goal> & { goal_type: string; target_value: number }): Promise<void> {
  const db = await getDB();
  await db.runAsync('UPDATE goal SET is_active = 0 WHERE goal_type = ?', goal.goal_type);
  await db.runAsync(
    `INSERT INTO goal (goal_type, target_value, start_value, start_date, target_date, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    goal.goal_type, goal.target_value, goal.start_value ?? null,
    goal.start_date ?? todayStr(), goal.target_date ?? null
  );
}

export async function getNutritionGoal(): Promise<NutritionGoal | null> {
  const db = await getDB();
  const result = await db.getFirstAsync<NutritionGoal>('SELECT * FROM nutrition_goal WHERE id = 1');
  return result ?? null;
}

export async function saveNutritionGoal(goal: Partial<NutritionGoal>): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE nutrition_goal SET daily_calorie = ?, daily_protein = ?, daily_carb = ?, daily_fat = ? WHERE id = 1`,
    goal.daily_calorie ?? null, goal.daily_protein ?? null, goal.daily_carb ?? null, goal.daily_fat ?? null
  );
}

export async function getAllRecordsCount(): Promise<number> {
  const db = await getDB();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM body_record');
  return result?.count ?? 0;
}

export async function getDatesWithRecords(year: number, month: number): Promise<string[]> {
  const db = await getDB();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const results = await db.getAllAsync<{ record_date: string }>(
    'SELECT record_date FROM body_record WHERE record_date >= ? AND record_date <= ?',
    startDate, endDate
  );
  return results.map(r => r.record_date);
}
