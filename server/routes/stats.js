// 统计路由（管理员后台数据统计 + CSV导出）
const express = require('express');
const { getDb } = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// 总览统计
router.get('/overview', authenticateAdmin, (req, res) => {
  const db = getDb();
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_deleted = 0").get().count;
  const totalRecords = db.prepare('SELECT COUNT(*) as count FROM body_record').get().count;
  const activeUsers7d = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM body_record WHERE record_date >= date('now', '-7 days')").get().count;
  const newUsers7d = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_deleted = 0 AND created_at >= datetime('now', '-7 days')").get().count;

  res.json({ totalUsers, totalRecords, activeUsers7d, newUsers7d });
});

// 用户增长趋势（近30天）
router.get('/growth', authenticateAdmin, (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM users
    WHERE is_deleted = 0 AND created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();
  res.json({ data });
});

// 记录统计（按指标）
router.get('/records', authenticateAdmin, (req, res) => {
  const db = getDb();
  const metrics = ['weight', 'bmi', 'body_fat', 'waist', 'sleep_duration'];
  const result = {};
  for (const m of metrics) {
    const row = db.prepare(`SELECT COUNT(*) as count, AVG(${m}) as avg, MIN(${m}) as min, MAX(${m}) as max FROM body_record WHERE ${m} IS NOT NULL`).get();
    result[m] = row;
  }
  res.json({ metrics: result });
});

// 导出用户数据 CSV
router.get('/export/users', authenticateAdmin, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, username, nickname, created_at FROM users WHERE is_deleted = 0 ORDER BY id').all();
  const header = 'id,username,nickname,created_at';
  const rows = users.map(u => `${u.id},"${u.username}","${u.nickname || ''}","${u.created_at}"`).join('\n');
  const csv = '\uFEFF' + header + '\n' + rows;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
  res.send(csv);
});

// 导出记录数据 CSV
router.get('/export/records', authenticateAdmin, (req, res) => {
  const db = getDb();
  const records = db.prepare('SELECT user_id, record_date, weight, bmi, body_fat, waist, sleep_duration FROM body_record ORDER BY user_id, record_date').all();
  const header = 'user_id,record_date,weight,bmi,body_fat,waist,sleep_duration';
  const rows = records.map(r => `${r.user_id},"${r.record_date}",${r.weight ?? ''},${r.bmi ?? ''},${r.body_fat ?? ''},${r.waist ?? ''},${r.sleep_duration ?? ''}`).join('\n');
  const csv = '\uFEFF' + header + '\n' + rows;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=records.csv');
  res.send(csv);
});

module.exports = router;
