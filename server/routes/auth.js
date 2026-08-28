// 认证路由（用户注册/登录/改密/销户）
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 3) return res.status(400).json({ error: '用户名至少3位' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ? AND is_deleted = 0').get(username);
  if (existing) return res.status(409).json({ error: '用户名已存在' });

  const { hash, salt } = hashPassword(password);
  const result = db.prepare('INSERT INTO users (username, password_hash, salt, nickname) VALUES (?, ?, ?, ?)')
    .run(username, hash, salt, nickname || null);

  const user = { id: result.lastInsertRowid, username, nickname: nickname || null };
  const token = jwt.sign({ ...user, type: 'user' }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  res.json({ token, user });
});

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_deleted = 0').get(username);
  if (!user) return res.status(401).json({ error: '用户名或密码错误' });

  if (!verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const safeUser = { id: user.id, username: user.username, nickname: user.nickname };
  const token = jwt.sign({ ...safeUser, type: 'user' }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  res.json({ token, user: safeUser });
});

// 修改密码
router.post('/change-password', authenticateUser, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '旧密码和新密码不能为空' });
  if (newPassword.length < 6) return res.status(400).json({ error: '新密码至少6位' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  if (!verifyPassword(oldPassword, user.password_hash, user.salt)) {
    return res.status(401).json({ error: '旧密码错误' });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = datetime("now") WHERE id = ?')
    .run(hash, salt, req.user.id);
  res.json({ message: '密码修改成功' });
});

// 注销账号
router.post('/delete-account', authenticateUser, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入密码确认' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  if (!verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(401).json({ error: '密码错误' });
  }

  // 软删除
  db.prepare('UPDATE users SET is_deleted = 1, updated_at = datetime("now") WHERE id = ?').run(req.user.id);
  res.json({ message: '账号已注销' });
});

module.exports = router;
