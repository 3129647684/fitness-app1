// 云同步模块：全量 JSON 快照导出 / 导入 / 推送 / 拉取
// 10 人规模且单用户数据量小（日均 ≤1 条记录），全量同步最简单可靠
import * as SQLite from 'expo-sqlite';
import { getDB, getActiveUser } from './db';
import { api } from '@/api/client';
import type { UserProfile, NutritionGoal, BodyRecord, CustomTag, RecordTag, Goal } from './types';

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

const version = 1;

function needUid(): number {
  const u = getActiveUser();
  if (u == null) throw new Error('未登录');
  return u;
}

// ───────────────────── 导出 ─────────────────────
export async function exportAllData(): Promise<string> {
  const db = await getDB();
  const u = needUid();
  const [profile, nutritionGoal, records, tags, recordTags, goals] = await Promise.all([
    db.getFirstAsync<UserProfile>('SELECT * FROM user_profile WHERE user_id = ? ORDER BY id LIMIT 1', u),
    db.getFirstAsync<NutritionGoal>('SELECT * FROM nutrition_goal WHERE user_id = ? ORDER BY id LIMIT 1', u),
    db.getAllAsync<BodyRecord>('SELECT * FROM body_record WHERE user_id = ? ORDER BY id', u),
    db.getAllAsync<CustomTag>('SELECT * FROM custom_tag WHERE user_id = ? ORDER BY id', u),
    db.getAllAsync<RecordTag>('SELECT * FROM record_tag WHERE user_id = ? ORDER BY id', u),
    db.getAllAsync<Goal>('SELECT * FROM goal WHERE user_id = ? ORDER BY id', u),
  ]);
  const payload: SyncPayload = { version, exportedAt: new Date().toISOString(), profile, nutritionGoal, records, tags, recordTags, goals };
  return JSON.stringify(payload);
}

// ───────────────────── 导入（替换当前用户全部数据） ─────────────────────
export async function importAllData(json: string): Promise<{ records: number }> {
  const db = await getDB();
  const u = needUid();
  const data = JSON.parse(json) as SyncPayload;

  // 1. 清空当前用户数据
  await db.execAsync(`
    DELETE FROM body_record WHERE user_id = ${u};
    DELETE FROM record_tag WHERE user_id = ${u};
    DELETE FROM custom_tag WHERE user_id = ${u};
    DELETE FROM record_image WHERE user_id = ${u};
    DELETE FROM goal WHERE user_id = ${u};
    DELETE FROM user_profile WHERE user_id = ${u};
    DELETE FROM nutrition_goal WHERE user_id = ${u};
  `);

  // 2. 写回（先记录，再关联表）
  const idMap = new Map<number, number>();
  for (const r of data.records || []) {
    const res = await db.runAsync(
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
    await db.runAsync(
      'INSERT OR IGNORE INTO record_tag (record_id, user_id, tag_name) VALUES (?, ?, ?)',
      newRecordId, u, t.tag_name
    );
  }
  for (const t of data.tags || []) {
    await db.runAsync(
      'INSERT OR IGNORE INTO custom_tag (tag_name, user_id, color) VALUES (?, ?, ?)',
      t.tag_name, u, t.color ?? null
    );
  }
  for (const g of data.goals || []) {
    await db.runAsync(
      `INSERT INTO goal (user_id, goal_type, target_value, start_value, start_date, target_date, is_active, create_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      u, g.goal_type, g.target_value, g.start_value ?? null, g.start_date ?? null,
      g.target_date ?? null, g.is_active ?? 1, g.create_time ?? null
    );
  }
  if (data.profile) {
    await db.runAsync(
      `INSERT INTO user_profile (user_id, height, weight, gender, age, target_weight, target_waist, create_time, update_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u, data.profile.height ?? null, data.profile.weight ?? null, data.profile.gender ?? null,
      data.profile.age ?? null, data.profile.target_weight ?? null, data.profile.target_waist ?? null,
      data.profile.create_time ?? null, data.profile.update_time ?? null
    );
  }
  if (data.nutritionGoal) {
    await db.runAsync(
      `INSERT INTO nutrition_goal (user_id, daily_calorie, daily_protein, daily_carb, daily_fat)
       VALUES (?, ?, ?, ?, ?)`,
      u, data.nutritionGoal.daily_calorie ?? null, data.nutritionGoal.daily_protein ?? null,
      data.nutritionGoal.daily_carb ?? null, data.nutritionGoal.daily_fat ?? null
    );
  }

  console.log('[sync] imported', data.records?.length ?? 0, 'records');
  return { records: data.records?.length ?? 0 };
}

// ───────────────────── 与云端交互 ─────────────────────
// 拉取：用云端快照覆盖本地（换机/恢复场景）
export async function syncPull(): Promise<number> {
  const res = await api.fetchSync();
  if (!res.data) return 0;
  return (await importAllData(res.data)).records;
}

// 推送：将本地全量快照上传云端（每次保存操作后调用）
export async function syncPush(): Promise<void> {
  const json = await exportAllData();
  await api.pushSync(json);
}