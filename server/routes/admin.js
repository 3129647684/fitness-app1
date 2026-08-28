// 管理员路由（用户管理 + 管理员登录）
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// 管理员登录
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) return res.status(401).json({ error: '用户名或密码错误' });

  if (!verifyPassword(password, admin.password_hash, admin.salt)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username, type: 'admin' }, config.JWT_SECRET, { expiresIn: config.ADMIN_JWT_EXPIRES_IN });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

// 获取用户列表
router.get('/users', authenticateAdmin, (req, res) => {
  const { page = 1, pageSize = 20, search = '' } = req.query;
  const db = getDb();
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE is_deleted = 0';
  const params = [];
  if (search) {
    whereClause += ' AND (username LIKE ? OR nickname LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const users = db.prepare(`SELECT id, username, nickname, created_at, updated_at FROM users ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, parseInt(pageSize, 10), offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

  res.json({ users, total, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) });
});

// 获取单个用户详情
router.get('/users/:id', authenticateAdmin, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, nickname, created_at, updated_at FROM users WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const recordCount = db.prepare('SELECT COUNT(*) as count FROM body_record WHERE user_id = ?').get(req.params.id).count;
  res.json({ ...user, recordCount });
});

// 更新用户信息
router.put('/users/:id', authenticateAdmin, (req, res) => {
  const { nickname } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  db.prepare('UPDATE users SET nickname = ?, updated_at = datetime("now") WHERE id = ?')
    .run(nickname || null, req.params.id);
  res.json({ message: '更新成功' });
});

// 重置用户密码
router.post('/users/:id/reset-password', authenticateAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '新密码至少6位' });

  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = datetime("now") WHERE id = ?')
    .run(hash, salt, req.params.id);
  res.json({ message: '密码重置成功' });
});

// 删除用户（软删除）
router.delete('/users/:id', authenticateAdmin, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  db.prepare('UPDATE users SET is_deleted = 1, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
  res.json({ message: '用户已删除' });
});

module.exports = router;
