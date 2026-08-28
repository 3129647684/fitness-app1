// 配置验证单元测试
// 运行: JWT_SECRET=test-secret-at-least-16-chars node --test tests/config.test.js

const { test } = require('node:test');
const assert = require('node:assert');

test('JWT_SECRET 从环境变量读取', () => {
  // 注意：此测试需要在设置 JWT_SECRET 环境变量后运行
  // config.js 在 require 时会验证 JWT_SECRET，未设置会 process.exit(1)
  const config = require('../config');
  assert.ok(config.JWT_SECRET, 'JWT_SECRET 应已设置');
  assert.ok(config.JWT_SECRET.length >= 16, 'JWT_SECRET 长度应 >= 16');
});

test('默认端口为 4000', () => {
  const config = require('../config');
  assert.strictEqual(config.PORT, 4000);
});

test('JWT 有效期配置正确', () => {
  const config = require('../config');
  assert.strictEqual(config.JWT_EXPIRES_IN, '30d');
  assert.strictEqual(config.ADMIN_JWT_EXPIRES_IN, '12h');
});

test('登录限流配置合理', () => {
  const config = require('../config');
  assert.strictEqual(config.LOGIN_RATE_LIMIT_MAX, 5);
  assert.strictEqual(config.LOGIN_RATE_LIMIT_WINDOW_MS, 60000);
});

test('generateRandomPassword 生成非空字符串', () => {
  const config = require('../config');
  const pwd = config.generateRandomPassword();
  assert.ok(typeof pwd === 'string');
  assert.ok(pwd.length > 0);
});
