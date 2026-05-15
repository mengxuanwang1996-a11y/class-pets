import express from 'express';
import { getDb, saveDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

// Get all classes for user
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const classes = db.all('SELECT * FROM classes WHERE user_id = $1 ORDER BY created_at', [req.user.id]);
  res.json(classes);
});

// Create class
router.post('/', authenticateToken, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Class name required' });
  }

  const db = getDb();

  // Check for duplicate name
  const existing = db.get('SELECT id FROM classes WHERE user_id = $1 AND name = $2', [req.user.id, name.trim()]);
  if (existing) {
    return res.status(409).json({ error: 'Class name already exists' });
  }

  const id = generateId();
  db.run('INSERT INTO classes (id, user_id, name) VALUES ($1, $2, $3)', [id, req.user.id, name.trim()]);
  saveDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1', [id]);
  res.status(201).json(classItem);
});

// Update class name
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Class name required' });
  }

  db.run('UPDATE classes SET name = $1 WHERE id = $2 AND user_id = $3', [name.trim(), id, req.user.id]);
  saveDb();
  res.json({ ...classItem, name: name.trim() });
});

// Delete class
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  db.run('DELETE FROM classes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  saveDb();
  res.json({ message: 'Class deleted' });
});

export default router;