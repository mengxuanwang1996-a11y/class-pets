import express from 'express';
import { getDb, saveDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

// Get store items
router.get('/items', authenticateToken, (req, res) => {
  const db = getDb();
  const items = db.all(
    'SELECT id, name, icon, badges_required, stock FROM store_items WHERE user_id = $1 ORDER BY badges_required',
    [req.user.id]
  );
  res.json(items);
});

// Create store item
router.post('/items', authenticateToken, (req, res) => {
  const { name, icon, badgesRequired, stock } = req.body;

  if (!name || !icon || badgesRequired === undefined) {
    return res.status(400).json({ error: 'name, icon, badgesRequired required' });
  }

  const db = getDb();
  const id = generateId();
  db.run(
    'INSERT INTO store_items (id, user_id, name, icon, badges_required, stock) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, req.user.id, name.trim(), icon, badgesRequired, stock !== undefined ? stock : -1]
  );
  saveDb();

  const item = db.get('SELECT * FROM store_items WHERE id = $1', [id]);
  res.status(201).json(item);
});

// Update store item
router.put('/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, icon, badgesRequired, stock } = req.body;
  const db = getDb();

  const item = db.get('SELECT * FROM store_items WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) { updates.push(`name = $${paramIndex++}`); params.push(name.trim()); }
  if (icon !== undefined) { updates.push(`icon = $${paramIndex++}`); params.push(icon); }
  if (badgesRequired !== undefined) { updates.push(`badges_required = $${paramIndex++}`); params.push(badgesRequired); }
  if (stock !== undefined) { updates.push(`stock = $${paramIndex++}`); params.push(stock); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);
  db.run(`UPDATE store_items SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
  saveDb();

  const updated = db.get('SELECT * FROM store_items WHERE id = $1', [id]);
  res.json(updated);
});

// Delete store item
router.delete('/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const item = db.get('SELECT * FROM store_items WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  db.run('DELETE FROM store_items WHERE id = $1', [id]);
  saveDb();
  res.json({ message: 'Item deleted' });
});

// Exchange item
router.post('/exchange', authenticateToken, (req, res) => {
  const { studentId, itemId } = req.body;

  if (!studentId || !itemId) {
    return res.status(400).json({ error: 'studentId and itemId required' });
  }

  const db = getDb();

  // Get student
  const student = db.get(
    'SELECT s.* FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.user_id = $2',
    [studentId, req.user.id]
  );
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  // Get item
  const item = db.get('SELECT * FROM store_items WHERE id = $1 AND user_id = $2', [itemId, req.user.id]);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Check badges
  if ((student.badges || 0) < item.badges_required) {
    return res.status(400).json({ error: 'Not enough badges' });
  }

  // Check stock (-1 means unlimited)
  if (item.stock !== -1 && item.stock <= 0) {
    return res.status(400).json({ error: 'Item out of stock' });
  }

  // Deduct badges
  const newBadges = student.badges - item.badges_required;
  db.run('UPDATE students SET badges = $1, updated_at = NOW() WHERE id = $2', [newBadges, studentId]);

  // Deduct stock
  if (item.stock !== -1) {
    db.run('UPDATE store_items SET stock = stock - 1 WHERE id = $1', [itemId]);
  }

  // Record exchange
  const exchangeId = generateId();
  db.run('INSERT INTO exchange_history (id, student_id, item_id) VALUES ($1, $2, $3)', [exchangeId, studentId, itemId]);

  saveDb();

  const updatedStudent = db.get('SELECT * FROM students WHERE id = $1', [studentId]);
  const updatedItem = db.get('SELECT * FROM store_items WHERE id = $1', [itemId]);

  res.json({
    student: updatedStudent,
    item: updatedItem,
    exchangeId,
  });
});

// Get exchange history
router.get('/history', authenticateToken, (req, res) => {
  const { classId } = req.query;
  const db = getDb();

  let sql = `
    SELECT eh.*, s.name as student_name, si.name as item_name, si.icon as item_icon
    FROM exchange_history eh
    JOIN students s ON eh.student_id = s.id
    JOIN store_items si ON eh.item_id = si.id
    JOIN classes c ON s.class_id = c.id
    WHERE c.user_id = $1
  `;
  const params = [req.user.id];

  if (classId) {
    sql += ` AND s.class_id = $${params.length + 1}`;
    params.push(classId);
  }

  sql += ' ORDER BY eh.created_at DESC LIMIT 100';

  const history = db.all(sql, params);
  res.json(history);
});

export default router;