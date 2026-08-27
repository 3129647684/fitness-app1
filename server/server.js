// BodyDataApp 轻量自建服务：多用户认证 + 数据同步 + 动作动图静态资源
// 技术栈：Node >= 22.5（内置 node:sqlite）+ Express + JWT
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ───────────────────────────── 全局配置 ─────────────────────────────
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'bodydata-dev-secret-change-me';
const TOKEN_TTL = '30d';
const ADMIN_TOKEN_TTL = '12h';
const GIF_DIR = path.resolve(__dirname, '..', 'scripts', 'videos');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// ───────────────────────────── 数据库 ─────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nickname TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sync_data (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// ── 增量：补充 users 表字段（last_login_at、deleted_at） ──
try {
  db.prepare('ALTER TABLE users ADD COLUMN last_login_at TEXT').run();
} catch (_) {}
try {
  db.prepare('ALTER TABLE users ADD COLUMN deleted_at TEXT').run();
} catch (_) {}

// ── 增量：创建业务表（body_records / record_tags / food_items / sport_items 等） ──
db.exec(`
  CREATE TABLE IF NOT EXISTS body_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date TEXT NOT NULL,
    weight REAL,
    height REAL,
    bmi REAL,
    body_fat REAL,
    muscle_mass REAL,
    waist REAL,
    sleep_hours REAL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_body_records_user_date ON body_records(user_id, record_date DESC);

  CREATE TABLE IF NOT EXISTS record_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_id INTEGER REFERENCES body_records(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_record_tags_user ON record_tags(user_id);
  CREATE INDEX IF NOT EXISTS idx_record_tags_name ON record_tags(tag_name);

  CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_id INTEGER REFERENCES body_records(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    serving_size TEXT,
    meal_type TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sport_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_id INTEGER REFERENCES body_records(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_min INTEGER,
    calories_burned REAL,
    intensity TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS water_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date TEXT NOT NULL,
    amount_ml REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sleep_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date TEXT NOT NULL,
    hours REAL,
    quality TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── 增量：首次启动插入默认管理员 ──
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
if (adminCount === 0) {
  const defaultAdminUser = 'admin';
  const defaultAdminPass = 'admin123';
  const { salt, hash } = hashPassword(defaultAdminPass);
  db.prepare('INSERT INTO admins (username, password_hash, salt, role) VALUES (?, ?, ?, ?)')
    .run(defaultAdminUser, hash, salt, 'admin');
  console.log('[admin] 默认管理员已创建: username=admin, password=admin123');
}

// ───────────────────────────── 工具函数 ─────────────────────────────
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signToken(user) {
  return jwt.sign(
    { uid: user.id, username: user.username, aud: 'user' },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function signAdminToken(admin) {
  return jwt.sign(
    { admin_id: admin.id, username: admin.username, role: admin.role, aud: 'admin' },
    JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_TTL }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.aud !== 'user') return res.status(401).json({ error: '登录已过期，请重新登录' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function adminRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.aud !== 'admin') return res.status(403).json({ error: '权限不足' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function getBMICategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
}

function csvEscape(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function sendCSV(res, filename, headers, rows) {
  const BOM = '\uFEFF';
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(row[h])).join(','));
  }
  const csv = BOM + lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// ───────────────────────────── 中间件 ─────────────────────────────
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ───────────────────────────── 认证（原有） ─────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const nickname = String(req.body?.nickname || '').trim();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: '用户名需为 3-20 位字母/数字/下划线' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '用户名已被注册' });
  }

  const { salt, hash } = hashPassword(password);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, salt, nickname) VALUES (?, ?, ?, ?)')
    .run(username, hash, salt, nickname || null);
  const user = { id: Number(info.lastInsertRowid), username, nickname: nickname || null };
  const token = signToken(user);
  res.json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const row = db.prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL').get(username);
  if (!row || !verifyPassword(password, row.salt, row.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(row.id);
  const user = { id: row.id, username: row.username, nickname: row.nickname };
  const token = signToken(user);
  res.json({ token, user });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const row = db.prepare('SELECT id, username, nickname, created_at FROM users WHERE id = ? AND deleted_at IS NULL').get(req.user.uid);
  if (!row) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: row });
});

// ───────────────────────────── 数据同步（原有） ─────────────────────────────
app.get('/api/sync', authRequired, (req, res) => {
  const row = db.prepare('SELECT payload, updated_at FROM sync_data WHERE user_id = ?').get(req.user.uid);
  if (!row) return res.json({ data: null, updatedAt: null });
  res.json({ data: row.payload, updatedAt: row.updated_at });
});

app.post('/api/sync', authRequired, (req, res) => {
  const payload = req.body?.data;
  if (typeof payload !== 'string' || payload.length === 0) {
    return res.status(400).json({ error: '缺少数据' });
  }
  if (Buffer.byteLength(payload, 'utf8') > 8 * 1024 * 1024) {
    return res.status(413).json({ error: '数据过大' });
  }
  db.prepare(`
    INSERT INTO sync_data (user_id, payload, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).run(req.user.uid, payload);
  res.json({ ok: true });
});

