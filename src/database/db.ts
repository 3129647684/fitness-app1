import driver from '@/database/dbDriver';
import {
  BodyRecord,
  UserProfile,
  CustomTag,
  RecordTag,
  Goal,
  NutritionGoal,
  FoodItem,
  SportItem,
} from './types';

export { runMigrations } from './dbMigrations';

// ───────────────────── 活跃用户（多用户隔离） ─────────────────────
let activeUserId: number | null = null;
let orphanedAdopted = false;

export function setCurrentUserId(userId: number | null): void {
  activeUserId = userId;
  if (userId != null && !orphanedAdopted) {
    orphanedAdopted = true;
    adoptOrphanedData(userId).catch(console.error);
  }
}

export function setActiveUser(userId: number | null): void {
  setCurrentUserId(userId);
}

export function getCurrentUserId(): number | null {
  return activeUserId;
}

export function getActiveUser(): number | null {
  return activeUserId;
}

function uid(): number {
  if (activeUserId == null) throw new Error('未登录');
  return activeUserId;
}

// ───────────────────── 驱动包装器（exec/getAll/getFirst/run） ─────────────────────
async function exec<T = any>(sql: string, params?: any[]) {
  return driver.exec<T>(sql, params);
}

async function getAll<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  const res = await driver.exec<T>(sql, params);
  return res.rows;
}

async function getFirst<T = any>(sql: string, ...params: any[]): Promise<T | null> {
  const res = await driver.exec<T>(sql, params);
  return res.rows[0] ?? null;
}

async function run(sql: string, ...params: any[]) {
  return driver.exec(sql, params);
}

// ───────────────────── 公开：初始化 / 调试句柄 ─────────────────────
export async function initDatabase(): Promise<void> {
  await driver.initDb();
}

export function getDb(): unknown {
  return driver.getRawHandle();
}

export function closeDatabase(): void {
  driver.close();
}

// ───────────────────── 工具：日期字符串 ─────────────────────
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

// ───────────────────── BodyRecord 主表 ─────────────────────
export async function getTodayRecord(): Promise<BodyRecord | null> {
  return getRecordByDate(todayStr());
}

export async function getRecordByDate(date: string): Promise<BodyRecord | null> {
  return getFirst<BodyRecord>(
    'SELECT * FROM body_record WHERE record_date = ? AND user_id = ?',
    date,
    uid()
  );
}

export async function getBodyRecordsByDate(date: string): Promise<BodyRecord | null> {
  return getRecordByDate(date);
}

export async function getRecordById(id: number): Promise<BodyRecord | null> {
  return getFirst<BodyRecord>(
    'SELECT * FROM body_record WHERE id = ? AND user_id = ?',
    id,
    uid()
  );
}

export async function getRecords(limit?: number, offset?: number): Promise<BodyRecord[]> {
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
  return getAll<BodyRecord>(sql, ...params);
}

export async function getRecordsByDateRange(startDate: string, endDate: string): Promise<BodyRecord[]> {
  return getAll<BodyRecord>(
    'SELECT * FROM body_record WHERE user_id = ? AND record_date >= ? AND record_date <= ? ORDER BY record_date ASC',
    uid(), startDate, endDate
  );
}

export async function getBodyRecordsByRange(startDate: string, endDate: string): Promise<BodyRecord[]> {
  return getRecordsByDateRange(startDate, endDate);
}

export async function getRecentRecords(days: number): Promise<BodyRecord[]> {
  return getAll<BodyRecord>(
    `SELECT * FROM body_record WHERE user_id = ? AND record_date >= date('now', '-${days} days', 'localtime') ORDER BY record_date ASC`,
    uid()
  );
}

export async function searchRecords(query: string): Promise<BodyRecord[]> {
  return getAll<BodyRecord>(
    'SELECT * FROM body_record WHERE user_id = ? AND (remark LIKE ? OR body_status LIKE ?) ORDER BY record_date DESC',
    uid(), `%${query}%`, `%${query}%`
  );
}

export async function getAllRecordsCount(): Promise<number> {
  const result = await getFirst<{ count: number }>(
    'SELECT COUNT(*) as count FROM body_record WHERE user_id = ?',
    uid()
  );
  return result?.count ?? 0;
}

