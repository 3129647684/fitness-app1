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
// 生产部署时务必通过环境变量注入一个随机密钥（如 node -e "console.log(crypto.randomBytes(32).toString('hex'))"）
const JWT_SECRET = process.env.JWT_SECRET || 'bodydata-dev-secret-change-me';
const TOKEN_TTL = '30d';
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
  return jwt.sign({ uid: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// ───────────────────────────── 中间件 ─────────────────────────────
const app = express();
app.use(express.json({ limit: '10mb' }));
// 允许 App（原生端无 CORS 限制；Web 端开发预览需要）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ───────────────────────────── 认证 ─────────────────────────────
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
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row || !verifyPassword(password, row.salt, row.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const user = { id: row.id, username: row.username, nickname: row.nickname };
  const token = signToken(user);
  res.json({ token, user });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const row = db.prepare('SELECT id, username, nickname, created_at FROM users WHERE id = ?').get(req.user.uid);
  if (!row) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: row });
});

// ───────────────────────────── 数据同步 ─────────────────────────────
// 返回云端最新快照；payload 为 App 端导出的全量 JSON 字符串
app.get('/api/sync', authRequired, (req, res) => {
  const row = db.prepare('SELECT payload, updated_at FROM sync_data WHERE user_id = ?').get(req.user.uid);
  if (!row) return res.json({ data: null, updatedAt: null });
  res.json({ data: row.payload, updatedAt: row.updated_at });
});

// 覆盖式保存：App 端推入全量快照（10 人规模、单人数据量小，全量最稳）
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

// ───────────────────────────── 静态动图 ─────────────────────────────
if (fs.existsSync(GIF_DIR)) {
  app.use('/videos', express.static(GIF_DIR, { maxAge: '365d', immutable: true }));
}

// 统一错误兜底
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