// 兼容别名：/api/sync/pull 和 /api/sync/push
app.get('/api/sync/pull', authRequired, (req, res) => {
  const row = db.prepare('SELECT payload, updated_at FROM sync_data WHERE user_id = ?').get(req.user.uid);
  if (!row) return res.json({ data: null, updatedAt: null });
  res.json({ data: row.payload, updatedAt: row.updated_at });
});

app.post('/api/sync/push', authRequired, (req, res) => {
  const payload = req.body?.data;
  if (typeof payload !== 'string' || payload.length === 0) {
    return res.status(400).json({ error: '缺少数据' });
  }
  if (Buffer.byteLength(payload, 'utf8') > 8 * 1024 * 1024) {
    return res.status(413).json({ error: '数据过大' });
  }
  db.prepare(`
    INSERT INTO sync_data (user_id, payload, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).run(req.user.uid, payload);
  res.json({ ok: true });
});

// ───────────────────────────── 静态动图（原有） ─────────────────────────────
if (fs.existsSync(GIF_DIR)) {
  app.use('/videos', express.static(GIF_DIR, { maxAge: '365d', immutable: true }));
}
app.use('/gifs', express.static(GIF_DIR, { maxAge: '365d', immutable: true }));

// ═══════════════════════════════════════════════════════════════════
// 增量：管理员体系 API
// ═══════════════════════════════════════════════════════════════════

// ── 管理员登录 ──
app.post('/api/admin/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!row || !verifyPassword(password, row.salt, row.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const admin = { id: row.id, username: row.username, role: row.role };
  const token = signAdminToken(admin);
  res.json({ token, admin });
});

// ── 当前管理员信息 ──
app.get('/api/admin/auth/me', adminRequired, (req, res) => {
  const row = db.prepare('SELECT id, username, role, created_at FROM admins WHERE id = ?').get(req.admin.admin_id);
  if (!row) return res.status(404).json({ error: '管理员不存在' });
  res.json({ admin: row });
});

// ── 用户分页列表 ──
app.get('/api/admin/users', adminRequired, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  const search = String(req.query.search || '').trim();
  const offset = (page - 1) * pageSize;

  let whereSql = 'WHERE u.deleted_at IS NULL';
  const params = [];
  if (search) {
    whereSql += ' AND (u.username LIKE ? OR u.nickname LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const totalRow = db.prepare(`
    SELECT COUNT(*) AS c FROM users u ${whereSql}
  `).get(...params);

  const list = db.prepare(`
    SELECT
      u.id, u.username, u.nickname, u.created_at, u.last_login_at,
      (SELECT COUNT(*) FROM body_records br WHERE br.user_id = u.id) AS record_count
    FROM users u
    ${whereSql}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  res.json({
    total: totalRow.c,
    page,
    pageSize,
    list: list.map(r => ({
      id: r.id,
      username: r.username,
      nickname: r.nickname,
      created_at: r.created_at,
      last_login_at: r.last_login_at,
      record_count: r.record_count
    }))
  });
});

// ── 单个用户详情 ──
app.get('/api/admin/users/:id', adminRequired, (req, res) => {
  const userId = parseInt(req.params.id);
  if (!userId) return res.status(400).json({ error: '无效用户ID' });

  const user = db.prepare(`
    SELECT id, username, nickname, created_at, last_login_at
    FROM users WHERE id = ? AND deleted_at IS NULL
  `).get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS totalRecords,
      MIN(record_date) AS firstRecordDate,
      MAX(record_date) AS lastRecordDate
    FROM body_records WHERE user_id = ?
  `).get(userId);

  const latest = db.prepare(`
    SELECT weight, bmi, body_fat, muscle_mass, waist, sleep_hours
    FROM body_records
    WHERE user_id = ?
    ORDER BY record_date DESC, id DESC
    LIMIT 1
  `).get(userId);

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    totalRecords: stats.totalRecords,
    firstRecordDate: stats.firstRecordDate,
    lastRecordDate: stats.lastRecordDate,
    latestWeight: latest?.weight ?? null,
    latestBMI: latest?.bmi ?? null,
    latestBodyFat: latest?.body_fat ?? null,
    latestMuscleMass: latest?.muscle_mass ?? null,
    waist: latest?.waist ?? null,
    sleepHours: latest?.sleep_hours ?? null
  });
});

// ── 软删除用户 ──
app.delete('/api/admin/users/:id', adminRequired, (req, res) => {
  const userId = parseInt(req.params.id);
  if (!userId) return res.status(400).json({ error: '无效用户ID' });

  const user = db.prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  db.prepare("UPDATE users SET deleted_at = datetime('now') WHERE id = ?").run(userId);
  res.json({ ok: true });
});

// ── 重置用户密码 ──
app.post('/api/admin/users/:id/reset_password', adminRequired, (req, res) => {
  const userId = parseInt(req.params.id);
  const password = String(req.body?.password || '');
  if (!userId) return res.status(400).json({ error: '无效用户ID' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少 6 位' });

  const user = db.prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const { salt, hash } = hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, userId);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════
// 增量：5 组统计聚合 API
// ═══════════════════════════════════════════════════════════════════

// ── 概览统计 ──
app.get('/api/admin/stats/overview', adminRequired, (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE deleted_at IS NULL").get().c;

  const activeUsers7d = db.prepare(`
    SELECT COUNT(DISTINCT user_id) AS c
    FROM body_records
    WHERE date(record_date) >= date('now', '-7 days')
      AND user_id IN (SELECT id FROM users WHERE deleted_at IS NULL)
  `).get().c;

  const totalRecords = db.prepare(`
    SELECT COUNT(*) AS c
    FROM body_records br
    INNER JOIN users u ON u.id = br.user_id
    WHERE u.deleted_at IS NULL
  `).get().c;

  const recordsLast30d = db.prepare(`
    SELECT COUNT(*) AS c
    FROM body_records br
    INNER JOIN users u ON u.id = br.user_id
    WHERE u.deleted_at IS NULL AND date(br.record_date) >= date('now', '-30 days')
  `).get().c;

  // 每个用户取最新一条记录后算均值
  const latestAvg = db.prepare(`
    SELECT
      AVG(t.weight) AS avgWeight,
      AVG(t.bmi) AS avgBMI,
      AVG(t.body_fat) AS avgBodyFat,
      AVG(t.muscle_mass) AS avgMuscleMass
    FROM (
      SELECT br.weight, br.bmi, br.body_fat, br.muscle_mass
      FROM body_records br
      INNER JOIN (
        SELECT user_id, MAX(record_date) AS max_date
        FROM body_records
        WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NULL)
        GROUP BY user_id
      ) mx ON mx.user_id = br.user_id AND mx.max_date = br.record_date
      INNER JOIN users u ON u.id = br.user_id
      WHERE u.deleted_at IS NULL
    ) t
  `).get();

  res.json({
    totalUsers,
    activeUsers7d,
    totalRecords,
    recordsLast30d,
    avgWeight: latestAvg.avgWeight ?? null,
    avgBMI: latestAvg.avgBMI ?? null,
    avgBodyFat: latestAvg.avgBodyFat ?? null,
    avgMuscleMass: latestAvg.avgMuscleMass ?? null
  });
});

// ── 核心指标分布 ──
app.get('/api/admin/stats/core_metrics_distribution', adminRequired, (req, res) => {
  // 每个用户取最新一条记录
  const latestStmt = db.prepare(`
    SELECT br.weight, br.bmi, br.body_fat
    FROM body_records br
    INNER JOIN (
      SELECT user_id, MAX(record_date) AS max_date
      FROM body_records
      WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NULL)
      GROUP BY user_id
    ) mx ON mx.user_id = br.user_id AND mx.max_date = br.record_date
    INNER JOIN users u ON u.id = br.user_id
    WHERE u.deleted_at IS NULL
  `);
  const rows = latestStmt.all();

  const bmiBuckets = [
    { bucket: '偏瘦', min: -Infinity, max: 18.5, count: 0 },
    { bucket: '正常', min: 18.5, max: 24, count: 0 },
    { bucket: '超重', min: 24, max: 28, count: 0 },
    { bucket: '肥胖', min: 28, max: Infinity, count: 0 }
  ];

  const weightBuckets = [
    { bucket: '<50kg', min: -Infinity, max: 50, count: 0 },
    { bucket: '50-60kg', min: 50, max: 60, count: 0 },
    { bucket: '60-70kg', min: 60, max: 70, count: 0 },
    { bucket: '70-80kg', min: 70, max: 80, count: 0 },
    { bucket: '>80kg', min: 80, max: Infinity, count: 0 }
  ];

  const bodyFatBuckets = [
    { bucket: '<15%', min: -Infinity, max: 15, count: 0 },
    { bucket: '15-20%', min: 15, max: 20, count: 0 },
    { bucket: '20-25%', min: 20, max: 25, count: 0 },
    { bucket: '25-30%', min: 25, max: 30, count: 0 },
    { bucket: '>30%', min: 30, max: Infinity, count: 0 }
  ];

  for (const r of rows) {
    if (r.bmi != null) {
      for (const b of bmiBuckets) {
        if (r.bmi >= b.min && r.bmi < b.max) { b.count++; break; }
      }
    }
    if (r.weight != null) {
      for (const b of weightBuckets) {
        if (r.weight >= b.min && r.weight < b.max) { b.count++; break; }
      }
    }
    if (r.body_fat != null) {
      for (const b of bodyFatBuckets) {
        if (r.body_fat >= b.min && r.body_fat < b.max) { b.count++; break; }
      }
    }
  }

  res.json({
    bmiDistribution: bmiBuckets.map(b => ({ bucket: b.bucket, count: b.count })),
    weightDistribution: weightBuckets.map(b => ({ bucket: b.bucket, count: b.count })),
    bodyFatDistribution: bodyFatBuckets.map(b => ({ bucket: b.bucket, count: b.count }))
  });
});

// ── 活跃天数分布 ──
app.get('/api/admin/stats/active_days_distribution', adminRequired, (req, res) => {
  const userActiveDays = db.prepare(`
    SELECT br.user_id, COUNT(DISTINCT date(br.record_date)) AS active_days
    FROM body_records br
    INNER JOIN users u ON u.id = br.user_id
    WHERE u.deleted_at IS NULL
      AND date(br.record_date) >= date('now', '-30 days')
    GROUP BY br.user_id
  `).all();

  const usersNoRecords = db.prepare(`
    SELECT COUNT(*) AS c FROM users u
    WHERE u.deleted_at IS NULL
      AND u.id NOT IN (SELECT DISTINCT br.user_id FROM body_records br WHERE date(br.record_date) >= date('now', '-30 days'))
  `).get().c;

  const buckets = [
    { bucket: '0-1天', min: 0, max: 2, count: 0 },
    { bucket: '2-4天', min: 2, max: 5, count: 0 },
    { bucket: '5-9天', min: 5, max: 10, count: 0 },
    { bucket: '10-19天', min: 10, max: 20, count: 0 },
    { bucket: '20-30天', min: 20, max: 31, count: 0 }
  ];

  buckets[0].count = usersNoRecords;
  for (const r of userActiveDays) {
    const d = r.active_days;
    if (d <= 1) buckets[0].count++;
    else if (d <= 4) buckets[1].count++;
    else if (d <= 9) buckets[2].count++;
    else if (d <= 19) buckets[3].count++;
    else buckets[4].count++;
  }

  res.json({
    distribution: buckets.map(b => ({ bucket: b.bucket, count: b.count }))
  });
});

// ── 记录趋势 ──
app.get('/api/admin/stats/records_trend', adminRequired, (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));

  const rows = db.prepare(`
    SELECT
      date(br.record_date) AS date,
      COUNT(*) AS recordCount,
      COUNT(DISTINCT br.user_id) AS uniqueUsers
    FROM body_records br
    INNER JOIN users u ON u.id = br.user_id
    WHERE u.deleted_at IS NULL
      AND date(br.record_date) >= date('now', ?)
    GROUP BY date(br.record_date)
    ORDER BY date ASC
  `).all(`-${days - 1} days`);

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = rows.find(r => r.date === dateStr);
    result.push({
      date: dateStr,
      recordCount: found?.recordCount ?? 0,
      uniqueUsers: found?.uniqueUsers ?? 0
    });
  }

  res.json(result);
});

// ── 热门标签 Top N ──
app.get('/api/admin/stats/tags_top', adminRequired, (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

  const rows = db.prepare(`
    SELECT rt.tag_name AS tag_name, COUNT(*) AS count
    FROM record_tags rt
    INNER JOIN users u ON u.id = rt.user_id
    WHERE u.deleted_at IS NULL
    GROUP BY rt.tag_name
    ORDER BY count DESC
    LIMIT ?
  `).all(limit);

  res.json(rows.map(r => ({ tag_name: r.tag_name, count: r.count })));
});

// ═══════════════════════════════════════════════════════════════════
// 增量：全量数据导出 API
// ═══════════════════════════════════════════════════════════════════

// ── 导出用户 CSV ──
app.get('/api/admin/export/users.csv', adminRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT id, username, nickname, created_at, last_login_at, deleted_at
    FROM users
    ORDER BY id ASC
  `).all();

  const headers = ['id', 'username', 'nickname', 'created_at', 'last_login_at', 'deleted_at', 'status'];
  const exportRows = rows.map(r => ({
    id: r.id,
    username: r.username,
    nickname: r.nickname,
    created_at: r.created_at,
    last_login_at: r.last_login_at,
    deleted_at: r.deleted_at,
    status: r.deleted_at ? '已删除' : '正常'
  }));
  headers[headers.length - 1] = 'status';

  sendCSV(res, 'users.csv', headers, exportRows);
});

// ── 导出记录 CSV ──
app.get('/api/admin/export/records.csv', adminRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT
      br.id, br.user_id, u.username, u.nickname,
      br.record_date, br.weight, br.height, br.bmi,
      br.body_fat, br.muscle_mass, br.waist, br.sleep_hours,
      br.note, br.created_at
    FROM body_records br
    INNER JOIN users u ON u.id = br.user_id
    ORDER BY br.id ASC
  `).all();

  const headers = [
    'id', 'user_id', 'username', 'nickname',
    'record_date', 'weight', 'height', 'bmi',
    'body_fat', 'muscle_mass', 'waist', 'sleep_hours',
    'note', 'created_at'
  ];

  sendCSV(res, 'records.csv', headers, rows);
});

// ───────────────────────────── 统一错误兜底 ─────────────────────────────
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '请求体 JSON 格式错误' });
  }
  console.error('[server]', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[bodydata-server] listening on http://0.0.0.0:${PORT}`);
  console.log(`[bodydata-server] videos: ${GIF_DIR} (${fs.existsSync(GIF_DIR) ? 'ok' : 'missing'})`);
});
