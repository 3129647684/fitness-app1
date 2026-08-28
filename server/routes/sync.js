// 云同步路由（全量快照 push/pull）
const express = require('express');
const { getDb } = require('../db');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// 上传快照
router.post('/push', authenticateUser, (req, res) => {
  const { payload } = req.body;
  if (!payload || typeof payload !== 'string') {
    return res.status(400).json({ error: 'payload 不能为空' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT user_id FROM sync_data WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare('UPDATE sync_data SET payload = ?, updated_at = datetime("now") WHERE user_id = ?')
      .run(payload, req.user.id);
  } else {
    db.prepare('INSERT INTO sync_data (user_id, payload) VALUES (?, ?)').run(req.user.id, payload);
  }

  res.json({ message: '同步成功', updatedAt: new Date().toISOString() });
});

// 拉取快照
router.get('/pull', authenticateUser, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT payload, updated_at FROM sync_data WHERE user_id = ?').get(req.user.id);

  if (!row) {
    return res.json({ payload: null, updatedAt: null });
  }

  res.json({ payload: row.payload, updatedAt: row.updated_at });
});

module.exports = router;