export async function getDatesWithRecords(year: number, month: number): Promise<string[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const results = await getAll<{ record_date: string }>(
    'SELECT record_date FROM body_record WHERE user_id = ? AND record_date >= ? AND record_date <= ?',
    uid(), startDate, endDate
  );
  return results.map((r) => r.record_date);
}

// ── insert / update / delete BodyRecord ──
export async function saveRecord(record: Partial<BodyRecord> & { record_date: string }): Promise<number> {
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
    await run(
      `UPDATE body_record SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
    return existing.id;
  } else {
    const placeholders = fields.map(() => '?').join(', ');
    const result = await run(
      `INSERT INTO body_record (record_date, user_id, ${fields.join(', ')}) VALUES (?, ?, ${placeholders})`,
      record.record_date, userId, ...values
    );
    return result.lastInsertRowId as number;
  }
}

export async function insertBodyRecord(record: Partial<BodyRecord> & { record_date: string }): Promise<number> {
  return saveRecord(record);
}

export async function updateBodyRecord(record: Partial<BodyRecord> & { record_date: string }): Promise<number> {
  return saveRecord(record);
}

export async function deleteRecord(id: number): Promise<void> {
  const userId = uid();
  await run('DELETE FROM body_record WHERE id = ? AND user_id = ?', id, userId);
  await run('DELETE FROM record_tag WHERE record_id = ? AND user_id = ?', id, userId);
  await run('DELETE FROM record_image WHERE record_id = ? AND user_id = ?', id, userId);
}

export async function deleteBodyRecord(id: number): Promise<void> {
  return deleteRecord(id);
}

// ───────────────────── RecordTag（身体记录标签） ─────────────────────
export async function getRecordTags(recordId: number): Promise<RecordTag[]> {
  return getAll<RecordTag>(
    'SELECT * FROM record_tag WHERE record_id = ? AND user_id = ?',
    recordId, uid()
  );
}

export async function setRecordTags(recordId: number, tags: string[]): Promise<void> {
  const userId = uid();
  await run('DELETE FROM record_tag WHERE record_id = ? AND user_id = ?', recordId, userId);
  for (const tag of tags) {
    await run('INSERT INTO record_tag (record_id, user_id, tag_name) VALUES (?, ?, ?)', recordId, userId, tag);
  }
}

export async function upsertRecordTag(recordId: number, tagName: string): Promise<void> {
  const userId = uid();
  await run(
    'INSERT OR IGNORE INTO record_tag (record_id, user_id, tag_name) VALUES (?, ?, ?)',
    recordId, userId, tagName
  );
}

export async function deleteAllTagsOfRecord(recordId: number): Promise<void> {
  await run('DELETE FROM record_tag WHERE record_id = ? AND user_id = ?', recordId, uid());
}

// ───────────────────── CustomTag（自定义标签库） ─────────────────────
export async function getAllTags(): Promise<CustomTag[]> {
  return getAll<CustomTag>('SELECT * FROM custom_tag WHERE user_id = ? ORDER BY tag_name', uid());
}

export async function addTag(tagName: string, color?: string): Promise<void> {
  await run(
    'INSERT OR IGNORE INTO custom_tag (tag_name, user_id, color) VALUES (?, ?, ?)',
    tagName, uid(), color ?? null
  );
}

export async function deleteTag(tagName: string): Promise<void> {
  await run('DELETE FROM custom_tag WHERE tag_name = ? AND user_id = ?', tagName, uid());
}

// ───────────────────── UserProfile ─────────────────────
export async function getUserProfile(): Promise<UserProfile | null> {
  return getFirst<UserProfile>(
    'SELECT * FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1',
    uid()
  );
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const userId = uid();
  const fields: (keyof UserProfile)[] = ['height', 'weight', 'gender', 'age', 'target_weight', 'target_waist'];
  const values = fields.map((f) => (profile as any)[f] ?? null);

  const existing = await getFirst<{ id: number }>(
    'SELECT id FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1',
    userId
  );
  if (existing) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    await run(
      `UPDATE user_profile SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
  } else {
    await run(
      `INSERT INTO user_profile (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
      userId, ...values
    );
  }
}

// ───────────────────── Goal（目标） ─────────────────────
export async function getActiveGoals(): Promise<Goal[]> {
  return getAll<Goal>(
    'SELECT * FROM goal WHERE user_id = ? AND is_active = 1 ORDER BY create_time DESC',
    uid()
  );
}

export async function saveGoal(goal: Partial<Goal> & { goal_type: string; target_value: number }): Promise<void> {
  const userId = uid();
  await run('UPDATE goal SET is_active = 0 WHERE user_id = ? AND goal_type = ?', userId, goal.goal_type);
  await run(
    `INSERT INTO goal (user_id, goal_type, target_value, start_value, start_date, target_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    userId, goal.goal_type, goal.target_value, goal.start_value ?? null,
    goal.start_date ?? todayStr(), goal.target_date ?? null
  );
}

// ───────────────────── NutritionGoal（营养目标） ─────────────────────
export async function getNutritionGoal(): Promise<NutritionGoal | null> {
  const result = await getFirst<NutritionGoal>(
    'SELECT * FROM nutrition_goal WHERE user_id = ? ORDER BY id LIMIT 1',
    uid()
  );
  return result ?? null;
}

export async function saveNutritionGoal(goal: Partial<NutritionGoal>): Promise<void> {
  const userId = uid();
  const fields: (keyof NutritionGoal)[] = ['daily_calorie', 'daily_protein', 'daily_carb', 'daily_fat'];
  const values = fields.map((f) => (goal as any)[f] ?? null);

  const existing = await getFirst<{ id: number }>(
    'SELECT id FROM nutrition_goal WHERE user_id = ? ORDER BY id LIMIT 1',
    userId
  );
  if (existing) {
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    await run(
      `UPDATE nutrition_goal SET ${setClause} WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
  } else {
    await run(
      `INSERT INTO nutrition_goal (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
      userId, ...values
    );
  }
}

// ───────────────────── FoodItem（膳食明细：存储在 body_record.food_list JSON） ─────────────────────
export async function getFoodItemsByRecordId(recordId: number): Promise<FoodItem[]> {
  const rec = await getRecordById(recordId);
  if (!rec?.food_list) return [];
  try { return JSON.parse(rec.food_list) as FoodItem[]; } catch { return []; }
}

export async function insertFoodItem(recordId: number, item: FoodItem): Promise<void> {
  const rec = await getRecordById(recordId);
  if (!rec) return;
  const list = await getFoodItemsByRecordId(recordId);
  list.push(item);
  await updateFoodListOfRecord(recordId, list);
}

export async function upsertFoodItem(recordId: number, index: number, item: FoodItem): Promise<void> {
  const list = await getFoodItemsByRecordId(recordId);
  if (index >= 0 && index < list.length) {
    list[index] = item;
  } else {
    list.push(item);
  }
  await updateFoodListOfRecord(recordId, list);
}

export async function deleteFoodItem(recordId: number, index: number): Promise<void> {
  const list = await getFoodItemsByRecordId(recordId);
  if (index >= 0 && index < list.length) {
    list.splice(index, 1);
    await updateFoodListOfRecord(recordId, list);
  }
}

async function updateFoodListOfRecord(recordId: number, list: FoodItem[]): Promise<void> {
  await run(
    'UPDATE body_record SET food_list = ?, update_time = datetime(\'now\', \'localtime\') WHERE id = ? AND user_id = ?',
    JSON.stringify(list), recordId, uid()
  );
}

// ───────────────────── SportItem（运动明细：存储在 body_record.sport_json JSON） ─────────────────────
export async function getSportItemsByRecordId(recordId: number): Promise<SportItem[]> {
  const rec = await getRecordById(recordId);
  if (!rec) return [];
  try {
    const raw = rec.sport_json ?? rec.sport_list;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      const first = parsed[0] as any;
      if ('calConsume' in first || 'duration' in first || 'groupCount' in first) {
        return parsed as SportItem[];
      }
    }
    return [];
  } catch { return []; }
}

export async function insertSportItem(recordId: number, item: SportItem): Promise<void> {
  const list = await getSportItemsByRecordId(recordId);
  list.push(item);
  await updateSportListOfRecord(recordId, list);
}

export async function upsertSportItem(recordId: number, index: number, item: SportItem): Promise<void> {
  const list = await getSportItemsByRecordId(recordId);
  if (index >= 0 && index < list.length) {
    list[index] = item;
  } else {
    list.push(item);
  }
  await updateSportListOfRecord(recordId, list);
}

export async function deleteSportItem(recordId: number, index: number): Promise<void> {
  const list = await getSportItemsByRecordId(recordId);
  if (index >= 0 && index < list.length) {
    list.splice(index, 1);
    await updateSportListOfRecord(recordId, list);
  }
}

async function updateSportListOfRecord(recordId: number, list: SportItem[]): Promise<void> {
  await run(
    'UPDATE body_record SET sport_json = ?, update_time = datetime(\'now\', \'localtime\') WHERE id = ? AND user_id = ?',
    JSON.stringify(list), recordId, uid()
  );
}

// ───────────────────── WaterRecord（饮水：直接在 body_record.water_intake） ─────────────────────
export async function upsertWaterRecord(date: string, waterIntake: number): Promise<void> {
  let rec = await getRecordByDate(date);
  if (!rec) {
    const id = await saveRecord({ record_date: date, water_intake: waterIntake });
    rec = await getRecordById(id);
  } else if (rec.id) {
    await run(
      'UPDATE body_record SET water_intake = ?, update_time = datetime(\'now\', \'localtime\') WHERE id = ? AND user_id = ?',
      waterIntake, rec.id, uid()
    );
  }
}

export async function getWaterRecordByDate(date: string): Promise<{ date: string; water_intake: number } | null> {
  const rec = await getRecordByDate(date);
  if (!rec) return null;
  return { date, water_intake: rec.water_intake ?? 0 };
}

// ───────────────────── SleepRecord（睡眠：直接在 body_record.sleep_* 字段） ─────────────────────
export async function upsertSleepRecord(
  date: string,
  data: { sleep_duration?: number | null; sleep_score?: number | null }
): Promise<void> {
  let rec = await getRecordByDate(date);
  if (!rec) {
    await saveRecord({
      record_date: date,
      sleep_duration: data.sleep_duration ?? null,
      sleep_score: data.sleep_score ?? null,
    });
  } else if (rec.id) {
    await run(
      'UPDATE body_record SET sleep_duration = COALESCE(?, sleep_duration), sleep_score = COALESCE(?, sleep_score), update_time = datetime(\'now\', \'localtime\') WHERE id = ? AND user_id = ?',
      data.sleep_duration ?? null, data.sleep_score ?? null, rec.id, uid()
    );
  }
}

export async function getSleepRecordByDate(date: string): Promise<{ date: string; sleep_duration: number | null; sleep_score: number | null } | null> {
  const rec = await getRecordByDate(date);
  if (!rec) return null;
  return { date, sleep_duration: rec.sleep_duration, sleep_score: rec.sleep_score };
}

// ───────────────────── 旧数据收养（单用户→多用户） ─────────────────────
async function adoptOrphanedData(userId: number): Promise<void> {
  try {
    const tables = ['body_record', 'record_tag', 'custom_tag', 'record_image', 'goal'];
    for (const t of tables) {
      await run(`UPDATE ${t} SET user_id = ? WHERE user_id IS NULL`, userId);
    }
    await run(
      `UPDATE user_profile SET user_id = ? WHERE user_id IS NULL AND id = (SELECT MIN(id) FROM user_profile WHERE user_id IS NULL)`,
      userId
    );
    await run(
      `UPDATE nutrition_goal SET user_id = ? WHERE user_id IS NULL AND id = (SELECT MIN(id) FROM nutrition_goal WHERE user_id IS NULL)`,
      userId
    );
    console.log('[db] orphaned data adopted to user', userId);
  } catch (e) {
    console.warn('[db] adoptOrphanedData failed', e);
  }
}

// ───────────────────── 同步：全量快照导出/导入 ─────────────────────
interface SyncPayload {
  version: number;
  exportedAt: string;
  profile: UserProfile | null;
  nutritionGoal: NutritionGoal | null;
  records: BodyRecord[];
  tags: CustomTag[];
  recordTags: RecordTag[];
  goals: Goal[];
}

const SYNC_VERSION = 1;

export async function getAllRecordsForSync(): Promise<string> {
  const u = uid();
  const [profile, nutritionGoal, records, tags, recordTags, goals] = await Promise.all([
    getFirst<UserProfile>('SELECT * FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1', u),
    getFirst<NutritionGoal>('SELECT * FROM nutrition_goal WHERE user_id = ? ORDER BY id LIMIT 1', u),
    getAll<BodyRecord>('SELECT * FROM body_record WHERE user_id = ? ORDER BY id', u),
    getAll<CustomTag>('SELECT * FROM custom_tag WHERE user_id = ? ORDER BY id', u),
    getAll<RecordTag>('SELECT * FROM record_tag WHERE user_id = ? ORDER BY id', u),
    getAll<Goal>('SELECT * FROM goal WHERE user_id = ? ORDER BY id', u),
  ]);
  const payload: SyncPayload = {
    version: SYNC_VERSION,
    exportedAt: new Date().toISOString(),
    profile, nutritionGoal, records, tags, recordTags, goals,
  };
  return JSON.stringify(payload);
}

export async function applySnapshot(json: string): Promise<{ records: number }> {
  const u = uid();
  const data = JSON.parse(json) as SyncPayload;

  await exec(`
    DELETE FROM body_record WHERE user_id = ${u};
    DELETE FROM record_tag WHERE user_id = ${u};
    DELETE FROM custom_tag WHERE user_id = ${u};
    DELETE FROM record_image WHERE user_id = ${u};
    DELETE FROM goal WHERE user_id = ${u};
    DELETE FROM user_profile WHERE user_id = ${u};
    DELETE FROM nutrition_goal WHERE user_id = ${u};
  `);

  const idMap = new Map<number, number>();
  for (const r of data.records || []) {
    const res = await run(
      `INSERT INTO body_record (
        user_id, record_date, weight, body_fat, muscle_mass, water_rate, bmr, bmi,
        chest, waist, hip, upper_arm, thigh, calf, neck, heart_rate, steps, water_intake,
        body_temperature, mood, sleep_duration, sleep_score, is_menstrual, menstrual_day,
        exercise_type, exercise_duration, exercise_note, body_status,
        food_list, sport_list, sport_json, sport_total_cal, remark,
        create_time, update_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u, r.record_date, r.weight, r.body_fat, r.muscle_mass, r.water_rate, r.bmr, r.bmi,
      r.chest, r.waist, r.hip, r.upper_arm, r.thigh, r.calf, r.neck, r.heart_rate, r.steps, r.water_intake,
      r.body_temperature, r.mood, r.sleep_duration, r.sleep_score, r.is_menstrual, r.menstrual_day,
      r.exercise_type, r.exercise_duration, r.exercise_note, r.body_status,
      r.food_list, r.sport_list, r.sport_json, r.sport_total_cal, r.remark,
      r.create_time ?? null, r.update_time ?? null
    );
    if (r.id != null) idMap.set(r.id, Number(res.lastInsertRowId));
  }

  for (const t of data.recordTags || []) {
    const newRecordId = t.record_id != null ? idMap.get(t.record_id) : undefined;
    if (newRecordId == null) continue;
    await run(
      'INSERT OR IGNORE INTO record_tag (record_id, user_id, tag_name) VALUES (?, ?, ?)',
      newRecordId, u, t.tag_name
    );
  }
  for (const t of data.tags || []) {
    await run(
      'INSERT OR IGNORE INTO custom_tag (tag_name, user_id, color) VALUES (?, ?, ?)',
      t.tag_name, u, t.color ?? null
    );
  }
  for (const g of data.goals || []) {
    await run(
      `INSERT INTO goal (user_id, goal_type, target_value, start_value, start_date, target_date, is_active, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      u, g.goal_type, g.target_value, g.start_value ?? null, g.start_date ?? null,
      g.target_date ?? null, g.is_active ?? 1, g.create_time ?? null
    );
  }
  if (data.profile) {
    await run(
      `INSERT INTO user_profile (user_id, height, weight, gender, age, target_weight, target_waist, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u, data.profile.height ?? null, data.profile.weight ?? null, data.profile.gender ?? null,
      data.profile.age ?? null, data.profile.target_weight ?? null, data.profile.target_waist ?? null,
      data.profile.create_time ?? null, data.profile.update_time ?? null
    );
  }
  if (data.nutritionGoal) {
    await run(
      `INSERT INTO nutrition_goal (user_id, daily_calorie, daily_protein, daily_carb, daily_fat)
       VALUES (?, ?, ?, ?, ?)`,
      u, data.nutritionGoal.daily_calorie ?? null, data.nutritionGoal.daily_protein ?? null,
      data.nutritionGoal.daily_carb ?? null, data.nutritionGoal.daily_fat ?? null
    );
  }

  console.log('[sync] imported', data.records?.length ?? 0, 'records');
  return { records: data.records?.length ?? 0 };
}
