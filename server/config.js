// 服务端配置（安全加固版）
// 所有敏感配置必须通过环境变量注入，禁止硬编码兜底

const path = require('path');
const crypto = require('crypto');

// JWT 密钥：强制环境变量，未设置则启动失败
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('[FATAL] JWT_SECRET 环境变量未设置或长度不足16位，服务启动终止');
  console.error('[FATAL] 请设置: export JWT_SECRET=$(openssl rand -hex 32)');
  process.exit(1);
}

// 管理员账号：从环境变量读取，未设置则首次启动生成随机密码
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null; // null 表示首次启动生成随机密码

// 生成随机密码（首次启动用）
function generateRandomPassword() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  JWT_SECRET,
  JWT_EXPIRES_IN: '30d',
  ADMIN_JWT_EXPIRES_IN: '12h',
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  generateRandomPassword,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'fitness.db'),
  DATA_DIR: path.join(__dirname, '..', 'data'),
  GIF_DIR: path.join(__dirname, '..', 'public', 'gifs'),
  VIDEO_DIR: path.join(__dirname, '..', 'public', 'videos'),
  // 登录限流配置
  LOGIN_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1分钟
  LOGIN_RATE_LIMIT_MAX: 5, // 每分钟最多5次
};
