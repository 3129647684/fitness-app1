import type { ExecResult } from './dbDriver.interface';

export type MigrationExecutor = <T = any>(sql: string, params?: any[]) => Promise<ExecResult<T>>;

export const BODY_RECORD_SCHEMA = `
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

  const ensureColumn = async (table: string, column: string, type: string) => {
    const cols = await query<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!cols.rows.some((c) => c.name === column)) {
      await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  };
  await ensureColumn('user_profile', 'user_id', 'INTEGER');
  await ensureColumn('body_record', 'user_id', 'INTEGER');
  await ensureColumn('record_tag', 'user_id', 'INTEGER');
  await ensureColumn('custom_tag', 'user_id', 'INTEGER');
  await ensureColumn('record_image', 'user_id', 'INTEGER');
  await ensureColumn('goal', 'user_id', 'INTEGER');
  await ensureColumn('nutrition_goal', 'user_id', 'INTEGER');

  await query(`
    CREATE INDEX IF NOT EXISTS idx_body_record_user_date ON body_record(user_id, record_date);
  `);

  const idxList = await query<{ name: string; sql: string | null }>('PRAGMA index_list(body_record)');
  const hasUniqueDate = idxList.rows.some((i) => (i.sql || '').toUpperCase().includes('UNIQUE'));
  if (hasUniqueDate) {
    await rebuildBodyRecordWithoutUnique(query);
  }

  await migrateDB(query);
}

async function rebuildBodyRecordWithoutUnique(query: MigrationExecutor): Promise<void> {
  const copyCols =
    'id, record_date, weight, body_fat, muscle_mass, water_rate, bmr, bmi, chest, waist, hip, upper_arm, thigh, calf, ' +
    'neck, heart_rate, steps, water_intake, body_temperature, mood, sleep_duration, sleep_score, is_menstrual, menstrual_day, ' +
    'exercise_type, exercise_duration, exercise_note, body_status, food_list, sport_list, sport_json, sport_total_cal, remark, ' +
    'create_time, update_time';
  await query(`
    ALTER TABLE body_record RENAME TO body_record_old;
    ${BODY_RECORD_SCHEMA}
    INSERT INTO body_record (${copyCols}) SELECT ${copyCols} FROM body_record_old;
    DROP TABLE body_record_old;
  `);
  console.log('[db] body_record rebuilt (removed UNIQUE on record_date)');
}

async function migrateDB(query: MigrationExecutor): Promise<void> {
  const bodyCols = await query<{ name: string }>('PRAGMA table_info(body_record)');
  const existingBody = new Set(bodyCols.rows.map((c) => c.name));

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
      await query(`ALTER TABLE body_record ADD COLUMN ${col.name} ${col.type}`);
    }
  }

  const profileCols = await query<{ name: string }>('PRAGMA table_info(user_profile)');
  const existingProfile = new Set(profileCols.rows.map((c) => c.name));
  if (!existingProfile.has('weight')) {
    await query('ALTER TABLE user_profile ADD COLUMN weight REAL');
  }
}
