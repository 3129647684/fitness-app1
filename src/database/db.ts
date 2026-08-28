import driver from '@/database/dbDriver';
import { BodyRecord, UserProfile, Goal } from './types';

export { runMigrations } from './dbMigrations';

// ───────────────────── 活跃用户（多用户隔离） ─────────────────────
let activeUserId: number | null = null;

export function setCurrentUserId(userId: number | null): void {
  activeUserId = userId;
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

// ───────────────────── 驱动包装器 ─────────────────────
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

// ───────────────────── BodyRecord 主表（5核心字段） ─────────────────────
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

export async function getRecentRecords(days: number): Promise<BodyRecord[]> {
  return getAll<BodyRecord>(
    `SELECT * FROM body_record WHERE user_id = ? AND record_date >= date('now', '-${days} days', 'localtime') ORDER BY record_date ASC`,
    uid()
  );
}

// 核心字段列表
export const CORE_FIELDS: (keyof BodyRecord)[] = [
  'weight', 'bmi', 'body_fat', 'waist', 'sleep_duration',
];

export async function saveRecord(record: Partial<BodyRecord> & { record_date: string }): Promise<number> {
  const userId = uid();
  const existing = await getRecordByDate(record.record_date);

  const values = CORE_FIELDS.map((f) => (record as any)[f] ?? null);

  if (existing && existing.id) {
    const setClause = CORE_FIELDS.map((f) => `${f} = ?`).join(', ');
    await run(
      `UPDATE body_record SET ${setClause}, update_time = datetime('now', 'localtime') WHERE id = ? AND user_id = ?`,
      ...values, existing.id, userId
    );
    return existing.id;
  } else {
    const placeholders = CORE_FIELDS.map(() => '?').join(', ');
    const result = await run(
      `INSERT INTO body_record (record_date, user_id, ${CORE_FIELDS.join(', ')}) VALUES (?, ?, ${placeholders})`,
      record.record_date, userId, ...values
    );
    return result.lastInsertRowId as number;
  }
}

export async function deleteRecord(id: number): Promise<void> {
  await run('DELETE FROM body_record WHERE id = ? AND user_id = ?', id, uid());
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
  const fields: (keyof UserProfile)[] = ['height', 'weight', 'gender', 'age', 'target_weight'];
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

// ───────────────────── Goal ─────────────────────
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

// ───────────────────── 同步：全量快照导出/导入 ─────────────────────
interface SyncPayload {
  version: number;
  exportedAt: string;
  profile: UserProfile | null;
  records: BodyRecord[];
  goals: Goal[];
}

const SYNC_VERSION = 2;

export async function getAllRecordsForSync(): Promise<string> {
  const u = uid();
  const [profile, records, goals] = await Promise.all([
    getFirst<UserProfile>('SELECT * FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1', u),
    getAll<BodyRecord>('SELECT * FROM body_record WHERE user_id = ? ORDER BY id', u),
    getAll<Goal>('SELECT * FROM goal WHERE user_id = ? ORDER BY id', u),
  ]);
  const payload: SyncPayload = {
    version: SYNC_VERSION,
    exportedAt: new Date().toISOString(),
    profile, records, goals,
  };
  return JSON.stringify(payload);
}

export async function applySnapshot(json: string): Promise<{ records: number }> {
  const u = uid();
  const data = JSON.parse(json) as SyncPayload;

  await exec(`
    DELETE FROM body_record WHERE user_id = ${u};
    DELETE FROM goal WHERE user_id = ${u};
    DELETE FROM user_profile WHERE user_id = ${u};
  `);

  for (const r of data.records || []) {
    await run(
      `INSERT INTO body_record (user_id, record_date, weight, bmi, body_fat, waist, sleep_duration, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u, r.record_date, r.weight ?? null, r.bmi ?? null, r.body_fat ?? null,
      r.waist ?? null, r.sleep_duration ?? null, r.create_time ?? null, r.update_time ?? null
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
      `INSERT INTO user_profile (user_id, height, weight, gender, age, target_weight, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      u, data.profile.height ?? null, data.profile.weight ?? null, data.profile.gender ?? null,
      data.profile.age ?? null, data.profile.target_weight ?? null,
      data.profile.create_time ?? null, data.profile.update_time ?? null
    );
  }

  console.log('[sync] imported', data.records?.length ?? 0, 'records');
  return { records: data.records?.length ?? 0 };
}
