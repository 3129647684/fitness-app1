// 密码哈希工具单元测试
// 运行: node --test tests/password.test.js

const { test } = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword } = require('../utils/password');

test('hashPassword 返回 hash 和 salt', () => {
  const result = hashPassword('testpassword123');
  assert.ok(result.hash, '应该返回 hash');
  assert.ok(result.salt, '应该返回 salt');
  assert.strictEqual(typeof result.hash, 'string');
  assert.strictEqual(typeof result.salt, 'string');
  assert.ok(result.hash.length > 0, 'hash 不应为空');
  assert.ok(result.salt.length > 0, 'salt 不应为空');
});

test('相同密码每次哈希结果不同（随机 salt）', () => {
  const r1 = hashPassword('samepassword');
  const r2 = hashPassword('samepassword');
  assert.notStrictEqual(r1.hash, r2.hash, '不同 salt 应产生不同 hash');
  assert.notStrictEqual(r1.salt, r2.salt, 'salt 应随机');
});

test('verifyPassword 正确密码返回 true', () => {
  const { hash, salt } = hashPassword('mypassword');
  const result = verifyPassword('mypassword', hash, salt);
  assert.strictEqual(result, true);
});

test('verifyPassword 错误密码返回 false', () => {
  const { hash, salt } = hashPassword('correctpassword');
  const result = verifyPassword('wrongpassword', hash, salt);
  assert.strictEqual(result, false);
});

test('verifyPassword 空密码返回 false', () => {
  const { hash, salt } = hashPassword('nonempty');
  const result = verifyPassword('', hash, salt);
  assert.strictEqual(result, false);
});

test('verifyPassword 使用错误的 salt 返回 false', () => {
  const { hash } = hashPassword('testpass');
  const wrongSalt = 'a'.repeat(32);
  const result = verifyPassword('testpass', hash, wrongSalt);
  assert.strictEqual(result, false);
});

test('哈希和验证支持中文密码', () => {
  const { hash, salt } = hashPassword('密码测试123');
  assert.strictEqual(verifyPassword('密码测试123', hash, salt), true);
  assert.strictEqual(verifyPassword('错误密码', hash, salt), false);
});
