import express from 'express';
import { getDb, saveDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

// Get all settings for user
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();

  const pointItems = db.all(
    'SELECT id, icon, name, points, sort_order FROM point_items WHERE user_id = $1 ORDER BY sort_order',
    [req.user.id]
  );

  const levelConfig = db.all(
    'SELECT level, food_required FROM level_config WHERE user_id = $1 ORDER BY level',
    [req.user.id]
  );

  const settingsRows = db.all('SELECT key, value FROM settings WHERE user_id = $1', [req.user.id]);
  const settings = {};
  for (const row of settingsRows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  res.json({
    pointItems,
    levelConfig: levelConfig.map(l => l.food_required),
    settings,
  });
});

// Save settings (point items and level config)
router.put('/', authenticateToken, (req, res) => {
  const { pointItems, levelConfig } = req.body;
  const db = getDb();

  if (pointItems && Array.isArray(pointItems)) {
    // Delete existing
    db.run('DELETE FROM point_items WHERE user_id = $1', [req.user.id]);

    for (let i = 0; i < pointItems.length; i++) {
      const item = pointItems[i];
      const id = item.id || generateId();
      db.run(
        'INSERT INTO point_items (id, user_id, icon, name, points, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, req.user.id, item.icon, item.name, item.points, i]
      );
    }
  }

  if (levelConfig && Array.isArray(levelConfig)) {
    db.run('DELETE FROM level_config WHERE user_id = $1', [req.user.id]);

    for (let i = 0; i < levelConfig.length; i++) {
      db.run(
        'INSERT INTO level_config (id, user_id, level, food_required) VALUES ($1, $2, $3, $4)',
        [generateId(), req.user.id, i + 1, levelConfig[i]]
      );
    }
  }

  saveDb();
  res.json({ message: 'Settings saved' });
});

// Save a generic setting
router.post('/setting', authenticateToken, (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }

  const db = getDb();
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

  const existing = db.get('SELECT * FROM settings WHERE user_id = $1 AND key = $2', [req.user.id, key]);
  if (existing) {
    db.run('UPDATE settings SET value = $1 WHERE user_id = $2 AND key = $3', [valueStr, req.user.id, key]);
  } else {
    db.run('INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)', [req.user.id, key, valueStr]);
  }

  saveDb();
  res.json({ message: 'Setting saved' });
});

export default router;