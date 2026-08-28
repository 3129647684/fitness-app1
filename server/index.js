// 服务端入口（安全加固版）
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');

// 初始化数据库
initDb();

const app = express();

// ── 安全中间件 ──

// CORS 白名单（生产环境建议通过 CORS_ORIGIN 环境变量限制）
const corsOptions = {
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// JSON body 解析（限制大小防止 DoS）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 登录接口限流：每分钟最多 5 次/IP
const loginLimiter = rateLimit({
  windowMs: config.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: config.LOGIN_RATE_LIMIT_MAX,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// ── 静态文件服务（条件挂载，目录不存在时不注册） ──
if (fs.existsSync(config.GIF_DIR)) {
  app.use('/gifs', express.static(config.GIF_DIR, { maxAge: '7d', immutable: true }));
  console.log('[static] /gifs 已挂载:', config.GIF_DIR);
}
if (fs.existsSync(config.VIDEO_DIR)) {
  app.use('/videos', express.static(config.VIDEO_DIR, { maxAge: '7d', immutable: true }));
  console.log('[static] /videos 已挂载:', config.VIDEO_DIR);
}

// ── 健康检查 ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 路由挂载 ──
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/stats', statsRoutes);

// ── 404 处理 ──
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// ── 全局错误处理 ──
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '请求体过大' });
  }
  res.status(500).json({ error: '服务器内部错误' });
});

// ── 启动服务 ──
const server = app.listen(config.PORT, () => {
  console.log(`[server] 健身数据服务已启动: http://localhost:${config.PORT}`);
  console.log(`[server] CORS 策略: ${config.CORS_ORIGIN}`);
  console.log(`[server] 登录限流: ${config.LOGIN_RATE_LIMIT_MAX}次/${config.LOGIN_RATE_LIMIT_WINDOW_MS / 1000}秒`);
});

// 优雅关闭
const shutdown = (signal) => {
  console.log(`[server] 收到 ${signal}，正在关闭...`);
  server.close(() => {
    console.log('[server] 已关闭');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
